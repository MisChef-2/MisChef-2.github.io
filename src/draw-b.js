  /* ---------- 3면도 (평면 · 측면 · 정면) ---------- */
  function threeView(ac) {
    const S = ac.specs, L = S.length, B = S.span, W = 760, X = Math.max(L, B);
    const s = (W - 20) / (X + 17), x0 = (X - L) / 2 + 2, xc = X / 2 + 2, xr = X + 8;
    const sv = sideView(ac), fv = frontView(ac);
    const topH = B + 9, sideH = (sv.ground - sv.top) + 7.5, frontH = (fv.ground - fv.top) + 6.5;
    const H = (topH + sideH + frontH) * s + 16;
    const oyTop = B / 2 + 3.5, oySide = topH + 4 - sv.top, oyFront = topH + sideH + 4 - fv.top;
    const lab = (y, t) => `<text class="vlabel" x="0" y="${N(y)}" font-size="${N(11 / s)}">${t}</text>`;
    return `<svg class="ac-svg tv" viewBox="0 0 ${W} ${N(H)}" role="img" aria-label="${esc(ac.name)} 평면도, 측면도, 정면도. 길이 ${L}m, 날개폭 ${B}m, 높이 ${S.height}m">
<g transform="translate(10 8) scale(${N(s)})">
${lab(2.2, "평면도")}<g transform="translate(${N(x0)} ${N(oyTop)})">${topView(ac)}${dimH(0, L, B / 2 + 3.6, `길이 ${L} m`, s)}${dimV(xr - x0, -B / 2, B / 2, `날개폭 ${B} m`, s)}</g>
${lab(topH + 2.4, "측면도")}<g transform="translate(${N(x0)} ${N(oySide)})">${sv.svg}${dimV(xr - x0, sv.top, sv.ground, `높이 ${S.height} m`, s)}</g>
${lab(topH + sideH + 2.4, "정면도")}<g transform="translate(${N(xc)} ${N(oyFront)})">${fv.svg}${dimH(-S.width / 2, S.width / 2, fv.ground + 2.6, `동체 폭 ${S.width} m`, s)}</g>
</g></svg>`;
  }

