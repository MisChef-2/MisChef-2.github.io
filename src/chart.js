  /* ================= 비행장 차트 =================
     공항 페이지 위쪽의 비행장 도면. 활주로·주파수 표(CHART_META)는 번들에 있고, 유도로·계류장·터미널 도형은
     공항을 열 때 charts/<ICAO>.js 를 따로 불러온다(파일이 없으면 활주로만 그린다).
     도형 층(.ch-map)은 미터 단위 viewBox로 확대·이동하고, 글자·경위도 눈금·축척·방위표는 화면 픽셀 층(.ch-ov)에
     매번 다시 그려서 확대해도 글자 크기가 그대로다. 겹치는 글자는 중요도 순으로 빼고 그린다.
     Jeppesen 차트를 옮긴 것이 아니라 공개 자료로 새로 그린 참고 도면이다. */
  const CI = d => `<svg class="i" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const CHI = {
    plus: CI('<path d="M12 5v14M5 12h14"/>'), minus: CI('<path d="M5 12h14"/>'),
    fit: CI('<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>'),
    full: CI('<path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/>'), shrink: CI('<path d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5"/>'),
    moon: CI('<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>'),
    sun: CI('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>')
  };
  const FQ_ORDER = ["ATIS", "DEL", "GND", "APRON", "TWR", "APP", "DEP"];
  const FQ_KO = { ATIS: "공항 정보 방송", DEL: "관제 승인", GND: "지상 관제", APRON: "계류장 관제", TWR: "관제탑", APP: "접근 관제", DEP: "출발 관제" };
  const fqKey = t => {
    t = String(t || "").toUpperCase();
    if (/ATIS/.test(t)) return "ATIS"; if (/^(DEL|CLD|CLNC|CLR|CD\b)/.test(t)) return "DEL"; if (/^(GND|GRD|GROUND)/.test(t)) return "GND";
    if (/^(RMP|RAMP|APRON|APN|APRN)/.test(t)) return "APRON"; if (/^(TWR|TOWER)/.test(t)) return "TWR"; if (/^DEP/.test(t)) return "DEP";
    if (/^(APP|ARR|A\/D|RADAR|RDR)/.test(t)) return "APP"; return "";
  };
  const mhz = m => { const s = (+m).toFixed(3).replace(/0+$/, ""); return s.endsWith(".") ? s + "0" : s; };
  const sfcKo = s => {
    s = String(s || "").toUpperCase();
    const con = /CON|PCC|CEM/.test(s), asp = /ASP|BIT|ASF|TAR|MAC/.test(s);
    if (/PEM/.test(s) || (con && asp)) return "아스팔트·콘크리트"; if (con) return "콘크리트"; if (asp) return "아스팔트"; if (/GRS|GRASS|TURF/.test(s)) return "잔디";
    return s ? esc(s) : "—";
  };
  const dmTxt = (v, p, n, dec) => {
    const h = v < 0 ? n : p, a = Math.abs(v); let d = Math.floor(a), m = +((a - d) * 60).toFixed(dec);
    if (m >= 60) { d++; m = 0; }
    return `${h}${d}°${m.toFixed(dec).padStart(dec ? 3 + dec : 2, "0")}′`;
  };
  const chMeta = icao => (typeof CHART_META !== "undefined" && CHART_META[icao]) || null;

  /* 도형 파일은 공항마다 한 번만 불러온다 */
  const chLoad = {};
  function chartGeo(icao) {
    const have = () => (window.JLV_CHART && window.JLV_CHART[icao]) || null;
    if (have()) return Promise.resolve(have());
    if (chLoad[icao]) return chLoad[icao];
    const url = "charts/" + icao + ".js";
    // 스크립트 태그가 막힌 환경이면 같은 파일을 fetch로 읽어 JSON 부분만 꺼낸다(로컬 파일로 열 때는 스크립트 태그가 된다)
    const viaFetch = () => fetch(url).then(r => r.ok ? r.text() : Promise.reject(r.status)).then(t => {
      const i = t.indexOf("]="); if (i < 0) return null;
      const g = JSON.parse(t.slice(i + 2).trim().replace(/;$/, "")); (window.JLV_CHART = window.JLV_CHART || {})[icao] = g; return g;
    }).catch(() => null);
    chLoad[icao] = new Promise(res => {
      let done = false; const fin = () => { if (done) return; done = true; const g = have(); if (g) return res(g); viaFetch().then(x => { if (!x) delete chLoad[icao]; res(x); }); };
      const s = document.createElement("script"); s.src = url; s.async = true;
      s.onload = fin; s.onerror = fin; setTimeout(fin, 12000);
      document.head.appendChild(s);
    });
    return chLoad[icao];
  }
  const chDec = s => { const a = s ? s.split(",") : [], p = []; let x = 0, y = 0; for (let i = 0; i + 1 < a.length; i += 2) { x += +a[i]; y += +a[i + 1]; p.push(x + " " + y); } return p; };
  const chPath = (s, close) => { const p = chDec(s); return p.length > 1 ? "M" + p.join("L") + (close ? "Z" : "") : ""; };

  let chMode = "";
  try { const v = localStorage.getItem("hub-chart-mode"); if (v === "day" || v === "night") chMode = v; } catch (e) { /* 저장소 없음 */ }

  function chartFqBoxes(M) {
    const g = {};
    M.f.forEach(f => { const k = fqKey(f[0]); if (!k) return; g[k] = g[k] || []; if (g[k].length < 2 && g[k].indexOf(f[2]) < 0) g[k].push(f[2]); });
    const keys = FQ_ORDER.filter(k => g[k]).slice(0, 6);
    return keys.length ? keys.map(k => `<div class="ch-fb"><span>${k}</span><b>${g[k].map(mhz).join(" · ")}</b></div>`).join("") : `<div class="ch-fb"><span>FREQ</span><b>자료 없음</b></div>`;
  }
  function chartCard(code) {
    const a = aptBy[code], M = chMeta(a.icao); if (!M) return "";
    return `<section class="card c8 ch-card">${cardH(ICON.map, "비행장 차트", `<span class="hint">시뮬레이션 참고용 · 항법 사용 금지</span>`)}<div class="ch-wrap">
<div class="chart${chMode ? " " + chMode : ""}" id="chart" data-icao="${a.icao}">
<div class="ch-head"><div class="ch-id"><b>${a.icao}</b><span>${a.iata}</span></div><div class="ch-tt"><strong>${esc(M.n)}</strong><span>${esc((M.c ? M.c + " · " : "") + a.name + " · " + (CCN[a.cc] || a.cc))}</span></div><div class="ch-kind"><b>AERODROME CHART</b><span>ELEV ${M.e == null ? "—" : fmt(M.e) + " FT"} · ${dmTxt(M.o[0], "N", "S", 1)} ${dmTxt(M.o[1], "E", "W", 1)}</span></div></div>
<div class="ch-fq">${chartFqBoxes(M)}</div>
<div class="ch-view" id="ch-view" tabindex="0" role="img" aria-label="${esc(a.name)} 비행장 도면. 드래그로 옮기고 더하기·빼기 키로 확대합니다.">
<svg class="ch-map" id="ch-map" xmlns="http://www.w3.org/2000/svg"></svg><svg class="ch-ov" id="ch-ov" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"></svg>
<div class="ch-tools"><button type="button" data-ch="in" aria-label="확대" title="확대">${CHI.plus}</button><button type="button" data-ch="out" aria-label="축소" title="축소">${CHI.minus}</button><button type="button" data-ch="fit" aria-label="전체 보기" title="전체 보기">${CHI.fit}</button><button type="button" data-ch="full" id="ch-full" aria-label="전체 화면" title="전체 화면">${CHI.full}</button><button type="button" data-ch="mode" id="ch-mode" aria-label="주간·야간 전환" title="주간·야간 전환">${CHI.moon}</button></div>
<div class="ch-status" id="ch-status">유도로 도면을 불러오는 중…</div>
</div>
<div class="ch-foot"><span>NOT FOR NAVIGATION · 공개 자료로 그린 참고 도면</span><span>활주로·주파수 <a href="https://ourairports.com/airports/${a.icao}/" target="_blank" rel="noopener">OurAirports</a> · 유도로·계류장 <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap 기여자</a></span></div>
</div>
<p class="small muted ch-tip">마우스 휠로 확대·축소하고 드래그로 옮깁니다. 버튼이나 두 번 클릭으로도 확대되고, 전체 화면에서는 두 손가락으로도 확대됩니다.</p></div></section>`;
  }
  function chartSide(code) {
    const a = aptBy[code], M = chMeta(a.icao); if (!M) return "";
    const rw = M.r.map(r => `<tr><td><span class="code">${esc(r[0])}</span> <span class="code">${esc(r[1])}</span></td><td class="num">${fmt(Math.round(r[2] * .3048))} × ${r[3] ? Math.round(r[3] * .3048) : "—"} m<small>${fmt(r[2])} × ${r[3] ? fmt(r[3]) : "—"} ft</small></td><td>${sfcKo(r[4])}${r[9] != null ? `<small>진방위 ${String(Math.round(r[9]) % 360).padStart(3, "0")}° · ${String(Math.round(r[10] != null ? r[10] : r[9] + 180) % 360).padStart(3, "0")}°</small>` : ""}</td></tr>`).join("");
    const fq = M.f.map(f => ({ f, k: fqKey(f[0]) })).sort((x, y) => (x.k ? FQ_ORDER.indexOf(x.k) : 99) - (y.k ? FQ_ORDER.indexOf(y.k) : 99)).slice(0, 14)
      .map(o => `<tr><td><span class="code">${esc(o.f[0])}</span></td><td class="num">${mhz(o.f[2])}</td><td>${o.k ? FQ_KO[o.k] : "기타"}${o.f[1] ? `<small>${esc(o.f[1])}</small>` : ""}</td></tr>`).join("");
    return `<section class="card c4 ch-side">${cardH(ICON.doc, "활주로 · 주파수")}
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>활주로</th><th class="num">길이 × 폭</th><th>노면</th></tr></thead><tbody>${rw || `<tr><td colspan="3" class="muted">활주로 자료가 없습니다.</td></tr>`}</tbody></table></div>
<div class="tbl-wrap"><table class="tbl"><thead><tr><th>주파수</th><th class="num">MHz</th><th>용도</th></tr></thead><tbody>${fq || `<tr><td colspan="3" class="muted">주파수 자료가 없습니다.</td></tr>`}</tbody></table></div>
<div class="card-b ch-ext"><strong>실제 차트 보기</strong>
<a class="btn ghost" href="https://charts.navigraph.com/airport/${a.icao}" target="_blank" rel="noopener">${ICON.ext}Navigraph Charts <small>Jeppesen · 유료 구독</small></a>
<a class="btn ghost" href="https://chartfox.org/${a.icao}" target="_blank" rel="noopener">${ICON.ext}ChartFox <small>각국 공식 AIP 차트 · 무료 로그인</small></a>
<a class="btn ghost" href="https://skyvector.com/airport/${a.icao}" target="_blank" rel="noopener">${ICON.ext}SkyVector <small>공항 정보 · 항로도</small></a>
<p class="small muted">Jeppesen 차트는 라이선스 상품이라 이 사이트에 담을 수 없습니다. Navigraph에 로그인하면 ${a.icao}의 출발·도착 절차와 접근 차트까지 볼 수 있습니다.</p></div></section>`;
  }

  /* ---------- 도면 그리기와 조작 ---------- */
  let chRO = null, chExit = null;
  function chartLeave() { document.body.classList.remove("ch-lock"); chExit = null; if (chRO) { chRO.disconnect(); chRO = null; } }
  document.addEventListener("keydown", e => { if (e.key === "Escape" && chExit) chExit(); });
  function initChart(code) {
    const a = aptBy[code], M = chMeta(a.icao), root = $("#chart"); if (!root || !M) return;
    const view = $("#ch-view"), map = $("#ch-map"), ov = $("#ch-ov"), st = $("#ch-status");
    const rw = M.r.map(r => { const ax = r[5], ay = r[6], bx = r[7], by = r[8], L = Math.hypot(bx - ax, by - ay) || 1; return { le: r[0], he: r[1], ax, ay, bx, by, L, ux: (bx - ax) / L, uy: (by - ay) / L, w: (r[3] || 148) * .3048, lenM: Math.round(r[2] * .3048), widM: r[3] ? Math.round(r[3] * .3048) : null, ad: (r[13] || 0) * .3048, bd: (r[14] || 0) * .3048 }; });
    let B;
    { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; rw.forEach(r => { x0 = Math.min(x0, r.ax, r.bx); y0 = Math.min(y0, r.ay, r.by); x1 = Math.max(x1, r.ax, r.bx); y1 = Math.max(y1, r.ay, r.by); }); B = rw.length ? [x0 - 400, y0 - 400, x1 + 400, y1 + 400] : [-1500, -1500, 1500, 1500]; }
    const S = { cx: 0, cy: 0, mpp: 1, fit: 1, G: null };
    let touched = false, raf = 0, two = null;
    const W = () => view.clientWidth || 600, H = () => view.clientHeight || 400;
    const clampM = m => Math.max(S.fit / 28, Math.min(S.fit * 1.6, m));
    const clampC = () => { const bw = B[2] - B[0], bh = B[3] - B[1]; S.cx = Math.max(B[0] - bw * .2, Math.min(B[2] + bw * .2, S.cx)); S.cy = Math.max(B[1] - bh * .2, Math.min(B[3] + bh * .2, S.cy)); };
    function fit() { S.fit = Math.max((B[2] - B[0]) / W(), (B[3] - B[1]) / H()) * 1.03; S.mpp = S.fit; S.cx = (B[0] + B[2]) / 2; S.cy = (B[1] + B[3]) / 2; draw(); }
    function zoomAt(f, px, py) {
      const m0 = S.mpp, x = S.cx + (px - W() / 2) * m0, y = S.cy + (py - H() / 2) * m0;
      S.mpp = clampM(m0 / f); const k = S.mpp / m0; S.cx = x - (x - S.cx) * k; S.cy = y - (y - S.cy) * k; clampC(); touched = true; draw();
    }
    function build() {
      const G = S.G, P = [];
      if (G) {
        P.push(`<path class="c-ap" d="${G.ap.map(s => chPath(s, true)).join("")}"/>`);
        P.push(`<path class="c-tl" d="${G.tl.map(s => chPath(s)).join("")}"/>`);
        const tw = G.tw.map(s => chPath(s)).join("");
        P.push(`<path class="c-two" d="${tw}"/><path class="c-twi" d="${tw}"/>`);
        P.push(`<path class="c-tm" d="${G.tm.map(t => chPath(t[4], true)).join("")}"/>`);
      }
      rw.forEach(r => {
        const nx = -r.uy * r.w / 2, ny = r.ux * r.w / 2, f = v => v.toFixed(1);
        const bar = (d, x, y, s) => { const tx = x + r.ux * d * s, ty = y + r.uy * d * s; return `M${f(tx + nx * .92)} ${f(ty + ny * .92)}L${f(tx - nx * .92)} ${f(ty - ny * .92)}`; };
        const c0 = r.ad + 90, c1 = r.L - r.bd - 90;
        P.push(`<path class="c-rw" d="M${f(r.ax + nx)} ${f(r.ay + ny)}L${f(r.bx + nx)} ${f(r.by + ny)}L${f(r.bx - nx)} ${f(r.by - ny)}L${f(r.ax - nx)} ${f(r.ay - ny)}Z"/>`);
        if (c1 > c0) P.push(`<path class="c-rcl" d="M${f(r.ax + r.ux * c0)} ${f(r.ay + r.uy * c0)}L${f(r.ax + r.ux * c1)} ${f(r.ay + r.uy * c1)}"/>`);
        P.push(`<path class="c-th" d="${bar(r.ad + 12, r.ax, r.ay, 1)}${bar(r.bd + 12, r.bx, r.by, -1)}"/>`);
      });
      map.innerHTML = P.join(""); two = map.querySelector(".c-two");
    }
    function draw() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; paint(); }); }
    function paint() {
      if (!document.body.contains(view)) return;
      const w = W(), h = H(), m = S.mpp, vx = S.cx - w * m / 2, vy = S.cy - h * m / 2;
      map.setAttribute("viewBox", `${vx.toFixed(2)} ${vy.toFixed(2)} ${(w * m).toFixed(2)} ${(h * m).toFixed(2)}`);
      ov.setAttribute("viewBox", `0 0 ${w} ${h}`);
      if (two) two.setAttribute("stroke-width", (23 + 2.6 * m).toFixed(2));
      ov.innerHTML = overlay(vx, vy, w, h, m);
    }
    function overlay(vx, vy, w, h, m) {
      const X = x => (x - vx) / m, Y = y => (y - vy) / m, o = [], placed = [];
      const hit = (x0, y0, x1, y1) => placed.some(p => x0 < p[2] && x1 > p[0] && y0 < p[3] && y1 > p[1]);
      const take = (x0, y0, x1, y1, force) => { if (x1 < 2 || y1 < 2 || x0 > w - 2 || y0 > h - 2) return false; if (!force && hit(x0, y0, x1, y1)) return false; placed.push([x0, y0, x1, y1]); return true; };
      const tw = (s, fs, k) => s.length * fs * (k || .62) + 4;
      // 고정 장식이 차지하는 자리: 도구 버튼, 방위표, 축척
      placed.push([w - 52, 0, w, 196], [0, 0, 56, 62], [w - 196, h - 66, w, h]);
      // 경위도 눈금
      const k = 111320 * Math.cos(M.o[0] * Math.PI / 180), ky = 110540, lat0 = M.o[0], lon0 = M.o[1];
      const STEP = [0.1, 0.25, 0.5, 1, 2, 5, 10, 20];
      const sLa = STEP.find(s => s * ky / 60 / m >= 70) || 20, sLo = STEP.find(s => s * k / 60 / m >= 100) || 20;
      const dLa = sLa < 1 ? (sLa < .25 ? 2 : 1) : 0, dLo = sLo < 1 ? (sLo < .25 ? 2 : 1) : 0;
      const latTop = lat0 - vy / ky, latBot = lat0 - (vy + h * m) / ky, lonL = lon0 + vx / k, lonR = lon0 + (vx + w * m) / k;
      let tk = "";
      for (let i = Math.ceil(latBot * 60 / sLa); i * sLa <= latTop * 60 + 1e-9; i++) {
        const la = i * sLa / 60, py = Y((lat0 - la) * ky); if (py < 4 || py > h - 4) continue;
        tk += `M0 ${py.toFixed(1)}h8M${w} ${py.toFixed(1)}h-8`;
        const s = dmTxt(la, "N", "S", dLa), tw0 = tw(s, 9.5, .6);
        if (take(10, py - 7, 10 + tw0, py + 6)) o.push(`<text class="o-gr" x="11" y="${(py + 3.3).toFixed(1)}">${s}</text>`);
      }
      for (let i = Math.ceil(lonL * 60 / sLo); i * sLo <= lonR * 60 + 1e-9; i++) {
        const lo = i * sLo / 60, px = X((lo - lon0) * k); if (px < 4 || px > w - 4) continue;
        tk += `M${px.toFixed(1)} 0v8M${px.toFixed(1)} ${h}v-8`;
        const s = dmTxt(lo, "E", "W", dLo), tw0 = tw(s, 9.5, .6);
        if (take(px - tw0 / 2, h - 22, px + tw0 / 2, h - 9)) o.push(`<text class="o-gr" x="${px.toFixed(1)}" y="${h - 12}" text-anchor="middle">${s}</text>`);
      }
      o.push(`<path class="o-tk" d="${tk}"/>`);
      // 활주로 번호(항상 표시)와 길이·폭(자리가 있을 때)
      rw.forEach(r => {
        [[r.le, r.ax, r.ay, -1], [r.he, r.bx, r.by, 1]].forEach(([id, x, y, s]) => {
          const px = X(x) + r.ux * s * 15, py = Y(y) + r.uy * s * 15, t = tw(id, 13, .66);
          take(px - t / 2, py - 9, px + t / 2, py + 8, true);
          o.push(`<text class="o-rd" x="${px.toFixed(1)}" y="${(py + 4.6).toFixed(1)}" text-anchor="middle">${esc(id)}</text>`);
        });
      });
      rw.forEach(r => {
        const sl = r.L / m, s = `${fmt(r.lenM)} × ${r.widM || "—"} m`, t = tw(s, 10.5, .6);
        if (sl < t + 70) return;
        let ang = Math.atan2(r.uy, r.ux) * 180 / Math.PI; if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
        const off = r.w / 2 / m + 10, mx = X((r.ax + r.bx) / 2) - r.uy * off, my = Y((r.ay + r.by) / 2) + r.ux * off;
        const c = Math.abs(Math.cos(ang * Math.PI / 180)), sn = Math.abs(Math.sin(ang * Math.PI / 180)), bw = t * c + 12 * sn, bh = t * sn + 12 * c;
        if (take(mx - bw / 2, my - bh / 2, mx + bw / 2, my + bh / 2)) o.push(`<text class="o-rl" x="${mx.toFixed(1)}" y="${my.toFixed(1)}" text-anchor="middle" dominant-baseline="central" transform="rotate(${ang.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)})">${s}</text>`);
      });
      const G = S.G;
      if (G) {
        G.ct.forEach(c => { const px = X(c[0]), py = Y(c[1]); if (take(px - 6, py - 6, px + 6, py + 6)) { o.push(`<g class="o-ct" transform="translate(${px.toFixed(1)} ${py.toFixed(1)})"><circle r="4.6"/><path d="M-2.4 0h4.8M0-2.4v4.8"/></g>`); if (take(px + 7, py - 6, px + 30, py + 6)) o.push(`<text class="o-tm" x="${(px + 8).toFixed(1)}" y="${(py + 3.4).toFixed(1)}">TWR</text>`); } });
        G.tm.slice().sort((p, q) => q[3] - p[3]).forEach(t0 => { if (!t0[0]) return; const s = t0[0].toUpperCase(), px = X(t0[1]), py = Y(t0[2]), t = tw(s, 9.5, .68); if (take(px - t / 2, py - 7, px + t / 2, py + 6)) o.push(`<text class="o-tm" x="${px.toFixed(1)}" y="${(py + 3.3).toFixed(1)}" text-anchor="middle">${esc(s)}</text>`); });
        G.lb.forEach(l => { const px = X(l[1]), py = Y(l[2]), t = tw(l[0], 10.5, .7) + 2; if (take(px - t / 2, py - 7.5, px + t / 2, py + 7.5)) o.push(`<text class="o-tw" x="${px.toFixed(1)}" y="${(py + 3.8).toFixed(1)}" text-anchor="middle">${esc(l[0])}</text>`); });
      }
      // 방위표(진북)
      o.push(`<g class="o-na" transform="translate(28 12)"><path d="M0 0L8 24L0 18L-8 24Z"/><text x="0" y="40" text-anchor="middle">N</text></g>`);
      // 축척: 미터와 피트
      const nice = (arr, unit) => arr.find(v => v * unit / m >= 64) || arr[arr.length - 1];
      const lm = nice([25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000], 1), lf = nice([100, 200, 500, 1000, 2000, 3000, 5000, 10000, 20000, 30000], .3048);
      const bar = (y, len, label) => { const L = len / m, x0 = w - 24 - L; return `<g class="o-sb"><rect class="k" x="${x0.toFixed(1)}" y="${y}" width="${(L / 2).toFixed(1)}" height="4"/><rect class="w" x="${(x0 + L / 2).toFixed(1)}" y="${y}" width="${(L / 2).toFixed(1)}" height="4"/><text class="o-gr" x="${(x0 - 6).toFixed(1)}" y="${y + 4.5}" text-anchor="end">${label}</text></g>`; };
      o.push(bar(h - 50, lm, fmt(lm) + " M"), bar(h - 34, lf * .3048, fmt(lf) + " FT"));
      return o.join("");
    }

    // 조작: 마우스 드래그, 두 손가락(전체 화면), 휠, 두 번 클릭, 키보드
    const pts = new Map(); let base = null;
    const rel = e => { const r = view.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const isFull = () => root.classList.contains("full");
    const rebase = () => {
      const v = [...pts.values()];
      if (v.length >= 2) base = { mpp: S.mpp, cx: S.cx, cy: S.cy, d: Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]) || 1, mid: [(v[0][0] + v[1][0]) / 2, (v[0][1] + v[1][1]) / 2] };
      else if (v.length === 1) base = { cx: S.cx, cy: S.cy, p: v[0] };
      else base = null;
    };
    view.addEventListener("pointerdown", e => {
      if (e.target.closest(".ch-tools")) return;
      if (e.pointerType === "touch" && !isFull()) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      try { view.setPointerCapture(e.pointerId); } catch (er) { /* 무시 */ }
      pts.set(e.pointerId, rel(e)); rebase(); view.classList.add("grab");
    });
    view.addEventListener("pointermove", e => {
      if (!pts.has(e.pointerId) || !base) return;
      pts.set(e.pointerId, rel(e)); const v = [...pts.values()]; touched = true;
      if (v.length >= 2 && base.d) {
        const d = Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]) || 1, mid = [(v[0][0] + v[1][0]) / 2, (v[0][1] + v[1][1]) / 2];
        const wx = base.cx + (base.mid[0] - W() / 2) * base.mpp, wy = base.cy + (base.mid[1] - H() / 2) * base.mpp;
        S.mpp = clampM(base.mpp * base.d / d); S.cx = wx - (mid[0] - W() / 2) * S.mpp; S.cy = wy - (mid[1] - H() / 2) * S.mpp;
      } else if (base.p) { S.cx = base.cx - (v[0][0] - base.p[0]) * S.mpp; S.cy = base.cy - (v[0][1] - base.p[1]) * S.mpp; }
      clampC(); draw();
    });
    const up = e => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); rebase(); if (!pts.size) view.classList.remove("grab"); };
    view.addEventListener("pointerup", up); view.addEventListener("pointercancel", up);
    view.addEventListener("wheel", e => {
      if (e.target.closest(".ch-tools")) return;
      const f = Math.exp(-e.deltaY * (e.deltaMode === 1 ? .05 : .0022));
      // 휠만으로 확대·축소한다. 페이지 안에서는 전체 보기보다 더 줄이지 않고, 더 줄일 수 없을 때는 페이지가 스크롤되도록 둔다.
      if (!isFull() && !e.ctrlKey && !e.metaKey && f < 1 && S.mpp >= S.fit * .999) return;
      e.preventDefault(); const p = rel(e); zoomAt(isFull() || e.ctrlKey || e.metaKey ? f : Math.max(f, S.mpp / S.fit), p[0], p[1]);
    }, { passive: false });
    view.addEventListener("dblclick", e => { if (e.target.closest(".ch-tools")) return; const p = rel(e); zoomAt(2, p[0], p[1]); });
    view.addEventListener("keydown", e => {
      const kk = e.key, step = 80 * S.mpp;
      if (kk === "+" || kk === "=") zoomAt(1.5, W() / 2, H() / 2); else if (kk === "-" || kk === "_") zoomAt(1 / 1.5, W() / 2, H() / 2); else if (kk === "0") { touched = false; fit(); }
      else if (kk === "ArrowLeft") { S.cx -= step; clampC(); draw(); } else if (kk === "ArrowRight") { S.cx += step; clampC(); draw(); }
      else if (kk === "ArrowUp") { S.cy -= step; clampC(); draw(); } else if (kk === "ArrowDown") { S.cy += step; clampC(); draw(); } else return;
      e.preventDefault();
    });
    const setFull = on => {
      root.classList.toggle("full", on); document.body.classList.toggle("ch-lock", on);
      const b = $("#ch-full"); b.innerHTML = on ? CHI.shrink : CHI.full; b.setAttribute("aria-label", on ? "전체 화면 끝내기" : "전체 화면"); b.title = b.getAttribute("aria-label");
      chExit = on ? () => setFull(false) : null; if (!touched) requestAnimationFrame(fit); else draw();
    };
    const isDay = () => getComputedStyle(root).getPropertyValue("--ch-day").trim() === "1";
    const paintMode = () => { const b = $("#ch-mode"); b.innerHTML = isDay() ? CHI.moon : CHI.sun; };
    root.addEventListener("click", e => {
      const b = e.target.closest("[data-ch]"); if (!b) return;
      const act = b.getAttribute("data-ch");
      if (act === "in") zoomAt(1.6, W() / 2, H() / 2); else if (act === "out") zoomAt(1 / 1.6, W() / 2, H() / 2);
      else if (act === "fit") { touched = false; fit(); }
      else if (act === "full") setFull(!isFull());
      else if (act === "mode") { chMode = isDay() ? "night" : "day"; root.classList.remove("day", "night"); root.classList.add(chMode); try { localStorage.setItem("hub-chart-mode", chMode); } catch (er) { /* 무시 */ } paintMode(); }
    });
    paintMode();

    build();
    if (chRO) chRO.disconnect();
    chRO = new ResizeObserver(() => { if (!touched) fit(); else draw(); }); chRO.observe(view);
    fit();
    st.dataset.busy = "1"; st.hidden = false;
    chartGeo(a.icao).then(G => {
      if (!document.body.contains(root)) return;
      delete st.dataset.busy;
      if (!G) { st.textContent = "유도로 도면 파일을 불러오지 못해 활주로만 표시합니다."; return; }
      S.G = G; B = [Math.min(B[0], G.b[0]), Math.min(B[1], G.b[1]), Math.max(B[2], G.b[2]), Math.max(B[3], G.b[3])];
      st.hidden = true; build(); if (!touched) fit(); else draw();
    });
  }
