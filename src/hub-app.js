
  /* ================= Hub 전용 데이터 ================= */
  const ICAO = { "boeing-707": "B703", "boeing-727": "B722", "boeing-737": "B738", "boeing-737max": "B38M", "boeing-747": "B744", "boeing-757": "B752", "boeing-767": "B763", "boeing-777": "B77W", "boeing-777x": "B779", "boeing-787": "B789", "boeing-717": "B712",
    "airbus-a300": "A306", "airbus-a310": "A310", "airbus-a320": "A320", "airbus-a320neo": "A20N", "airbus-a330": "A333", "airbus-a330neo": "A339", "airbus-a340": "A343", "airbus-a350": "A359", "airbus-a380": "A388", "airbus-a220": "BCS3" };
  const BUILT = { "boeing-707": 1010, "boeing-727": 1832, "boeing-737": 10250, "boeing-737max": 2100, "boeing-747": 1574, "boeing-757": 1050, "boeing-767": 1330, "boeing-777": 1760, "boeing-777x": 0, "boeing-787": 1250, "boeing-717": 156,
    "airbus-a300": 561, "airbus-a310": 255, "airbus-a320": 8100, "airbus-a320neo": 4300, "airbus-a330": 1660, "airbus-a330neo": 200, "airbus-a340": 377, "airbus-a350": 700, "airbus-a380": 251, "airbus-a220": 480 };
  const FAL = { "boeing-707": "렌턴", "boeing-727": "렌턴", "boeing-737": "렌턴", "boeing-737max": "렌턴", "boeing-747": "에버렛", "boeing-757": "렌턴", "boeing-767": "에버렛", "boeing-777": "에버렛", "boeing-777x": "에버렛", "boeing-787": "노스찰스턴 (2021년까지 에버렛 병행)", "boeing-717": "롱비치",
    "airbus-a300": "툴루즈", "airbus-a310": "툴루즈", "airbus-a320": "툴루즈 · 함부르크 · 톈진 · 모빌", "airbus-a320neo": "툴루즈 · 함부르크 · 톈진 · 모빌", "airbus-a330": "툴루즈", "airbus-a330neo": "툴루즈", "airbus-a340": "툴루즈", "airbus-a350": "툴루즈", "airbus-a380": "툴루즈", "airbus-a220": "미라벨 · 모빌" };
  const LIVE = new Set(["boeing-737max", "boeing-767", "boeing-777", "boeing-777x", "boeing-787", "airbus-a220", "airbus-a320neo", "airbus-a330neo", "airbus-a350"]);
  const SITES = [
    { name: "에버렛", region: "미국 워싱턴주", maker: "boeing", builds: "767 · 777 · 777X (과거 747 · 787)" },
    { name: "렌턴", region: "미국 워싱턴주", maker: "boeing", builds: "737 MAX (과거 707 · 727 · 757)" },
    { name: "노스찰스턴", region: "미국 사우스캐롤라이나주", maker: "boeing", builds: "787 드림라이너" },
    { name: "롱비치", region: "미국 캘리포니아주", maker: "boeing", builds: "717 (2006년 생산 종료)", closed: true },
    { name: "툴루즈", region: "프랑스", maker: "airbus", builds: "A320 · A330 · A350 (과거 A300 · A310 · A340 · A380)" },
    { name: "함부르크", region: "독일", maker: "airbus", builds: "A320 패밀리" },
    { name: "톈진", region: "중국", maker: "airbus", builds: "A320 패밀리 (2008년~)" },
    { name: "모빌", region: "미국 앨라배마주", maker: "airbus", builds: "A220 · A320 패밀리 (2015년~)" },
    { name: "미라벨", region: "캐나다 퀘벡주", maker: "airbus", builds: "A220" }
  ];
  const MARKERS = [
    { name: "에버렛 · 렌턴", maker: "boeing", coords: [47.7, -122.25], text: "767 · 777 · 777X · 737 MAX" },
    { name: "노스찰스턴", maker: "boeing", coords: [32.9, -80.04], text: "787" },
    { name: "롱비치", maker: "boeing", coords: [33.82, -118.15], text: "717 (2006년 종료)", closed: true },
    { name: "툴루즈", maker: "airbus", coords: [43.63, 1.37], text: "A320 · A330 · A350" },
    { name: "함부르크", maker: "airbus", coords: [53.54, 9.83], text: "A320 패밀리" },
    { name: "톈진", maker: "airbus", coords: [39.12, 117.35], text: "A320 패밀리" },
    { name: "모빌", maker: "airbus", coords: [30.63, -88.07], text: "A220 · A320 패밀리" },
    { name: "미라벨", maker: "airbus", coords: [45.68, -74.04], text: "A220" }
  ];
  const NOTAMS = [
    { p: "high", date: "2026", title: "777-9 첫 인도, 2027년 목표", text: "보잉은 2026년 한 해를 FAA 형식 인증에 쓰고 2027년에 첫 기체를 인도할 계획입니다.", href: "boeing-777x" },
    { p: "med", date: "2026.01", title: "2025년 인도: 에어버스 793대, 보잉 600대", text: "에어버스는 7년 연속 1위를 지켰고, 보잉은 2018년 이후 가장 많이 인도했습니다.", href: "airbus" },
    { p: "med", date: "2025.10", title: "A320 패밀리, 737 누적 인도 추월", text: "누적 12,260대를 넘어 역사상 가장 많이 인도된 여객기가 되었습니다.", href: "airbus-a320" },
    { p: "low", date: "2025.10", title: "737 MAX 월 42대 증산 승인", text: "FAA가 2024년 1월 사고 이후 유지한 월 38대 상한을 풀었습니다.", href: "boeing-737max" },
    { p: "low", date: "2024.11", title: "A321XLR 취항", text: "이베리아항공이 첫 상업 운항을 시작했습니다. 협동체 항속거리 8,700 km.", href: "airbus-a320neo" },
    { p: "low", date: "2023.01", title: "마지막 747 인도", text: "1,574번째 기체가 아틀라스항공에 인도되며 54년의 생산이 끝났습니다.", href: "boeing-747" }
  ];
  const PRI = { high: "중요", med: "보통", low: "참고" };
  const D2025 = { airbus: [["A320 패밀리", 607], ["A220", 93], ["A350", 57], ["A330", 36]], boeing: [["737", 447], ["787", 88], ["767 · 777", 65]] };

  /* ================= 아이콘 ================= */
  const I = d => `<svg class="i" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICON = {
    grid: I('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    plane: I('<path d="M12 2c.8 0 1.5 1 1.5 2.5V9l7.5 4.5v2L13.5 13v5l2.5 2v1.5L12 20.5 8 21.5V20l2.5-2v-5L3 15.5v-2L10.5 9V4.5C10.5 3 11.2 2 12 2z"/>'),
    list: I('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
    bldg: I('<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01"/>'),
    swap: I('<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>'),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    chart: I('<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>'),
    bell: I('<path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4"/>'),
    target: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
    map: I('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>'),
    info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
    doc: I('<path d="M14 3H6v18h12V7l-4-4zM14 3v4h4M9 13h6M9 17h6"/>'),
    ruler: I('<path d="M3 17L17 3l4 4L7 21l-4-4zM7 13l2 2M10 10l2 2M13 7l2 2"/>'),
    users: I('<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.5a3 3 0 010 5.5M18 14.5c1.8.8 3 2.6 3 5.5"/>'),
    weight: I('<path d="M6 8h12l2 12H4L6 8zM9 8a3 3 0 016 0"/>'),
    route: I('<circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h8a3 3 0 000-6H9a3 3 0 010-6h8"/>'),
    gauge: I('<path d="M4 18a8 8 0 1116 0M12 18l4-6"/>'),
    flag: I('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
    cup: I('<path d="M8 4h8v5a4 4 0 01-8 0V4zM8 6H4c0 3 2 4 4 4M16 6h4c0 3-2 4-4 4M12 13v4M8 20h8"/>'),
    ext: I('<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>'),
    cal: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    layers: I('<path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5"/>'),
    star: I('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/>')
  };

  /* ================= 공통 조각 ================= */
  const photoOf = ac => (typeof PHOTOS !== "undefined" && PHOTOS[ac.id]) || null;
  const CO_PHOTO = { boeing: "boeing-777x", airbus: "airbus-a330neo" };
  const pimg = (p, sm, alt, eager) => `<img src="${esc(sm && p.sm ? p.sm : p.file)}" alt="${esc(alt || "")}"${eager ? "" : ' loading="lazy"'} style="object-position:${esc(p.focus || "50% 50%")}">`;
  const pcredit = p => `사진: ${esc(p.artist)} · <a href="${esc(p.page)}" target="_blank" rel="noopener">${esc(p.license || "Wikimedia Commons")}</a>`;
  function heroHead(o) {
    const p = o.photo;
    if (!p) return `<header class="card ph ph-mk mk-${o.mk}"><div><div class="crumbs">${o.crumbs}</div><h1>${o.title}</h1>${o.sub}</div><div class="actions">${o.actions || ""}</div></header>`;
    const hp = Object.assign({}, p, { focus: p.hfocus || String(p.focus || "50% 50%").replace(/([0-9]+)%$/, (m, y) => Math.min(100, +y + 10) + "%") });
    return `<header class="hero mk-${o.mk}">${pimg(hp, false, o.alt, true)}<div class="pcr">${pcredit(p)}${p.koreanAir ? " · 대한항공 기재" : ""}</div><div class="hero-in"><div><div class="crumbs">${o.crumbs}</div><h1>${o.title}</h1>${o.sub}</div><div class="actions">${o.actions || ""}</div></div></header>`;
  }
  const live = ac => LIVE.has(ac.id);
  const statusPill = ac => `<span class="pill ${live(ac) ? "ok" : "off"}">${live(ac) ? (ac.id === "boeing-777x" ? "인증 중" : "생산 중") : "생산 종료"}</span>`;
  const catName = ac => ac.category === "wide" ? "광동체" : "협동체";
  const cabinLbl = ac => typeof ac.cabin === "string" ? ac.cabin : `하층 ${ac.cabin.lower} · 상층 ${ac.cabin.upper}`;
  const seg = (name, opts, cur, label) => `<div class="seg" role="group" aria-label="${esc(label)}">${opts.map(o => `<button type="button" id="seg-${name}-${o[0]}" data-seg="${name}" data-v="${o[0]}" class="${String(cur) === String(o[0]) ? "on" : ""}" aria-pressed="${String(cur) === String(o[0])}">${esc(o[1])}</button>`).join("")}</div>`;
  const cardH = (icon, title, extra) => `<div class="card-h">${icon}<span>${esc(title)}</span><span class="sp"></span>${extra || ""}</div>`;
  const prodYears = ac => { const m = /(\d{4})\s*[–-]\s*(\d{4}|현재)/.exec(ac.production) || []; return { a: +m[1] || +yearOf(ac.firstFlight), b: m[2] === "현재" || !m[2] ? 2026 : +m[2], open: m[2] === "현재" }; };
  function overlaySvg(A, B) {
    const maxL = Math.max(A.specs.length, B.specs.length), maxB = Math.max(A.specs.span, B.specs.span), s = 700 / (maxL + 6), H = (maxB + 8) * s;
    return `<svg class="ac-svg ov-svg" viewBox="0 0 760 ${N(H)}" role="img" aria-label="${esc(A.name)}과 ${esc(B.name)} 평면도 겹쳐 보기"><g transform="translate(30 ${N(H / 2)}) scale(${N(s)})"><g class="ov mk-${A.maker}">${topView(A)}</g><g class="ov mk-${B.maker}">${topView(B)}</g>${dimH(0, maxL, maxB / 2 + 2.5, `${maxL} m`, s)}</g></svg>`;
  }
  function fleetTable(list, cols, sortable) {
    const C = { icao: ["코드", a => `<span class="code">${ICAO[a.id]}</span>`], name: ["기종", a => `<span class="nm mk-${a.maker}"><span class="dot"></span><strong>${esc(a.name)}</strong></span>`], maker: ["제작사", a => makerName(a.maker)], category: ["구분", a => catName(a)],
      firstFlight: ["초도비행", a => `<span class="val">${yearOf(a.firstFlight)}</span>`], seats: ["표준 좌석", a => `${a.specs.seats}석`, 1], range: ["항속거리", a => `${fmt(a.specs.range)} km`, 1], length: ["길이", a => `${a.specs.length} m`, 1],
      built: ["생산 대수", a => BUILT[a.id] ? `약 ${fmt(BUILT[a.id])}` : "인도 전", 1], fal: ["최종 조립", a => esc(FAL[a.id].split(" (")[0])], status: ["상태", a => statusPill(a)] };
    const th = k => { const on = sortable && fsort.k === k; return `<th${C[k][2] ? ' class="num' + (on ? " sorted" : "") + '"' : on ? ' class="sorted"' : ""}${sortable ? ` data-sort="${k}" tabindex="0" aria-sort="${on ? (fsort.d > 0 ? "ascending" : "descending") : "none"}"` : ""}>${C[k][0]}${on ? (fsort.d > 0 ? " ▲" : " ▼") : ""}</th>`; };
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr>${cols.map(th).join("")}</tr></thead><tbody>${list.map(a => `<tr class="row-link" data-href="#${a.id}" tabindex="0">${cols.map(k => `<td${C[k][2] ? ' class="num"' : ""}>${C[k][1](a)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  function acCard(ac) {
    const S = ac.specs, p = photoOf(ac);
    return `<a class="ac-card mk-${ac.maker}" href="#${ac.id}"><div class="ac-card-fig">${p ? pimg(p, true, ac.name) : silhouette(ac, 1.75, 170, 96)}</div><div class="ac-card-body"><div class="box-top"><span class="box-code">${ICAO[ac.id]}</span>${statusPill(ac)}</div><div class="box-name"><span class="dot"></span>${esc(ac.name)}</div><div class="box-meta">${yearOf(ac.firstFlight)} · ${S.seats}석 · ${fmt(S.range)} km</div></div></a>`;
  }

  /* ================= 대시보드 ================= */
  let statSel = "all", delRange = 2000;
  function recentIds() { let r = []; try { r = JSON.parse(localStorage.getItem("hub-recent") || "[]"); } catch (e) { r = []; } r = (Array.isArray(r) ? r : []).filter(id => byId[id]); ["boeing-747", "airbus-a380", "boeing-787", "airbus-a350"].forEach(id => { if (r.length < 4 && !r.includes(id)) r.push(id); }); return r.slice(0, 4); }
  function pushRecent(id) { try { let r = JSON.parse(localStorage.getItem("hub-recent") || "[]"); r = (Array.isArray(r) ? r : []).filter(x => x !== id && byId[x]); r.unshift(id); localStorage.setItem("hub-recent", JSON.stringify(r.slice(0, 4))); } catch (e) { /* 저장소 없음 */ } }
  function box(ac) {
    const p = photoOf(ac), S = ac.specs;
    return `<a class="card box c3 mk-${ac.maker}" href="#${ac.id}">${p ? `<div class="box-img">${pimg(p, true, "")}</div>` : ""}<div class="box-b"><div class="box-top"><span class="box-code">${ICAO[ac.id]}</span>${statusPill(ac)}</div><div class="box-name"><span class="dot"></span>${esc(ac.name)}</div><div class="box-meta">${S.seats}석 · ${fmt(S.range)} km · ${S.length} m</div></div></a>`;
  }
  function fleetStats() {
    const L = AIRCRAFT.filter(a => statSel === "all" || (statSel === "live" ? live(a) : a.maker === statSel));
    const top = k => L.reduce((m, a) => a.specs[k] > m.specs[k] ? a : m, L[0]);
    const first = L.reduce((m, a) => a.firstFlight < m.firstFlight ? a : m, L[0]);
    const built = L.reduce((s, a) => s + (BUILT[a.id] || 0), 0), nar = L.filter(a => a.category === "narrow").length;
    const st = (icon, num, unit, label, sub) => `<div class="stat"><span class="stat-i">${icon}</span><span class="stat-n">${num}<small>${unit}</small></span><span class="stat-l">${label}</span>${sub ? `<span class="stat-s">${esc(sub)}</span>` : ""}</div>`;
    const r = top("range"), s = top("seats"), m = top("mtow"), l = top("length");
    return st(ICON.plane, L.length, "개", "수록 기종", `협동체 ${nar} · 광동체 ${L.length - nar}`) + st(ICON.chart, "약 " + fmt(Math.round(built / 100) * 100), "대", "누적 생산", "2025년 말 근사치") + st(ICON.flag, L.filter(live).length, "개", "생산·개발 중", "") + st(ICON.cal, yearOf(first.firstFlight), "년", "가장 이른 초도비행", short(first))
      + st(ICON.route, fmt(r.specs.range), "km", "최장 항속거리", short(r)) + st(ICON.users, s.specs.seats, "석", "최대 표준 좌석", short(s)) + st(ICON.weight, m.specs.mtow, "t", "최대 이륙중량", short(m)) + st(ICON.ruler, l.specs.length, "m", "가장 긴 기체", short(l));
  }
  function deliveryChartR(from) {
    const D = SITE.deliveries.filter(d => d[0] >= from), W = 640, H = 250, m = { l: 40, r: 46, t: 20, b: 28 };
    const gw = (W - m.l - m.r) / D.length, bw = Math.min(18, gw * 0.36), yMax = 900, Y = v => H - m.b - v / yMax * (H - m.t - m.b);
    let o = "";
    for (let v = 0; v <= yMax; v += 300) o += `<line class="grid" x1="${m.l}" y1="${N(Y(v))}" x2="${W - m.r}" y2="${N(Y(v))}"/><text class="tick" x="${m.l - 8}" y="${N(Y(v) + 4)}" text-anchor="end">${v}</text>`;
    const step = D.length > 12 ? 5 : D.length > 6 ? 2 : 1;
    D.forEach((d, i) => {
      const gx = m.l + i * gw + gw / 2;
      o += `<g data-tip="${esc(`<b>${d[0]}년</b><br>보잉 ${fmt(d[1])}대 · 에어버스 ${fmt(d[2])}대`)}"><rect class="hit" x="${N(gx - gw / 2)}" y="${m.t}" width="${N(gw)}" height="${H - m.t - m.b}"/><rect class="bar mk-boeing" x="${N(gx - bw - 1)}" y="${N(Y(d[1]))}" width="${N(bw)}" height="${N(Y(0) - Y(d[1]))}" rx="2"/><rect class="bar mk-airbus" x="${N(gx + 1)}" y="${N(Y(d[2]))}" width="${N(bw)}" height="${N(Y(0) - Y(d[2]))}" rx="2"/></g>`;
      if ((d[0] - D[D.length - 1][0]) % step === 0) o += `<text class="tick" x="${N(gx)}" y="${H - m.b + 16}" text-anchor="middle">${d[0]}</text>`;
    });
    const last = D[D.length - 1], gx = m.l + (D.length - 1) * gw + gw / 2;
    const lx = gx + bw + 6, endLab = (v, mk) => `<rect class="bar mk-${mk}" x="${N(lx)}" y="${N(Y(v) - 3)}" width="6" height="6" rx="1.5"/><text class="vlab" x="${N(lx + 9)}" y="${N(Y(v) + 3.5)}">${v}</text>`;
    o += endLab(last[1], "boeing") + endLab(last[2], "airbus") + `<line class="axis-line" x1="${m.l}" y1="${N(Y(0))}" x2="${W - m.r}" y2="${N(Y(0))}"/>`;
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${from}년부터 2025년까지 보잉과 에어버스의 연간 민간기 인도 대수">${o}</svg>`;
  }
  function delBlock() {
    const per = SITE.deliveries.filter(d => d[0] >= delRange), sb = per.reduce((s, d) => s + d[1], 0), sa = per.reduce((s, d) => s + d[2], 0);
    return `<div class="legend" style="margin-bottom:10px"><span class="lg mk-boeing">보잉 <b>${fmt(sb)}대</b></span><span class="lg mk-airbus">에어버스 <b>${fmt(sa)}대</b></span><span class="muted">${delRange}–2025년 합계</span></div><div class="plot">${deliveryChartR(delRange)}</div>`;
  }
  const prog = (label, val, max, mk, right, note) => `<div class="prog mk-${mk}"><div class="prog-h"><span><span class="dot"></span>${esc(label)}</span><span class="val">${esc(right)}</span></div><div class="prog-t"><span class="prog-f" style="width:${N(Math.min(100, val / max * 100))}%"></span></div>${note ? `<small>${esc(note)}</small>` : ""}</div>`;
  const mini = rows => `<div class="mini">${rows.map(r => `<div><span class="lbl">${esc(r[0])}</span><span class="val">${fmt(r[1])}</span></div>`).join("")}</div>`;
  function mapCard() {
    return `<section class="card c12 mapcard" id="mapcard"><div class="mapwrap"><div id="sitemap" class="sitemap" role="img" aria-label="보잉과 에어버스 최종 조립 라인 위치 지도"></div>
<div class="float-panel"><div class="fp-h"><h2>${ICON.map}최종 조립 라인</h2><p>여객기가 완성되어 출고되는 공장 9곳. 지도의 점에 올리면 생산 기종이 보입니다.</p><div class="legend" style="margin-top:8px"><span class="lg mk-boeing">보잉</span><span class="lg mk-airbus">에어버스</span></div></div>
<div class="fp-list">${SITES.map(s => `<div class="site mk-${s.maker}${s.closed ? " closed" : ""}"><div class="site-h"><span class="dot"></span>${esc(s.name)}<small>${esc(s.region)}</small></div><span class="val">${esc(s.builds)}</span>${siteLive(s)}</div>`).join("")}</div></div></div></section>`;
  }
  const siteLive = s => { const cv = coverOf(SITE_PLACE[s.name]); return cv ? `<button type="button" class="linkbtn site-live" data-live="goto:area/${SITE_PLACE[s.name]}" id="site-${SITE_PLACE[s.name]}">상공 ${fmt(cv.d.now || 0)}대 · 24시간 ${fmt(cv.d.a24 || 0)}대</button>` : ""; };
  let mapInst = null;
  function initMap() {
    const el = $("#sitemap"); mapInst = null; if (!el) return;
    document.querySelectorAll(".jvm-tooltip").forEach(n => n.remove());
    const fail = () => { const c = $("#mapcard"); if (c) c.classList.add("nomap"); };
    if (typeof jsVectorMap === "undefined") { fail(); return; }
    const tag = () => el.querySelectorAll(".jvm-marker").forEach(c => { const m = MARKERS[+c.getAttribute("data-index")]; if (m) { c.classList.add("mk-" + m.maker); if (m.closed) c.classList.add("closed"); } });
    try {
      mapInst = new jsVectorMap({ selector: "#sitemap", map: "world", backgroundColor: "transparent", zoomButtons: true, zoomOnScroll: false, showTooltip: true,
        regionStyle: { initial: { fill: "#48535f", stroke: "none" }, hover: { fillOpacity: 1, cursor: "default" } },
        markers: MARKERS.map(m => ({ name: m.name, coords: m.coords })), markerStyle: { initial: { r: 6, fill: "#8d9aaa", stroke: "#2b333e", strokeWidth: 2, fillOpacity: 1 }, hover: { r: 8, fillOpacity: 1 } },
        onLoaded() { tag(); },
        onRegionTooltipShow(event) { event.preventDefault(); },
        onMarkerTooltipShow(event, tooltip, index) { const m = MARKERS[index]; tooltip.text(`<b>${m.name}</b> · ${makerName(m.maker)}<br>${m.text}`, true); } });
      tag();
      setTimeout(() => { if (document.body.contains(el) && !el.querySelector("svg")) fail(); }, 2000);
    } catch (e) { fail(); }
  }
  /* ================= 전체 기종 ================= */
  let fq = "", fmk = "all", fcat = "all", fview = "table", fsort = { k: "firstFlight", d: 1 };
  const sortVal = (a, k) => k === "icao" ? ICAO[a.id] : (k === "seats" || k === "range" || k === "length") ? a.specs[k] : k === "built" ? (BUILT[a.id] || 0) : k === "status" ? (live(a) ? 0 : 1) : a[k];
  function fleetList() {
    const q = fq.trim().toLowerCase();
    return AIRCRAFT.filter(a => (fmk === "all" || a.maker === fmk) && (fcat === "all" || (fcat === "live" ? live(a) : a.category === fcat)) && (!q || (a.name + " " + a.en + " " + ICAO[a.id] + " " + a.role).toLowerCase().includes(q)))
      .sort((a, b) => { const x = sortVal(a, fsort.k), y = sortVal(b, fsort.k); return (x > y ? 1 : x < y ? -1 : 0) * fsort.d; });
  }
  function fleetOut() {
    const L = fleetList();
    if (!L.length) return `<p class="empty">조건에 맞는 기종이 없습니다. 검색어를 지우거나 필터를 바꿔 보세요.</p>`;
    return fview === "cards" ? `<div class="cards">${L.map(acCard).join("")}</div>` : fleetTable(L, ["icao", "name", "maker", "category", "firstFlight", "seats", "range", "length", "built", "status"], true);
  }
  function renderFleet() {
    const lineup = mk => AIRCRAFT.filter(a => a.maker === mk).sort((a, b) => a.specs.length - b.specs.length).map(ac => `<a class="lu-item mk-${ac.maker}" href="#${ac.id}" data-tip="${esc(`<b>${ac.name}</b><br>길이 ${ac.specs.length} m · 날개폭 ${ac.specs.span} m`)}">${silhouette(ac, 1.9, 180, 170)}<span>${esc(short(ac))}</span><small>${ac.specs.length} × ${ac.specs.span} m</small></a>`).join("");
    return `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / Resources</div><h1>기종 백과</h1><p>보잉 11개, 에어버스 10개 기종의 제원과 축척 도면, 개발사, 생산 거점, 인도 통계를 모은 자료실입니다. 행을 누르면 기종 페이지로 이동합니다.</p></div><div class="actions"><a class="btn ghost" href="#boeing">${ICON.bldg}보잉</a><a class="btn ghost" href="#airbus">${ICON.bldg}에어버스</a><a class="btn ghost" href="#compare">${ICON.swap}기종 비교</a><a class="btn ghost" href="#timeline">${ICON.clock}연표</a></div></header>
<div class="grid">
<section class="card c12"><div class="filters"><input class="in" id="fleet-q" type="search" placeholder="기종명·ICAO 코드·구분 검색" value="${esc(fq)}" aria-label="기종 목록 검색">${seg("fmk", [["all", "전체"], ["boeing", "보잉"], ["airbus", "에어버스"]], fmk, "제작사")}${seg("fcat", [["all", "전체"], ["narrow", "협동체"], ["wide", "광동체"], ["live", "생산 중"]], fcat, "구분")}<span class="sp" style="flex:1"></span>${seg("fview", [["table", "표"], ["cards", "사진 카드"]], fview, "보기 방식")}</div><div id="fleet-out">${fleetOut()}</div></section>
<section class="card c12">${cardH(ICON.ruler, "같은 축척으로 본 크기", `<span class="hint">1 m = 1.9 px · 길이순</span>`)}<div class="card-b"><h3 class="lane-title mk-boeing">보잉</h3><div class="lineup">${lineup("boeing")}</div><h3 class="lane-title mk-airbus">에어버스</h3><div class="lineup">${lineup("airbus")}</div></div></section>
<section class="card c12">${cardH(ICON.route, "항속거리와 좌석 수", `<span class="hint">원 크기 = 최대이륙중량</span>`)}<div class="card-b"><div class="legend" style="margin-bottom:10px"><span class="lg mk-boeing">보잉</span><span class="lg mk-airbus">에어버스</span></div><div class="plot">${scatterChart().replace('class="chart"', 'class="chart wide"')}</div></div></section>
${encyExtras()}
</div>`;
  }

  /* ================= 기종 상세 ================= */
  let viz = "three";
  function vizOut(ac) {
    const rival = ac.rival ? byId[ac.rival] : null;
    if (viz === "cabin") return `<div class="viz mk-${ac.maker}">${crossSection(ac)}</div><p class="cap">객실 단면. 좌석 배치 ${esc(cabinLbl(ac))}, 동체 폭 ${ac.specs.width} m. ${ac.specs.width >= 4.5 ? "하부 화물칸에 컨테이너를 싣습니다." : "하부는 벌크 화물칸입니다."}</p>`;
    if (viz === "overlay" && rival) return `<div class="legend" style="margin-bottom:8px"><span class="lg mk-${ac.maker}">${esc(ac.name)}</span><span class="lg mk-${rival.maker}">${esc(rival.name)}</span></div><div class="viz">${overlaySvg(ac, rival)}</div><p class="cap">경쟁 기종과 같은 축척으로 기수를 맞춰 겹친 평면도입니다.</p>`;
    return `<div class="viz mk-${ac.maker}">${threeView(ac)}</div><p class="cap">${esc(ac.variant)} 평면도, 측면도, 정면도. 길이, 날개폭, 높이, 동체 폭은 실제 치수 비율이고 문, 창, 조종면 같은 세부는 위치를 어림해 그렸습니다.</p>`;
  }
  function renderAircraft(ac) {
    const S = ac.specs, p = photoOf(ac), rival = ac.rival ? byId[ac.rival] : null, py = prodYears(ac);
    if (viz === "overlay" && !rival) viz = "three";
    const X = y => N(Math.max(0, Math.min(100, (y - 1950) / 80 * 100)));
    const kv = (icon, label, val, cls) => `<div class="kv${cls ? " " + cls : ""}"><span class="lbl">${icon}${esc(label)}</span><span class="val${/txt/.test(cls || "") ? " txt" : ""}">${esc(val)}</span></div>`;
    const tabs = [["three", "3면도"], ["cabin", "객실 단면"]].concat(rival ? [["overlay", "경쟁 기종과 겹쳐 보기"]] : []);
    return heroHead({ photo: p, mk: ac.maker, alt: `${ac.name} 사진${p ? ": " + p.title : ""}`,
      crumbs: `<a href="#home">대시보드</a> / <a href="#fleet">기종 백과</a> / <a href="#${ac.maker}">${makerName(ac.maker)}</a>`,
      title: `${esc(ac.name)} <span class="code">${ICAO[ac.id]}</span> ${statusPill(ac)}`,
      sub: `<div class="en">${esc(ac.en)} · ${esc(ac.variant)}</div><p>${esc(ac.role)} · ${esc(ac.generation)}</p>`,
      actions: `<button type="button" class="btn" data-pilot="useac:${ac.id}" id="btn-fly">${ICON.plane}이 기종으로 비행 예약</button><button type="button" class="btn ${p ? "on-dark" : "ghost"}" id="btn-cmp" data-cmp="${ac.id}|${rival ? rival.id : (ac.maker === "boeing" ? "airbus-a350" : "boeing-787")}">${ICON.swap}다른 기종과 비교</button><a class="btn ${p ? "on-dark" : "ghost"}" href="https://ko.wikipedia.org/wiki/${encodeURIComponent(ac.wikiKo)}" target="_blank" rel="noopener">${ICON.ext}위키백과</a>` }) + `
<div class="detail">
<aside class="card fl-panel mk-${ac.maker}">
<div class="legs" style="padding-top:12px"><div class="leg"><span class="lbl">${ICON.plane}초도비행</span><span class="big">${yearOf(ac.firstFlight)}</span><small>${esc(dateKo(ac.firstFlight))}</small></div><div class="leg"><span class="lbl">${ICON.flag}취항</span><span class="big">${/^\d{4}/.test(ac.intro) ? yearOf(ac.intro) : "미정"}</span><small>${esc(dateKo(ac.intro))}</small></div></div>
<div class="pstat"><div class="pstat-h">${statusPill(ac)}<span class="val">${py.a}–${py.open ? "현재" : py.b} · ${py.b - py.a}년${py.open ? "째" : "간"}</span></div><div class="pbar-track" role="img" aria-label="생산 기간 ${py.a}년부터 ${py.open ? "현재" : py.b + "년"}까지"><span class="pbar-fill" style="left:${X(py.a)}%;width:${N(X(py.b) - X(py.a))}%"></span><span class="pbar-dot" style="left:${X(+yearOf(ac.firstFlight))}%" title="초도비행 ${yearOf(ac.firstFlight)}"></span></div><div class="pbar-ax"><span>1950</span><span>1990</span><span>2030</span></div></div>
<div class="kvs">${kv(ICON.ruler, "길이", S.length + " m")}${kv(ICON.ruler, "날개폭", S.span + " m")}${kv(ICON.ruler, "높이", S.height + " m")}${kv(ICON.layers, "동체 폭", S.width + " m")}${kv(ICON.weight, "최대이륙중량", S.mtow + " t")}${kv(ICON.route, "항속거리", fmt(S.range) + " km")}${kv(ICON.users, "표준 좌석", S.seats + "석")}${kv(ICON.users, "최대 좌석", S.seatsMax + "석")}${kv(ICON.layers, "좌석 배치", cabinLbl(ac))}${kv(ICON.gauge, "상승한도", S.ceiling || "—")}${kv(ICON.gauge, "순항속도", S.cruise, "wide")}${kv(ICON.gauge, "엔진", S.engines, "wide txt")}${kv(ICON.chart, "생산 대수", ac.built, "wide txt")}${kv(ICON.bldg, "최종 조립", FAL[ac.id], "wide txt")}${kv(ICON.star, "출범 고객", ac.launchCustomer, "wide txt")}${kv(ICON.cal, "생산 기간", ac.production, "wide txt")}</div>
</aside>
<div class="stack">
<section class="card">${cardH(ICON.ruler, "도면", `<div class="tabs" role="group" aria-label="도면 종류">${tabs.map(t => `<button type="button" id="viz-${t[0]}" data-seg="viz" data-v="${t[0]}" class="${viz === t[0] ? "on" : ""}">${t[1]}</button>`).join("")}</div>`)}<div class="card-b" id="viz-out">${vizOut(ac)}</div></section>
${acLiveCard(ac)}
<section class="card">${cardH(ICON.doc, "역사")}<div class="card-b prose">${ac.history.map(t => `<p>${esc(t)}</p>`).join("")}</div></section>
<div class="grid"><section class="card c6">${cardH(ICON.info, "설계 특징")}<div class="card-b"><ul class="feats">${ac.features.map(f => `<li>${esc(f)}</li>`).join("")}</ul></div></section><section class="card c6">${cardH(ICON.flag, "한국 운항")}<div class="card-b prose"><p>${esc(ac.korea)}</p></div></section></div>
<section class="card">${cardH(ICON.clock, "주요 연혁")}<div class="card-b"><ol class="kd mk-${ac.maker}">${ac.keyDates.map(k => `<li><span class="kd-date">${esc(k[0])}</span><span>${esc(k[1])}</span></li>`).join("")}</ol></div></section>
<section class="card">${cardH(ICON.list, "파생형")}<div class="tbl-wrap"><table class="tbl"><thead><tr><th>형식</th><th>첫 비행</th><th>길이</th><th>최대 좌석</th><th>항속거리</th><th>비고</th></tr></thead><tbody>${ac.variants.map(v => `<tr>${v.map((c, i) => `<td>${i === 0 ? `<strong>${esc(c)}</strong>` : i < 5 ? `<span class="val">${esc(c)}</span>` : esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>
<section class="card">${cardH(ICON.swap, "경쟁 기종")}<div class="card-b">${rival ? `<a class="rival mk-${rival.maker}" href="#${rival.id}">${silhouette(rival, 1.2, 120, 90)}<div><strong>${esc(rival.name)}</strong> <span class="code">${ICAO[rival.id]}</span><br><span class="box-meta">${rival.specs.seats}석 · ${fmt(rival.specs.range)} km · ${rival.specs.length} m</span>${ac.rivalNote ? `<br><span class="small muted">${esc(ac.rivalNote)}</span>` : ""}</div></a>` : `<p style="margin:0">${esc(ac.rivalNote || "—")}</p>`}</div></section>
</div></div>`;
  }

  /* ================= 제작사 ================= */
  function renderCompany(mk) {
    const c = COMPANIES[mk], list = AIRCRAFT.filter(a => a.maker === mk).sort((a, b) => a.firstFlight.localeCompare(b.firstFlight));
    const cp = photoOf(byId[CO_PHOTO[mk]]);
    return heroHead({ photo: cp, mk: mk, alt: `${c.name} 여객기`, crumbs: `<a href="#home">대시보드</a> / Resources`, title: esc(c.name), sub: `<div class="en">${esc(c.en)}</div><p>${esc(c.tagline)}</p>`,
      actions: `<a class="btn ${cp ? "on-dark" : "ghost"}" href="#timeline">${ICON.clock}통합 연표</a>` }) + `
<div class="grid">
<div class="c8 stack">
<section class="card">${cardH(ICON.info, "개요")}<div class="card-b prose"><p>${esc(c.intro)}</p></div></section>
<section class="card mk-${mk}">${cardH(ICON.doc, "시대별 역사")}<div>${c.eras.map(e => `<div class="era"><div class="era-y">${esc(e.years)}</div><div><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p></div></div>`).join("")}</div></section>
</div>
<div class="c4 stack">
<section class="card">${cardH(ICON.bldg, "기본 정보")}<div class="card-b"><dl class="facts">${c.facts.map(f => `<div><dt class="lbl">${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join("")}</dl></div></section>
<section class="card">${cardH(ICON.plane, `기종 ${list.length}개`)}<div class="tbl-wrap"><table class="tbl plain"><thead><tr><th>코드</th><th>기종</th><th class="num">초도비행</th></tr></thead><tbody>${list.map(a => `<tr class="row-link" data-href="#${a.id}" tabindex="0"><td><span class="code">${ICAO[a.id]}</span></td><td><strong>${esc(a.name)}</strong></td><td class="num">${yearOf(a.firstFlight)}</td></tr>`).join("")}</tbody></table></div></section>
</div>
<section class="card c12 mk-${mk}">${cardH(ICON.clock, "연표")}<div class="card-b"><div class="tl-cols"><ol class="tl-list">${c.timeline.map(t => `<li><span class="tl-year">${t[0]}</span><div><strong>${esc(t[1])}</strong><p>${esc(t[2])}</p></div></li>`).join("")}</ol></div></div></section>
</div>`;
  }

  /* ================= 비교 ================= */
  let cmp = ["boeing-747", "airbus-a380"];
  try { const s = localStorage.getItem("hub-cmp"); if (s && s.split("|").length === 2 && s.split("|").every(id => byId[id])) cmp = s.split("|"); } catch (e) { /* 저장소 없음 */ }
  const saveCmp = () => { try { localStorage.setItem("hub-cmp", cmp.join("|")); } catch (e) { /* 무시 */ } };
  function renderCompare() {
    const A = byId[cmp[0]], B = byId[cmp[1]];
    const sel = idx => `<select id="cmp-sel-${idx}" class="sel" data-idx="${idx}" aria-label="${idx ? "두 번째" : "첫 번째"} 기종">${["boeing", "airbus"].map(mk => `<optgroup label="${makerName(mk)}">${AIRCRAFT.filter(a => a.maker === mk).map(a => `<option value="${a.id}" ${cmp[idx] === a.id ? "selected" : ""}>${ICAO[a.id]} · ${esc(a.name)}</option>`).join("")}</optgroup>`).join("")}</select>`;
    const metrics = [["길이", "length", "m"], ["날개폭", "span", "m"], ["높이", "height", "m"], ["동체 폭", "width", "m"], ["최대이륙중량", "mtow", "t"], ["항속거리", "range", "km"], ["표준 좌석", "seats", "석"], ["최대 좌석", "seatsMax", "석"]];
    const bars = metrics.map(([lab, k, u]) => { const a = A.specs[k], b = B.specs[k], mx = Math.max(a, b); return `<div class="bar-row"><div class="bar-lab">${lab}</div><div class="bars"><div class="brow"><span class="bfill mk-${A.maker}" style="width:${N(a / mx * 100)}%"></span><span class="bval">${fmt(a)} ${u}</span></div><div class="brow"><span class="bfill mk-${B.maker}" style="width:${N(b / mx * 100)}%"></span><span class="bval">${fmt(b)} ${u}</span></div></div></div>`; }).join("");
    const rows = [["대표 형식", a => a.variant], ["구분", a => a.role], ["초도비행", a => dateKo(a.firstFlight)], ["취항", a => dateKo(a.intro)], ["생산 기간", a => a.production], ["생산 대수", a => a.built], ["엔진", a => a.specs.engines], ["순항속도", a => a.specs.cruise], ["좌석 배치", a => cabinLbl(a)], ["최종 조립", a => FAL[a.id]], ["상태", a => a.status]];
    const same = A.maker === B.maker;
    const cph = a => { const p = photoOf(a); return `<a class="cmp-photo mk-${a.maker}" href="#${a.id}">${pimg(p, true, a.name)}<span>${ICAO[a.id]} · ${esc(a.name)}</span></a>`; };
    const cmpPhotos = photoOf(A) && photoOf(B) ? `<div class="cmp-photos">${cph(A)}${cph(B)}</div>` : "";
    return `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / <a href="#fleet">기종 백과</a></div><h1>기종 비교</h1><p>같은 축척의 평면도를 기수 기준으로 겹치고 주요 수치를 나란히 놓습니다.</p></div></header>
<div class="grid">
<section class="card c12"><div class="cmp-controls"><label class="cmp-pick mk-${A.maker}"><span class="dot"></span>${sel(0)}</label><button type="button" class="btn ghost" id="cmp-swap" aria-label="두 기종 순서 바꾸기">${ICON.swap}</button><label class="cmp-pick mk-${B.maker}"><span class="dot"></span>${sel(1)}</label></div>
${cmpPhotos}<div class="card-b" style="padding-top:0"><div class="viz">${overlaySvg(A, B)}</div>${same ? `<p class="cap">두 기종의 제작사가 같아 윤곽선 색이 같습니다. 큰 쪽이 바깥 윤곽입니다.</p>` : ""}</div></section>
<section class="card c5">${cardH(ICON.chart, "수치 비교", `<span class="hint">위 ${esc(short(A))} · 아래 ${esc(short(B))}</span>`)}<div class="card-b"><div class="barset">${bars}</div></div></section>
<section class="card c7">${cardH(ICON.list, "개요")}<div class="tbl-wrap"><table class="tbl plain"><thead><tr><th></th><th><a href="#${A.id}" class="ext">${ICAO[A.id]} · ${esc(short(A))}</a></th><th><a href="#${B.id}" class="ext">${ICAO[B.id]} · ${esc(short(B))}</a></th></tr></thead><tbody>${rows.map(r => `<tr><td class="muted" style="white-space:nowrap">${r[0]}</td><td>${esc(r[1](A))}</td><td>${esc(r[1](B))}</td></tr>`).join("")}</tbody></table></div></section>
</div>`;
  }

  /* ================= 연표 ================= */
  function renderTimeline() {
    const all = []; ["boeing", "airbus"].forEach(mk => COMPANIES[mk].timeline.forEach(t => all.push({ mk: mk, y: t[0], t: t[1], d: t[2] })));
    all.sort((a, b) => a.y - b.y || (a.mk === "boeing" ? -1 : 1));
    const dec = {}; all.forEach(e => { const k = Math.floor(e.y / 10) * 10; (dec[k] = dec[k] || []).push(e); });
    return `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / Resources</div><h1>연표</h1><p>수록 기종의 초도비행 시점과 두 회사의 주요 사건을 한 축에 놓았습니다. 점이나 이름을 누르면 기종 페이지로 이동합니다.</p></div></header>
<div class="grid">
<section class="card c12">${cardH(ICON.plane, "초도비행", `<div class="legend"><span class="lg mk-boeing">보잉</span><span class="lg mk-airbus">에어버스</span></div>`)}<div class="card-b"><div class="plot">${firstFlightTimeline().replace('class="chart tl"', 'class="chart tl wide"')}</div></div></section>
<section class="card c12">${cardH(ICON.clock, "주요 사건", `<div class="legend"><span class="lg mk-boeing">보잉</span><span class="lg mk-airbus">에어버스</span></div>`)}<div class="card-b"><div class="tl-cols">${Object.keys(dec).sort().map(k => `<h3 class="decade">${k}년대</h3><ol class="tl-list">${dec[k].map(e => `<li class="mk-${e.mk}"><span class="tl-year">${e.y}</span><div><strong>${esc(e.t)}</strong><p>${esc(e.d)}</p></div></li>`).join("")}</ol>`).join("")}</div></div></section>
</div>`;
  }

  /* ================= 셸 · 라우팅 ================= */
  const app = $("#app");
  const nb = AIRCRAFT.filter(a => a.maker === "boeing").length, na = AIRCRAFT.length - nb;
  $("#side").innerHTML = `<a href="#home" data-nav="home">${ICON.grid}<span>대시보드</span></a>
<div class="nav-sec">Flight Center</div>
<a href="#book" data-nav="book">${ICON.plane}<span>비행 예약</span></a>
<a href="#flights" data-nav="flights">${ICON.doc}<span>내 비행</span><span class="cnt" id="nav-pireps" hidden></span></a>
<a href="#live" data-nav="live">${ICON.map}<span>실시간 운항</span><span class="livedot" title="실시간"></span></a>
<div class="nav-sec">Pilot</div>
<a href="#profile" data-nav="profile">${ICON.users}<span>내 프로필</span></a>
<a href="#activities" data-nav="activities">${ICON.target}<span>활동</span></a>
<a href="#community" data-nav="community">${ICON.cup}<span>리더보드</span></a>
<div class="nav-sec">Resources</div>
<a href="#airports" data-nav="airports">${ICON.flag}<span>공항</span><span class="cnt">${APT.length}</span></a>
<a href="#fleet" data-nav="fleet">${ICON.list}<span>기종 백과</span><span class="cnt">${AIRCRAFT.length}</span></a>
<a href="#boeing" data-nav="boeing">${ICON.bldg}<span>보잉</span><span class="cnt">${nb}</span></a>
<a href="#airbus" data-nav="airbus">${ICON.bldg}<span>에어버스</span><span class="cnt">${na}</span></a>
<a href="#compare" data-nav="compare">${ICON.swap}<span>기종 비교</span></a>
<a href="#timeline" data-nav="timeline">${ICON.clock}<span>연표</span></a>`;
  const PAGES = { home: renderDash, book: renderBook, flights: renderFlights, live: renderLive, profile: renderProfile, activities: renderActivities, community: renderCommunity, airports: renderAirports, fleet: renderFleet, boeing: () => renderCompany("boeing"), airbus: () => renderCompany("airbus"), compare: renderCompare, timeline: renderTimeline };
  const TITLES = { book: "비행 예약", flights: "내 비행", live: "실시간 운항", profile: "내 프로필", activities: "활동", community: "리더보드", airports: "공항", fleet: "기종 백과", boeing: "보잉", airbus: "에어버스", compare: "기종 비교", timeline: "연표" };
  function route(keep) {
    let h = (location.hash || "#home").slice(1), dyn = null;
    if (!PAGES[h] && !byId[h]) { dyn = dynPage(h); if (!dyn) h = "home"; }
    const y = window.scrollY, nk = navKey(h);
    app.innerHTML = dyn || (PAGES[h] ? PAGES[h]() : renderAircraft(byId[h]));
    if (byId[h]) pushRecent(h);
    document.querySelectorAll("#side a").forEach(a => { const on = a.getAttribute("data-nav") === nk; a.classList.toggle("on", on); if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    document.body.classList.remove("nav-open");
    document.title = byId[h] ? `${byId[h].name} · Jetliner Hub` : TITLES[nk] ? `${TITLES[nk]} · Jetliner Hub` : "Jetliner Hub";
    wireLive(); initMap();
    if (h === "home") initHomeLive();
    if (h === "live") initLive(); else stopLive();
    if (byId[h]) initAcLive(byId[h]);
    pilotAfter(h);
    window.scrollTo(0, keep === true ? y : 0);
  }
  window.addEventListener("hashchange", () => route());

  /* ================= 상호작용 ================= */
  const SEG = {
    stat: v => { statSel = v; $("#stats-out").innerHTML = fleetStats(); },
    del: v => { delRange = +v; $("#del-out").innerHTML = delBlock(); },
    viz: v => { viz = v; const ac = byId[(location.hash || "").slice(1)]; if (ac) $("#viz-out").innerHTML = vizOut(ac); },
    fmk: v => { fmk = v; $("#fleet-out").innerHTML = fleetOut(); },
    fcat: v => { fcat = v; $("#fleet-out").innerHTML = fleetOut(); },
    fview: v => { fview = v; $("#fleet-out").innerHTML = fleetOut(); }
  };
  const tip = $("#tip");
  function moveTip(e) { const pad = 14, w = tip.offsetWidth, hh = tip.offsetHeight; let x = e.clientX + pad, y = e.clientY + pad; if (x + w > window.innerWidth - 8) x = e.clientX - w - pad; if (y + hh > window.innerHeight - 8) y = e.clientY - hh - pad; tip.style.left = Math.max(4, x) + "px"; tip.style.top = Math.max(4, y) + "px"; }
  document.addEventListener("mouseover", e => { const t = e.target.closest("[data-tip]"); if (!t) return; tip.innerHTML = t.getAttribute("data-tip"); tip.hidden = false; moveTip(e); });
  document.addEventListener("mousemove", e => { if (!tip.hidden) moveTip(e); });
  document.addEventListener("mouseout", e => { const t = e.target.closest("[data-tip]"); if (t && !t.contains(e.relatedTarget)) tip.hidden = true; });
  const sIn = $("#q"), sPop = $("#q-pop");
  const searchRes = q => { q = q.trim().toLowerCase(); if (!q) return []; const ac = AIRCRAFT.filter(a => (a.name + " " + a.en + " " + ICAO[a.id]).toLowerCase().includes(q)).slice(0, 5).map(a => ({ href: a.id, code: ICAO[a.id], name: a.name, mk: a.maker })), ap = APT.filter(a => aptText(a).includes(q)).slice(0, 5).map(a => ({ href: "apt-" + a[0], code: a[0], name: a[2] + " 공항", mk: "" })); return (ap.some(x => x.code.toLowerCase() === q) ? ap.concat(ac) : ac.concat(ap)).slice(0, 8); };
  const closeSearch = () => { sPop.hidden = true; };
  sIn.addEventListener("input", () => { const q = sIn.value.trim(), r = searchRes(q); sPop.hidden = !q; sPop.innerHTML = r.length ? r.map((a, i) => `<a href="#${a.href}" class="${a.mk ? "mk-" + a.mk : ""}${i ? "" : " sel"}"><span class="code">${a.code}</span>${a.mk ? `<span class="dot" style="margin:0"></span>` : ""}<span>${esc(a.name)}</span></a>`).join("") : `<p class="empty" style="padding:8px 10px">일치하는 공항이나 기종이 없습니다. 이름이나 코드로 찾아보세요.</p>`; });
  sIn.addEventListener("keydown", e => { if (e.key === "Enter") { const r = searchRes(sIn.value); if (r[0]) { location.hash = r[0].href; sIn.value = ""; closeSearch(); sIn.blur(); } } else if (e.key === "Escape") { closeSearch(); sIn.blur(); } });
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); sIn.focus(); sIn.select(); return; }
    if (e.key === "Enter" && e.target.matches && e.target.matches("[data-href]")) location.hash = e.target.getAttribute("data-href");
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("th[data-sort]")) { e.preventDefault(); e.target.click(); }
  });
  document.addEventListener("click", e => {
    if (!e.target.closest(".search")) closeSearch(); else if (e.target.closest(".search-pop a")) { sIn.value = ""; closeSearch(); }
    const sg = e.target.closest("[data-seg]");
    if (sg) { sg.parentNode.querySelectorAll("button").forEach(b => { b.classList.toggle("on", b === sg); b.setAttribute("aria-pressed", b === sg); }); SEG[sg.getAttribute("data-seg")](sg.getAttribute("data-v")); return; }
    const so = e.target.closest("th[data-sort]");
    if (so) { const k = so.getAttribute("data-sort"); fsort = { k: k, d: fsort.k === k ? -fsort.d : 1 }; $("#fleet-out").innerHTML = fleetOut(); return; }
    const c = e.target.closest("[data-cmp]");
    if (c) { cmp = c.getAttribute("data-cmp").split("|"); saveCmp(); if (location.hash === "#compare") route(); else location.hash = "compare"; return; }
    if (e.target.closest("#cmp-swap")) { cmp = [cmp[1], cmp[0]]; saveCmp(); route(true); return; }
    const go = e.target.closest("[data-href]"); if (go && !e.target.closest("a")) { location.hash = go.getAttribute("data-href"); }
  });
  document.addEventListener("change", e => { const s = e.target.closest("select.sel[data-idx]"); if (!s) return; cmp[+s.getAttribute("data-idx")] = s.value; saveCmp(); route(true); });
  document.addEventListener("input", e => { if (e.target.id === "fleet-q") { fq = e.target.value; $("#fleet-out").innerHTML = fleetOut(); } });
  $("#menu").addEventListener("click", () => { if (window.matchMedia("(max-width:900px)").matches) document.body.classList.toggle("nav-open"); else { document.body.classList.toggle("nav-collapsed"); if (mapInst && mapInst.updateSize) setTimeout(() => { try { mapInst.updateSize(); } catch (e) { /* 무시 */ } }, 30); } });
  $("#backdrop").addEventListener("click", () => document.body.classList.remove("nav-open"));
  try { const t = localStorage.getItem("hub-theme"); if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t); } catch (e) { /* 저장소 없음 */ }
  $("#theme").addEventListener("click", () => { const root = document.documentElement, cur = root.getAttribute("data-theme") || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"), next = cur === "dark" ? "light" : "dark"; root.setAttribute("data-theme", next); try { localStorage.setItem("hub-theme", next); } catch (e) { /* 무시 */ } });
  const clock = $("#clock"), tick = () => { clock.textContent = new Date().toISOString().slice(11, 19) + "z"; };
  tick(); setInterval(tick, 1000);

  /* 지도 라이브러리는 문서 파싱이 끝난 뒤에만 바로 초기화되므로 첫 렌더링을 그때로 맞춘다 */
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => route()); else route();
})();
