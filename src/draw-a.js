  /* ---------- 도면 공통 치수 ---------- */
  function wingGeom(ac) {
    const g = geo(ac), S = ac.specs, L = S.length, B = S.span, w = S.width, hs = B / 2, sw = Math.tan(rad(g.sweep + 3));
    const xr = g.wingPos * L, cr = g.rootChord * L, ct = cr * g.tipRatio, xt = xr + hs * sw, h = g.fuselageH || w;
    const gc = Math.max(1.6, w * 0.5), ground = h * 0.5 + gc, finH = Math.max(h * 1.1, S.height - h - gc);
    return { g: g, S: S, L: L, B: B, w: w, h: h, hs: hs, sw: sw, xr: xr, cr: cr, ct: ct, xt: xt, kink: 0.33, gc: gc, ground: ground, finH: finH, yTop: -h * 0.5 - finH, wide: ac.category === "wide" };
  }
  const leX = (G, f) => G.xr + f * G.hs * G.sw;
  const teX = (G, f) => f <= G.kink ? G.xr + G.cr - G.cr * 0.03 * (f / G.kink) : (G.xr + G.cr * 0.97) + ((G.xt + G.ct) - (G.xr + G.cr * 0.97)) * ((f - G.kink) / (1 - G.kink));
  // 착륙장치: 주 착륙장치 한 묶음의 축 수와 바퀴 크기
  function gearSpec(G, ac) {
    const m = G.S.mtow, axles = m < 110 ? 1 : m < 330 ? 2 : 3, rM = G.wide ? 0.66 : 0.55, rN = G.wide ? 0.52 : 0.4;
    const sets = ac.id === "boeing-747" ? [[-1.9, 2], [1.9, 2]] : ac.id === "airbus-a380" ? [[-2.3, 2], [2.4, 3]] : ac.id === "airbus-a340" ? [[0, 2]] : [[0, axles]];
    return { rM: rM, rN: rN, sets: sets, track: G.w * (G.wide ? 1.75 : 1.6) };
  }

  /* ---------- 평면도 (단위: m, 기수 = 원점, +x = 후방) ---------- */
  function nacelleTop(x0, yc, eL, eW) {
    const r = eW / 2;
    return `<path class="eng" d="M${N(x0 + r * 0.45)} ${N(yc - r)} L${N(x0 + eL * 0.7)} ${N(yc - r * 0.9)} L${N(x0 + eL)} ${N(yc - r * 0.52)} L${N(x0 + eL)} ${N(yc + r * 0.52)} L${N(x0 + eL * 0.7)} ${N(yc + r * 0.9)} L${N(x0 + r * 0.45)} ${N(yc + r)} Q${N(x0)} ${N(yc + r)} ${N(x0)} ${N(yc + r * 0.5)} L${N(x0)} ${N(yc - r * 0.5)} Q${N(x0)} ${N(yc - r)} ${N(x0 + r * 0.45)} ${N(yc - r)}Z"/><path class="det" d="M${N(x0 + r * 0.5)} ${N(yc - r * 0.97)} L${N(x0 + r * 0.5)} ${N(yc + r * 0.97)} M${N(x0 + eL * 0.7)} ${N(yc - r * 0.88)} L${N(x0 + eL * 0.7)} ${N(yc + r * 0.88)}"/>`;
  }
  function topView(ac) {
    const G = wingGeom(ac), g = G.g, L = G.L, w = G.w, hs = G.hs, nL = w * 2.2, tL = w * 3.2;
    const wing = sgn => {
      const y = f => N(-f * hs * sgn);
      let d = `M${N(G.xr - G.cr * 0.06)} 0 L${N(leX(G, 0.07))} ${y(0.07)}`;
      d += g.raked ? ` L${N(leX(G, 0.9))} ${y(0.9)} Q${N(leX(G, 1) + G.ct * 0.15)} ${y(1)} ${N(G.xt + G.ct * 1.3)} ${y(1)}` : ` L${N(G.xt)} ${y(1)} L${N(G.xt + G.ct)} ${y(1)}`;
      return `<path class="wing" d="${d} L${N(teX(G, G.kink))} ${y(G.kink)} L${N(G.xr + G.cr)} 0Z"/>`;
    };
    const wingDet = sgn => {
      const y = f => N(-f * hs * sgn), ch = f => teX(G, f) - leX(G, f), hx = f => teX(G, f) - ch(f) * 0.25, sx = f => leX(G, f) + ch(f) * 0.09;
      let d = `M${N(hx(0.13))} ${y(0.13)} L${N(hx(G.kink))} ${y(G.kink)} L${N(hx(0.93))} ${y(0.93)} M${N(hx(G.kink))} ${y(G.kink)} L${N(teX(G, G.kink))} ${y(G.kink)} M${N(hx(0.7))} ${y(0.7)} L${N(teX(G, 0.7))} ${y(0.7)} M${N(sx(0.17))} ${y(0.17)} L${N(sx(0.94))} ${y(0.94)}`;
      let o = `<path class="det" d="${d}"/>`;
      if (g.winglet && !g.raked) o += `<line class="det tip" x1="${N(G.xt + G.ct * 0.08)}" y1="${y(1)}" x2="${N(G.xt + G.ct * 1.02)}" y2="${y(1)}"/>`;
      return o;
    };
    const xs = g.stabPos * L, hss = G.B * g.stabSpan / 2, sws = Math.tan(rad(g.sweep + 8)), crs = g.stabChord * L, cts = crs * 0.45;
    const stab = sgn => `<path class="stab" d="M${N(xs)} 0 L${N(xs + hss * sws)} ${N(-hss * sgn)} L${N(xs + hss * sws + cts)} ${N(-hss * sgn)} L${N(xs + crs)} 0Z"/><line class="det" x1="${N(xs + crs * 0.7)}" y1="${N(-hss * 0.14 * sgn)}" x2="${N(xs + hss * sws + cts * 0.62)}" y2="${N(-hss * 0.96 * sgn)}"/>`;
    const fus = `M0 0 C${N(nL * 0.25)} ${N(-w * 0.25)} ${N(nL * 0.55)} ${N(-w * 0.5)} ${N(nL)} ${N(-w * 0.5)} L${N(L - tL)} ${N(-w * 0.5)} C${N(L - tL * 0.45)} ${N(-w * 0.5)} ${N(L - tL * 0.15)} ${N(-w * 0.2)} ${N(L)} ${N(-w * 0.1)} L${N(L)} ${N(w * 0.1)} C${N(L - tL * 0.15)} ${N(w * 0.2)} ${N(L - tL * 0.45)} ${N(w * 0.5)} ${N(L - tL)} ${N(w * 0.5)} L${N(nL)} ${N(w * 0.5)} C${N(nL * 0.55)} ${N(w * 0.5)} ${N(nL * 0.25)} ${N(w * 0.25)} 0 0Z`;
    let o = wing(1) + wing(-1);
    if (g.tail !== "T") o += stab(1) + stab(-1);
    o += wingDet(1) + wingDet(-1);
    const eW = g.engineDia, eL = eW * 2.3;
    if (g.engineMount === "wing") g.enginePos.forEach(p => { const yc = p * hs, x0 = leX(G, p) - eL * 0.62; [1, -1].forEach(sgn => { o += nacelleTop(x0, -yc * sgn, eL, eW); }); });
    if (g.foldTip) { const yf = hs - 3.5, f = yf / hs; [1, -1].forEach(sgn => { o += `<line class="hinge" x1="${N(leX(G, f) - 0.4)}" y1="${N(-yf * sgn)}" x2="${N(teX(G, f) + 0.4)}" y2="${N(-yf * sgn)}"/>`; }); }
    o += `<path class="fus" d="${fus}"/>`;
    o += `<path class="cock" d="M${N(nL * 0.3)} ${N(-w * 0.19)} Q${N(nL * 0.22)} 0 ${N(nL * 0.3)} ${N(w * 0.19)} L${N(nL * 0.52)} ${N(w * 0.34)} Q${N(nL * 0.42)} 0 ${N(nL * 0.52)} ${N(-w * 0.34)}Z"/>`;
    o += `<path class="det" d="M${N(L * 0.86)} 0 L${N(L - 0.3)} 0"/>`;
    if (g.engineMount === "tail2" || g.engineMount === "tail3") {
      const eL2 = eW * 2.6, x0 = L * 0.755;
      [1, -1].forEach(sgn => { o += nacelleTop(x0, -(w / 2 + eW * 0.55) * sgn, eL2, eW); });
      if (g.engineMount === "tail3") o += `<path class="eng" d="M${N(L * 0.77)} ${N(-eW * 0.42)} L${N(L * 0.86)} ${N(-eW * 0.3)} L${N(L * 0.86)} ${N(eW * 0.3)} L${N(L * 0.77)} ${N(eW * 0.42)} Q${N(L * 0.755)} 0 ${N(L * 0.77)} ${N(-eW * 0.42)}Z"/>`;
    }
    if (g.tail === "T") o += stab(1) + stab(-1);
    return o;
  }

  /* ---------- 측면도 (동체 중심선 = y 0, 위쪽이 음수) ---------- */
  function nacelleSide(x0, y0, eL, eW) {
    return `<path class="eng" d="M${N(x0)} ${N(y0 + eW * 0.08)} Q${N(x0 + eW * 0.1)} ${N(y0)} ${N(x0 + eW * 0.5)} ${N(y0)} L${N(x0 + eL * 0.72)} ${N(y0 + eW * 0.06)} L${N(x0 + eL * 0.74)} ${N(y0 + eW * 0.2)} L${N(x0 + eL)} ${N(y0 + eW * 0.32)} L${N(x0 + eL)} ${N(y0 + eW * 0.68)} L${N(x0 + eL * 0.74)} ${N(y0 + eW * 0.8)} L${N(x0 + eL * 0.72)} ${N(y0 + eW * 0.94)} L${N(x0 + eW * 0.5)} ${N(y0 + eW)} Q${N(x0 + eW * 0.1)} ${N(y0 + eW)} ${N(x0)} ${N(y0 + eW * 0.92)}Z"/><path class="det" d="M${N(x0 + eW * 0.2)} ${N(y0 + eW * 0.03)} L${N(x0 + eW * 0.2)} ${N(y0 + eW * 0.97)} M${N(x0 + eL * 0.72)} ${N(y0 + eW * 0.06)} L${N(x0 + eL * 0.72)} ${N(y0 + eW * 0.94)}"/>`;
  }
  function sideView(ac) {
    const G = wingGeom(ac), g = G.g, L = G.L, w = G.w, h = G.h, hs = G.hs;
    const boeing = ac.maker === "boeing" && ac.id !== "boeing-717", nL = w * (boeing ? 2.15 : 1.85), tL = w * 3.4, noseY = h * (boeing ? 0.1 : 0.15);
    const ground = G.ground, finH = G.finH, yTop = G.yTop, dh = hs * 0.105, gs = gearSpec(G, ac);
    let o = "";
    // 동체
    o += `<path class="fus" d="M0 ${N(noseY)} C${N(nL * 0.12)} ${N(-h * (boeing ? 0.2 : 0.3))} ${N(nL * 0.48)} ${N(-h * 0.5)} ${N(nL)} ${N(-h * 0.5)} L${N(L - tL)} ${N(-h * 0.5)} C${N(L - tL * 0.5)} ${N(-h * 0.5)} ${N(L - tL * 0.15)} ${N(-h * 0.44)} ${N(L)} ${N(-h * 0.4)} L${N(L)} ${N(-h * 0.24)} C${N(L - tL * 0.2)} ${N(-h * 0.06)} ${N(L - tL * 0.6)} ${N(h * 0.5)} ${N(L - tL)} ${N(h * 0.5)} L${N(nL * 0.9)} ${N(h * 0.5)} C${N(nL * 0.45)} ${N(h * 0.5)} ${N(nL * 0.14)} ${N(h * 0.42)} 0 ${N(noseY)}Z"/>`;
    if (g.hump === "hump") o += `<path class="fus" d="M${N(nL * 0.55)} ${N(-h * 0.5)} C${N(nL * 0.75)} ${N(-h * 0.9)} ${N(nL * 1.1)} ${N(-h * 0.98)} ${N(nL * 1.5)} ${N(-h * 0.98)} L${N(L * 0.28)} ${N(-h * 0.98)} C${N(L * 0.34)} ${N(-h * 0.98)} ${N(L * 0.38)} ${N(-h * 0.6)} ${N(L * 0.44)} ${N(-h * 0.5)}Z"/>`;
    // 객실 바닥 높이와 문 · 창
    const dbl = g.hump === "double", floor = dbl ? h * 0.27 : h * (G.wide ? 0.1 : 0.08), dH = Math.min(1.95, h * 0.5), dW = G.wide ? 1.05 : 0.86;
    const doors = [nL * 1.04, L - tL * 0.98]; if (L > 44) doors.push(G.xr - G.cr * 0.22); if (L > 58) doors.push(G.xr + G.cr * 1.22); if (L > 70) doors.push(G.xr + G.cr * 1.22 + (L - tL * 0.98 - G.xr - G.cr * 1.22) * 0.5);
    const door = (x, fy) => `<rect class="det door" x="${N(x)}" y="${N(fy - dH)}" width="${N(dW)}" height="${N(dH)}" rx="0.12"/>`;
    const win = (y, x0, x1, skip) => { let s = ""; for (let x = x0; x <= x1; x += 0.98) { if (skip.some(d => x > d - 0.45 && x < d + dW + 0.45)) continue; s += `<circle class="win" cx="${N(x)}" cy="${N(y)}" r="0.17"/>`; } return s; };
    doors.forEach(x => { o += door(x, floor); });
    o += win(floor - 1.08, nL * 1.3, L - tL * 0.62, doors);
    if (dbl) { const uf = -h * 0.07, ud = [nL * 1.25, G.xr + G.cr * 0.4, L - tL * 1.02]; ud.forEach(x => { o += door(x, uf); }); o += win(uf - 1.05, nL * 1.5, L - tL * 0.8, ud); }
    if (g.hump === "hump") { o += door(nL * 2.1, -h * 0.55); o += win(-h * 0.55 - 1.0, nL * 1.5, L * 0.27, [nL * 2.1]); }
    if (!G.wide && L > 30 && g.engineMount === "wing") o += `<rect class="det door" x="${N(G.xr + G.cr * 0.42)}" y="${N(floor - 1.45)}" width="0.52" height="0.95" rx="0.1"/>`;
    // 조종석 창
    const cy = g.hump === "hump" ? -h * 0.84 : dbl ? -h * 0.2 : -h * 0.4, cs = g.hump === "hump" ? 0.82 : 1, cx0 = g.hump === "hump" ? nL * 0.3 : 0;
    o += `<path class="cock" d="M${N(cx0 + nL * 0.42 * cs)} ${N(cy + h * 0.04)} L${N(cx0 + nL * 0.6 * cs)} ${N(cy - h * 0.035)} L${N(cx0 + nL * 0.59 * cs)} ${N(cy + h * 0.11)} L${N(cx0 + nL * 0.44 * cs)} ${N(cy + h * 0.15)}Z M${N(cx0 + nL * 0.64 * cs)} ${N(cy - h * 0.045)} L${N(cx0 + nL * 0.9 * cs)} ${N(cy - h * 0.075)} L${N(cx0 + nL * 0.88 * cs)} ${N(cy + h * 0.09)} L${N(cx0 + nL * 0.63 * cs)} ${N(cy + h * 0.11)}Z"/>`;
    // 수직 꼬리날개
    const eW = g.engineDia, eL = eW * 2.3, fs = Math.tan(rad(g.finSweep)), fr = g.finChord * L, ft = fr * 0.42;
    const tipTE = L * 0.995, tipLE = tipTE - ft, rootLE = tipLE - finH * fs, rootTE = Math.min(L, rootLE + fr);
    if (g.engineMount === "tail3") o += `<path class="eng" d="M${N(rootLE - fr * 0.55)} ${N(-h * 0.5)} L${N(rootLE - fr * 0.42)} ${N(-h * 0.5 - eW * 0.95)} L${N(rootLE + fr * 0.15)} ${N(-h * 0.5 - eW * 0.95)} L${N(rootLE + fr * 0.5)} ${N(-h * 0.5)}Z"/><path class="det" d="M${N(rootLE - fr * 0.4)} ${N(-h * 0.5 - eW * 0.9)} L${N(rootLE - fr * 0.5)} ${N(-h * 0.5 - eW * 0.05)}"/>`;
    o += `<path class="fin" d="M${N(rootLE - fr * 0.5)} ${N(-h * 0.5)} L${N(rootLE)} ${N(-h * 0.5)} L${N(rootLE + fr * 0.12)} ${N(-h * 0.5 - finH * 0.12)}Z"/>`;
    o += `<path class="fin" d="M${N(rootLE)} ${N(-h * 0.5)} L${N(tipLE)} ${N(yTop)} L${N(tipTE)} ${N(yTop)} L${N(rootTE)} ${N(-h * 0.42)}Z"/>`;
    o += `<path class="det" d="M${N(rootTE - fr * 0.3)} ${N(-h * 0.47)} L${N(tipTE - ft * 0.34)} ${N(yTop + 0.25)}"/>`;
    const xs = g.stabPos * L, hss = G.B * g.stabSpan / 2, sws = Math.tan(rad(g.sweep + 8)), crs = g.stabChord * L, cts = crs * 0.45;
    if (g.tail === "T") { const y = yTop - 0.35, x2 = tipTE + hss * sws * 0.35; o += `<path class="stab" d="M${N(tipLE - 1.2)} ${N(y)} L${N(x2)} ${N(y)} L${N(x2)} ${N(y + 0.45)} L${N(tipLE - 1.2)} ${N(y + 0.45)}Z"/>`; }
    else { const rise = hss * 0.12; o += `<path class="stab" d="M${N(xs)} ${N(-h * 0.26)} L${N(xs + crs)} ${N(-h * 0.26)} L${N(xs + hss * sws + cts)} ${N(-h * 0.26 - rise)} L${N(xs + hss * sws)} ${N(-h * 0.26 - rise)}Z"/>`; }
    o += `<circle class="det" cx="${N(L - 0.35)}" cy="${N(-h * 0.32)}" r="0.2"/>`;
    // 날개 뿌리 페어링 · 주익 · 윙렛
    o += `<path class="fair" d="M${N(G.xr - G.cr * 0.28)} ${N(h * 0.5)} Q${N(G.xr + G.cr * 0.5)} ${N(h * 0.5 + h * 0.15)} ${N(G.xr + G.cr * 1.3)} ${N(h * 0.5)}Z"/>`;
    o += `<path class="wing" d="M${N(G.xr)} ${N(h * 0.22)} L${N(G.xt)} ${N(h * 0.22 - dh)} L${N(G.xt + G.ct)} ${N(h * 0.26 - dh)} L${N(G.xr + G.cr)} ${N(h * 0.4)} L${N(G.xr + G.cr * 0.25)} ${N(h * 0.44)}Z"/>`;
    if (g.winglet) { const wh = g.wingletSmall ? w * 0.3 : w * 0.6, y0 = h * 0.22 - dh; o += `<path class="wing" d="M${N(G.xt + G.ct * 0.15)} ${N(y0)} L${N(G.xt + G.ct * 0.7)} ${N(y0 - wh)} L${N(G.xt + G.ct * 0.95)} ${N(y0 - wh + 0.3)} L${N(G.xt + G.ct)} ${N(y0 + 0.2)}Z"/>`; }
    // 엔진
    if (g.engineMount === "wing") g.enginePos.slice().sort((a, b) => b - a).forEach(p => {
      const xle = leX(G, p), yw = h * 0.22 - p * dh, x0 = xle - eL * 0.62, y0 = yw + eW * 0.12;
      o += `<path class="pylon" d="M${N(x0 + eL * 0.3)} ${N(y0 + eW * 0.05)} L${N(xle + eL * 0.1)} ${N(yw - 0.05)} L${N(xle + eL * 0.55)} ${N(yw + 0.1)} L${N(x0 + eL * 0.8)} ${N(y0 + eW * 0.25)}Z"/>` + nacelleSide(x0, y0, eL, eW);
    });
    else { const x0 = L * 0.755, y0 = -h * 0.46; o += `<path class="pylon" d="M${N(x0 + eW * 0.8)} ${N(y0 + eW * 0.9)} L${N(x0 + eW * 2)} ${N(y0 + eW * 0.9)} L${N(x0 + eW * 2)} ${N(y0 + eW * 1.1)} L${N(x0 + eW * 0.8)} ${N(y0 + eW * 1.1)}Z"/>` + nacelleSide(x0, y0, eW * 2.6, eW); }
    // 착륙장치
    const xm = G.xr + G.cr * 0.72;
    o += `<line class="gear" x1="${N(nL * 1.02)}" y1="${N(h * 0.46)}" x2="${N(nL * 1.02)}" y2="${N(ground - gs.rN)}"/><circle class="tyre" cx="${N(nL * 1.02)}" cy="${N(ground - gs.rN)}" r="${gs.rN}"/>`;
    gs.sets.forEach(st => { const xc = xm + st[0]; o += `<line class="gear" x1="${N(xc)}" y1="${N(h * 0.42)}" x2="${N(xc)}" y2="${N(ground - gs.rM)}"/>`; for (let i = 0; i < st[1]; i++) o += `<circle class="tyre" cx="${N(xc + (i - (st[1] - 1) / 2) * gs.rM * 2.12)}" cy="${N(ground - gs.rM)}" r="${gs.rM}"/>`; });
    o += `<line class="ground" x1="-2" y1="${N(ground)}" x2="${N(L + 2)}" y2="${N(ground)}"/>`;
    return { svg: o, top: yTop, ground: ground, h: h };
  }

  /* ---------- 정면도 (기체 중심 = x 0) ---------- */
  function frontView(ac) {
    const G = wingGeom(ac), g = G.g, w = G.w, h = G.h, hs = G.hs, ground = G.ground, yTop = G.yTop, gs = gearSpec(G, ac);
    const wy = h * 0.24, root = w * 0.4, rise = Math.tan(rad(6)) * (hs - root), t = Math.max(0.3, G.cr * 0.05), eW = g.engineDia;
    const wingY = f => wy - rise * Math.max(0, (f * hs - root) / (hs - root));
    const hss = G.B * g.stabSpan / 2;
    let o = "";
    if (g.tail === "T") o += `<path class="stab" d="M${N(-hss)} ${N(yTop + 0.2)} L${N(hss)} ${N(yTop + 0.2)} L${N(hss)} ${N(yTop + 0.5)} L${N(-hss)} ${N(yTop + 0.5)}Z"/>`;
    else [1, -1].forEach(sg => { o += `<path class="stab" d="M${N(sg * w * 0.2)} ${N(-h * 0.22)} L${N(sg * hss)} ${N(-h * 0.22 - hss * 0.12)} L${N(sg * hss)} ${N(-h * 0.22 - hss * 0.12 + 0.24)} L${N(sg * w * 0.2)} ${N(-h * 0.22 + 0.55)}Z"/>`; });
    o += `<path class="fin" d="M-0.34 ${N(-h * 0.45)} L-0.13 ${N(yTop)} L0.13 ${N(yTop)} L0.34 ${N(-h * 0.45)}Z"/>`;
    if (g.engineMount === "tail3") o += `<circle class="eng" cx="0" cy="${N(-h * 0.5 - eW * 0.4)}" r="${N(eW * 0.46)}"/><circle class="spin" cx="0" cy="${N(-h * 0.5 - eW * 0.4)}" r="${N(eW * 0.28)}"/>`;
    [1, -1].forEach(sg => {
      o += `<path class="wing" d="M${N(sg * root)} ${N(wy - t)} L${N(sg * hs)} ${N(wingY(1) - 0.1)} L${N(sg * hs)} ${N(wingY(1) + 0.1)} L${N(sg * root)} ${N(wy + t)}Z"/>`;
      if (g.winglet) { const wh = g.wingletSmall ? w * 0.3 : w * 0.62; o += `<path class="wing" d="M${N(sg * (hs - 0.3))} ${N(wingY(1))} L${N(sg * (hs + 0.05))} ${N(wingY(1) - wh)} L${N(sg * (hs + 0.3))} ${N(wingY(1) - wh)} L${N(sg * (hs + 0.02))} ${N(wingY(1) + 0.1)}Z"/>`; }
      if (g.engineMount === "wing") g.enginePos.forEach(p => { const x = sg * p * hs, yc = wingY(p) + eW * 0.62; o += `<line class="gear" x1="${N(x)}" y1="${N(wingY(p))}" x2="${N(x)}" y2="${N(yc - eW * 0.45)}"/><circle class="eng" cx="${N(x)}" cy="${N(yc)}" r="${N(eW / 2)}"/><circle class="spin" cx="${N(x)}" cy="${N(yc)}" r="${N(eW * 0.33)}"/><circle class="det" cx="${N(x)}" cy="${N(yc)}" r="${N(eW * 0.09)}"/>`; });
      else o += `<circle class="eng" cx="${N(sg * (w / 2 + eW * 0.5))}" cy="${N(-h * 0.18)}" r="${N(eW / 2)}"/><circle class="spin" cx="${N(sg * (w / 2 + eW * 0.5))}" cy="${N(-h * 0.18)}" r="${N(eW * 0.33)}"/>`;
    });
    // 착륙장치 (동체 뒤쪽에서 내려오므로 동체보다 먼저 그린다)
    const tk = gs.track / 2;
    [1, -1].forEach(sg => { o += `<line class="gear" x1="${N(sg * tk)}" y1="${N(wy + t)}" x2="${N(sg * tk)}" y2="${N(ground - gs.rM)}"/><rect class="tyre" x="${N(sg * tk - 0.62)}" y="${N(ground - gs.rM * 2)}" width="0.5" height="${N(gs.rM * 2)}" rx="0.2"/><rect class="tyre" x="${N(sg * tk + 0.12)}" y="${N(ground - gs.rM * 2)}" width="0.5" height="${N(gs.rM * 2)}" rx="0.2"/>`; });
    if (gs.sets.length > 1) [1, -1].forEach(sg => { const x = sg * (tk - 2.6); o += `<line class="gear" x1="${N(x)}" y1="${N(h * 0.4)}" x2="${N(x)}" y2="${N(ground - gs.rM)}"/><rect class="tyre" x="${N(x - 0.62)}" y="${N(ground - gs.rM * 2)}" width="0.5" height="${N(gs.rM * 2)}" rx="0.2"/><rect class="tyre" x="${N(x + 0.12)}" y="${N(ground - gs.rM * 2)}" width="0.5" height="${N(gs.rM * 2)}" rx="0.2"/>`; });
    o += `<line class="gear" x1="0" y1="${N(h * 0.45)}" x2="0" y2="${N(ground - gs.rN)}"/><rect class="tyre" x="-0.46" y="${N(ground - gs.rN * 2)}" width="0.38" height="${N(gs.rN * 2)}" rx="0.16"/><rect class="tyre" x="0.08" y="${N(ground - gs.rN * 2)}" width="0.38" height="${N(gs.rN * 2)}" rx="0.16"/>`;
    // 동체
    if (g.hump === "hump") o += `<circle class="fus" cx="0" cy="${N(-h * 0.62)}" r="${N(w * 0.34)}"/>`;
    o += `<ellipse class="fus" cx="0" cy="0" rx="${N(w / 2)}" ry="${N(h / 2)}"/>`;
    const cy = g.hump === "hump" ? -h * 0.74 : g.hump === "double" ? -h * 0.13 : -h * 0.2, cw = g.hump === "hump" ? w * 0.6 : w;
    [1, -1].forEach(sg => { o += `<path class="cock" d="M${N(sg * cw * 0.3)} ${N(cy + h * 0.02)} L${N(sg * cw * 0.03)} ${N(cy - h * 0.045)} L${N(sg * cw * 0.03)} ${N(cy + h * 0.085)} L${N(sg * cw * 0.27)} ${N(cy + h * 0.12)}Z"/>`; });
    o += `<circle class="det" cx="0" cy="${N(h * 0.12)}" r="${N(w * 0.2)}"/>`;
    o += `<line class="ground" x1="${N(-hs - 2)}" y1="${N(ground)}" x2="${N(hs + 2)}" y2="${N(ground)}"/>`;
    return { svg: o, top: yTop - (g.tail === "T" ? 0.4 : 0), ground: ground };
  }

