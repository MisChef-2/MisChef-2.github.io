
  /* ================= Hub 전용 데이터 ================= */
  const ICAO = { "boeing-707": "B703", "boeing-727": "B722", "boeing-737": "B738", "boeing-737max": "B38M", "boeing-747": "B744", "boeing-757": "B752", "boeing-767": "B763", "boeing-777": "B77W", "boeing-777x": "B779", "boeing-787": "B789", "boeing-717": "B712",
    "airbus-a300": "A306", "airbus-a310": "A310", "airbus-a320": "A320", "airbus-a320neo": "A20N", "airbus-a330": "A333", "airbus-a330neo": "A339", "airbus-a340": "A343", "airbus-a350": "A359", "airbus-a380": "A388", "airbus-a220": "BCS3" };
  const BUILT = { "boeing-707": 1010, "boeing-727": 1832, "boeing-737": 10250, "boeing-737max": 2100, "boeing-747": 1574, "boeing-757": 1050, "boeing-767": 1330, "boeing-777": 1760, "boeing-777x": 0, "boeing-787": 1250, "boeing-717": 156,
    "airbus-a300": 561, "airbus-a310": 255, "airbus-a320": 8100, "airbus-a320neo": 4300, "airbus-a330": 1660, "airbus-a330neo": 200, "airbus-a340": 377, "airbus-a350": 700, "airbus-a380": 251, "airbus-a220": 480 };
  const FAL = { "boeing-707": "렌턴", "boeing-727": "렌턴", "boeing-737": "렌턴", "boeing-737max": "렌턴", "boeing-747": "에버렛", "boeing-757": "렌턴", "boeing-767": "에버렛", "boeing-777": "에버렛", "boeing-777x": "에버렛", "boeing-787": "노스찰스턴 (2021년까지 에버렛 병행)", "boeing-717": "롱비치",
    "airbus-a300": "툴루즈", "airbus-a310": "툴루즈", "airbus-a320": "툴루즈, 함부르크, 톈진, 모빌", "airbus-a320neo": "툴루즈, 함부르크, 톈진, 모빌", "airbus-a330": "툴루즈", "airbus-a330neo": "툴루즈", "airbus-a340": "툴루즈", "airbus-a350": "툴루즈", "airbus-a380": "툴루즈", "airbus-a220": "미라벨, 모빌" };
  const LIVE = new Set(["boeing-737max", "boeing-767", "boeing-777", "boeing-777x", "boeing-787", "airbus-a220", "airbus-a320neo", "airbus-a330neo", "airbus-a350"]);
  const SITES = [
    { name: "에버렛", region: "미국 워싱턴주", maker: "boeing", builds: "767, 777, 777X (과거 747, 787)" },
    { name: "렌턴", region: "미국 워싱턴주", maker: "boeing", builds: "737 MAX (과거 707, 727, 757)" },
    { name: "노스찰스턴", region: "미국 사우스캐롤라이나주", maker: "boeing", builds: "787 드림라이너" },
    { name: "롱비치", region: "미국 캘리포니아주", maker: "boeing", builds: "717 (2006년 생산 종료)", closed: true },
    { name: "툴루즈", region: "프랑스", maker: "airbus", builds: "A320, A330, A350 (과거 A300, A310, A340, A380)" },
    { name: "함부르크", region: "독일", maker: "airbus", builds: "A320 패밀리" },
    { name: "톈진", region: "중국", maker: "airbus", builds: "A320 패밀리 (2008년~)" },
    { name: "모빌", region: "미국 앨라배마주", maker: "airbus", builds: "A220, A320 패밀리 (2015년~)" },
    { name: "미라벨", region: "캐나다 퀘벡주", maker: "airbus", builds: "A220" }
  ];
  const MARKERS = [
    { name: "에버렛, 렌턴", maker: "boeing", coords: [47.7, -122.25], text: "767, 777, 777X, 737 MAX" },
    { name: "노스찰스턴", maker: "boeing", coords: [32.9, -80.04], text: "787" },
    { name: "롱비치", maker: "boeing", coords: [33.82, -118.15], text: "717 (2006년 종료)", closed: true },
    { name: "툴루즈", maker: "airbus", coords: [43.63, 1.37], text: "A320, A330, A350" },
    { name: "함부르크", maker: "airbus", coords: [53.54, 9.83], text: "A320 패밀리" },
    { name: "톈진", maker: "airbus", coords: [39.12, 117.35], text: "A320 패밀리" },
    { name: "모빌", maker: "airbus", coords: [30.63, -88.07], text: "A220, A320 패밀리" },
    { name: "미라벨", maker: "airbus", coords: [45.68, -74.04], text: "A220" }
  ];
  const NOTAMS = [
    { p: "high", date: "2026", title: "777-9 첫 인도, 2027년 목표", text: "보잉은 2026년 한 해를 FAA 형식 인증에 쓰고 2027년에 첫 기체를 인도할 계획입니다.", href: "boeing-777x" },
    { p: "med", date: "2026.01", title: "2025년 인도: 에어버스 793대, 보잉 600대", text: "에어버스는 7년 연속 1위를 지켰고, 보잉은 2018년 이후 가장 많이 인도했습니다.", href: "airbus" },
    { p: "med", date: "2025.10", title: "A320 패밀리, 737 누적 인도 추월", text: "누적 12,260대를 넘어 역사상 가장 많이 인도된 여객기가 됐습니다.", href: "airbus-a320" },
    { p: "low", date: "2025.10", title: "737 MAX 월 42대 증산 승인", text: "FAA가 2024년 1월 사고 이후 유지한 월 38대 상한을 풀었습니다.", href: "boeing-737max" },
    { p: "low", date: "2024.11", title: "A321XLR 취항", text: "이베리아항공이 첫 상업 운항을 시작했습니다. 협동체 항속거리 8,700 km.", href: "airbus-a320neo" },
    { p: "low", date: "2023.01", title: "마지막 747 인도", text: "1,574번째 기체가 아틀라스항공에 인도되며 54년의 생산이 끝났습니다.", href: "boeing-747" }
  ];
  const PRI = { high: "중요", med: "보통", low: "참고" };
  const D2025 = { airbus: [["A320 패밀리", 607], ["A220", 93], ["A350", 57], ["A330", 36]], boeing: [["737", 447], ["787", 88], ["767, 777", 65]] };

  /* ================= 아이콘 ================= */
  /* 아이콘: 항공 주제로 직접 그린 한 벌. 24 격자, 선 1.7, 끝은 둥글게, 주 형태에만 옅은 채움(F) */
  const I = d => `<svg class="i" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const F = 'fill="currentColor" fill-opacity=".16"';
  const ICON = {
    // 대시보드: 계기판
    grid: I(`<rect x="2.5" y="4" width="19" height="16" rx="3" ${F}/><circle cx="8" cy="10.5" r="2.7"/><circle cx="16" cy="10.5" r="2.7"/><path d="M8 10.5l1.4-1.2M16 10.5h1.8M6.5 16.5h3M14.5 16.5h3"/>`),
    // 여객기 (위에서 본 모습)
    plane: I(`<path ${F} d="M12 2.2c.9 0 1.6 1.1 1.6 2.6v4.4l7.6 4.6v2.1l-7.6-2.5v4.5l2.5 1.9v1.6L12 20.4l-4.1 1v-1.6l2.5-1.9v-4.5l-7.6 2.5v-2.1l7.6-4.6V4.8c0-1.5.7-2.6 1.6-2.6z"/>`),
    // 목록: 운항 스트립
    list: I(`<rect x="3" y="4" width="18" height="4.2" rx="1.3" ${F}/><rect x="3" y="9.9" width="18" height="4.2" rx="1.3"/><rect x="3" y="15.8" width="18" height="4.2" rx="1.3"/><path d="M7 4v4.2M7 9.9v4.2M7 15.8V20"/>`),
    // 제작사: 격납고
    bldg: I(`<path ${F} d="M2.5 20.5V12a9.5 7.5 0 0119 0v8.5"/><path d="M1.5 20.5h21M7.5 20.5v-6h9v6M12 14.5v6"/>`),
    // 비교: 엇갈린 두 화살
    swap: I(`<path d="M4 8h15M15.5 4.5L19 8l-3.5 3.5M20 16H5M8.5 12.5L5 16l3.5 3.5"/>`),
    // 시간: 눈금 있는 시계
    clock: I(`<circle cx="12" cy="12" r="9" ${F}/><path d="M12 7.5V12l3.2 2M12 3.8v1.4M12 18.8v1.4M3.8 12h1.4M18.8 12h1.4"/>`),
    // 통계: 막대와 추세
    chart: I(`<path d="M3 20.5h18"/><rect x="4.5" y="12" width="3.6" height="8.5" rx="1" ${F}/><rect x="10.2" y="8" width="3.6" height="12.5" rx="1" ${F}/><rect x="15.9" y="10.5" width="3.6" height="10" rx="1" ${F}/><path d="M6.3 8.5l5.7-4 5.7 2.5"/>`),
    // NOTAM: 전파를 내는 안테나
    bell: I(`<circle cx="12" cy="8.5" r="1.8" ${F}/><path d="M12 10.3V21M8.5 21h7M8.3 5a5.2 5.2 0 000 7M15.7 5a5.2 5.2 0 010 7M5.6 2.7a8.6 8.6 0 000 11.6M18.4 2.7a8.6 8.6 0 010 11.6"/>`),
    // 활동: VOR 표지 (육각형)
    target: I(`<path ${F} d="M7.5 4.2h9L21 12l-4.5 7.8h-9L3 12z"/><circle cx="12" cy="12" r="2.2"/><path d="M12 2v2.2M12 19.8V22"/>`),
    // 지도: 접힌 항공 지도와 항로
    map: I(`<path ${F} d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/><path d="M5.5 15.5c2-1 3-4 6-4.5s4 1.5 6-2" stroke-dasharray="1.6 2.2"/>`),
    info: I(`<circle cx="12" cy="12" r="9" ${F}/><path d="M12 11v5.5M12 7.8h.01"/>`),
    // PIREP: 클립보드
    doc: I(`<rect x="4.5" y="4" width="15" height="17.5" rx="2" ${F}/><path d="M9 4V2.8h6V4M8.5 10.5h7M8.5 14h7M8.5 17.5h4"/>`),
    ruler: I(`<path ${F} d="M3 16.5L16.5 3l4.5 4.5L7.5 21z"/><path d="M7 12.5l2 2M10 9.5l1.4 1.4M13 6.5l2 2"/>`),
    // 조종사들: 조종모를 쓴 두 사람
    users: I(`<circle cx="9" cy="9.5" r="3" ${F}/><path d="M5.6 7.6c1.2-2.6 5.6-2.6 6.8 0M5.3 7.6h7.4M3 20.5c0-3.3 2.7-6 6-6s6 2.7 6 6M16.2 6.8a3 3 0 010 5.6M18 14.8c1.8.8 3 2.6 3 5.7"/>`),
    // 연료: 연료통
    weight: I(`<path ${F} d="M5 7.5h11l3 3v10H5z"/><path d="M8 7.5V5.5h5v2M16 7.5V4.5l2.5 2.5M9 14h5"/>`),
    // 항로: 두 공항을 잇는 대권
    route: I(`<circle cx="4.8" cy="17.5" r="2.2" ${F}/><circle cx="19.2" cy="17.5" r="2.2" ${F}/><path d="M6.4 15.8C8.5 8.5 15.5 8.5 17.6 15.8" stroke-dasharray="2 2.4"/><path d="M12 7.3l1.7.6-1.7.6"/>`),
    // 점수: 속도계
    gauge: I(`<path ${F} d="M3.5 17.5a8.5 8.5 0 1117 0z"/><path d="M12 17.5l4.2-5.2M6 13.2l1.3.7M12 9V10.5M18 13.2l-1.3.7"/>`),
    // 공항: 관제탑
    flag: I(`<path ${F} d="M7.5 6.5h9l-1.6 4.5H9.1z"/><path d="M9.6 11l-1 10M14.4 11l1 10M6 21h12M12 6.5V3.5M10.2 3.5h3.6"/>`),
    // 리더보드: 시상대
    cup: I(`<path d="M2.5 20.5h19"/><path ${F} d="M9 20.5V9.5h6v11"/><path d="M3.5 20.5V14h5.5M15 12.5h5.5v8M12 5.2l.8 1.6 1.7.2-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.2z"/>`),
    ext: I('<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>'),
    // 예약: 탑승권
    cal: I(`<path ${F} d="M3 7.5A2.5 2.5 0 015.5 5h13A2.5 2.5 0 0121 7.5V10a2 2 0 000 4v2.5a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16.5V14a2 2 0 000-4z"/><path d="M15.5 5.5v13" stroke-dasharray="1.4 2"/><path d="M6.5 10.5h5M6.5 13.5h3"/>`),
    // 화물: 컨테이너
    layers: I(`<path ${F} d="M3 8l9-4.5L21 8v9l-9 4.5L3 17z"/><path d="M3 8l9 4.5L21 8M12 12.5v9"/>`),
    // 계급: 조종사 날개 휘장
    star: I(`<circle cx="12" cy="11" r="2.6" ${F}/><path d="M9.4 10.5H2c.8 2.4 3.2 3.8 6.6 3.8M14.6 10.5H22c-.8 2.4-3.2 3.8-6.6 3.8M4.5 12.8h4.2M15.3 12.8h4.2M12 13.6v4"/>`),
    // 지구와 궤도
    globe: I(`<circle cx="12" cy="12" r="8.5" ${F}/><path d="M3.5 12h17M12 3.5c2.6 2.8 2.6 14.2 0 17M12 3.5c-2.6 2.8-2.6 14.2 0 17"/>`),
    // 조종사 한 명
    user: I(`<circle cx="12" cy="9" r="3.6" ${F}/><path d="M7.6 6.8c1.6-3.3 7.2-3.3 8.8 0M7.2 6.8h9.6M4.5 21c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5"/>`),
    gear: I(`<path ${F} d="M12 2.8l1.7 2.3 2.8-.8.6 2.8 2.8.6-.8 2.8 2.3 1.7-2.3 1.5.8 2.9-2.8.6-.6 2.8-2.8-.8L12 21.2l-1.7-2.3-2.8.8-.6-2.8-2.8-.6.8-2.9L2.8 12l2.3-1.7-.8-2.8 2.8-.6.6-2.8 2.8.8z"/><circle cx="12" cy="12" r="3"/>`),
    // 규정: 색인 탭이 달린 교범
    book: I(`<path ${F} d="M4 4.5A2 2 0 016 2.5h12v17H6a2 2 0 00-2 2z"/><path d="M4 19.5a2 2 0 012-2h12M18 6h2.5v3H18M18 10.5h2.5v3H18M8 6.5h6"/>`),
    dice: I(`<rect x="4" y="4" width="16" height="16" rx="3.5" ${F}/><path d="M9 9h.01M15 9h.01M12 12h.01M9 15h.01M15 15h.01" stroke-width="2.6"/>`),
    pin: I(`<path ${F} d="M12 21s7-6.2 7-11.5a7 7 0 10-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>`),
    // 패스포트: 지구 문장이 찍힌 여권
    pass: I(`<rect x="5" y="2.5" width="14" height="19" rx="2" ${F}/><circle cx="12" cy="10" r="3.4"/><path d="M8.6 10h6.8M12 6.6c1.2 1.2 1.2 5.6 0 6.8M9 17.5h6"/>`),
    // 배지: 방패와 별
    medal: I(`<path ${F} d="M12 2.8l7.5 3v5.4c0 4.6-3.1 8.2-7.5 10-4.4-1.8-7.5-5.4-7.5-10V5.8z"/><path d="M12 7.6l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z"/>`),
    // 비행 원리: 날개 단면과 흐름선
    wing: I(`<path ${F} d="M2.5 13.5c3-4 9-5.5 19-2.2-6.2 1.4-12.6 2.6-19 2.2z"/><path d="M2 8.5h9M5 18.5h12M14 6.5c2.5 0 5 .6 7.5 2"/>`),
    chev: I('<path d="M9 6l6 6-6 6"/>'),
    check: I('<path d="M5 12.5l4.5 4.5L19 7"/>')
  };

  /* ================= 공통 조각 ================= */
  const photoOf = ac => (typeof PHOTOS !== "undefined" && PHOTOS[ac.id]) || null;
  const CO_PHOTO = { boeing: "boeing-777x", airbus: "airbus-a330neo" };
  const pimg = (p, sm, alt, eager) => `<img src="${esc(sm && p.sm ? p.sm : p.file)}" alt="${esc(alt || "")}"${eager ? "" : ' loading="lazy"'} style="object-position:${esc(p.focus || "50% 50%")}">`;
  const pcredit = p => `사진: ${esc(p.artist)}, <a href="${esc(p.page)}" target="_blank" rel="noopener">${esc(p.license || "Wikimedia Commons")}</a>`;
  function heroHead(o) {
    const p = o.photo;
    if (!p) return `<header class="card ph ph-mk mk-${o.mk}"><div><div class="crumbs">${o.crumbs}</div><h1>${o.title}</h1>${o.sub}</div><div class="actions">${o.actions || ""}</div></header>`;
    const hp = Object.assign({}, p, { focus: p.hfocus || String(p.focus || "50% 50%").replace(/([0-9]+)%$/, (m, y) => Math.min(100, +y + 10) + "%") });
    return `<header class="hero mk-${o.mk}">${pimg(hp, false, o.alt, true)}<div class="pcr">${pcredit(p)}${p.koreanAir ? ", 대한항공 기재" : ""}</div><div class="hero-in"><div><div class="crumbs">${o.crumbs}</div><h1>${o.title}</h1>${o.sub}</div><div class="actions">${o.actions || ""}</div></div></header>`;
  }
  const live = ac => LIVE.has(ac.id);
  const statusPill = ac => `<span class="pill ${live(ac) ? "ok" : "off"}">${live(ac) ? (ac.id === "boeing-777x" ? "인증 중" : "생산 중") : "생산 종료"}</span>`;
  const catName = ac => ac.category === "wide" ? "광동체" : "협동체";
  const cabinLbl = ac => typeof ac.cabin === "string" ? ac.cabin : `하층 ${ac.cabin.lower}, 상층 ${ac.cabin.upper}`;
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
    return `<a class="ac-card mk-${ac.maker}" href="#${ac.id}"><div class="ac-card-fig">${p ? pimg(p, true, ac.name) : silhouette(ac, 1.75, 170, 96)}</div><div class="ac-card-body"><div class="box-top"><span class="box-code">${ICAO[ac.id]}</span>${statusPill(ac)}</div><div class="box-name"><span class="dot"></span>${esc(ac.name)}</div><div class="box-meta">${yearOf(ac.firstFlight)}, ${S.seats}석, ${fmt(S.range)} km</div></div></a>`;
  }

  /* ================= 대시보드 ================= */
  let statSel = "all", delRange = 2000;
  function recentIds() { let r = []; try { r = JSON.parse(localStorage.getItem("hub-recent") || "[]"); } catch (e) { r = []; } r = (Array.isArray(r) ? r : []).filter(id => byId[id]); ["boeing-747", "airbus-a380", "boeing-787", "airbus-a350"].forEach(id => { if (r.length < 4 && !r.includes(id)) r.push(id); }); return r.slice(0, 4); }
  function pushRecent(id) { try { let r = JSON.parse(localStorage.getItem("hub-recent") || "[]"); r = (Array.isArray(r) ? r : []).filter(x => x !== id && byId[x]); r.unshift(id); localStorage.setItem("hub-recent", JSON.stringify(r.slice(0, 4))); } catch (e) { /* 저장소 없음 */ } }
  function box(ac) {
    const p = photoOf(ac), S = ac.specs;
    return `<a class="card box c3 mk-${ac.maker}" href="#${ac.id}">${p ? `<div class="box-img">${pimg(p, true, "")}</div>` : ""}<div class="box-b"><div class="box-top"><span class="box-code">${ICAO[ac.id]}</span>${statusPill(ac)}</div><div class="box-name"><span class="dot"></span>${esc(ac.name)}</div><div class="box-meta">${S.seats}석, ${fmt(S.range)} km, ${S.length} m</div></div></a>`;
  }
  function fleetStats() {
    const L = AIRCRAFT.filter(a => statSel === "all" || (statSel === "live" ? live(a) : a.maker === statSel));
    const top = k => L.reduce((m, a) => a.specs[k] > m.specs[k] ? a : m, L[0]);
    const first = L.reduce((m, a) => a.firstFlight < m.firstFlight ? a : m, L[0]);
    const built = L.reduce((s, a) => s + (BUILT[a.id] || 0), 0), nar = L.filter(a => a.category === "narrow").length;
    const st = (icon, num, unit, label, sub) => `<div class="stat"><span class="stat-i">${icon}</span><span class="stat-n">${num}<small>${unit}</small></span><span class="stat-l">${label}</span>${sub ? `<span class="stat-s">${esc(sub)}</span>` : ""}</div>`;
    const r = top("range"), s = top("seats"), m = top("mtow"), l = top("length");
    return st(ICON.plane, L.length, "개", "수록 기종", `협동체 ${nar}, 광동체 ${L.length - nar}`) + st(ICON.chart, "약 " + fmt(Math.round(built / 100) * 100), "대", "누적 생산", "2025년 말 근사치") + st(ICON.flag, L.filter(live).length, "개", "생산 또는 개발 중", "") + st(ICON.cal, yearOf(first.firstFlight), "년", "가장 이른 초도비행", short(first))
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
      o += `<g data-tip="${esc(`<b>${d[0]}년</b><br>보잉 ${fmt(d[1])}대, 에어버스 ${fmt(d[2])}대`)}"><rect class="hit" x="${N(gx - gw / 2)}" y="${m.t}" width="${N(gw)}" height="${H - m.t - m.b}"/><rect class="bar mk-boeing" x="${N(gx - bw - 1)}" y="${N(Y(d[1]))}" width="${N(bw)}" height="${N(Y(0) - Y(d[1]))}" rx="2"/><rect class="bar mk-airbus" x="${N(gx + 1)}" y="${N(Y(d[2]))}" width="${N(bw)}" height="${N(Y(0) - Y(d[2]))}" rx="2"/></g>`;
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
<div class="float-panel"><div class="fp-h"><h2>${ICON.map}최종 조립 라인</h2><p>여객기가 완성되어 출고되는 공장 9곳. 지도의 점에 마우스를 올리면 생산 기종이 보입니다.</p><div class="legend" style="margin-top:8px"><span class="lg mk-boeing">보잉</span><span class="lg mk-airbus">에어버스</span></div></div>
<div class="fp-list">${SITES.map(s => `<div class="site mk-${s.maker}${s.closed ? " closed" : ""}"><div class="site-h"><span class="dot"></span>${esc(s.name)}<small>${esc(s.region)}</small></div><span class="val">${esc(s.builds)}</span>${siteLive(s)}</div>`).join("")}</div></div></div></section>`;
  }
  const siteLive = s => { const cv = coverOf(SITE_PLACE[s.name]); return cv ? `<button type="button" class="linkbtn site-live" data-live="goto:area/${SITE_PLACE[s.name]}" id="site-${SITE_PLACE[s.name]}">상공 ${fmt(cv.d.now || 0)}대, 24시간 ${fmt(cv.d.a24 || 0)}대</button>` : ""; };
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
        onMarkerTooltipShow(event, tooltip, index) { const m = MARKERS[index]; tooltip.text(`<b>${m.name}</b>, ${makerName(m.maker)}<br>${m.text}`, true); } });
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
    const lineup = mk => AIRCRAFT.filter(a => a.maker === mk).sort((a, b) => a.specs.length - b.specs.length).map(ac => `<a class="lu-item mk-${ac.maker}" href="#${ac.id}" data-tip="${esc(`<b>${ac.name}</b><br>길이 ${ac.specs.length} m, 날개폭 ${ac.specs.span} m`)}">${silhouette(ac, 1.9, 180, 170)}<span>${esc(short(ac))}</span><small>${ac.specs.length} × ${ac.specs.span} m</small></a>`).join("");
    return `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / 자료</div><h1>기종 백과</h1><p>보잉 11개, 에어버스 10개 기종의 제원과 축척 도면, 개발 배경, 생산 거점, 인도 통계를 모았습니다. 행을 누르면 기종 페이지로 갑니다.</p></div></header>
<div class="grid">
<section class="card c12"><div class="filters"><input class="in" id="fleet-q" type="search" placeholder="기종명, ICAO 코드, 구분으로 검색" value="${esc(fq)}" aria-label="기종 목록 검색">${seg("fmk", [["all", "전체"], ["boeing", "보잉"], ["airbus", "에어버스"]], fmk, "제작사")}${seg("fcat", [["all", "전체"], ["narrow", "협동체"], ["wide", "광동체"], ["live", "생산 중"]], fcat, "구분")}<span class="sp" style="flex:1"></span>${seg("fview", [["table", "표"], ["cards", "사진 카드"]], fview, "보기 방식")}</div><div id="fleet-out">${fleetOut()}</div></section>
<section class="card c12">${cardH(ICON.ruler, "같은 축척으로 본 크기", `<span class="hint">1 m = 1.9 px, 길이순</span>`)}<div class="card-b"><h3 class="lane-title mk-boeing">보잉</h3><div class="lineup">${lineup("boeing")}</div><h3 class="lane-title mk-airbus">에어버스</h3><div class="lineup">${lineup("airbus")}</div></div></section>
<section class="card c12">${cardH(ICON.route, "항속거리와 좌석 수", `<span class="hint">원 크기 = 최대이륙중량</span>`)}<div class="card-b"><div class="legend" style="margin-bottom:10px"><span class="lg mk-boeing">보잉</span><span class="lg mk-airbus">에어버스</span></div><div class="plot">${scatterChart().replace('class="chart"', 'class="chart wide"')}</div></div></section>
${encyExtras()}
</div>`;
  }

  /* ================= 기종 상세 ================= */
  let viz = "three";
  function vizOut(ac) {
    const rival = ac.rival ? byId[ac.rival] : null;
    if (viz === "cabin") return `<div class="viz mk-${ac.maker}">${crossSection(ac)}</div><p class="cap">객실 단면. 좌석 배치 ${esc(cabinLbl(ac))}, 동체 폭 ${ac.specs.width} m. ${ac.specs.width >= 4.5 ? "하부 화물칸에 컨테이너를 싣습니다." : "하부는 벌크 화물칸입니다."}</p>`;
    if (viz === "overlay" && rival) return `${ART_DEFS}<figure class="art-fig" style="margin:0"><div class="art-scroll">${cmpSide(ac, rival)}</div></figure><p class="cap">경쟁 기종과 같은 축척으로 기수를 맞춰 놓은 측면 그림입니다. 평면과 정면까지 보려면 <a class="ext" href="#compare" data-cmp="${ac.id}|${rival.id}">기종 비교</a>로 가세요.</p>`;
    return `<div class="viz mk-${ac.maker}">${threeView(ac)}</div><p class="cap">${esc(ac.variant)} 평면도, 측면도, 정면도. 길이, 날개폭, 높이, 동체 폭은 실제 치수 비율이고 문, 창, 조종면 같은 세부는 위치를 어림해 그렸습니다.</p>`;
  }
  // 개발 배경: 이 기종이 왜 만들어졌는지 (why.js)
  function whyCard(ac) {
    const w = typeof WHY !== "undefined" ? WHY[ac.id] : null; if (!w) return "";
    const row = (l, t) => `<div class="era"><div class="era-y">${l}</div><div><p>${esc(t)}</p></div></div>`;
    return `<section class="card why mk-${ac.maker}" id="why">${cardH(ICON.target, "왜 만들어졌나", `<a class="ext small" href="#timeline">시대별 개발 배경 →</a>`)}<p class="why-q">${esc(w.q)}</p><div>${row("시대 배경", w.bg)}${row("누가 무엇을<br>원했나", w.need)}${row("설계의 답", w.answer)}${row("그 뒤", w.result)}</div></section>`;
  }
  function whyEras() {
    if (typeof WHY_ERAS === "undefined") return "";
    return `<section class="card c12 why-eras">${cardH(ICON.target, "왜 만들어졌나: 시대별 개발 배경", `<span class="hint">문제 → 답으로 나온 기종</span>`)}<div>${WHY_ERAS.map(e => `<div class="era"><div class="era-y">${esc(e.years)}</div><div><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p><div class="tour-legs" style="margin-top:10px">${e.ids.map(id => `<a class="tleg why-chip mk-${byId[id].maker}" href="#${id}"><span class="dot"></span>${ICAO[id]} ${esc(byId[id].name)}</a>`).join("")}</div></div></div>`).join("")}</div></section>`;
  }
  /* ================= 3D 모형 =================
     위: 3D 모형 뷰어(3d/viewer?embed). 뷰어 자체 사이드바와 제목은 숨기고, 색과 글꼴은 허브 테마를 넘겨 준다.
     기종은 허브 쪽 선택 상자로 고르고, 뷰어 높이는 내용에 맞춰 늘려 안쪽 스크롤이 생기지 않게 한다.
     아래: 고른 기종의 제원, 도면, ICAO, 역사 */
  const M3D_IDS = ["boeing-707", "boeing-727", "boeing-737", "boeing-737max", "boeing-747", "boeing-757", "boeing-767", "boeing-777", "boeing-777x", "boeing-787", "boeing-717", "airbus-a300", "airbus-a310", "airbus-a320", "airbus-a320neo", "airbus-a330", "airbus-a330neo", "airbus-a340", "airbus-a350", "airbus-a380", "airbus-a220"];
  let m3dId = "boeing-777";
  const curAcId = () => { const k = (location.hash || "").slice(1); return k.indexOf("3d-") === 0 ? k.slice(3) : k === "3d" ? m3dId : k; };
  function m3dInfo(ac) {
    const html = renderAircraft(ac), i = html.indexOf('<div class="detail">');
    return `<div class="m3d-name mk-${ac.maker}"><h2>${esc(ac.name)} <span class="code">${ICAO[ac.id]}</span> ${statusPill(ac)}</h2><p>${esc(ac.en)}, ${esc(ac.variant)}. ${esc(ac.role)}</p><a class="ext" href="#${ac.id}">기종 백과에서 보기 →</a></div>${i >= 0 ? html.slice(i) : ""}`;
  }
  function render3d(id) {
    if (id && byId[id] && M3D_IDS.indexOf(id) >= 0) m3dId = id; const ac = byId[m3dId];
    const ids = M3D_IDS.filter(x => byId[x]);
    const pick = `<select class="sel" id="m3d-pick" aria-label="기종 선택">${["boeing", "airbus"].map(mk => `<optgroup label="${makerName(mk)}">${ids.filter(x => byId[x].maker === mk).map(x => `<option value="${x}"${x === m3dId ? " selected" : ""}>${ICAO[x]} ${esc(byId[x].name)}</option>`).join("")}</optgroup>`).join("")}</select>`;
    return `<header class="card ph m3d-head"><div><div class="crumbs"><a href="#home">대시보드</a> / 시뮬레이션</div><h1>3D 모형</h1><p>끌어서 돌리고 휠로 확대합니다. 왼쪽 단추로 외부, 단면, 객실, 조종실, 평면 시점을 바꾸고, 전체화면으로도 볼 수 있습니다. 기체 버전은 실제 항공사 도색을 사진으로 참고해 만든 모형입니다.</p></div><div class="fld m3d-pick"><label for="m3d-pick">기종</label>${pick}</div></header>
<section class="card m3d-stage"><iframe id="m3d-frame" src="3d/viewer/index.html?embed#${m3dId}" title="항공기 3D 모형 뷰어" allow="fullscreen" allowfullscreen scrolling="no"></iframe></section>
<div id="m3d-info">${m3dInfo(ac)}</div>`;
  }
  function m3dAfter() {
    const fr = $("#m3d-frame"); if (!fr) return;
    initAcLive(byId[m3dId]);
    const show = id => {
      if (!byId[id] || id === m3dId) return;
      m3dId = id; history.replaceState(null, "", "#3d-" + id);
      $("#m3d-info").innerHTML = m3dInfo(byId[id]); initAcLive(byId[id]);
      const sel = $("#m3d-pick"); if (sel && sel.value !== id) sel.value = id;
    };
    $("#m3d-pick").addEventListener("change", e => { const id = e.target.value; try { fr.contentWindow.location.hash = id; } catch (err) { /* 무시 */ } show(id); });
    // 허브 테마(색, 글꼴)와 3D 화면 높이를 뷰어에 넘긴다
    const theme = () => {
      let d; try { d = fr.contentDocument.documentElement; } catch (e) { return; } if (!d) return;
      const cs = getComputedStyle(document.documentElement);
      ["surface", "inset", "line", "fg", "fg-2", "muted", "primary", "primary-fg", "tile", "tile-line", "font"].forEach(k => d.style.setProperty("--h-" + k, cs.getPropertyValue("--" + k).trim()));
      d.style.colorScheme = cs.colorScheme || "dark";
      const h = innerWidth < 760 ? Math.round(Math.max(380, innerHeight * 0.62)) : Math.round(Math.max(440, Math.min(680, innerHeight - 220)));
      d.style.setProperty("--h-stage", h + "px");
    };
    const fit = () => { try { const b = fr.contentDocument.body; if (b) fr.style.height = Math.ceil(b.scrollHeight) + "px"; } catch (e) { /* 무시 */ } };
    const mo = new MutationObserver(theme); mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const onResize = () => { if (!document.body.contains(fr)) { removeEventListener("resize", onResize); mo.disconnect(); return; } theme(); };
    addEventListener("resize", onResize);
    fr.addEventListener("load", () => {
      theme();
      try {
        const w = fr.contentWindow;
        new w.ResizeObserver(fit).observe(w.document.body); fit();
        w.addEventListener("hashchange", () => show((w.location.hash || "").slice(1).split("/")[0]));
      } catch (e) { /* 무시 */ }
    });
  }
  /* ================= 조종석 비행 =================
     Codex가 만든 조종석 비행 체험(src/aircraft-3d/flight)을 띄운다. 그 파일은 고치지 않는다.
     설정(기종, 공항, 활주로, 게이트, 날씨, 시점)은 허브 카드에서 고르고, 화면 칸에는 조종석 장면만 보인다.
     허브 칸은 조종석 페이지의 입력칸을 그대로 따라 만든 거울이다. 값을 바꾸면 조종석 페이지 입력칸에 넣고
     change 이벤트를 보내서(활주로, 게이트 목록은 그쪽이 다시 채운다) 바뀐 목록을 다시 허브로 옮겨 온다 */
  const FLIGHT_URL = "src/aircraft-3d/flight/index.html";
  let ckId = "boeing-737";
  function renderCockpit(id) {
    if (id && byId[id] && M3D_IDS.indexOf(id) >= 0) ckId = id;
    return `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / 시뮬레이션</div><h1>조종석 비행</h1><p>출발 공항과 도착 공항, 날씨를 고르고 비행 준비를 누르면 아래 조종석 창밖으로 비행을 지켜봅니다. 경로와 고도, 속도는 어림한 값으로 그린 장면이며, 비행 훈련 장치가 아닙니다.</p></div></header>
<section class="card ck-plan">${cardH(ICON.route, "비행 설정", `<span class="hint">출발 시각은 UTC 기준</span>`)}<div class="card-b"><div class="ck-grid" id="ck-form"><p class="small muted">조종석을 불러오는 중입니다.</p></div>
<details class="ck-view"><summary>시점과 공항 표시</summary><div class="ck-grid" id="ck-view"></div></details>
<div class="ck-actions"><p id="ck-status" class="small muted" role="status" aria-live="polite"></p><button type="button" class="btn ghost" id="ck-fs">${ICON.layers}전체화면</button><button type="button" class="btn" id="ck-apply" disabled>${ICON.plane}비행 준비</button></div></div></section>
<section class="card ck-stage"><iframe id="ck-frame" src="${FLIGHT_URL}?embed=1&amp;ac=${ckId}#${ckId}" title="조종석 비행 장면" allow="fullscreen" allowfullscreen></iframe></section>
<p class="small muted ck-credits" id="ck-credits"></p><section class="card ck-off"><div class="card-b"><p>조종석 비행은 준비 중입니다. 지금은 <a href="#3d">3D 모형</a>에서 조종실 시점을 볼 수 있습니다.</p></div></section>`;
  }
  // 조종석 페이지 안: 머리와 설정 칸을 숨기고 장면만 꽉 채운다
  const CK_STYLE = `header,aside#settings{display:none!important}
main{height:100dvh!important}
:root,body,button,input,select{font-family:var(--h-font)!important}
.transport #play{background:var(--h-primary)!important;color:#fff!important;font-weight:600}
button,select,input{border-radius:6px}
#timeline{accent-color:var(--h-primary)}
.eyebrow{color:var(--h-primary-fg)!important}`;
  function cockpitAfter() {
    const fr = $("#ck-frame"); if (!fr) return;
    const size = () => { fr.style.height = Math.round(Math.max(520, Math.min(860, innerHeight - 120))) + "px"; };
    let mo = null, tick = 0;
    const dress = () => {
      let d; try { d = fr.contentDocument; } catch (e) { return; } if (!d || !d.head || !d.getElementById("plan")) return;
      const cs = getComputedStyle(document.documentElement);
      ["font", "primary", "primary-fg"].forEach(k => d.documentElement.style.setProperty("--h-" + k, cs.getPropertyValue("--" + k).trim()));
      if (!d.getElementById("hub-dress")) { const st = d.createElement("style"); st.id = "hub-dress"; st.textContent = CK_STYLE; d.head.append(st); }
      // 숨긴 설정 칸 때문에 장면 크기가 바뀌었음을 알려 준다
      try { fr.contentWindow.dispatchEvent(new Event("resize")); } catch (e) { /* 무시 */ }
      mirror(d);
    };
    function mirror(d) {
      const form = $("#ck-form"), view = $("#ck-view"); if (!form) return;
      const pairs = [];
      const labelOf = el => { const l = el.closest("label") || (el.id && d.querySelector(`label[for="${el.id}"]`)); if (!l) return el.id; const c = l.cloneNode(true); c.querySelectorAll("select,input,output,small").forEach(x => x.remove()); return c.textContent.trim(); };
      const build = (list, host) => {
        host.innerHTML = "";
        list.forEach(src => {
          const f = document.createElement("div"), lab = labelOf(src), small = src.closest("label") && src.closest("label").querySelector("small"), hid = "ck-" + src.id;
          let dst;
          if (src.type === "checkbox") { f.className = "fld ck-chk"; f.innerHTML = `<label><input type="checkbox" id="${hid}"> ${esc(lab)}</label>`; dst = f.querySelector("input"); }
          else {
            f.className = "fld"; f.innerHTML = `<label for="${hid}">${esc(lab)}${small ? ` <small>${esc(small.textContent)}</small>` : ""}${src.type === "range" ? ` <output id="${hid}-out"></output>` : ""}</label>`;
            if (src.tagName === "SELECT") { dst = document.createElement("select"); dst.className = "sel"; }
            else { dst = document.createElement("input"); dst.type = src.type; if (src.type !== "range") dst.className = "in"; ["min", "max", "step", "placeholder"].forEach(k => { const v = src.getAttribute(k); if (v != null) dst.setAttribute(k, v); }); }
            dst.id = hid; f.append(dst);
          }
          host.append(f); pairs.push([src, dst]);
          const send = () => {
            if (dst.type === "checkbox") src.checked = dst.checked; else src.value = dst.value;
            src.dispatchEvent(new Event("input", { bubbles: true })); src.dispatchEvent(new Event("change", { bubbles: true }));
            if (src.id === "aircraft" && byId[dst.value]) { ckId = dst.value; history.replaceState(null, "", "#cockpit-" + ckId); }
            sync();
          };
          dst.addEventListener(dst.tagName === "SELECT" || dst.type === "checkbox" ? "change" : "input", send);
        });
      };
      build([...d.querySelectorAll("#plan select, #plan input")], form);
      build([...d.querySelectorAll(".view-settings select, .view-settings input")], view);
      const st = $("#ck-status"), ap = $("#ck-apply"), stat = d.getElementById("status"), apply = d.getElementById("apply");
      function sync() {
        pairs.forEach(([src, dst]) => {
          if (src.tagName === "SELECT" && dst.innerHTML !== src.innerHTML) dst.innerHTML = src.innerHTML;
          if (document.activeElement !== dst) { if (dst.type === "checkbox") dst.checked = src.checked; else if (dst.value !== src.value) dst.value = src.value; }
          dst.disabled = src.disabled;
          const out = document.getElementById(dst.id + "-out"), so = src.closest("label") && src.closest("label").querySelector("output"); if (out && so) out.textContent = so.textContent;
        });
        if (st && stat) st.textContent = stat.textContent;
        if (ap && apply) ap.disabled = apply.disabled;
      }
      let queued = false; const later = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; if (document.body.contains(form)) sync(); }); };
      if (mo) mo.disconnect();
      mo = new MutationObserver(later); [d.getElementById("plan"), d.querySelector(".view-settings"), stat].forEach(n => n && mo.observe(n, { subtree: true, childList: true, characterData: true, attributes: true }));
      // 조종석 페이지가 스스로 값을 바꾸는 경우(기본 공항, 활주로 등)도 따라가도록 처음 10초는 주기적으로도 맞춘다
      clearInterval(tick); let n = 0; tick = setInterval(() => { if (!document.body.contains(form) || ++n > 40) { clearInterval(tick); return; } sync(); }, 250);
      ap.onclick = () => { const f = d.getElementById("plan"); try { if (f.requestSubmit) f.requestSubmit(apply); else apply.click(); } catch (e) { apply.click(); } fr.scrollIntoView({ behavior: "smooth", block: "start" }); };
      // 자료 출처: 조종석 페이지의 출처 링크를 장면 아래에 보인다
      const cr = $("#ck-credits"); if (cr) { const links = [...d.querySelectorAll(".data-credits a, aside details a")].map(a => `<a class="ext" href="${esc(a.href)}" target="_blank" rel="noopener">${esc(a.textContent.trim())}</a>`); cr.innerHTML = links.length ? "자료 출처: " + links.join(", ") : ""; }
      sync();
    }
    // 전체화면: 장면 칸을 전체화면으로. 브라우저가 막으면 창 전체를 덮는다 (Esc로 닫힘)
    const fsOff = () => { fr.classList.remove("ck-fs"); document.documentElement.classList.remove("m3d-fs-on"); };
    $("#ck-fs").addEventListener("click", () => {
      if (document.fullscreenElement) { document.exitFullscreen(); return; }
      if (fr.classList.contains("ck-fs")) { fsOff(); return; }
      const pseudo = () => { if (!document.fullscreenElement) { fr.classList.add("ck-fs"); document.documentElement.classList.add("m3d-fs-on"); } };
      try { const p = fr.requestFullscreen && fr.requestFullscreen(); if (p && p.catch) p.catch(pseudo); else if (!p) pseudo(); } catch (e) { pseudo(); }
      setTimeout(pseudo, 700);
    });
    const escKey = e => { if (e.key === "Escape" && fr.classList.contains("ck-fs")) fsOff(); };
    document.addEventListener("keydown", escKey);
    size(); fr.addEventListener("load", () => { dress(); try { fr.contentDocument.addEventListener("keydown", escKey); } catch (e) { /* 무시 */ } }); dress();
    const onResize = () => { if (!document.body.contains(fr)) { removeEventListener("resize", onResize); document.removeEventListener("keydown", escKey); if (mo) mo.disconnect(); return; } size(); };
    addEventListener("resize", onResize);
  }
  function renderAircraft(ac) {
    const S = ac.specs, p = photoOf(ac), rival = ac.rival ? byId[ac.rival] : null, py = prodYears(ac);
    if (viz === "overlay" && !rival) viz = "three";
    const X = y => N(Math.max(0, Math.min(100, (y - 1950) / 80 * 100)));
    const kv = (icon, label, val, cls) => `<div class="kv${cls ? " " + cls : ""}"><span class="lbl">${icon}${esc(label)}</span><span class="val${/txt/.test(cls || "") ? " txt" : ""}">${esc(val)}</span></div>`;
    const tabs = [["three", "3면도"], ["cabin", "객실 단면"]].concat(rival ? [["overlay", "경쟁 기종과 나란히"]] : []);
    return heroHead({ photo: p, mk: ac.maker, alt: `${ac.name} 사진${p ? ": " + p.title : ""}`,
      crumbs: `<a href="#home">대시보드</a> / <a href="#fleet">기종 백과</a> / <a href="#${ac.maker}">${makerName(ac.maker)}</a>`,
      title: `${esc(ac.name)} <span class="code">${ICAO[ac.id]}</span> ${statusPill(ac)}`,
      sub: `<div class="en">${esc(ac.en)}, ${esc(ac.variant)}</div><p>${esc(ac.role)}, ${esc(ac.generation)}</p>`,
      actions: `${AircraftViewerModal.button(ac)}<button type="button" class="btn" data-pilot="useac:${ac.id}" id="btn-fly">${ICON.plane}이 기종으로 비행 예약</button><button type="button" class="btn ${p ? "on-dark" : "ghost"}" id="btn-cmp" data-cmp="${ac.id}|${rival ? rival.id : (ac.maker === "boeing" ? "airbus-a350" : "boeing-787")}">${ICON.swap}다른 기종과 비교</button><a class="btn ${p ? "on-dark" : "ghost"}" href="https://ko.wikipedia.org/wiki/${encodeURIComponent(ac.wikiKo)}" target="_blank" rel="noopener">${ICON.ext}위키백과</a>` }) + `
<div class="detail">
<aside class="card fl-panel mk-${ac.maker}">
<div class="legs" style="padding-top:12px"><div class="leg"><span class="lbl">${ICON.plane}초도비행</span><span class="big">${yearOf(ac.firstFlight)}</span><small>${esc(dateKo(ac.firstFlight))}</small></div><div class="leg"><span class="lbl">${ICON.flag}취항</span><span class="big">${/^\d{4}/.test(ac.intro) ? yearOf(ac.intro) : "미정"}</span><small>${esc(dateKo(ac.intro))}</small></div></div>
<div class="pstat"><div class="pstat-h">${statusPill(ac)}<span class="val">${py.a}–${py.open ? "현재" : py.b}, ${py.b - py.a}년${py.open ? "째" : "간"}</span></div><div class="pbar-track" role="img" aria-label="생산 기간 ${py.a}년부터 ${py.open ? "현재" : py.b + "년"}까지"><span class="pbar-fill" style="left:${X(py.a)}%;width:${N(X(py.b) - X(py.a))}%"></span><span class="pbar-dot" style="left:${X(+yearOf(ac.firstFlight))}%" title="초도비행 ${yearOf(ac.firstFlight)}"></span></div><div class="pbar-ax"><span>1950</span><span>1990</span><span>2030</span></div></div>
<div class="kvs">${kv(ICON.ruler, "길이", S.length + " m")}${kv(ICON.ruler, "날개폭", S.span + " m")}${kv(ICON.ruler, "높이", S.height + " m")}${kv(ICON.layers, "동체 폭", S.width + " m")}${kv(ICON.weight, "최대이륙중량", S.mtow + " t")}${kv(ICON.route, "항속거리", fmt(S.range) + " km")}${kv(ICON.users, "표준 좌석", S.seats + "석")}${kv(ICON.users, "최대 좌석", S.seatsMax + "석")}${kv(ICON.layers, "좌석 배치", cabinLbl(ac))}${kv(ICON.gauge, "상승한도", S.ceiling || "-")}${kv(ICON.gauge, "순항속도", S.cruise, "wide")}${kv(ICON.gauge, "엔진", S.engines, "wide txt")}${kv(ICON.chart, "생산 대수", ac.built, "wide txt")}${kv(ICON.bldg, "최종 조립", FAL[ac.id], "wide txt")}${kv(ICON.star, "출범 고객", ac.launchCustomer, "wide txt")}${kv(ICON.cal, "생산 기간", ac.production, "wide txt")}</div>
<div class="ac-live-mini">${acLiveCard(ac).replace('<section class="card" id="ac-live">', '<div id="ac-live">').replace(/<\/section>$/, "</div>")}</div>
</aside>
<div class="stack">
${whyCard(ac)}
<div class="ac-pair"><section class="card ac-draw">${cardH(ICON.ruler, "도면", `<div class="tabs" role="group" aria-label="도면 종류">${tabs.map(t => `<button type="button" id="viz-${t[0]}" data-seg="viz" data-v="${t[0]}" class="${viz === t[0] ? "on" : ""}">${t[1]}</button>`).join("")}</div>`)}<div class="card-b" id="viz-out">${vizOut(ac)}</div></section>
${icaoCard(ac)}</div>
<section class="card">${cardH(ICON.doc, "역사")}<div class="card-b prose ac-hist">${ac.history.map(t => `<p>${esc(t)}</p>`).join("")}</div></section>
<div class="grid"><section class="card c6">${cardH(ICON.info, "설계 특징")}<div class="card-b"><ul class="feats">${ac.features.map(f => `<li>${esc(f)}</li>`).join("")}</ul></div></section><section class="card c6">${cardH(ICON.flag, "한국 운항")}<div class="card-b prose"><p>${esc(ac.korea)}</p></div></section></div>
<section class="card">${cardH(ICON.clock, "주요 연혁")}<div class="card-b"><ol class="kd mk-${ac.maker}">${ac.keyDates.map(k => `<li><span class="kd-date">${esc(k[0])}</span><span>${esc(k[1])}</span></li>`).join("")}</ol></div></section>
<section class="card">${cardH(ICON.list, "파생형")}<div class="tbl-wrap"><table class="tbl"><thead><tr><th>형식</th><th>첫 비행</th><th>길이</th><th>최대 좌석</th><th>항속거리</th><th>비고</th></tr></thead><tbody>${ac.variants.map(v => `<tr>${v.map((c, i) => `<td>${i === 0 ? `<strong>${esc(c)}</strong>` : i < 5 ? `<span class="val">${esc(c)}</span>` : esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>
<section class="card">${cardH(ICON.swap, "경쟁 기종")}<div class="card-b">${rival ? `<a class="rival mk-${rival.maker}" href="#${rival.id}">${silhouette(rival, 1.2, 120, 90)}<div><strong>${esc(rival.name)}</strong> <span class="code">${ICAO[rival.id]}</span><br><span class="box-meta">${rival.specs.seats}석, ${fmt(rival.specs.range)} km, ${rival.specs.length} m</span>${ac.rivalNote ? `<br><span class="small muted">${esc(ac.rivalNote)}</span>` : ""}</div></a>` : `<p style="margin:0">${esc(ac.rivalNote || "-")}</p>`}</div></section>
</div></div>`;
  }

  /* ================= 제작사 ================= */
  function renderCompany(mk) {
    const c = COMPANIES[mk], list = AIRCRAFT.filter(a => a.maker === mk).sort((a, b) => a.firstFlight.localeCompare(b.firstFlight));
    const cp = photoOf(byId[CO_PHOTO[mk]]);
    return heroHead({ photo: cp, mk: mk, alt: `${c.name} 여객기`, crumbs: `<a href="#home">대시보드</a> / 자료`, title: esc(c.name), sub: `<div class="en">${esc(c.en)}</div><p>${esc(c.tagline)}</p>`,
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
    const sel = idx => `<select id="cmp-sel-${idx}" class="sel" data-idx="${idx}" aria-label="${idx ? "두 번째" : "첫 번째"} 기종">${["boeing", "airbus"].map(mk => `<optgroup label="${makerName(mk)}">${AIRCRAFT.filter(a => a.maker === mk).map(a => `<option value="${a.id}" ${cmp[idx] === a.id ? "selected" : ""}>${ICAO[a.id]} ${esc(a.name)}</option>`).join("")}</optgroup>`).join("")}</select>`;
    const metrics = [["길이", "length", "m"], ["날개폭", "span", "m"], ["높이", "height", "m"], ["동체 폭", "width", "m"], ["최대이륙중량", "mtow", "t"], ["항속거리", "range", "km"], ["표준 좌석", "seats", "석"], ["최대 좌석", "seatsMax", "석"]];
    const bars = metrics.map(([lab, k, u]) => { const a = A.specs[k], b = B.specs[k], mx = Math.max(a, b); return `<div class="bar-row"><div class="bar-lab">${lab}</div><div class="bars"><div class="brow"><span class="bfill mk-${A.maker}" style="width:${N(a / mx * 100)}%"></span><span class="bval">${fmt(a)} ${u}</span></div><div class="brow"><span class="bfill mk-${B.maker}" style="width:${N(b / mx * 100)}%"></span><span class="bval">${fmt(b)} ${u}</span></div></div></div>`; }).join("");
    const rows = [["대표 형식", a => a.variant], ["구분", a => a.role], ["초도비행", a => dateKo(a.firstFlight)], ["취항", a => dateKo(a.intro)], ["생산 기간", a => a.production], ["생산 대수", a => a.built], ["엔진", a => a.specs.engines], ["순항속도", a => a.specs.cruise], ["좌석 배치", a => cabinLbl(a)], ["최종 조립", a => FAL[a.id]], ["상태", a => a.status]];
    const same = A.maker === B.maker;
    const cph = a => { const p = photoOf(a); return `<a class="cmp-photo mk-${a.maker}" href="#${a.id}">${pimg(p, true, a.name)}<span>${ICAO[a.id]} ${esc(a.name)}</span></a>`; };
    const cmpPhotos = photoOf(A) && photoOf(B) ? `<div class="cmp-photos">${cph(A)}${cph(B)}</div>` : "";
    return `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / <a href="#fleet">기종 백과</a></div><h1>기종 비교</h1><p>두 기종을 같은 축척의 측면, 평면, 정면 그림으로 나란히 놓고 주요 수치와 ICAO 분류를 견줍니다.</p></div></header>
<div class="grid">
<section class="card c12"><div class="cmp-controls"><label class="cmp-pick mk-${A.maker}"><span class="dot"></span>${sel(0)}</label><button type="button" class="btn ghost" id="cmp-swap" aria-label="두 기종 순서 바꾸기">${ICON.swap}</button><label class="cmp-pick mk-${B.maker}"><span class="dot"></span>${sel(1)}</label></div>
${cmpDiff(A, B)}${cmpPhotos}<div class="card-b" style="padding-top:0">${cmpArt(A, B)}<p class="cap" style="margin-bottom:0">길이, 날개폭, 높이, 동체 폭은 실제 치수 비율입니다. 창과 문, 엔진 같은 세부는 위치를 어림해 그렸고 도색은 실제 항공사와 관계없습니다. 꼬리날개 색은 제작사 구분용입니다(파랑 보잉, 주황 에어버스).</p></div></section>
<section class="card c12">${cardH(ICON.flag, "ICAO 분류", `<a class="ext small" href="#icao">기준 설명 →</a>`)}<div class="card-b">${spanScale([A, B])}<div class="tbl-wrap" style="margin-top:14px"><table class="tbl plain"><thead><tr><th></th><th>${ICAO[A.id]} ${esc(short(A))}</th><th>${ICAO[B.id]} ${esc(short(B))}</th></tr></thead><tbody>${[["비행장 기준 코드 문자 (날개폭)", a => `<span class="code">${acLetter(a)}</span> ${groundSpan(a)} m`], ["항적 난기류 등급 (최대이륙중량)", a => `<span class="code">${wakeCat(a)}</span> ${WAKE[wakeCat(a)]}, ${a.specs.mtow} t`], ["구조소방 등급 (길이, 동체 폭)", a => `<span class="code">${rffCat(a)}</span> ${a.specs.length} m, ${a.specs.width} m`], ["형식 지정자", a => `<span class="code">${ICAO[a.id]}</span>`]].map(r => `<tr><td class="muted">${r[0]}</td><td>${r[1](A)}</td><td>${r[1](B)}</td></tr>`).join("")}</tbody></table></div></div></section>
<section class="card c5">${cardH(ICON.chart, "수치 비교", `<span class="hint">위 ${esc(short(A))}, 아래 ${esc(short(B))}</span>`)}<div class="card-b"><div class="barset">${bars}</div></div></section>
<section class="card c7" id="cmp-ov">${cardH(ICON.list, "개요", `<label class="diffonly"><input type="checkbox" id="cmp-diff"> 다른 점만 보기</label>`)}<div class="tbl-wrap"><table class="tbl plain"><thead><tr><th></th><th><a href="#${A.id}" class="ext">${ICAO[A.id]} ${esc(short(A))}</a></th><th><a href="#${B.id}" class="ext">${ICAO[B.id]} ${esc(short(B))}</a></th></tr></thead><tbody>${rows.map(r => `<tr><td class="muted" style="white-space:nowrap">${r[0]}</td><td>${esc(r[1](A))}</td><td>${esc(r[1](B))}</td></tr>`).join("")}</tbody></table></div></section>
</div>`;
  }

  /* ================= 연표 ================= */
  function renderTimeline() {
    const all = []; ["boeing", "airbus"].forEach(mk => COMPANIES[mk].timeline.forEach(t => all.push({ mk: mk, y: t[0], t: t[1], d: t[2] })));
    all.sort((a, b) => a.y - b.y || (a.mk === "boeing" ? -1 : 1));
    const dec = {}; all.forEach(e => { const k = Math.floor(e.y / 10) * 10; (dec[k] = dec[k] || []).push(e); });
    return `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / 자료</div><h1>연표</h1><p>시대마다 어떤 문제가 있었고 어떤 기종이 그 답이었는지 한 축에 놓았습니다. 초도비행과 두 회사의 주요 사건도 함께 표시합니다. 점이나 이름을 누르면 기종 페이지로 갑니다.</p></div></header>
<div class="grid">
${whyEras()}
<section class="card c12">${cardH(ICON.plane, "초도비행", `<div class="legend"><span class="lg mk-boeing">보잉</span><span class="lg mk-airbus">에어버스</span></div>`)}<div class="card-b"><div class="plot">${firstFlightTimeline().replace('class="chart tl"', 'class="chart tl wide"')}</div></div></section>
<section class="card c12">${cardH(ICON.clock, "주요 사건", `<div class="legend"><span class="lg mk-boeing">보잉</span><span class="lg mk-airbus">에어버스</span></div>`)}<div class="card-b"><div class="tl-cols">${Object.keys(dec).sort().map(k => `<h3 class="decade">${k}년대</h3><ol class="tl-list">${dec[k].map(e => `<li class="mk-${e.mk}"><span class="tl-year">${e.y}</span><div><strong>${esc(e.t)}</strong><p>${esc(e.d)}</p></div></li>`).join("")}</ol>`).join("")}</div></div></section>
</div>`;
  }

  /* ================= 셸 · 라우팅 ================= */
  const app = $("#app");
  $("#side").innerHTML = sideHtml();
  const PAGES = { home: renderDash, book: renderBook, flights: renderFlights, live: renderLive, profile: renderProfile, activities: renderActivities, community: renderCommunity, airports: renderAirports, fleet: renderFleet, boeing: () => renderCompany("boeing"), airbus: () => renderCompany("airbus"), compare: renderCompare, timeline: renderTimeline };
  Object.assign(PAGES, PORTAL_PAGES, LEARN_PAGES, MANUAL_PAGES, { "3d": () => render3d(), cockpit: () => renderCockpit() });
  const TITLES = { book: "비행 예약", flights: "내 예약", live: "실시간 운항", profile: "조종사 프로필", activities: "활동", community: "리더보드", airports: "공항", fleet: "기종 백과", boeing: "보잉", airbus: "에어버스", compare: "기종 비교", timeline: "연표" };
  Object.assign(TITLES, PORTAL_TITLES, LEARN_TITLES, MANUAL_TITLES, { "3d": "3D 모형", cockpit: "조종석 비행" });
  function route(keep) {
    let h = (location.hash || "#home").slice(1), dyn = null;
    if (h.indexOf("3d-") === 0) dyn = byId[h.slice(3)] ? render3d(h.slice(3)) : null;
    if (h.indexOf("cockpit-") === 0) dyn = byId[h.slice(8)] ? renderCockpit(h.slice(8)) : null;
    if (!PAGES[h] && !byId[h] && !dyn) { dyn = dynPage(h); if (!dyn) h = "home"; }
    const y = window.scrollY, nk = navKey(h);
    app.innerHTML = dyn || (PAGES[h] ? PAGES[h]() : renderAircraft(byId[h]));
    if (byId[h]) pushRecent(h);
    sideMark(nk); catTabs(nk, h);
    fxPage(app, h); mapFullButtons(app); scCalc(); dimLink(app); lv3dInit(h); learnInit(h);
    document.body.classList.remove("nav-open");
    document.title = byId[h] ? `${byId[h].name} | Jetliner Hub` : TITLES[nk] ? `${TITLES[nk]} | Jetliner Hub` : "Jetliner Hub";
    wireLive(); initMap();
    if (h === "home") initHomeLive();
    if (h === "live") initLive(); else stopLive();
    if (byId[h]) initAcLive(byId[h]);
    if (h === "3d" || h.indexOf("3d-") === 0) m3dAfter();
    if (h === "cockpit" || h.indexOf("cockpit-") === 0) cockpitAfter();
    pilotAfter(h);
    window.scrollTo(0, keep === true ? y : 0);
  }
  window.addEventListener("hashchange", () => route());

  /* ================= 상호작용 ================= */
  const SEG = {
    stat: v => { statSel = v; $("#stats-out").innerHTML = fleetStats(); },
    del: v => { delRange = +v; $("#del-out").innerHTML = delBlock(); },
    viz: v => { viz = v; const ac = byId[curAcId()]; if (ac) $("#viz-out").innerHTML = vizOut(ac); },
    fmk: v => { fmk = v; $("#fleet-out").innerHTML = fleetOut(); },
    fcat: v => { fcat = v; $("#fleet-out").innerHTML = fleetOut(); },
    fview: v => { fview = v; $("#fleet-out").innerHTML = fleetOut(); }
  };
  const tip = $("#tip");
  function moveTip(e) { const pad = 14, w = tip.offsetWidth, hh = tip.offsetHeight; let x = e.clientX + pad, y = e.clientY + pad; if (x + w > window.innerWidth - 8) x = e.clientX - w - pad; if (y + hh > window.innerHeight - 8) y = e.clientY - hh - pad; tip.style.left = Math.max(4, x) + "px"; tip.style.top = Math.max(4, y) + "px"; }
  // 툴팁은 커서를 따라다니지 않고, 가리킨 대상 바로 위에 고정해서 띄운다
  function anchorTip(t) { const r = t.getBoundingClientRect(), w = tip.offsetWidth, hh = tip.offsetHeight; let x = r.left + r.width / 2 - w / 2, y = r.top - hh - 10; if (y < 8) y = r.bottom + 10; x = Math.max(8, Math.min(window.innerWidth - w - 8, x)); tip.style.left = x + "px"; tip.style.top = y + "px"; }
  let tipFor = null;
  document.addEventListener("mouseover", e => { const t = e.target.closest("[data-tip]"); if (!t) return; tip.innerHTML = t.getAttribute("data-tip"); tip.hidden = false; tipFor = t; anchorTip(t); });
  // 지도는 점을 계속 새로 그려서, 마우스 아래 점이 바뀌면 mouseout이 오지 않는다. 그래서 움직일 때마다 아래에 툴팁 대상이 있는지 다시 본다
  document.addEventListener("mousemove", e => { if (tip.hidden) return; if (e.target.closest && e.target.closest(".lv3d, .livewrap.cells")) { moveTip(e); return; } const t = e.target.closest && e.target.closest("[data-tip]"); if (!t) { tip.hidden = true; tipFor = null; return; } if (t !== tipFor) { tipFor = t; tip.innerHTML = t.getAttribute("data-tip"); anchorTip(t); } });
  const hideTip = () => { tip.hidden = true; };
  window.addEventListener("hashchange", hideTip); document.addEventListener("mouseleave", hideTip); window.addEventListener("blur", hideTip); window.addEventListener("scroll", hideTip, { passive: true });
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
    const go = e.target.closest("[data-href]"); if (go && !e.target.closest("a,button")) { location.hash = go.getAttribute("data-href"); }
  });
  document.addEventListener("change", e => { const s = e.target.closest("select.sel[data-idx]"); if (!s) return; cmp[+s.getAttribute("data-idx")] = s.value; saveCmp(); route(true); });
  document.addEventListener("input", e => { if (e.target.id === "fleet-q") { fq = e.target.value; $("#fleet-out").innerHTML = fleetOut(); } });
  $("#menu").addEventListener("click", () => { if (window.matchMedia("(max-width:900px)").matches) document.body.classList.toggle("nav-open"); else { document.body.classList.toggle("nav-collapsed"); if (mapInst && mapInst.updateSize) setTimeout(() => { try { mapInst.updateSize(); } catch (e) { /* 무시 */ } }, 30); } });
  $("#backdrop").addEventListener("click", () => document.body.classList.remove("nav-open"));
  // 조종석 비행: 그 파일(src/aircraft-3d/flight, 저장소에 아직 안 올림)이 있는 곳에서만 메뉴와 단추를 보인다
  document.documentElement.classList.add("no-flight");
  fetch(FLIGHT_URL, { method: "HEAD", cache: "no-store" }).then(r => { if (r.ok) document.documentElement.classList.remove("no-flight"); }).catch(() => { /* 없음 */ });
  try { const t = localStorage.getItem("hub-theme"); if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t); } catch (e) { /* 저장소 없음 */ }
  $("#theme").addEventListener("click", () => { const root = document.documentElement, cur = root.getAttribute("data-theme") || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"), next = cur === "dark" ? "light" : "dark"; root.setAttribute("data-theme", next); try { localStorage.setItem("hub-theme", next); } catch (e) { /* 무시 */ } });
  const clock = $("#clock"), tick = () => { clock.textContent = new Date().toISOString().slice(11, 19) + "z"; };
  tick(); setInterval(tick, 1000);

  /* 지도 라이브러리는 문서 파싱이 끝난 뒤에만 바로 초기화되므로 첫 렌더링을 그때로 맞춘다 */
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => route()); else route();
})();
