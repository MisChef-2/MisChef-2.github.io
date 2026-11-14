// node tools/chart-build.js <chartsrc dir> <repo root>
// OurAirports(활주로·주파수, 퍼블릭 도메인)와 OpenStreetMap(유도로·계류장·터미널, ODbL)을 합쳐
//   src/charts-meta.js     : 번들에 들어가는 공항별 활주로·주파수 표 (CHART_META)
//   charts/<ICAO>.js       : 공항 페이지를 열 때 따로 불러오는 도형 파일
// 을 만든다. 좌표는 공항 기준점(ARP)에서 동쪽 x, 남쪽 y 방향의 미터 정수다.
const fs = require("fs"), path = require("path");
const SRC = process.argv[2], ROOT = process.argv[3] || ".", OUTD = path.join(ROOT, "charts");
fs.mkdirSync(OUTD, { recursive: true });
const oa = JSON.parse(fs.readFileSync(path.join(SRC, "oa.json"), "utf8"));

function projector(lat0, lon0) {
  const kx = 111320 * Math.cos(lat0 * Math.PI / 180), ky = 110540;
  return (lat, lon) => [(lon - lon0) * kx, (lat0 - lat) * ky];
}
function dp(pts, tol) {
  if (pts.length < 3) return pts.slice();
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const st = [[0, pts.length - 1]];
  while (st.length) {
    const [a, b] = st.pop(); let md = -1, mi = -1;
    const [x1, y1] = pts[a], [x2, y2] = pts[b], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1e-9;
    const closed = L < 1e-6;
    for (let i = a + 1; i < b; i++) { const d = closed ? Math.hypot(pts[i][0] - x1, pts[i][1] - y1) : Math.abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / L; if (d > md) { md = d; mi = i; } }
    if (md > tol) { keep[mi] = 1; st.push([a, mi], [mi, b]); }
  }
  return pts.filter((p, i) => keep[i]);
}
const enc = pts => { let px = 0, py = 0; const o = []; for (const p of pts) { const x = Math.round(p[0]), y = Math.round(p[1]); o.push(x - px, y - py); px = x; py = y; } return o.join(","); };
const len = pts => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };
function along(pts, d) { for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (d <= l) { const t = l ? d / l : 0; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t, Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; } d -= l; } const n = pts.length - 1; return [pts[n][0], pts[n][1], 0]; }
function area(p) { let s = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) s += (p[j][0] + p[i][0]) * (p[j][1] - p[i][1]); return Math.abs(s / 2); }
function centroid(p) { let a = 0, cx = 0, cy = 0; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const f = p[j][0] * p[i][1] - p[i][0] * p[j][1]; a += f; cx += (p[j][0] + p[i][0]) * f; cy += (p[j][1] + p[i][1]) * f; } if (Math.abs(a) < 1e-6) return p[0]; return [cx / (3 * a), cy / (3 * a)]; }
// 여러 조각으로 나뉜 다각형 외곽을 끝점끼리 이어 고리로 만든다
function rings(segs) {
  const out = [], left = segs.map(s => s.slice());
  while (left.length) {
    let r = left.shift();
    for (let guard = 0; guard < 500; guard++) {
      const a = r[0], b = r[r.length - 1];
      if (r.length > 2 && Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.5) break;
      const i = left.findIndex(s => Math.hypot(s[0][0] - b[0], s[0][1] - b[1]) < 0.5 || Math.hypot(s[s.length - 1][0] - b[0], s[s.length - 1][1] - b[1]) < 0.5);
      if (i < 0) break;
      let s = left.splice(i, 1)[0]; if (Math.hypot(s[0][0] - b[0], s[0][1] - b[1]) >= 0.5) s = s.reverse();
      r = r.concat(s.slice(1));
    }
    if (r.length > 3) out.push(r);
  }
  return out;
}
const latinish = s => /^[\x20-\x7eÀ-ɏ]+$/.test(s || "");
const normRef = s => String(s || "").toUpperCase().replace(/\s+/g, "").split(/[\/\-;,]/).map(x => x.replace(/^0+(?=\d)/, "")).sort().join("/");

const META = {}, report = [];
let totalGeo = 0;
for (const icao of oa.order) {
  const A = oa.apt[icao], P = projector(A.lat, A.lon);
  let osmF = path.join(SRC, "osm", icao + ".json");
  if (!fs.existsSync(osmF)) osmF = path.join(SRC, "osm-v1", icao + ".json");   // 첫 시도에서 받은 파일(관계 도형 없음)
  const osm = fs.existsSync(osmF) ? JSON.parse(fs.readFileSync(osmF, "utf8")).elements : [];
  const geo = el => (el.geometry || []).filter(g => g && g.lat != null).map(g => P(g.lat, g.lon));
  // OSM 활주로 중심선(검증용)
  const osmRw = osm.filter(e => e.type === "way" && e.tags && e.tags.aeroway === "runway").map(e => ({ ref: normRef(e.tags.ref), p: geo(e) })).filter(r => r.p.length >= 2);
  const rws = [], notes = [];
  for (const r of A.rw) {
    if (/[HW]$/.test(r.le) || /[HW]$/.test(r.he)) continue;
    let a = P(r.a[0], r.a[1]), b = P(r.b[0], r.b[1]);
    // 같은 번호의 OSM 활주로는 여러 토막(또는 면)으로 나뉘어 있을 수 있어, 모든 점을 OA 활주로 축에 투영해 양 끝과 평균 옆 거리를 잡는다.
    const parts = osmRw.filter(x => x.ref === normRef(r.le + "/" + r.he));
    if (parts.length) {
      const L0 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ux = (b[0] - a[0]) / L0, uy = (b[1] - a[1]) / L0;
      let tMin = Infinity, tMax = -Infinity, sSum = 0, n = 0;
      for (const o of parts) for (const p of o.p) {
        const t = (p[0] - a[0]) * ux + (p[1] - a[1]) * uy, s = -(p[0] - a[0]) * uy + (p[1] - a[1]) * ux;
        tMin = Math.min(tMin, t); tMax = Math.max(tMax, t); sSum += s; n++;
      }
      const sm = sSum / n, at = t => [a[0] + ux * t - uy * sm, a[1] + uy * t + ux * sm];
      const oa1 = at(tMin), ob1 = at(tMax);
      const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
      const dev = Math.max(d(a, oa1), d(b, ob1));
      if (dev > 150) { notes.push(`${r.le}/${r.he} OA↔OSM ${Math.round(dev)}m → OSM 사용`); a = oa1; b = ob1; }
    } else if (osmRw.length) notes.push(`${r.le}/${r.he} OSM 짝 없음`);
    const lenM = Math.hypot(b[0] - a[0], b[1] - a[1]);
    rws.push([r.le, r.he, r.len || Math.round(lenM / 0.3048), r.wid || null, r.sfc || "", Math.round(a[0]), Math.round(a[1]), Math.round(b[0]), Math.round(b[1]), r.ah, r.bh, r.ae, r.be, r.ad || 0, r.bd || 0]);
  }
  // 주파수: VHF 항공 대역만, 같은 종류·주파수는 한 번만
  const seen = new Set(), fq = [];
  for (const f of A.fq) { if (!(f.m >= 108 && f.m <= 137)) continue; const k = f.t + f.m; if (seen.has(k)) continue; seen.add(k); fq.push([String(f.t || "").toUpperCase(), latinish(f.d) ? f.d : "", +f.m.toFixed(3)]); }
  META[icao] = { n: A.name, c: A.city || "", e: A.elev, o: [+A.lat.toFixed(5), +A.lon.toFixed(5)], r: rws, f: fq };
  if (!osm.length) { const gf = path.join(OUTD, icao + ".js"); if (fs.existsSync(gf)) fs.unlinkSync(gf); report.push(`${icao.padEnd(5)} 도형 없음 — 활주로만 표시`); continue; }

  // ---------- 도형 ----------
  let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
  const grow = (x, y) => { bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y); };
  rws.forEach(r => { grow(r[5], r[6]); grow(r[7], r[8]); });
  if (!rws.length) grow(0, 0);
  const rx0 = bx0 - 2600, ry0 = by0 - 2600, rx1 = bx1 + 2600, ry1 = by1 + 2600;
  const inR = p => p[0] > rx0 && p[0] < rx1 && p[1] > ry0 && p[1] < ry1;
  const tw = [], tl = [], ap = [], tm = [], ct = [], lab = [];
  for (const e of osm) {
    const t = e.tags || {}, kind = t.aeroway;
    if (kind === "control_tower") { const p = e.type === "node" ? P(e.lat, e.lon) : e.center ? P(e.center.lat, e.center.lon) : null; if (p && inR(p)) ct.push([Math.round(p[0]), Math.round(p[1])]); continue; }
    if (e.type === "way" && (kind === "taxiway" || kind === "taxilane")) {
      const p = geo(e); if (p.length < 2 || !p.some(inR)) continue;
      const s = dp(p, kind === "taxiway" ? 1.5 : 2.5);
      if (kind === "taxiway") {
        tw.push(enc(s));
        const ref = (t.ref || (t.name && t.name.length <= 4 ? t.name : "") || "").trim();
        const L = len(p);
        if (ref && latinish(ref) && ref.length <= 5 && L >= 80) { const m = along(p, L / 2); lab.push([ref, Math.round(m[0]), Math.round(m[1]), Math.round(L)]); }
      } else tl.push(enc(s));
      continue;
    }
    if (kind === "apron" || kind === "terminal") {
      let polys = [];
      if (e.type === "way") { const p = geo(e); if (p.length > 3) polys = [p]; }
      else if (e.type === "relation") polys = rings((e.members || []).filter(m => m.type === "way" && m.role !== "inner" && m.geometry).map(m => m.geometry.filter(g => g).map(g => P(g.lat, g.lon))));
      for (const p of polys) {
        if (!p.some(inR)) continue;
        const ar = area(p); if (ar < (kind === "terminal" ? 1500 : 2500)) continue;
        const s = dp(p, kind === "terminal" ? 1.5 : 2.5);
        if (kind === "apron") { ap.push(enc(s)); p.forEach(q => { if (inR(q)) grow(q[0], q[1]); }); }
        else {
          const hangul = s => /^[ -~가-힣]+$/.test(s || "");
          let nm = [t["name:en"], t.ref, t.name, t["name:ko"]].find(s => s && latinish(s)) || [t["name:ko"], t.name].find(s => s && hangul(s)) || "";
          nm = nm.replace(/^.*\b(airport|aeroporto|a\u00e9roport|flughafen|luchthaven|aeropuerto|havalimani)\b[\s,:\u2013-]*/i, "").replace(/^.*\uacf5\ud56d\s*/, "").trim();
          const c = centroid(p);
          tm.push([nm.length <= 28 ? nm : "", Math.round(c[0]), Math.round(c[1]), Math.round(ar), enc(s)]);
          p.forEach(q => { if (inR(q)) grow(q[0], q[1]); });
        }
      }
    }
  }
  // 같은 이름의 유도로 표시는 가까우면(350 m) 긴 것 하나만 남긴다
  lab.sort((x, y) => y[3] - x[3]);
  const lb = [];
  for (const l of lab) if (!lb.some(k => k[0] === l[0] && Math.hypot(k[1] - l[1], k[2] - l[2]) < 350)) lb.push(l);
  const pad = 220, B = [Math.round(bx0 - pad), Math.round(by0 - pad), Math.round(bx1 + pad), Math.round(by1 + pad)];
  const G = { b: B, tw, tl, ap, tm, ct, lb: lb.map(l => l.slice(0, 3)) };
  const js = `(window.JLV_CHART=window.JLV_CHART||{})[${JSON.stringify(icao)}]=${JSON.stringify(G)};\n`;
  fs.writeFileSync(path.join(OUTD, icao + ".js"), js);
  totalGeo += js.length;
  report.push(`${icao.padEnd(5)} osm ${String(osm.length).padStart(5)}  tw ${String(tw.length).padStart(4)} tl ${String(tl.length).padStart(4)} ap ${String(ap.length).padStart(3)} tm ${String(tm.length).padStart(3)} ct ${ct.length} lb ${String(lb.length).padStart(3)}  ${(js.length / 1024).toFixed(0).padStart(4)}KB  ${notes.join("; ")}`);
}
const metaJs = "  /* ===== 비행장 차트 데이터 (OurAirports, 퍼블릭 도메인) — chart-build.js 가 만든다 ===== */\n  const CHART_META = " + JSON.stringify(META) + ";\n";
fs.writeFileSync(path.join(ROOT, "src", "charts-meta.js"), metaJs);
console.log(report.join("\n"));
console.log("meta", (metaJs.length / 1024).toFixed(0) + "KB", "geometry total", (totalGeo / 1024).toFixed(0) + "KB");
