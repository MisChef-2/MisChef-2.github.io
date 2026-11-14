
  /* ================= 포털 메뉴와 추가 페이지 =================
     메뉴는 가상 항공사 조종사 포털의 일반적인 목차를 따른다:
     Flight Center · My Profile · Activities · Community · Documents · Resources.
     항목: [해시, 아이콘, 이름, 덧붙임] */
  const NAV = [
    { items: [["about", "user", "소개"], ["home", "grid", "대시보드"]] },
    { id: "fc", title: "Flight Center", items: [["book", "plane", "비행 예약"], ["dest", "pin", "취항지"], ["generator", "dice", "비행 생성기"], ["rosters", "list", "내 로스터"], ["flights", "cal", "내 예약"], ["pireps", "doc", "PIREP", "pireps"], ["claims", "check", "클레임"], ["live", "map", "실시간 운항", "live"]] },
    { id: "me", title: "My Profile", items: [["profile", "users", "프로필"], ["stats", "chart", "통계"], ["map", "globe", "비행 지도"], ["passport", "pass", "패스포트"], ["badges", "medal", "배지"], ["settings", "gear", "설정"]] },
    { id: "act", title: "Activities", items: [["activities", "target", "투어 · 도전 과제"]] },
    { id: "com", title: "Community", items: [["community", "cup", "리더보드"]] },
    { id: "doc", title: "Documents", items: [["notams", "bell", "NOTAM"], ["ranks", "star", "계급 안내"], ["scores", "gauge", "점수 기준"], ["icao", "book", "ICAO 기준"]] },
    { id: "res", title: "Resources", items: [["airports", "flag", "공항", "apt"], ["fleet", "list", "기종 백과", "ac"], ["boeing", "bldg", "보잉", "nb"], ["airbus", "bldg", "에어버스", "na"], ["compare", "swap", "기종 비교"], ["timeline", "clock", "연표"]] }
  ];
  let navOpen = { fc: true, me: true };
  try { const s = JSON.parse(localStorage.getItem("hub-nav") || "null"); if (s && typeof s === "object") navOpen = s; } catch (e) { /* 저장소 없음 */ }
  function sideHtml() {
    const nb = AIRCRAFT.filter(a => a.maker === "boeing").length;
    const extra = k => k === "pireps" ? `<span class="cnt" id="nav-pireps" hidden></span>` : k === "live" ? `<span class="livedot" title="실시간"></span>` : `<span class="cnt">${k === "apt" ? APT.length : k === "ac" ? AIRCRAFT.length : k === "nb" ? nb : AIRCRAFT.length - nb}</span>`;
    const link = it => `<a href="#${it[0]}" data-nav="${it[0]}">${ICON[it[1]]}<span>${it[2]}</span>${it[3] ? extra(it[3]) : ""}</a>`;
    return NAV.map(g => g.id ? `<div class="nav-grp${navOpen[g.id] ? " open" : ""}" data-grp="${g.id}"><button type="button" class="nav-sec" data-po="grp:${g.id}" id="navg-${g.id}" aria-expanded="${!!navOpen[g.id]}" aria-controls="navi-${g.id}"><span>${g.title}</span>${ICON.chev}</button><div class="nav-items" id="navi-${g.id}">${g.items.map(link).join("")}</div></div>` : g.items.map(link).join("")).join("");
  }
  // 지금 보는 페이지가 든 묶음은 항상 펼친다
  function sideSync(nk) {
    const g = NAV.find(x => x.id && x.items.some(it => it[0] === nk)); if (!g) return;
    const el = document.querySelector(`.nav-grp[data-grp="${g.id}"]`); if (el && !el.classList.contains("open")) { el.classList.add("open"); const b = el.querySelector(".nav-sec"); if (b) b.setAttribute("aria-expanded", "true"); }
  }

  /* ---------- 공통 조각 ---------- */
  const rosters = () => (Array.isArray(PS.rosters) ? PS.rosters : (PS.rosters = []));
  const REGIONS = [["all", "전체"], ["kr", "국내"], ["nea", "동북아"], ["sea", "동남아 · 인도"], ["eu", "유럽 · 중동"], ["am", "미주"], ["oc", "대양주"]];
  const REGION_CC = { kr: ["KR"], nea: ["JP", "CN", "HK", "TW"], sea: ["SG", "TH", "VN", "PH", "MY", "ID", "IN"], eu: ["AE", "QA", "TR", "GB", "FR", "DE", "NL", "IT", "ES", "CH", "AT", "CZ"], am: ["US", "CA"], oc: ["AU", "NZ"] };
  const acOptions = sel => ["boeing", "airbus"].map(mk => `<optgroup label="${makerName(mk)}">${AIRCRAFT.filter(a => a.maker === mk).map(a => `<option value="${a.id}"${sel === a.id ? " selected" : ""}>${ICAO[a.id]} · ${esc(short(a))} · ${fmt(a.specs.range)} km</option>`).join("")}</optgroup>`).join("");
  const aptOptions = sel => APT.slice().sort((x, y) => x[0] < y[0] ? -1 : 1).map(a => `<option value="${a[0]}"${sel === a[0] ? " selected" : ""}>${a[0]} · ${esc(a[2])}</option>`).join("");
  const phead = (crumb, title, text, right) => `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / ${crumb}</div><h1>${title}</h1><p>${text}</p></div>${right || ""}</header>`;
  const profTabs = cur => `<nav class="ptabs" aria-label="프로필 하위 메뉴">${[["profile", "users", "개요"], ["stats", "chart", "통계"], ["map", "globe", "비행 지도"], ["passport", "pass", "패스포트"], ["badges", "medal", "배지"], ["settings", "gear", "설정"]].map(t => `<a href="#${t[0]}" class="${cur === t[0] ? "on" : ""}"${cur === t[0] ? ' aria-current="page"' : ""}>${ICON[t[1]]}${t[2]}</a>`).join("")}</nav>`;
  const bookNow = (dep, arr, acId) => { const ac = byId[acId], km = aptKm(dep, arr); PS.booking = { id: "b" + Date.now().toString(36), dep: dep, arr: arr, ac: ac.id, cs: flightNo(dep, arr), km: km, ete: eteMin(km, ac), fuel: fuelKg(km, ac), created: new Date().toISOString() }; saveState(); location.hash = "flights"; };
  const barList = (rows, unit) => { const mx = Math.max(1, ...rows.map(r => r[1])); return rows.length ? `<div class="hbars">${rows.map(r => `<div class="hbar"><span class="hbar-l">${r[0]}</span><span class="hbar-t"><span class="hbar-f${r[2] ? " " + r[2] : ""}${r[1] ? "" : " zero"}" style="width:${N(r[1] / mx * 100)}%"></span></span><span class="hbar-v">${fmt(r[1])}${unit}</span></div>`).join("")}</div>` : `<p class="muted" style="margin:0">아직 기록이 없습니다.</p>`; };

  /* ---------- Flight Center: 취항지 ---------- */
  const DS = { from: null, region: "all", q: "" };
  function destRows() {
    const from = DS.from && aptBy[DS.from] ? DS.from : PS.pilot.loc, ac = byId[BK.ac], q = DS.q.trim().toLowerCase(), vis = {};
    PS.pireps.forEach(p => { if (p.dep === from) vis[p.arr] = (vis[p.arr] || 0) + 1; });
    const L = APT.filter(a => a[0] !== from && (DS.region === "all" || REGION_CC[DS.region].includes(a[3])) && (!q || aptText(a).includes(q))).map(a => [a, aptKm(from, a[0])]).sort((x, y) => x[1] - y[1]);
    if (!L.length) return `<tr><td colspan="7" class="muted">조건에 맞는 공항이 없습니다. 지역이나 검색어를 바꿔 보세요.</td></tr>`;
    const can = from === PS.pilot.loc && !PS.booking;
    return L.map(x => { const a = x[0], far = x[1] > ac.specs.range; return `<tr class="row-link${far ? " far-row" : ""}" data-href="#apt-${a[0]}" tabindex="0"><td><span class="code">${a[0]}</span></td><td><strong>${esc(a[2])}</strong></td><td>${esc(CCN[a[3]] || a[3])}</td><td class="num">${distTxt(x[1])}</td><td class="num">${far ? `<span class="neg">항속거리 초과</span>` : hm(eteMin(x[1], ac))}</td><td class="num">${vis[a[0]] || 0}</td><td class="num">${can && !far ? `<button type="button" class="btn glass sm" data-pilot="goto:${a[0]}" id="ds-go-${a[0]}">선택</button>` : ""}</td></tr>`; }).join("");
  }
  function destSummary() {
    const from = DS.from && aptBy[DS.from] ? DS.from : PS.pilot.loc, ac = byId[BK.ac], all = APT.filter(a => a[0] !== from), ok = all.filter(a => aptKm(from, a[0]) <= ac.specs.range).length;
    return `${from} ${esc(aptBy[from].name)}에서 갈 수 있는 공항은 ${all.length}곳이고, ${esc(short(ac))}의 항속거리(${fmt(ac.specs.range)} km) 안에는 ${ok}곳이 있습니다.${from !== PS.pilot.loc ? ` 지금 위치는 ${PS.pilot.loc}라서 여기서는 둘러보기만 됩니다.` : PS.booking ? " 예약된 비행이 있어 새로 고를 수 없습니다." : ""}`;
  }
  function renderDest() {
    const from = DS.from && aptBy[DS.from] ? DS.from : PS.pilot.loc;
    return phead("Flight Center", "취항지", "어느 공항에서 어디로 갈 수 있는지 찾아봅니다. 출발 공항과 기종을 고르면 거리, 예상 시간, 항속거리 안인지가 나옵니다.", `<div class="actions"><a class="btn ghost" href="#book">${ICON.map}지도에서 예약</a></div>`) + `
<div class="grid"><section class="card c12"><div class="filters"><div class="fld inl"><label for="ds-from">출발</label><select class="sel" id="ds-from">${aptOptions(from)}</select></div><div class="fld inl"><label for="ds-ac">기종</label><select class="sel" id="ds-ac">${acOptions(BK.ac)}</select></div>${seg("dsreg", REGIONS, DS.region, "지역")}<input class="in" id="ds-q" type="search" placeholder="이름, 코드, 국가" value="${esc(DS.q)}" aria-label="도착 공항 검색" autocomplete="off"></div>
<p class="small muted" id="ds-sum" style="margin:0;padding:10px 24px;border-bottom:1px solid var(--line)">${destSummary()}</p>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>IATA</th><th>도착 공항</th><th>국가</th><th class="num">거리</th><th class="num">예상 시간</th><th class="num">이 구간 비행</th><th></th></tr></thead><tbody id="ds-rows">${destRows()}</tbody></table></div></section></div>`;
  }

  /* ---------- Flight Center: 비행 생성기 · 내 로스터 ---------- */
  const GEN = { from: null, ac: null, legs: 3, maxH: 0, loop: true, out: null, err: "" };
  function genBuild() {
    const from = GEN.from && aptBy[GEN.from] ? GEN.from : PS.pilot.loc, ac = byId[GEN.ac && byId[GEN.ac] ? GEN.ac : BK.ac], maxMin = GEN.maxH ? GEN.maxH * 60 : Infinity;
    const ok = (a, b) => { const km = aptKm(a, b); return km >= 150 && km <= ac.specs.range && eteMin(km, ac) <= maxMin; };
    for (let tryN = 0; tryN < 60; tryN++) {
      const legs = []; let cur = from; const seen = new Set([from]); let fail = false;
      for (let i = 0; i < GEN.legs; i++) {
        const last = i === GEN.legs - 1;
        if (last && GEN.loop) { if (!ok(cur, from) || cur === from) { fail = true; break; } legs.push([cur, from]); break; }
        let c = APT.map(a => a[0]).filter(x => x !== cur && !seen.has(x) && ok(cur, x));
        if (GEN.loop && i === GEN.legs - 2) c = c.filter(x => ok(x, from));
        if (!c.length) { fail = true; break; }
        const nx = c[Math.floor(Math.random() * c.length)]; legs.push([cur, nx]); seen.add(nx); cur = nx;
      }
      if (!fail && legs.length === GEN.legs) { GEN.out = { from: from, ac: ac.id, legs: legs }; GEN.err = ""; return; }
    }
    GEN.out = null; GEN.err = "이 조건으로는 일정을 만들 수 없습니다. 구간 수를 줄이거나 구간 시간 제한을 풀거나 항속거리가 긴 기종을 골라 보세요.";
  }
  const legRows = (legs, acId, since) => legs.map((l, i) => { const km = aptKm(l[0], l[1]), ac = byId[acId], done = since ? PS.pireps.some(p => p.dep === l[0] && p.arr === l[1] && p.filed >= since) : false; return `<tr><td class="num">${i + 1}</td><td><strong class="mono">${l[0]} → ${l[1]}</strong></td><td>${esc(aptBy[l[0]].name)} → ${esc(aptBy[l[1]].name)}</td><td class="num">${distTxt(km)}</td><td class="num">${hm(eteMin(km, ac))}</td>${since ? `<td>${done ? `<span class="pill ok">완료</span>` : `<span class="pill off">남음</span>`}</td>` : ""}</tr>`; }).join("");
  const legTotals = (legs, acId) => { const km = legs.reduce((s, l) => s + aptKm(l[0], l[1]), 0), min = legs.reduce((s, l) => s + eteMin(aptKm(l[0], l[1]), byId[acId]), 0); return `${legs.length}구간 · ${distTxt(km)} · 비행 ${hm(min)}`; };
  function genOut() {
    if (GEN.err) return `<p class="empty">${GEN.err}</p>`;
    const o = GEN.out; if (!o) return `<p class="empty">조건을 고르고 ‘일정 만들기’를 누르면 여러 구간으로 된 비행 일정이 나옵니다.</p>`;
    const canBook = o.from === PS.pilot.loc && !PS.booking;
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th class="num">#</th><th>구간</th><th>공항</th><th class="num">거리</th><th class="num">예상 시간</th></tr></thead><tbody>${legRows(o.legs, o.ac)}</tbody></table></div>
<div class="card-b" style="border-top:1px solid var(--line)"><div class="aclive"><div><b>${legTotals(o.legs, o.ac)}</b><p class="small muted" style="margin:2px 0 0">${esc(byId[o.ac].name)} · ${o.from} 출발${canBook ? "" : o.from !== PS.pilot.loc ? ` · 지금 위치(${PS.pilot.loc})와 달라 바로 예약할 수 없습니다` : " · 예약된 비행이 있어 바로 예약할 수 없습니다"}</p></div><div class="actions"><button type="button" class="btn ghost" data-po="gen" id="gen-again">${ICON.dice}다시 만들기</button><button type="button" class="btn ghost" data-po="gen-save" id="gen-save">${ICON.list}로스터로 저장</button>${canBook ? `<button type="button" class="btn" data-po="gen-book" id="gen-book">${ICON.plane}첫 구간 예약</button>` : ""}</div></div></div>`;
  }
  function renderGenerator() {
    const from = GEN.from && aptBy[GEN.from] ? GEN.from : PS.pilot.loc, ac = GEN.ac && byId[GEN.ac] ? GEN.ac : BK.ac;
    return phead("Flight Center", "비행 생성기", "가고 싶은 곳이 딱히 없을 때 쓰는 기능입니다. 출발 공항, 기종, 구간 수를 정하면 항속거리 안에서 여러 구간으로 된 일정을 무작위로 만들어 줍니다.", `<div class="actions"><a class="btn ghost" href="#rosters">${ICON.list}내 로스터</a></div>`) + `
<div class="grid"><section class="card c12">${cardH(ICON.dice, "조건")}<div class="card-b"><div class="form-grid"><div class="fld"><label for="gen-from">출발 공항</label><select class="sel" id="gen-from">${aptOptions(from)}</select></div><div class="fld"><label for="gen-ac">기종</label><select class="sel" id="gen-ac">${acOptions(ac)}</select></div><div class="fld"><label for="gen-legs">구간 수</label><select class="sel" id="gen-legs">${[2, 3, 4, 5, 6].map(n => `<option value="${n}"${GEN.legs === n ? " selected" : ""}>${n}구간</option>`).join("")}</select></div><div class="fld"><label for="gen-max">구간당 최대 시간</label><select class="sel" id="gen-max">${[[0, "제한 없음"], [2, "2시간"], [4, "4시간"], [8, "8시간"], [12, "12시간"]].map(o => `<option value="${o[0]}"${GEN.maxH === o[0] ? " selected" : ""}>${o[1]}</option>`).join("")}</select></div></div>
<label class="small gl-chk" style="margin-top:14px"><input type="checkbox" id="gen-loop"${GEN.loop ? " checked" : ""}> 마지막 구간에서 출발 공항으로 돌아오기</label>
<div class="actions" style="margin-top:16px"><button type="button" class="btn" data-po="gen" id="gen-go">${ICON.dice}일정 만들기</button></div></div></section>
<section class="card c12">${cardH(ICON.route, "만들어진 일정")}<div id="gen-out">${genOut()}</div></section></div>`;
  }
  const rosterDone = r => r.legs.filter(l => PS.pireps.some(p => p.dep === l[0] && p.arr === l[1] && p.filed >= r.created)).length;
  function rosterCard(r) {
    const d = rosterDone(r), nx = r.legs.find(l => !PS.pireps.some(p => p.dep === l[0] && p.arr === l[1] && p.filed >= r.created)), here = PS.pilot.loc;
    let act = "";
    if (!nx) act = `<span class="pill ok">완료</span>`;
    else if (PS.booking) act = `<span class="small muted">예약된 비행을 마치면 다음 구간을 예약할 수 있습니다.</span>`;
    else if (nx[0] === here) act = `<button type="button" class="btn" data-po="ros-book:${r.id}" id="ros-book-${r.id}">${ICON.plane}다음 구간 예약 (${nx[0]} → ${nx[1]})</button>`;
    else act = `<span class="small muted">다음 구간은 ${nx[0]} 출발입니다. 지금 위치는 ${here}입니다.</span><button type="button" class="btn ghost" data-pilot="jump:${nx[0]}" id="ros-jump-${r.id}">${ICON.swap}${nx[0]}로 점프시트 이동</button>`;
    return `<section class="card c12">${cardH(ICON.list, r.name, `<span class="hint">${legTotals(r.legs, r.ac)} · ${esc(short(byId[r.ac]))}</span><button type="button" class="btn warn sm" data-po="ros-del:${r.id}" id="ros-del-${r.id}">삭제</button>`)}
<div class="card-b" style="display:grid;gap:12px">${pbar("진행", d / r.legs.length * 100, `${d} / ${r.legs.length} 구간`, `${dayKo(r.created)} 저장 · 저장한 뒤 제출한 PIREP만 집계합니다`)}<div class="actions" style="align-items:center">${act}</div></div>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th class="num">#</th><th>구간</th><th>공항</th><th class="num">거리</th><th class="num">예상 시간</th><th>상태</th></tr></thead><tbody>${legRows(r.legs, r.ac, r.created)}</tbody></table></div></section>`;
  }
  function renderRosters() {
    const mine = rosters();
    return phead("Flight Center", "내 로스터", "저장해 둔 여러 구간 일정입니다. 구간을 순서대로 비행하고 PIREP을 제출하면 진행 상황이 채워집니다.", `<div class="actions"><a class="btn" href="#generator">${ICON.dice}비행 생성기</a></div>`) + `
<div class="grid">${mine.length ? mine.map(rosterCard).join("") : `<section class="card c12"><div class="card-b aclive"><div><h2>저장한 로스터가 없습니다</h2><p class="muted" style="margin:4px 0 0">비행 생성기에서 일정을 만들어 저장하거나, 아래 추천 일정을 추가해 보세요.</p></div><a class="btn" href="#generator">${ICON.dice}일정 만들기</a></div></section>`}
<section class="card c12">${cardH(ICON.star, "추천 일정", `<span class="hint">운영진이 짠 일정</span>`)}<div>${TOURS.map((t, i) => `<div class="tour"><div class="tour-h"><h3>${esc(t.name)}</h3><button type="button" class="btn ghost sm" data-po="ros-add:${i}" id="ros-add-${i}"${mine.some(r => r.tour === i) ? " disabled" : ""}>${mine.some(r => r.tour === i) ? "추가됨" : "내 로스터에 추가"}</button></div><p class="muted" style="margin:0">${esc(t.desc)}</p><div class="tour-legs">${t.legs.map(l => `<span class="tleg">${l[0]} → ${l[1]}</span>`).join("")}</div></div>`).join("")}</div></section></div>`;
  }

  /* ---------- Flight Center: PIREP · 클레임 ---------- */
  const PF = { q: "", ac: "all" };
  function pirepRows() {
    const q = PF.q.trim().toLowerCase(), L = PS.pireps.filter(p => (PF.ac === "all" || p.ac === PF.ac) && (!q || (p.cs + " " + p.dep + " " + p.arr + " " + aptBy[p.dep].name + " " + aptBy[p.arr].name).toLowerCase().includes(q)));
    return pirepTable(L);
  }
  function renderPireps() {
    const st = pstats(0), acIds = Array.from(new Set(PS.pireps.map(p => p.ac)));
    return phead("Flight Center", "PIREP", "제출한 비행 보고서입니다. 행을 누르면 경로 지도와 점수 내역이 나옵니다.", `<div class="actions"><span class="sync" data-sync>${syncText()}</span><a class="btn ghost" href="#claims">${ICON.check}클레임 제출</a></div>`) + `
<div class="grid">${PS.demo ? demoNote() : ""}<section class="card c12"><div class="stats">${statTiles(st)}</div></section>
<section class="card c12"><div class="filters"><input class="in" id="pf-q" type="search" placeholder="편명, 공항 코드, 공항 이름" value="${esc(PF.q)}" aria-label="PIREP 검색" autocomplete="off"><div class="fld inl"><label for="pf-ac">기종</label><select class="sel" id="pf-ac"><option value="all">모든 기종</option>${acIds.map(id => `<option value="${id}"${PF.ac === id ? " selected" : ""}>${ICAO[id]} · ${esc(short(byId[id]))}</option>`).join("")}</select></div><span class="hint" style="margin-left:auto">전체 ${PS.pireps.length}건</span></div><div id="pf-out">${pirepRows()}</div></section></div>`;
  }
  function renderClaims() {
    const here = PS.pilot.loc, mine = PS.pireps.filter(p => p.manual), today = new Date().toISOString().slice(0, 10);
    const num = (id, label, val, attrs, help) => `<div class="fld"><label for="${id}">${label}</label><input class="in" id="${id}" type="number" inputmode="numeric" value="${val}" ${attrs}><small>${help}</small></div>`;
    return phead("Flight Center", "클레임", "예약 없이 이미 마친 비행을 수동으로 보고하는 곳입니다. 예약을 깜빡했거나 기록이 빠진 비행을 채울 때 씁니다. 수동 보고는 PIREP 목록에 ‘수동’으로 표시됩니다.", `<div class="actions"><a class="btn ghost" href="#pireps">${ICON.doc}PIREP 목록</a></div>`) + `
<div class="grid"><section class="card c12">${cardH(ICON.check, "수동 보고서 작성")}<form id="claim-form" class="card-b" autocomplete="off"><div class="form-grid"><div class="fld"><label for="cl-dep">출발 공항</label><select class="sel" id="cl-dep">${aptOptions(here)}</select></div><div class="fld"><label for="cl-arr">도착 공항</label><select class="sel" id="cl-arr">${aptOptions(here === "CJU" ? "GMP" : "CJU")}</select></div><div class="fld"><label for="cl-ac">기종</label><select class="sel" id="cl-ac">${acOptions(BK.ac)}</select></div><div class="fld"><label for="cl-date">비행 날짜</label><input class="in" id="cl-date" type="date" value="${today}" max="${today}" required></div>${num("cl-time", "비행 시간 (분)", "", 'min="5" max="1500" placeholder="비우면 예상치"', "이륙부터 착륙까지")}${num("cl-land", "착륙률 (fpm)", -180, 'min="-2000" max="0" required', "접지 순간의 강하율")}</div>
<div class="fld" style="margin-top:16px"><label for="cl-notes">사유와 메모</label><textarea class="in" id="cl-notes" rows="2" maxlength="300" placeholder="예: 예약 없이 비행함, 기록 누락"></textarea></div>
<label class="small gl-chk" style="margin-top:12px"><input type="checkbox" id="cl-move"> 현재 위치를 도착 공항으로 옮기기</label>
<p class="small neg" id="cl-err" style="margin:10px 0 0" hidden></p>
<div class="actions" style="margin-top:16px"><button type="submit" class="btn go" id="cl-submit">${ICON.check}클레임 제출</button></div></form></section>
<section class="card c12">${cardH(ICON.list, "내 클레임", `<span class="hint">${mine.length}건</span>`)}${mine.length ? pirepTable(mine) : `<p class="empty">제출한 클레임이 없습니다.</p>`}</section></div>`;
  }

  /* ---------- My Profile: 통계 · 패스포트 · 배지 · 설정 ---------- */
  function monthSeries() {
    const now = new Date(), M = []; for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); M.push({ k: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"), lab: (d.getMonth() + 1) + "월", n: 0, land: 0 }); }
    PS.pireps.forEach(p => { const d = new Date(p.filed), k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"), m = M.find(x => x.k === k); if (m) { m.n++; m.land += Math.abs(p.land); } });
    return M;
  }
  function monthChart(M, key, unit, title) {
    const vals = M.map(m => key === "n" ? m.n : m.n ? Math.round(m.land / m.n) : 0), mx = Math.max(1, ...vals), W = 560, H = 190, x0 = 34, bw = (W - x0 - 8) / 12, y1 = H - 26, hh = y1 - 16;
    const bars = M.map((m, i) => { const v = vals[i], h = v / mx * hh, x = x0 + i * bw; return `<g>${v ? `<rect class="mc-bar" x="${N(x + bw * 0.18)}" y="${N(y1 - h)}" width="${N(bw * 0.64)}" height="${N(h)}" rx="3"><title>${m.k} · ${v}${unit}</title></rect><text class="mc-v" x="${N(x + bw / 2)}" y="${N(y1 - h - 5)}" text-anchor="middle">${v}</text>` : ""}<text class="mc-x" x="${N(x + bw / 2)}" y="${H - 8}" text-anchor="middle">${m.lab}</text></g>`; }).join("");
    return `<svg class="mchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}: ${M.map((m, i) => m.lab + " " + vals[i] + unit).join(", ")}"><line class="mc-ax" x1="${x0}" y1="${y1}" x2="${W - 8}" y2="${y1}"/><text class="mc-x" x="${x0 - 6}" y="${y1 + 4}" text-anchor="end">0</text><text class="mc-x" x="${x0 - 6}" y="20" text-anchor="end">${mx}</text><line class="mc-grid" x1="${x0}" y1="16" x2="${W - 8}" y2="16"/>${bars}</svg>`;
  }
  function renderStats() {
    const L = PS.pireps, by = {}, st = pstats(0);
    L.forEach(p => { const b = by[p.ac] || (by[p.ac] = { n: 0, pax: 0, cargo: 0, min: 0, km: 0, fuel: 0, land: 0 }); b.n++; b.pax += p.pax || 0; b.cargo += p.cargo || 0; b.min += p.time; b.km += p.km; b.fuel += p.fuel || 0; b.land += p.land; });
    const ids = Object.keys(by).sort((a, b) => by[b].n - by[a].n), tot = { n: st.n, pax: st.pax, cargo: st.freight, min: st.min, km: st.km, fuel: st.fuel, land: st.n ? st.land * st.n : 0 };
    const mk = { boeing: 0, airbus: 0 }; L.forEach(p => { mk[byId[p.ac].maker]++; });
    const dist = [["단거리 (1,500 km 미만)", L.filter(p => p.km < 1500).length], ["중거리 (1,500~5,000 km)", L.filter(p => p.km >= 1500 && p.km < 5000).length], ["장거리 (5,000 km 이상)", L.filter(p => p.km >= 5000).length]];
    const land = [["100 fpm 이하", L.filter(p => Math.abs(p.land) <= 100).length, "good"], ["101~200 fpm", L.filter(p => Math.abs(p.land) > 100 && Math.abs(p.land) <= 200).length], ["201~300 fpm", L.filter(p => Math.abs(p.land) > 200 && Math.abs(p.land) <= 300).length], ["301~500 fpm", L.filter(p => Math.abs(p.land) > 300 && Math.abs(p.land) <= 500).length], ["500 fpm 초과", L.filter(p => Math.abs(p.land) > 500).length, "bad"]];
    const M = monthSeries();
    const row = (name, b, strong) => `<tr${strong ? ' class="me-row"' : ""}><td>${name}</td><td class="num">${fmt(b.n)}</td><td class="num">${fmt(b.pax)}</td><td class="num">${fmt(Math.round(b.cargo / 1000))} t</td><td class="num">${hm(b.min)}</td><td class="num">${distTxt(b.km)}</td><td class="num">${fmt(Math.round(b.fuel / 1000))} t</td><td class="num">${b.n ? Math.round(b.land / b.n) : "—"} fpm</td></tr>`;
    return phead(`<a href="#profile">내 프로필</a>`, "통계", "제출한 PIREP으로 계산한 비행 습관과 기종별 로그북입니다.", `<span class="sync" data-sync>${syncText()}</span>`) + profTabs("stats") + `
<div class="grid">${PS.demo ? demoNote() : ""}
<section class="card c6">${cardH(ICON.plane, "기종별 비행")}<div class="card-b">${barList(ids.map(id => [`${ICAO[id]} · ${esc(short(byId[id]))}`, by[id].n, "mk-" + byId[id].maker]), "회")}</div></section>
<section class="card c6">${cardH(ICON.bldg, "제작사")}<div class="card-b">${barList([["보잉", mk.boeing, "mk-boeing"], ["에어버스", mk.airbus, "mk-airbus"]], "회")}</div>${cardH(ICON.route, "구간 거리")}<div class="card-b">${barList(dist, "회")}</div></section>
<section class="card c6">${cardH(ICON.chart, "월별 비행 수", `<span class="hint">최근 12개월</span>`)}<div class="card-b">${monthChart(M, "n", "회", "월별 비행 수")}</div></section>
<section class="card c6">${cardH(ICON.gauge, "월별 평균 착륙률", `<span class="hint">fpm, 낮을수록 부드러움</span>`)}<div class="card-b">${monthChart(M, "land", " fpm", "월별 평균 착륙률")}</div></section>
<section class="card c12">${cardH(ICON.gauge, "착륙률 분포")}<div class="card-b">${barList(land, "회")}</div></section>
<section class="card c12">${cardH(ICON.book, "로그북", `<span class="hint">기종별 합계</span>`)}${ids.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>기종</th><th class="num">비행</th><th class="num">승객</th><th class="num">화물</th><th class="num">비행 시간</th><th class="num">거리</th><th class="num">연료</th><th class="num">평균 착륙률</th></tr></thead><tbody>${ids.map(id => row(`<a class="ext" href="#${id}"><span class="code">${ICAO[id]}</span> ${esc(byId[id].name)}</a>`, by[id])).join("")}${row("<strong>합계</strong>", tot, true)}</tbody></table></div>` : `<p class="empty">아직 제출한 PIREP이 없습니다.</p>`}</section></div>`;
  }
  function renderPassport() {
    const vis = {}; PS.pireps.forEach(p => { vis[p.dep] = (vis[p.dep] || 0) + 1; vis[p.arr] = (vis[p.arr] || 0) + 1; });
    const byC = {}; APT.forEach(a => { (byC[a[3]] = byC[a[3]] || []).push(a); });
    const ccs = Object.keys(byC), seen = ccs.filter(c => byC[c].some(a => vis[a[0]])), full = seen.filter(c => byC[c].every(a => vis[a[0]])), nA = Object.keys(vis).length;
    seen.sort((a, b) => byC[b].filter(x => vis[x[0]]).length - byC[a].filter(x => vis[x[0]]).length);
    const todo = ccs.filter(c => !seen.includes(c)).sort((a, b) => (CCN[a] || a).localeCompare(CCN[b] || b, "ko"));
    const chip = a => `<a class="tleg pp-apt${vis[a[0]] ? " done" : ""}" href="#apt-${a[0]}" title="${esc(a[2])}">${vis[a[0]] ? ICON.check : ""}${a[0]}${vis[a[0]] ? `<small>${vis[a[0]]}</small>` : ""}</a>`;
    const cRow = c => { const all = byC[c], n = all.filter(a => vis[a[0]]).length, done = n === all.length; return `<div class="pp-c${done ? " full" : ""}"><div class="pp-h"><b>${done ? `<span class="pp-star" title="모든 공항 방문">${ICON.star}</span>` : ""}${esc(CCN[c] || c)}</b><span class="code">${c}</span><span class="sp"></span><span class="val">${n} / ${all.length}</span></div><div class="prog-t"><span class="prog-f" style="width:${N(n / all.length * 100)}%"></span></div><div class="tour-legs">${all.map(chip).join("")}</div></div>`; };
    return phead(`<a href="#profile">내 프로필</a>`, "패스포트", "지금까지 이착륙한 공항과 나라를 모았습니다. 한 나라의 취항 공항을 모두 방문하면 금색 별이 붙습니다.", `<div class="actions"><a class="btn ghost" href="#map">${ICON.globe}비행 지도</a></div>`) + profTabs("passport") + `
<div class="grid">${PS.demo ? demoNote() : ""}
<section class="card c12"><div class="stats pp-stats"><div class="stat"><span class="stat-i">${ICON.flag}</span><span class="stat-n">${nA}<small> / ${APT.length}</small></span><span class="stat-l">방문한 공항</span><span class="stat-s">${N(nA / APT.length * 100)}%</span></div><div class="stat"><span class="stat-i">${ICON.globe}</span><span class="stat-n">${seen.length}<small> / ${ccs.length}</small></span><span class="stat-l">방문한 나라</span><span class="stat-s">${N(seen.length / ccs.length * 100)}%</span></div><div class="stat"><span class="stat-i">${ICON.star}</span><span class="stat-n">${full.length}<small>개국</small></span><span class="stat-l">모든 공항을 방문한 나라</span></div><div class="stat"><span class="stat-i">${ICON.pin}</span><span class="stat-n">${PS.pilot.loc}</span><span class="stat-l">현재 위치</span><span class="stat-s">${esc(aptBy[PS.pilot.loc].name)}</span></div></div></section>
<section class="card c7">${cardH(ICON.check, "방문한 나라", `<span class="hint">${seen.length}개국</span>`)}<div class="pp-list">${seen.length ? seen.map(cRow).join("") : `<p class="empty">아직 방문한 공항이 없습니다. 첫 비행을 마치면 여기에 도장이 찍힙니다.</p>`}</div></section>
<section class="card c5">${cardH(ICON.pin, "아직 가 보지 않은 나라", `<span class="hint">${todo.length}개국</span>`)}<div class="pp-list">${todo.length ? todo.map(cRow).join("") : `<p class="empty">취항하는 모든 나라를 방문했습니다.</p>`}</div></section></div>`;
  }
  function renderBadges() {
    const B = badgeList(), got = B.filter(x => x[2]).length;
    return phead(`<a href="#profile">내 프로필</a>`, "배지", "PIREP을 제출할 때마다 조건을 확인해 자동으로 주어지는 배지입니다.", `<span class="hint">${got} / ${B.length} 획득</span>`) + profTabs("badges") + `
<div class="grid"><section class="card c12">${cardH(ICON.medal, "획득한 배지", `<span class="hint">${got}개</span>`)}<div class="card-b">${got ? `<div class="badges">${B.filter(x => x[2]).map(x => `<div class="badge">${ICON.star}<b>${x[0]}</b><small>${x[1]}</small></div>`).join("")}</div>` : `<p class="muted" style="margin:0">아직 획득한 배지가 없습니다.</p>`}</div></section>
<section class="card c12">${cardH(ICON.target, "도전할 배지", `<span class="hint">${B.length - got}개</span>`)}<div class="card-b">${B.length - got ? `<div class="badges">${B.filter(x => !x[2]).map(x => `<div class="badge locked">${ICON.star}<b>${x[0]}</b><small>${x[1]}</small></div>`).join("")}</div>` : `<p class="muted" style="margin:0">모든 배지를 획득했습니다.</p>`}</div></section></div>`;
  }
  function renderSettings() {
    return phead(`<a href="#profile">내 프로필</a>`, "설정", "화면에 표시할 이름과 단위, 기록 저장 방식을 정합니다.", `<span class="sync" data-sync>${syncText()}</span>`) + profTabs("settings") + `
<div class="grid">
<section class="card c6">${cardH(ICON.user, "조종사 정보")}<form id="pilot-form" class="card-b" autocomplete="off"><div class="form-grid"><div class="fld"><label for="pl-name">조종사 이름</label><input class="in" id="pl-name" maxlength="24" value="${esc(PS.pilot.name)}" placeholder="화면에 표시할 이름"></div><div class="fld"><label for="pl-num">조종사 번호</label><input class="in" id="pl-num" type="number" min="1" max="9999" value="${PS.pilot.num}"><small>${VA.code} 뒤에 붙는 네 자리</small></div><div class="fld"><label for="pl-units">거리 단위</label><select class="sel" id="pl-units"><option value="km"${PS.pilot.units === "km" ? " selected" : ""}>킬로미터 (km)</option><option value="nm"${PS.pilot.units === "nm" ? " selected" : ""}>해리 (NM)</option></select></div></div><div class="actions" style="margin-top:16px"><button type="submit" class="btn" id="pl-save">저장</button></div></form></section>
<section class="card c6">${cardH(ICON.doc, "기록 저장")}<div class="card-b"><p><span class="sync" data-sync>${syncText()}</span></p><p class="muted">기록은 조종사 본인만 볼 수 있는 곳에 둡니다. 계정 저장소에 연결되지 않은 환경에서는 이 브라우저에만 남으므로, 브라우저 데이터를 지우면 함께 사라집니다.</p><div class="actions">${PS.demo ? `<button type="button" class="btn ghost" data-pilot="demo-clear" id="pr-demo">예시 기록 지우기</button>` : ""}<button type="button" class="btn warn" data-pilot="reset" id="pr-reset">모든 기록 초기화</button></div></div></section>
<section class="card c12">${cardH(ICON.gear, "화면")}<div class="card-b"><div class="aclive"><div><b>밝은 테마 · 어두운 테마</b><p class="small muted" style="margin:2px 0 0">위쪽 막대의 전구 버튼으로도 바꿀 수 있습니다.</p></div><button type="button" class="btn ghost" data-po="theme" id="set-theme">테마 바꾸기</button></div></div></section></div>`;
  }

  /* ---------- Documents: NOTAM · 계급 · 점수 ---------- */
  function renderNotams() {
    return phead("Documents", "NOTAM", "운영진이 조종사에게 알리는 공지입니다. 중요도 순으로 놓았습니다.", "") + `
<div class="grid"><section class="card c12">${cardH(ICON.bell, "운영 공지", `<span class="hint">${VA_NOTAMS.length}건</span>`)}<div>${VA_NOTAMS.map(n => `<a class="notam p-${n.p}" href="#${n.href}"><i></i><div><div class="notam-h"><span class="tag">${PRI[n.p]}</span><strong>${esc(n.title)}</strong><span class="date">${esc(n.date)}</span></div><p>${esc(n.text)}</p></div></a>`).join("")}</div></section>
<section class="card c12">${cardH(ICON.info, "업계 소식", `<span class="hint">기종 백과</span>`)}<div>${NOTAMS.map(n => `<a class="notam p-${n.p}" href="#${n.href}"><i></i><div><div class="notam-h"><span class="tag">${PRI[n.p]}</span><strong>${esc(n.title)}</strong><span class="date">${esc(n.date)}</span></div><p>${esc(n.text)}</p></div></a>`).join("")}</div></section></div>`;
  }
  function renderRanks() {
    const all = pstats(0), h = all.min / 60, rk = rankOf(all.min);
    return phead("Documents", "계급 안내", "계급은 누적 비행 시간으로 정해집니다. 기준 시간을 넘으면 다음 PIREP을 제출할 때 자동으로 올라갑니다.", `<div class="actions"><a class="btn ghost" href="#profile">${ICON.users}내 프로필</a></div>`) + `
<div class="grid"><section class="card c5">${cardH(ICON.target, "내 계급")}<div class="card-b rank"><div class="rank-h"><b>${esc(rk.name)}</b><span class="muted">${rk.next ? "다음 " + esc(rk.next) : "최고 계급"}</span></div><div class="prog-t"><span class="prog-f" style="width:${N(rk.pct)}%"></span></div><small class="muted">누적 ${N(Math.round(h * 10) / 10)}시간. ${rk.next ? `${N(Math.round(rk.left * 10) / 10)}시간 더 비행하면 승급합니다.` : "모든 계급을 달성했습니다."}</small></div></section>
<section class="card c7">${cardH(ICON.star, "계급표")}<div class="tbl-wrap"><table class="tbl plain"><thead><tr><th>계급</th><th class="num">필요한 누적 시간</th><th>상태</th></tr></thead><tbody>${RANKS.map(r => `<tr class="${rk.name === r[1] ? "me-row" : ""}"><td><strong>${esc(r[1])}</strong></td><td class="num">${fmt(r[0])}시간</td><td>${rk.name === r[1] ? `<span class="pill ok">현재</span>` : h >= r[0] ? `<span class="pill off">달성</span>` : `<span class="muted">${N(Math.round((r[0] - h) * 10) / 10)}시간 남음</span>`}</td></tr>`).join("")}</tbody></table></div></section></div>`;
  }
  function renderScores() {
    const ex = [mkPirep("x1", "GMP", "CJU", "boeing-737max", -85, 0), mkPirep("x2", "ICN", "LAX", "boeing-747", -240, 0), mkPirep("x3", "ICN", "NRT", "airbus-a320neo", -560, 0)];
    return phead("Documents", "점수 기준", "PIREP 한 건의 점수는 기본 점수에 착륙률과 비행 시간에 따른 점수를 더해 정합니다.", `<div class="actions"><a class="btn ghost" href="#pireps">${ICON.doc}내 PIREP</a></div>`) + `
<div class="grid">
<section class="card c4">${cardH(ICON.doc, "기본")}<div class="card-b"><div class="pts"><div><span>PIREP 제출</span><b class="pos">+100</b></div></div></div></section>
<section class="card c4">${cardH(ICON.gauge, "착륙률")}<div class="card-b"><div class="pts"><div><span>100 fpm 이하</span><b class="pos">+30</b></div><div><span>101~200 fpm</span><b class="pos">+20</b></div><div><span>201~300 fpm</span><b class="pos">+10</b></div><div><span>301~500 fpm</span><b>0</b></div><div><span>500 fpm 초과</span><b class="neg">-30</b></div></div></div></section>
<section class="card c4">${cardH(ICON.clock, "비행 시간")}<div class="card-b"><div class="pts"><div><span>2시간 미만</span><b class="pos">+10</b></div><div><span>2시간 이상 5시간 미만</span><b class="pos">+25</b></div><div><span>5시간 이상</span><b class="pos">+50</b></div></div></div></section>
<section class="card c12">${cardH(ICON.info, "계산 예")}<div class="tbl-wrap"><table class="tbl"><thead><tr><th>구간</th><th>기종</th><th class="num">비행 시간</th><th class="num">착륙률</th><th>내역</th><th class="num">점수</th></tr></thead><tbody>${ex.map(p => { const sc = scorePirep(p); return `<tr><td><strong class="mono">${p.dep} → ${p.arr}</strong></td><td>${esc(short(byId[p.ac]))}</td><td class="num">${hm(p.time)}</td><td class="num">${p.land} fpm</td><td>${sc.rows.map(r => `${r[0]} ${r[1] > 0 ? "+" : ""}${r[1]}`).join(" · ")}</td><td class="num"><strong>${sc.total}</strong></td></tr>`; }).join("")}</tbody></table></div></section></div>`;
  }

  /* ---------- 소개 ---------- */
  function renderAbout() {
    const A = typeof ABOUT !== "undefined" ? ABOUT : { name: "", tagline: "", intro: [], links: [], projects: [] }, nm = A.name || "이름";
    return `<div class="grid">
<section class="card c12 ab-hero"><span class="avatar ab-av">${esc(nm.slice(0, 1).toUpperCase())}</span><div><p class="lbl">About me · 소개</p><h1>${esc(nm)}</h1>${A.tagline ? `<p class="ab-tag">${esc(A.tagline)}</p>` : ""}<div class="actions">${(A.links || []).map(l => `<a class="btn ghost" href="${esc(l[1])}" target="_blank" rel="noopener">${ICON.ext}${esc(l[0])}</a>`).join("")}<a class="btn" href="#home">${ICON.grid}대시보드로</a></div></div></section>
<section class="card c12">${cardH(ICON.user, "소개")}<div class="card-b prose">${(A.intro || []).map(t => `<p>${esc(t)}</p>`).join("") || `<p class="muted">소개 글이 아직 없습니다.</p>`}</div></section>
<section class="card c12">${cardH(ICON.star, "이 사이트에 있는 것")}<div class="ab-proj">${(A.projects || []).map(p => `<a class="ab-p" href="${esc(p[2])}"><b>${esc(p[0])}</b><span>${esc(p[1])}</span></a>`).join("")}</div></section>
</div>`;
  }

  /* ---------- 페이지 목록과 이벤트 ---------- */
  const PORTAL_PAGES = { about: renderAbout, dest: renderDest, generator: renderGenerator, rosters: renderRosters, pireps: renderPireps, claims: renderClaims, stats: renderStats, map: renderFlightMap, passport: renderPassport, badges: renderBadges, settings: renderSettings, notams: renderNotams, ranks: renderRanks, scores: renderScores, icao: renderIcao };
  const PORTAL_TITLES = { about: "소개", dest: "취항지", generator: "비행 생성기", rosters: "내 로스터", pireps: "PIREP", claims: "클레임", stats: "통계", map: "비행 지도", passport: "패스포트", badges: "배지", settings: "설정", notams: "NOTAM", ranks: "계급 안내", scores: "점수 기준", icao: "ICAO 기준" };
  let portalWired = false;
  function wirePortal() {
    if (portalWired) return; portalWired = true;
    SEG.dsreg = v => { DS.region = v; const o = $("#ds-rows"); if (o) o.innerHTML = destRows(); };
    SEG.gldays = v => { GL.days = +v; GL.sel = null; paintGlobePanel(); };
    document.addEventListener("click", e => {
      const gl = e.target.closest("[data-gl]");
      if (gl) { const v = gl.getAttribute("data-gl"), i = v.indexOf(":"); if (globe) globe.act(i < 0 ? v : v.slice(0, i), i < 0 ? "" : v.slice(i + 1)); else if (v === "clear") { GL.sel = null; paintGlobePanel(); } else if (v.indexOf("route:") === 0) { GL.sel = GL.sel === v.slice(6) ? null : v.slice(6); paintGlobePanel(); } return; }
      const el = e.target.closest("[data-po]"); if (!el) return;
      const v = el.getAttribute("data-po"), i = v.indexOf(":"), act = i < 0 ? v : v.slice(0, i), arg = i < 0 ? "" : v.slice(i + 1);
      if (act === "grp") { const g = el.closest(".nav-grp"), on = !g.classList.contains("open"); g.classList.toggle("open", on); el.setAttribute("aria-expanded", on); navOpen[arg] = on; try { localStorage.setItem("hub-nav", JSON.stringify(navOpen)); } catch (er) { /* 무시 */ } return; }
      if (act === "gen") { genBuild(); const o = $("#gen-out"); if (o) o.innerHTML = genOut(); return; }
      if (act === "gen-save" && GEN.out) { const o = GEN.out; rosters().unshift({ id: "r" + Date.now().toString(36), name: `${o.from} 출발 ${o.legs.length}구간`, created: new Date().toISOString(), ac: o.ac, legs: o.legs }); saveState(); location.hash = "rosters"; return; }
      if (act === "gen-book" && GEN.out && !PS.booking && GEN.out.from === PS.pilot.loc) { const o = GEN.out; rosters().unshift({ id: "r" + Date.now().toString(36), name: `${o.from} 출발 ${o.legs.length}구간`, created: new Date().toISOString(), ac: o.ac, legs: o.legs }); bookNow(o.legs[0][0], o.legs[0][1], o.ac); return; }
      if (act === "ros-add" && TOURS[+arg] && !rosters().some(r => r.tour === +arg)) { const t = TOURS[+arg], km = Math.max(...t.legs.map(l => aptKm(l[0], l[1]))), ac = byId[BK.ac].specs.range >= km ? BK.ac : (AIRCRAFT.filter(a => a.specs.range >= km).sort((a, b) => a.specs.range - b.specs.range)[0] || byId["boeing-787"]).id; rosters().unshift({ id: "r" + Date.now().toString(36), name: t.name, created: new Date().toISOString(), ac: ac, legs: t.legs.map(l => l.slice()), tour: +arg }); saveState(); route(true); return; }
      if (act === "ros-del") { PS.rosters = rosters().filter(r => r.id !== arg); saveState(); route(true); return; }
      if (act === "ros-book") { const r = rosters().find(x => x.id === arg); if (!r || PS.booking) return; const nx = r.legs.find(l => !PS.pireps.some(p => p.dep === l[0] && p.arr === l[1] && p.filed >= r.created)); if (nx && nx[0] === PS.pilot.loc) bookNow(nx[0], nx[1], r.ac); return; }
      if (act === "theme") { const b = $("#theme"); if (b) b.click(); return; }
    });
    document.addEventListener("change", e => {
      const id = e.target.id;
      if (id === "ds-from" && aptBy[e.target.value]) { DS.from = e.target.value; route(true); }
      if (id === "ds-ac" && byId[e.target.value]) { BK.ac = e.target.value; try { localStorage.setItem("hub-bk-ac", BK.ac); } catch (er) { /* 무시 */ } route(true); }
      if (id === "gen-from") GEN.from = e.target.value; if (id === "gen-ac") GEN.ac = e.target.value; if (id === "gen-legs") GEN.legs = +e.target.value; if (id === "gen-max") GEN.maxH = +e.target.value; if (id === "gen-loop") GEN.loop = e.target.checked;
      if (id === "pf-ac") { PF.ac = e.target.value; const o = $("#pf-out"); if (o) o.innerHTML = pirepRows(); }
      if (id === "gl-ac") { GL.ac = e.target.value; GL.sel = null; paintGlobePanel(); }
      if (id === "gl-net") { GL.net = e.target.checked; saveGL(); if (globe) globe.dirty = true; }
      if (id === "gl-spin") { GL.spin = e.target.checked; saveGL(); }
    });
    document.addEventListener("input", e => {
      if (e.target.id === "ds-q") { DS.q = e.target.value; const o = $("#ds-rows"); if (o) o.innerHTML = destRows(); }
      if (e.target.id === "pf-q") { PF.q = e.target.value; const o = $("#pf-out"); if (o) o.innerHTML = pirepRows(); }
    });
    document.addEventListener("submit", e => {
      if (e.target.id !== "claim-form") return; e.preventDefault();
      const dep = $("#cl-dep").value, arr = $("#cl-arr").value, acId = $("#cl-ac").value, err = $("#cl-err"), ac = byId[acId];
      const fail = m => { if (err) { err.hidden = false; err.textContent = m; } };
      if (!aptBy[dep] || !aptBy[arr] || !ac) return;
      if (dep === arr) return fail("출발 공항과 도착 공항이 같습니다. 서로 다른 공항을 고르세요.");
      const km = aptKm(dep, arr); if (km > ac.specs.range) return fail(`${short(ac)}의 항속거리(${fmt(ac.specs.range)} km)로는 ${fmt(km)} km 구간을 갈 수 없습니다. 다른 기종을 고르세요.`);
      const d = new Date($("#cl-date").value + "T12:00:00"), when = isNaN(d) || d > new Date() ? new Date() : d, tv = Math.round(+$("#cl-time").value || 0);
      const p = { id: "c" + Date.now().toString(36), dep: dep, arr: arr, ac: acId, cs: flightNo(dep, arr), km: km, time: tv >= 5 ? Math.min(1500, tv) : eteMin(km, ac), land: -Math.abs(Math.max(-2000, Math.min(0, Math.round(+$("#cl-land").value || 0)))), fuel: fuelKg(km, ac), pax: Math.round(ac.specs.seats * 0.84), cargo: Math.round(ac.specs.mtow * 22), filed: when.toISOString(), notes: String($("#cl-notes").value || "").slice(0, 300), manual: true };
      p.points = scorePirep(p).total; clearDemo(); PS.pireps.push(p); PS.pireps.sort((a, b) => a.filed < b.filed ? 1 : -1);
      if ($("#cl-move").checked && !PS.booking) PS.pilot.loc = arr;
      saveState(); location.hash = "pirep-" + p.id;
    });
  }
