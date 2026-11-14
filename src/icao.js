
  /* ================= ICAO 기준 =================
     제원에서 바로 계산되는 ICAO 분류만 다룬다.
     - 비행장 기준 코드 문자: 부속서 14 (2018년 개정 뒤로는 날개폭만으로 정한다)
     - 항적 난기류 등급: Doc 4444 (최대이륙중량 기준, A380은 따로 J)
     - 구조·소방 등급: 부속서 14 제9장 (전체 길이와 동체 폭)
     - 형식 지정자: Doc 8643 */
  const ICAO_LETTER = [["A", 0, 15], ["B", 15, 24], ["C", 24, 36], ["D", 36, 52], ["E", 52, 65], ["F", 65, 80]];
  const FOLD_SPAN = { "boeing-777x": 64.85 };   // 지상에서 날개 끝을 접었을 때의 폭
  const letterRow = span => ICAO_LETTER.find(x => span < x[2]) || ["F 초과", 80, 80];
  const groundSpan = ac => FOLD_SPAN[ac.id] || ac.specs.span;
  const acLetter = ac => letterRow(groundSpan(ac))[0];
  const letterRange = r => r[1] ? `${r[1]} m 이상 ${r[2]} m 미만` : `${r[2]} m 미만`;
  const WAKE = { J: "초대형 (Super)", H: "대형 (Heavy)", M: "중형 (Medium)", L: "소형 (Light)" };
  const wakeCat = ac => ac.id === "airbus-a380" ? "J" : ac.specs.mtow >= 136 ? "H" : ac.specs.mtow > 7 ? "M" : "L";
  // [등급, 길이 상한(m), 동체 폭 상한(m)]
  const RFF = [[1, 9, 2], [2, 12, 2], [3, 18, 3], [4, 24, 4], [5, 28, 4], [6, 39, 5], [7, 49, 5], [8, 61, 7], [9, 76, 7], [10, 90, 8]];
  function rffCat(ac) { let i = RFF.findIndex(r => ac.specs.length < r[1]); if (i < 0) i = RFF.length - 1; if (ac.specs.width > RFF[i][2] && i < RFF.length - 1) i++; return RFF[i][0]; }

  // 날개폭을 코드 문자 구간 위에 표시하는 눈금
  function spanScale(list) {
    const bands = ICAO_LETTER.map(r => `<span class="${list.some(a => acLetter(a) === r[0]) ? "on" : ""}" style="flex:${r[2] - r[1]}"><b>${r[0]}</b><small>~${r[2]} m</small></span>`).join("");
    const marks = list.map((a, i) => { const sp = groundSpan(a); return `<i class="mk-${a.maker}${i ? " low" : ""}" style="left:${N(Math.min(100, sp / 80 * 100))}%"><em>${list.length > 1 ? esc(short(a)) + " " : ""}${sp} m</em></i>`; }).join("");
    return `<div class="icao-scale${list.length > 1 ? " two" : ""}" role="img" aria-label="ICAO 비행장 기준 코드 문자 구간과 날개폭: ${list.map(a => `${a.name} ${groundSpan(a)}미터, 코드 ${acLetter(a)}`).join(", ")}"><div class="icao-bands">${bands}</div>${marks}</div>`;
  }
  function icaoCard(ac) {
    const S = ac.specs, lr = letterRow(groundSpan(ac)), wk = wakeCat(ac), rf = rffCat(ac), fold = FOLD_SPAN[ac.id];
    const tile = (label, src, head, body) => `<div class="rcard"><div class="rcard-h"><span class="rcard-l">${label}</span><span class="rcard-v">${head}</span></div><div class="rcard-b">${body}<small class="icao-src">${src}</small></div></div>`;
    return `<section class="card icao mk-${ac.maker}" id="icao-card">${cardH(ICON.flag, "ICAO 기준", `<a class="ext small" href="#icao">기준 설명 →</a>`)}<div class="card-b">
<div class="rcards icao-tiles">${tile("비행장 기준 코드 문자", "부속서 14", lr[0], `날개폭 ${groundSpan(ac)} m<br><small>${letterRange(lr)}</small>`)}${tile("항적 난기류 등급", "Doc 4444", wk, `${WAKE[wk]}<br><small>최대이륙중량 ${S.mtow} t</small>`)}${tile("구조·소방 등급", "부속서 14", rf, `길이 ${S.length} m<br><small>동체 폭 ${S.width} m</small>`)}${tile("형식 지정자", "Doc 8643", ICAO[ac.id], `${esc(ac.variant.replace(/ 기준$/, ""))}<br><small>비행계획서·관제용 코드</small>`)}</div>
${spanScale([ac])}
<p class="small muted" style="margin:10px 0 0">${fold ? `비행할 때 날개폭은 ${S.span} m로 코드 F 범위지만, 지상에서는 날개 끝을 접어 ${fold} m가 되므로 코드 E 공항 시설을 그대로 씁니다. ` : ""}코드 문자는 유도로 폭과 주기장 간격, 구조·소방 등급은 공항이 갖춰야 할 소방 능력, 항적 난기류 등급은 뒤따르는 항공기와의 간격을 정하는 기준입니다. ${esc(ac.variant)} 제원으로 계산했습니다.</p></div></section>`;
  }

  /* ---------- 문서: ICAO 기준 안내 ---------- */
  function renderIcao() {
    const chips = list => list.length ? `<div class="tour-legs">${list.map(a => `<a class="tleg why-chip mk-${a.maker}" href="#${a.id}"><span class="dot"></span>${ICAO[a.id]} · ${esc(short(a))}</a>`).join("")}</div>` : `<span class="muted">—</span>`;
    const byL = l => AIRCRAFT.filter(a => acLetter(a) === l), byW = w => AIRCRAFT.filter(a => wakeCat(a) === w), byR = r => AIRCRAFT.filter(a => rffCat(a) === r);
    const pre = {}; APT.forEach(a => { (pre[a[1].slice(0, 2)] = pre[a[1].slice(0, 2)] || []).push(a); });
    const PRE_KO = { RK: "대한민국", RJ: "일본 (본토)", RO: "일본 (오키나와)", RC: "대만", RP: "필리핀", ZB: "중국 화북", ZS: "중국 화동", ZG: "중국 화남", VH: "홍콩", VT: "태국", VV: "베트남", VI: "인도 북부", VA: "인도 서부", WS: "싱가포르", WM: "말레이시아", WA: "인도네시아 동부", WI: "인도네시아 서부", OM: "아랍에미리트", OT: "카타르", LT: "튀르키예", EG: "영국", LF: "프랑스", ED: "독일", EH: "네덜란드", LI: "이탈리아", LE: "스페인", LS: "스위스", LO: "오스트리아", LK: "체코", PH: "미국 하와이", PG: "괌", CY: "캐나다", YS: "호주 (시드니 권역)", YB: "호주 (브리즈번 권역)", NZ: "뉴질랜드" };
    const preRows = Object.keys(pre).sort().filter(k => k[0] !== "K").map(k => `<tr><td><span class="code">${k}</span></td><td>${esc(PRE_KO[k] || "")}</td><td>${pre[k].map(a => `<a class="ext" href="#apt-${a[0]}">${a[1]}</a>`).join(" · ")}</td></tr>`).join("");
    const kUS = APT.filter(a => a[1][0] === "K");
    return `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / Documents</div><h1>ICAO 기준 안내</h1><p>국제민간항공기구(ICAO)가 정한 분류 가운데 기종과 공항을 읽을 때 자주 만나는 것들입니다. 이 사이트의 기종 21개와 공항 ${APT.length}곳이 각각 어디에 속하는지 함께 보여 줍니다.</p></div><div class="actions"><a class="btn ghost" href="#fleet">${ICON.list}기종 백과</a></div></header>
<div class="grid">
<section class="card c12">${cardH(ICON.info, "ICAO와 부속서")}<div class="card-b prose"><p>ICAO는 1944년 시카고 협약으로 만들어진 유엔 전문 기구입니다. 회원국이 따르는 국제 표준과 권고(SARPs)를 협약의 부속서 19개로 정하고, 세부 절차는 Doc 번호가 붙은 문서로 냅니다. 아래 분류는 부속서 14(비행장), Doc 4444(항공교통관리 절차), Doc 8643(항공기 형식 지정자), Doc 7910(지명 약어)에서 나옵니다.</p><p class="small muted">이 페이지는 이해를 돕기 위한 요약입니다. 실제 운항과 설계에는 각 문서의 최신판과 해당 국가의 규정을 써야 합니다.</p></div></section>

<section class="card c12">${cardH(ICON.ruler, "비행장 기준 코드 (부속서 14)", `<span class="hint">예: 4E, 4F</span>`)}<div class="card-b prose"><p>공항 시설을 어떤 크기의 비행기에 맞춰 지을지 정하는 기준입니다. 숫자와 문자를 붙여 쓰며, 숫자는 비행기가 이륙에 필요한 기준 활주로 길이, 문자는 날개폭으로 정합니다. 유도로 폭, 활주로와 유도로 사이 간격, 주기장 간격이 이 문자에 따라 달라집니다. 2018년 개정 전에는 주 착륙장치 바깥 폭도 문자를 정하는 기준이었습니다.</p></div>
<div class="tbl-wrap"><table class="tbl plain"><thead><tr><th>코드 숫자</th><th>기준 활주로 길이</th><th class="sp-col"></th><th>코드 문자</th><th>날개폭</th><th>이 사이트의 기종</th></tr></thead><tbody>${ICAO_LETTER.map((r, i) => `<tr><td>${i < 4 ? `<span class="code">${i + 1}</span>` : ""}</td><td>${["800 m 미만", "800 m 이상 1,200 m 미만", "1,200 m 이상 1,800 m 미만", "1,800 m 이상", "", ""][i]}</td><td class="sp-col"></td><td><span class="code">${r[0]}</span></td><td>${letterRange(r)}</td><td>${chips(byL(r[0]))}</td></tr>`).join("")}</tbody></table></div>
<div class="card-b prose" style="padding-top:12px"><p>A380은 코드 F의 한계인 80 m 안에 들어가도록 날개폭 79.75 m로 설계됐고, 777X는 날개폭이 71.75 m지만 날개 끝을 접어 지상에서는 코드 E(64.85 m)로 다닙니다. 코드 문자가 한 단계 올라가면 공항이 유도로와 게이트를 고쳐야 하기 때문에, 제작사는 이 경계를 설계 조건으로 삼습니다.</p></div></section>

<section class="card c6">${cardH(ICON.plane, "항적 난기류 등급 (Doc 4444)")}<div class="card-b prose"><p>큰 비행기 뒤에는 날개 끝에서 생기는 강한 소용돌이가 남습니다. 관제사는 앞선 기체의 등급에 따라 뒤따르는 기체와의 간격을 넓힙니다. 등급은 최대이륙중량으로 정하고, 비행계획서에 한 글자로 적습니다.</p></div>
<div class="tbl-wrap"><table class="tbl plain"><thead><tr><th>등급</th><th>기준</th><th>이 사이트의 기종</th></tr></thead><tbody>${[["J", "A380-800 (형식 지정자 문서에서 따로 지정)"], ["H", "136 t 이상"], ["M", "7 t 초과 136 t 미만"], ["L", "7 t 이하"]].map(r => `<tr><td><span class="code">${r[0]}</span> ${WAKE[r[0]].split(" ")[0]}</td><td>${r[1]}</td><td>${chips(byW(r[0]))}</td></tr>`).join("")}</tbody></table></div>
<div class="card-b"><p class="small muted" style="margin:0">보잉 757은 중량으로는 M이지만 항적이 강해, 미국 등 일부 국가는 뒤따르는 기체에 대형기와 같은 간격을 적용합니다.</p></div></section>

<section class="card c6">${cardH(ICON.bell, "구조·소방 등급 (부속서 14)")}<div class="card-b prose"><p>공항이 갖춰야 하는 소방차 수와 소화제 양을 정하는 등급입니다. 그 공항을 정기적으로 쓰는 가장 큰 비행기의 전체 길이로 정하고, 동체 폭이 그 등급의 한계를 넘으면 한 단계 올립니다.</p></div>
<div class="tbl-wrap"><table class="tbl plain"><thead><tr><th>등급</th><th>전체 길이</th><th>동체 폭</th><th>이 사이트의 기종</th></tr></thead><tbody>${RFF.slice(5).map((r, i) => `<tr><td><span class="code">${r[0]}</span></td><td>${RFF[4 + i][1]} m 이상 ${r[1]} m 미만</td><td>${r[2]} m 이하</td><td>${chips(byR(r[0]))}</td></tr>`).join("")}</tbody></table></div>
<div class="card-b"><p class="small muted" style="margin:0">1~5등급(길이 28 m 미만)은 소형기용이라 표에서 뺐습니다. A380은 길이로는 9등급이지만 동체 폭이 7 m를 넘어 10등급입니다.</p></div></section>

<section class="card c12">${cardH(ICON.doc, "코드 읽는 법: ICAO와 IATA")}<div class="card-b prose"><p><b>기종.</b> ICAO 형식 지정자(Doc 8643)는 최대 네 글자로, 비행계획서와 관제 화면에 쓰입니다. 같은 계열이라도 형식마다 다릅니다. 예를 들어 보잉 747-400은 <span class="code">B744</span>, 747-8은 <span class="code">B748</span>, A320neo는 <span class="code">A20N</span>입니다. 항공권과 시간표에는 IATA의 세 글자 코드(744, 74H, 32N)가 쓰입니다.</p><p><b>공항.</b> ICAO 지명 약어(Doc 7910)는 네 글자입니다. 첫 글자는 지역, 둘째 글자는 대체로 국가를 뜻하고 나머지가 공항입니다. 인천은 <span class="code">RKSI</span>로, R(동아시아 일부) + K(대한민국) + SI입니다. 승객이 보는 세 글자 코드 <span class="code">ICN</span>은 IATA 코드입니다. 미국 본토는 K 뒤에 IATA 코드를 그대로 붙입니다${kUS.length ? ` (${kUS.slice(0, 3).map(a => `<a class="ext" href="#apt-${a[0]}">${a[1]}</a>`).join(", ")} 등 ${kUS.length}곳)` : ""}.</p></div>
<div class="tbl-wrap"><table class="tbl plain"><thead><tr><th>앞 두 글자</th><th>지역</th><th>이 사이트의 공항</th></tr></thead><tbody>${preRows}</tbody></table></div></section>

<section class="card c12">${cardH(ICON.route, "쌍발기 장거리 운항: ETOPS와 EDTO (부속서 6)")}<div class="card-b prose"><p>엔진이 두 개인 비행기는 엔진 하나가 꺼졌을 때 갈 수 있는 비상 공항에서 일정 시간 이상 떨어진 항로를 날 수 없습니다. 기본은 60분이고, 기종과 항공사가 따로 승인을 받으면 120분, 180분, 그 이상으로 늘어납니다. 이 승인을 오랫동안 ETOPS라 불렀고, ICAO는 2012년부터 엔진 수와 상관없이 적용하는 EDTO(회항 시간 연장 운항)라는 이름을 씁니다.</p><p>이 규정이 여객기의 역사를 바꿨습니다. 1985년 767이 120분 승인으로 대서양을 건너기 시작했고, 777은 취항 때부터 180분 승인을 받았습니다. 쌍발기가 바다를 자유롭게 건너게 되자 3발기와 4발기는 설 자리를 잃었습니다. <a class="ext" href="#timeline">시대별 개발 배경</a>에서 흐름을 볼 수 있습니다.</p></div></section>
</div>`;
  }
