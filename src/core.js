/* ===== 렌더링 엔진 ===== */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fmt = n => Number(n).toLocaleString("ko-KR");
  const N = v => Math.round(v * 100) / 100;
  const rad = d => d * Math.PI / 180;
  const byId = {}; AIRCRAFT.forEach(a => { byId[a.id] = a; });
  const SHORT = { "boeing-737max": "737 MAX", "boeing-777x": "777X", "airbus-a320neo": "A320neo", "airbus-a330neo": "A330neo" };
  const short = ac => SHORT[ac.id] || (ac.maker === "airbus" ? ac.id.split("-")[1].replace(/^a/, "A") : ac.id.split("-")[1]);
  const makerName = m => m === "boeing" ? "보잉" : "에어버스";
  const dateKo = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); return m ? `${m[1]}년 ${+m[2]}월 ${+m[3]}일` : (iso || "-"); };
  const yearOf = iso => (iso || "").slice(0, 4);
  const inProd = ac => /생산 중|진행 중/.test(ac.status) && !/^생산 종료/.test(ac.status);

  /* ---------- 도면: 파라미터 ---------- */
  const DEFG = { sweep: 25, wingPos: 0.40, rootChord: 0.20, tipRatio: 0.28, stabSpan: 0.36, stabPos: 0.87, stabChord: 0.09,
    engineMount: "wing", enginePos: [0.33], engineDia: 2.0, tail: "conv", hump: "none", winglet: false, wingletSmall: false,
    finChord: 0.14, finSweep: 40, raked: false, foldTip: false };
  function geo(ac) { const g = Object.assign({}, DEFG, ac.geometry || {}); if (g.tail === "T") g.stabPos = 0.90; return g; }

  /* ---------- 평면도 (단위: m, 기수 = 원점, +x = 후방) ---------- */
  function topView(ac) {
    const g = geo(ac), S = ac.specs, L = S.length, B = S.span, w = S.width;
    const nL = w * 2.2, tL = w * 3.2, hs = B / 2, sw = Math.tan(rad(g.sweep + 3));
    const xr = g.wingPos * L, cr = g.rootChord * L, ct = cr * g.tipRatio, xt = xr + hs * sw;
    const wing = sgn => `M${N(xr)} 0 L${N(xt)} ${N(-hs * sgn)} L${N(xt + ct)} ${N(-hs * sgn)} L${N(xr + cr * 0.97)} ${N(-0.33 * hs * sgn)} L${N(xr + cr)} 0Z`;
    const xs = g.stabPos * L, hss = B * g.stabSpan / 2, sws = Math.tan(rad(g.sweep + 8)), crs = g.stabChord * L, cts = crs * 0.45;
    const stab = sgn => `M${N(xs)} 0 L${N(xs + hss * sws)} ${N(-hss * sgn)} L${N(xs + hss * sws + cts)} ${N(-hss * sgn)} L${N(xs + crs)} 0Z`;
    const fus = `M0 0 C${N(nL * 0.25)} ${N(-w * 0.25)} ${N(nL * 0.55)} ${N(-w * 0.5)} ${N(nL)} ${N(-w * 0.5)} L${N(L - tL)} ${N(-w * 0.5)} C${N(L - tL * 0.45)} ${N(-w * 0.5)} ${N(L - tL * 0.15)} ${N(-w * 0.2)} ${N(L)} ${N(-w * 0.1)} L${N(L)} ${N(w * 0.1)} C${N(L - tL * 0.15)} ${N(w * 0.2)} ${N(L - tL * 0.45)} ${N(w * 0.5)} ${N(L - tL)} ${N(w * 0.5)} L${N(nL)} ${N(w * 0.5)} C${N(nL * 0.55)} ${N(w * 0.5)} ${N(nL * 0.25)} ${N(w * 0.25)} 0 0Z`;
    let o = `<path class="wing" d="${wing(1)}"/><path class="wing" d="${wing(-1)}"/>`;
    if (g.tail !== "T") o += `<path class="stab" d="${stab(1)}"/><path class="stab" d="${stab(-1)}"/>`;
    const eW = g.engineDia, eL = eW * 2.3;
    if (g.engineMount === "wing") {
      g.enginePos.forEach(p => {
        const yc = p * hs, xle = xr + yc * sw, x0 = xle - eL * 0.6;
        [1, -1].forEach(sgn => { o += `<rect class="eng" x="${N(x0)}" y="${N(-yc * sgn - eW / 2)}" width="${N(eL)}" height="${N(eW)}" rx="${N(eW * 0.35)}"/>`; });
      });
    }
    if (g.foldTip) {
      const yf = hs - 3.5, xf = xr + yf * sw, chord = cr - (cr - ct) * (yf / hs) * 0.9;
      [1, -1].forEach(sgn => { o += `<line class="hinge" x1="${N(xf - 0.4)}" y1="${N(-yf * sgn)}" x2="${N(xf + chord + 0.4)}" y2="${N(-yf * sgn)}"/>`; });
    }
    o += `<path class="fus" d="${fus}"/>`;
    if (g.engineMount === "tail2" || g.engineMount === "tail3") {
      const eL2 = eW * 2.6, x0 = L * 0.76;
      [1, -1].forEach(sgn => { o += `<rect class="eng" x="${N(x0)}" y="${N(-(w / 2 + eW * 0.55) * sgn - eW / 2)}" width="${N(eL2)}" height="${N(eW)}" rx="${N(eW * 0.35)}"/>`; });
      if (g.engineMount === "tail3") o += `<rect class="eng" x="${N(L * 0.80)}" y="${N(-eW * 0.4)}" width="${N(L * 0.19)}" height="${N(eW * 0.8)}" rx="${N(eW * 0.3)}"/>`;
    }
    if (g.tail === "T") o += `<path class="stab" d="${stab(1)}"/><path class="stab" d="${stab(-1)}"/>`;
    return o;
  }

  /* ---------- 측면도 (동체 중심선 = y 0, 위쪽이 음수) ---------- */
  function sideView(ac) {
    const g = geo(ac), S = ac.specs, L = S.length, B = S.span, w = S.width, h = g.fuselageH || w;
    const nL = w * 2.0, tL = w * 3.4, hs = B / 2, sw = Math.tan(rad(g.sweep + 3));
    const gc = Math.max(1.6, w * 0.5), ground = h * 0.5 + gc;
    const finH = Math.max(h * 1.1, S.height - h - gc);
    const xr = g.wingPos * L, cr = g.rootChord * L, ct = cr * g.tipRatio, xt = xr + hs * sw, dh = hs * 0.105;
    let o = `<path class="fus" d="M0 ${N(h * 0.12)} C${N(nL * 0.15)} ${N(-h * 0.25)} ${N(nL * 0.5)} ${N(-h * 0.5)} ${N(nL)} ${N(-h * 0.5)} L${N(L - tL)} ${N(-h * 0.5)} C${N(L - tL * 0.5)} ${N(-h * 0.5)} ${N(L - tL * 0.15)} ${N(-h * 0.44)} ${N(L)} ${N(-h * 0.40)} L${N(L)} ${N(-h * 0.22)} C${N(L - tL * 0.2)} ${N(-h * 0.05)} ${N(L - tL * 0.6)} ${N(h * 0.5)} ${N(L - tL)} ${N(h * 0.5)} L${N(nL * 0.9)} ${N(h * 0.5)} C${N(nL * 0.45)} ${N(h * 0.5)} ${N(nL * 0.15)} ${N(h * 0.4)} 0 ${N(h * 0.12)}Z"/>`;
    if (g.hump === "hump") o += `<path class="fus" d="M${N(nL * 0.55)} ${N(-h * 0.5)} C${N(nL * 0.75)} ${N(-h * 0.9)} ${N(nL * 1.1)} ${N(-h * 0.98)} ${N(nL * 1.5)} ${N(-h * 0.98)} L${N(L * 0.28)} ${N(-h * 0.98)} C${N(L * 0.34)} ${N(-h * 0.98)} ${N(L * 0.38)} ${N(-h * 0.6)} ${N(L * 0.44)} ${N(-h * 0.5)}Z"/>`;
    const win = (y, x0, x1) => { let s = ""; for (let x = x0; x <= x1; x += 1.0) s += `<circle class="win" cx="${N(x)}" cy="${N(y)}" r="0.17"/>`; return s; };
    if (g.hump === "double") o += win(-h * 0.33, nL * 1.2, L - tL * 0.5) + win(h * 0.04, nL * 1.1, L - tL * 0.55);
    else { o += win(-h * 0.13, nL * 1.15, L - tL * 0.55); if (g.hump === "hump") o += win(-h * 0.78, nL * 1.5, L * 0.26); }
    if (g.hump === "hump") o += `<path class="cock" d="M${N(nL * 0.72)} ${N(-h * 0.84)} L${N(nL * 1.15)} ${N(-h * 0.9)} L${N(nL * 1.12)} ${N(-h * 0.76)} L${N(nL * 0.8)} ${N(-h * 0.72)}Z"/>`;
    else if (g.hump === "double") o += `<path class="cock" d="M${N(nL * 0.5)} ${N(-h * 0.2)} L${N(nL * 0.9)} ${N(-h * 0.27)} L${N(nL * 0.88)} ${N(-h * 0.1)} L${N(nL * 0.55)} ${N(-h * 0.05)}Z"/>`;
    else o += `<path class="cock" d="M${N(nL * 0.5)} ${N(-h * 0.40)} L${N(nL * 0.95)} ${N(-h * 0.47)} L${N(nL * 0.9)} ${N(-h * 0.30)} L${N(nL * 0.55)} ${N(-h * 0.25)}Z"/>`;
    const eW = g.engineDia, eL = eW * 2.3;
    if (g.engineMount === "tail3") o += `<rect class="eng" x="${N(L * 0.75)}" y="${N(-h * 0.5 - eW * 0.85)}" width="${N(L * 0.23)}" height="${N(eW)}" rx="${N(eW * 0.4)}"/>`;
    const fs = Math.tan(rad(g.finSweep)), fr = g.finChord * L, ft = fr * 0.42;
    const tipTE = L * 0.995, tipLE = tipTE - ft, rootLE = tipLE - finH * fs, rootTE = Math.min(L, rootLE + fr), yTop = -h * 0.5 - finH;
    o += `<path class="fin" d="M${N(rootLE - fr * 0.5)} ${N(-h * 0.5)} L${N(rootLE)} ${N(-h * 0.5)} L${N(rootLE + fr * 0.12)} ${N(-h * 0.5 - finH * 0.12)}Z"/>`;
    o += `<path class="fin" d="M${N(rootLE)} ${N(-h * 0.5)} L${N(tipLE)} ${N(yTop)} L${N(tipTE)} ${N(yTop)} L${N(rootTE)} ${N(-h * 0.42)}Z"/>`;
    const xs = g.stabPos * L, hss = B * g.stabSpan / 2, sws = Math.tan(rad(g.sweep + 8)), crs = g.stabChord * L, cts = crs * 0.45;
    if (g.tail === "T") { const y = yTop - 0.35, x2 = tipTE + hss * sws * 0.35; o += `<path class="stab" d="M${N(tipLE - 1.2)} ${N(y)} L${N(x2)} ${N(y)} L${N(x2)} ${N(y + 0.45)} L${N(tipLE - 1.2)} ${N(y + 0.45)}Z"/>`; }
    else { const rise = hss * 0.12; o += `<path class="stab" d="M${N(xs)} ${N(-h * 0.26)} L${N(xs + crs)} ${N(-h * 0.26)} L${N(xs + hss * sws + cts)} ${N(-h * 0.26 - rise)} L${N(xs + hss * sws)} ${N(-h * 0.26 - rise)}Z"/>`; }
    o += `<path class="wing" d="M${N(xr)} ${N(h * 0.22)} L${N(xt)} ${N(h * 0.22 - dh)} L${N(xt + ct)} ${N(h * 0.26 - dh)} L${N(xr + cr)} ${N(h * 0.40)} L${N(xr + cr * 0.25)} ${N(h * 0.44)}Z"/>`;
    if (g.winglet) { const wh = g.wingletSmall ? w * 0.3 : w * 0.6, y0 = h * 0.22 - dh; o += `<path class="wing" d="M${N(xt + ct * 0.15)} ${N(y0)} L${N(xt + ct * 0.7)} ${N(y0 - wh)} L${N(xt + ct * 0.95)} ${N(y0 - wh + 0.3)} L${N(xt + ct)} ${N(y0 + 0.2)}Z"/>`; }
    if (g.engineMount === "wing") {
      g.enginePos.slice().sort((a, b) => b - a).forEach(p => {
        const yc = p * hs, xle = xr + yc * sw, yw = h * 0.22 - p * dh;
        o += `<rect class="pylon" x="${N(xle - eL * 0.25)}" y="${N(yw - 0.1)}" width="${N(eL * 0.6)}" height="${N(eW * 0.45)}"/>`;
        o += `<rect class="eng" x="${N(xle - eL * 0.62)}" y="${N(yw + eW * 0.12)}" width="${N(eL)}" height="${N(eW)}" rx="${N(eW * 0.3)}"/>`;
      });
    } else { o += `<rect class="eng" x="${N(L * 0.76)}" y="${N(-h * 0.44)}" width="${N(eW * 2.6)}" height="${N(eW)}" rx="${N(eW * 0.35)}"/>`; }
    o += `<line class="gear" x1="${N(nL)}" y1="${N(h * 0.45)}" x2="${N(nL)}" y2="${N(ground - 0.55)}"/><circle class="tyre" cx="${N(nL)}" cy="${N(ground - 0.55)}" r="0.55"/>`;
    const xm = xr + cr * 0.72;
    o += `<line class="gear" x1="${N(xm)}" y1="${N(h * 0.4)}" x2="${N(xm)}" y2="${N(ground - 0.6)}"/>`;
    (ac.category === "wide" ? [-1.3, 0, 1.3] : [-0.65, 0.65]).forEach(dx => { o += `<circle class="tyre" cx="${N(xm + dx)}" cy="${N(ground - 0.6)}" r="0.6"/>`; });
    o += `<line class="ground" x1="-2" y1="${N(ground)}" x2="${N(L + 2)}" y2="${N(ground)}"/>`;
    return { svg: o, top: yTop, ground: ground, h: h };
  }

  /* ---------- 치수선 ---------- */
  const dimH = (x1, x2, y, label, s) => `<g class="dim"><line x1="${N(x1)}" y1="${N(y)}" x2="${N(x2)}" y2="${N(y)}"/><line x1="${N(x1)}" y1="${N(y - 0.9)}" x2="${N(x1)}" y2="${N(y + 0.9)}"/><line x1="${N(x2)}" y1="${N(y - 0.9)}" x2="${N(x2)}" y2="${N(y + 0.9)}"/><text x="${N((x1 + x2) / 2)}" y="${N(y - 0.7)}" text-anchor="middle" font-size="${N(12 / s)}">${esc(label)}</text></g>`;
  const dimV = (x, y1, y2, label, s) => `<g class="dim"><line x1="${N(x)}" y1="${N(y1)}" x2="${N(x)}" y2="${N(y2)}"/><line x1="${N(x - 0.9)}" y1="${N(y1)}" x2="${N(x + 0.9)}" y2="${N(y1)}"/><line x1="${N(x - 0.9)}" y1="${N(y2)}" x2="${N(x + 0.9)}" y2="${N(y2)}"/><text transform="translate(${N(x + 1.3)} ${N((y1 + y2) / 2)}) rotate(90)" text-anchor="middle" font-size="${N(12 / s)}">${esc(label)}</text></g>`;

  /* ---------- 3면도(평면+측면) ---------- */
  function threeView(ac) {
    const S = ac.specs, L = S.length, B = S.span, W = 760;
    const s = (W - 20) / (L + 16);
    const sv = sideView(ac);
    const topH = B + 8, sideH = (sv.ground - sv.top) + 6;
    const H = (topH + sideH) * s + 16;
    const oyTop = B / 2 + 3, oySide = topH + 3 - sv.top;
    return `<svg class="ac-svg tv" viewBox="0 0 ${W} ${N(H)}" role="img" aria-label="${esc(ac.name)} 평면도와 측면도, 길이 ${L}m 날개폭 ${B}m 높이 ${S.height}m">
<g transform="translate(10 8) scale(${N(s)})">
<g transform="translate(2 ${N(oyTop)})"><text class="vlabel" x="0" y="${N(-B / 2 - 1.2)}" font-size="${N(11 / s)}">평면도</text>${topView(ac)}${dimH(0, L, B / 2 + 3.6, `길이 ${L} m`, s)}${dimV(L + 4.5, -B / 2, B / 2, `날개폭 ${B} m`, s)}</g>
<g transform="translate(2 ${N(oySide)})"><text class="vlabel" x="0" y="${N(sv.top - 1.2)}" font-size="${N(11 / s)}">측면도</text>${sv.svg}${dimV(L + 4.5, sv.top, sv.ground, `높이 ${S.height} m`, s)}</g>
</g></svg>`;
  }

  /* ---------- 객실 단면도 ---------- */
  function seatRow(cfg, floorY, cabinW) {
    const groups = cfg.split("-").map(Number), n = groups.reduce((a, b) => a + b, 0), aisleW = 0.5;
    const seatW = (cabinW - (groups.length - 1) * aisleW) / n, seatH = 1.05;
    let x = -cabinW / 2, o = "";
    groups.forEach(gN => { for (let i = 0; i < gN; i++) { o += `<rect class="seat" x="${N(x + seatW * 0.09)}" y="${N(floorY - seatH)}" width="${N(seatW * 0.82)}" height="${N(seatH)}" rx="0.12"/><rect class="seat2" x="${N(x + seatW * 0.09)}" y="${N(floorY - 0.42)}" width="${N(seatW * 0.82)}" height="0.3"/>`; x += seatW; } x += aisleW; });
    return o;
  }
  function crossSection(ac) {
    const g = geo(ac), S = ac.specs, w = S.width, h = g.fuselageH || w, rx = w / 2, ry = h / 2;
    const extraTop = g.hump === "hump" ? ry * 0.55 : 0;
    const s = 200 / (w + 1.0), W = 240, H = (h + extraTop + 2.0) * s + 6;
    const widthAt = y => 2 * rx * Math.sqrt(Math.max(0, 1 - (y / ry) * (y / ry))) * 0.92;
    let o = "";
    const cfg = typeof ac.cabin === "string" ? { lower: ac.cabin } : ac.cabin;
    if (g.hump === "hump") {
      const r = rx * 0.68, c = -1.5 * ry + r, y = (c * c - r * r + ry * ry) / (2 * c), x = Math.sqrt(Math.max(0, ry * ry - y * y));
      o += `<circle class="fs-fill" cx="0" cy="${N(c)}" r="${N(r)}"/><ellipse class="fs-fill" cx="0" cy="0" rx="${N(rx)}" ry="${N(ry)}"/>`;
      o += `<path class="fs-line" d="M${N(x)} ${N(y)} A${N(ry)} ${N(ry)} 0 1 1 ${N(-x)} ${N(y)}"/><path class="fs-line" d="M${N(-x)} ${N(y)} A${N(r)} ${N(r)} 0 1 1 ${N(x)} ${N(y)}"/>`;
      const yu = c + r * 0.32, xu = Math.sqrt(Math.max(0, r * r - (r * 0.32) ** 2)) * 0.9;
      o += `<line class="floor" x1="${N(-xu)}" y1="${N(yu)}" x2="${N(xu)}" y2="${N(yu)}"/>` + seatRow(cfg.upper, yu, xu * 2 * 0.95);
      const yl = ry * 0.26; o += `<line class="floor" x1="${N(-widthAt(yl) / 2)}" y1="${N(yl)}" x2="${N(widthAt(yl) / 2)}" y2="${N(yl)}"/>` + seatRow(cfg.lower, yl, widthAt(yl));
      o += cargo(yl, w, widthAt);
    } else {
      o += `<ellipse class="fs-fill" cx="0" cy="0" rx="${N(rx)}" ry="${N(ry)}"/><ellipse class="fs-line" cx="0" cy="0" rx="${N(rx)}" ry="${N(ry)}"/>`;
      if (g.hump === "double") {
        const yu = -ry * 0.26, yl = ry * 0.36;
        o += `<line class="floor" x1="${N(-widthAt(yu) / 2)}" y1="${N(yu)}" x2="${N(widthAt(yu) / 2)}" y2="${N(yu)}"/>` + seatRow(cfg.upper, yu, widthAt(yu));
        o += `<line class="floor" x1="${N(-widthAt(yl) / 2)}" y1="${N(yl)}" x2="${N(widthAt(yl) / 2)}" y2="${N(yl)}"/>` + seatRow(cfg.lower, yl, widthAt(yl));
        o += cargo(yl, w, widthAt);
      } else {
        const yl = ac.category === "wide" ? ry * 0.22 : ry * 0.28;
        o += `<line class="floor" x1="${N(-widthAt(yl) / 2)}" y1="${N(yl)}" x2="${N(widthAt(yl) / 2)}" y2="${N(yl)}"/>` + seatRow(cfg.lower, yl, widthAt(yl));
        o += cargo(yl, w, widthAt);
      }
    }
    o += `<g class="dim"><line x1="${N(-rx)}" y1="${N(-ry - extraTop - 0.5)}" x2="${N(rx)}" y2="${N(-ry - extraTop - 0.5)}"/><text x="0" y="${N(-ry - extraTop - 0.8)}" text-anchor="middle" font-size="${N(11 / s)}">동체 폭 ${w} m</text></g>`;
    return `<svg class="ac-svg cs" viewBox="0 0 ${W} ${N(H)}" role="img" aria-label="${esc(ac.name)} 객실 단면도, 좌석 배치 ${esc(cabinLabel(ac))}"><g transform="translate(${W / 2} ${N((extraTop + ry + 1.6) * s)}) scale(${N(s)})">${o}</g></svg>`;
  }
  function cargo(floorY, w, widthAt) {
    let o = "", y0 = floorY + 0.22;
    if (w >= 5.5) { [-0.08 - 1.53, 0.08].forEach(x => { o += `<rect class="cargo" x="${N(x)}" y="${N(y0)}" width="1.53" height="1.5" rx="0.1"/>`; }); }
    else if (w >= 4.5) { [-0.08 - 1.19, 0.08].forEach(x => { o += `<rect class="cargo" x="${N(x)}" y="${N(y0)}" width="1.19" height="1.4" rx="0.1"/>`; }); }
    else { const cw = Math.min(1.8, widthAt(y0 + 0.9) * 0.9); o += `<rect class="cargo" x="${N(-cw / 2)}" y="${N(y0)}" width="${N(cw)}" height="0.85" rx="0.1"/>`; }
    return o;
  }
  const cabinLabel = ac => typeof ac.cabin === "string" ? ac.cabin : `하층 ${ac.cabin.lower}, 상층 ${ac.cabin.upper}`;

  /* ---------- 소형 실루엣 (카드·라인업) ---------- */
  function silhouette(ac, s, W, H) {
    const L = ac.specs.length;
    return `<svg class="ac-svg sil" viewBox="0 0 ${W} ${H}" aria-hidden="true"><g transform="translate(${N((W - L * s) / 2)} ${H / 2}) scale(${s})">${topView(ac)}</g></svg>`;
  }

  /* ---------- 차트: 항속거리 × 좌석 ---------- */
  const LABEL_POS = { "boeing-737": "left", "airbus-a320": "above", "airbus-a320neo": "below", "boeing-727": "left", "boeing-747": "left",
    "boeing-777": "right", "airbus-a340": "above", "airbus-a330neo": "below", "boeing-767": "above", "airbus-a310": "below", "boeing-707": "below", "airbus-a330": "left" };
  function scatterChart() {
    const W = 760, H = 440, m = { l: 56, r: 24, t: 20, b: 44 };
    const x0 = 2000, x1 = 19000, y0 = 80, y1 = 580;
    const X = v => m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r), Y = v => H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b);
    let o = "";
    for (let v = 100; v <= 500; v += 100) o += `<line class="grid" x1="${m.l}" y1="${N(Y(v))}" x2="${W - m.r}" y2="${N(Y(v))}"/><text class="tick" x="${m.l - 8}" y="${N(Y(v) + 4)}" text-anchor="end">${v}</text>`;
    for (let v = 4000; v <= 18000; v += 2000) o += `<line class="grid" x1="${N(X(v))}" y1="${m.t}" x2="${N(X(v))}" y2="${H - m.b}"/><text class="tick" x="${N(X(v))}" y="${H - m.b + 18}" text-anchor="middle">${fmt(v)}</text>`;
    o += `<text class="axis" x="${W - m.r}" y="${H - 6}" text-anchor="end">항속거리 (km)</text><text class="axis" transform="translate(14 ${m.t + 4}) rotate(90)">표준 좌석 수</text>`;
    AIRCRAFT.forEach(ac => {
      const S = ac.specs, cx = X(S.range), cy = Y(S.seats), r = 4 + Math.sqrt(S.mtow) * 0.45, pos = LABEL_POS[ac.id] || "right";
      let lx = cx + r + 4, ly = cy + 4, an = "start";
      if (pos === "left") { lx = cx - r - 4; an = "end"; } else if (pos === "above") { lx = cx; ly = cy - r - 5; an = "middle"; } else if (pos === "below") { lx = cx; ly = cy + r + 13; an = "middle"; }
      o += `<g class="pt mk-${ac.maker}" data-tip="${esc(`<b>${ac.name}</b><br>항속거리 ${fmt(S.range)} km, 표준 ${S.seats}석 (최대 ${S.seatsMax}석)<br>최대이륙중량 ${S.mtow} t`)}" data-href="#${ac.id}"><circle cx="${N(cx)}" cy="${N(cy)}" r="${N(r)}"/><text x="${N(lx)}" y="${N(ly)}" text-anchor="${an}">${esc(short(ac))}</text></g>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="기종별 항속거리와 표준 좌석 수 산점도. 원의 크기는 최대이륙중량.">${o}</svg>`;
  }

  /* ---------- 차트: 연도별 인도 ---------- */
  function deliveryChart() {
    const W = 760, H = 300, m = { l: 48, r: 16, t: 22, b: 34 }, D = SITE.deliveries;
    const gw = (W - m.l - m.r) / D.length, bw = Math.min(11, gw * 0.36), yMax = 900;
    const Y = v => H - m.b - v / yMax * (H - m.t - m.b);
    let o = "";
    for (let v = 0; v <= yMax; v += 300) o += `<line class="grid" x1="${m.l}" y1="${N(Y(v))}" x2="${W - m.r}" y2="${N(Y(v))}"/><text class="tick" x="${m.l - 8}" y="${N(Y(v) + 4)}" text-anchor="end">${v}</text>`;
    D.forEach((d, i) => {
      const gx = m.l + i * gw + gw / 2;
      o += `<g data-tip="${esc(`<b>${d[0]}년</b><br>보잉 ${fmt(d[1])}대, 에어버스 ${fmt(d[2])}대`)}"><rect class="hit" x="${N(gx - gw / 2)}" y="${m.t}" width="${N(gw)}" height="${H - m.t - m.b}"/>`;
      o += `<rect class="bar mk-boeing" x="${N(gx - bw - 1)}" y="${N(Y(d[1]))}" width="${bw}" height="${N(Y(0) - Y(d[1]))}" rx="2"/>`;
      o += `<rect class="bar mk-airbus" x="${N(gx + 1)}" y="${N(Y(d[2]))}" width="${bw}" height="${N(Y(0) - Y(d[2]))}" rx="2"/></g>`;
      if (d[0] % 5 === 0) o += `<text class="tick" x="${N(gx)}" y="${H - m.b + 16}" text-anchor="middle">${d[0]}</text>`;
    });
    const last = D[D.length - 1], gx = m.l + (D.length - 1) * gw + gw / 2;
    o += `<text class="vlab mk-boeing" x="${N(gx - bw - 1)}" y="${N(Y(last[1]) - 5)}" text-anchor="end">${last[1]}</text><text class="vlab mk-airbus" x="${N(gx + bw + 2)}" y="${N(Y(last[2]) - 5)}" text-anchor="start">${last[2]}</text>`;
    o += `<line class="axis-line" x1="${m.l}" y1="${N(Y(0))}" x2="${W - m.r}" y2="${N(Y(0))}"/>`;
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="2000년부터 2025년까지 보잉과 에어버스의 연간 민간기 인도 대수 막대 그래프">${o}</svg>`;
  }

  /* ---------- 차트: 초도비행 연표 ---------- */
  function firstFlightTimeline() {
    const W = 760, H = 300, m = { l: 24, r: 24 }, y0 = 1952, y1 = 2026;
    const X = y => m.l + (y - y0) / (y1 - y0) * (W - m.l - m.r);
    const lanes = { boeing: 96, airbus: 214 };
    let o = "";
    for (let y = 1960; y <= 2020; y += 10) o += `<line class="grid" x1="${N(X(y))}" y1="40" x2="${N(X(y))}" y2="${H - 30}"/><text class="tick" x="${N(X(y))}" y="${H - 12}" text-anchor="middle">${y}</text>`;
    ["boeing", "airbus"].forEach(mk => {
      const ly = lanes[mk];
      o += `<line class="lane mk-${mk}" x1="${m.l}" y1="${ly}" x2="${W - m.r}" y2="${ly}"/><text class="lanelab mk-${mk}" x="${m.l}" y="${ly - 46}">${makerName(mk)}</text>`;
      const list = AIRCRAFT.filter(a => a.maker === mk).sort((a, b) => a.firstFlight.localeCompare(b.firstFlight));
      list.forEach((ac, i) => {
        const d = new Date(ac.firstFlight), yr = d.getFullYear() + d.getMonth() / 12, x = X(yr);
        const slot = i % 4, dy = [-18, 26, -34, 42][slot];
        o += `<g class="ev mk-${mk}" data-href="#${ac.id}" data-tip="${esc(`<b>${ac.name}</b><br>초도비행 ${dateKo(ac.firstFlight)}<br>취항 ${dateKo(ac.intro)}`)}"><line x1="${N(x)}" y1="${ly}" x2="${N(x)}" y2="${N(ly + dy + (dy < 0 ? 4 : -10))}"/><circle cx="${N(x)}" cy="${ly}" r="5"/><text x="${N(x)}" y="${N(ly + dy)}" text-anchor="middle">${esc(short(ac))} <tspan class="yr">${d.getFullYear()}</tspan></text></g>`;
      });
    });
    return `<svg class="chart tl" viewBox="0 0 ${W} ${H}" role="img" aria-label="보잉과 에어버스 기종의 초도비행 연도 연표">${o}</svg>`;
  }

