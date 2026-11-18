  /* ================= 비행 원리 (학습 자료) =================
     자료 > 비행 원리 묶음. 탭마다 움직이는 그림 하나와 직접 만져 보는 막대, 설명, 실제 기종 예가 있다.
     그림은 모두 SVG로 직접 그리고, 흐름선과 소용돌이는 CSS 애니메이션으로 움직인다.
     수치는 이해를 돕는 대략적인 모형이다. 비행이나 설계에 쓰는 값이 아니다. */
  const LR_TOR = Math.PI / 180;
  // NACA 2412 날개 단면 (최대 캠버 2%, 위치 40%, 두께 12%). 시위 길이 c 픽셀, 앞전이 (0,0)
  function lrAirfoil(c) {
    const m = 0.02, p = 0.4, t = 0.12, up = [], lo = [];
    for (let i = 0; i <= 40; i++) {
      const b = i / 40, x = (1 - Math.cos(b * Math.PI)) / 2;
      const yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1015 * x ** 4);
      const yc = x < p ? m / (p * p) * (2 * p * x - x * x) : m / ((1 - p) ** 2) * ((1 - 2 * p) + 2 * p * x - x * x);
      up.push([x * c, -(yc + yt) * c]); lo.push([x * c, -(yc - yt) * c]);
    }
    return "M" + up.map(q => N(q[0]) + " " + N(q[1])).join(" L") + " L" + lo.reverse().map(q => N(q[0]) + " " + N(q[1])).join(" L") + " Z";
  }
  // 흐름선: 날개 윗면과 아랫면 모양을 따라 휘어 지나가고, 날개 뒤에서는 아래로 빠진다(내리흐름).
  // 날개와 겹치지 않게 윗선은 윗면보다 늘 위, 아랫선은 아랫면보다 늘 아래에 둔다.
  // f = {tx, ty, c, a(받음각, 도), down(내리흐름 기울기), sep(실속 정도 0~1)}
  function lrFoilPts(c) {
    const m = 0.02, p = 0.4, t = 0.12, up = [], lo = [];
    for (let i = 0; i <= 40; i++) { const b = i / 40, x = (1 - Math.cos(b * Math.PI)) / 2, yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1015 * x ** 4), yc = x < p ? m / (p * p) * (2 * p * x - x * x) : m / ((1 - p) ** 2) * ((1 - 2 * p) + 2 * p * x - x * x); up.push([x * c, -(yc + yt) * c]); lo.push([x * c, -(yc - yt) * c]); }
    return { up: up, lo: lo };
  }
  function lrFlows(f, ys, cls) {
    const P = lrFoilPts(f.c), ca = Math.cos(f.a * LR_TOR), sa = Math.sin(f.a * LR_TOR), W = q => [f.tx + q[0] * ca - q[1] * sa, f.ty + q[0] * sa + q[1] * ca];
    const U = P.up.map(W).sort((a, b) => a[0] - b[0]), L = P.lo.map(W).sort((a, b) => a[0] - b[0]);
    const le = W([0, 0]), te = W([f.c, 0]), lx = Math.min(U[0][0], L[0][0]), rx = Math.max(U[U.length - 1][0], L[L.length - 1][0]);
    const at = (S, x) => { for (let i = 1; i < S.length; i++) if (S[i][0] >= x) { const k = (x - S[i - 1][0]) / ((S[i][0] - S[i - 1][0]) || 1); return S[i - 1][1] + (S[i][1] - S[i - 1][1]) * k; } return S[S.length - 1][1]; };
    const top = Math.min(...U.map(q => q[1])), sepX = lx + (rx - lx) * 0.3, sepY = at(U, sepX);
    return ys.map((y0, n) => {
      const upper = y0 < le[1], dist = Math.abs(y0 - (upper ? top : Math.max(...L.map(q => q[1])))), w = Math.exp(-dist / 70), gap = 7 + dist * 0.35;
      const xs = [], yv = [];
      for (let x = -40; x <= 900; x += 8) {
        let y = y0;
        if (x < lx) { const k = Math.exp(-(lx - x) / 110); y = y0 + w * k * ((upper ? top : le[1]) - (upper ? le[1] : le[1])) * 0.6 + (upper ? -1 : 1) * w * k * 4; }
        else if (x <= rx) {
          let S = upper ? at(U, x) : at(L, x);
          if (upper && f.sep && x > sepX) S = sepY - f.sep * (x - sepX) * 0.18; // 실속: 윗면에서 떨어져 나간다
          y = upper ? Math.min(y0 + w * (S - le[1]) * 0.9, S - gap) : Math.max(y0 + w * (S - le[1]) * 0.9, S + gap);
        } else {
          const S0 = upper ? (f.sep ? sepY - f.sep * (rx - sepX) * 0.18 : at(U, rx)) : at(L, rx), y1 = upper ? Math.min(y0 + w * (S0 - le[1]) * 0.9, S0 - gap) : Math.max(y0 + w * (S0 - le[1]) * 0.9, S0 + gap);
          const dx = x - rx, settle = 1 - Math.exp(-dx / 160);
          y = y1 + (y0 - y1) * settle * 0.35 + dx * f.down * (0.55 + w * 0.45) * (f.sep && upper ? 0.3 : 1);
        }
        xs.push(x); yv.push(y);
      }
      // 날개 앞에서는 원래 높이에서 서서히 다가가게 하고, 전체를 몇 번 고르게 다듬는다 (꺾임 없애기)
      const iL = xs.findIndex(x => x >= lx); if (iL > 0) { const yL = yv[iL]; for (let i = 0; i < iL; i++) yv[i] = y0 + (yL - y0) * Math.exp(-(xs[iL] - xs[i]) / 90); }
      const fixed = yv.map((_, i) => xs[i] >= lx && xs[i] <= rx);
      for (let pass = 0; pass < 4; pass++) for (let i = 1; i < yv.length - 1; i++) { const v = (yv[i - 1] + yv[i] * 2 + yv[i + 1]) / 4; yv[i] = fixed[i] ? (upper ? Math.min(v, yv[i] + 0) : Math.max(v, yv[i])) : v; }
      const d = xs.map((x, i) => (i ? "L" : "M") + x + " " + N(yv[i])).join("");
      const sp = upper ? (1.0 + n * 0.12) : (1.9 + n * 0.1);
      return `<path class="lr-flow ${upper ? "fast" : "slow"}${f.sep && upper && n >= ys.filter(v => v < le[1]).length - 2 ? " sep" : ""} ${cls || ""}" style="animation-duration:${sp.toFixed(2)}s" d="${d}"/>`;
    }).join("");
  }
  // 대략적인 양력계수 곡선: 실속 전에는 받음각에 비례, 약 15도를 넘으면 떨어진다
  const lrCL = a => a <= 15 ? 0.2 + 0.095 * a : Math.max(0.75, 1.625 - 0.09 * Math.pow(a - 15, 1.3));
  // 국제표준대기 공기 밀도 (kg/m³)
  const lrRho = h => h <= 11000 ? 1.225 * Math.pow(1 - 2.25577e-5 * h, 4.25588) : 0.36392 * Math.exp(-(h - 11000) / 6341.6);
  const lrRange = (id, label, min, max, step, val, unit) => `<div class="lr-ctl"><label for="${id}">${label} <b id="${id}-v">${val}${unit}</b></label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"></div>`;
  const lrHead = (title, text) => `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / 비행 원리</div><h1>${title}</h1><p>${text}</p></div></header>`;
  const lrCard = (cls, icon, title, body) => `<section class="card ${cls}">${cardH(ICON[icon], title)}<div class="card-b lr-prose">${body}</div></section>`;
  const lrNote = `<p class="lr-note">그림과 수치는 원리를 보여 주기 위한 대략적인 모형입니다. 실제 비행이나 설계에 쓰는 값이 아닙니다.</p>`;
  // 실제 기종 사진 카드 (사이트에 이미 있는 사진과 출처를 그대로 쓴다)
  const lrPlanes = (list) => `<div class="lr-planes">${list.map(x => { const ac = byId[x[0]]; if (!ac) return ""; const p = photoOf(ac); return `<a class="lr-pl mk-${ac.maker}" href="#${ac.id}">${p ? `<span class="lr-pl-img">${pimg(p, true, ac.name)}</span>` : ""}<b>${esc(ac.name)}</b><span>${x[1]}</span></a>`; }).join("")}</div>`;
  // 배경: 교과서 그림처럼 옅은 모눈. 작은 칸 20, 큰 칸 100
  const lrSky = (w, h) => `<defs><pattern id="lrG1" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" class="lr-g1"/></pattern><pattern id="lrG2" width="100" height="100" patternUnits="userSpaceOnUse"><rect width="100" height="100" fill="url(#lrG1)"/><path d="M100 0H0V100" fill="none" class="lr-g2"/></pattern><marker id="lrAh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs><rect width="${w}" height="${h}" class="lr-paper"/><rect width="${w}" height="${h}" fill="url(#lrG2)"/>`;
  // 과학 그래프: 축, 눈금, 여러 선, 표시점. 모든 페이지가 같은 모양을 쓴다
  function lrChart(o) {
    const W = o.w || 520, H = o.h || 240, m = { l: 48, r: 14, t: 14, b: 38 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    const X = v => m.l + (v - o.x[0]) / (o.x[1] - o.x[0]) * iw, Y = v => m.t + ih - (v - o.y[0]) / (o.y[1] - o.y[0]) * ih;
    let g = `<rect x="${m.l}" y="${m.t}" width="${iw}" height="${ih}" class="lr-cbg"/>`;
    (o.x[3] || []).forEach(t => { g += `<line x1="${N(X(t))}" y1="${m.t}" x2="${N(X(t))}" y2="${m.t + ih}" class="lr-cgrid"/><text x="${N(X(t))}" y="${m.t + ih + 15}" text-anchor="middle" class="lr-ctick">${t}</text>`; });
    (o.y[3] || []).forEach(t => { g += `<line x1="${m.l}" y1="${N(Y(t))}" x2="${m.l + iw}" y2="${N(Y(t))}" class="lr-cgrid"/><text x="${m.l - 6}" y="${N(Y(t) + 3.5)}" text-anchor="end" class="lr-ctick">${t}</text>`; });
    g += `<text x="${m.l + iw / 2}" y="${H - 4}" text-anchor="middle" class="lr-caxl">${o.x[2]}</text><text transform="translate(12 ${m.t + ih / 2}) rotate(-90)" text-anchor="middle" class="lr-caxl">${o.y[2]}</text>`;
    (o.vlines || []).forEach(v => { g += `<line x1="${N(X(v.x))}" y1="${m.t}" x2="${N(X(v.x))}" y2="${m.t + ih}" class="lr-cv-line ${v.cls || ""}"/>${v.label ? `<text x="${N(X(v.x) + 4)}" y="${m.t + 12}" class="lr-ctick ${v.cls || ""}">${v.label}</text>` : ""}`; });
    (o.series || []).forEach(sr => { const pts = sr.d.filter(p => p[1] >= o.y[0] - 1e9); if (pts.length < 2) return; g += `<path class="lr-cs-line ${sr.cls || ""}" d="${pts.map((p, i) => (i ? "L" : "M") + N(X(p[0])) + " " + N(Math.max(m.t - 4, Math.min(m.t + ih + 4, Y(p[1]))))).join("")}"/>`; if (sr.label) { const p = pts[sr.at != null ? sr.at : pts.length - 1]; g += `<text x="${N(X(p[0]) + 4)}" y="${N(Y(p[1]) - 5)}" class="lr-clab ${sr.cls || ""}">${sr.label}</text>`; } });
    (o.marks || []).forEach(k => { g += `<circle cx="${N(X(k.x))}" cy="${N(Y(k.y))}" r="5" class="lr-cmark ${k.cls || ""}"/>${k.label ? `<text x="${N(X(k.x) + 8)}" y="${N(Y(k.y) - 7)}" class="lr-clab">${k.label}</text>` : ""}`; });
    return `<svg class="lr-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.aria || "그래프"}"><defs><clipPath id="lrClip${o.id || ""}"><rect x="${m.l}" y="${m.t}" width="${iw}" height="${ih}"/></clipPath></defs>${g}</svg>`;
  }
  const lrChartCard = (cls, title, id, cap) => `<section class="card ${cls}">${cardH(ICON.chart, title)}<div class="card-b"><div id="${id}"></div>${cap ? `<p class="lr-cap">${cap}</p>` : ""}</div></section>`;
  // 위에서 본 여객기 실루엣 (오른쪽을 향함)
  /* 비행 원리 그림의 여객기: 기종 백과의 측면도(실제 치수 비례)를 그대로 쓴다. 도색은 하늘색 윗면, 은색 아랫면.
     실제 항공사 이름과 로고는 넣지 않는다 (저장소 규칙). faceRight면 기수가 오른쪽 */
  const LR_JET_DEFS = `<defs><linearGradient id="lrKalG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0f0"/><stop offset=".5" stop-color="#79c3ea"/><stop offset=".5" stop-color="#2a5d9c"/><stop offset=".545" stop-color="#2a5d9c"/><stop offset=".545" stop-color="#e3e7ec"/><stop offset="1" stop-color="#c9d0d9"/></linearGradient></defs>`;
  function lrJet(id, width, faceRight) {
    const ac = byId[id] || byId["boeing-777"], sv = sideView(ac), L = ac.specs.length, s = width / L;
    return `<g class="ac-svg lr-kal mk-${ac.maker}" transform="translate(${faceRight ? width / 2 : -width / 2} 0) scale(${faceRight ? -s : s} ${s})">${LR_JET_DEFS}${sv.svg}</g>`;
  }
  const lrPlaneSide = lrJet("boeing-777", 230, true);

  /* ---------- 1. 네 가지 힘 ---------- */
  function renderLearnForces() {
    return lrHead("네 가지 힘", "날고 있는 여객기에는 늘 네 힘이 함께 작용합니다. 위로 드는 양력, 아래로 당기는 무게, 앞으로 미는 추력, 뒤로 잡아끄는 항력입니다. 두 쌍이 어떻게 맞서는지에 따라 빨라지거나 느려지고, 오르거나 내려갑니다.") + `
<div class="grid lr">
<section class="card c12 lr-stage"><div class="lr-fig"><svg id="lr-f-svg" viewBox="0 0 860 340" role="img" aria-label="여객기에 작용하는 네 가지 힘">${lrSky(860, 340)}
<g id="lr-f-plane" transform="translate(430 170)">${lrPlaneSide}
<g class="lr-arw lift"><line id="lr-f-l" x1="0" y1="-14" x2="0" y2="-110"/><text id="lr-f-lt" x="10" y="-100">양력</text></g>
<g class="lr-arw weight"><line id="lr-f-w" x1="0" y1="12" x2="0" y2="110"/><text x="10" y="104">무게</text></g>
<g class="lr-arw thrust"><line id="lr-f-t" x1="115" y1="0" x2="220" y2="0"/><text id="lr-f-tt" x="150" y="-10">추력</text></g>
<g class="lr-arw drag"><line id="lr-f-d" x1="-98" y1="0" x2="-200" y2="0"/><text id="lr-f-dt" x="-190" y="-10">항력</text></g></g></svg></div>
<div class="lr-side">${lrRange("lr-f-thr", "추력", 0, 100, 1, 62, "%")}${lrRange("lr-f-aoa", "기수 들기 (받음각)", 0, 10, 0.5, 3, "°")}<div class="lr-state" id="lr-f-state"></div><p class="small muted">막대를 움직이면 화살표 길이와 비행기 움직임이 바뀝니다. 화살표 길이는 크기를 비교하기 위한 것입니다.</p></div></section>
${lrCard("c7", "info", "두 쌍의 힘", `<p><b>양력과 무게.</b> 양력은 날개가 공기를 아래로 밀어 내리면서 생기는 반작용입니다. 양력이 무게보다 크면 오르고, 작으면 내려갑니다. 순항 중 고도를 지키고 있다면 두 힘은 거의 같습니다.</p><p><b>추력과 항력.</b> 엔진이 공기를 뒤로 세게 내보내면 그 반작용으로 기체가 앞으로 밀립니다. 항력은 공기가 기체를 붙잡는 힘이라 속도가 빠를수록 커집니다. 추력이 항력보다 크면 빨라지고, 같아지면 그 속도로 계속 납니다.</p><p><b>속도와 양력은 붙어 있습니다.</b> 빨라지면 양력도 커지기 때문에, 조종사는 속도를 바꿀 때 기수 각도도 함께 맞춥니다.</p>`)}
${lrChartCard("c12", "필요 추력 곡선: 속도에 따른 항력", "lr-f-chart", "항력은 두 가지가 더해진 것입니다. 공기 마찰과 모양 때문에 생기는 유해항력은 속도의 제곱에 비례해 커지고, 양력을 만들며 생기는 유도항력은 속도의 제곱에 반비례해 줄어듭니다. 둘의 합이 가장 작은 속도(최소 항력 속도)에서 같은 무게를 가장 적은 추력으로 들 수 있습니다. 점은 지금 추력으로 낼 수 있는 속도입니다.")}
${lrCard("c5", "gauge", "숫자로 보면", `<div class="lr-facts"><div><b>약 79 t</b><span>737-800 최대 이륙 중량. 이륙할 때 날개가 이만큼을 들어 올립니다.</span></div><div><b>약 1 : 17</b><span>여객기 순항 중 항력과 양력의 비(양항비). 무게 17을 드는 데 항력 1 정도면 된다는 뜻입니다.</span></div><div><b>추력 ≈ 항력</b><span>순항에서 속도를 지키고 있으면 두 힘이 거의 같습니다.</span></div></div>`)}
<section class="card c12">${lrNote}</section></div>`;
  }
  function lrForces() {
    const thr = +$("#lr-f-thr").value, aoa = +$("#lr-f-aoa").value;
    const speed = 0.35 + thr / 100 * 0.65, lift = Math.min(1.5, (0.55 + aoa * 0.09) * (0.6 + speed * 0.55)), drag = 0.28 + speed * speed * 0.42 + aoa * 0.025, thrust = thr / 100 * 0.95;
    $("#lr-f-thr-v").textContent = thr + "%"; $("#lr-f-aoa-v").textContent = aoa + "°";
    $("#lr-f-l").setAttribute("y2", N(-14 - lift * 100)); $("#lr-f-lt").setAttribute("y", N(-14 - lift * 100 + 10));
    $("#lr-f-t").setAttribute("x2", N(115 + thrust * 130)); $("#lr-f-d").setAttribute("x2", N(-98 - drag * 130)); $("#lr-f-dt").setAttribute("x", N(-98 - drag * 130 + 8));
    const climb = lift - 1, acc = thrust - drag;
    const pl = $("#lr-f-plane"); pl.setAttribute("transform", `translate(430 ${N(170 - Math.max(-40, Math.min(40, climb * 90)))}) rotate(${N(-aoa * 1.2)})`);
    const svg = $("#lr-f-svg"); if (svg) svg.style.setProperty("--lr-cloud", N(Math.max(4, 22 - speed * 16)) + "s");
    { const Vs = [], P = [], I = [], T = []; for (let V = 180; V <= 950; V += 10) { const q = (V / 500) ** 2, par = 0.5 * q, ind = 0.5 / q; Vs.push(V); P.push([V, par]); I.push([V, ind]); T.push([V, par + ind]); }
      const V = 180 + thr / 100 * 770, q = (V / 500) ** 2, dv = 0.5 * q + 0.5 / q;
      $("#lr-f-chart").innerHTML = lrChart({ id: "f", w: 860, h: 250, x: [180, 950, "속도 (km/h, 대략)", [200, 300, 400, 500, 600, 700, 800, 900]], y: [0, 3, "항력 (상대값)", [0, 1, 2, 3]], series: [{ d: P, cls: "c2", label: "유해항력 ∝ V²", at: 60 }, { d: I, cls: "c3", label: "유도항력 ∝ 1/V²", at: 6 }, { d: T, cls: "c1", label: "전체 항력", at: 74 }], vlines: [{ x: 500, label: "최소 항력 속도", cls: "c1" }], marks: [{ x: V, y: dv }] }); }
    const v = Math.abs(acc) < 0.04 ? "속도를 그대로 유지합니다" : acc > 0 ? "추력이 항력보다 커서 빨라집니다" : "항력이 추력보다 커서 느려집니다";
    const h = Math.abs(climb) < 0.05 ? "고도를 그대로 유지합니다" : climb > 0 ? "양력이 무게보다 커서 올라갑니다" : "양력이 무게보다 작아서 내려갑니다";
    $("#lr-f-state").innerHTML = `<div class="${Math.abs(acc) < 0.04 ? "" : acc > 0 ? "up" : "down"}">${v}</div><div class="${Math.abs(climb) < 0.05 ? "" : climb > 0 ? "up" : "down"}">${h}</div>`;
  }

  /* ---------- 2. 양력 ---------- */
  function renderLearnLift() {
    const F = { tx: 230, ty: 190, c: 380, a: 5, down: 0.12 }, af = lrAirfoil(F.c);
    return lrHead("양력은 어떻게 생기나", "날개는 지나가는 공기의 흐름을 아래로 휘게 만듭니다. 그 과정에서 날개 위는 압력이 낮아지고 아래는 높아져, 날개 전체가 위로 밀립니다. 흔히 듣는 '위아래 공기가 같은 시간에 만난다'는 설명은 틀린 말입니다.") + `
<div class="grid lr">
<section class="card c12 lr-stage"><div class="lr-fig"><svg viewBox="0 0 860 340" role="img" aria-label="날개 단면 주위를 흐르는 공기">${lrSky(860, 340)}
<defs><radialGradient id="lrLow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3b82f6" stop-opacity=".42"/><stop offset="1" stop-color="#3b82f6" stop-opacity="0"/></radialGradient><radialGradient id="lrHigh" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f97316" stop-opacity=".38"/><stop offset="1" stop-color="#f97316" stop-opacity="0"/></radialGradient></defs>
<ellipse cx="390" cy="150" rx="220" ry="55" fill="url(#lrLow)"/><ellipse cx="420" cy="215" rx="210" ry="38" fill="url(#lrHigh)"/>
${lrFlows(F, [50, 85, 115, 145, 160])}${lrFlows(F, [215, 245, 275, 305])}
<g transform="translate(${F.tx} ${F.ty}) rotate(${F.a})"><path class="lr-wing" d="${af}"/></g>
<g class="lr-arw lift"><line x1="390" y1="160" x2="390" y2="40"/><text x="400" y="52">양력</text></g>
<g class="lr-arw down"><line x1="700" y1="205" x2="760" y2="250"/><text x="640" y="285">아래로 휘어 나가는 공기 (내리흐름)</text></g>
<text class="lr-lab low" x="440" y="128">압력 낮음, 흐름 빠름</text><text class="lr-lab high" x="440" y="238">압력 높음, 흐름 느림</text></svg></div>
<div class="lr-side">${lrRange("lr-l-v", "속도", 200, 950, 10, 480, " km/h")}${lrRange("lr-l-h", "고도", 0, 12000, 250, 0, " m")}${lrRange("lr-l-cl", "양력계수 (받음각에 따라)", 0.2, 1.6, 0.05, 0.5, "")}<div class="lr-big"><span>737-800 날개(124.6 m²)가 드는 무게</span><b id="lr-l-out">-</b><small id="lr-l-cmp"></small></div></div></section>
${lrCard("c7", "info", "압력 차이와 내리흐름, 같은 이야기의 두 면", `<p>날개 윗면은 볼록하고 공기를 받는 각도(받음각)가 있어서, 위쪽 공기는 더 빨리 흐르며 압력이 내려갑니다. 아랫면은 공기를 막아 압력이 조금 올라갑니다. 이 압력 차이가 넓은 날개 전체에 걸려 큰 힘이 됩니다.</p><p>같은 일을 뉴턴 법칙으로 보면, 날개가 공기를 아래로 밀어 내리고 그 반작용으로 위로 밀리는 것입니다. 두 설명은 서로 다른 이론이 아니라 같은 흐름을 다르게 본 것입니다.</p><p><b>틀린 설명 하나.</b> 날개 앞에서 나뉜 공기가 뒤에서 같은 시간에 다시 만나야 한다는 규칙은 없습니다. 실제로는 위쪽 공기가 훨씬 먼저 뒤끝에 닿습니다.</p>`)}
${lrChartCard("c12", "압력계수 분포: 시위를 따라", "lr-l-cp", "위쪽으로 갈수록 압력이 낮습니다(−Cp). 윗면은 앞전 바로 뒤에서 압력이 크게 떨어졌다가 뒤로 갈수록 회복하고, 아랫면은 조금 높습니다. 두 선 사이 넓이가 양력입니다. 양력계수 막대를 움직이면 받음각이 바뀌어 모양이 달라집니다. 얇은 날개 이론에 두께 효과를 더한 근사입니다.")}
${lrCard("c5", "doc", "양력 공식", `<div class="lr-eq">L = ½ ρ v² S C<sub>L</sub></div><ul class="lr-list"><li><b>ρ</b> 공기 밀도. 높이 올라갈수록 작아집니다.</li><li><b>v</b> 속도. 제곱으로 들어가서 두 배 빨라지면 양력은 네 배가 됩니다.</li><li><b>S</b> 날개 넓이.</li><li><b>C<sub>L</sub></b> 양력계수. 날개 모양과 받음각에 따라 정해집니다.</li></ul><p class="small muted">고도를 올려 보세요. 공기가 옅어지면 같은 무게를 들기 위해 더 빨리 날아야 합니다. 여객기가 높은 곳에서 빠르게 나는 이유 중 하나입니다.</p>`)}
<section class="card c12">${lrNote}</section></div>`;
  }
  function lrLift() {
    const v = +$("#lr-l-v").value, h = +$("#lr-l-h").value, cl = +$("#lr-l-cl").value, rho = lrRho(h), ms = v / 3.6, L = 0.5 * rho * ms * ms * 124.6 * cl, t = L / 9.81 / 1000;
    $("#lr-l-v-v").textContent = fmt(v) + " km/h"; $("#lr-l-h-v").textContent = fmt(h) + " m"; $("#lr-l-cl-v").textContent = cl.toFixed(2);
    $("#lr-l-out").textContent = fmt(Math.round(t)) + " t";
    // 압력계수: 얇은 날개 이론 ΔCp = 4α√((1−x)/x) + 캠버 몫, 두께는 양쪽을 똑같이 빨아들이는 몫으로 근사
    const al = (cl - 0.2) / 0.095 * LR_TOR + 0.035, U = [], Lo = [];
    for (let i = 1; i <= 60; i++) { const x = i / 60, load = 4 * al * Math.sqrt((1 - x) / x) + 0.6 * Math.sin(Math.PI * x) * 0.5, th = 0.32 * Math.sin(Math.PI * Math.pow(x, 0.7)); U.push([x, Math.min(4, load / 2 + th)]); Lo.push([x, Math.max(-0.95, -load / 2 + th * 0.55)]); }
    $("#lr-l-cp").innerHTML = lrChart({ id: "cp", w: 860, h: 250, x: [0, 1, "시위 위치 x/c (앞전 0, 뒷전 1)", [0, 0.2, 0.4, 0.6, 0.8, 1]], y: [-1, Math.max(2, Math.ceil(Math.max(...U.map(q => q[1])) + 0.3)), "−Cp (위가 낮은 압력)", [-1, 0, 1, 2, 3, 4].filter(v => v <= Math.max(2, Math.ceil(Math.max(...U.map(q => q[1])) + 0.3)))], series: [{ d: U, cls: "c1", label: "윗면", at: 8 }, { d: Lo, cls: "c3", label: "아랫면", at: 30 }] });
    $("#lr-l-cmp").textContent = `공기 밀도 ${rho.toFixed(3)} kg/m³. ` + (t >= 79 ? "최대 이륙 중량(약 79 t)보다 큽니다." : t >= 41 ? "빈 기체 무게(약 41 t)와 최대 이륙 중량 사이입니다." : "빈 기체 무게(약 41 t)도 들지 못합니다.");
  }

  /* ---------- 3. 받음각과 실속 ---------- */
  function renderLearnStall() {
    return lrHead("받음각과 실속", "날개가 공기를 받는 각도를 받음각이라고 합니다. 받음각을 키우면 양력이 늘다가, 어느 각도를 넘으면 윗면 공기가 날개에서 떨어져 나가며 양력이 갑자기 줄어듭니다. 이것을 실속이라고 합니다.") + `
<div class="grid lr">
<section class="card c12 lr-stage"><div class="lr-fig"><svg id="lr-s-svg" viewBox="0 0 860 340" role="img" aria-label="받음각에 따라 달라지는 날개 주위 흐름">${lrSky(860, 340)}<g id="lr-s-flow"></g><g id="lr-s-wing" transform="translate(250 150)"><path class="lr-wing" d="${lrAirfoil(340)}"/></g><g id="lr-s-turb"></g><text id="lr-s-warn" class="lr-warn" x="430" y="40" text-anchor="middle"></text></svg></div>
<div class="lr-side">${lrRange("lr-s-a", "받음각", -4, 22, 0.5, 4, "°")}<svg class="lr-curve" viewBox="0 0 260 150" aria-label="받음각에 따른 양력계수"><path id="lr-s-cv" class="lr-cv"/><line x1="20" y1="130" x2="250" y2="130" class="lr-ax"/><line x1="20" y1="10" x2="20" y2="130" class="lr-ax"/><text x="250" y="145" text-anchor="end" class="lr-axl">받음각</text><text x="24" y="16" class="lr-axl">양력계수</text><circle id="lr-s-dot" r="5" class="lr-dot"/></svg><div class="lr-big"><span>양력계수 (대략)</span><b id="lr-s-cl">-</b><small id="lr-s-msg"></small></div></div></section>
${lrCard("c7", "info", "왜 갑자기 떨어지나", `<p>받음각이 작을 때 공기는 날개 윗면을 따라 매끈하게 흘러 뒤끝에서 아래로 빠져나갑니다. 각도를 키울수록 공기를 더 많이 아래로 휘게 해 양력이 커집니다.</p><p>그런데 윗면 뒤쪽은 압력이 다시 높아지는 '오르막'입니다. 각도가 너무 크면 공기가 이 오르막을 버티지 못하고 날개에서 떨어져 나가 소용돌이칩니다. 그 순간 양력은 줄고 항력은 크게 늘어납니다.</p><p>그래서 실속은 속도가 아니라 <b>받음각</b>의 문제입니다. 느린 속도에서 무게를 들려면 받음각을 키워야 하므로, 느릴 때 실속에 가까워지는 것입니다.</p>`)}
${lrChartCard("c12", "항력 극곡선 (양력계수와 항력계수)", "lr-s-polar", "같은 날개로 받음각을 바꿔 가며 양력과 항력을 함께 그린 곡선입니다. 원점에서 그은 직선이 곡선에 닿는 점이 양항비가 가장 좋은 상태입니다. 실속을 넘으면 양력은 줄고 항력은 크게 늘어 곡선이 오른쪽 아래로 꺾입니다.")}
${lrCard("c5", "bell", "여객기는 어떻게 막나", `<ul class="lr-list"><li><b>실속 경고</b> 받음각 센서가 위험에 가까워지면 조종간을 떨게 하는 장치(스틱 셰이커)와 경고음이 작동합니다.</li><li><b>보호 기능</b> 에어버스 플라이 바이 와이어 기체는 정상 모드에서 받음각이 한계를 넘지 않게 막습니다.</li><li><b>플랩과 슬랫</b> 이착륙 때 펼쳐 실속 받음각과 최대 양력을 키웁니다. '플랩과 슬랫' 탭에서 볼 수 있습니다.</li></ul>`)}
<section class="card c12">${lrNote}</section></div>`;
  }
  function lrStall() {
    const a = +$("#lr-s-a").value, cl = lrCL(a), stall = a > 15, near = a > 12 && !stall;
    $("#lr-s-a-v").textContent = a + "°"; $("#lr-s-cl").textContent = cl.toFixed(2);
    $("#lr-s-msg").textContent = stall ? "실속. 윗면 흐름이 떨어져 양력이 줄었습니다." : near ? "실속에 가깝습니다. 경고가 울리는 구간입니다." : a < 0 ? "음의 받음각. 양력이 거의 없습니다." : "흐름이 날개를 따라 붙어 있습니다.";
    $("#lr-s-wing").setAttribute("transform", `translate(250 150) rotate(${N(a)} 0 0)`);
    // 흐름선: 날개 모양을 따라 휘고, 실속이면 윗면 흐름이 날개에서 떨어져 나간다
    const F = { tx: 250, ty: 150, c: 340, a: a, down: Math.max(0, Math.min(cl, 1.6)) * 0.1, sep: stall ? Math.min(1, (a - 15) / 5) : 0 };
    const o = lrFlows(F, [40, 70, 98, 122, 140]) + lrFlows(F, [190, 235, 270, 305]);
    $("#lr-s-flow").innerHTML = o;
    // 실속이면 윗면 뒤쪽에 도는 소용돌이
    let tb = "";
    if (stall) { const n = Math.min(6, Math.round((a - 15) / 1.2) + 2); for (let i = 0; i < n; i++) { const x = 360 + i * 48, y = 150 + (x - 250) * Math.tan(a * LR_TOR) - 30 - (i % 2) * 16 - i * 3, r = 9 + i * 3; tb += `<g class="lr-vtx" style="transform-origin:${x}px ${y}px;animation-duration:${(1.4 + i * 0.25).toFixed(2)}s"><path d="M${x - r} ${y} a${r} ${r} 0 1 1 ${r * 2} 0 a${r * 0.6} ${r * 0.6} 0 1 1 ${-r * 1.2} 0"/></g>`; } }
    $("#lr-s-turb").innerHTML = tb;
    $("#lr-s-warn").textContent = stall ? "STALL" : near ? "실속 경고" : "";
    $("#lr-s-warn").setAttribute("class", "lr-warn" + (stall ? " on" : near ? " near" : ""));
    // 곡선 위 점
    const X = d => 20 + (d + 4) / 26 * 230, Y = c => 130 - c / 1.8 * 115;
    let d = ""; for (let x = -4; x <= 22; x += 0.5) d += (d ? "L" : "M") + N(X(x)) + " " + N(Y(lrCL(x)));
    $("#lr-s-cv").setAttribute("d", d); $("#lr-s-dot").setAttribute("cx", N(X(a))); $("#lr-s-dot").setAttribute("cy", N(Y(cl)));
    $("#lr-s-dot").setAttribute("class", "lr-dot" + (stall ? " bad" : near ? " warn" : ""));
    const cdOf = x => { const c = lrCL(x); return 0.009 + c * c / (Math.PI * 0.85 * 9.4) + (x > 15 ? 0.012 * Math.pow(x - 15, 1.6) : 0); };
    const pol = []; for (let x = -4; x <= 22; x += 0.5) pol.push([cdOf(x), lrCL(x)]);
    let best = pol[0]; pol.forEach(p => { if (p[1] / p[0] > best[1] / best[0]) best = p; });
    $("#lr-s-polar").innerHTML = lrChart({ id: "pol", w: 860, h: 250, x: [0, 0.32, "항력계수 CD", [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3]], y: [-0.2, 1.8, "양력계수 CL", [0, 0.5, 1, 1.5]], series: [{ d: pol, cls: "c1" }, { d: [[0, 0], [best[0] * 2.2, best[1] * 2.2]], cls: "c2 dash", label: "최대 양항비 접선", at: 1 }], marks: [{ x: cdOf(a), y: cl, cls: stall ? "bad" : near ? "warn" : "", label: `받음각 ${a}°` }] });
  }

  /* ---------- 4. 날개 끝 소용돌이와 윙렛 ---------- */
  const LR_WL = [
    ["none", "윙렛 없음", 1.0, "날개 끝에서 아래쪽 높은 압력의 공기가 위로 돌아 올라가 큰 소용돌이를 만듭니다.", null],
    ["blend", "블렌디드 윙렛", 0.72, "날개 끝을 부드럽게 위로 꺾어 올린 모양입니다. 737NG와 757, 767에 많이 붙였습니다. 제조사 발표로 장거리에서 연료를 약 3~5% 아낍니다.", ["boeing-737", "737NG"]],
    ["shark", "샤크렛", 0.74, "에어버스 A320 계열의 위로 솟은 날개 끝입니다. 에어버스는 긴 구간에서 연료를 최대 약 4% 아낀다고 밝혔습니다.", ["airbus-a320neo", "A320neo"]],
    ["scim", "분할 시미터 윙렛", 0.66, "위아래로 갈라진 날개 끝입니다. 737 MAX의 'AT 윙렛'도 위아래 두 갈래 모양입니다. 블렌디드 윙렛보다 1~2% 정도 더 아낀다고 알려져 있습니다.", ["boeing-737max", "737 MAX"]],
    ["raked", "레이크드 윙팁", 0.78, "위로 꺾지 않고 날개 끝을 뒤로 길게 늘린 모양입니다. 787과 777-300ER, 777X가 이 방식입니다. 날개폭을 키운 것과 비슷한 효과를 냅니다.", ["boeing-787", "787"]]
  ];
  let lrWL = "none";
  function renderLearnWinglet() {
    return lrHead("날개 끝 소용돌이와 윙렛", "날개 아래는 압력이 높고 위는 낮습니다. 날개 끝에서는 아래 공기가 위로 돌아 올라가며 소용돌이를 만들고, 이 소용돌이가 '유도항력'이라는 손실을 만듭니다. 윙렛은 이 소용돌이를 줄이는 날개 끝 장치입니다.") + `
<div class="grid lr">
<section class="card c12 lr-stage"><div class="lr-fig"><svg viewBox="0 0 860 340" role="img" aria-label="뒤에서 본 날개와 날개 끝 소용돌이">${lrSky(860, 340)}
<g transform="translate(110 210)"><path class="lr-body" d="M-30 -26 C-30 -44 30 -44 30 -26 L30 22 C30 40 -30 40 -30 22Z"/><path class="lr-wing" d="M26 0 L560 -26 L560 -14 L26 16Z"/><g class="lr-eng"><path class="lr-body" d="M170 14 L230 12 L230 20 L170 22Z"/><ellipse class="lr-body" cx="200" cy="34" rx="26" ry="20"/><ellipse cx="200" cy="34" rx="15" ry="11" fill="var(--lr-wing-s)" opacity=".55"/></g><g id="lr-w-tip" transform="translate(560 -20) scale(1.9)"></g>
<g id="lr-w-vtx" transform="translate(575 -10)"></g>
<g class="lr-arw up"><line x1="430" y1="40" x2="430" y2="-10"/><line x1="500" y1="44" x2="520" y2="-4"/></g><text class="lr-lab high" x="380" y="66">아래: 압력 높음</text><text class="lr-lab low" x="380" y="-46">위: 압력 낮음</text></g></svg></div>
<div class="lr-side"><div class="lr-seg" role="group" aria-label="날개 끝 모양">${LR_WL.map(w => `<button type="button" data-lrw="${w[0]}" class="${w[0] === lrWL ? "on" : ""}">${w[1]}</button>`).join("")}</div><div class="lr-big"><span>날개 끝 소용돌이 세기 (윙렛 없음 = 100)</span><b id="lr-w-out">100</b><div class="lr-bar"><span id="lr-w-bar" style="width:100%"></span></div><small id="lr-w-txt"></small></div></div></section>
${lrCard("c7", "info", "유도항력이란", `<p>날개가 양력을 만들면 날개 끝에서 공기가 아래에서 위로 돌아 올라갑니다. 이 회전이 날개 뒤로 길게 끌려가며 소용돌이가 되고, 날개 전체에 아래로 향하는 흐름을 덧붙여 양력의 방향을 조금 뒤로 기울입니다. 그 뒤로 기운 몫이 항력이 되는데, 이것이 유도항력입니다.</p><p>유도항력은 양력을 많이 만들수록, 그리고 느릴수록 커집니다. 그래서 무거운 상태로 천천히 오르는 이륙과 상승에서 특히 큽니다.</p><p>날개를 길게 만들면 줄어들지만 공항 게이트 폭과 구조 무게에 한계가 있습니다. 윙렛은 날개폭을 크게 늘리지 않고 비슷한 효과를 얻으려는 방법입니다.</p>`)}
${lrChartCard("c12", "날개폭 방향 양력 분포와 유도항력", "lr-w-span", "")}
${lrCard("c5", "target", "앞 비행기의 소용돌이", `<p>큰 비행기의 날개 끝 소용돌이는 몇 분 동안 남아 뒤따르는 작은 비행기를 크게 흔들 수 있습니다. 그래서 관제사는 기종의 '후류 등급'에 따라 이착륙 간격을 띄웁니다.</p><p class="small muted">후류 등급은 자료 &gt; 운항 규정 &gt; ICAO 분류에서 볼 수 있습니다.</p>`)}
<section class="card c12">${cardH(ICON.plane, "실제 기종의 날개 끝")}<div class="card-b">${lrPlanes([["boeing-737", "블렌디드 윙렛 (NG)"], ["boeing-737max", "AT 윙렛 (위아래 두 갈래)"], ["airbus-a320neo", "샤크렛"], ["boeing-787", "레이크드 윙팁"], ["airbus-a350", "위로 휘어 올린 날개 끝"], ["boeing-747", "747-400 윙렛"]])}</div></section>
<section class="card c12">${lrNote}</section></div>`;
  }
  function lrWinglet() {
    const w = LR_WL.find(x => x[0] === lrWL) || LR_WL[0], s = w[2];
    document.querySelectorAll("[data-lrw]").forEach(b => b.classList.toggle("on", b.getAttribute("data-lrw") === lrWL));
    const tips = { none: "", blend: `<path class="lr-wing" d="M0 -5 C18 -6 26 -20 30 -52 L36 -52 C32 -16 22 4 0 5Z"/>`, shark: `<path class="lr-wing" d="M0 -5 L10 -6 C16 -12 20 -30 22 -56 L28 -56 C28 -30 24 -4 0 5Z"/>`, scim: `<path class="lr-wing" d="M0 -5 C16 -8 24 -24 28 -56 L34 -56 C32 -20 22 -2 0 3Z"/><path class="lr-wing" d="M0 0 C12 2 18 8 22 24 L27 24 C24 6 16 -2 0 -3Z"/>`, raked: `<path class="lr-wing" d="M0 -5 L58 -9 L58 -4 L0 5Z"/>` };
    $("#lr-w-tip").innerHTML = tips[lrWL];
    // 소용돌이: 반지름과 굵기를 세기에 맞춘다. 세 겹이 돈다
    const R = 16 + 34 * s; let v = "";
    for (let i = 0; i < 3; i++) { const r = R * (1 - i * 0.28); v += `<g class="lr-vtx big" style="animation-duration:${(1.6 + i * 0.5).toFixed(2)}s"><path d="M${-r} 0 a${r} ${r} 0 1 1 ${r * 2} 0 a${r * 0.7} ${r * 0.7} 0 1 1 ${-r * 1.4} 0 a${r * 0.4} ${r * 0.4} 0 1 1 ${r * 0.8} 0" style="stroke-width:${N(1.2 + s * 2.4 - i * 0.6)}"/></g>`; }
    $("#lr-w-vtx").innerHTML = v; $("#lr-w-vtx").setAttribute("transform", `translate(${lrWL === "raked" ? 680 : lrWL === "none" ? 575 : 625} ${lrWL === "none" || lrWL === "raked" ? -14 : -100})`);
    // 날개폭 방향 양력: 이상적인 타원 분포와, 날개 끝에서 공기가 돌아 나가며 끝 쪽이 줄어든 분포
    const ell = [], real = [];
    for (let i = 0; i <= 50; i++) { const y = i / 50, e = Math.sqrt(1 - y * y); ell.push([y, e]); real.push([y, e * (1 - (1 - s) * 0) * (1 - Math.pow(y, 6) * (0.35 * s))]); }
    const e0 = { none: 0.78, blend: 0.83, shark: 0.83, scim: 0.85, raked: 0.82 }[lrWL], AR = 9.4, CL = 0.5, cdi = CL * CL / (Math.PI * e0 * AR);
    $("#lr-w-span").innerHTML = lrChart({ id: "span", w: 860, h: 230, x: [0, 1, "날개 뿌리 0 → 날개 끝 1", [0, 0.2, 0.4, 0.6, 0.8, 1]], y: [0, 1.1, "양력 (뿌리 = 1)", [0, 0.5, 1]], series: [{ d: ell, cls: "c2 dash", label: "이상적인 타원 분포", at: 20 }, { d: real, cls: "c1", label: "이 날개 끝 모양", at: 38 }] })
      + `<div class="lr-eqrow"><div class="lr-eq sm">C<sub>Di</sub> = C<sub>L</sub>² / (π e AR)</div><div class="lr-cap">C<sub>L</sub> 0.5, 가로세로비 AR 9.4(737-800 근처), 날개 효율 e ${e0.toFixed(2)}로 계산하면 <b>C<sub>Di</sub> ≈ ${cdi.toFixed(4)}</b>. 윙렛은 e를 키워(날개 끝 손실을 줄여) 같은 양력에서 유도항력을 낮춥니다. e 값은 모양별 차이를 보여 주기 위한 가정입니다.</div></div>`;
    $("#lr-w-out").textContent = Math.round(s * 100); $("#lr-w-bar").style.width = Math.round(s * 100) + "%";
    $("#lr-w-txt").innerHTML = esc(w[3]) + (w[4] ? ` <a class="ext" href="#${w[4][0]}">${esc(w[4][1])} 보기 →</a>` : "") + `<br><span class="muted">세기 숫자는 모양별 차이를 보여 주기 위한 그림 값입니다.</span>`;
  }

  /* ---------- 5. 후퇴익과 음속 ---------- */
  function renderLearnSweep() {
    return lrHead("후퇴익과 음속", "여객기 날개가 뒤로 젖혀져 있는 이유는 빠르게 날기 위해서입니다. 날개는 바람 중에서 앞전에 수직으로 들어오는 몫만 '느끼기' 때문에, 날개를 젖히면 실제보다 느린 바람을 받는 셈이 됩니다.") + `
<div class="grid lr">
<section class="card c12 lr-stage"><div class="lr-fig"><svg viewBox="0 0 860 340" role="img" aria-label="위에서 본 후퇴익과 바람의 분해">${lrSky(860, 340)}
<g transform="translate(250 60)"><path class="lr-body" d="M-14 -40 C-14 -60 14 -60 14 -40 L14 280 L-14 280Z"/><path id="lr-sw-wing" class="lr-wing"/><g id="lr-sw-vec"></g></g>
<g class="lr-wind">${[0, 1, 2, 3, 4].map(i => `<path class="lr-flow fast" style="animation-duration:1.1s" d="M${560 + i * 50} -10 L${560 + i * 50} 350"/>`).join("")}</g></svg></div>
<div class="lr-side">${lrRange("lr-sw-a", "후퇴각", 0, 40, 1, 25, "°")}${lrRange("lr-sw-m", "비행 마하수", 0.5, 0.9, 0.01, 0.78, "")}<div class="lr-big"><span>날개가 느끼는 마하수 (M × cos 후퇴각)</span><b id="lr-sw-out">-</b><small id="lr-sw-msg"></small></div></div></section>
${lrCard("c7", "info", "충격파가 생기는 속도", `<p>비행기가 음속보다 느리게 날아도, 날개 윗면에서는 공기가 더 빨리 흐르기 때문에 일부가 먼저 음속을 넘습니다. 그 자리에 충격파가 생기면 항력이 급격히 늘고 흔들림이 생깁니다. 이렇게 되기 시작하는 비행 속도를 임계 마하수라고 합니다.</p><p>날개를 뒤로 젖히면 앞전에 수직인 바람 성분이 cos(후퇴각)만큼 줄어, 같은 비행 속도에서도 날개가 받는 부담이 작아집니다. 그래서 마하 0.8 안팎으로 나는 제트 여객기는 대부분 25~38도 정도로 젖힌 날개를 씁니다.</p><p>대신 젖힌 날개는 느린 속도에서 양력이 덜 나오고 날개 끝부터 실속하기 쉬워, 플랩과 슬랫 같은 장치로 보완합니다.</p>`)}
${lrChartCard("c12", "마하수에 따른 항력 상승", "lr-sw-cd", "속도가 임계 마하수를 넘으면 날개 위 충격파 때문에 항력이 가파르게 오릅니다(항력 발산). 날개를 젖히면 이 오르막이 오른쪽(더 빠른 속도)으로 밀려납니다. 근사식: 임계 마하수 ≈ 0.72 ÷ cos(후퇴각).")}
${lrCard("c5", "ruler", "기종별 후퇴각 (대략)", `<div class="lr-facts">${[["boeing-737", "737", "25°"], ["airbus-a320", "A320", "25°"], ["boeing-777", "777", "31.6°"], ["boeing-787", "787", "32.2°"], ["airbus-a380", "A380", "33.5°"], ["boeing-747", "747", "37.5°"]].map(x => `<div><b>${x[2]}</b><span><a class="ext" href="#${x[0]}">${x[1]}</a></span></div>`).join("")}</div><p class="small muted">공개 자료에 흔히 나오는 날개 4분의 1 시위선 기준 값입니다.</p>`)}
<section class="card c12">${lrNote}</section></div>`;
  }
  function lrSweep() {
    const a = +$("#lr-sw-a").value, m = +$("#lr-sw-m").value, mn = m * Math.cos(a * LR_TOR);
    $("#lr-sw-a-v").textContent = a + "°"; $("#lr-sw-m-v").textContent = m.toFixed(2);
    // 위에서 본 오른쪽 날개: 뿌리 시위 120, 끝 시위 40, 반폭 260
    const t = Math.tan(a * LR_TOR), sx = 14, sp = 260, le = [sx, 90], tipLE = [sx + sp, 90 + sp * t * 0.55], tipTE = [tipLE[0], tipLE[1] + 40], te = [sx, 210];
    $("#lr-sw-wing").setAttribute("d", `M${le[0]} ${le[1]} L${N(tipLE[0])} ${N(tipLE[1])} L${N(tipTE[0])} ${N(tipTE[1])} L${te[0]} ${te[1]}Z`);
    // 앞전 가운데에서 바람(아래쪽) 화살표와 그 분해
    const mx = (le[0] + tipLE[0]) / 2, my = (le[1] + tipLE[1]) / 2, ang = Math.atan2(tipLE[1] - le[1], tipLE[0] - le[0]), L = 110 * (m / 0.9);
    const nx = -Math.sin(ang), ny = Math.cos(ang), pn = L * Math.cos(a * LR_TOR);
    $("#lr-sw-vec").innerHTML = `<g class="lr-arw thrust"><line x1="${N(mx)}" y1="${N(my - L)}" x2="${N(mx)}" y2="${N(my)}"/></g><text class="lr-lab" x="${N(mx + 8)}" y="${N(my - L + 8)}">바람 M ${m.toFixed(2)}</text><g class="lr-arw ${mn > 0.72 ? "drag" : "lift"}"><line x1="${N(mx - nx * pn)}" y1="${N(my - ny * pn)}" x2="${N(mx)}" y2="${N(my)}"/></g><text class="lr-lab" x="${N(mx - nx * pn - 70)}" y="${N(my - ny * pn - 6)}">앞전에 수직인 몫</text>`;
    $("#lr-sw-out").textContent = "M " + mn.toFixed(2);
    const cdM = (M, sw) => { const mc = Math.min(0.98, 0.72 / Math.cos(sw * LR_TOR)); return 0.02 + (M > mc ? 0.9 * Math.pow(M - mc, 2) * 10 : 0); };
    const s0 = [], s1 = []; for (let M = 0.5; M <= 0.95; M += 0.005) { s0.push([M, cdM(M, 0)]); s1.push([M, cdM(M, a)]); }
    $("#lr-sw-cd").innerHTML = lrChart({ id: "cdm", w: 860, h: 240, x: [0.5, 0.95, "비행 마하수", [0.5, 0.6, 0.7, 0.8, 0.9]], y: [0, 0.12, "항력계수 (상대값)", [0, 0.04, 0.08, 0.12]], series: [{ d: s0, cls: "c3", label: "직선 날개", at: 52 }, { d: s1, cls: "c1", label: `후퇴각 ${a}°`, at: 80 }], vlines: [{ x: m, label: `지금 M ${m.toFixed(2)}`, cls: "c1" }] });
    $("#lr-sw-msg").textContent = mn > 0.75 ? "충격파가 생기기 쉬운 구간입니다. 더 젖히거나 더 천천히 날아야 합니다." : mn > 0.7 ? "경계 근처입니다." : "여유가 있습니다.";
  }

  /* ---------- 6. 플랩과 슬랫 ---------- */
  const LR_FL = [[0, 1.3, 0], [5, 1.75, 10], [15, 2.1, 20], [30, 2.45, 32], [40, 2.6, 40]];
  function renderLearnHighlift() {
    return lrHead("플랩과 슬랫", "빠르게 나는 데 맞춘 얇고 젖힌 날개는 느린 속도에서 양력이 모자랍니다. 그래서 이착륙 때는 날개 앞쪽 슬랫과 뒤쪽 플랩을 펼쳐 날개를 더 휘고 넓게 만듭니다.") + `
<div class="grid lr">
<section class="card c12 lr-stage"><div class="lr-fig"><svg viewBox="0 0 860 340" role="img" aria-label="슬랫과 플랩이 펼쳐지는 날개 단면">${lrSky(860, 340)}<g id="lr-h-flow"></g>
<g transform="translate(260 170)"><g id="lr-h-slat"><path class="lr-wing slat" d="M-6 -2 C-4 -16 14 -22 34 -22 L30 -12 C16 -12 6 -8 4 0Z"/></g><path class="lr-wing" d="M30 -22 C120 -30 220 -22 300 -8 L300 6 C220 4 120 4 30 0 C26 -8 26 -16 30 -22Z"/><g id="lr-h-flap"><path class="lr-wing flap" d="M0 -6 C30 -8 70 -4 100 4 L100 8 C70 6 30 6 0 6Z"/></g></g></svg></div>
<div class="lr-side"><div class="lr-ctl"><label for="lr-h-f">플랩 단계 <b id="lr-h-f-v">0</b></label><input type="range" id="lr-h-f" min="0" max="4" step="1" value="0"><div class="lr-ticks">${LR_FL.map(f => `<span>${f[0]}</span>`).join("")}</div></div>${lrRange("lr-h-w", "착륙 무게", 50, 75, 1, 65, " t")}<div class="lr-big"><span>실속 속도 (대략, 해면 고도)</span><b id="lr-h-out">-</b><small id="lr-h-msg"></small></div></div></section>
${lrCard("c7", "info", "날개를 바꾸는 장치", `<p><b>슬랫</b>은 앞전에서 앞아래로 미끄러져 나오며 틈을 만듭니다. 아래쪽의 빠른 공기가 이 틈으로 윗면에 불어 들어가 흐름이 더 큰 받음각까지 붙어 있게 해 줍니다.</p><p><b>플랩</b>은 뒤로 미끄러져 나오며 아래로 꺾입니다(파울러 플랩). 날개 넓이가 늘고 휜 정도(캠버)가 커져 같은 속도에서 양력이 크게 늘어납니다. 대신 항력도 늘어, 깊게 펼치면 감속과 하강에도 도움이 됩니다.</p><p>그래서 이륙은 양력과 항력 사이에서 적당한 단계를, 착륙은 가장 깊은 단계를 주로 씁니다.</p>`)}
${lrChartCard("c12", "플랩 단계별 양력 곡선", "lr-h-cl", "플랩을 펼치면 곡선 전체가 위로 올라가(같은 받음각에서 양력이 큼) 최대 양력계수가 커집니다. 슬랫은 실속 받음각을 뒤로 밀어 곡선이 더 높이 올라가게 합니다. 두꺼운 선이 지금 단계입니다.")}
${lrCard("c5", "doc", "실속 속도 공식", `<div class="lr-eq">V<sub>s</sub> = √(2W / (ρ S C<sub>L,max</sub>))</div><p>최대 양력계수 C<sub>L,max</sub>가 커질수록 더 느린 속도까지 날 수 있습니다. 실제 착륙 접근 속도는 실속 속도에 여유를 둔 값(대략 1.23배)입니다.</p><p class="small muted">737-800 날개 넓이 124.6 m²로 계산한 그림 값입니다.</p>`)}
<section class="card c12">${lrNote}</section></div>`;
  }
  function lrHighlift() {
    const i = +$("#lr-h-f").value, f = LR_FL[i], W = +$("#lr-h-w").value * 1000 * 9.81, vs = Math.sqrt(2 * W / (1.225 * 124.6 * f[1])), kmh = vs * 3.6, kt = vs * 1.94384;
    $("#lr-h-f-v").textContent = f[0]; $("#lr-h-w-v").textContent = $("#lr-h-w").value + " t";
    $("#lr-h-out").textContent = `${Math.round(kt)} kt (${Math.round(kmh)} km/h)`;
    $("#lr-h-msg").textContent = `최대 양력계수 약 ${f[1].toFixed(2)}. 접근 속도는 약 ${Math.round(kt * 1.23)} kt.`;
    const k = f[2] / 40;
    const fam = LR_FL.map((F, j) => { const d0 = (F[1] - 1.3) * 0.75, amax = 15 + (j ? 2 : 0) - F[2] * 0.08, pts = []; for (let x = -4; x <= 22; x += 0.5) { const c = x <= amax ? 0.2 + d0 + 0.095 * x : Math.max(0.6, 0.2 + d0 + 0.095 * amax - 0.09 * Math.pow(x - amax, 1.3)); pts.push([x, Math.min(F[1] + 0.05, c)]); } return { d: pts, cls: j === i ? "c1 thick" : "c4", label: j === i || j === 0 || j === 4 ? `플랩 ${F[0]}` : "", at: 24 + j }; });
    $("#lr-h-cl").innerHTML = lrChart({ id: "hcl", w: 860, h: 250, x: [-4, 22, "받음각 (도)", [-4, 0, 4, 8, 12, 16, 20]], y: [0, 3, "양력계수 CL", [0, 1, 2, 3]], series: fam });
    $("#lr-h-slat").setAttribute("transform", `translate(${N(-14 * k)} ${N(10 * k)}) rotate(${N(-14 * k)} 30 -12)`);
    $("#lr-h-flap").setAttribute("transform", `translate(${N(282 + 34 * k)} ${N(-2 + 8 * k)}) rotate(${N(f[2])} 0 0)`);
    const o = lrFlows({ tx: 260, ty: 172, c: 300, a: 0, down: 0.06 + k * 0.22 }, [50, 85, 115, 140]) + lrFlows({ tx: 260, ty: 172, c: 300, a: 0, down: 0.06 + k * 0.22 }, [215, 250, 285]);
    $("#lr-h-flow").innerHTML = o;
  }

  /* ---------- 7. 조종면과 세 축 ---------- */
  let lrAxis = "roll";
  function renderLearnControl() {
    const ax = [["roll", "롤 (에일러론)", "날개 끝 뒤쪽의 에일러론이 한쪽은 올라가고 한쪽은 내려가, 한쪽 날개 양력만 커져 기체가 옆으로 기웁니다. 선회는 이렇게 기울여서 양력의 방향을 옆으로 돌려 합니다."], ["pitch", "피치 (엘리베이터)", "꼬리 수평 날개의 엘리베이터가 꼬리를 아래나 위로 눌러, 기수가 들리거나 숙여집니다. 받음각과 속도를 바꾸는 주된 장치입니다."], ["yaw", "요 (러더)", "꼬리 수직 날개의 러더가 꼬리를 옆으로 밀어 기수 방향을 돌립니다. 선회 중 미끄러짐을 바로잡고, 엔진 하나가 멈췄을 때 기체가 돌지 않게 잡아 줍니다."]];
    return lrHead("조종면과 세 축", "비행기는 세 축으로 돕니다. 날개 끝이 오르내리는 롤, 기수가 들리고 숙여지는 피치, 기수가 좌우로 도는 요입니다. 각 축은 날개와 꼬리에 달린 움직이는 판(조종면)으로 다룹니다.") + `
<div class="grid lr">
<section class="card c12 lr-stage"><div class="lr-fig lr-3d"><div class="lr-3d-in" id="lr-c-plane"><svg viewBox="-200 -170 400 340" aria-label="위에서 본 여객기와 조종면"><path class="lr-body" d="M-10 -150 C-10 -168 10 -168 10 -150 L12 120 C12 140 -12 140 -12 120Z"/><path class="lr-wing" d="M-10 -20 L-180 40 L-180 56 L-10 30Z"/><path class="lr-wing" d="M10 -20 L180 40 L180 56 L10 30Z"/><path class="lr-wing" d="M-10 100 L-70 130 L-70 140 L-10 128Z"/><path class="lr-wing" d="M10 100 L70 130 L70 140 L10 128Z"/><path class="lr-fin" d="M-3 90 L-3 140 L3 140 L3 90Z"/>
<path id="lr-c-ail-l" class="lr-cs" d="M-170 50 L-120 33 L-120 40 L-170 57Z"/><path id="lr-c-ail-r" class="lr-cs" d="M170 50 L120 33 L120 40 L170 57Z"/><path id="lr-c-elev" class="lr-cs" d="M-66 135 L66 135 L66 142 L-66 142Z"/><path id="lr-c-rud" class="lr-cs" d="M-3 130 L3 130 L3 150 L-3 150Z"/></svg></div></div>
<div class="lr-side"><div class="lr-seg" role="group" aria-label="축 고르기">${ax.map(a => `<button type="button" data-lra="${a[0]}" class="${a[0] === lrAxis ? "on" : ""}">${a[1]}</button>`).join("")}</div>${lrRange("lr-c-in", "조종 입력", -100, 100, 1, 40, "")}<div class="lr-big"><span id="lr-c-name">-</span><small id="lr-c-txt"></small></div></div></section>
${lrCard("c7", "info", "실제 조종에서는", `<p>세 축은 혼자 움직이지 않습니다. 롤로 기울이면 기수가 바깥쪽으로 돌려는 성질(역요)이 생겨 러더로 함께 맞춰 주어야 하고, 기울인 만큼 위로 드는 양력이 줄어 엘리베이터로 기수를 조금 들어야 고도가 유지됩니다.</p><p>요즘 여객기는 조종간 입력을 컴퓨터가 받아 조종면을 움직이는 플라이 바이 와이어 방식이 많고, 이런 조정을 상당 부분 자동으로 해 줍니다.</p>`)}
${lrCard("c5", "layers", "다른 움직이는 면", `<ul class="lr-list"><li><b>스포일러</b> 날개 위로 올라와 양력을 줄이고 항력을 키웁니다. 착륙 직후 바퀴에 무게를 실어 제동을 돕습니다.</li><li><b>트림</b> 수평 꼬리날개 전체의 각도를 바꿔, 조종간을 계속 잡고 있지 않아도 자세가 유지되게 합니다.</li></ul>`)}
<section class="card c12">${lrNote}</section></div>`;
  }
  function lrControl() {
    const v = +$("#lr-c-in").value / 100, P = $("#lr-c-plane");
    document.querySelectorAll("[data-lra]").forEach(b => b.classList.toggle("on", b.getAttribute("data-lra") === lrAxis));
    const roll = lrAxis === "roll" ? v * 35 : 0, pitch = lrAxis === "pitch" ? v * 25 : 0, yaw = lrAxis === "yaw" ? v * 25 : 0;
    P.style.transform = `rotateX(${N(52 + pitch)}deg) rotateZ(${N(yaw)}deg) rotateY(${N(roll)}deg)`;
    const sk = (id, on, deg) => { const e = $(id); e.classList.toggle("on", on); e.style.transform = on ? `scaleY(${N(1 + Math.abs(deg) / 30)})` : ""; };
    sk("#lr-c-ail-l", lrAxis === "roll", v * 20); sk("#lr-c-ail-r", lrAxis === "roll", v * 20); sk("#lr-c-elev", lrAxis === "pitch", v * 20); sk("#lr-c-rud", lrAxis === "yaw", v * 20);
    const T = { roll: ["롤 (에일러론)", v > 0 ? "오른쪽 날개가 내려가며 오른쪽으로 기웁니다." : v < 0 ? "왼쪽 날개가 내려가며 왼쪽으로 기웁니다." : "수평"], pitch: ["피치 (엘리베이터)", v > 0 ? "꼬리가 눌려 기수가 들립니다." : v < 0 ? "기수가 숙여집니다." : "수평"], yaw: ["요 (러더)", v > 0 ? "기수가 오른쪽으로 돕니다." : v < 0 ? "기수가 왼쪽으로 돕니다." : "정면"] }[lrAxis];
    $("#lr-c-name").textContent = T[0]; $("#lr-c-txt").textContent = T[1];
    $("#lr-c-in-v").textContent = Math.round(v * 100);
  }

  /* ---------- 등록과 연결 ---------- */
  /* ---------- 쉬운 설명 (원리 상자). 핵심은 색으로: mark 기본 = 핵심, .b = 파랑(낮은 압력, 양력), .o = 주황(주의), .r = 빨강(위험) ---------- */
  const LR_EASY = {
    "learn-forces": ["두 쌍의 힘", `<p><mark>양력 ↑ 과 무게 ↓</mark> 양력이 더 크면 올라가고, 작으면 내려갑니다.</p><p><mark class="b">추력 → 과 항력 ←</mark> 추력이 더 크면 빨라지고, 작으면 느려집니다.</p><p>둘 다 똑같으면? <b>지금 속도와 고도 그대로</b> 날아갑니다. 이것이 순항입니다.</p><p class="lr-key">기억할 것: 빨라지면 양력도 커집니다. 그래서 속도를 바꿀 때는 기수 각도도 같이 맞춥니다.</p>`],
    "learn-lift": ["날개가 비행기를 드는 방법", `<p>날개는 <mark>공기를 아래로 밀어 내리는 판</mark>입니다. 공기를 아래로 밀면, 그 반대로 날개는 위로 밀립니다.</p><p>그래서 <mark class="b">윗면은 압력이 낮고</mark>, <mark class="o">아랫면은 압력이 조금 높습니다</mark>. 넓은 날개 전체에 이 차이가 걸려 비행기를 듭니다.</p><p class="lr-key">양력을 키우는 세 가지: 더 빨리(속도), 더 기울여(받음각), 더 짙은 공기(낮은 고도).</p><p class="small muted">'위아래 공기가 뒤에서 동시에 만난다'는 설명은 틀렸습니다. 위쪽 공기가 먼저 도착합니다.</p>`],
    "learn-stall": ["왜 갑자기 떨어지나", `<p>날개를 조금씩 더 기울이면(받음각 증가) <mark>양력이 계속 커집니다</mark>.</p><p>그런데 <mark class="o">약 15도를 넘으면</mark> 윗면 공기가 날개를 따라오지 못하고 떨어져 나갑니다. 그 순간 <mark class="r">양력은 뚝 떨어지고 항력은 커집니다</mark>. 이것이 실속입니다.</p><p class="lr-key">실속은 '느려서'가 아니라 '너무 기울여서' 생깁니다. 느릴 때 무게를 들려면 많이 기울여야 해서 실속에 가까워질 뿐입니다.</p>`],
    "learn-winglet": ["날개 끝에서 생기는 손해", `<p>날개 아래 공기는 압력이 높아서 <mark>날개 끝을 돌아 위로 말려 올라갑니다</mark>. 이것이 날개 끝 소용돌이입니다.</p><p>이 소용돌이가 날개 뒤 공기를 끌어내려 <mark class="o">양력을 조금 뒤로 기울게</mark> 만들고, 그만큼이 항력(유도항력)이 됩니다.</p><p class="lr-key">윙렛은 날개 끝에서 공기가 돌아 나가는 것을 막아 소용돌이를 줄입니다. 연료가 줄고, 무겁게 이륙해 오를 때 효과가 큽니다.</p>`],
    "learn-sweep": ["날개를 뒤로 젖히는 이유", `<p>비행기가 음속보다 느려도 날개 윗면 공기는 더 빨라서 <mark class="o">일부가 먼저 음속을 넘습니다</mark>. 그러면 충격파가 생겨 항력이 확 늘고 기체가 흔들립니다.</p><p>날개를 뒤로 젖히면 날개가 정면으로 받는 바람이 줄어듭니다. <mark>마하 0.8로 날아도 날개는 마하 0.72 정도로 느끼는</mark> 셈입니다(후퇴각 25도).</p><p class="lr-key">대신 젖힌 날개는 느릴 때 양력이 약합니다. 그래서 이착륙에는 플랩과 슬랫이 꼭 필요합니다.</p>`],
    "learn-highlift": ["날개 모양을 바꾸는 장치", `<p><mark>슬랫</mark>은 날개 앞쪽에서 앞아래로 미끄러져 나오는 판입니다. 더 많이 기울여도 흐름이 떨어지지 않게 해 줍니다.</p><p><mark class="b">플랩</mark>은 날개 뒤쪽에서 뒤로 나오며 아래로 꺾이는 판입니다. 날개가 넓어지고 더 휘어져 <mark>같은 속도에서 양력이 크게 늘어납니다</mark>.</p><p class="lr-key">이륙은 적게(양력은 늘고 항력은 덜), 착륙은 많이(양력도 항력도 크게) 펼칩니다.</p>`],
    "learn-control": ["세 축을 함께 쓰기", `<p><mark>롤</mark> 에일러론으로 좌우로 기울입니다. <mark class="b">피치</mark> 엘리베이터로 기수를 들거나 숙입니다. <mark class="o">요</mark> 러더로 기수를 좌우로 돌립니다.</p><p>세 축은 따로 놀지 않습니다. 기울이면 양력이 옆으로 쏠려 <b>고도가 떨어지니 조금 당기고</b>, 기수가 바깥으로 도는 것은 <b>러더로 잡아 줍니다</b>.</p><p class="lr-key">요즘 여객기는 컴퓨터가 이 조정을 상당 부분 대신해 줍니다(플라이 바이 와이어).</p>`]
  };
  function lrEasyHtml(html, k) {
    const e = LR_EASY[k]; if (!e) return html;
    const a = html.indexOf('<section class="card c7">'); if (a < 0) return html;
    const b = html.indexOf("</section>", a) + "</section>".length;
    return html.slice(0, a) + `<section class="card c7">${cardH(ICON.info, e[0])}<div class="card-b lr-prose lr-easy">${e[1]}</div></section>` + html.slice(b);
  }
  /* ---------- 그래서 어떻게 하나: 한 줄 요약, 다음 비행에서 해 볼 것, 이 사이트에서 ----------
     수치는 737-800 기준 대략값이다. 실제 기체나 시뮬레이터 기종의 교범 값이 우선이다. */
  const LR_DO = {
    "learn-forces": { sum: "기수 각도로 오르내림을, 추력으로 속도를 다룹니다. 둘은 늘 함께 움직입니다.",
      steps: ["순항 중 오토스로틀을 끄고 추력을 조금 줄여 보세요. 고도를 지키려고 기수가 서서히 들리고 속도가 떨어집니다.", "3도 활공로로 내려올 때 강하율은 <b>지상속도 × 5</b> fpm이 기준입니다. 지상속도 140 kt면 약 700 fpm입니다.", "활주로 바로 위(약 30 ft)에서 추력을 줄이며 기수를 2~3도 들어(플레어) 강하율을 줄입니다."],
      link: ["착륙률이 점수가 되는 방식", "scores"] },
    "learn-lift": { sum: "속도계(IAS)가 같으면 날개가 내는 양력도 같습니다. 높이 오를수록 실제 속도(TAS)는 훨씬 빠릅니다.",
      steps: ["상승할 때는 IAS를 고정(예: 280 kt)하고 오르다가, 높은 고도(대략 FL280~300)에서 마하수 기준으로 바꿉니다.", "FL350에서 속도계가 270 kt쯤이면 실제 속도는 약 1.8배인 480 kt 안팎입니다. 비행 계기에서 TAS와 비교해 보세요.", "고도가 높은 공항이나 더운 날에는 같은 무게로도 이륙 거리가 길어집니다. 짧은 활주로라면 무게를 줄이거나 플랩을 더 씁니다."],
      link: ["지도에서 예약해 고도별 비행 해 보기", "book"] },
    "learn-stall": { sum: "실속은 속도가 아니라 받음각 문제입니다. 경고가 울리면 먼저 기수를 숙여 받음각을 줄입니다.",
      steps: ["여객기는 보통 25도 넘게 기울여 선회하지 않습니다. 오토파일럿의 경사 제한(대개 25~30도)을 확인해 보세요.", "접근 속도는 Vref + 5 kt 밑으로 줄이지 않습니다. 바람이 세면 더 붙입니다.", "실속 경고(스틱 셰이커)가 나면 순서대로: 기수 숙이기, 날개 수평, 추력 조절, 원래 경로."],
      link: ["점수 기준에서 착륙률 영향 보기", "scores"] },
    "learn-winglet": { sum: "날개 끝 소용돌이는 연료를 먹고, 뒤따르는 비행기를 흔듭니다.",
      steps: ["큰 기종(747, 777, A380 등) 바로 뒤에서 이착륙할 때는 2~3분 기다립니다. 바람이 약한 날은 소용돌이가 오래 남습니다.", "큰 비행기 뒤에 접근할 때는 그 비행기의 경로보다 위로, 그 비행기가 닿은 지점보다 멀리 내립니다.", "윙렛이 있는 기종과 없는 기종으로 같은 구간을 날아 연료 소모를 비교해 보세요."],
      link: ["737과 737 MAX의 날개 끝 비교", "compare"] },
    "learn-sweep": { sum: "높이 날수록 속도의 기준은 마하수입니다. 너무 무거울 때 너무 높이 오르면 속도 여유가 사라집니다.",
      steps: ["737 순항은 보통 마하 0.78 안팎입니다. 비행 관리 컴퓨터(FMC)의 최적 고도와 최대 고도를 확인하고 최대 고도 바로 아래로는 오르지 마세요.", "난기류에서는 권장 통과 속도(737 기준 약 280 kt 또는 마하 0.76)로 맞춥니다.", "과속 경고가 울리면 추력을 줄이고 기수를 살짝 들어 속도를 줄입니다. 급하게 당기지 않습니다."],
      link: ["기종별 순항 속도와 제원", "fleet"] },
    "learn-highlift": { sum: "이륙은 플랩을 적게, 착륙은 많이. 플랩마다 넘으면 안 되는 속도가 있습니다.",
      steps: ["737-800 이륙은 보통 플랩 5, 착륙은 플랩 30을 씁니다(짧은 활주로나 무거울 때는 다를 수 있음).", "플랩 한계 속도(737-800 대략): 1~5는 250 kt, 15는 200 kt, 30은 175 kt. 속도를 줄인 뒤 펼칩니다.", "이륙 후에는 속도가 오를 때마다 단계적으로 접습니다. 한꺼번에 접으면 양력이 갑자기 줄어 가라앉습니다."],
      link: ["기종 페이지에서 날개와 제원 보기", "boeing-737"] },
    "learn-control": { sum: "선회는 에일러론으로 기울이고, 엘리베이터로 살짝 당기고, 러더로 미끄러짐을 정리합니다.",
      steps: ["오토파일럿 없이 30도 선회를 해 보세요. 기울이기만 하면 고도가 떨어지니 조금 당겨 고도를 지킵니다.", "옆바람 착륙: 바람 쪽으로 기수를 틀어 내려오다가, 닿기 직전 러더로 기수를 활주로에 맞추고 에일러론으로 바람 쪽 날개를 살짝 낮춥니다.", "엔진 하나가 멈추면 살아 있는 엔진 쪽으로 러더를 밟아 기수가 돌지 않게 잡습니다."],
      link: ["예약해서 옆바람 공항 연습하기", "book"] }
  };
  let lrDone = {}; try { lrDone = JSON.parse(localStorage.getItem("hub-lr-done") || "{}") || {}; } catch (e) { /* 무시 */ }
  function lrDoHtml(k) {
    const d = LR_DO[k]; if (!d) return "";
    return `<p class="lr-do-h">다음 비행에서 해 보기</p><ol class="lr-do">${d.steps.map((t, i) => { const id = k + ":" + i, on = !!lrDone[id]; return `<li><label class="lr-chk${on ? " on" : ""}"><input type="checkbox" data-lrdo="${id}"${on ? " checked" : ""}><span>${t}</span></label></li>`; }).join("")}</ol><a class="lr-go" href="#${d.link[1]}">${ICON.ext}이 사이트에서: ${d.link[0]} →</a><p class="small muted" style="margin:10px 0 0">수치는 737-800 기준 대략값입니다. 실제 기체나 시뮬레이터 기종의 교범 값이 우선입니다.</p>`;
  }
  document.addEventListener("change", e => { const c = e.target && e.target.getAttribute && e.target.getAttribute("data-lrdo"); if (!c) return; if (e.target.checked) lrDone[c] = 1; else delete lrDone[c]; try { localStorage.setItem("hub-lr-done", JSON.stringify(lrDone)); } catch (er) { /* 무시 */ } e.target.closest(".lr-chk").classList.toggle("on", e.target.checked); });
  /* ---------- 조종석에서는: 원리가 실제 비행에서 뜻하는 것 ---------- */
  const LR_PILOT = {
    "learn-forces": `<p>조종사가 직접 다루는 것은 두 가지, <b>자세(기수 각도)</b>와 <b>추력</b>입니다. 네 힘은 이 둘을 통해 간접적으로 조절됩니다.</p><ul class="lr-list"><li><b>추력을 올리면</b> 남는 힘이 생겨 빨라지거나(자세를 그대로 두면) 올라갑니다(기수를 들면).</li><li><b>기수를 들면</b> 속도를 고도로 바꾸는 셈입니다. 추력을 그대로 두면 오르면서 느려집니다.</li><li><b>순항</b>은 네 힘이 맞선 상태라 자동조종이 고도를, 자동 추력(오토스로틀)이 속도를 지킵니다.</li><li><b>착륙 접근</b>에서는 자세로 활공로를, 추력으로 속도를 맞추는 식으로 두 손잡이를 함께 씁니다.</li></ul>`,
    "learn-lift": `<p>속도계가 보여 주는 <b>지시 대기속도(IAS)</b>는 사실 양력 공식의 ½ρv², 곧 날개가 받는 공기 압력을 재는 값입니다. 그래서 고도가 달라도 같은 IAS면 날개는 비슷한 양력을 냅니다.</p><div class="lr-big"><span>지금 막대 값으로 본 계기 속도</span><b id="lr-p-ias">-</b><small id="lr-p-tas"></small></div><ul class="lr-list"><li>높이 오르면 공기가 옅어져, 같은 IAS를 내려면 실제 속도(진대기속도, TAS)가 훨씬 빨라야 합니다.</li><li>실속 속도와 이착륙 속도는 IAS로 정해져 있어, 높은 공항이나 더운 날(공기가 옅을 때) 활주로를 더 길게 씁니다.</li></ul>`,
    "learn-stall": `<p><b>실속은 어떤 속도에서도 일어날 수 있습니다.</b> 날개가 받는 무게가 커지면, 예를 들어 비행기를 기울여 선회하면 같은 속도에서도 받음각이 커지기 때문입니다.</p><div class="lr-ctl"><label for="lr-s-bank">선회 경사각 <b id="lr-s-bank-v">30°</b></label><input type="range" id="lr-s-bank" min="0" max="60" step="5" value="30"></div><div class="lr-big"><span>수평 비행보다 실속 속도가</span><b id="lr-p-vs">-</b><small id="lr-p-n"></small></div><ul class="lr-list"><li><b>회복의 첫 동작은 기수를 숙여 받음각을 줄이는 것</b>입니다. 그다음 날개를 수평으로, 추력을 맞추고, 원래 경로로 돌아옵니다(FAA 권고 순서).</li><li>추력만 올리고 기수를 계속 들고 있으면 실속에서 빠져나오지 못합니다.</li></ul>`,
    "learn-winglet": `<ul class="lr-list"><li><b>이륙과 상승</b>에서 유도항력이 가장 크기 때문에, 윙렛의 효과도 무겁게 이륙해 오를 때 잘 드러납니다. 상승 성능이 조금 좋아지고 연료가 줄어듭니다.</li><li><b>후류 간격</b> 관제사는 앞 비행기의 무게 등급에 따라 간격을 띄웁니다. 무거운 기종은 무선 호출에 'Heavy'를 붙여 알립니다.</li><li><b>후류 피하기</b> 앞 비행기의 비행 경로보다 위에 머물고, 착륙할 때는 앞 비행기가 땅에 닿은 지점보다 더 멀리 내려앉는 것이 기본입니다(미국 항공정보 매뉴얼).</li><li>바람이 약한 날 소용돌이가 활주로 위에 오래 남아, 간격이 더 필요할 수 있습니다.</li></ul>`,
    "learn-sweep": `<ul class="lr-list"><li>여객기는 <b>마하수</b>로 순항 속도를 맞춥니다(대개 마하 0.78~0.85). 최대 운용 마하(Mmo)를 넘으면 과속 경고가 울립니다.</li><li>높이 오를수록 실속 속도(IAS 기준 같아도 실제로는 빨라짐)와 마하 한계가 가까워져, 둘 사이 여유가 좁아집니다. 이 좁은 구간을 흔히 <b>코핀 코너</b>라고 부릅니다.</li><li>그래서 무거울 때는 너무 높이 오르지 않고, 난기류에서는 권장 통과 속도로 여유를 확보합니다.</li></ul>`,
    "learn-highlift": `<ul class="lr-list"><li><b>이륙 플랩</b>은 활주로 길이, 무게, 기온을 보고 정합니다. 깊게 펼치면 짧은 활주로에서 뜨기 쉽지만 상승은 둔해집니다.</li><li>이륙 뒤 속도가 오르면 정해진 속도마다 <b>단계적으로 접습니다</b>. 플랩마다 넘으면 안 되는 최대 속도(VFE)가 있습니다.</li><li><b>착륙</b>은 가장 깊은 단계를 주로 쓰고, 기준 속도 Vref는 실속 속도의 1.23배(감항 기준)입니다. 바람이 세면 여기에 몇 노트를 더합니다.</li></ul>`,
    "learn-control": `<ul class="lr-list"><li><b>선회</b> 에일러론으로 기울이고, 러더로 미끄러짐을 바로잡고(경사계 공을 가운데로), 엘리베이터를 조금 당겨 고도를 지킵니다. 세 축을 함께 씁니다.</li><li><b>엔진 하나가 멈추면</b> 남은 엔진 쪽으로 기체가 돌려 합니다. 러더로 이를 막을 수 있는 가장 낮은 속도가 최소 조종 속도(Vmc)입니다.</li><li><b>옆바람 착륙</b> 바람 쪽으로 기수를 틀어 내려오다가, 바퀴가 닿기 직전 러더로 기수를 활주로에 맞추고 에일러론으로 날개를 바람 쪽으로 살짝 낮춥니다.</li></ul>`
  };
  function lrPilot(h) {
    if (h === "learn-stall") { const b = $("#lr-s-bank"); if (!b) return; const ph = +b.value, n = 1 / Math.cos(ph * LR_TOR), f = Math.sqrt(n); $("#lr-s-bank-v").textContent = ph + "°"; $("#lr-p-vs").textContent = ph ? `${f.toFixed(2)}배 (+${Math.round((f - 1) * 100)}%)` : "그대로"; $("#lr-p-n").textContent = `하중계수 ${n.toFixed(2)}g. 날개가 무게의 ${n.toFixed(2)}배를 들어야 합니다.`; }
    if (h === "learn-lift") { const v = $("#lr-l-v"); if (!v) return; const tas = +v.value / 1.852, ias = tas * Math.sqrt(lrRho(+$("#lr-l-h").value) / 1.225); $("#lr-p-ias").textContent = Math.round(ias) + " kt"; $("#lr-p-tas").textContent = `실제 속도(TAS) ${Math.round(tas)} kt, 고도 ${fmt(+$("#lr-l-h").value)} m 기준 근사`; }
  }
  // 상자 배치: 3D 그림 / 원리와 조종석 (같은 높이) / 그래프와 공식 (같은 높이) / 나머지 / 주석 한 줄
  function lrArrange() {
    const g = document.querySelector("#app .grid.lr"); if (!g || g.dataset.arr) return; g.dataset.arr = "1";
    const cards = Array.from(g.children), stage = cards.find(c => c.classList.contains("lr-stage")), text = cards.find(c => c.classList.contains("c7")), facts = cards.find(c => c.classList.contains("c5")), pilot = cards.find(c => c.classList.contains("lr-pilot")), chart = cards.find(c => c.querySelector('[id^="lr-"][id$="chart"], #lr-l-cp, #lr-s-polar, #lr-w-span, #lr-sw-cd, #lr-h-cl')), note = cards.find(c => c.querySelector(".lr-note"));
    const row = (cls, a, b) => { const d = document.createElement("div"); d.className = "c12 lr-row " + cls; [a, b].forEach(x => { if (x) { x.classList.remove("c4", "c5", "c6", "c7", "c8", "c12"); d.appendChild(x); } }); return d; };
    const r2 = row("lr-row2", text, pilot), r3 = row("lr-row3", chart, facts);
    if (stage) stage.after(r2); r2.after(r3);
    if (note) { const p = note.querySelector(".lr-note"); g.after(p); note.remove(); }
  }
  const LR_PAGE_FNS = { "learn-forces": renderLearnForces, "learn-lift": renderLearnLift, "learn-stall": renderLearnStall, "learn-winglet": renderLearnWinglet, "learn-sweep": renderLearnSweep, "learn-highlift": renderLearnHighlift, "learn-control": renderLearnControl };
  const LEARN_PAGES = {};
  Object.keys(LR_PAGE_FNS).forEach(k => { LEARN_PAGES[k] = () => { let html = LR_PAGE_FNS[k](); const end = html.lastIndexOf("</div>"); html = html.slice(0, end) + `<section class="card c12 lr-pilot">${cardH(ICON.plane, "그래서 조종할 때는")}<div class="card-b lr-prose">${lrDoHtml(k)}<details class="lr-more"${k === "learn-stall" || k === "learn-lift" ? " open" : ""}><summary>왜 그런지 더 보기</summary>${LR_PILOT[k] || ""}</details></div></section>` + html.slice(end); html = lrEasyHtml(html, k); return typeof lr3wrap === "function" ? lr3wrap(html, k) : html; }; });
  const LEARN_TITLES = { "learn-forces": "네 가지 힘", "learn-lift": "양력", "learn-stall": "받음각과 실속", "learn-winglet": "윙렛", "learn-sweep": "후퇴익과 음속", "learn-highlift": "플랩과 슬랫", "learn-control": "조종면과 세 축" };
  const LEARN_UPD = { "learn-forces": lrForces, "learn-lift": lrLift, "learn-stall": lrStall, "learn-winglet": lrWinglet, "learn-sweep": lrSweep, "learn-highlift": lrHighlift, "learn-control": lrControl };
  function learnInit(h) { if (!LEARN_UPD[h]) return; lrArrange(); const f = LEARN_UPD[h]; f(); lrPilot(h); if (typeof lr3start === "function") lr3start(h); }
  document.addEventListener("input", e => { if (!e.target || !e.target.id || e.target.id.indexOf("lr-") !== 0) return; const h = (location.hash || "").slice(1), f = LEARN_UPD[h]; if (f) f(); lrPilot(h); });
  document.addEventListener("click", e => {
    const w = e.target.closest && e.target.closest("[data-lrw]"); if (w) { lrWL = w.getAttribute("data-lrw"); lrWinglet(); return; }
    const a = e.target.closest && e.target.closest("[data-lra]"); if (a) { lrAxis = a.getAttribute("data-lra"); const r = $("#lr-c-in"); if (r) r.value = 40; lrControl(); if (typeof lr3view === "function") lr3view({ roll: [1.57, 0.22, 0.95], pitch: [-0.08, 0.12, 0.95], yaw: [-0.6, 1.2, 0.9] }[lrAxis]); }
  });
