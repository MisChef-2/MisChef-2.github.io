
  /* ================= 파일럿 허브 =================
     가상 항공사 조종사 포털: 비행 예약 → PIREP 제출 → 통계·계급·활동. 기록은 조종사 본인 것만 저장한다.
     저장: Claude 계정의 개인 문서(data/users/<id>/logbook)가 있으면 거기에, 없으면 이 브라우저 저장소에 둔다. */
  const VA = { name: "Jetliner Virtual", code: "JLV" };
  const APT = [
    ["ICN", "RKSI", "인천", "KR", 37.4602, 126.4407], ["GMP", "RKSS", "김포", "KR", 37.5583, 126.7906], ["CJU", "RKPC", "제주", "KR", 33.5113, 126.493], ["PUS", "RKPK", "김해 (부산)", "KR", 35.1795, 128.9382], ["TAE", "RKTN", "대구", "KR", 35.894, 128.659], ["CJJ", "RKTU", "청주", "KR", 36.717, 127.499], ["KWJ", "RKJJ", "광주", "KR", 35.126, 126.809],
    ["NRT", "RJAA", "도쿄 나리타", "JP", 35.7647, 140.3864], ["HND", "RJTT", "도쿄 하네다", "JP", 35.5494, 139.7798], ["KIX", "RJBB", "오사카 간사이", "JP", 34.4347, 135.2441], ["FUK", "RJFF", "후쿠오카", "JP", 33.5859, 130.4507], ["CTS", "RJCC", "삿포로 신치토세", "JP", 42.7752, 141.6923], ["OKA", "ROAH", "오키나와 나하", "JP", 26.1958, 127.6459], ["NGO", "RJGG", "나고야 주부", "JP", 34.8584, 136.8054],
    ["PEK", "ZBAA", "베이징 서우두", "CN", 40.0801, 116.5846], ["PVG", "ZSPD", "상하이 푸둥", "CN", 31.1434, 121.8052], ["CAN", "ZGGG", "광저우", "CN", 23.3924, 113.2988], ["SZX", "ZGSZ", "선전", "CN", 22.6393, 113.8107], ["HKG", "VHHH", "홍콩", "HK", 22.308, 113.9185], ["TPE", "RCTP", "타이베이 타오위안", "TW", 25.0777, 121.2328],
    ["SIN", "WSSS", "싱가포르 창이", "SG", 1.3644, 103.9915], ["BKK", "VTBS", "방콕 수완나품", "TH", 13.69, 100.7501], ["SGN", "VVTS", "호찌민", "VN", 10.8188, 106.652], ["HAN", "VVNB", "하노이", "VN", 21.2212, 105.8072], ["DAD", "VVDN", "다낭", "VN", 16.0439, 108.1992], ["MNL", "RPLL", "마닐라", "PH", 14.5086, 121.0198], ["CEB", "RPVM", "세부", "PH", 10.3075, 123.9794], ["KUL", "WMKK", "쿠알라룸푸르", "MY", 2.7456, 101.7099], ["DPS", "WADD", "발리 덴파사르", "ID", -8.7482, 115.1672], ["CGK", "WIII", "자카르타", "ID", -6.1256, 106.6559],
    ["DEL", "VIDP", "델리", "IN", 28.5562, 77.1], ["BOM", "VABB", "뭄바이", "IN", 19.0896, 72.8656], ["DXB", "OMDB", "두바이", "AE", 25.2532, 55.3657], ["DOH", "OTHH", "도하", "QA", 25.2731, 51.6081], ["IST", "LTFM", "이스탄불", "TR", 41.2753, 28.7519],
    ["LHR", "EGLL", "런던 히스로", "GB", 51.47, -0.4543], ["CDG", "LFPG", "파리 샤를 드골", "FR", 49.0097, 2.5479], ["FRA", "EDDF", "프랑크푸르트", "DE", 50.0379, 8.5622], ["MUC", "EDDM", "뮌헨", "DE", 48.3537, 11.775], ["AMS", "EHAM", "암스테르담", "NL", 52.3105, 4.7683], ["FCO", "LIRF", "로마 피우미치노", "IT", 41.8003, 12.2389], ["MAD", "LEMD", "마드리드", "ES", 40.4983, -3.5676], ["BCN", "LEBL", "바르셀로나", "ES", 41.2974, 2.0833], ["ZRH", "LSZH", "취리히", "CH", 47.4582, 8.5555], ["VIE", "LOWW", "빈", "AT", 48.1103, 16.5697], ["PRG", "LKPR", "프라하", "CZ", 50.1008, 14.26],
    ["LAX", "KLAX", "로스앤젤레스", "US", 33.9416, -118.4085], ["SFO", "KSFO", "샌프란시스코", "US", 37.6213, -122.379], ["SEA", "KSEA", "시애틀", "US", 47.4502, -122.3088], ["LAS", "KLAS", "라스베이거스", "US", 36.084, -115.1537], ["DFW", "KDFW", "댈러스", "US", 32.8998, -97.0403], ["ORD", "KORD", "시카고 오헤어", "US", 41.9742, -87.9073], ["ATL", "KATL", "애틀랜타", "US", 33.6407, -84.4277], ["JFK", "KJFK", "뉴욕 JFK", "US", 40.6413, -73.7781], ["IAD", "KIAD", "워싱턴 덜레스", "US", 38.9531, -77.4565], ["BOS", "KBOS", "보스턴", "US", 42.3656, -71.0096], ["HNL", "PHNL", "호놀룰루", "US", 21.3245, -157.9251], ["GUM", "PGUM", "괌", "US", 13.4834, 144.796],
    ["YVR", "CYVR", "밴쿠버", "CA", 49.1967, -123.1815], ["YYZ", "CYYZ", "토론토", "CA", 43.6777, -79.6248], ["SYD", "YSSY", "시드니", "AU", -33.9399, 151.1753], ["BNE", "YBBN", "브리즈번", "AU", -27.3842, 153.1175], ["AKL", "NZAA", "오클랜드", "NZ", -37.0082, 174.785],
    ["PAE", "KPAE", "에버렛 페인 필드", "US", 47.9063, -122.2816], ["TLS", "LFBO", "툴루즈", "FR", 43.6291, 1.3638], ["XFW", "EDHI", "함부르크 핀켄베르더", "DE", 53.5353, 9.8356]
  ];
  const CCN = { KR: "대한민국", JP: "일본", CN: "중국", HK: "홍콩", TW: "대만", SG: "싱가포르", TH: "태국", VN: "베트남", PH: "필리핀", MY: "말레이시아", ID: "인도네시아", IN: "인도", AE: "아랍에미리트", QA: "카타르", TR: "튀르키예", GB: "영국", FR: "프랑스", DE: "독일", NL: "네덜란드", IT: "이탈리아", ES: "스페인", CH: "스위스", AT: "오스트리아", CZ: "체코", US: "미국", CA: "캐나다", AU: "호주", NZ: "뉴질랜드" };
  const aptBy = {}; APT.forEach(a => { aptBy[a[0]] = { iata: a[0], icao: a[1], name: a[2], cc: a[3], lat: a[4], lon: a[5] }; });
  const aptKm = (a, b) => Math.round(distKm([aptBy[a].lat, aptBy[a].lon], [aptBy[b].lat, aptBy[b].lon]));
  const aptText = a => (a[0] + " " + a[1] + " " + a[2] + " " + (CCN[a[3]] || "")).toLowerCase();
  const aircraftKmh = ac => { const m = /([0-9][0-9,]*) km/.exec(ac.specs.cruise || ""); return m ? +m[1].replace(/,/g, "") : 850; };
  const eteMin = (km, ac) => Math.round(km / aircraftKmh(ac) * 60 + 25);
  const fuelKg = (km, ac) => Math.round(ac.specs.mtow * 0.035 * km / 50) * 50;
  function flightNo(dep, arr) { let h = 0; (dep + arr).split("").forEach(c => { h = (h * 31 + c.charCodeAt(0)) % 9000; }); return VA.code + (100 + h % 900); }
  const hm = min => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? `${h}시간 ${m}분` : `${m}분`; };
  const dayKo = iso => { const d = new Date(iso); return isNaN(d) ? "—" : `${d.getMonth() + 1}월 ${d.getDate()}일`; };
  const RANKS = [[0, "훈련 부기장"], [10, "부기장"], [50, "선임 부기장"], [150, "기장"], [400, "선임 기장"], [1000, "수석 기장"]];
  const TOURS = [
    { name: "한반도 일주", desc: "국내선 네 구간을 이어서 비행합니다.", legs: [["GMP", "CJU"], ["CJU", "PUS"], ["PUS", "GMP"], ["GMP", "KWJ"]] },
    { name: "태평양 횡단", desc: "도쿄와 하와이를 거쳐 미국 서해안까지 갔다가 돌아옵니다.", legs: [["ICN", "NRT"], ["NRT", "HNL"], ["HNL", "LAX"], ["LAX", "ICN"]] },
    { name: "유럽 그랜드 투어", desc: "유럽의 주요 허브 네 곳을 돕니다.", legs: [["ICN", "FRA"], ["FRA", "CDG"], ["CDG", "LHR"], ["LHR", "FCO"], ["FCO", "ICN"]] },
    { name: "조립 공장 순례", desc: "보잉과 에어버스의 최종 조립 공장이 있는 도시를 찾아갑니다.", legs: [["ICN", "SEA"], ["SEA", "PAE"], ["JFK", "TLS"], ["TLS", "XFW"]] }
  ];
  const ROSTER = [["예시 조종사 A", 6120, 48], ["예시 조종사 B", 4385, 36], ["예시 조종사 C", 2910, 23], ["예시 조종사 D", 1540, 12], ["예시 조종사 E", 620, 5]];

  const VA_NOTAMS = [
    { p: "high", date: "점수 규칙", title: "PIREP 점수는 이렇게 매깁니다", text: "기본 100점에 착륙률과 비행 시간 보너스를 더합니다. 500 fpm을 넘는 착륙은 30점이 깎입니다.", href: "flights" },
    { p: "med", date: "활동", title: "투어 4개와 도전 과제 4개", text: "한반도 일주부터 조립 공장 순례까지, 제출한 PIREP으로 자동 집계됩니다.", href: "activities" },
    { p: "med", date: "실시간", title: "공항 주변 교통량", text: "국내 공항 4곳과 조립 공장 9곳의 실제 교통량을 FlyItalyADSB 데이터로 보여 줍니다.", href: "live" },
    { p: "low", date: "자료실", title: "기종 백과 21개 기종", text: "보잉과 에어버스 여객기의 제원, 축척 도면, 개발사를 자료실에서 볼 수 있습니다.", href: "fleet" }
  ];

  /* ---------- 점수와 기록 ---------- */
  function scorePirep(p) {
    const rows = [["기본 점수", 100]], l = Math.abs(p.land), h = p.time / 60;
    rows.push(l <= 100 ? ["부드러운 착륙 (100 fpm 이하)", 30] : l <= 200 ? ["착륙 200 fpm 이하", 20] : l <= 300 ? ["착륙 300 fpm 이하", 10] : l <= 500 ? ["착륙 500 fpm 이하", 0] : ["거친 착륙 (500 fpm 초과)", -30]);
    rows.push(h < 2 ? ["2시간 미만 비행", 10] : h < 5 ? ["2~5시간 비행", 25] : ["5시간 이상 비행", 50]);
    return { rows: rows, total: rows.reduce((s, r) => s + r[1], 0) };
  }
  function mkPirep(id, dep, arr, acId, land, daysAgo, demo) {
    const ac = byId[acId], km = aptKm(dep, arr), p = { id: id, dep: dep, arr: arr, ac: acId, cs: flightNo(dep, arr), km: km, time: eteMin(km, ac), land: land, fuel: fuelKg(km, ac), pax: Math.round(ac.specs.seats * 0.84), cargo: Math.round(ac.specs.mtow * 22), filed: new Date(Date.now() - daysAgo * 86400000).toISOString(), notes: "" };
    if (demo) p.demo = true; p.points = scorePirep(p).total; return p;
  }
  function defaultState() {
    return { v: 1, updated: 0, demo: true, pilot: { name: "", num: 1, loc: "ICN", units: "km", joined: new Date().toISOString().slice(0, 10) }, booking: null,
      pireps: [mkPirep("d6", "NRT", "ICN", "airbus-a320neo", -96, 2, true), mkPirep("d5", "ICN", "NRT", "airbus-a320neo", -168, 4, true), mkPirep("d4", "CJU", "GMP", "boeing-737max", -142, 7, true), mkPirep("d3", "GMP", "CJU", "boeing-737max", -231, 7, true), mkPirep("d2", "LAX", "ICN", "boeing-747", -305, 10, true), mkPirep("d1", "ICN", "LAX", "boeing-747", -188, 12, true)] };
  }
  const PS_KEY = "hub-pilot-v1";
  const okState = s => !!(s && s.v === 1 && s.pilot && Array.isArray(s.pireps));
  function loadLocal() { try { const s = JSON.parse(localStorage.getItem(PS_KEY) || "null"); if (okState(s)) return s; } catch (e) { /* 저장소 없음 */ } return null; }
  let PS = loadLocal() || defaultState();
  if (!aptBy[PS.pilot.loc]) PS.pilot.loc = "ICN";
  let remoteDoc = null, remoteBusy = false, remoteDirty = false, remoteTimer = 0, syncState = "local";
  const putLocal = () => { try { localStorage.setItem(PS_KEY, JSON.stringify(PS)); } catch (e) { /* 무시 */ } };
  function saveState() { PS.updated = Date.now(); putLocal(); queueRemote(); }
  function queueRemote() { if (!remoteDoc) return; remoteDirty = true; if (remoteBusy) return; clearTimeout(remoteTimer); remoteTimer = setTimeout(flushRemote, 700); }
  async function flushRemote() {
    if (!remoteDoc || remoteBusy || !remoteDirty) return; remoteBusy = true; remoteDirty = false;
    try { await remoteDoc.set(JSON.parse(JSON.stringify(PS))); syncState = "synced"; } catch (e) { syncState = "error"; }
    remoteBusy = false; paintSync(); if (remoteDirty) queueRemote();
  }
  async function initRemote() {
    if (!window.claude || typeof window.claude.use !== "function") return;
    try {
      const got = await Promise.all([window.claude.use("db"), window.claude.use("user")]), db = got[0], user = got[1]; if (!db || !user) return;
      const uid = await user.id(); if (!uid) return;
      remoteDoc = db.doc("data/users/" + uid + "/logbook"); syncState = "syncing"; paintSync(); setTimeout(() => { if (syncState === "syncing") { syncState = "error"; paintSync(); } }, 10000);
      const snap = await remoteDoc.get(), d = snap.exists ? snap.data() : null;
      if (okState(d) && (d.updated || 0) >= (PS.updated || 0)) { PS = JSON.parse(JSON.stringify(d)); if (!aptBy[PS.pilot.loc]) PS.pilot.loc = "ICN"; putLocal(); syncState = "synced"; route(true); }
      else { syncState = "synced"; if (PS.updated) queueRemote(); }
    } catch (e) { syncState = "error"; }
    paintSync();
  }
  const syncText = () => syncState === "synced" ? "Claude 계정에 저장됨" : syncState === "syncing" ? "기록을 불러오는 중" : syncState === "readonly" ? "이 계정으로는 저장할 수 없습니다. 이 브라우저에만 남습니다" : syncState === "error" ? "계정 저장소에 연결하지 못했습니다. 이 브라우저에만 남습니다" : "이 브라우저에 저장됨";
  function paintSync() { document.querySelectorAll("[data-sync]").forEach(el => { el.className = "sync " + (syncState === "synced" ? "ok" : syncState === "error" || syncState === "readonly" ? "err" : ""); el.textContent = syncText(); }); }
  const distTxt = km => PS.pilot.units === "nm" ? `${fmt(Math.round(km / 1.852))} NM` : `${fmt(Math.round(km))} km`;
  function pstats(days) {
    const t0 = days ? Date.now() - days * 86400000 : 0, L = PS.pireps.filter(p => new Date(p.filed).getTime() >= t0), sum = k => L.reduce((s, p) => s + (+p[k] || 0), 0);
    return { n: L.length, pts: sum("points"), min: sum("time"), km: sum("km"), pax: sum("pax"), freight: sum("cargo"), fuel: sum("fuel"), land: L.length ? Math.round(sum("land") / L.length) : 0 };
  }
  function rankOf(min) { const h = min / 60; let i = 0; RANKS.forEach((r, k) => { if (h >= r[0]) i = k; }); const nx = RANKS[i + 1] || null; return { name: RANKS[i][1], next: nx ? nx[1] : null, pct: nx ? Math.min(100, (h - RANKS[i][0]) / (nx[0] - RANKS[i][0]) * 100) : 100, left: nx ? Math.max(0, nx[0] - h) : 0 }; }
  function badgeList() {
    const L = PS.pireps, types = new Set(L.map(p => p.ac)), apts = new Set(); L.forEach(p => { apts.add(p.dep); apts.add(p.arr); });
    return [["첫 비행", "첫 PIREP 제출", L.length >= 1], ["버터 랜딩", "100 fpm 이하로 착륙", L.some(p => Math.abs(p.land) <= 100)], ["장거리 비행", "8,000 km 이상 구간", L.some(p => p.km >= 8000)], ["기종 수집가", "서로 다른 기종 5개", types.size >= 5], ["세계 여행자", "공항 10곳 방문", apts.size >= 10], ["점보 기장", "보잉 747 운항", types.has("boeing-747")], ["슈퍼점보 기장", "에어버스 A380 운항", types.has("airbus-a380")], ["단골 조종사", "PIREP 10건 제출", L.length >= 10]];
  }
  const legDone = l => PS.pireps.some(p => p.dep === l[0] && p.arr === l[1]);
  const pbar = (label, pct, right, note) => `<div class="prog"><div class="prog-h"><span>${label}</span><span class="val">${right}</span></div><div class="prog-t"><span class="prog-f" style="width:${N(Math.max(0, Math.min(100, pct)))}%"></span></div>${note ? `<small>${note}</small>` : ""}</div>`;
  function challenges() {
    const L = PS.pireps, types = new Set(L.map(p => p.ac)).size, butter = L.filter(p => Math.abs(p.land) <= 100).length, hrs = pstats(0).min / 60, longh = L.filter(p => p.km >= 8000).length;
    return [["기종 수집가", "서로 다른 기종 5개로 비행", types, 5, "개"], ["버터 랜딩 3회", "100 fpm 이하 착륙 세 번", butter, 3, "회"], ["장거리 전문가", "8,000 km 이상 구간 세 번", longh, 3, "회"], ["누적 100시간", "총 비행 시간 100시간", Math.floor(hrs), 100, "시간"]];
  }
  function updateWho() {
    const rk = rankOf(pstats(0).min), nm = PS.pilot.name || "조종사", a = $("#who-name"), b = $("#who-rank"), c = $("#who-av");
    if (a) a.textContent = nm; if (b) b.textContent = `${VA.code}${String(PS.pilot.num).padStart(4, "0")} · ${rk.name}`; if (c) c.textContent = nm.slice(0, 1).toUpperCase();
    const np = $("#nav-pireps"), mine = PS.pireps.filter(x => !x.demo).length; if (np) { np.textContent = mine; np.hidden = !mine; }
  }

  /* ---------- 지도 도우미 ---------- */
  function mkMap(mapSel, ovSel, draw, wheel) {
    const el = $(mapSel); if (!el || typeof jsVectorMap === "undefined") return null;
    document.querySelectorAll(".jvm-tooltip").forEach(n => n.remove());
    let m; try { m = new jsVectorMap({ selector: mapSel, map: "world", backgroundColor: "transparent", zoomButtons: true, zoomOnScroll: wheel !== false, zoomMax: 120, zoomStep: 1.6, showTooltip: false, regionStyle: { initial: { fill: "#465260", stroke: "none" }, hover: { fillOpacity: 1, cursor: "grab" } } }); } catch (e) { return null; }
    let raf = 0;
    const api = { map: m,
      redraw() { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; const ov = $(ovSel); if (!ov) return; const W = ov.clientWidth, H = ov.clientHeight; ov.setAttribute("viewBox", `0 0 ${W} ${H}`); ov.innerHTML = draw((lat, lon) => m.coordsToPoint(lat, lon) || null, W, H); }); },
      focus(lat, lon, spanKm, animate) { try { if (!spanKm) { m.setFocus({ coords: [30, 20], scale: 1, animate: !!animate }); return; } const a = m.coordsToPoint(lat, lon), b = m.coordsToPoint(lat, lon + 1); if (!a || !b) return; const pxKm = Math.abs(b.x - a.x) / (111.3 * Math.cos(toR(lat))), want = Math.min(m.container.offsetWidth, m.container.offsetHeight * 1.5) / (spanKm * pxKm); m.setFocus({ coords: [lat, lon], scale: Math.max(1, (m.scale / m._baseScale) * want), animate: !!animate }); } catch (e) { /* 무시 */ } } };
    const orig = m._applyTransform; m._applyTransform = function () { const r = orig.apply(this, arguments); api.redraw(); return r; };
    return api;
  }
  function arcPath(Pt, a, b, W) { let d = "", pen = false, prev = null; for (let i = 0; i <= 48; i++) { const g = gcPoint(a, b, i / 48).pt, q = Pt(g[0], g[1]); if (!q || (prev && Math.abs(q.x - prev.x) > W * 0.5)) { pen = false; prev = q; continue; } d += (pen ? "L" : "M") + N(q.x) + " " + N(q.y); pen = true; prev = q; } return d; }
  function focusRoute(mp, a, b, animate) { const km = distKm(a, b), dl = Math.abs(a[1] - b[1]); if (km > 7000 || dl > 150) { mp.focus(0, 0, 0, animate); return; } const mid = gcPoint(a, b, 0.5).pt; mp.focus(mid[0], mid[1], Math.max(900, km * 1.5), animate); }
  const apCard = (code, kind, extra) => { const a = aptBy[code]; return `<div class="apcard"><div class="apcard-top"><span class="codes">${a.icao} / ${a.iata}</span><span class="bdg ${kind}">${kind === "dep" ? "출발" : kind === "arr" ? "도착" : "현재 위치"}</span></div><span class="nm">${esc(a.name)}</span><span class="tm">${esc(CCN[a.cc] || a.cc)}${extra ? " · " + extra : ""}</span>${chMeta(a.icao) ? `<a class="apcard-ch" href="#apt-${code}" aria-label="${esc(a.name)} 비행장 차트 보기">${ICON.map}차트</a>` : ""}</div>`; };
  const rcard = (icon, label, head, body, wide) => `<div class="rcard${wide ? " wide" : ""}"><div class="rcard-h"><span class="rcard-l">${icon}${label}</span><span class="rcard-v">${head}</span></div><div class="rcard-b">${body}</div></div>`;

  /* ---------- 비행 예약 ---------- */
  const BK = { dest: null, ac: "boeing-737max", ring: true, q: "" };
  try { const s = localStorage.getItem("hub-bk-ac"); if (byId[s]) BK.ac = s; } catch (e) { /* 저장소 없음 */ }
  let bookMap = null, pirepMap = null;
  function bkList(ac) {
    const here = PS.pilot.loc, q = BK.q.trim().toLowerCase(), L = APT.filter(a => a[0] !== here && (!q || aptText(a).includes(q))).map(a => [a, aptKm(here, a[0])]).sort((x, y) => x[1] - y[1]);
    return L.length ? L.map(x => `<button type="button" class="bk-row${BK.dest === x[0][0] ? " on" : ""}${x[1] > ac.specs.range ? " far" : ""}" data-pilot="dest:${x[0][0]}" id="bkr-${x[0][0]}"><b>${x[0][0]}</b><span>${esc(x[0][2])}</span><span class="km">${distTxt(x[1])}</span></button>`).join("") : `<p class="empty" style="padding:10px 8px">일치하는 공항이 없습니다. 이름이나 코드를 다시 확인하세요.</p>`;
  }
  function bookPanel() {
    const here = aptBy[PS.pilot.loc], b = PS.booking, ac = byId[BK.ac];
    if (b) { const bac = byId[b.ac]; return `<div class="fp-h"><h2>${ICON.plane}예약된 비행</h2><p>이미 예약한 비행이 있습니다. 비행을 마치면 PIREP을 제출하세요.</p></div><div class="fp-list"><div class="apcards">${apCard(b.dep, "dep")}${apCard(b.arr, "arr")}</div><div class="rcards">${rcard(ICON.info, "편명", b.cs, esc(short(bac)))}${rcard(ICON.route, "거리", distTxt(b.km), "예상 " + hm(b.ete))}</div><a class="btn go" href="#flights">${ICON.doc}PIREP 제출하러 가기</a><button type="button" class="btn glass" data-pilot="cancel" id="bk-cancel">예약 취소</button></div>`; }
    const dest = BK.dest ? aptBy[BK.dest] : null, km = dest ? aptKm(here.iata, dest.iata) : 0, far = !!dest && km > ac.specs.range;
    const acOpts = ["boeing", "airbus"].map(mk => `<optgroup label="${makerName(mk)}">${AIRCRAFT.filter(a => a.maker === mk).map(a => `<option value="${a.id}" ${BK.ac === a.id ? "selected" : ""}>${ICAO[a.id]} · ${esc(short(a))} · ${fmt(a.specs.range)} km</option>`).join("")}</optgroup>`).join("");
    return `<div class="fp-h"><h2>${ICON.plane}비행 예약</h2><p>${dest ? "기종과 거리를 확인하고 예약하세요." : "지도나 목록에서 도착 공항을 고르세요."}</p></div>
<div class="fp-list">
<div class="apcards">${apCard(here.iata, "cur")}${dest ? apCard(dest.iata, "arr") : `<div class="apcard ph0"><div class="apcard-top"><span class="codes">— / —</span><span class="bdg arr">도착</span></div><span class="nm">공항 선택</span><span class="tm">지도의 점을 누르세요</span></div>`}</div>
<div class="fld"><label for="bk-ac">기종</label><select class="sel" id="bk-ac">${acOpts}</select></div>
${dest ? `<div class="rcards">${rcard(ICON.route, "거리", distTxt(km), far ? `<span class="neg">항속거리 초과</span>` : `<small>항속거리 이내</small>`)}${rcard(ICON.clock, "예상 시간", hm(eteMin(km, ac)), `<small>순항 ${fmt(aircraftKmh(ac))} km/h</small>`)}${rcard(ICON.info, "편명", flightNo(here.iata, dest.iata), `<small>${esc(short(ac))}</small>`)}${rcard(ICON.gauge, "예상 연료", fmt(fuelKg(km, ac)) + " kg", `<small>승객 약 ${Math.round(ac.specs.seats * 0.84)}명</small>`)}</div>
<button type="button" class="btn go" data-pilot="book" id="bk-go"${far ? " disabled" : ""}>${ICON.plane}${far ? "이 기종의 항속거리를 넘습니다" : "이 비행 예약"}</button>` : ""}
<div class="actions"><button type="button" class="btn glass" data-pilot="random" id="bk-random" style="flex:1">${ICON.swap}무작위 목적지</button>${dest ? `<button type="button" class="btn glass" data-pilot="clear" id="bk-clear" style="flex:1">선택 해제</button>` : ""}</div>
<label class="small" style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="bk-ring"${BK.ring ? " checked" : ""}> 지도에 항속거리 원 표시</label>
<div class="fld"><label for="bk-q">도착 공항 찾기</label><input class="in" id="bk-q" type="search" placeholder="이름, 코드, 국가" value="${esc(BK.q)}" autocomplete="off"></div>
<div class="bk-list" id="bk-list">${bkList(ac)}</div>
</div>`;
  }
  function drawBook(Pt, W, H) {
    const here = aptBy[PS.pilot.loc], b = PS.booking, ac = byId[b ? b.ac : BK.ac], dest = b ? b.arr : BK.dest, from = b ? aptBy[b.dep] : here;
    const h0 = Pt(from.lat, from.lon), h1 = Pt(from.lat, from.lon + 1), pxDeg = h0 && h1 ? Math.abs(h1.x - h0.x) : 0;
    let lines = "", marks = "";
    if (BK.ring && !b) { let d = "", pen = false, prev = null; for (let i = 0; i <= 72; i++) { const g = destPt(here.lat, here.lon, i * 5, ac.specs.range), q = Pt(g[0], g[1]); if (!q || (prev && Math.abs(q.x - prev.x) > W * 0.5)) { pen = false; prev = q; continue; } d += (pen ? "L" : "M") + N(q.x) + " " + N(q.y); pen = true; prev = q; } if (d) lines += `<path class="ring r2" d="${d}"/>`; }
    APT.forEach(a => {
      if (a[0] === from.iata) return; const q = Pt(a[4], a[5]); if (!q || q.x < -20 || q.x > W + 20 || q.y < -20 || q.y > H + 20) return;
      const km = aptKm(from.iata, a[0]), on = dest === a[0], far = km > ac.specs.range;
      if (!b && !on && km <= 4500 && h0) lines += `<line class="rt" x1="${N(h0.x)}" y1="${N(h0.y)}" x2="${N(q.x)}" y2="${N(q.y)}"/>`;
      marks += `<g class="dst${on ? " on" : ""}${far ? " far" : ""}"${b ? "" : ` data-pilot="dest:${a[0]}"`} data-tip="${esc(`<b>${a[0]} · ${a[2]}</b><br>${distTxt(km)}${far ? " · 항속거리 초과" : ""}`)}"><circle class="hitc" cx="${N(q.x)}" cy="${N(q.y)}" r="10"/><circle cx="${N(q.x)}" cy="${N(q.y)}" r="${on ? 6 : 4}"/>${on || pxDeg > 9 ? `<text x="${N(q.x + 8)}" y="${N(q.y + 4)}">${a[0]}</text>` : ""}</g>`;
    });
    if (dest) lines += `<path class="rt on" d="${arcPath(Pt, [from.lat, from.lon], [aptBy[dest].lat, aptBy[dest].lon], W)}"/>`;
    if (h0) marks += `<g class="here"><circle cx="${N(h0.x)}" cy="${N(h0.y)}" r="6"/><text x="${N(h0.x + 10)}" y="${N(h0.y + 4)}">${from.iata}</text></g>`;
    return lines + marks;
  }
  function paintBook(refocus) {
    const pn = $("#bk-panel"); if (!pn) return;
    const keep = pn.querySelector(".fp-list"), y = keep ? keep.scrollTop : 0; pn.innerHTML = bookPanel(); const nl = pn.querySelector(".fp-list"); if (nl && !refocus) nl.scrollTop = y;
    if (bookMap) { bookMap.redraw(); if (refocus) { const b = PS.booking, here = aptBy[PS.pilot.loc], from = b ? aptBy[b.dep] : here, dest = b ? b.arr : BK.dest; if (dest) focusRoute(bookMap, [from.lat, from.lon], [aptBy[dest].lat, aptBy[dest].lon], true); else bookMap.focus(here.lat, here.lon, 4200, true); } }
  }
  function renderBook() {
    return `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / Flight Center</div><h1>비행 예약</h1><p>현재 위치에서 갈 수 있는 공항이 지도에 표시됩니다. 도착 공항과 기종을 고르면 거리와 예상 시간이 계산됩니다.</p></div><div class="actions"><a class="btn ghost" href="#airports">${ICON.list}공항 목록</a></div></header>
<section class="card" id="bookcard"><div class="mapwrap livewrap"><div id="bookmap" class="sitemap livemap" role="img" aria-label="비행 예약 지도"></div><svg id="book-ov" class="live-ov"></svg><div class="float-panel bk-panel" id="bk-panel"></div></div></section>`;
  }
  function initBook() {
    bookMap = mkMap("#bookmap", "#book-ov", drawBook); if (!bookMap) { const c = $("#bookcard"); if (c) c.classList.add("nomap"); }
    const pn = $("#bk-panel"); if (pn) pn.innerHTML = bookPanel();
    setTimeout(() => paintBook(true), 60);
  }

  /* ---------- 내 비행 · PIREP ---------- */
  const pirepStatus = p => p.demo ? `<span class="pill demo">예시</span>` : `<span class="pill ok">승인됨</span>`;
  function pirepTable(list) {
    if (!list.length) return `<p class="empty">아직 제출한 PIREP이 없습니다. 비행을 예약하고 마친 뒤 제출하면 여기에 쌓입니다.</p>`;
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>날짜</th><th>편명</th><th>구간</th><th>기종</th><th class="num">거리</th><th class="num">비행 시간</th><th class="num">착륙률</th><th class="num">점수</th><th>상태</th></tr></thead><tbody>${list.map(p => `<tr class="row-link" data-href="#pirep-${p.id}" tabindex="0"><td>${dayKo(p.filed)}</td><td><span class="code">${esc(p.cs)}</span></td><td><strong class="mono">${p.dep} → ${p.arr}</strong></td><td>${esc(short(byId[p.ac]))}</td><td class="num">${distTxt(p.km)}</td><td class="num">${hm(p.time)}</td><td class="num">${p.land} fpm</td><td class="num"><strong>${p.points}</strong></td><td>${pirepStatus(p)}</td></tr>`).join("")}</tbody></table></div>`;
  }
  const demoNote = () => `<div class="note c12"><span>${ICON.info}<span><b>예시 기록 ${PS.pireps.filter(p => p.demo).length}건이 들어 있습니다.</b> 화면을 미리 보여 주기 위한 것이며 내 기록이 아닙니다. 첫 PIREP을 제출하면 자동으로 지워집니다.</span></span><button type="button" class="btn ghost" data-pilot="demo-clear" id="demo-clear">예시 지우고 시작</button></div>`;
  function renderFlights() {
    const b = PS.booking, here = aptBy[PS.pilot.loc];
    let top;
    if (b) {
      const ac = byId[b.ac], num = (id, label, val, attrs, help) => `<div class="fld"><label for="${id}">${label}</label><input class="in" id="${id}" type="number" inputmode="numeric" value="${val}" ${attrs}><small>${help}</small></div>`;
      top = `<section class="card c12">${cardH(ICON.plane, "예약된 비행 " + b.cs, `<button type="button" class="btn ghost" data-pilot="cancel" id="fl-cancel">예약 취소</button>`)}
<div class="card-b"><div class="flt">${apCard(b.dep, "dep")}<div class="mid"><span class="mono">${distTxt(b.km)}</span><span class="ln"></span><span>${esc(short(ac))} · 예상 ${hm(b.ete)}</span></div>${apCard(b.arr, "arr")}</div></div>
<form id="pirep-form" class="card-b" style="border-top:1px solid var(--line)" autocomplete="off"><h2 style="margin-bottom:4px">PIREP 제출</h2><p class="muted">비행을 마친 뒤 실제 값으로 고쳐서 제출하세요. 처음 값은 기종 성능으로 계산한 예상치입니다.</p>
<div class="form-grid">${num("pf-time", "비행 시간 (분)", b.ete, 'min="5" max="1500" required', "이륙부터 착륙까지")}${num("pf-land", "착륙률 (fpm)", -180, 'min="-2000" max="0" required', "접지 순간의 강하율. 0에 가까울수록 부드럽습니다")}${num("pf-fuel", "사용 연료 (kg)", b.fuel, 'min="0" required', "예상치 " + fmt(b.fuel) + " kg")}${num("pf-pax", "승객 수", Math.round(ac.specs.seats * 0.84), 'min="0" max="' + ac.specs.seatsMax + '" required', "최대 " + ac.specs.seatsMax + "석")}${num("pf-cargo", "화물 (kg)", Math.round(ac.specs.mtow * 22), 'min="0" required', "수하물 포함")}</div>
<div class="fld" style="margin-top:16px"><label for="pf-notes">메모</label><textarea class="in" id="pf-notes" rows="2" maxlength="300" placeholder="날씨, 활주로, 특이 사항"></textarea></div>
<div class="actions" style="margin-top:16px"><button type="submit" class="btn go" id="pf-submit">${ICON.doc}PIREP 제출</button></div></form></section>`;
    } else top = `<section class="card c12"><div class="card-b aclive"><div><h2>예약된 비행이 없습니다</h2><p class="muted" style="margin:4px 0 0">현재 위치는 ${here.iata} ${esc(here.name)}입니다. 지도에서 목적지를 골라 다음 비행을 예약하세요.</p></div><a class="btn" href="#book">${ICON.plane}비행 예약</a></div></section>`;
    return `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / Flight Center</div><h1>내 비행</h1><p>예약한 비행과 제출한 PIREP 기록입니다. 행을 누르면 경로 지도와 점수 내역이 나옵니다.</p></div><span class="sync" data-sync>${syncText()}</span></header>
<div class="grid">${PS.demo ? demoNote() : ""}${top}<section class="card c12">${cardH(ICON.list, "PIREP 기록", `<span class="hint">${PS.pireps.length}건</span>`)}${pirepTable(PS.pireps)}</section></div>`;
  }
  function renderPirep(p) {
    const ac = byId[p.ac], sc = scorePirep(p), ph = photoOf(ac);
    return `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / <a href="#flights">내 비행</a> / PIREP</div><h1>${esc(p.cs)} <span class="mono">${p.dep} → ${p.arr}</span> ${pirepStatus(p)}</h1><p>${dayKo(p.filed)} 제출 · ${esc(ac.name)}</p></div><div class="actions"><a class="btn ghost" href="#${ac.id}">${ICON.plane}기종 정보</a></div></header>
<div class="grid">
<section class="card c8"><div class="mapwrap" style="height:440px"><div id="prmap" class="sitemap livemap" style="inset:0" role="img" aria-label="${p.dep}에서 ${p.arr}까지의 경로 지도"></div><svg id="pr-ov" class="live-ov" style="inset:0;width:100%"></svg></div></section>
<div class="c4 stack">
<section class="card">${cardH(ICON.cup, "점수", `<span class="hint">합계 ${sc.total}점</span>`)}<div class="card-b"><div class="pts">${sc.rows.map(r => `<div><span>${r[0]}</span><b class="${r[1] < 0 ? "neg" : r[1] > 0 ? "pos" : ""}">${r[1] > 0 ? "+" : ""}${r[1]}</b></div>`).join("")}<div class="tot"><span>합계</span><b>${sc.total}</b></div></div></div></section>
${ph ? `<a class="card box mk-${ac.maker}" href="#${ac.id}"><div class="box-img">${pimg(ph, true, ac.name)}</div><div class="box-b"><div class="box-top"><span class="box-code">${ICAO[ac.id]}</span>${statusPill(ac)}</div><div class="box-name"><span class="dot"></span>${esc(ac.name)}</div></div></a>` : ""}
</div>
<section class="card c12">${cardH(ICON.info, "비행 기록")}<div class="card-b"><div class="flt" style="margin-bottom:16px">${apCard(p.dep, "dep")}<div class="mid"><span class="mono">${distTxt(p.km)}</span><span class="ln"></span><span>${hm(p.time)}</span></div>${apCard(p.arr, "arr")}</div>
<div class="rcards" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">${rcard(ICON.clock, "비행 시간", p.time + " min", hm(p.time))}${rcard(ICON.gauge, "착륙률", p.land + " fpm", Math.abs(p.land) <= 100 ? "부드러운 착륙" : Math.abs(p.land) <= 300 ? "정상 착륙" : "단단한 착륙")}${rcard(ICON.route, "거리", distTxt(p.km), `<small>평균 ${fmt(Math.round(p.km / Math.max(1, p.time) * 60))} km/h</small>`)}${rcard(ICON.weight, "사용 연료", fmt(p.fuel) + " kg", `<small>km당 ${N(p.fuel / Math.max(1, p.km))} kg</small>`)}${rcard(ICON.users, "승객", fmt(p.pax), `<small>${esc(short(ac))} 표준 ${ac.specs.seats}석</small>`)}${rcard(ICON.layers, "화물", fmt(p.cargo) + " kg", `<small>수하물 포함</small>`)}</div>
${p.notes ? `<p style="margin:16px 0 0"><span class="lbl" style="margin-bottom:4px">메모</span>${esc(p.notes)}</p>` : ""}</div></section>
</div>`;
  }
  function initPirep(p) {
    const A = [aptBy[p.dep].lat, aptBy[p.dep].lon], B = [aptBy[p.arr].lat, aptBy[p.arr].lon];
    pirepMap = mkMap("#prmap", "#pr-ov", (Pt, W) => { const a = Pt(A[0], A[1]), b = Pt(B[0], B[1]); let o = `<path class="trail" d="${arcPath(Pt, A, B, W)}"/>`; if (a) o += `<g class="here"><circle cx="${N(a.x)}" cy="${N(a.y)}" r="5"/><text x="${N(a.x + 9)}" y="${N(a.y + 4)}">${p.dep}</text></g>`; if (b) o += `<g class="here"><circle cx="${N(b.x)}" cy="${N(b.y)}" r="5"/><text x="${N(b.x + 9)}" y="${N(b.y + 4)}">${p.arr}</text></g>`; return o; }, false);
    if (pirepMap) setTimeout(() => { focusRoute(pirepMap, A, B, false); pirepMap.redraw(); }, 60);
  }

  /* ---------- 대시보드 ---------- */
  let statDays = 0;
  function statTiles(st) {
    const t = (icon, num, unit, label, sub) => `<div class="stat"><span class="stat-i">${icon}</span><span class="stat-n">${num}<small>${unit}</small></span><span class="stat-l">${label}</span>${sub ? `<span class="stat-s">${sub}</span>` : ""}</div>`;
    return t(ICON.doc, fmt(st.n), "건", "PIREP", "승인 " + fmt(st.n)) + t(ICON.cup, fmt(st.pts), "점", "점수", st.n ? "평균 " + Math.round(st.pts / st.n) : "") + t(ICON.clock, fmt(Math.floor(st.min / 60)), "시간", "비행 시간", Math.round(st.min % 60) + "분") + t(ICON.route, distTxt(st.km).split(" ")[0], distTxt(st.km).split(" ")[1], "거리", "")
      + t(ICON.users, fmt(st.pax), "명", "승객", "") + t(ICON.layers, fmt(Math.round(st.freight / 1000)), "t", "화물", "") + t(ICON.weight, fmt(Math.round(st.fuel / 1000)), "t", "연료", "") + t(ICON.gauge, st.n ? st.land : "—", "fpm", "평균 착륙률", "");
  }
  function leaderRows(limit) {
    const me = pstats(0), L = ROSTER.map(r => ({ name: r[0], pts: r[1], n: r[2], demo: true })).concat([{ name: PS.pilot.name || "조종사", pts: me.pts, n: me.n, me: true }]).sort((a, b) => b.pts - a.pts);
    return (limit ? L.slice(0, limit) : L).map((r, i) => `<tr class="${r.me ? "me-row" : ""}"><td class="num">${L.indexOf(r) + 1}</td><td><strong>${esc(r.name)}</strong>${r.me ? ` <span class="pill ok">나</span>` : ` <span class="pill demo">예시</span>`}</td><td class="num">${fmt(r.n)}</td><td class="num"><strong>${fmt(r.pts)}</strong></td></tr>`).join("");
  }
  const leaderTable = limit => `<div class="tbl-wrap"><table class="tbl plain"><thead><tr><th class="num">#</th><th>조종사</th><th class="num">비행</th><th class="num">점수</th></tr></thead><tbody>${leaderRows(limit)}</tbody></table></div>`;
  function renderDash() {
    const all = pstats(0), rk = rankOf(all.min), here = aptBy[PS.pilot.loc], hero = (typeof PHOTOS !== "undefined" && PHOTOS._hero) || null, nm = PS.pilot.name || "조종사", b = PS.booking;
    const tour = TOURS.find(t => !t.legs.every(legDone)) || TOURS[0], done = tour.legs.filter(legDone).length;
    const bookBox = b ? `<a class="card pbox c3" href="#flights"><span class="row1"><span class="lbl">${ICON.plane}다음 비행</span><span class="pill ok">예약됨</span></span><span class="rte">${b.dep} → ${b.arr}</span><span class="sub">${esc(b.cs)} · ${esc(short(byId[b.ac]))} · 예상 ${hm(b.ete)}</span><span class="box-meta">${distTxt(b.km)}</span></a>`
      : `<a class="card pbox cta c3" href="#book"><span class="lbl">${ICON.plane}다음 비행</span><span class="rte txt">예약 없음</span><span class="sub">${here.iata}에서 출발할 비행을 예약하세요.</span><span class="btn blue">비행 예약</span></a>`;
    const pbox = p => `<a class="card pbox c3" href="#pirep-${p.id}"><span class="row1"><span class="lbl">${ICON.doc}PIREP</span>${pirepStatus(p)}</span><span class="rte">${p.dep} → ${p.arr}</span><span class="sub">${esc(p.cs)} · ${esc(short(byId[p.ac]))} · ${hm(p.time)}</span><span class="box-meta">${p.points}점 · ${p.land} fpm · ${dayKo(p.filed)}</span></a>`;
    const last = PS.pireps.slice(0, 3), blanks = Array(3 - last.length).fill(`<div class="card pbox c3"><span class="lbl">${ICON.doc}PIREP</span><span class="rte muted">—</span><span class="sub">제출한 기록이 여기에 나옵니다.</span></div>`);
    return `<div class="grid">
<section class="banner c12">${hero ? pimg(hero, false, hero.alt || "비행 중인 여객기", true) + `<div class="pcr">${pcredit(hero)}</div>` : ""}<div class="banner-in"><p class="lbl">${esc(VA.name)} · Pilot Hub</p><h1>${esc(nm)}님, 좋은 비행 되세요</h1><p>${esc(rk.name)} · 현재 위치 ${here.iata} ${esc(here.name)}. 다음 비행을 예약하거나 마친 비행의 PIREP을 제출하세요.</p><div class="actions"><a class="btn" href="#book">${ICON.plane}비행 예약</a><a class="btn on-dark" href="#flights">${ICON.doc}내 비행</a><a class="btn on-dark" href="#live">${ICON.map}실시간 운항</a></div></div></section>
${PS.demo ? demoNote() : ""}
${bookBox}${last.map(pbox).join("")}${blanks.join("")}
<section class="card c8">${cardH(ICON.chart, "내 통계", seg("days", [[0, "전체"], [90, "90일"], [30, "30일"], [7, "7일"]], statDays, "통계 기간"))}<div class="stats" id="pstats-out">${statTiles(pstats(statDays))}</div></section>
<section class="card c4">${cardH(ICON.bell, "NOTAM", `<span class="hint">운영 공지</span>`)}<div>${VA_NOTAMS.map(n => `<a class="notam p-${n.p}" href="#${n.href}"><i></i><div><div class="notam-h"><span class="tag">${PRI[n.p]}</span><strong>${esc(n.title)}</strong><span class="date">${esc(n.date)}</span></div><p>${esc(n.text)}</p></div></a>`).join("")}</div></section>
${liveStrip()}
<section class="card c6">${cardH(ICON.target, "활동", `<a class="ext small" href="#activities">전체 보기 →</a>`)}<div class="goal-sec">${pbar(`계급 · ${esc(rk.name)}`, rk.pct, rk.next ? `${esc(rk.next)}까지 ${N(Math.round(rk.left * 10) / 10)}시간` : "최고 계급", "")}</div><div class="goal-sec">${pbar(`투어 · ${esc(tour.name)}`, done / tour.legs.length * 100, `${done} / ${tour.legs.length} 구간`, esc(tour.desc))}<div class="tour-legs">${tour.legs.map(l => `<span class="tleg${legDone(l) ? " done" : ""}">${l[0]} → ${l[1]}</span>`).join("")}</div></div></section>
<section class="card c6">${cardH(ICON.cup, "리더보드", `<a class="ext small" href="#community">전체 보기 →</a>`)}${leaderTable(5)}</section>
<p class="lbl sec-lbl">${ICON.star}자료실 · 기종 백과</p>
${recentIds().map(id => box(byId[id])).join("")}
</div>`;
  }

  /* ---------- 프로필 · 활동 · 커뮤니티 ---------- */
  function renderProfile() {
    const all = pstats(0), rk = rankOf(all.min), nm = PS.pilot.name || "조종사", here = aptBy[PS.pilot.loc];
    return `<header class="card ph"><div style="display:flex;gap:16px;align-items:center"><span class="avatar" style="width:56px;height:56px;font-size:22px">${esc(nm.slice(0, 1).toUpperCase())}</span><div><div class="crumbs"><a href="#home">대시보드</a> / 내 프로필</div><h1>${esc(nm)} <span class="code">${VA.code}${String(PS.pilot.num).padStart(4, "0")}</span></h1><p>${esc(rk.name)} · ${esc(PS.pilot.joined)} 합류 · 현재 위치 ${here.iata} ${esc(here.name)}</p></div></div><span class="sync" data-sync>${syncText()}</span></header>
<div class="grid">
<section class="card c8">${cardH(ICON.chart, "누적 통계")}<div class="stats">${statTiles(all)}</div></section>
<section class="card c4">${cardH(ICON.target, "계급")}<div class="card-b rank"><div class="rank-h"><b>${esc(rk.name)}</b><span class="muted">${rk.next ? "다음 " + esc(rk.next) : "최고 계급"}</span></div><div class="prog-t"><span class="prog-f" style="width:${N(rk.pct)}%"></span></div><small class="muted">${rk.next ? `${N(Math.round(rk.left * 10) / 10)}시간 더 비행하면 승급합니다.` : "모든 계급을 달성했습니다."}</small><div class="tour-legs" style="margin-top:6px">${RANKS.map(r => `<span class="tleg${all.min / 60 >= r[0] ? " done" : ""}">${r[0]}h ${esc(r[1])}</span>`).join("")}</div></div></section>
<section class="card c12">${cardH(ICON.cup, "배지", `<span class="hint">${badgeList().filter(x => x[2]).length} / ${badgeList().length}</span>`)}<div class="card-b"><div class="badges">${badgeList().map(x => `<div class="badge${x[2] ? "" : " locked"}">${ICON.star}<b>${x[0]}</b><small>${x[1]}${x[2] ? "" : " · 미획득"}</small></div>`).join("")}</div></div></section>
<section class="card c6">${cardH(ICON.info, "조종사 설정")}<form id="pilot-form" class="card-b" autocomplete="off"><div class="form-grid"><div class="fld"><label for="pl-name">조종사 이름</label><input class="in" id="pl-name" maxlength="24" value="${esc(PS.pilot.name)}" placeholder="화면에 표시할 이름"></div><div class="fld"><label for="pl-num">조종사 번호</label><input class="in" id="pl-num" type="number" min="1" max="9999" value="${PS.pilot.num}"><small>${VA.code} 뒤에 붙는 네 자리</small></div><div class="fld"><label for="pl-units">거리 단위</label><select class="sel" id="pl-units"><option value="km"${PS.pilot.units === "km" ? " selected" : ""}>킬로미터 (km)</option><option value="nm"${PS.pilot.units === "nm" ? " selected" : ""}>해리 (NM)</option></select></div></div><div class="actions" style="margin-top:16px"><button type="submit" class="btn" id="pl-save">저장</button></div></form></section>
<section class="card c6">${cardH(ICON.doc, "기록 저장")}<div class="card-b"><p><span class="sync" data-sync>${syncText()}</span></p><p class="muted">기록은 조종사 본인만 볼 수 있는 개인 저장소에 둡니다. Claude 계정에 연결되지 않은 환경에서는 이 브라우저에만 남으므로, 브라우저 데이터를 지우면 함께 사라집니다.</p><div class="actions">${PS.demo ? `<button type="button" class="btn ghost" data-pilot="demo-clear" id="pr-demo">예시 기록 지우기</button>` : ""}<button type="button" class="btn warn" data-pilot="reset" id="pr-reset">모든 기록 초기화</button></div></div></section>
</div>`;
  }
  function renderActivities() {
    return `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / 활동</div><h1>활동</h1><p>투어는 정해진 구간을 모두 비행하면 완료됩니다. 도전 과제는 제출한 PIREP으로 자동 집계됩니다.</p></div><a class="btn" href="#book">${ICON.plane}비행 예약</a></header>
<div class="grid">
<section class="card c7">${cardH(ICON.route, "투어")}<div>${TOURS.map(t => { const d = t.legs.filter(legDone).length; return `<div class="tour"><div class="tour-h"><h3>${esc(t.name)}</h3><span class="pill ${d === t.legs.length ? "ok" : "off"}">${d === t.legs.length ? "완료" : d + " / " + t.legs.length + " 구간"}</span></div><p class="muted" style="margin:0">${esc(t.desc)}</p><div class="prog-t"><span class="prog-f" style="width:${N(d / t.legs.length * 100)}%"></span></div><div class="tour-legs">${t.legs.map(l => `<span class="tleg${legDone(l) ? " done" : ""}">${l[0]} → ${l[1]}</span>`).join("")}</div></div>`; }).join("")}</div></section>
<section class="card c5">${cardH(ICON.target, "도전 과제")}<div>${challenges().map(c => `<div class="goal-sec">${pbar(c[0], c[2] / c[3] * 100, `${Math.min(c[2], c[3])} / ${c[3]} ${c[4]}`, c[1])}</div>`).join("")}</div></section>
</div>`;
  }
  function renderCommunity() {
    return `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / 커뮤니티</div><h1>리더보드</h1><p>점수 순위입니다. 지금은 혼자 쓰는 허브라서 다른 조종사는 비교용 예시입니다.</p></div></header>
<div class="grid"><section class="card c12">${cardH(ICON.cup, "점수 순위", `<span class="hint">예시 조종사 ${ROSTER.length}명 포함</span>`)}${leaderTable(0)}</section></div>`;
  }

  /* ---------- 공항 ---------- */
  let aq = "";
  function aptRows() {
    const here = PS.pilot.loc, q = aq.trim().toLowerCase(), visits = {}; PS.pireps.forEach(p => { visits[p.dep] = (visits[p.dep] || 0) + 1; visits[p.arr] = (visits[p.arr] || 0) + 1; });
    const L = APT.filter(a => !q || aptText(a).includes(q));
    return L.length ? L.map(a => `<tr class="row-link" data-href="#apt-${a[0]}" tabindex="0"><td><span class="code">${a[1]}</span></td><td><span class="code">${a[0]}</span></td><td><strong>${esc(a[2])}</strong>${a[0] === here ? ` <span class="pill warn">현재 위치</span>` : ""}</td><td>${esc(CCN[a[3]] || a[3])}</td><td class="num">${a[0] === here ? "—" : distTxt(aptKm(here, a[0]))}</td><td class="num">${visits[a[0]] || 0}</td></tr>`).join("") : `<tr><td colspan="6" class="muted">일치하는 공항이 없습니다. 이름이나 코드를 다시 확인하세요.</td></tr>`;
  }
  function renderAirports() {
    return `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / Resources</div><h1>공항</h1><p>${VA.name}이 운항하는 공항 ${APT.length}곳입니다. 행을 누르면 비행장 차트와 공항 정보가 열리고, 거기서 출발지를 옮기거나 목적지로 고를 수 있습니다.</p></div></header>
<div class="grid"><section class="card c12"><div class="filters"><input class="in" id="apt-q" type="search" placeholder="이름, ICAO·IATA 코드, 국가" value="${esc(aq)}" aria-label="공항 검색" autocomplete="off"></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>ICAO</th><th>IATA</th><th>공항</th><th>국가</th><th class="num">현재 위치에서</th><th class="num">내 이착륙</th></tr></thead><tbody id="apt-rows">${aptRows()}</tbody></table></div></section></div>`;
  }
  function renderApt(code) {
    const a = aptBy[code], here = PS.pilot.loc, isHere = code === here, pl = PLACES.find(p => p.code === code), cv = pl ? coverOf(pl.id) : null;
    const near = APT.filter(x => x[0] !== code).map(x => [x, aptKm(code, x[0])]).sort((x, y) => x[1] - y[1]).slice(0, 8);
    const mine = PS.pireps.filter(p => p.dep === code || p.arr === code);
    return `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / <a href="#airports">공항</a></div><h1>${esc(a.name)} <span class="code">${a.icao}</span> <span class="code">${a.iata}</span> ${isHere ? `<span class="pill warn">현재 위치</span>` : ""}</h1><p>${esc(CCN[a.cc] || a.cc)} · 북위 ${N(a.lat)}°, 동경 ${N(a.lon)}°</p></div>
<div class="actions">${isHere ? `<a class="btn" href="#book">${ICON.plane}여기서 출발 예약</a>` : `<button type="button" class="btn" data-pilot="goto:${code}" id="apt-goto">${ICON.plane}목적지로 고르기</button><button type="button" class="btn ghost" data-pilot="jump:${code}" id="apt-jump">${ICON.swap}점프시트로 이동</button>`}</div></header>
<div class="grid">
${chartCard(code)}${chartSide(code)}
<section class="card c6">${cardH(ICON.info, "공항 정보")}<div class="card-b"><div class="rcards">${rcard(ICON.map, "ICAO / IATA", a.icao + " / " + a.iata, esc(a.name))}${rcard(ICON.route, "현재 위치에서", isHere ? "0" : distTxt(aptKm(here, code)), isHere ? "지금 이 공항에 있습니다" : `<small>${here}에서 출발</small>`)}${rcard(ICON.doc, "내 이착륙", mine.length + "회", mine.length ? `<small>최근 ${dayKo(mine[0].filed)}</small>` : `<small>아직 없음</small>`)}${rcard(ICON.flag, "국가", a.cc, esc(CCN[a.cc] || a.cc))}</div>
<p class="small muted" style="margin:14px 0 0">점프시트는 비행 없이 현재 위치를 옮기는 기능입니다. 예약된 비행이 있으면 쓸 수 없습니다.</p></div></section>
<section class="card c6">${cardH(ICON.plane, "주변 교통량", cv ? `<span class="hint">${esc(kst(cv.d.g))} · 반경 100 km</span>` : "")}<div class="card-b">${cv ? `<div class="rcards">${rcard(ICON.plane, "지금 추적 중", fmt(cv.d.now || 0), `<small>지상 ${fmt(cv.d.gnd || 0)}대 포함</small>`)}${rcard(ICON.chart, "지난 24시간", fmt(cv.d.a24 || 0), `<small>시간당 최대 ${fmt(cv.d.peak || 0)}대</small>`)}</div><div style="margin-top:12px;max-width:460px">${hourlyChart(cv)}</div><p class="small muted" style="margin:8px 0 0">${cv.src === "live" ? "실시간 값" : "수집해 둔 실제 값(스냅샷)"} · ${esc(FIA_CREDIT)}</p><div class="actions" style="margin-top:10px"><button type="button" class="btn ghost" data-live="goto:area/${pl.id}" id="apt-live">${ICON.map}실시간 지도에서 보기</button></div>` : `<p class="muted" style="margin:0">이 공항은 교통량 집계 지점에 들어 있지 않습니다. 집계 지점은 국내 공항 4곳과 보잉·에어버스 조립 공장 9곳입니다.</p>`}</div></section>
<section class="card c12">${cardH(ICON.route, "가까운 공항")}<div class="tbl-wrap"><table class="tbl"><thead><tr><th>IATA</th><th>공항</th><th>국가</th><th class="num">거리</th><th class="num">A321neo 예상 시간</th></tr></thead><tbody>${near.map(x => `<tr class="row-link" data-href="#apt-${x[0][0]}" tabindex="0"><td><span class="code">${x[0][0]}</span></td><td><strong>${esc(x[0][2])}</strong></td><td>${esc(CCN[x[0][3]] || x[0][3])}</td><td class="num">${distTxt(x[1])}</td><td class="num">${hm(eteMin(x[1], byId["airbus-a320neo"]))}</td></tr>`).join("")}</tbody></table></div></section>
</div>`;
  }

  /* ---------- 기종 백과에 붙는 통계·지도 ---------- */
  function encyExtras() {
    return `<section class="card c7">${cardH(ICON.chart, "기종 통계", seg("stat", [["all", "전체"], ["boeing", "보잉"], ["airbus", "에어버스"], ["live", "생산 중"]], statSel, "통계 범위"))}<div class="stats" id="stats-out">${fleetStats()}</div></section>
<section class="card c5">${cardH(ICON.target, "2025년 인도 실적")}<div class="goal-sec">${prog("에어버스", 793, 820, "airbus", "793 / 820대", "연초 목표 820대의 97%. 수정 목표 790대는 달성")}${mini(D2025.airbus)}</div><div class="goal-sec">${prog("보잉", 600, 806, "boeing", "600 / 806대", "사상 최다였던 2018년 806대의 74%")}${mini(D2025.boeing)}</div></section>
${mapCard()}
<section class="card c5">${cardH(ICON.bell, "업계 소식", `<span class="hint">중요도 순</span>`)}<div>${NOTAMS.map(n => `<a class="notam p-${n.p}" href="#${n.href}"><i></i><div><div class="notam-h"><span class="tag">${PRI[n.p]}</span><strong>${esc(n.title)}</strong><span class="date">${esc(n.date)}</span></div><p>${esc(n.text)}</p></div></a>`).join("")}</div></section>
<section class="card c7">${cardH(ICON.chart, "제작사 인도 통계", seg("del", [[2000, "2000년~"], [2016, "최근 10년"], [2021, "최근 5년"]], delRange, "기간"))}<div class="card-b" id="del-out">${delBlock()}</div></section>`;
  }

  /* ---------- 동적 페이지 · 이벤트 ---------- */
  function dynPage(h) {
    if (h.indexOf("pirep-") === 0) { const p = PS.pireps.find(x => x.id === h.slice(6)); return p ? renderPirep(p) : null; }
    if (h.indexOf("apt-") === 0) return aptBy[h.slice(4)] ? renderApt(h.slice(4)) : null;
    return null;
  }
  const navKey = h => byId[h] ? "fleet" : h.indexOf("pirep-") === 0 ? "flights" : h.indexOf("apt-") === 0 ? "airports" : h;
  function pilotAfter(h) {
    wirePilot(); updateWho(); paintSync(); bookMap = null; pirepMap = null; chartLeave();
    if (h === "book") initBook();
    if (h.indexOf("apt-") === 0 && aptBy[h.slice(4)]) initChart(h.slice(4));
    if (h.indexOf("pirep-") === 0) { const p = PS.pireps.find(x => x.id === h.slice(6)); if (p) initPirep(p); }
  }
  let pilotWired = false, resetArm = 0;
  function clearDemo() { if (!PS.demo) return; PS.pireps = PS.pireps.filter(p => !p.demo); PS.demo = false; }
  function wirePilot() {
    if (pilotWired) return; pilotWired = true;
    SEG.days = v => { statDays = +v; const o = $("#pstats-out"); if (o) o.innerHTML = statTiles(pstats(statDays)); };
    document.addEventListener("click", e => {
      const el = e.target.closest("[data-pilot]"); if (!el) return;
      const v = el.getAttribute("data-pilot"), i = v.indexOf(":"), act = i < 0 ? v : v.slice(0, i), arg = i < 0 ? "" : v.slice(i + 1);
      if (act === "dest" && !PS.booking && aptBy[arg]) { BK.dest = arg; paintBook(true); return; }
      if (act === "clear") { BK.dest = null; paintBook(true); return; }
      if (act === "random") { const here = PS.pilot.loc, ac = byId[BK.ac], c = APT.filter(a => a[0] !== here && aptKm(here, a[0]) <= ac.specs.range && aptKm(here, a[0]) >= Math.min(300, ac.specs.range)); if (c.length) { BK.dest = c[Math.floor(Math.random() * c.length)][0]; paintBook(true); } return; }
      if (act === "book") { const here = PS.pilot.loc, ac = byId[BK.ac]; if (!BK.dest || PS.booking) return; const km = aptKm(here, BK.dest); if (km > ac.specs.range) return; PS.booking = { id: "b" + Date.now().toString(36), dep: here, arr: BK.dest, ac: ac.id, cs: flightNo(here, BK.dest), km: km, ete: eteMin(km, ac), fuel: fuelKg(km, ac), created: new Date().toISOString() }; BK.dest = null; saveState(); location.hash = "flights"; return; }
      if (act === "useac" && byId[arg]) { BK.ac = arg; try { localStorage.setItem("hub-bk-ac", arg); } catch (er) { /* 무시 */ } location.hash = "book"; return; }
      if (act === "cancel") { PS.booking = null; saveState(); route(true); return; }
      if (act === "goto" && aptBy[arg]) { if (!PS.booking) BK.dest = arg; location.hash = "book"; return; }
      if (act === "jump" && aptBy[arg]) { if (PS.booking) { el.textContent = "예약된 비행을 먼저 마치거나 취소하세요"; return; } PS.pilot.loc = arg; BK.dest = null; saveState(); route(true); return; }
      if (act === "demo-clear") { clearDemo(); saveState(); route(true); return; }
      if (act === "reset") { if (Date.now() - resetArm > 5000) { resetArm = Date.now(); el.textContent = "한 번 더 누르면 모두 지워집니다"; return; } resetArm = 0; const keep = PS.pilot; PS = defaultState(); PS.demo = false; PS.pireps = []; PS.pilot = { name: keep.name, num: keep.num, loc: "ICN", units: keep.units, joined: keep.joined }; saveState(); route(true); }
    });
    document.addEventListener("change", e => {
      if (e.target.id === "bk-ac" && byId[e.target.value]) { BK.ac = e.target.value; try { localStorage.setItem("hub-bk-ac", BK.ac); } catch (er) { /* 무시 */ } paintBook(false); }
      if (e.target.id === "bk-ring") { BK.ring = e.target.checked; if (bookMap) bookMap.redraw(); }
    });
    document.addEventListener("input", e => {
      if (e.target.id === "bk-q") { BK.q = e.target.value; const o = $("#bk-list"); if (o) o.innerHTML = bkList(byId[BK.ac]); }
      if (e.target.id === "apt-q") { aq = e.target.value; const o = $("#apt-rows"); if (o) o.innerHTML = aptRows(); }
    });
    document.addEventListener("submit", e => {
      if (e.target.id === "pirep-form") {
        e.preventDefault(); const b = PS.booking; if (!b) return;
        const num = (id, lo, hi) => Math.max(lo, Math.min(hi, Math.round(+$("#" + id).value || 0)));
        const p = { id: "p" + Date.now().toString(36), dep: b.dep, arr: b.arr, ac: b.ac, cs: b.cs, km: b.km, time: num("pf-time", 5, 1500), land: -Math.abs(num("pf-land", -2000, 0)), fuel: num("pf-fuel", 0, 400000), pax: num("pf-pax", 0, 900), cargo: num("pf-cargo", 0, 200000), filed: new Date().toISOString(), notes: String($("#pf-notes").value || "").slice(0, 300) };
        p.points = scorePirep(p).total; clearDemo(); PS.pireps.unshift(p); PS.pilot.loc = b.arr; PS.booking = null; saveState(); location.hash = "pirep-" + p.id;
      }
      if (e.target.id === "pilot-form") {
        e.preventDefault(); PS.pilot.name = String($("#pl-name").value || "").trim().slice(0, 24); PS.pilot.num = Math.max(1, Math.min(9999, Math.round(+$("#pl-num").value || 1))); PS.pilot.units = $("#pl-units").value === "nm" ? "nm" : "km"; saveState(); route(true);
      }
    });
    initRemote();
  }
