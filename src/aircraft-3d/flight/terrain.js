/** Real AWS/Mapzen Terrarium DEM. Color is an illustrative elevation palette,
 * NOT satellite imagery. Data quality/resolution varies; not for navigation.
 * Caller must display TERRAIN_ATTRIBUTION and its full provider-credit link.
 */
export const TERRAIN_ATTRIBUTION = Object.freeze({
  label: 'Terrain: Mapzen / AWS Open Data · USGS, NOAA and regional providers',
  source: 'https://registry.opendata.aws/terrain-tiles/',
  credits: 'https://github.com/tilezen/joerd/blob/master/docs/attribution.md',
  format: 'https://github.com/tilezen/joerd/blob/master/docs/formats.md',
  modifications: 'Downsampled DEM mesh, spherical curvature, elevation/slope colors; negative DEM elevations shown as a sea-level surface. Airport runway corridors are visualization-corrected to supplied average elevations with a 500m minimum buffer and 100m blend; not surveyed airport terrain.'
});
export const IMAGERY_ATTRIBUTION = Object.freeze({
  label: 'NASA GIBS / ESDIS · Blue Marble shaded relief and bathymetry · static coarse composite (~500m)',
  source: 'https://nasa-gibs.github.io/gibs-api-docs/',
  capabilities: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml',
  layer: 'BlueMarble_ShadedRelief_Bathymetry', matrix: 'GoogleMapsCompatible_Level8',
  limitation: 'Historical static composite with baked relief, not live or airport-resolution satellite photography.'
});
const R = 6371008.8, DEG = Math.PI / 180, GRID = 32;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const modulo = (v, n) => ((v % n) + n) % n;
export const decodeTerrarium = (r, g, b) => r * 256 + g + b / 256 - 32768;
export function mercatorTile(lat, lon, zoom) {
  const n = 2 ** zoom, phi = clamp(lat, -85.05112878, 85.05112878) * DEG;
  return { x: modulo((lon + 180) / 360 * n, n), y: clamp((1 - Math.asinh(Math.tan(phi)) / Math.PI) / 2 * n, 0, n - 1e-9) };
}
export function tileCoordinates(x, y, zoom) {
  const n = 2 ** zoom;
  return { lon: x / n * 360 - 180, lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) / DEG };
}
export function terrainLocalPosition(lat, lon, height, originLat, originLon, altitude) {
  const p = lat * DEG, o = originLat * DEG, dl = (lon - originLon) * DEG;
  const radius = R + height;
  return { east: radius * Math.cos(p) * Math.sin(dl),
    south: radius * (Math.sin(o) * Math.cos(p) * Math.cos(dl) - Math.cos(o) * Math.sin(p)),
    up: radius * (Math.sin(o) * Math.sin(p) + Math.cos(o) * Math.cos(p) * Math.cos(dl)) - R - altitude };
}
/** Airport visualization correction, NOT measured terrain or a surveyed runway.
 * At high/remote LOD the minimum buffer also covers one DEM-cell diagonal, so
 * vertices of a triangle spanning the runway cannot lift the runway surface.
 */
export function runwayCorrection(height, distance, widthM, elevationM, cellDiagonalM = 0) {
  const inner = Math.max(500, widthM / 2 + 10, cellDiagonalM * 1.1);
  const outer = inner + Math.max(100, cellDiagonalM * .25);
  if (distance >= outer) return height;
  const w = clamp((distance - inner) / (outer - inner), 0, 1);
  return elevationM + (height - elevationM) * w * w * (3 - 2 * w);
}

export function createTerrain(THREE, scene, { onStatus = () => {}, imagery = true } = {}) {
  const group = new THREE.Group(); group.name = 'Actual_DEM_terrain'; scene.add(group);
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: THREE.FrontSide });
  const cache = new Map(), meshes = new Map(), failures = new Map(), controllers = new Map(), inflight = new Set();
  const imageCache = new Map(); let imageWanted = new Map();
  let wanted = new Map(), queue = [], active = 0, disposed = false, cell = '', lastStatus = '', frame = null, tick = 0, airportSurfaces = [], positioned = null;
  const key = (z, x, y) => `${z}/${modulo(x, 2 ** z)}/${y}`;
  const isWanted = k => wanted.has(k) || imageWanted.has(k);
  const isCached = k => cache.has(k) || imageCache.has(k);
  const emit = () => {
    if (disposed) return;
    const loaded = [...wanted.keys()].filter(k => cache.has(k)).length;
    const failed = [...wanted.keys()].filter(k => failures.has(k)).length;
    const imageLoaded = [...imageWanted.keys()].filter(k => imageCache.has(k)).length;
    const imageFailed = [...imageWanted.keys()].filter(k => failures.has(k)).length;
    const imageStatus = imagery ? `NASA Blue Marble 정적 약500m 영상 ${imageLoaded}/${imageWanted.size}${imageFailed ? ' · 영상 실패 구역은 고도 색상' : imageLoaded === imageWanted.size && imageWanted.size ? ' · 영상 수신 완료' : ' · 불러오는 중: 미수신 구역은 고도 색상'}` : '고도 색상(위성영상 아님)';
    const message = `실제 고도 DEM ${loaded}/${wanted.size} · ${failed ? `${failed}개 수신 실패(지형 표시 불가)` : loaded === wanted.size ? '수신 완료' : '불러오는 중'} · ${imageStatus}${airportSurfaces.length ? ' · 공항 주변은 제공된 평균 표고로 시각 보정(실측 아님)' : ''}`;
    if (message !== lastStatus) { lastStatus = message; onStatus(message); }
  };
  const touch = k => { const value = cache.get(k); if (value) { cache.delete(k); cache.set(k, value); } return value; };
  const evict = () => {
    for (const k of cache.keys()) { if (cache.size <= 32) break; if (!wanted.has(k)) cache.delete(k); }
    for (const k of failures.keys()) if (failures.size > 32 && !wanted.has(k)) failures.delete(k);
    for (const [k, texture] of imageCache) if (imageCache.size > 12 && !imageWanted.has(k)) {
      texture.dispose(); texture.image.close(); imageCache.delete(k);
    }
  };
  function sample(tile, u, v) {
    // A shared boundary is owned by the tile on its east/south side. Once that
    // neighbor arrives both meshes use exactly the same source sample.
    const east = u === GRID ? 1 : 0, south = v === GRID ? 1 : 0;
    const neighbor = cache.get(key(tile.z, tile.x + east, tile.y + south));
    const source = neighbor || cache.get(tile.key);
    const px = neighbor ? (east ? 0 : Math.round(u / GRID * 256)) : Math.min(255, Math.round(u / GRID * 256));
    const py = neighbor ? (south ? 0 : Math.round(v / GRID * 256)) : Math.min(255, Math.round(v / GRID * 256));
    return source.heights[clamp(py, 0, 255) * 256 + clamp(px, 0, 255)];
  }
  function refresh() {
    for (const [k, mesh] of meshes) if (!wanted.has(k)) { group.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); meshes.delete(k); }
    for (const [k, tile] of wanted) {
      if (!cache.has(k)) continue;
      let mesh = meshes.get(k);
      if (!mesh) {
        const geometry = new THREE.BufferGeometry(), index = [];
        for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
          const a = y * (GRID + 1) + x, b = a + GRID + 1;
          index.push(a, b, a + 1, a + 1, b, b + 1);
        }
        geometry.setIndex(index);
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array((GRID + 1) ** 2 * 3), 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array((GRID + 1) ** 2 * 3), 3));
        const uv = new Float32Array((GRID + 1) ** 2 * 2), factor = 2 ** (tile.z - 8);
        for (let y = 0; y <= GRID; y++) for (let x = 0; x <= GRID; x++) {
          const i = (y * (GRID + 1) + x) * 2;
          uv[i] = (modulo(tile.x, factor) + x / GRID) / factor;
          uv[i + 1] = (modulo(tile.y, factor) + y / GRID) / factor;
        }
        geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        mesh = new THREE.Mesh(geometry, material.clone()); mesh.name = `DEM_${k}`;
        if (tile.far) {
          const rectangles = Array.from({ length: 9 }, () => new THREE.Vector4());
          mesh.userData.nearMask = { rectangles, count: { value: 0 } };
          mesh.material.defines = { USE_UV: '' };
          mesh.material.onBeforeCompile = shader => {
            shader.uniforms.nearRectangles = { value: rectangles };
            shader.uniforms.nearRectangleCount = mesh.userData.nearMask.count;
            shader.vertexShader = 'varying vec2 terrainTileUV;\n' + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nterrainTileUV = uv;');
            shader.fragmentShader = 'varying vec2 terrainTileUV;\nuniform vec4 nearRectangles[9];\nuniform int nearRectangleCount;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
              for (int i = 0; i < 9; i++) {
                if (i >= nearRectangleCount) break;
                vec4 r = nearRectangles[i];
                if (terrainTileUV.x >= r.x && terrainTileUV.y >= r.y && terrainTileUV.x <= r.z && terrainTileUV.y <= r.w) discard;
              }`);
          };
          mesh.material.customProgramCacheKey = () => 'DEM-far-near-mask-v1';
        }
        mesh.frustumCulled = false; mesh.userData.tile = tile;
        mesh.userData.samples = []; meshes.set(k, mesh); group.add(mesh);
      }
      if (tile.far) {
        const mask = mesh.userData.nearMask; let count = 0;
        for (const near of wanted.values()) {
          if (near.far || !cache.has(near.key)) continue;
          const scale = 2 ** (near.z - tile.z);
          if (Math.floor(near.x / scale) !== tile.x || Math.floor(near.y / scale) !== tile.y) continue;
          mask.rectangles[count++].set(modulo(near.x, scale) / scale, modulo(near.y, scale) / scale,
            (modulo(near.x, scale) + 1) / scale, (modulo(near.y, scale) + 1) / scale);
        }
        mask.count.value = count;
      }
      const factor = 2 ** (tile.z - 8);
      const image = imageCache.get(`image/8/${Math.floor(tile.x / factor)}/${Math.floor(tile.y / factor)}`);
      if (mesh.material.map !== (image || null)) {
        mesh.material.map = image || null; mesh.material.vertexColors = !image; mesh.material.needsUpdate = true;
      }
      const samples = [], colors = mesh.geometry.attributes.color.array;
      for (let y = 0; y <= GRID; y++) for (let x = 0; x <= GRID; x++) {
        const h = sample(tile, x, y), geo = tileCoordinates(tile.x + x / GRID, tile.y + y / GRID, tile.z);
        let height = Math.max(0, h);
        for (const runway of airportSurfaces) {
          const q = terrainLocalPosition(geo.lat, geo.lon, 0, runway.a.lat, runway.a.lon, 0);
          const t = clamp((q.east * runway.dx + q.south * runway.dy) / runway.lengthSquared, 0, 1);
          const distance = Math.hypot(q.east - t * runway.dx, q.south - t * runway.dy);
          const cellDiagonal = Math.SQRT2 * 2 * Math.PI * R * Math.cos(geo.lat * DEG) / (2 ** tile.z * GRID);
          height = runwayCorrection(height, distance, runway.widthM, runway.elevationM, cellDiagonal);
        }
        samples.push({ ...geo, height });
        const k3 = (y * (GRID + 1) + x) * 3;
        const slope = Math.min(1, Math.abs(h - sample(tile, Math.max(0, x - 1), y)) / 180);
        let rgb = h < 0 ? [.035, .18, .28] : h < 120 ? [.22, .36, .19]
          : h < 1000 ? [.26, .38, .22] : h < 2500 ? [.42, .40, .30] : h < 4200 ? [.55, .54, .48] : [.79, .81, .80];
        for (let c = 0; c < 3; c++) colors[k3 + c] = rgb[c] * (1 - slope * .18);
      }
      mesh.userData.samples = samples; mesh.geometry.attributes.color.needsUpdate = true;
    }
    if (frame) position(frame, true);
  }
  function position({ lat, lon, heading, altitude }, force = false) {
    group.rotation.y = heading * DEG - Math.PI / 2;
    if (!force && positioned && positioned.lat === lat && positioned.lon === lon && positioned.altitude === altitude) return;
    positioned = { lat, lon, altitude };
    for (const mesh of meshes.values()) {
      const positions = mesh.geometry.attributes.position.array;
      mesh.userData.samples.forEach((p, i) => {
        const q = terrainLocalPosition(p.lat, p.lon, p.height, lat, lon, altitude);
        positions[i * 3] = q.east; positions[i * 3 + 1] = q.up; positions[i * 3 + 2] = q.south;
      });
      mesh.geometry.attributes.position.needsUpdate = true; mesh.geometry.computeVertexNormals();
    }
  }
  async function fetchTile(tile) {
    let error;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (disposed || !wanted.has(tile.key)) return;
      const controller = new AbortController(); controllers.set(tile.key, controller);
      const timer = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${tile.key}.png`, { mode: 'cors', credentials: 'omit', signal: controller.signal, cache: 'force-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
        try {
          if (bitmap.width !== 256 || bitmap.height !== 256) throw new Error('Unexpected DEM tile dimensions');
          const canvas = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(256, 256) : document.createElement('canvas');
          canvas.width = canvas.height = 256;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          context.drawImage(bitmap, 0, 0);
          const rgba = context.getImageData(0, 0, 256, 256).data, heights = new Float32Array(256 * 256);
          for (let i = 0; i < heights.length; i++) heights[i] = decodeTerrarium(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]);
          if (!disposed) { cache.set(tile.key, { heights }); failures.delete(tile.key); evict(); refresh(); }
          return;
        } finally { bitmap.close(); }
      } catch (e) { error = e; }
      finally { clearTimeout(timer); controllers.delete(tile.key); }
      if (!disposed && wanted.has(tile.key) && attempt === 0) await new Promise(resolve => setTimeout(resolve, 1500));
    }
    if (!disposed && wanted.has(tile.key)) failures.set(tile.key, { retryAt: Date.now() + 60000, message: String(error) });
  }
  async function fetchImagery(tile) {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (disposed || !imageWanted.has(tile.key)) return;
      const controller = new AbortController(); controllers.set(tile.key, controller);
      const timer = setTimeout(() => controller.abort(), 12000);
      try {
        const url = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/8/${tile.y}/${tile.x}.jpeg`;
        const response = await fetch(url, { mode: 'cors', credentials: 'omit', signal: controller.signal, cache: 'force-cache' });
        if (!response.ok) throw new Error(`NASA HTTP ${response.status}`);
        const bitmap = await createImageBitmap(await response.blob());
        if (disposed || !imageWanted.has(tile.key)) { bitmap.close(); return; }
        const texture = new THREE.Texture(bitmap); texture.flipY = false;
        texture.colorSpace = THREE.SRGBColorSpace; texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter; texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true; imageCache.set(tile.key, texture); failures.delete(tile.key);
        evict(); refresh(); return;
      } catch (_) {
        if (attempt === 1 && !disposed && imageWanted.has(tile.key)) failures.set(tile.key, { retryAt: Date.now() + 60000 });
      } finally { clearTimeout(timer); controllers.delete(tile.key); }
      if (!disposed && imageWanted.has(tile.key) && attempt === 0) await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  function pump() {
    if (disposed) return;
    while (active < 3 && queue.length) {
      const tile = queue.shift();
      if (!isWanted(tile.key) || isCached(tile.key)) continue;
      if (inflight.has(tile.key)) continue;
      active++; inflight.add(tile.key);
      (tile.kind === 'image' ? fetchImagery(tile) : fetchTile(tile)).finally(() => { active--; inflight.delete(tile.key); emit(); pump(); });
    }
  }
  function requestMissing() {
    const queued = new Set(queue.map(t => t.key));
    for (const [k, t] of [...wanted, ...imageWanted]) if (!isCached(k) && !inflight.has(k) && !queued.has(k)
      && (!failures.has(k) || failures.get(k).retryAt <= Date.now())) queue.push(t);
    pump(); emit();
  }
  return {
    getStats() { return { demCache: cache.size, imageCache: imageCache.size, meshes: meshes.size,
      wanted: wanted.size, activeRequests: active, queuedRequests: queue.length, maxConcurrentRequests: 3 }; },
    /** Buffered airfield corridor; supplied elevation may be airport-average
     * fallback rather than surveyed threshold levels. Caller labels its source.
     * 500m minimum correction radius +100m blend prevents coarse-grid burial.
     */
    setAirportSurfaces(surfaces) {
      airportSurfaces = (Array.isArray(surfaces) ? surfaces : []).filter(s => s?.a && s?.b
        && [s.a.lat, s.a.lon, s.b.lat, s.b.lon, s.widthM, s.elevationM].every(Number.isFinite)
        && s.widthM > 0 && s.widthM <= 200).map(s => {
        const q = terrainLocalPosition(s.b.lat, s.b.lon, 0, s.a.lat, s.a.lon, 0);
        return { ...s, dx: q.east, dy: q.south, lengthSquared: q.east ** 2 + q.south ** 2 };
      }).filter(s => s.lengthSquared > 1);
      if (!disposed) { refresh(); emit(); }
    },
    update(next) {
      if (disposed) return;
      if (![next.lat, next.lon, next.heading, next.altitude].every(Number.isFinite)) return;
      frame = { ...next };
      if (Math.abs(next.lat) > 85.05112878) {
        group.visible = false;
        const message = '실제 고도 자료 범위 밖: 극지방 Web Mercator 한계';
        if (lastStatus !== message) { lastStatus = message; onStatus(message); }
        return;
      }
      group.visible = true;
      let z = next.altitude < 250 ? 12 : next.altitude < 1800 ? 11 : next.altitude < 5500 ? 10 : 9;
      // Keep airport DEM cells small even at a high-elevation airport: MSL alone
      // cannot determine whether the camera is close to the runway surface.
      for (const runway of airportSurfaces) {
        if (next.altitude - runway.elevationM > 1800) continue;
        const q = terrainLocalPosition(next.lat, next.lon, 0, runway.a.lat, runway.a.lon, 0);
        const t = clamp((q.east * runway.dx + q.south * runway.dy) / runway.lengthSquared, 0, 1);
        if (Math.hypot(q.east - t * runway.dx, q.south - t * runway.dy) < 6000) { z = 12; break; }
      }
      const p = mercatorTile(next.lat, next.lon, z), cx = Math.floor(p.x), cy = Math.floor(p.y);
      const horizonRadius = next.altitude >= 5500 ? 2 : 1;
      const nextCell = `${z}/${cx}/${cy}/${horizonRadius}`;
      if (nextCell !== cell) {
        cell = nextCell; wanted = new Map();
        // Center first; only a 3x3 neighborhood is requested.
        const offsets = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];
        for (const [dx, dy] of offsets) {
          const x = modulo(cx + dx, 2 ** z), y = cy + dy;
          if (y < 0 || y >= 2 ** z) continue;
          const k = key(z, x, y); wanted.set(k, { z, x, y, key: k }); touch(k);
        }
        // A second, actual DEM neighborhood covers the horizon. It remains
        // visible below pending near tiles; shader masks remove only regions
        // whose detailed DEM has arrived, avoiding double-surface z fighting.
        const farZoom = 8, farPoint = mercatorTile(next.lat, next.lon, farZoom);
        const farOffsets = [];
        for(let dy=-horizonRadius;dy<=horizonRadius;dy++)for(let dx=-horizonRadius;dx<=horizonRadius;dx++)farOffsets.push([dx,dy]);
        farOffsets.sort((a,b)=>Math.hypot(...a)-Math.hypot(...b));
        for (const [dx, dy] of farOffsets) {
          const x = modulo(Math.floor(farPoint.x) + dx, 2 ** farZoom), y = Math.floor(farPoint.y) + dy;
          if (y < 0 || y >= 2 ** farZoom) continue;
          const k = key(farZoom, x, y); wanted.set(k, { z: farZoom, x, y, key: k, far: true }); touch(k);
        }
        imageWanted = new Map();
        if (imagery) for (const tile of wanted.values()) {
          const factor = 2 ** (tile.z - 8), x = Math.floor(tile.x / factor), y = Math.floor(tile.y / factor), k = `image/8/${x}/${y}`;
          imageWanted.set(k, { key: k, kind: 'image', x, y });
          if (imageCache.has(k)) { const value = imageCache.get(k); imageCache.delete(k); imageCache.set(k, value); }
        }
        queue = queue.filter(t => isWanted(t.key));
        for (const [k, controller] of controllers) if (!isWanted(k)) controller.abort();
        refresh(); evict(); requestMissing();
      }
      position(frame);
      if (Date.now() - tick > 1000) { tick = Date.now(); requestMissing(); }
    },
    dispose() {
      disposed = true; queue = []; controllers.forEach(c => c.abort()); controllers.clear();
      meshes.forEach(m => { m.geometry.dispose(); m.material.dispose(); }); meshes.clear(); cache.clear(); failures.clear();
      imageCache.forEach(texture => { texture.dispose(); texture.image.close(); }); imageCache.clear();
      scene.remove(group); material.dispose();
    }
  };
}
