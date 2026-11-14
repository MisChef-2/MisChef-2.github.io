
  /* ================= 실시간 운항: FlyItalyADSB API =================
     - /api/coverage (키 불필요): 지점 반경 100 km의 현재 대수와 24시간 교통량. 게시본은 수집해 둔 스냅샷을, 단독 파일은 실시간 값을 쓴다.
     - /v2/lat/../lon/../dist/.., /v2/type/.., /v2/history/.. (X-Api-Key 필요): 실시간 항공기. 키가 없거나 호출이 막히면 '예시' 항공편을 보여 준다. */
  const FIA = "https://api.flyitalyadsb.com";
  const FIA_CREDIT = "Flight data: FlyItalyADSB (flyitalyadsb.com), CC BY-SA 4.0";
  const tfetch = (url, opt) => { const c = new AbortController(), t = setTimeout(() => c.abort(), 8000); return fetch(url, Object.assign({ signal: c.signal }, opt || {})).finally(() => clearTimeout(t)); };
  const PLACES = [
    { id: "icn", code: "ICN", name: "인천", sub: "인천국제공항", lat: 37.4602, lon: 126.4407, kind: "kr" },
    { id: "gmp", code: "GMP", name: "김포", sub: "김포국제공항", lat: 37.5583, lon: 126.7906, kind: "kr" },
    { id: "cju", code: "CJU", name: "제주", sub: "제주국제공항", lat: 33.5113, lon: 126.493, kind: "kr" },
    { id: "pus", code: "PUS", name: "김해", sub: "김해국제공항 (부산)", lat: 35.1795, lon: 128.9382, kind: "kr" },
    { id: "pae", code: "PAE", name: "에버렛", sub: "보잉 767 · 777 · 777X 조립", lat: 47.9063, lon: -122.2816, kind: "boeing" },
    { id: "rnt", code: "RNT", name: "렌턴", sub: "보잉 737 MAX 조립", lat: 47.4931, lon: -122.2157, kind: "boeing" },
    { id: "chs", code: "CHS", name: "노스찰스턴", sub: "보잉 787 조립", lat: 32.8986, lon: -80.0405, kind: "boeing" },
    { id: "lgb", code: "LGB", name: "롱비치", sub: "옛 717 조립 공장", lat: 33.8177, lon: -118.1516, kind: "boeing" },
    { id: "tls", code: "TLS", name: "툴루즈", sub: "에어버스 A320 · A330 · A350 조립", lat: 43.6291, lon: 1.3638, kind: "airbus" },
    { id: "xfw", code: "XFW", name: "함부르크", sub: "에어버스 A320 패밀리 조립", lat: 53.5353, lon: 9.8356, kind: "airbus" },
    { id: "tsn", code: "TSN", name: "톈진", sub: "에어버스 A320 패밀리 조립", lat: 39.1244, lon: 117.3462, kind: "airbus" },
    { id: "bfm", code: "BFM", name: "모빌", sub: "에어버스 A220 · A320 조립", lat: 30.6268, lon: -88.0681, kind: "airbus" },
    { id: "ymx", code: "YMX", name: "미라벨", sub: "에어버스 A220 조립", lat: 45.6795, lon: -74.0387, kind: "airbus" }
  ];
  const placeById = {}; PLACES.forEach(p => { placeById[p.id] = p; });
  const SITE_PLACE = { "에버렛": "pae", "렌턴": "rnt", "노스찰스턴": "chs", "롱비치": "lgb", "툴루즈": "tls", "함부르크": "xfw", "톈진": "tsn", "모빌": "bfm", "미라벨": "ymx" };
  const AP = { ICN: [37.46, 126.44], GMP: [37.56, 126.79], CJU: [33.51, 126.49], PUS: [35.18, 128.94], NRT: [35.76, 140.39], HND: [35.55, 139.78], KIX: [34.43, 135.24], FUK: [33.59, 130.45], PVG: [31.14, 121.81], PEK: [40.08, 116.58], HKG: [22.31, 113.91], TPE: [25.08, 121.23], SIN: [1.36, 103.99], BKK: [13.69, 100.75],
    LAX: [33.94, -118.41], SFO: [37.62, -122.38], SEA: [47.45, -122.31], JFK: [40.64, -73.78], ATL: [33.64, -84.43], ORD: [41.98, -87.9], YVR: [49.19, -123.18], HNL: [21.32, -157.92], LHR: [51.47, -0.45], CDG: [49.01, 2.55], FRA: [50.04, 8.56], AMS: [52.31, 4.76], FCO: [41.8, 12.25], MAD: [40.49, -3.57], IST: [41.26, 28.74], DXB: [25.25, 55.36], DOH: [25.27, 51.61], SYD: [-33.95, 151.18],
    PAE: [47.91, -122.28], TLS: [43.63, 1.36], XFW: [53.54, 9.84] };
  const FAMILY_CODES = { "boeing-707": ["B703", "B720"], "boeing-727": ["B722", "B721"], "boeing-737": ["B738", "B737", "B739", "B733"], "boeing-737max": ["B38M", "B39M", "B37M"], "boeing-747": ["B744", "B748"], "boeing-757": ["B752", "B753"], "boeing-767": ["B763", "B762", "B764"], "boeing-777": ["B77W", "B772", "B77L", "B773"], "boeing-777x": ["B779", "B778"], "boeing-787": ["B789", "B788", "B78X"], "boeing-717": ["B712"],
    "airbus-a300": ["A306", "A30B"], "airbus-a310": ["A310"], "airbus-a320": ["A320", "A321", "A319", "A318"], "airbus-a320neo": ["A20N", "A21N", "A19N"], "airbus-a330": ["A333", "A332"], "airbus-a330neo": ["A339", "A338"], "airbus-a340": ["A343", "A346", "A342", "A345"], "airbus-a350": ["A359", "A35K"], "airbus-a380": ["A388"], "airbus-a220": ["BCS3", "BCS1"] };
  const TYPE_FAMILY = { B732: "boeing-737", B734: "boeing-737", B735: "boeing-737", B736: "boeing-737", B3XM: "boeing-737max", B741: "boeing-747", B742: "boeing-747", B743: "boeing-747", B74S: "boeing-747", B74R: "boeing-747", BLCF: "boeing-747", A3ST: "airbus-a300" };
  Object.keys(FAMILY_CODES).forEach(id => FAMILY_CODES[id].forEach(c => { TYPE_FAMILY[c] = id; }));
  const famOf = t => TYPE_FAMILY[String(t || "").toUpperCase()] || null;
  // 예시 항공편: [콜사인, ICAO 형식, 출발, 도착, 진행률, 고도(ft), 속도(kt)]. 실제 위치가 아니라 화면 시연용이다.
  const DEMO = [["KAL081", "B748", "ICN", "JFK", 0.05, 31000, 520], ["KAL017", "B77W", "ICN", "LAX", 0.025, 24000, 470], ["KAL902", "A388", "CDG", "ICN", 0.965, 14000, 340], ["KAL1203", "B38M", "GMP", "CJU", 0.45, 28000, 430], ["KAL1114", "A21N", "CJU", "GMP", 0.3, 30000, 440],
    ["AAR102", "A359", "ICN", "NRT", 0.35, 37000, 490], ["AAR8915", "A321", "GMP", "CJU", 0.72, 22000, 400], ["JJA1502", "B738", "GMP", "PUS", 0.5, 23000, 410], ["KAL623", "B789", "ICN", "HKG", 0.12, 36000, 480], ["KAL642", "A333", "SIN", "ICN", 0.93, 19000, 380], ["KAL1005", "BCS3", "GMP", "PUS", 0.25, 21000, 400],
    ["DLH712", "B748", "FRA", "ICN", 0.5, 35000, 500], ["BAW117", "A388", "LHR", "JFK", 0.4, 38000, 490], ["UAE201", "A388", "DXB", "JFK", 0.6, 37000, 495], ["DAL158", "A339", "SEA", "ICN", 0.45, 36000, 485], ["UAL837", "B77W", "SFO", "NRT", 0.5, 34000, 500], ["AFR264", "B77W", "CDG", "ICN", 0.3, 35000, 495],
    ["SIA308", "A359", "SIN", "LHR", 0.5, 39000, 490], ["QFA1", "A388", "SYD", "SIN", 0.5, 38000, 490], ["ANA211", "B789", "HND", "LHR", 0.4, 38000, 485], ["DAL2001", "B752", "ATL", "LAX", 0.5, 34000, 460], ["UPS82", "B763", "ORD", "ICN", 0.55, 33000, 470], ["DAL1410", "B712", "ATL", "ORD", 0.5, 30000, 420],
    ["DLH400", "A346", "FRA", "JFK", 0.3, 36000, 480], ["FDX5014", "A306", "ORD", "ATL", 0.4, 31000, 440], ["CFG2114", "B753", "FRA", "MAD", 0.6, 35000, 455], ["BOE001", "B779", "PAE", "PAE", 0.2, 17000, 310], ["AIB04NE", "A339", "TLS", "TLS", 0.6, 15000, 300], ["AIB321X", "A21N", "XFW", "XFW", 0.1, 12000, 280]];
  const LV = { net: null, key: "", scope: "area", place: "icn", typeId: "boeing-747", radius: 250, tab: "traffic", filter: "all", sel: null, ac: [], acSrc: "none", acTime: 0, cover: {}, err: null, usage: null, trail: null, trailNote: "", busy: false, conn: false, tick: 0 };
  try { LV.key = localStorage.getItem("hub-fia-key") || ""; const s = JSON.parse(localStorage.getItem("hub-live") || "{}"); if (placeById[s.place]) LV.place = s.place; if ([100, 250, 500].includes(s.radius)) LV.radius = s.radius; } catch (e) { /* 저장소 없음 */ }
  const saveLive = () => { try { localStorage.setItem("hub-live", JSON.stringify({ place: LV.place, radius: LV.radius })); } catch (e) { /* 무시 */ } };
  let liveMap = null, liveTimer = null, liveWired = false, liveRaf = 0;
  const T0 = Date.now();

  /* ---------- 지리 계산 ---------- */
  const toR = d => d * Math.PI / 180, toD = r => r * 180 / Math.PI, R_EARTH = 6371;
  function distKm(a, b) { const dLat = toR(b[0] - a[0]), dLon = toR(b[1] - a[1]), s = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a[0])) * Math.cos(toR(b[0])) * Math.sin(dLon / 2) ** 2; return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(s))); }
  function destPt(lat, lon, brg, km) { const d = km / R_EARTH, b = toR(brg), p1 = toR(lat), l1 = toR(lon), p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(b)), l2 = l1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2)); return [toD(p2), ((toD(l2) + 540) % 360) - 180]; }
  function gcPoint(a, b, f) {
    const p1 = toR(a[0]), l1 = toR(a[1]), p2 = toR(b[0]), l2 = toR(b[1]), d = distKm(a, b) / R_EARTH; if (d < 1e-6) return { pt: a, brg: 0 };
    const A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(p1) * Math.cos(l1) + B * Math.cos(p2) * Math.cos(l2), y = A * Math.cos(p1) * Math.sin(l1) + B * Math.cos(p2) * Math.sin(l2), z = A * Math.sin(p1) + B * Math.sin(p2);
    const pt = [toD(Math.atan2(z, Math.sqrt(x * x + y * y))), toD(Math.atan2(y, x))], q1 = toR(pt[0]), dl = l2 - toR(pt[1]);
    return { pt: pt, brg: (toD(Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(q1) * Math.sin(p2) - Math.sin(q1) * Math.cos(p2) * Math.cos(dl))) + 360) % 360 };
  }
  function demoAircraft() {
    const t = (Date.now() - T0) / 1000;
    return DEMO.map((d, i) => {
      const a = AP[d[2]], b = AP[d[3]]; let pt, brg, f = 0.5;
      if (d[2] === d[3]) { const ang = (d[4] * 360 + t * 0.3) % 360; pt = destPt(a[0], a[1], ang, 70); brg = (ang + 90) % 360; }
      else { f = (d[4] + (t * d[6] * 1.852 / 3600) / distKm(a, b)) % 1; const g = gcPoint(a, b, f); pt = g.pt; brg = g.brg; }
      return { hex: "ex" + String(i + 1).padStart(4, "0"), flight: d[0], r: "예시", t: d[1], lat: pt[0], lon: pt[1], alt_baro: d[5], gs: d[6], track: Math.round(brg), baro_rate: f < 0.04 ? 1800 : f > 0.95 ? -1400 : 0, squawk: "----", type: "demo", seen_pos: 0, route: d[2] === d[3] ? null : { from_iata: d[2], to_iata: d[3] }, demo: true };
    });
  }

  /* ---------- 데이터 호출 ---------- */
  const packCover = d => { const L = d.last_24h || {}, n = d.now || {}, rc = d.receivers || {}; return { g: d.generated, from: L.from, to: L.to, a24: L.aircraft, hourly: L.hourly || [], typ: L.typical_hour, peak: L.peak_hour, deg: L.cell_deg || 0.1, cells: (L.cells || []).map(c => [Math.round(c[0] * 100), Math.round(c[1] * 100), c[2]]), now: n.aircraft, gnd: n.on_ground, src: n.sources, age: n.position_age_s, rx: rc.receivers, net: rc.network_receivers }; };
  const coverOf = id => { if (!LV.cover[id] && typeof COVER_SNAP !== "undefined" && COVER_SNAP[id]) LV.cover[id] = { d: COVER_SNAP[id], src: "snap", t: 0 }; return LV.cover[id] || null; };
  async function loadCover(id, force) {
    const cur = coverOf(id); if (LV.net === false) return cur;
    if (!force && cur && cur.src === "live" && Date.now() - cur.t < 120000) return cur;
    const p = placeById[id];
    try {
      const r = await tfetch(`${FIA}/api/coverage?lat=${p.lat}&lon=${p.lon}&radius=100`); LV.net = true;
      if (r.ok) LV.cover[id] = { d: packCover(await r.json()), src: "live", t: Date.now() };
    } catch (e) { if (LV.net === null) LV.net = false; }
    return LV.cover[id] || null;
  }
  async function fia(path) {
    const r = await tfetch(FIA + path, { headers: { "X-Api-Key": LV.key } }); LV.net = true;
    const used = r.headers.get("X-FIA-Used-Month"), quota = r.headers.get("X-FIA-Quota-Month"), plan = r.headers.get("X-FIA-Plan"); if (used || plan) LV.usage = { used: used, quota: quota, plan: plan };
    if (!r.ok) { let body = null; try { body = await r.json(); } catch (e) { body = null; } const er = new Error((body && body.error) || ("HTTP " + r.status)); er.status = r.status; er.retry = r.headers.get("Retry-After"); throw er; }
    return r.json();
  }
  const errText = e => e.status === 401 ? "API 키가 올바르지 않습니다. 키를 다시 확인하세요." : e.status === 403 ? "요금제의 반경 한도를 넘었습니다. 무료 키는 반경 500 km까지입니다." : e.status === 429 ? `요청 한도를 넘었습니다. ${e.retry ? e.retry + "초 뒤" : "잠시 뒤"} 다시 시도합니다.` : e.status ? `API 오류 (${e.status}): ${e.message}` : "API에 연결하지 못했습니다. 네트워크 상태를 확인하세요.";
  const normAc = a => Object.assign({}, a, { flight: String(a.flight || "").trim() });
  function demoFor() {
    const all = demoAircraft();
    if (LV.scope === "type") return all.filter(a => famOf(a.t) === LV.typeId);
    const p = placeById[LV.place]; return all.filter(a => distKm([p.lat, p.lon], [a.lat, a.lon]) <= LV.radius);
  }
  async function loadAircraft() {
    if (LV.net !== false && LV.key) {
      try {
        let list = [];
        if (LV.scope === "type") { for (const code of FAMILY_CODES[LV.typeId]) { const d = await fia(`/v2/type/${code}?with=route`); list = list.concat(d.ac || []); } }
        else { const p = placeById[LV.place]; const d = await fia(`/v2/lat/${p.lat}/lon/${p.lon}/dist/${LV.radius}?with=route`); list = d.ac || []; }
        LV.ac = list.filter(a => typeof a.lat === "number" && typeof a.lon === "number").map(normAc); LV.acSrc = "live"; LV.acTime = Date.now(); LV.err = null; return;
      } catch (e) { LV.err = errText(e); if (!e.status && LV.net === null) LV.net = false; }
    }
    LV.ac = demoFor(); LV.acSrc = "demo"; LV.acTime = Date.now();
  }
  async function loadTrail(a) {
    LV.trail = null; LV.trailNote = "";
    if (a.demo) { const d = DEMO[+a.hex.slice(2) - 1]; if (d && d[2] !== d[3]) { const A = AP[d[2]], pts = []; for (let i = 0; i <= 24; i++) pts.push(gcPoint(A, [a.lat, a.lon], i / 24).pt); LV.trail = pts; LV.trailNote = "예시 경로 (출발 공항에서 현재 위치까지의 대권)"; } else LV.trailNote = "예시 시험비행에는 경로가 없습니다."; return; }
    try { const day = new Date().toISOString().slice(0, 10), d = await fia(`/v2/history/${a.hex}/${day}`); const pts = (d.trace || []).filter(p => typeof p[1] === "number" && typeof p[2] === "number").map(p => [p[1], p[2]]); LV.trail = pts.length > 1 ? pts : null; LV.trailNote = pts.length > 1 ? `오늘(UTC) 기록된 위치 ${fmt(pts.length)}개` : "오늘 기록된 궤적이 없습니다."; }
    catch (e) { LV.trailNote = e.status === 404 ? "오늘 기록된 궤적이 없습니다." : errText(e); }
  }

  /* ---------- 표시 형식 ---------- */
  const kst = iso => { const d = new Date(iso); if (isNaN(d)) return "—"; const k = new Date(d.getTime() + 9 * 3600000); return `${k.getUTCMonth() + 1}월 ${k.getUTCDate()}일 ${String(k.getUTCHours()).padStart(2, "0")}:${String(k.getUTCMinutes()).padStart(2, "0")} KST`; };
  const altTxt = a => a.alt_baro === "ground" ? "지상" : typeof a.alt_baro === "number" ? fmt(a.alt_baro) + " ft" : "—";
  const phase = a => a.alt_baro === "ground" ? "지상" : (a.baro_rate || 0) > 500 ? "상승" : (a.baro_rate || 0) < -500 ? "강하" : "순항";
  const isKal = a => String(a.flight || "").indexOf("KAL") === 0;
  const shown = () => LV.ac.filter(a => LV.filter === "all" || (LV.filter === "ours" ? !!famOf(a.t) : isKal(a))).sort((a, b) => String(a.flight || "~").localeCompare(String(b.flight || "~")));
  const srcBadge = () => LV.acSrc === "live" ? `<span class="pill ok">LIVE</span>` : `<span class="pill off">예시 데이터</span>`;
  const lbtn = (act, label, on, id) => `<button type="button" id="${id}" data-live="${act}" class="${on ? "on" : ""}" aria-pressed="${!!on}">${label}</button>`;
  function hourlyChart(cv) {
    const hv = cv.d.hourly || [], n = hv.length; if (!n) return "";
    const W = 272, H = 84, m = { l: 4, r: 4, t: 6, b: 16 }, max = Math.max.apply(null, hv.concat([1])), bw = (W - m.l - m.r) / n, start = new Date(cv.d.from).getTime();
    let o = "";
    hv.forEach((v, i) => { const h = v / max * (H - m.t - m.b), hr = new Date(start + i * 3600000 + 9 * 3600000).getUTCHours(); o += `<g data-tip="${esc(`<b>${String(hr).padStart(2, "0")}시대 (KST)</b><br>${fmt(v)}대`)}"><rect class="hit" x="${N(m.l + i * bw)}" y="0" width="${N(bw)}" height="${H - m.b}"/><rect class="hbar${i === n - 1 ? " last" : ""}" x="${N(m.l + i * bw + 1)}" y="${N(H - m.b - h)}" width="${N(bw - 2)}" height="${N(Math.max(h, 1))}" rx="1.5"/></g>`; if (i % 6 === 0 || i === n - 1) o += `<text class="tick" x="${N(m.l + i * bw + bw / 2)}" y="${H - 4}" text-anchor="middle">${String(hr).padStart(2, "0")}시</text>`; });
    return `<svg class="chart hchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="지난 24시간의 시간대별 항공기 수. 최대 ${fmt(max)}대">${o}</svg>`;
  }
  const sparkline = hv => { if (!hv || !hv.length) return ""; const W = 120, H = 28, max = Math.max.apply(null, hv.concat([1])), bw = W / hv.length; return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true">${hv.map((v, i) => `<rect x="${N(i * bw + 0.5)}" y="${N(H - Math.max(1, v / max * H))}" width="${N(bw - 1)}" height="${N(Math.max(1, v / max * H))}" rx="1"/>`).join("")}</svg>`; };

  /* ---------- 패널 ---------- */
  function trafficTab() {
    const p = placeById[LV.place], cv = coverOf(p.id);
    if (!cv) return `<p class="empty">이 지점의 교통량 데이터를 불러오지 못했습니다.</p>`;
    const d = cv.d, s = d.src || {}, st = (label, val, unit) => `<div class="kv"><span class="lbl">${label}</span><span class="val">${val}<small> ${unit}</small></span></div>`;
    return `<div class="kvs live-kvs">${st("지금 추적 중", fmt(d.now || 0), "대")}${st("그중 지상", fmt(d.gnd || 0), "대")}${st("지난 24시간", fmt(d.a24 || 0), "대")}${st("시간당 최대", fmt(d.peak || 0), "대")}</div>
<div class="live-sec"><p class="lbl">${ICON.chart}시간대별 항공기 수 (KST)</p>${hourlyChart(cv)}</div>
<div class="live-sec"><p class="lbl">${ICON.map}통과 밀도 (지도의 격자, 0.1°)</p><div class="heat-leg"><span>낮음</span><i class="h1"></i><i class="h2"></i><i class="h3"></i><i class="h4"></i><i class="h5"></i><span>높음</span></div></div>
<div class="live-sec small muted">반경 100 km 기준. 수신 방식 ADS-B ${fmt(s.adsb || 0)} · MLAT ${fmt(s.mlat || 0)}. 주변 수신기 ${fmt(d.rx || 0)}대, 전체 네트워크 ${fmt(d.net || 0)}대.<br>${cv.src === "live" ? `<span class="pill ok">LIVE</span> ${esc(kst(d.g))} 갱신` : `<span class="pill off">스냅샷</span> ${esc(kst(d.g))}에 수집한 실제 값`}</div>`;
  }
  function acRow(a) {
    const fam = famOf(a.t), ac = fam ? byId[fam] : null;
    return `<button type="button" class="ac-row${LV.sel === a.hex ? " on" : ""}${ac ? " mk-" + ac.maker : ""}" data-live="sel:${esc(a.hex)}" id="acrow-${esc(a.hex)}"><span class="dot"></span><span class="cs">${esc(a.flight || a.r || a.hex)}</span><span class="code">${esc(a.t || "—")}</span><span class="alt">${esc(altTxt(a))}</span>${a.route && a.route.from_iata ? `<span class="rt">${esc(a.route.from_iata)}→${esc(a.route.to_iata || "?")}</span>` : `<span class="rt">${esc(a.r || "")}</span>`}</button>`;
  }
  function aircraftTab() {
    const L = shown(), demo = LV.acSrc !== "live";
    return `<div class="live-ctl"><div class="seg" role="group" aria-label="항공기 필터">${lbtn("filter:all", "전체", LV.filter === "all", "lf-all")}${lbtn("filter:ours", "수록 기종", LV.filter === "ours", "lf-ours")}${lbtn("filter:kal", "대한항공", LV.filter === "kal", "lf-kal")}</div>${LV.scope === "area" ? `<div class="seg" role="group" aria-label="조회 반경">${[100, 250, 500].map(r => lbtn("radius:" + r, r + " km", LV.radius === r, "lr-" + r)).join("")}</div>` : ""}</div>
${LV.err ? `<p class="live-err">${esc(LV.err)}</p>` : ""}
${demo ? `<p class="live-demo">${ICON.info}<span><b>예시 항공편입니다.</b> 실제 위치가 아닙니다. ${LV.net === false ? "이 게시 환경은 외부 API 호출을 막습니다. 단독 파일에서 키를 넣으면 실시간으로 바뀝니다." : "API 키를 연결하면 실시간 항공기로 바뀝니다."} <button type="button" class="linkbtn" data-live="conn" id="live-conn2">연결 방법</button></span></p>` : ""}
<div class="ac-list">${L.length ? L.map(acRow).join("") : `<p class="empty">${demo ? "예시 데이터에는 이 조건의 항공편이 없습니다. 다른 지점이나 필터를 골라 보세요." : "지금 이 조건으로 추적 중인 항공기가 없습니다."}</p>`}</div>`;
  }
  function detailView(a) {
    const fam = famOf(a.t), ac = fam ? byId[fam] : null, p = ac ? photoOf(ac) : null;
    const kv = (icon, label, val, cls) => `<div class="kv${cls ? " " + cls : ""}"><span class="lbl">${icon}${label}</span><span class="val">${val}</span></div>`;
    const kmh = typeof a.gs === "number" ? Math.round(a.gs * 1.852) : null;
    return `<div class="fp-h live-dh"><button type="button" class="btn ghost" data-live="back" id="live-back">← 전체 항공편</button>${srcBadge()}</div>
<div class="fp-list">
${p ? `<div class="fl-shot">${pimg(p, true, ac.name)}<span>${esc(ac.name)} 자료 사진</span></div>` : ""}
<div class="legs"><div class="leg"><span class="lbl">콜사인</span><span class="big">${esc(a.flight || "—")}</span><small>${esc(a.r || "")}</small></div><div class="leg"><span class="lbl">기종</span><span class="big">${esc(a.t || "—")}</span><small>${ac ? `<a class="ext" href="#${ac.id}">${esc(ac.name)}</a>` : "수록되지 않은 기종"}</small></div></div>
${a.route && a.route.from_iata ? `<div class="pstat"><div class="pstat-h"><span class="pill">${esc(phase(a))}</span><span class="val">${esc(a.route.from_iata)} → ${esc(a.route.to_iata || "?")}</span></div><p class="small muted" style="margin:0">${a.demo ? "시연용 예시 노선입니다." : "최근 7일 기록에서 가장 잦았던 노선입니다. 운항 스케줄이 아닙니다."}</p></div>` : `<div class="pstat"><div class="pstat-h"><span class="pill">${esc(phase(a))}</span></div></div>`}
<div class="kvs">${kv(ICON.gauge, "고도", esc(altTxt(a)))}${kv(ICON.gauge, "지상 속도", typeof a.gs === "number" ? `${Math.round(a.gs)} kt<small> · ${fmt(kmh)} km/h</small>` : "—")}${kv(ICON.route, "진행 방위", typeof a.track === "number" ? Math.round(a.track) + "°" : "—")}${kv(ICON.chart, "상승·강하율", typeof a.baro_rate === "number" ? fmt(a.baro_rate) + " ft/min" : "—")}${kv(ICON.info, "스퀵", esc(a.squawk || "—"))}${kv(ICON.info, "ICAO 주소", esc(a.demo ? "예시" : a.hex))}${kv(ICON.map, "위치", `${N(a.lat)}°, ${N(a.lon)}°`, "wide")}${kv(ICON.clock, "수신", a.demo ? "시연용 예시" : `${esc(String(a.type || "").indexOf("mlat") >= 0 ? "MLAT" : "ADS-B")} · ${N(a.seen_pos || 0)}초 전`, "wide")}</div>
<div class="live-sec"><button type="button" class="btn" data-live="trail" id="live-trail">${ICON.route}${a.demo ? "예시 경로 보기" : "오늘 궤적 보기"}</button>${LV.trailNote ? `<p class="small muted" style="margin:8px 0 0">${esc(LV.trailNote)}</p>` : ""}</div>
</div>`;
  }
  function livePanel() {
    const sel = LV.sel ? LV.ac.find(a => a.hex === LV.sel) : null;
    if (sel) return detailView(sel);
    const grp = (label, kind) => `<optgroup label="${label}">${PLACES.filter(p => p.kind === kind).map(p => `<option value="${p.id}" ${LV.place === p.id ? "selected" : ""}>${p.code} · ${esc(p.name)}</option>`).join("")}</optgroup>`;
    const fam = mk => `<optgroup label="${makerName(mk)}">${AIRCRAFT.filter(a => a.maker === mk).map(a => `<option value="${a.id}" ${LV.typeId === a.id ? "selected" : ""}>${ICAO[a.id]} · ${esc(a.name)}</option>`).join("")}</optgroup>`;
    const p = placeById[LV.place], n = shown().length;
    return `<div class="fp-h"><h2>${ICON.plane}실시간 운항</h2>
<div class="seg wide" role="group" aria-label="조회 방식">${lbtn("scope:area", "공역", LV.scope === "area", "ls-area")}${lbtn("scope:type", "기종 추적", LV.scope === "type", "ls-type")}</div>
${LV.scope === "area" ? `<select class="sel" id="live-place" aria-label="지점 선택">${grp("국내 공항", "kr")}${grp("보잉 조립 공장", "boeing")}${grp("에어버스 조립 공장", "airbus")}</select><p>${esc(p.sub)}</p>
<div class="tabs">${lbtn("tab:traffic", "24시간 교통량", LV.tab === "traffic", "lt-traffic")}${lbtn("tab:aircraft", `항공기 ${n}`, LV.tab === "aircraft", "lt-aircraft")}</div>`
        : `<select class="sel" id="live-type" aria-label="기종 선택">${fam("boeing")}${fam("airbus")}</select><p>이 기종으로 지금 추적 중인 기체를 네트워크 전체에서 찾습니다. ${FAMILY_CODES[LV.typeId].map(c => `<span class="code">${c}</span>`).join(" ")}</p>`}</div>
<div class="fp-list">${LV.scope === "area" && LV.tab === "traffic" ? trafficTab() : aircraftTab()}</div>
<div class="fp-f">${esc(FIA_CREDIT)}</div>`;
  }
  function connCard() {
    const netTxt = LV.net === true ? `<span class="pill ok">가능</span>` : LV.net === false ? `<span class="pill off">차단됨</span> 이 게시 환경은 외부 호출을 막습니다` : `<span class="pill off">확인 중</span>`;
    return `${cardH(ICON.info, "FlyItalyADSB API 연결", `<button type="button" class="btn ghost" data-live="conn" id="live-conn-x">닫기</button>`)}<div class="card-b conn">
<div class="conn-col"><dl class="facts"><div><dt class="lbl">외부 API 호출</dt><dd>${netTxt}</dd></div><div><dt class="lbl">24시간 교통량 (키 불필요)</dt><dd>${LV.net === true ? "실시간으로 받아 옵니다" : "수집해 둔 스냅샷을 보여 줍니다"}</dd></div><div><dt class="lbl">실시간 항공기 (키 필요)</dt><dd>${LV.acSrc === "live" ? "실시간 연결됨" : LV.key ? "키 저장됨. 아직 연결 전이거나 호출이 막혀 있습니다" : "키 없음. 예시 항공편을 보여 줍니다"}</dd></div>${LV.usage ? `<div><dt class="lbl">이번 달 사용량</dt><dd class="val">${esc(LV.usage.used || "?")} / ${esc(LV.usage.quota || "?")} · ${esc(LV.usage.plan || "")}</dd></div>` : ""}</dl>
<form id="fia-form" class="keyform" autocomplete="off"><label class="lbl" for="fia-key">내 API 키 (X-Api-Key)</label><div class="keyrow"><input id="fia-key" type="password" placeholder="발급받은 키를 붙여 넣으세요" autocomplete="off" spellcheck="false"><button type="submit" class="btn" id="fia-save">저장하고 연결</button>${LV.key ? `<button type="button" class="btn ghost" data-live="keydel" id="fia-del">키 삭제</button>` : ""}</div><p class="small muted">키는 이 브라우저의 저장소에만 남고 FlyItalyADSB 외의 어디로도 보내지 않습니다. 여러 사람이 쓰는 공개 사이트라면 키를 페이지에 두지 말고 서버에서 호출하세요.</p></form></div>
<div class="conn-col"><h3>연결 순서</h3><ol class="steps"><li><a class="ext" href="https://flyitalyadsb.com/data/api/#api-key" target="_blank" rel="noopener">flyitalyadsb.com/data/api</a>에서 이메일을 넣고, 받은 링크에서 키를 확인합니다. 무료이며 승인 절차가 없습니다.</li><li>첨부된 단독 파일(jetliner-hub.html)을 PC나 내 서버에서 엽니다. 이 게시 링크에서는 외부 호출이 막혀 있습니다.</li><li>이 화면에 키를 붙여 넣고 저장합니다. 항공기 목록이 30초마다 실시간으로 바뀝니다.</li></ol>
<p class="lbl" style="margin-top:12px">무료 키 한도</p><p class="small">분당 30회 · 월 30만 회 · 한 번에 반경 500 km. 이 화면은 공역 조회에 30초마다 1회, 기종 추적에 60초마다 형식당 1회를 씁니다.</p>
<p class="lbl" style="margin-top:12px">이 화면이 부르는 주소</p><pre class="codeblk">GET ${FIA}/api/coverage?lat=37.46&amp;lon=126.44&amp;radius=100
GET ${FIA}/v2/lat/37.46/lon/126.44/dist/250?with=route
GET ${FIA}/v2/type/B748?with=route
GET ${FIA}/v2/history/{hex}/{YYYY-MM-DD}
헤더  X-Api-Key: 내 키   (첫 줄은 키 없이 호출)</pre></div></div>`;
  }

  /* ---------- 지도 위 그리기 ---------- */
  const PLANE = "M0 -8 L1.5 -3.2 L8 1.4 L8 3 L1.6 1.3 L1.2 5.4 L3.3 7 L3.3 8.1 L0 7.2 L-3.3 8.1 L-3.3 7 L-1.2 5.4 L-1.6 1.3 L-8 3 L-8 1.4 L-1.5 -3.2Z";
  function heatSteps(cv) { if (cv.steps) return cv.steps; const v = cv.d.cells.map(c => c[2]).sort((a, b) => a - b), q = f => v[Math.min(v.length - 1, Math.floor(v.length * f))] || 0; cv.steps = [q(0.35), q(0.6), q(0.8), q(0.93)]; return cv.steps; }
  function drawLive() {
    const ov = $("#live-ov"), m = liveMap; if (!ov || !m) return;
    const W = ov.clientWidth, H = ov.clientHeight; ov.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const P = (lat, lon) => m.coordsToPoint(lat, lon) || null, inV = q => q && q.x > -30 && q.x < W + 30 && q.y > -30 && q.y < H + 30;
    let o = "";
    const pl = placeById[LV.place], c0 = P(pl.lat, pl.lon), c1 = P(pl.lat, pl.lon + 1), pxDeg = c0 && c1 ? Math.abs(c1.x - c0.x) : 0;
    if (LV.scope === "area") {
      const cv = coverOf(pl.id);
      if (cv && LV.tab === "traffic" && !LV.sel && pxDeg > 12) {
        const st = heatSteps(cv), h = cv.d.deg / 2;
        cv.d.cells.forEach(c => { const a = P(c[0] / 100 + h, c[1] / 100 - h), b = P(c[0] / 100 - h, c[1] / 100 + h); if (!a || !b || !inV(a)) return; const k = c[2] > st[3] ? 5 : c[2] > st[2] ? 4 : c[2] > st[1] ? 3 : c[2] > st[0] ? 2 : 1; o += `<rect class="hc h${k}" x="${N(a.x)}" y="${N(a.y)}" width="${N(Math.max(1, b.x - a.x - 0.6))}" height="${N(Math.max(1, b.y - a.y - 0.6))}"/>`; });
      }
      const ring = (km, cls) => { let d = ""; for (let i = 0; i <= 60; i++) { const g = destPt(pl.lat, pl.lon, i * 6, km), q = P(g[0], g[1]); if (!q) return ""; d += (i ? "L" : "M") + N(q.x) + " " + N(q.y); } const t = P.apply(null, destPt(pl.lat, pl.lon, 0, km)); return `<path class="ring ${cls}" d="${d}Z"/>${t ? `<text class="ringlab" x="${N(t.x)}" y="${N(t.y - 4)}" text-anchor="middle">${km} km</text>` : ""}`; };
      if (pxDeg > 6) { o += ring(100, "r1"); if (LV.tab === "aircraft" || LV.sel) o += ring(LV.radius, "r2"); }
      if (c0) o += `<g class="here"><circle cx="${N(c0.x)}" cy="${N(c0.y)}" r="5"/><text x="${N(c0.x + 9)}" y="${N(c0.y + 4)}">${pl.code}</text></g>`;
    }
    if (pxDeg > 14) Object.keys(AP).forEach(k => { if (k === pl.code) return; const q = P(AP[k][0], AP[k][1]); if (inV(q)) o += `<g class="apt"><rect x="${N(q.x - 2.5)}" y="${N(q.y - 2.5)}" width="5" height="5"/><text x="${N(q.x + 6)}" y="${N(q.y + 4)}">${k}</text></g>`; });
    if (LV.trail && LV.trail.length > 1) { let d = "", pen = false, prev = null; LV.trail.forEach(t => { const q = P(t[0], t[1]); if (!q || (prev && Math.abs(q.x - prev.x) > W * 0.6)) { pen = false; prev = q; return; } d += (pen ? "L" : "M") + N(q.x) + " " + N(q.y); pen = true; prev = q; }); if (d) o += `<path class="trail" d="${d}"/>`; }
    const showAc = LV.scope === "type" || LV.tab === "aircraft" || LV.sel;
    if (showAc) shown().forEach(a => { const q = P(a.lat, a.lon); if (!inV(q)) return; const fam = famOf(a.t), ac = fam ? byId[fam] : null, on = LV.sel === a.hex;
      o += `<g class="plane${ac ? " mk-" + ac.maker : ""}${on ? " on" : ""}" data-live="sel:${esc(a.hex)}" data-tip="${esc(`<b>${esc(a.flight || a.r || a.hex)}</b> · ${esc(a.t || "?")}<br>${esc(altTxt(a))} · ${typeof a.gs === "number" ? Math.round(a.gs) + " kt" : ""}${a.demo ? "<br>예시 항공편" : ""}`)}" transform="translate(${N(q.x)} ${N(q.y)})">${on ? `<circle class="selring" r="15"/>` : ""}<circle class="hitc" r="11"/><path d="${PLANE}" transform="rotate(${Math.round(a.track || 0)}) scale(${on ? 1.35 : 1})"/>${on ? `<text y="-20" text-anchor="middle">${esc(a.flight || a.r || "")}</text>` : ""}</g>`; });
    ov.innerHTML = o;
  }
  const queueDraw = () => { if (liveRaf) return; liveRaf = requestAnimationFrame(() => { liveRaf = 0; drawLive(); }); };
  function focusLive(animate) {
    const m = liveMap; if (!m) return;
    try {
      if (LV.scope === "type" && !LV.sel) { m.setFocus({ coords: [30, 20], scale: 1, animate: !!animate }); return; }
      const sel = LV.sel ? LV.ac.find(a => a.hex === LV.sel) : null, pl = placeById[LV.place], lat = sel ? sel.lat : pl.lat, lon = sel ? sel.lon : pl.lon;
      const a = m.coordsToPoint(lat, lon), b = m.coordsToPoint(lat, lon + 1); if (!a || !b) return;
      const pxKm = Math.abs(b.x - a.x) / (111.3 * Math.cos(toR(lat))), span = (LV.scope === "type" ? 1500 : (LV.tab === "traffic" && !sel ? 130 : LV.radius * 1.15)) * 2;
      const want = Math.min(m.container.offsetWidth, m.container.offsetHeight * 1.5) / (span * pxKm);
      m.setFocus({ coords: [lat, lon], scale: Math.max(1, (m.scale / m._baseScale) * want), animate: !!animate });
    } catch (e) { /* 초점 이동 실패는 무시 */ }
  }

  /* ---------- 화면 갱신 ---------- */
  function paintLive() {
    const pn = $("#live-panel"); if (!pn) return;
    const keep = pn.querySelector(".fp-list"), vk = LV.sel ? "detail" : LV.scope + ":" + LV.tab, y = keep && pn.getAttribute("data-vk") === vk ? keep.scrollTop : 0; pn.setAttribute("data-vk", vk);
    pn.innerHTML = livePanel(); const nl = pn.querySelector(".fp-list"); if (nl) nl.scrollTop = y;
    const bd = $("#live-badge"); if (bd) { const liveAc = LV.acSrc === "live", liveCv = LV.net === true; bd.className = "pill " + (liveAc || liveCv ? "ok" : "off"); bd.textContent = liveAc ? "LIVE" : liveCv ? "교통량 LIVE · 항공기 예시" : LV.net === false ? "스냅샷 · 예시" : "확인 중"; }
    const cc = $("#live-conn-card"); if (cc) { cc.hidden = !LV.conn; if (LV.conn && !cc.contains(document.activeElement)) cc.innerHTML = connCard(); }
    queueDraw();
  }
  async function refreshLive(what) {
    if (LV.busy) return; LV.busy = true;
    try { if (what !== "ac" && LV.scope === "area") await loadCover(LV.place, what === "force"); if (what !== "cover") await loadAircraft(); if (LV.sel && !LV.ac.some(a => a.hex === LV.sel)) { LV.sel = null; LV.trail = null; LV.trailNote = ""; } }
    finally { LV.busy = false; }
    if ($("#live-panel")) paintLive();
  }
  function wireLive() {
    if (liveWired) return; liveWired = true;
    document.addEventListener("click", async e => {
      const el = e.target.closest("[data-live]"); if (!el) return;
      const v = el.getAttribute("data-live"), i = v.indexOf(":"), act = i < 0 ? v : v.slice(0, i), arg = i < 0 ? "" : v.slice(i + 1);
      if (act === "goto") { const parts = arg.split("/"); LV.scope = parts[0]; if (parts[0] === "type") { LV.typeId = parts[1]; LV.tab = "aircraft"; } else { LV.place = parts[1]; } LV.sel = null; LV.trail = null; saveLive(); if (location.hash === "#live") { paintLive(); focusLive(true); refreshLive(); } else location.hash = "live"; return; }
      if (!$("#live-panel")) return;
      if (act === "conn") { LV.conn = !LV.conn; paintLive(); if (LV.conn) { const c = $("#live-conn-card"); if (c) c.scrollIntoView({ block: "nearest" }); } return; }
      if (act === "keydel") { LV.key = ""; try { localStorage.removeItem("hub-fia-key"); } catch (er) { /* 무시 */ } LV.usage = null; const c = $("#live-conn-card"); if (c) c.innerHTML = connCard(); refreshLive("ac"); return; }
      if (act === "scope") { LV.scope = arg; LV.sel = null; LV.trail = null; if (arg === "type") LV.tab = "aircraft"; paintLive(); focusLive(true); refreshLive(); return; }
      if (act === "tab") { LV.tab = arg; paintLive(); focusLive(true); if (arg === "aircraft") refreshLive("ac"); return; }
      if (act === "filter") { LV.filter = arg; paintLive(); return; }
      if (act === "radius") { LV.radius = +arg; saveLive(); paintLive(); focusLive(true); refreshLive("ac"); return; }
      if (act === "sel") { LV.sel = arg; LV.trail = null; LV.trailNote = ""; paintLive(); focusLive(true); return; }
      if (act === "back") { LV.sel = null; LV.trail = null; LV.trailNote = ""; paintLive(); focusLive(true); return; }
      if (act === "trail") { const a = LV.ac.find(x => x.hex === LV.sel); if (a) { await loadTrail(a); paintLive(); } }
    });
    document.addEventListener("change", e => {
      if (e.target.id === "live-place") { LV.place = e.target.value; LV.sel = null; LV.trail = null; saveLive(); paintLive(); focusLive(true); refreshLive(); }
      if (e.target.id === "live-type") { LV.typeId = e.target.value; LV.sel = null; LV.trail = null; paintLive(); focusLive(true); refreshLive("ac"); }
    });
    document.addEventListener("submit", e => {
      if (e.target.id !== "fia-form") return; e.preventDefault();
      const v = String($("#fia-key").value || "").trim(); if (!v) return;
      LV.key = v; try { localStorage.setItem("hub-fia-key", v); } catch (er) { /* 무시 */ }
      $("#fia-key").value = ""; LV.tab = "aircraft"; refreshLive("ac").then(() => { const c = $("#live-conn-card"); if (c) c.innerHTML = connCard(); });
    });
    document.addEventListener("visibilitychange", () => { if (!document.hidden && $("#live-panel")) refreshLive(); });
  }
  function renderLive() {
    return `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / Flight Center</div><h1>실시간 운항 <span class="pill off" id="live-badge">확인 중</span></h1><p>FlyItalyADSB 수신 네트워크가 지금 보고 있는 항공기와 지난 24시간의 교통량입니다. 지점을 고르면 그 공역으로, 기종을 고르면 전 세계로 지도가 맞춰집니다.</p></div><div class="actions"><button type="button" class="btn ghost" data-live="conn" id="live-conn">${ICON.info}API 연결</button></div></header>
<section class="card" id="live-conn-card" hidden></section>
<section class="card livecard" id="livecard"><div class="mapwrap livewrap"><div id="livemap" class="sitemap livemap" role="img" aria-label="실시간 항공기 지도"></div><svg id="live-ov" class="live-ov"></svg><div class="float-panel live-panel" id="live-panel"></div></div></section>`;
  }
  function initLive() {
    wireLive(); stopLive();
    const el = $("#livemap"); liveMap = null; if (!el) return;
    document.querySelectorAll(".jvm-tooltip").forEach(n => n.remove());
    if (typeof jsVectorMap !== "undefined") {
      try {
        liveMap = new jsVectorMap({ selector: "#livemap", map: "world", backgroundColor: "transparent", zoomButtons: true, zoomOnScroll: true, zoomMax: 400, zoomStep: 1.6, showTooltip: false, regionStyle: { initial: { fill: "#48535f", stroke: "none" }, hover: { fillOpacity: 1, cursor: "grab" } } });
        const orig = liveMap._applyTransform; liveMap._applyTransform = function () { const r = orig.apply(this, arguments); queueDraw(); return r; };
      } catch (e) { liveMap = null; }
    }
    if (!liveMap) { const c = $("#livecard"); if (c) c.classList.add("nomap"); }
    coverOf(LV.place); if (LV.acSrc === "none") { LV.ac = demoFor(); LV.acSrc = "demo"; }
    paintLive(); setTimeout(() => { focusLive(false); queueDraw(); }, 60);
    refreshLive();
    liveTimer = setInterval(() => {
      if (!$("#live-panel")) { stopLive(); return; } if (document.hidden) return;
      LV.tick++;
      if (LV.acSrc === "demo") { if (LV.tick % 3 === 0) { LV.ac = demoFor(); if (LV.sel && !LV.ac.some(a => a.hex === LV.sel)) LV.sel = null; if (LV.sel) paintLive(); else queueDraw(); } if (LV.tick % 60 === 0 && LV.key) refreshLive("ac"); }
      else if (LV.tick % (LV.scope === "type" ? 60 : 30) === 0) refreshLive("ac");
      if (LV.tick % 120 === 0 && LV.net) refreshLive("cover");
    }, 1000);
  }
  function stopLive() { if (liveTimer) { clearInterval(liveTimer); liveTimer = null; } }

  /* ---------- 대시보드 · 기종 페이지 조각 ---------- */
  function liveTile(id) {
    const p = placeById[id], cv = coverOf(id), d = cv ? cv.d : null;
    return `<button type="button" class="lv-tile" data-live="goto:area/${id}" id="lv-${id}"><span class="lv-top"><span class="box-code">${p.code}</span><span class="pill ${cv && cv.src === "live" ? "ok" : "off"}">${cv && cv.src === "live" ? "LIVE" : "스냅샷"}</span></span><span class="lv-name">${esc(p.name)}</span><span class="lv-n">${d ? fmt(d.now || 0) : "—"}<small>대 추적 중</small></span>${d ? sparkline(d.hourly) : ""}<span class="box-meta">24시간 ${d ? fmt(d.a24 || 0) : "—"}대 · 최대 ${d ? fmt(d.peak || 0) : "—"}대/시</span></button>`;
  }
  function liveStrip() {
    const cv = coverOf("icn");
    return `<section class="card c12" id="live-strip">${cardH(ICON.plane, "실시간 공역", `<span class="hint">${cv ? esc(kst(cv.d.g)) + " 기준 · " : ""}반경 100 km</span><a class="ext small" href="#live">지도에서 보기 →</a>`)}<div class="lv-tiles" id="lv-tiles">${["icn", "gmp", "cju", "pus"].map(liveTile).join("")}</div><p class="lv-credit">${esc(FIA_CREDIT)}</p></section>`;
  }
  async function initHomeLive() {
    if (LV.net === false) return;
    for (const id of ["icn", "gmp", "cju", "pus"]) { await loadCover(id); if (LV.net === false || !$("#lv-tiles")) return; $("#lv-tiles").innerHTML = ["icn", "gmp", "cju", "pus"].map(liveTile).join(""); await new Promise(r => setTimeout(r, 2300)); }
  }
  function acLiveCard(ac) {
    return `<section class="card" id="ac-live">${cardH(ICON.plane, "지금 하늘에", `<span class="hint">FlyItalyADSB</span>`)}<div class="card-b aclive"><div><p class="lbl">추적하는 ICAO 형식 코드</p><p style="margin:4px 0 0">${FAMILY_CODES[ac.id].map(c => `<span class="code">${c}</span>`).join(" ")}</p><p class="small muted" id="ac-live-n" style="margin:8px 0 0">${LV.key && LV.net !== false ? "지금 추적 중인 대수를 불러오는 중입니다." : "API 키를 연결하면 지금 추적 중인 대수가 여기에 나옵니다."}</p></div><button type="button" class="btn" data-live="goto:type/${ac.id}" id="ac-live-go">${ICON.map}전 세계 지도에서 보기</button></div></section>`;
  }
  async function initAcLive(ac) {
    wireLive(); const out = $("#ac-live-n"); if (!out || !LV.key || LV.net === false) return;
    try { let n = 0, kal = 0; for (const code of FAMILY_CODES[ac.id]) { const d = await fia(`/v2/type/${code}?fields=hex,flight`); n += (d.ac || []).length; kal += (d.ac || []).filter(a => String(a.flight || "").indexOf("KAL") === 0).length; }
      const o2 = $("#ac-live-n"); if (o2) o2.innerHTML = `<span class="pill ok">LIVE</span> 지금 <b>${fmt(n)}대</b>를 추적 중입니다${kal ? `. 그중 대한항공 ${fmt(kal)}대` : ""}.`; }
    catch (e) { const o3 = $("#ac-live-n"); if (o3) o3.textContent = errText(e); }
  }
