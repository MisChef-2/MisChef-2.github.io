  /* 항공기 경로: 출발지와 도착지 공항 좌표를 찾아 대권 위의 점들로 만들고, 지금 위치에서 둘로 나눈다.
     예시 항공편은 저장된 경유 경로(demoPath)를 그대로 쓴다. 좌표를 모르는 공항이면 경로를 그리지 않는다. */
  const routeCache = {};
  function apCoord(code) { if (!code) return null; if (AP[code]) return AP[code]; const a = typeof aptBy !== "undefined" && aptBy[code]; return a ? [a.lat, a.lon] : null; }
  function acRoute(a) {
    let pts = null;
    if (a.demo || /^ex\d+$/.test(a.hex)) {
      const d = DEMO[+String(a.hex).slice(2) - 1]; if (!d || d[2] === d[3]) return null;
      const key = "d" + a.hex; if (!routeCache[key]) { const P = demoPath(d); const L = []; for (let i = 0; i <= 96; i++) L.push(pathPoint(P, i / 96).pt); routeCache[key] = L; } pts = routeCache[key];
    } else if (a.route && a.route.from_iata && a.route.to_iata) {
      const A = apCoord(a.route.from_iata), B = apCoord(a.route.to_iata); if (!A || !B) return null;
      const key = a.route.from_iata + ">" + a.route.to_iata; if (!routeCache[key]) { const L = []; for (let i = 0; i <= 96; i++) L.push(gcPoint(A, B, i / 96).pt); routeCache[key] = L; } pts = routeCache[key];
    }
    if (!pts) return null;
    // 지금 위치에 가장 가까운 점에서 나눈다
    let bi = 0, bd = Infinity; pts.forEach((p, i) => { const d = (p[0] - a.lat) * (p[0] - a.lat) + (p[1] - a.lon) * (p[1] - a.lon) * Math.cos(a.lat * Math.PI / 180) ** 2; if (d < bd) { bd = d; bi = i; } });
    const here = [a.lat, a.lon];
    return { done: pts.slice(0, bi + 1).concat([here]), left: [here].concat(pts.slice(bi + 1)), from: pts[0], to: pts[pts.length - 1], n: pts.length - 1, bi: bi };
  }
  // 어떤 기체의 경로를 그릴지: 기종 추적에서는 모두, 공역에서는 고른 기체만
  const routeWanted = a => LV.scope === "type" || LV.sel === a.hex;
  /* 열지도: 칸마다 부드러운 점을 겹쳐 찍어 밀도를 쌓고, 쌓인 정도를 색 띠(투명, 청록, 초록, 노랑, 주황, 빨강)로 바꾼다 */
  const HEAT_PAL = (() => { const c = document.createElement("canvas"); c.width = 256; c.height = 1; const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(0.12, "rgba(20,184,166,.45)"); gr.addColorStop(0.32, "rgba(34,197,94,.7)"); gr.addColorStop(0.55, "rgba(250,204,21,.82)"); gr.addColorStop(0.78, "rgba(249,115,22,.9)"); gr.addColorStop(1, "rgba(239,68,68,.95)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 1); return g.getImageData(0, 0, 256, 1).data; })();
  function heatCanvas(pts, W, H) {
    const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(W)); c.height = Math.max(1, Math.round(H)); const g = c.getContext("2d");
    pts.forEach(p => { const gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], p[3]); gr.addColorStop(0, `rgba(0,0,0,${Math.min(1, p[2]).toFixed(3)})`); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.beginPath(); g.arc(p[0], p[1], p[3], 0, 7); g.fill(); });
    const im = g.getImageData(0, 0, c.width, c.height), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const a = d[i + 3]; if (!a) continue; const j = a * 4; d[i] = HEAT_PAL[j]; d[i + 1] = HEAT_PAL[j + 1]; d[i + 2] = HEAT_PAL[j + 2]; d[i + 3] = HEAT_PAL[j + 3]; }
    g.putImageData(im, 0, 0); return c;
  }
  // 칸 자료 → [x, y, 세기(0~1), 반지름]. 세기는 로그로 눌러 한두 칸이 전체를 덮지 않게 한다
  function heatPts(cv, proj, cellPx) { const mx = Math.max(1, ...cv.d.cells.map(c => c[2])), L = Math.log(1 + mx), out = []; cv.d.cells.forEach(c => { const q = proj(c[0] / 100, c[1] / 100); if (q) out.push([q.x, q.y, 0.05 + 0.3 * Math.pow(Math.log(1 + c[2]) / L, 1.6), Math.max(6, cellPx * 1.3)]); }); return out; }
  /* ================= 실시간 운항 움직임 =================
     위치 자료는 몇 초마다 한 번 온다. 그 사이에는 각 기체를 지금 방향과 지상 속도로 계속 움직이고(추측 항법),
     새 위치가 오면 1초 남짓 동안 부드럽게 옮겨 간다. 지나온 자리는 짧은 꼬리로 남긴다.
     마우스를 누르고 있는 동안에는 갱신을 멈춰 기체 클릭이 빗나가지 않게 한다. */
  const MOTION = { raf: 0, pos: {}, hist: {}, last: 0, hold: false, touched: false, spinT: 0 };
  function acTick(now) {
    LV.ac.forEach(a => {
      if (a._t0 == null) { a._t0 = now; a._la = a.lat; a._lo = a.lon; const prev = MOTION.pos[a.hex]; if (prev && Math.abs(prev.lat - a.lat) + Math.abs(prev.lon - a.lon) < 3) a._bf = prev; }
      const dt = Math.min(90, (now - a._t0) / 1000); let lat = a._la, lon = a._lo;
      if (typeof a.gs === "number" && a.gs > 40 && a.alt_baro !== "ground") { const g = destPt(a._la, a._lo, a.track || 0, a.gs * 1.852 * dt / 3600); lat = g[0]; lon = g[1]; }
      if (a._bf) { const k = Math.min(1, (now - a._t0) / 1200), e = 1 - Math.pow(1 - k, 3); let dl = lon - a._bf.lon; if (dl > 180) dl -= 360; if (dl < -180) dl += 360; lat = a._bf.lat + (lat - a._bf.lat) * e; lon = a._bf.lon + dl * e; if (k >= 1) delete a._bf; }
      a.lat = lat; a.lon = lon; MOTION.pos[a.hex] = { lat: lat, lon: lon };
      const h = MOTION.hist[a.hex] || (MOTION.hist[a.hex] = []); if (!h.length || now - h[h.length - 1].t > 350) { h.push({ lat: lat, lon: lon, t: now }); if (h.length > 28) h.shift(); }
    });
  }
  // 꼬리: 지나온 자리, 오래된 쪽일수록 옅게
  const tailOf = a => { const h = MOTION.hist[a.hex]; return h && h.length > 1 ? h.map(q => [q.lat, q.lon]).concat([[a.lat, a.lon]]) : null; };
  function motionLoop(now) {
    MOTION.raf = 0;
    if ((location.hash || "").slice(1) !== "live" || !document.getElementById("live-ov")) return;
    const showAc = LV.scope !== "area" || LV.tab === "aircraft" || LV.sel;
    if (!fxCalm() && !MOTION.hold && now - MOTION.last > (LV3.on ? 33 : 50)) {
      MOTION.last = now;
      if (showAc) { acTick(now); if (LV3.on) lv3dDirty(); else queueDraw(); }
      // 3D 기종 추적: 손대기 전까지 지구본이 천천히 돈다
      if (LV3.on && LV.scope === "type" && !LV.sel && !MOTION.touched) { LV3.rot = [LV3.rot[0] + 0.12, LV3.rot[1], 0]; lv3dDirty(); }
    }
    MOTION.raf = requestAnimationFrame(motionLoop);
  }
  function motionStart() { if (!MOTION.raf) MOTION.raf = requestAnimationFrame(motionLoop); }
  document.addEventListener("pointerdown", e => { if (e.target.closest && e.target.closest("#livecard .livewrap")) MOTION.hold = true; });
  document.addEventListener("pointerup", () => { setTimeout(() => { MOTION.hold = false; }, 60); });
  /* ================= 실시간 운항: 3D 지구본 보기 =================
     2D 지도와 같은 자리에 캔버스를 겹쳐 놓고, 버튼으로 바꿔 본다. d3-geo 정사영 지구본에
     교통 열지도(빛 점)와 항공기를 그린다. 항공기는 고도만큼 지표에서 띄우고 땅까지 가는 가는 선을 그어 입체감을 준다.
     끌어서 돌리고, Ctrl(⌘)+휠이나 +/- 버튼으로 확대한다. 기체를 누르면 2D와 똑같이 선택된다. */
  const LV3 = { on: false, rot: [0, 0, 0], k: 1, W: 0, H: 0, R: 1, dpr: 1, raf: 0, dirty: true, cv: null, ctx: null, ro: null, hover: null, hits: [], world: null, focusKey: "", loc: { lat: 37.46, lon: 126.44, z: 1, hd: 0 } };
  LV3.on = true; try { LV3.on = localStorage.getItem("hub-live3d") !== "0"; } catch (e) { /* 저장소 없음 */ }
  function lv3dDirty() { LV3.dirty = true; if (LV3.on && LV3.cv && !LV3.raf) LV3.raf = requestAnimationFrame(lv3dDraw); }
  function lv3dWorld() {
    if (LV3.world || typeof topojson === "undefined" || typeof WORLD_TOPO === "undefined") return LV3.world;
    LV3.world = { land: topojson.feature(WORLD_TOPO, WORLD_TOPO.objects.countries), borders: topojson.mesh(WORLD_TOPO, WORLD_TOPO.objects.countries, (a, b) => a !== b), grat: d3.geoGraticule10 ? d3.geoGraticule10() : null };
    return LV3.world;
  }
  function lv3dInit(h) {
    if (h !== "live") { lv3dStop(); return; }
    const wrap = document.querySelector("#livecard .livewrap"); if (!wrap || wrap.querySelector(".lv-view")) return;
    if (typeof d3 === "undefined" || !d3.geoOrthographic || typeof topojson === "undefined" || typeof WORLD_TOPO === "undefined") return;
    wrap.insertAdjacentHTML("beforeend", `<div class="lv-view" role="group" aria-label="지도 보기"><button type="button" data-lv3="2d">2D 지도</button><button type="button" data-lv3="3d">3D 지구본</button></div><div class="lv-acleg" aria-label="항공기 색"><span><i style="background:var(--boeing)"></i>보잉</span><span><i style="background:var(--airbus)"></i>에어버스</span><span><i style="background:#fcd34d"></i>그 밖의 기종</span><span><i style="background:#fde047;box-shadow:0 0 0 2px rgba(253,224,71,.4)"></i>고른 기체</span></div><canvas class="lv3d" id="lv3d" role="img" aria-label="실시간 항공기 3D 지구본" hidden></canvas><div class="lv3d-zoom" hidden><button type="button" data-lv3="in" aria-label="확대">+</button><button type="button" data-lv3="out" aria-label="축소">−</button><button type="button" data-lv3="home" aria-label="지점으로 돌아가기">⌖</button></div>`);
    LV3.cv = wrap.querySelector("#lv3d"); LV3.ctx = LV3.cv.getContext("2d"); LV3.focusKey = "";
    LV3.ro = "ResizeObserver" in window ? new ResizeObserver(() => { lv3dSize(); lv3dDirty(); }) : null; if (LV3.ro) LV3.ro.observe(LV3.cv);
    lv3dWire(); lv3dMode(LV3.on); motionStart();
  }
  function lv3dStop() { if (LV3.raf) cancelAnimationFrame(LV3.raf); LV3.raf = 0; if (LV3.ro) LV3.ro.disconnect(); LV3.ro = null; LV3.cv = null; LV3.ctx = null; }
  function lv3dMode(on) {
    LV3.on = on; try { localStorage.setItem("hub-live3d", on ? "1" : "0"); } catch (e) { /* 무시 */ }
    const wrap = document.querySelector("#livecard .livewrap"); if (!wrap) return;
    wrap.classList.toggle("is-3d", on);
    wrap.querySelectorAll(".lv-view button").forEach(b => { const v = b.getAttribute("data-lv3") === (on ? "3d" : "2d"); b.classList.toggle("on", v); b.setAttribute("aria-pressed", v); });
    if (LV3.cv) LV3.cv.hidden = !on; const z = wrap.querySelector(".lv3d-zoom"); if (z) z.hidden = !on;
    if (on) { lv3dSize(); lv3dFocus(false); LV3.focusKey = LV.scope + "|" + LV.place + "|" + (LV.sel || ""); lv3dDirty(); }
    else if (typeof focusLive === "function") { setTimeout(() => { try { focusLive(false); } catch (e) { /* 무시 */ } queueDraw(); }, 30); }
  }
  function lv3dSize() {
    const cv = LV3.cv; if (!cv) return; const r = cv.getBoundingClientRect(); if (!r.width || !r.height) return;
    LV3.W = r.width; LV3.H = r.height; LV3.dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(LV3.W * LV3.dpr); cv.height = Math.round(LV3.H * LV3.dpr); LV3.R = Math.min(LV3.W, LV3.H) * 0.44;
  }
  // 지금 보는 지점(또는 고른 기체)으로 돌린다. 지점을 화면 아래쪽에 두어 지구의 둥근 면과 하늘이 함께 보이게 한다
  function lv3dFocus(animate) {
    const sel = LV.sel ? LV.ac.find(a => a.hex === LV.sel) : null, pl = placeById[LV.place];
    let lat, lon, k;
    // 비행 지도처럼 지구가 둥글게 보이는 배율에서 시작한다. 공역은 조금 당겨 보고, 기체를 고르면 더 당긴다
    if (sel) { lat = sel.lat; lon = sel.lon; k = 3.2; }
    else if (LV.scope === "all") { lat = 32; lon = 127; k = 2.6; }
    else if (LV.scope === "type") { lat = 30; lon = pl ? pl.lon : 127; k = 1; }
    else { lat = pl.lat; lon = pl.lon; k = LV.tab === "aircraft" ? 1.8 : 1.15; }
    const to = [-lon, -lat * 0.75, 0];
    if (!animate || fxCalm()) { LV3.rot = to; LV3.k = k; lv3dDirty(); return; }
    const from = LV3.rot.slice(), k0 = LV3.k, t0 = performance.now(), d = 650;
    let dl = to[0] - from[0]; while (dl > 180) dl -= 360; while (dl < -180) dl += 360;
    if (LV3.fly) cancelAnimationFrame(LV3.fly);
    const step = now => { const t = Math.min(1, (now - t0) / d), e = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; LV3.rot = [from[0] + dl * e, from[1] + (to[1] - from[1]) * e, 0]; LV3.k = k0 + (k - k0) * e; LV3.kt = LV3.k; lv3dDirty(); LV3.fly = t < 1 ? requestAnimationFrame(step) : 0; };
    LV3.fly = requestAnimationFrame(step);
  }
  /* 빈 곳을 두 번 누르면 그 지점을 가운데로 돌리며 두 배 당긴다 */
  function lv3dClickFly(e) {
    if (!LV3.proj || !LV3.cv) return; const r = LV3.cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if ((x - LV3.cx) * (x - LV3.cx) + (y - LV3.cy) * (y - LV3.cy) > LV3.Rpx * LV3.Rpx) return; // 지구 밖은 무시
    const ll = LV3.proj.invert([x, y]); if (!ll || isNaN(ll[0])) return;
    lv3dFlyTo(ll[1], ll[0], Math.min(80, LV3.k * 2));
  }
  const lv3dIsOn = () => !!(LV3.on && LV3.cv && LV3.cv.offsetParent);
  // 반경 km 원이 화면 짧은 쪽의 86%가 되는 배율. 지구 반지름 6371 km, 지금 화면의 지구 반지름 = LV3.R (배율 LV3.k일 때)
  function lv3dKFor(km) { const base = LV3.R || 200, need = Math.min(LV3.W || 600, LV3.H || 400) * 0.43 / (km / 6371); return Math.max(1, Math.min(80, need / base)); }
  function lv3dFlyTo(lat, lon, k) {
    MOTION.touched = true; const to = [-lon, -lat, 0];
    if (fxCalm()) { LV3.rot = to; LV3.k = k; lv3dDirty(); return; }
    if (LV3.fly) cancelAnimationFrame(LV3.fly);
    const from = LV3.rot.slice(), k0 = LV3.k, t0 = performance.now(), d = 950;
    let dl = to[0] - from[0]; while (dl > 180) dl -= 360; while (dl < -180) dl += 360;
    const step = now => { const t = Math.min(1, (now - t0) / d), e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      LV3.rot = [from[0] + dl * e, from[1] + (to[1] - from[1]) * e, 0]; LV3.k = k0 * Math.pow(k / k0, e); LV3.kt = LV3.k; lv3dDirty();
      LV3.fly = t < 1 ? requestAnimationFrame(step) : 0; };
    LV3.fly = requestAnimationFrame(step);
  }
  function lv3dDraw() {
    if (!LV3.cB) { const cs = getComputedStyle(document.documentElement); LV3.cB = cs.getPropertyValue("--boeing").trim() || "#4690e8"; LV3.cA = cs.getPropertyValue("--airbus").trim() || "#e2602c"; }
    LV3.raf = 0; if (!LV3.on || !LV3.cv || !LV3.dirty) return; LV3.dirty = false;
    if (!LV3.W || !LV3.H) { lv3dSize(); if (!LV3.W) return; }
    const c = LV3.ctx, w = lv3dWorld(); if (!w) return;
    // 지점이나 선택이 바뀌면 그쪽으로 돌린다
    const key = LV.scope + "|" + LV.place + "|" + (LV.sel || "");
    if (key !== LV3.focusKey) { LV3.focusKey = key; lv3dFocus(true); return; }
    const cx = LV3.W / 2, cy = LV3.H / 2, R = LV3.R * LV3.k, toR = Math.PI / 180, mono = getComputedStyle(document.body).getPropertyValue("--mono") || "monospace";
    const proj = d3.geoOrthographic().translate([cx, cy]).scale(R).rotate(LV3.rot).clipAngle(90).precision(0.4), path = d3.geoPath(proj, c), rotFn = d3.geoRotation(LV3.rot);
    LV3.proj = proj; LV3.cx = cx; LV3.cy = cy; LV3.Rpx = R;
    c.setTransform(LV3.dpr, 0, 0, LV3.dpr, 0, 0); c.clearRect(0, 0, LV3.W, LV3.H);
    // 별: 한 번 만든 자리에 고정
    if (!LV3.stars) LV3.stars = Array.from({ length: 140 }, () => [Math.random(), Math.random(), Math.random() * 1.1 + 0.2, Math.random() * 0.6 + 0.2]);
    LV3.stars.forEach(t => { c.fillStyle = `rgba(220,232,255,${t[3]})`; c.fillRect(t[0] * LV3.W, t[1] * LV3.H, t[2], t[2]); });
    // 대기 빛과 바다
    let g = c.createRadialGradient(cx, cy, R * 0.97, cx, cy, R * 1.17); g.addColorStop(0, "rgba(96,165,250,.34)"); g.addColorStop(1, "rgba(96,165,250,0)");
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R * 1.17, 0, 7); c.fill();
    g = c.createRadialGradient(cx - R * .35, cy - R * .4, R * .08, cx, cy, R); g.addColorStop(0, "#23406a"); g.addColorStop(1, "#0c182b");
    c.fillStyle = g; c.beginPath(); path({ type: "Sphere" }); c.fill();
    if (w.grat) { c.beginPath(); path(w.grat); c.strokeStyle = "rgba(148,163,184,.12)"; c.lineWidth = 1; c.stroke(); }
    c.beginPath(); path(w.land); c.fillStyle = "#31445c"; c.fill();
    c.beginPath(); path(w.borders); c.strokeStyle = "rgba(170,184,202,.3)"; c.lineWidth = .6; c.stroke();
    // 밤인 쪽: 지금 시각의 해 위치로 낮밤 경계를 그린다
    { const now = new Date(), y0 = Date.UTC(now.getUTCFullYear(), 0, 0), day = (now - y0) / 864e5, decl = -23.44 * Math.cos(2 * Math.PI / 365 * (day + 10)), sunLon = (12 - (now.getUTCHours() + now.getUTCMinutes() / 60)) * 15;
      c.beginPath(); path(d3.geoCircle().center([sunLon + 180, -decl]).radius(90)()); c.fillStyle = "rgba(2,6,22,.42)"; c.fill(); }
    g = c.createRadialGradient(cx, cy, R * 0.55, cx, cy, R); g.addColorStop(0, "rgba(2,6,14,0)"); g.addColorStop(1, "rgba(2,6,14,.5)"); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill();
    // 지구 좌표 → 화면. alt(반지름 비율)만큼 띄운다
    const p3 = (lon, lat, alt) => { const q = rotFn([lon, lat]), l = q[0] * toR, p = q[1] * toR, co = Math.cos(p), x = co * Math.sin(l), y = Math.sin(p), z = co * Math.cos(l), m = 1 + alt; return { x: cx + R * m * x, y: cy - R * m * y, z: z, vis: z > 0 || (x * x + y * y) * m * m > 1.0004 }; };
    // 공항 이름: 가까이 당겼을 때만
    LV3.apHits = [];
    // 공항 점은 늘 그리고(눌러서 날아갈 수 있게), 이름은 가까이 당겼을 때만. 마우스를 올린 공항은 파랗게
    c.font = "600 10.5px " + mono; AP && Object.keys(AP).forEach(code => { const q = p3(AP[code][1], AP[code][0], 0); if (q.z < 0.25 || q.x < 0 || q.x > LV3.W || q.y < 0 || q.y > LV3.H) return; LV3.apHits.push([q.x, q.y, code]); const hov = LV3.apHover === code;
      c.fillStyle = hov ? "#5cc6f2" : "rgba(203,220,240,.85)"; c.beginPath(); c.arc(q.x, q.y, hov ? 3.5 : 2.2, 0, 7); c.fill();
      if (LV3.k > 1.7 || hov) { c.lineWidth = 3; c.strokeStyle = "rgba(6,12,24,.85)"; c.strokeText(code, q.x + 5, q.y + 3.5); c.fillText(code, q.x + 5, q.y + 3.5); } });
    const pl = placeById[LV.place];
    LV3.here = null;
    if (LV.scope === "area" && pl) {
      { const hq = p3(pl.lon, pl.lat, 0); if (hq.z > 0) LV3.here = [hq.x, hq.y, pl.code]; }
      const cv = coverOf(pl.id);
      // 교통 열지도: 빛 점을 겹쳐 찍는다
      if (cv && LV.tab === "traffic" && !LV.sel) {
        if (LV.heatMode === "cells") { const bins = cellBins(cv), hh = cv.d.deg / 2; LV3.cellHits = [];
          cv.d.cells.forEach(cc => { const la = cc[0] / 100, lo = cc[1] / 100, q1 = p3(lo - hh, la + hh, 0), q2 = p3(lo + hh, la + hh, 0), q3 = p3(lo + hh, la - hh, 0), q4 = p3(lo - hh, la - hh, 0); if (q1.z <= 0 || q3.z <= 0) return;
            c.fillStyle = HCOL[binOf(bins, cc[2])]; c.globalAlpha = 0.82; c.beginPath(); c.moveTo(q1.x, q1.y); c.lineTo(q2.x, q2.y); c.lineTo(q3.x, q3.y); c.lineTo(q4.x, q4.y); c.closePath(); c.fill(); c.globalAlpha = 1;
            LV3.cellHits.push([Math.min(q1.x, q4.x), Math.min(q1.y, q2.y), Math.max(q2.x, q3.x), Math.max(q3.y, q4.y), cc[2], la, lo]); });
        } else { LV3.cellHits = null;
        const cellPx = Math.max(2, R * (cv.d.deg * toR)), hp = heatPts(cv, (la, lo) => { const p = p3(lo, la, 0); return p.z > 0 ? p : null; }, cellPx);
        if (hp.length) c.drawImage(heatCanvas(hp.map(p => [p[0] * LV3.dpr, p[1] * LV3.dpr, p[2], p[3] * LV3.dpr]), LV3.W * LV3.dpr, LV3.H * LV3.dpr), 0, 0, LV3.W, LV3.H);
        }
      }
      const ring = km => { c.beginPath(); path(d3.geoCircle().center([pl.lon, pl.lat]).radius(km / 111.2)()); c.stroke(); };
      c.setLineDash([4, 5]); c.lineWidth = 1.2; c.strokeStyle = "rgba(125,211,252,.55)"; ring(100);
      if (LV.tab === "aircraft" || LV.sel) { c.strokeStyle = "rgba(253,224,71,.6)"; ring(LV.radius); }
      c.setLineDash([]);
      const h0 = p3(pl.lon, pl.lat, 0);
      if (h0.z > 0) { c.shadowColor = "rgba(186,230,253,.95)"; c.shadowBlur = 12; c.fillStyle = "#fff"; c.beginPath(); c.arc(h0.x, h0.y, 4.5, 0, 7); c.fill(); c.shadowBlur = 0; c.font = "700 12px " + mono; c.lineWidth = 3; c.strokeStyle = "#0a1628"; c.strokeText(pl.code, h0.x + 9, h0.y + 4); c.fillStyle = "#e6f0ff"; c.fillText(pl.code, h0.x + 9, h0.y + 4); }
    }
    // 경로: 출발 공항에서 올라가 순항 고도로 날다가 도착 공항으로 내려오는 호로 그린다 (비행 지도의 노선 호와 같은 방식).
    // 기체가 떠 있는 높이와 같은 규칙을 써서, 기체가 늘 선 위에 놓이게 한다. 이미 난 부분은 실선, 남은 부분은 점선
    const liftOf = ft => (typeof ft === "number" ? Math.min(45000, ft) : 0) / 45000 * 0.035;
    if (LV.scope !== "area" || LV.tab === "aircraft" || LV.sel) {
      c.lineCap = "round"; c.lineJoin = "round";
      const ramp = f => { const k = Math.max(0, Math.min(1, f / 0.1, (1 - f) / 0.1)); return Math.sin(k * Math.PI / 2); };
      shown().forEach(a => { if (!routeWanted(a)) return; const r = acRoute(a); if (!r) return; const on = LV.sel === a.hex;
        const fHere = Math.max(0.0001, Math.min(0.9999, (r.bi + 0.5) / r.n)), hHere = liftOf(a.alt_baro === "ground" ? 0 : a.alt_baro);
        // 지금 고도가 이 비율의 높이와 맞도록 순항 높이를 정한다
        const cruise = Math.max(liftOf(30000), hHere / Math.max(0.2, ramp(fHere)));
        const hAt = f => Math.abs(f - fHere) < 1e-6 ? hHere : cruise * ramp(f);
        const draw = (L, f0, f1) => { c.beginPath(); let pen = false; L.forEach((pt, i) => { const f = L.length > 1 ? f0 + (f1 - f0) * i / (L.length - 1) : f0, q = p3(pt[1], pt[0], i === (f0 === fHere ? 0 : L.length - 1) && (f0 === fHere || f1 === fHere) ? hHere : hAt(f)); if (!q.vis) { pen = false; return; } if (pen) c.lineTo(q.x, q.y); else { c.moveTo(q.x, q.y); pen = true; } }); c.stroke(); };
        c.setLineDash([]); c.strokeStyle = on ? "rgba(253,224,71,.95)" : "rgba(252,211,77,.62)"; c.lineWidth = on ? 2.4 : 1.5; if (on) { c.shadowColor = "rgba(253,224,71,.7)"; c.shadowBlur = 6; } draw(r.done, 0, fHere); c.shadowBlur = 0;
        c.setLineDash([3, 4]); c.lineDashOffset = -(performance.now() / 70) % 14; c.strokeStyle = on ? "rgba(253,224,71,.75)" : "rgba(203,220,240,.42)"; c.lineWidth = on ? 1.8 : 1.2; draw(r.left, fHere, 1); c.setLineDash([]); c.lineDashOffset = 0;
        [r.from, r.to].forEach(pt => { const q = p3(pt[1], pt[0], 0); if (q.vis && q.z > 0) { c.fillStyle = on ? "#fde047" : "rgba(226,232,240,.6)"; c.beginPath(); c.arc(q.x, q.y, on ? 3.2 : 2, 0, 7); c.fill(); } });
      });
    }
    // 항공기: 고도만큼 띄우고 땅까지 가는 선, 진행 방향으로 돌린 비행기 모양
    LV3.hits = [];
    const showAc = LV.scope !== "area" || LV.tab === "aircraft" || LV.sel;
    if (showAc) {
      const list = shown().slice().sort((a, b) => (typeof a.alt_baro === "number" ? a.alt_baro : 0) - (typeof b.alt_baro === "number" ? b.alt_baro : 0));
      const lift = liftOf;
      const pth = new Path2D(PLANE);
      list.forEach(a => {
        const alt = lift(a.alt_baro), top = p3(a.lon, a.lat, alt), gnd = p3(a.lon, a.lat, 0); if (!top.vis || gnd.z < -0.05) return;
        const on = LV.sel === a.hex, hov = LV3.hover === a.hex, fam = famOf(a.t), ac = fam ? byId[fam] : null;
        const col = on ? "#fde047" : ac ? (ac.maker === "boeing" ? LV3.cB : LV3.cA) : "#fcd34d";
        { const T = tailOf(a); if (T) { for (let j = 1; j < T.length; j++) { const p0 = p3(T[j - 1][1], T[j - 1][0], alt), p1 = p3(T[j][1], T[j][0], alt); if (!p0.vis || !p1.vis) continue; c.strokeStyle = `rgba(252,211,77,${(j / T.length * 0.55).toFixed(3)})`; c.lineWidth = 1 + j / T.length * 1.4; c.beginPath(); c.moveTo(p0.x, p0.y); c.lineTo(p1.x, p1.y); c.stroke(); } } }
        if (alt > 0) { c.beginPath(); c.moveTo(gnd.x, gnd.y); c.lineTo(top.x, top.y); c.strokeStyle = "rgba(252,211,77,.28)"; c.lineWidth = 1; c.stroke(); c.fillStyle = "rgba(252,211,77,.35)"; c.beginPath(); c.arc(gnd.x, gnd.y, 1.3, 0, 7); c.fill(); }
        // 화면 위 진행 방향: 진행 방향으로 조금 앞선 점을 투영해 각도를 구한다
        const tr = (a.track || 0) * toR, ahead = p3(a.lon + Math.sin(tr) * .2 / Math.max(.2, Math.cos(a.lat * toR)), a.lat + Math.cos(tr) * .2, alt), ang = Math.atan2(ahead.x - top.x, -(ahead.y - top.y));
        const s = on || hov ? 1.25 : 0.95;
        c.save(); c.translate(top.x, top.y); c.rotate(ang); c.scale(s, s);
        c.shadowColor = col; c.shadowBlur = on ? 14 : 7; c.fillStyle = col; c.strokeStyle = "#0a1628"; c.lineWidth = 1.2; c.stroke(pth); c.fill(pth); c.restore(); c.shadowBlur = 0;
        if (on || hov) { c.font = "700 11.5px " + mono; const lb = String(a.flight || a.r || a.hex).trim(); c.lineWidth = 3; c.strokeStyle = "#0a1628"; c.strokeText(lb, top.x + 11, top.y - 9); c.fillStyle = "#f8fafc"; c.fillText(lb, top.x + 11, top.y - 9); }
        LV3.hits.push({ x: top.x, y: top.y, a: a });
      });
    }
    c.font = "500 11.5px " + getComputedStyle(document.body).fontFamily; c.fillStyle = "rgba(203,220,240,.75)";
    c.fillText(showAc ? `항공기 ${fmt(LV3.hits.length)}대, 떠 있는 높이는 고도에 비례(과장)` : "끌어서 돌리기, 휠로 확대", 14, LV3.H - 14);
  }
  function lv3dHit(e) { const r = LV3.cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; let best = null, bd = 14 * 14; LV3.hits.forEach(h => { const d = (h.x - x) * (h.x - x) + (h.y - y) * (h.y - y); if (d < bd) { bd = d; best = h; } }); return best; }
  function lv3dWire() {
    const cv = LV3.cv; let drag = null;
    let vel = [0, 0], lastP = null, inert = 0;
    const inertia = () => { inert = 0; if (Math.abs(vel[0]) + Math.abs(vel[1]) < 0.02) return; LV3.rot = [LV3.rot[0] + vel[0], Math.max(-85, Math.min(85, LV3.rot[1] + vel[1])), 0]; vel = [vel[0] * 0.92, vel[1] * 0.92]; lv3dDirty(); inert = requestAnimationFrame(inertia); };
    cv.addEventListener("pointerdown", e => { if (inert) cancelAnimationFrame(inert); inert = 0; vel = [0, 0]; MOTION.touched = true; drag = { x: e.clientX, y: e.clientY, rot: LV3.rot.slice(), lat: LV3.loc.lat, lon: LV3.loc.lon, hd: LV3.loc.hd || 0, moved: false }; lastP = { x: e.clientX, y: e.clientY, t: performance.now() }; cv.setPointerCapture(e.pointerId); cv.classList.add("grab"); });
    cv.addEventListener("pointermove", e => {
      if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
        if (false) { const L = LV3.loc;
          if (e.shiftKey) { L.hd = drag.hd + dx * 0.4; }
          else { const spanKm = ((LV.tab === "aircraft" || LV.sel) ? Math.max(120, LV.radius * 1.15) : 150) / L.z, kmPx = spanKm / (LV3.W * 0.5), a = (L.hd || 0) * Math.PI / 180, ex = -dx * kmPx, ny = dy * kmPx / 0.6, de = ex * Math.cos(a) + ny * Math.sin(a), dn = -ex * Math.sin(a) + ny * Math.cos(a);
            L.lat = Math.max(-80, Math.min(80, drag.lat + dn / 111.2)); L.lon = drag.lon + de / (111.2 * Math.max(.2, Math.cos(L.lat * Math.PI / 180))); }
          lv3dDirty(); return; }
        const f = 0.4 / LV3.k; LV3.rot = [drag.rot[0] + dx * f, Math.max(-85, Math.min(85, drag.rot[1] - dy * f)), 0]; if (lastP) { const nt = performance.now(), ddt = Math.max(8, nt - lastP.t); vel = [(e.clientX - lastP.x) * f * 16 / ddt, -(e.clientY - lastP.y) * f * 16 / ddt]; lastP = { x: e.clientX, y: e.clientY, t: nt }; } lv3dDirty(); return; }
      const h = lv3dHit(e), k = h ? h.a.hex : null, tip = document.getElementById("tip");
      if (h) { const a = h.a; tip.innerHTML = `<b>${esc(a.flight || a.r || a.hex)}</b> ${esc(a.t || "?")}<br>${esc(altTxt(a))} ${typeof a.gs === "number" ? Math.round(a.gs) + " kt" : ""}`; tip.hidden = false; tip.style.left = (e.clientX + 14) + "px"; tip.style.top = (e.clientY + 14) + "px"; }
      else if (LV3.hover) tip.hidden = true;
      { const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; let ap = null, bd = 12 * 12; if (!h) (LV3.apHits || []).forEach(q => { const d = (q[0] - x) * (q[0] - x) + (q[1] - y) * (q[1] - y); if (d < bd) { bd = d; ap = q[2]; } }); if (ap !== (LV3.apHover || null)) { LV3.apHover = ap; lv3dDirty(); } cv.classList.toggle("on-ap", !!ap); }
      if (!h && LV3.cellHits) { const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, cc = LV3.cellHits.find(b => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]); if (cc) { tip.innerHTML = `<b>${fmt(cc[4])}대</b> 지난 24시간<br>${cc[5].toFixed(2)}N, ${cc[6].toFixed(2)}E 칸`; tip.hidden = false; tip.style.left = (e.clientX + 14) + "px"; tip.style.top = (e.clientY + 14) + "px"; LV3.cellTip = 1; } else if (LV3.cellTip) { tip.hidden = true; LV3.cellTip = 0; } }
      cv.classList.toggle("on-ac", !!h);
      if (k !== LV3.hover) { LV3.hover = k; lv3dDirty(); }
    });
    cv.addEventListener("pointerup", e => {
      if (!drag) return; const moved = drag.moved; drag = null; cv.classList.remove("grab"); if (moved) { if (!fxCalm() && lastP && performance.now() - lastP.t < 80) inert = requestAnimationFrame(inertia); return; }
      // 공항과 비행기가 겹치면 더 가까운 쪽을 고른다
      const h = lv3dHit(e), pn = document.getElementById("live-panel"), r0 = LV3.cv.getBoundingClientRect(), x0 = e.clientX - r0.left, y0 = e.clientY - r0.top;
      let ap = null, ad = 16 * 16; (LV3.apHits || []).concat(LV3.here ? [LV3.here] : []).forEach(q => { const d = (q[0] - x0) * (q[0] - x0) + (q[1] - y0) * (q[1] - y0); if (d < ad) { ad = d; ap = q[2]; } });
      const hd = h ? (h.x - x0) * (h.x - x0) + (h.y - y0) * (h.y - y0) : Infinity;
      if (ap && ad <= hd) { liveFlyApt(ap); return; }
      if (!h) return;
      if (!pn) return;
      const b = document.createElement("button"); b.hidden = true; b.setAttribute("data-live", "sel:" + h.a.hex); pn.appendChild(b); b.click(); b.remove();
    });
    cv.addEventListener("dblclick", e => { if (!lv3dHit(e)) { e.preventDefault(); lv3dClickFly(e); } });
    cv.addEventListener("pointercancel", () => { drag = null; cv.classList.remove("grab"); });
    cv.addEventListener("pointerleave", () => { if (LV3.hover) { LV3.hover = null; document.getElementById("tip").hidden = true; lv3dDirty(); } });
    cv.addEventListener("wheel", e => {
      if (false) {
        let hh = cv.parentElement.querySelector(".lv3d-hint"); if (!hh) { cv.insertAdjacentHTML("afterend", `<div class="wheel-hint lv3d-hint">${/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"} + 휠로 확대합니다</div>`); hh = cv.parentElement.querySelector(".lv3d-hint"); }
        hh.classList.add("on"); clearTimeout(hh._t); hh._t = setTimeout(() => hh.classList.remove("on"), 1100); return;
      }
      e.preventDefault(); MOTION.touched = true; LV3.kt = Math.max(0.8, Math.min(80, (LV3.kt || LV3.k) * Math.pow(1.0015, -e.deltaY))); if (!LV3.zr) { const z = () => { LV3.k += (LV3.kt - LV3.k) * 0.25; lv3dDirty(); if (Math.abs(LV3.kt - LV3.k) > 0.002) LV3.zr = requestAnimationFrame(z); else { LV3.k = LV3.kt; LV3.zr = 0; } }; LV3.zr = requestAnimationFrame(z); }
    }, { passive: false });
  }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-lv3]"); if (!b) return;
    const v = b.getAttribute("data-lv3");
    if (v === "2d" || v === "3d") lv3dMode(v === "3d");
    else if (v === "in") { LV3.k = Math.min(80, LV3.k * 1.5); lv3dDirty(); }
    else if (v === "out") { LV3.k = Math.max(0.8, LV3.k / 1.5); lv3dDirty(); }
    else if (v === "home") lv3dFocus(true);
  });
