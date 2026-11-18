  /* ================= 비행 원리 2: 속도의 종류, 무게중심과 안정성, 확인 퀴즈 =================
     learn.js 다음에 읽힌다. LEARN_PAGES, LEARN_TITLES, LEARN_UPD 에 새 쪽을 더하고, 모든 쪽 끝에 퀴즈 카드를 붙인다. */

  /* ---------- 표준 대기(ISA): 고도(ft) → 온도(K), 밀도비 σ, 음속(kt) ---------- */
  function isaAt(ft) {
    const T = ft <= 36089 ? 288.15 - 0.0019812 * ft : 216.65;
    const sig = ft <= 36089 ? Math.pow(T / 288.15, 4.2559) : 0.2971 * Math.exp(-(ft - 36089) / 20806);
    return { T: T, sig: sig, a: 38.967854 * Math.sqrt(T) };
  }

  /* ---------- 속도의 종류 ---------- */
  function renderLearnSpeed() {
    return lrHead("속도의 종류", "조종석에는 속도가 여러 개 있습니다. 날개가 느끼는 속도(IAS), 공기 속을 실제로 지나가는 속도(TAS), 땅 위에서 보는 속도(GS), 소리의 빠르기에 견준 속도(마하)입니다. 고도와 바람을 바꿔 보며 서로 어떻게 달라지는지 확인해 보세요.") + `
<div class="grid lr">
<section class="card c12 lr-stage"><div class="lr-fig"><svg viewBox="0 0 860 340" role="img" aria-label="고도에 따른 속도 비교">${lrSky(860, 340)}
<g id="lr-sp-layers"></g><g id="lr-sp-plane"></g></svg></div>
<div class="lr-side">
<div class="lr-ctl"><label for="lr-sp-h">고도 <b id="lr-sp-h-v">35,000 ft</b></label><input type="range" id="lr-sp-h" min="0" max="41000" step="1000" value="35000"></div>
<div class="lr-ctl"><label for="lr-sp-v">속도계(IAS) <b id="lr-sp-v-v">250 kt</b></label><input type="range" id="lr-sp-v" min="120" max="340" step="5" value="250"></div>
<div class="lr-ctl"><label for="lr-sp-w">바람 <b id="lr-sp-w-v">맞바람 40 kt</b></label><input type="range" id="lr-sp-w" min="-120" max="120" step="10" value="-40"></div>
<div class="lr-spd" id="lr-sp-out"></div></div></section>
<section class="card c7">${cardH(ICON.info, "네 가지 속도")}<div class="card-b lr-prose lr-easy"><p><mark>IAS (지시 대기속도)</mark> 속도계 바늘이 가리키는 값입니다. 날개가 받는 공기의 세기라서 <b>양력과 실속은 IAS로 판단</b>합니다.</p><p><mark class="b">TAS (진대기속도)</mark> 공기 속을 실제로 지나가는 빠르기입니다. 높이 올라 공기가 옅어지면 같은 IAS라도 <b>TAS는 훨씬 빨라집니다</b>.</p><p><mark class="o">GS (대지속도)</mark> 땅에서 본 속도입니다. 맞바람이면 TAS보다 느리고, 뒷바람이면 빠릅니다. <b>도착 시간과 연료</b>는 GS로 계산합니다.</p><p><mark class="r">마하수</mark> TAS를 그 높이의 음속으로 나눈 값입니다. 높은 고도에서는 공기가 차가워 음속이 느려지므로 <b>순항은 마하로 맞춥니다</b>.</p><p class="lr-key">기억할 것: 낮은 고도에서는 IAS, 높은 고도에서는 마하가 한계 속도의 기준입니다.</p></div></section>
<section class="card c5">${cardH(ICON.gauge, "숫자로 보기")}<div class="card-b lr-prose"><ul class="lr-list"><li>해면에서 IAS 250 kt면 TAS도 약 250 kt입니다.</li><li>35,000 ft에서 IAS 250 kt면 TAS는 약 430 kt, 마하 0.75쯤입니다.</li><li>음속은 해면 약 661 kt, 36,000 ft 위에서는 약 573 kt입니다.</li><li>뒷바람 100 kt 제트기류를 타면 같은 TAS로도 한 시간에 100 nm를 더 갑니다.</li></ul></div></section>
<section class="card c12 lr-pilot">${cardH(ICON.plane, "그래서 조종할 때는")}<div class="card-b lr-prose"><ul class="lr-list"><li><b>이륙, 접근, 착륙 속도는 모두 IAS</b>입니다. 높은 공항이나 더운 날에는 같은 IAS라도 TAS가 빨라 활주 거리가 길어집니다.</li><li><b>상승 중 속도 기준이 바뀝니다.</b> 보통 IAS 290~300 kt로 오르다가 약 28,000~31,000 ft에서 마하 0.78~0.80으로 바꿉니다(크로스오버 고도).</li><li><b>높이 갈수록 여유가 줄어듭니다.</b> 실속 속도(IAS)는 그대로지만 최대 마하는 IAS로 보면 점점 낮아져, 둘 사이 간격이 좁아집니다. 무거운데 너무 높이 오르지 않는 이유입니다.</li><li><b>연료 계획은 GS</b>로 합니다. 같은 노선도 계절 제트기류 때문에 서쪽으로 갈 때 한 시간 넘게 더 걸릴 수 있습니다.</li></ul></div></section>
<section class="card c12">${lrNote}</section></div>`;
  }
  function lrSpeed() {
    const hI = $("#lr-sp-h"); if (!hI) return;
    const ft = +hI.value, ias = +$("#lr-sp-v").value, wind = +$("#lr-sp-w").value, A = isaAt(ft);
    const tas = ias / Math.sqrt(A.sig), gs = tas + wind, mach = tas / A.a;
    $("#lr-sp-h-v").textContent = fmt(ft) + " ft"; $("#lr-sp-v-v").textContent = ias + " kt";
    $("#lr-sp-w-v").textContent = wind === 0 ? "바람 없음" : wind < 0 ? `맞바람 ${-wind} kt` : `뒷바람 ${wind} kt`;
    const mx = 700, bar = (k, label, v, unit, cls, note) => `<div class="lr-spd-r ${cls}"><span class="k">${k}</span><span class="t"><i style="width:${Math.max(2, Math.min(100, v / mx * 100)).toFixed(1)}%"></i></span><b>${unit === "M" ? "M " + v.toFixed(2) : Math.round(v) + " kt"}</b><small>${label}${note ? ", " + note : ""}</small></div>`;
    const warn = mach > 0.86 ? "최대 마하를 넘었습니다" : mach > 0.82 ? "최대 마하에 가깝습니다" : "";
    $("#lr-sp-out").innerHTML = bar("IAS", "날개가 느끼는 속도", ias, "kt", "ias") + bar("TAS", "공기 속 실제 속도", tas, "kt", "tas") + bar("GS", "땅 위 속도", Math.max(0, gs), "kt", "gs") + `<div class="lr-spd-r mach${warn ? " warn" : ""}"><span class="k">마하</span><span class="t"><i style="width:${Math.min(100, mach / 1 * 100).toFixed(1)}%"></i><em style="left:82%"></em></span><b>M ${mach.toFixed(2)}</b><small>음속 ${Math.round(A.a)} kt${warn ? ", " + warn : ""}</small></div><p class="lr-spd-n">공기 밀도는 해면의 <b>${Math.round(A.sig * 100)}%</b>, 기온 ${Math.round(A.T - 273.15)}°C</p>`;
    // 그림: 고도 띠와 비행기 위치, 비행기 뒤에 TAS 길이, 앞에 바람 화살표
    const y = 300 - ft / 41000 * 250;
    let L = ""; [0, 10000, 20000, 30000, 40000].forEach(f => { const yy = 300 - f / 41000 * 250; L += `<line x1="60" y1="${N(yy)}" x2="840" y2="${N(yy)}" class="lr-grid-l"/><text x="54" y="${N(yy + 4)}" text-anchor="end" class="lr-lab">${f / 1000}k ft</text>`; });
    L += `<rect x="60" y="${N(300 - 36089 / 41000 * 250)}" width="780" height="${N(36089 / 41000 * 250 - (300 - 300))}" fill="none"/>`;
    $("#lr-sp-layers").innerHTML = L;
    const px = 520, len = tas / 700 * 380, lenG = Math.max(0, gs) / 700 * 380;
    $("#lr-sp-plane").innerHTML = `<line x1="${N(px - len)}" y1="${N(y)}" x2="${px}" y2="${N(y)}" class="lr-sp-tas"/><line x1="${N(px - lenG)}" y1="${N(y + 12)}" x2="${px}" y2="${N(y + 12)}" class="lr-sp-gs"/><text x="${N(px - len)}" y="${N(y - 8)}" class="lr-lab">TAS ${Math.round(tas)} kt</text><text x="${N(px - lenG)}" y="${N(y + 26)}" class="lr-lab">GS ${Math.round(Math.max(0, gs))} kt</text>
<g transform="translate(${px} ${N(y)})"><path class="lr-body" d="M-34 -4 L28 -4 C36 -4 40 0 40 2 C38 5 34 6 28 6 L-30 6 L-40 -10 L-34 -10Z"/><path class="lr-wing" d="M-6 1 L10 1 L-2 12 L-10 12Z"/></g>
${wind ? `<g class="lr-sp-wind" transform="translate(${wind < 0 ? 700 : 300} ${N(y - 30)})"><line x1="0" y1="0" x2="${wind < 0 ? -60 : 60}" y2="0"/><path d="M${wind < 0 ? -60 : 60} 0 l${wind < 0 ? 8 : -8} -5 v10z"/><text x="${wind < 0 ? -30 : 30}" y="-8" text-anchor="middle" class="lr-lab">${wind < 0 ? "맞바람" : "뒷바람"} ${Math.abs(wind)} kt</text></g>` : ""}`;
  }

  /* ---------- 무게중심과 안정성 ---------- */
  function renderLearnCg() {
    return lrHead("무게중심과 안정성", "비행기는 무게중심(CG) 둘레로 기울어집니다. 무게중심이 날개가 미는 점보다 앞에 있으면 기수가 숙여지려 하고, 꼬리날개가 살짝 아래로 눌러 균형을 잡습니다. 무게중심을 앞뒤로 옮겨 보며 안정성과 조종감이 어떻게 바뀌는지 보세요.") + `
<div class="grid lr">
<section class="card c12 lr-stage"><div class="lr-fig"><svg viewBox="0 0 860 340" role="img" aria-label="무게중심 위치와 힘의 균형">${lrSky(860, 340)}<g id="lr-cg-fig"></g></svg></div>
<div class="lr-side">
<div class="lr-ctl"><label for="lr-cg-v">무게중심 위치 <b id="lr-cg-v-v">25% MAC</b></label><input type="range" id="lr-cg-v" min="6" max="44" step="1" value="25"></div>
<div class="lr-cg-band"><i class="bad"></i><i class="ok"></i><i class="bad"></i><span id="lr-cg-mk"></span></div><p class="small muted" style="margin:4px 0 12px">초록 구간이 허용 범위(예시 14~34% MAC)</p>
<div id="lr-cg-out"></div></div></section>
<section class="card c7">${cardH(ICON.info, "앞쪽과 뒤쪽의 차이")}<div class="card-b lr-prose lr-easy"><p>무게중심이 <mark class="b">앞쪽</mark>이면 비행기가 <b>안정적</b>입니다. 흔들려도 스스로 제자리로 돌아오려 합니다. 대신 꼬리날개가 더 세게 눌러야 해서 <b>날개가 더 많은 짐을 들고</b>, 실속 속도와 연료 소모가 조금 늘어납니다.</p><p>무게중심이 <mark class="o">뒤쪽</mark>이면 조종이 <b>가볍고 민감</b>해지고 연료가 조금 줄어듭니다. 하지만 <mark class="r">뒤쪽 한계를 넘으면</mark> 기수가 한번 들리기 시작할 때 꼬리날개로 막지 못할 수 있어 아주 위험합니다.</p><p class="lr-key">기억할 것: 무게중심은 허용 범위 안에만 있으면 됩니다. 앞쪽은 덜 효율적일 뿐이고, 뒤쪽 한계를 넘는 것은 절대 안 됩니다.</p></div></section>
<section class="card c5">${cardH(ICON.weight, "무게중심을 정하는 것")}<div class="card-b lr-prose"><ul class="lr-list"><li>승객 좌석 배치와 화물칸 짐 위치</li><li>연료 탱크별 연료 양 (날개, 중앙, 꼬리 탱크)</li><li>비행 중 연료가 줄면서 조금씩 움직입니다</li><li>MAC = 평균 공력 시위. 날개 앞전에서 몇 % 뒤인지로 위치를 말합니다</li></ul></div></section>
<section class="card c12 lr-pilot">${cardH(ICON.plane, "그래서 조종할 때는")}<div class="card-b lr-prose"><ul class="lr-list"><li><b>출발 전 중량과 무게중심 계산(로드시트)</b>을 확인하고, 이륙 트림을 그 무게중심에 맞춰 넣습니다. 트림이 틀리면 회전할 때 기수가 너무 무겁거나 가볍게 들립니다.</li><li><b>앞쪽 무게중심</b>이면 회전에 힘이 더 듭니다. 서두르지 말고 평소 속도로 기수를 듭니다.</li><li><b>뒤쪽 무게중심</b>이면 기수가 쉽게 들립니다. 이륙 때 꼬리가 활주로에 닿지 않게(테일스트라이크) 회전 속도를 지킵니다.</li><li>시뮬레이터에서 승객과 화물을 앞뒤로 옮겨 같은 이륙을 해 보면 차이를 바로 느낄 수 있습니다.</li></ul></div></section>
<section class="card c12">${lrNote}</section></div>`;
  }
  function lrCg() {
    const c = $("#lr-cg-v"); if (!c) return;
    const cg = +c.value, cp = 30, np = 46, lo = 14, hi = 34, ok = cg >= lo && cg <= hi;
    const sm = np - cg, tail = (cp - cg) * 0.9, load = 100 + Math.max(0, tail), vs = Math.sqrt(load / 100), fuel = (load - 100) * 0.35;
    $("#lr-cg-v-v").textContent = cg + "% MAC";
    $("#lr-cg-mk").style.left = ((cg - 6) / 38 * 100).toFixed(1) + "%";
    const stab = sm > 26 ? ["매우 안정", "흔들려도 빨리 돌아옵니다"] : sm > 15 ? ["안정", "보통 여객기의 느낌"] : sm > 9 ? ["조금 예민", "조종이 가볍습니다"] : ["불안정에 가까움", "작은 입력에도 크게 반응합니다"];
    const row = (k, v, sub, cls) => `<div class="lr-cg-r ${cls || ""}"><span>${k}</span><b>${v}</b><small>${sub}</small></div>`;
    // 경고 칸은 늘 같은 높이로 두고 내용만 바꾼다 (카드 크기가 바뀌지 않게)
    const warn = ok ? `<p class="lr-cg-warn ok">허용 범위 안입니다. ${cg <= 20 ? "앞쪽이라 안정적이지만 회전에 힘이 조금 더 듭니다." : cg >= 30 ? "뒤쪽이라 조종이 가볍습니다. 이륙 회전을 서두르지 마세요." : "가운데쯤이라 균형이 좋습니다."}</p>` : `<p class="lr-cg-warn">${cg < lo ? "앞쪽 한계를 넘었습니다. 회전과 착륙 플레어에 엘리베이터가 모자랄 수 있습니다." : "뒤쪽 한계를 넘었습니다. 기수가 들리면 막기 어렵습니다. 이 상태로는 이륙하지 않습니다."}</p>`;
    $("#lr-cg-out").innerHTML = warn + row("안정성", stab[0], stab[1], sm <= 9 ? "bad" : "") + row("꼬리날개 힘", tail >= 0 ? `아래로 ${Math.round(tail)}` : `위로 ${Math.round(-tail)}`, "무게 100 기준") + row("실속 속도", vs >= 1.0005 ? "+" + ((vs - 1) * 100).toFixed(1) + "%" : "그대로", "날개가 드는 무게만큼") + row("연료", fuel > 0.05 ? "+" + fuel.toFixed(1) + "%" : "거의 그대로", "꼬리날개 항력 때문");

    /* 그림: 기종 백과의 777 측면도(실제 비례)를 그대로 놓고, 날개 평균 시위(MAC) 자와 힘 화살표를 얹는다.
       측면도 좌표는 m, 기수 = 0, 동체 중심선 = 0. 화면 x = 90 + 배율 × m */
    const ac = byId["boeing-777"], G = wingGeom(ac), sv = sideView(ac), L = G.L, sc = 600 / L, ox = 120, cy = 128;
    const macLE = G.xr + G.cr * 0.2, mac = G.cr * 0.62, X = q => ox + sc * (macLE + mac * q / 100), tailX = ox + sc * (L - G.cr * 0.35);
    const gY = cy + sc * G.ground, tl = Math.min(56, Math.abs(tail) * 3 + 14), lift = 62, RY = 292, R = q => 300 + 3.8 * q;
    const fig = `<g class="lr-cg-plane" style="transform:rotate(${ok ? 0 : (cg < lo ? -2.5 : 3.5)}deg)"><g class="ac-svg lr-kal mk-boeing" transform="translate(${ox} ${cy}) scale(${sc})">${LR_JET_DEFS}${sv.svg}</g>
<line x1="${X(cg)}" y1="${cy - sc * G.h * 0.5}" x2="${X(cg)}" y2="${cy + sc * G.h * 0.5}" class="lr-cg-plumb"/></g>
<line x1="60" y1="${gY + 1}" x2="800" y2="${gY + 1}" class="lr-cg-ground"/>
<g class="lr-arw up"><line x1="${X(cp)}" y1="${cy - sc * G.h * 0.5 - 6}" x2="${X(cp)}" y2="${cy - sc * G.h * 0.5 - 6 - lift}"/></g><text class="lr-lab low" x="${X(cp) + 8}" y="${cy - sc * G.h * 0.5 - lift + 6}">양력 (날개가 미는 점, ${cp}%)</text>
<g transform="translate(${X(cg)} ${cy})"><circle r="9" fill="#fff" stroke="#111" stroke-width="2"/><path d="M0 -9 A9 9 0 0 1 9 0 L0 0Z M0 9 A9 9 0 0 1 -9 0 L0 0Z" fill="#111"/></g>
<g class="lr-arw down"><line x1="${X(cg)}" y1="${cy + 12}" x2="${X(cg)}" y2="${gY + 18}"/></g><text class="lr-lab high" x="${X(cg) + 10}" y="${gY + 14}">무게 (무게중심)</text>
<path d="M${X(0)} ${cy + 4} L${R(0)} ${RY - 8} M${X(100)} ${cy + 4} L${R(100)} ${RY - 8}" class="lr-cg-zoom"/><rect x="${X(0)}" y="${cy + 1}" width="${X(100) - X(0)}" height="6" rx="2" class="lr-cg-macbar"/>
<g class="lr-cg-mac" transform="translate(0 ${RY})"><rect x="${R(0)}" y="-8" width="${R(100) - R(0)}" height="16" rx="8" class="bg"/><rect x="${R(lo)}" y="-8" width="${R(hi) - R(lo)}" height="16" rx="8" class="ok"/>
${[0, 25, 50, 75, 100].map(q => `<line x1="${R(q)}" y1="-12" x2="${R(q)}" y2="12" class="tick"/><text x="${R(q)}" y="28" text-anchor="middle" class="lr-lab small">${q}%</text>`).join("")}
<line x1="${R(cp)}" y1="-14" x2="${R(cp)}" y2="14" class="cpmk"/><text x="${R(cp)}" y="-18" text-anchor="middle" class="lr-lab low small">양력 30%</text>
<g transform="translate(${R(cg)} 0)"><circle r="9" fill="#fff" stroke="#111" stroke-width="2"/><path d="M0 -9 A9 9 0 0 1 9 0 L0 0Z M0 9 A9 9 0 0 1 -9 0 L0 0Z" fill="#111"/></g>
<text x="${R(0) - 14}" y="5" text-anchor="end" class="lr-lab small">날개 평균 시위 (MAC) 확대</text><text x="${R(100) + 14}" y="5" class="lr-lab small">${ok ? "허용 범위 안" : "범위 밖"}</text></g>`;
    $("#lr-cg-fig").innerHTML = fig;
  }
  /* ---------- 확인 퀴즈: 쪽마다 세 문제. 고르면 바로 맞고 틀림과 이유를 보여 주고, 맞힌 수를 이 브라우저에 남긴다 ---------- */
  const LR_QUIZ = {
    "learn-forces": [["순항 중 고도와 속도가 그대로라면 네 힘은?", ["양력이 무게보다 크다", "양력과 무게, 추력과 항력이 각각 같다", "추력이 항력보다 훨씬 크다", "네 힘이 모두 0이다"], 1, "등속 수평 비행은 힘이 서로 맞서 균형을 이룬 상태입니다."], ["추력만 올리고 기수 각도를 그대로 두면 보통 어떻게 될까?", ["속도가 늘고 결국 상승한다", "바로 강하한다", "아무 변화가 없다", "실속한다"], 0, "빨라지면 양력도 커져서 비행기가 오르기 시작합니다."], ["오르내림을 주로 다루는 것은?", ["추력", "기수 각도(자세)", "러더", "스포일러"], 1, "자세로 오르내림을, 추력으로 에너지(속도)를 다룹니다. 둘은 함께 움직입니다."]],
    "learn-lift": [["양력을 키우는 방법이 아닌 것은?", ["속도를 높인다", "받음각을 키운다", "공기가 더 옅은 높은 곳으로 간다", "플랩을 편다"], 2, "공기가 옅으면 같은 속도에서 양력이 줄어듭니다."], ["날개 윗면 압력은?", ["아랫면보다 낮다", "아랫면보다 높다", "아랫면과 같다", "항상 대기압과 같다"], 0, "윗면이 낮고 아랫면이 조금 높아 그 차이가 날개를 듭니다."], ["양력과 실속을 판단하는 속도는?", ["GS", "TAS", "IAS", "마하"], 2, "IAS는 날개가 받는 공기 압력이라 양력과 바로 이어집니다."]],
    "learn-stall": [["실속의 직접적인 원인은?", ["속도가 느려서", "받음각이 임계값을 넘어서", "엔진이 멈춰서", "고도가 높아서"], 1, "실속은 받음각 문제입니다. 느릴 때는 큰 받음각이 필요해 가까워질 뿐입니다."], ["실속 경고가 울리면 가장 먼저?", ["기수를 든다", "기수를 숙여 받음각을 줄인다", "플랩을 접는다", "러더를 크게 쓴다"], 1, "받음각을 줄이는 것이 먼저입니다. 추력과 날개 수평은 그다음입니다."], ["60도 경사 선회에서 실속 속도는?", ["그대로", "약 41% 늘어난다", "절반이 된다", "두 배가 된다"], 1, "하중계수 2g, 실속 속도는 √2배(약 1.41배)가 됩니다."]],
    "learn-winglet": [["유도항력이 가장 큰 때는?", ["고속 순항", "무겁고 느린 이륙과 상승", "하강 중 아이들", "지상 활주"], 1, "양력을 많이 만들고 느릴수록 유도항력이 커집니다."], ["윙렛이 주로 하는 일은?", ["양력을 두 배로", "날개 끝 소용돌이를 줄여 유도항력을 낮춘다", "착륙 속도를 높인다", "날개를 가볍게"], 1, "날개 끝에서 공기가 돌아 나가는 것을 막아 손실을 줄입니다."], ["큰 비행기 뒤에서 간격을 띄우는 이유는?", ["소음", "후류(날개 끝 소용돌이)", "연료 냄새", "레이더 간섭"], 1, "큰 비행기의 소용돌이는 몇 분 동안 남아 뒤 비행기를 흔듭니다."]],
    "learn-sweep": [["날개를 뒤로 젖히는 주된 이유는?", ["보기 좋아서", "고속에서 충격파와 항력 증가를 늦추려고", "착륙을 쉽게", "연료 탱크를 넓히려고"], 1, "날개가 느끼는 속도 성분을 줄여 높은 마하에서도 날 수 있게 합니다."], ["높은 고도에서 순항 속도의 기준은?", ["IAS", "GS", "마하수", "VS"], 2, "공기가 차가워 음속이 느려지므로 마하로 한계를 봅니다."], ["후퇴익의 단점은?", ["느린 속도에서 양력이 약하다", "고속에서 항력이 크다", "무게가 줄어든다", "없다"], 0, "그래서 이착륙에는 플랩과 슬랫이 꼭 필요합니다."]],
    "learn-highlift": [["착륙 때 플랩을 많이 펴는 이유는?", ["더 빨리 가려고", "느린 속도에서 양력을 키우고 항력으로 감속하려고", "연료를 아끼려고", "소음을 줄이려고"], 1, "양력과 항력을 함께 키워 느리고 가파르게 내려올 수 있습니다."], ["슬랫의 역할은?", ["큰 받음각에서도 흐름이 떨어지지 않게", "추력을 늘린다", "방향을 바꾼다", "바퀴를 내린다"], 0, "날개 앞에 틈을 만들어 윗면 흐름을 붙잡아 둡니다."], ["플랩마다 정해진 것은?", ["최소 고도", "넘으면 안 되는 최대 속도", "연료량", "승객 수"], 1, "플랩 구조를 보호하려고 단계마다 최대 속도가 있습니다."]],
    "learn-control": [["롤(좌우 기울기)을 만드는 조종면은?", ["엘리베이터", "에일러론", "러더", "플랩"], 1, "양쪽 에일러론이 반대로 움직여 기울입니다."], ["선회 중 고도가 떨어지려 할 때?", ["살짝 당긴다", "추력을 끈다", "러더만 쓴다", "플랩을 접는다"], 0, "기울면 양력이 옆으로 쏠리므로 조금 당겨 수직 성분을 채웁니다."], ["엔진 하나가 멈추면 쏠림을 막는 것은?", ["에일러론만", "러더", "스포일러", "트림 없음"], 1, "멈춘 엔진 쪽으로 기수가 돌려는 것을 러더로 잡습니다."]],
    "learn-speed": [["35,000 ft에서 IAS 250 kt일 때 TAS는?", ["약 250 kt", "약 430 kt", "약 150 kt", "약 600 kt"], 1, "공기가 옅어 같은 IAS라도 실제 속도는 훨씬 빠릅니다."], ["도착 시간 계산에 쓰는 속도는?", ["IAS", "TAS", "GS", "마하"], 2, "땅 위를 얼마나 빨리 가는지가 시간과 연료를 정합니다."], ["상승 중 IAS 기준에서 마하 기준으로 바꾸는 높이를 무엇이라 할까?", ["전이 고도", "크로스오버 고도", "결심 고도", "순항 고도"], 1, "보통 28,000~31,000 ft 근처에서 바뀝니다."]],
    "learn-cg": [["무게중심이 앞쪽일 때 맞는 것은?", ["더 불안정하다", "더 안정적이지만 연료가 조금 더 든다", "실속 속도가 낮아진다", "아무 차이 없다"], 1, "꼬리날개가 더 눌러야 해서 날개 짐이 늘어납니다."], ["가장 위험한 경우는?", ["앞쪽 한계 바로 안", "가운데", "뒤쪽 한계를 넘었을 때", "연료가 가득일 때"], 2, "뒤쪽 한계를 넘으면 기수가 들릴 때 막지 못할 수 있습니다."], ["이륙 전에 무게중심에 맞춰 넣는 것은?", ["이륙 트림", "착륙등", "트랜스폰더", "산소"], 0, "트림이 맞아야 회전할 때 기수가 알맞게 들립니다."]]
  };
  let lrQz = {}; try { lrQz = JSON.parse(localStorage.getItem("hub-lr-quiz") || "{}"); } catch (e) { lrQz = {}; }
  function lrQuizHtml(k) {
    const Q = LR_QUIZ[k]; if (!Q) return "";
    const best = lrQz[k];
    return `<section class="card c12 lr-quiz" data-qz="${k}">${cardH(ICON.check, "확인 퀴즈", `<span class="hint" id="lr-qz-score">${best != null ? `지난번 ${best} / ${Q.length}` : `${Q.length}문제`}</span>`)}<div class="card-b"><ol class="lr-qz">${Q.map((q, i) => `<li data-i="${i}"><p class="lr-qz-q">${q[0]}</p><div class="lr-qz-c">${q[1].map((c, j) => `<button type="button" data-qa="${i}:${j}">${c}</button>`).join("")}</div><p class="lr-qz-x" hidden></p></li>`).join("")}</ol><div class="lr-qz-end" hidden><b id="lr-qz-res"></b><button type="button" class="btn ghost" data-qr="1">다시 풀기</button></div></div></section>`;
  }
  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-qa]"), r = e.target.closest && e.target.closest("[data-qr]");
    const box = (b || r) && (b || r).closest(".lr-quiz"); if (!box) return;
    const k = box.getAttribute("data-qz"), Q = LR_QUIZ[k];
    if (r) { box.outerHTML = lrQuizHtml(k); return; }
    const [i, j] = b.getAttribute("data-qa").split(":").map(Number), li = b.closest("li"); if (li.classList.contains("done")) return;
    li.classList.add("done"); const right = Q[i][2] === j;
    li.querySelectorAll("button").forEach((x, n) => { x.disabled = true; if (n === Q[i][2]) x.classList.add("right"); });
    if (!right) b.classList.add("wrong"); li.classList.add(right ? "ok" : "no");
    const x = li.querySelector(".lr-qz-x"); x.hidden = false; x.innerHTML = `<b>${right ? "맞았어요." : "아쉬워요."}</b> ${Q[i][3]}`;
    const all = box.querySelectorAll(".lr-qz > li"), done = box.querySelectorAll(".lr-qz > li.done");
    if (done.length === all.length) { const n = box.querySelectorAll(".lr-qz > li.ok").length; lrQz[k] = Math.max(lrQz[k] || 0, n); try { localStorage.setItem("hub-lr-quiz", JSON.stringify(lrQz)); } catch (er) { /* 무시 */ } const end = box.querySelector(".lr-qz-end"); end.hidden = false; $("#lr-qz-res").textContent = `${Q.length}문제 중 ${n}문제 맞힘${n === Q.length ? ", 완벽해요" : ""}`; const sc = box.querySelector("#lr-qz-score"); if (sc) sc.textContent = `최고 ${lrQz[k]} / ${Q.length}`; }
  });

  /* ---------- 등록: 새 쪽 두 개, 모든 쪽 끝에 퀴즈 ---------- */
  LEARN_PAGES["learn-speed"] = renderLearnSpeed; LEARN_PAGES["learn-cg"] = renderLearnCg;
  LEARN_TITLES["learn-speed"] = "속도의 종류"; LEARN_TITLES["learn-cg"] = "무게중심과 안정성";
  LEARN_UPD["learn-speed"] = lrSpeed; LEARN_UPD["learn-cg"] = lrCg;
  Object.keys(LEARN_PAGES).forEach(k => { const f = LEARN_PAGES[k]; LEARN_PAGES[k] = () => { const html = f(), end = html.lastIndexOf('<section class="card c12"><p class="lr-note">'); return end > 0 ? html.slice(0, end) + lrQuizHtml(k) + html.slice(end) : html.replace(/<\/div>\s*$/, lrQuizHtml(k) + "</div>"); }; });

  /* ---------- 플랩과 슬랫: 날개 어디에 달려 있나 (위에서 본 그림) ---------- */
  const LR_WHERE = () => { const mk = (x, y, n, c) => `<g class="mk"><circle cx="${x}" cy="${y}" r="11" fill="${c}"/><text x="${x}" y="${y + 4}" text-anchor="middle">${n}</text></g>`;
    return `<section class="card c12">${cardH(ICON.wing, "슬랫과 플랩은 날개 어디에 있나", `<span class="hint">위에서 본 오른쪽 날개, 대략적인 배치</span>`)}<div class="card-b lr-where-b"><svg class="lr-where" viewBox="0 0 520 210" role="img" aria-label="위에서 본 날개에서 슬랫, 플랩, 에일러론, 스포일러 위치">
<rect x="8" y="22" width="40" height="170" rx="20" class="fus"/>
<path d="M48 40 L470 150 L484 156 L484 166 L340 166 L190 132 L48 132 Z" class="wing"/>
<path d="M52 40 L468 148 L465 154 L50 47 Z" class="slat"/>
<path d="M50 132 L188 132 L188 140 L50 140 Z M192 133 L320 162 L320 170 L192 141 Z" class="flap"/>
<path d="M324 162 L410 166 L410 173 L324 170 Z" class="ail"/>
<path d="M86 122 L180 122 L180 128 L86 128 Z M198 126 L300 150 L300 156 L198 132 Z" class="spl"/>
<path d="M500 30 v44" class="arr"/><path d="M500 80 l-5 -9 h10z" class="arrh"/><text x="492" y="26" text-anchor="end" class="lab">공기</text>
${mk(260, 92, 1, "#2563eb")}${mk(120, 156, 2, "#2563eb")}${mk(256, 176, 3, "#2563eb")}${mk(372, 188, 4, "#64748b")}${mk(150, 110, 5, "#d97706")}
</svg><ol class="lr-where-l">
<li><i style="background:#3b82f6"></i><b>슬랫</b><span>날개 앞쪽 끝 전체. 앞아래로 미끄러져 나옵니다.</span></li>
<li><i style="background:#3b82f6"></i><b>안쪽 플랩</b><span>날개 뒤쪽 끝, 동체에 가까운 쪽.</span></li>
<li><i style="background:#3b82f6"></i><b>바깥쪽 플랩</b><span>안쪽 플랩 바로 바깥. 함께 뒤아래로 나옵니다.</span></li>
<li><i style="background:#94a3b8"></i><b>에일러론</b><span>날개 끝 쪽 뒤쪽 끝. 좌우로 기울일 때 씁니다.</span></li>
<li><i style="background:#f59e0b"></i><b>스포일러</b><span>날개 윗면. 위로 세워 양력을 줄입니다.</span></li>
</ol></div></section>`; };
  // '어디에 있나'와 '단면으로 보기'를 한 줄에 나란히
  { const f = LEARN_PAGES["learn-highlift"]; LEARN_PAGES["learn-highlift"] = () => { let h = f(); const sa = h.indexOf('<section class="card c12 lr-sec2">'); let sec = ""; if (sa >= 0) { const sb = h.indexOf("</section>", sa) + "</section>".length; sec = h.slice(sa, sb).replace('class="card c12 lr-sec2"', 'class="card lr-sec2"'); h = h.slice(0, sa) + h.slice(sb); }
    const i = h.indexOf("</section>", h.indexOf("lr-stage")) + "</section>".length; return i > 20 ? h.slice(0, i) + `<div class="c12 lr-wrow">${LR_WHERE().replace('class="card c12"', 'class="card"')}${sec}</div>` + h.slice(i) : h; }; }
