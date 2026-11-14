
  /* ================= 기종 비교 그림 =================
     두 기종을 같은 축척으로 나란히 놓은 측면·평면·정면 그림.
     도형은 도면(draw-a.js)과 같은 것을 쓰고, 여기서는 배치와 채색(그라데이션, 그림자, 기준 물체)만 맡는다.
     길이 단위는 미터이며 viewBox도 미터로 잡는다. 글자 크기는 그림 폭에 비례한다. */
  const ART_DEFS = `<svg class="art-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
<linearGradient id="ag-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfd3e8"/><stop offset="1" stop-color="#eef3f8"/></linearGradient>
<linearGradient id="ag-fus" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#f1f4f7"/><stop offset=".78" stop-color="#cdd4dc"/><stop offset="1" stop-color="#9da8b5"/></linearGradient>
<linearGradient id="ag-fus-top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#aeb9c5"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#aeb9c5"/></linearGradient>
<radialGradient id="ag-fus-front" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e3e8ed"/><stop offset="1" stop-color="#98a3b0"/></radialGradient>
<linearGradient id="ag-wing" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e4e9ee"/><stop offset="1" stop-color="#98a4b1"/></linearGradient>
<linearGradient id="ag-wing-side" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c6ced7"/><stop offset="1" stop-color="#818d9b"/></linearGradient>
<linearGradient id="ag-eng" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#d9dfe5"/><stop offset="1" stop-color="#8a95a2"/></linearGradient>
<linearGradient id="ag-fin-boeing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3f8fe8"/><stop offset="1" stop-color="#1c57a0"/></linearGradient>
<linearGradient id="ag-fin-airbus" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f07a45"/><stop offset="1" stop-color="#b3471c"/></linearGradient>
</defs></svg>`;
  const artLabel = (ac, x, y, u, anchor) => `<text class="t-title" x="${N(x)}" y="${N(y)}" font-size="${N(2 * u)}"${anchor ? ` text-anchor="${anchor}"` : ""}><tspan class="t-code mk-${ac.maker}">${ICAO[ac.id]}</tspan> ${esc(ac.name)}<tspan class="t-mute" font-size="${N(1.35 * u)}" font-weight="400"> ${esc(ac.variant)}</tspan></text>`;
  // 축척 기준: 12 m 시내버스와 키 1.75 m인 사람. xr = 오른쪽 끝, gy = 지면
  function artRefs(xr, gy, u, label) {
    const bx = xr - 14.6, by = gy - 3.3, px = xr - 1.2;
    return `<g class="ref"><rect x="${N(bx)}" y="${N(by)}" width="12" height="2.95" rx="0.35"/><rect class="ref-w" x="${N(bx + 0.5)}" y="${N(by + 0.45)}" width="9.3" height="1.05" rx="0.12"/><rect class="ref-w" x="${N(bx + 10.3)}" y="${N(by + 0.45)}" width="1.3" height="1.9" rx="0.12"/><circle cx="${N(bx + 2.4)}" cy="${N(gy - 0.5)}" r="0.5"/><circle cx="${N(bx + 9.4)}" cy="${N(gy - 0.5)}" r="0.5"/>${artPerson(px, gy)}</g>${label ? `<text class="t-mute" x="${N(bx)}" y="${N(by - 0.8 * u)}" font-size="${N(1.3 * u)}">버스 12 m · 사람 1.75 m</text>` : ""}`;
  }
  const artPerson = (px, gy) => `<circle cx="${N(px)}" cy="${N(gy - 1.58)}" r="0.17"/><path d="M${N(px - 0.22)} ${N(gy - 1.36)}h0.44v0.72h-0.1v0.64h-0.24v-0.64h-0.1Z"/>`;
  const dimHz = (x1, x2, y, u, text) => `<path class="dimline" d="M${N(x1)} ${N(y)}H${N(x2)}M${N(x1)} ${N(y - 0.6 * u)}V${N(y + 0.6 * u)}M${N(x2)} ${N(y - 0.6 * u)}V${N(y + 0.6 * u)}"/><text class="t-dim" x="${N((x1 + x2) / 2)}" y="${N(y + 2 * u)}" text-anchor="middle" font-size="${N(1.5 * u)}">${text}</text>`;
  const dimVt = (x, y1, y2, u, text) => `<path class="dimline" d="M${N(x)} ${N(y1)}V${N(y2)}M${N(x - 0.6 * u)} ${N(y1)}H${N(x + 0.6 * u)}M${N(x - 0.6 * u)} ${N(y2)}H${N(x + 0.6 * u)}"/><text class="t-dim" transform="translate(${N(x + 2 * u)} ${N((y1 + y2) / 2)}) rotate(90)" text-anchor="middle" font-size="${N(1.5 * u)}">${text}</text>`;

  /* ---------- 측면: 위아래로 놓고 기수를 맞춘다 ---------- */
  function cmpSide(A, B) {
    const maxL = Math.max(A.specs.length, B.specs.length), maxH = Math.max(A.specs.height, B.specs.height);
    const padL = 17.5, padR = 8.5, W = padL + maxL + padR, u = W / 100, top = 5.4 * u, rowH = top + maxH + 7.4 * u;
    let o = "";
    [A, B].forEach((ac, i) => {
      const sv = sideView(ac), S = ac.specs, y0 = i * rowH, gy = y0 + top + maxH;
      o += `<rect class="sky" x="${N(-padL)}" y="${N(y0)}" width="${N(W)}" height="${N(gy - y0)}"/><rect class="apron" x="${N(-padL)}" y="${N(gy)}" width="${N(W)}" height="${N(rowH - (gy - y0))}"/>`;
      for (let x = 0; x <= maxL + 0.01; x += 10) o += `<line class="tick" x1="${x}" y1="${N(gy)}" x2="${x}" y2="${N(gy + 0.8 * u)}"/><text class="t-tick" x="${x}" y="${N(gy + 2.3 * u)}" text-anchor="middle" font-size="${N(1.25 * u)}">${x}${x ? "" : " m"}</text>`;
      o += artRefs(-1.6, gy, u, true);
      o += `<ellipse class="gshadow" cx="${N(S.length * 0.5)}" cy="${N(gy + 0.12)}" rx="${N(S.length * 0.47)}" ry="0.42"/>`;
      o += `<g class="art-side mk-${ac.maker}" transform="translate(0 ${N(gy - sv.ground)})">${sv.svg}</g>`;
      o += artLabel(ac, -padL + 1.4 * u, y0 + 3.4 * u, u);
      o += dimHz(0, S.length, gy + 4.4 * u, u, `길이 ${S.length} m`) + dimVt(S.length + 2.4 * u, gy - S.height, gy, u, `높이 ${S.height} m`);
    });
    return `<svg class="art-svg" viewBox="${N(-padL)} 0 ${N(W)} ${N(rowH * 2)}" role="img" aria-label="${esc(A.name)}과 ${esc(B.name)}의 측면 비교. 길이 ${A.specs.length}미터와 ${B.specs.length}미터, 높이 ${A.specs.height}미터와 ${B.specs.height}미터">${o}</svg>`;
  }

  /* ---------- 평면 · 정면: 좌우로 놓는다 (두 그림의 가로 위치가 같다) ---------- */
  function cmpCols(A, B) {
    const gap = 16, pad = 9, sa = A.specs.span, sb = B.specs.span, W = pad * 2 + sa + sb + gap;
    return { W: W, u: W / 100, pad: pad, cx: [pad + sa / 2, pad + sa + gap + sb / 2] };
  }
  function cmpTop(A, B) {
    const C = cmpCols(A, B), W = C.W, u = C.u, maxL = Math.max(A.specs.length, B.specs.length), top = 6 * u, H = top + maxL + 9.5 * u;
    let o = `<rect class="pad" x="0" y="0" width="${N(W)}" height="${N(H)}"/>`;
    for (let x = 10; x < W; x += 10) o += `<line class="gridl" x1="${x}" y1="0" x2="${x}" y2="${N(H)}"/>`;
    for (let y = 10; y < H; y += 10) o += `<line class="gridl" x1="0" y1="${y}" x2="${N(W)}" y2="${y}"/>`;
    [A, B].forEach((ac, i) => {
      const S = ac.specs, cx = C.cx[i], lr = letterRow(groundSpan(ac)), tv = topView(ac), yb = top + maxL;
      if (lr[2] > groundSpan(ac)) o += `<g class="mk-${ac.maker}"><path class="lim" d="M${N(cx - lr[2] / 2)} ${N(top - 1.5 * u)}V${N(yb + 0.6 * u)}M${N(cx + lr[2] / 2)} ${N(top - 1.5 * u)}V${N(yb + 0.6 * u)}"/></g>`;
      o += `<g class="shadow" transform="translate(${N(cx + 1.1)} ${N(top + 1.5)}) rotate(90)">${tv}</g>`;
      o += `<g class="art-top mk-${ac.maker}" transform="translate(${N(cx)} ${N(top)}) rotate(90)">${tv}<line class="finline" x1="${N(S.length * 0.85)}" y1="0" x2="${N(S.length - 0.5)}" y2="0"/></g>`;
      o += artLabel(ac, cx, 3.6 * u, u, "middle");
      o += dimHz(cx - S.span / 2, cx + S.span / 2, yb + 2.4 * u, u, `날개폭 ${S.span} m`);
      o += `<text class="t-lim mk-${ac.maker}" x="${N(cx)}" y="${N(yb + 7.4 * u)}" text-anchor="middle" font-size="${N(1.4 * u)}">ICAO 코드 ${lr[0]} · 점선은 한계 ${lr[2]} m${FOLD_SPAN[ac.id] ? " (날개 끝을 접은 폭 기준)" : ""}</text>`;
    });
    o += `<path class="dimline" d="M${N(2 * u)} ${N(H - 2 * u)}h10M${N(2 * u)} ${N(H - 2.6 * u)}v${N(1.2 * u)}M${N(2 * u + 10)} ${N(H - 2.6 * u)}v${N(1.2 * u)}"/><text class="t-mute" x="${N(2 * u + 11.2)}" y="${N(H - 1.5 * u)}" font-size="${N(1.3 * u)}">10 m</text>`;
    return `<svg class="art-svg" viewBox="0 0 ${N(W)} ${N(H)}" role="img" aria-label="${esc(A.name)}과 ${esc(B.name)}의 평면 비교. 날개폭 ${A.specs.span}미터와 ${B.specs.span}미터">${o}</svg>`;
  }
  function cmpFront(A, B) {
    const C = cmpCols(A, B), W = C.W, u = C.u, maxH = Math.max(A.specs.height, B.specs.height), gy = 3 * u + maxH + 1, H = gy + 5.6 * u;
    let o = `<rect class="sky" x="0" y="0" width="${N(W)}" height="${N(gy)}"/><rect class="apron" x="0" y="${N(gy)}" width="${N(W)}" height="${N(H - gy)}"/>`;
    [A, B].forEach((ac, i) => {
      const S = ac.specs, cx = C.cx[i], fv = frontView(ac);
      o += `<ellipse class="gshadow" cx="${N(cx)}" cy="${N(gy + 0.12)}" rx="${N(S.span * 0.42)}" ry="0.4"/><g class="art-front mk-${ac.maker}" transform="translate(${N(cx)} ${N(gy - fv.ground)})">${fv.svg}</g>`;
      o += dimVt(cx + S.span / 2 + 1.6 * u, gy - S.height, gy, u, `${S.height} m`);
      o += `<text class="t-dim" x="${N(cx)}" y="${N(gy + 3.4 * u)}" text-anchor="middle" font-size="${N(1.5 * u)}">${ICAO[ac.id]} · 동체 폭 ${S.width} m</text>`;
    });
    o += `<g class="ref">${artPerson((C.cx[0] + A.specs.span / 2 + C.cx[1] - B.specs.span / 2) / 2 - 2.5 * u, gy)}</g>`;
    return `<svg class="art-svg" viewBox="0 0 ${N(W)} ${N(H)}" role="img" aria-label="${esc(A.name)}과 ${esc(B.name)}의 정면 비교. 높이 ${A.specs.height}미터와 ${B.specs.height}미터">${o}</svg>`;
  }
  const cmpDiff = (A, B) => {
    const d = (k, lab, unit) => { const v = Math.round((B.specs[k] - A.specs[k]) * 100) / 100; return `<span class="cmp-chip${v ? "" : " eq"}"><small>${lab}</small><b>${v > 0 ? "+" : ""}${fmt(v)} ${unit}</b></span>`; };
    const la = acLetter(A), lb = acLetter(B);
    return `<div class="cmp-diff"><span class="cmp-chip head"><small>${esc(short(A))} 대비</small><b>${esc(short(B))}</b></span>${d("length", "길이", "m")}${d("span", "날개폭", "m")}${d("height", "높이", "m")}${d("mtow", "최대이륙중량", "t")}${d("seats", "표준 좌석", "석")}${d("range", "항속거리", "km")}<span class="cmp-chip${la === lb ? " eq" : ""}"><small>ICAO 코드 문자</small><b>${la} → ${lb}</b></span></div>`;
  };
  function cmpArt(A, B) {
    const fig = (title, note, svg) => `<figure class="art-fig"><figcaption><b>${title}</b><span>${note}</span></figcaption><div class="art-scroll">${svg}</div></figure>`;
    return ART_DEFS + fig("측면", "같은 축척 · 기수를 왼쪽에 맞춤 · 눈금 10 m", cmpSide(A, B)) + fig("평면", "같은 축척 · 격자 한 칸 10 m · 점선은 ICAO 코드 문자의 날개폭 한계", cmpTop(A, B)) + fig("정면", "같은 축척 · 가운데 사람 키 1.75 m", cmpFront(A, B));
  }
