
  /* ================= 비행 지도 (지구본) =================
     내 PIREP 노선을 3차원 지구본 위의 호로 그린다. 캔버스에 직접 그리며, 지도 투영과 가시면 자르기는 d3-geo,
     국가 경계는 world.js(Natural Earth 1:110m)를 쓴다. 호는 지표에서 살짝 띄워 입체감을 준다. */
  const GL = { days: 0, ac: "all", net: true, spin: true, sel: null };
  try { const s = JSON.parse(localStorage.getItem("hub-globe") || "{}"); if (typeof s.net === "boolean") GL.net = s.net; if (typeof s.spin === "boolean") GL.spin = s.spin; } catch (e) { /* 저장소 없음 */ }
  const saveGL = () => { try { localStorage.setItem("hub-globe", JSON.stringify({ net: GL.net, spin: GL.spin })); } catch (e) { /* 무시 */ } };
  const CC_NUM = { KR: "410", JP: "392", CN: "156", TW: "158", TH: "764", VN: "704", PH: "608", MY: "458", ID: "360", IN: "356", AE: "784", QA: "634", TR: "792", GB: "826", FR: "250", DE: "276", NL: "528", IT: "380", ES: "724", CH: "756", AT: "040", CZ: "203", US: "840", CA: "124", AU: "036", NZ: "554" };
  let globe = null;

  function glFlights() { const t0 = GL.days ? Date.now() - GL.days * 86400000 : 0; return PS.pireps.filter(p => new Date(p.filed).getTime() >= t0 && (GL.ac === "all" || p.ac === GL.ac) && aptBy[p.dep] && aptBy[p.arr]); }
  function glData() {
    const L = glFlights(), R = {}, V = {};
    L.forEach(p => { const k = p.dep < p.arr ? p.dep + "-" + p.arr : p.arr + "-" + p.dep, r = R[k] || (R[k] = { key: k, a: k.slice(0, 3), b: k.slice(4), n: 0, km: p.km, last: p.filed }); r.n++; if (p.filed > r.last) r.last = p.filed; V[p.dep] = (V[p.dep] || 0) + 1; V[p.arr] = (V[p.arr] || 0) + 1; });
    const routes = Object.keys(R).map(k => R[k]).sort((x, y) => y.n - x.n || y.km - x.km), cc = new Set(Object.keys(V).map(c => aptBy[c].cc));
    return { flights: L, routes: routes, visits: V, countries: cc, km: L.reduce((s, p) => s + p.km, 0), longest: routes.slice().sort((x, y) => y.km - x.km)[0] || null };
  }
  function glPanel() {
    const D = glData(), sel = GL.sel, here = PS.pilot.loc;
    const acIds = Array.from(new Set(PS.pireps.map(p => p.ac))).filter(id => byId[id]);
    const head = `<div class="fp-h"><h2>${ICON.globe}비행 지도</h2><p>${D.flights.length ? `비행 ${fmt(D.flights.length)}건의 노선입니다. 지구본을 끌어서 돌리고 휠로 확대하세요.` : "조건에 맞는 비행이 없습니다. 기간이나 기종을 바꿔 보세요."}</p></div>`;
    const tiles = `<div class="rcards">${rcard(ICON.route, "노선", fmt(D.routes.length), `<small>비행 ${fmt(D.flights.length)}건</small>`)}${rcard(ICON.flag, "공항", fmt(Object.keys(D.visits).length), `<small>${fmt(D.countries.size)}개국</small>`)}${rcard(ICON.gauge, "총 거리", distTxt(D.km), `<small>지구 ${N(D.km / 40075)}바퀴</small>`, true)}</div>`;
    let detail = "";
    if (sel && sel.indexOf("-") > 0) {
      const r = D.routes.find(x => x.key === sel);
      if (r) detail = `<div class="gl-sel"><div class="gl-sel-h"><b class="mono">${r.a} ↔ ${r.b}</b><button type="button" class="btn glass" data-gl="clear" id="gl-clear">선택 해제</button></div><p>${esc(aptBy[r.a].name)} ↔ ${esc(aptBy[r.b].name)}</p><div class="rcards">${rcard(ICON.route, "거리", distTxt(r.km), `<small>대권 거리</small>`)}${rcard(ICON.doc, "비행", r.n + "회", `<small>최근 ${dayKo(r.last)}</small>`)}</div></div>`;
    } else if (sel && aptBy[sel]) {
      const a = aptBy[sel], rs = D.routes.filter(r => r.a === sel || r.b === sel);
      detail = `<div class="gl-sel"><div class="gl-sel-h"><b class="mono">${a.icao} / ${a.iata}</b><button type="button" class="btn glass" data-gl="clear" id="gl-clear">선택 해제</button></div><p>${esc(a.name)} · ${esc(CCN[a.cc] || a.cc)}${sel === here ? " · 현재 위치" : ""}</p><div class="rcards">${rcard(ICON.doc, "이착륙", (D.visits[sel] || 0) + "회", `<small>${rs.length}개 노선</small>`)}${rcard(ICON.route, "현재 위치에서", sel === here ? "0" : distTxt(aptKm(here, sel)), `<small>${here} 기준</small>`)}</div><a class="btn glass" href="#apt-${sel}" style="margin-top:8px">${ICON.map}공항 정보와 차트</a></div>`;
    }
    const list = D.routes.length ? D.routes.map(r => `<button type="button" class="bk-row gl-row${sel === r.key ? " on" : ""}" data-gl="route:${r.key}" id="glr-${r.key}"><b>${r.a} ↔ ${r.b}</b><span>${r.n}회</span><span class="km">${distTxt(r.km)}</span></button>`).join("") : `<p class="empty" style="padding:10px 8px">아직 그릴 노선이 없습니다. PIREP을 제출하면 여기에 쌓입니다.</p>`;
    return `${head}<div class="fp-list gl-list">${tiles}
<div class="fld"><label for="gl-ac">기종</label><select class="sel" id="gl-ac"><option value="all">모든 기종</option>${acIds.map(id => `<option value="${id}"${GL.ac === id ? " selected" : ""}>${ICAO[id]} · ${esc(short(byId[id]))}</option>`).join("")}</select></div>
<label class="small gl-chk"><input type="checkbox" id="gl-net"${GL.net ? " checked" : ""}> 가 보지 않은 취항지도 표시</label>
<label class="small gl-chk"><input type="checkbox" id="gl-spin"${GL.spin ? " checked" : ""}> 자동 회전</label>
${detail}<div class="lbl" style="margin-top:4px">노선 ${fmt(D.routes.length)}개</div><div class="bk-list">${list}</div>${PS.demo ? `<p class="small muted" style="margin:6px 2px 0">지금 보이는 노선은 예시 기록입니다. 첫 PIREP을 제출하면 내 노선으로 바뀝니다.</p>` : ""}</div>`;
  }
  function renderFlightMap() {
    return `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / <a href="#profile">내 프로필</a></div><h1>비행 지도</h1><p>지금까지 비행한 노선을 지구본 위에 그렸습니다. 선은 출발지와 도착지를 잇는 대권이고, 굵을수록 자주 다닌 노선입니다. 공항이나 노선을 누르면 자세한 내용이 나옵니다.</p></div><div class="actions">${seg("gldays", [[0, "전체"], [365, "1년"], [90, "90일"], [30, "30일"]], GL.days, "기간")}</div></header>
<section class="card" id="globecard"><div class="gl-wrap" id="gl-wrap"><div class="gl-stage" id="gl-box"><canvas id="gl-cv" role="img" aria-label="비행한 노선을 그린 지구본"></canvas><div class="gl-tools" role="group" aria-label="지구본 조작"><button type="button" class="ch-btn" data-gl="in" id="gl-in" aria-label="확대" title="확대">${CHI.plus}</button><button type="button" class="ch-btn" data-gl="out" id="gl-out" aria-label="축소" title="축소">${CHI.minus}</button><button type="button" class="ch-btn" data-gl="home" id="gl-home" aria-label="현재 위치로" title="현재 위치로">${CHI.fit}</button></div><div class="gl-tip" id="gl-tip" hidden></div><p class="gl-msg" id="gl-msg" hidden>지구본을 그리는 데 필요한 지도 라이브러리를 불러오지 못했습니다. 인터넷 연결을 확인하고 새로 고쳐 주세요. 노선 목록은 그대로 볼 수 있습니다.</p><p class="gl-credit">지도: Natural Earth</p></div><div class="float-panel gl-panel" id="gl-panel">${glPanel()}</div></div></section>`;
  }
  function globeLeave() { if (!globe) return; cancelAnimationFrame(globe.raf); if (globe.ro) globe.ro.disconnect(); globe.dead = true; globe = null; }
  function paintGlobePanel() { const pn = $("#gl-panel"); if (!pn) return; const l = pn.querySelector(".fp-list"), y = l ? l.scrollTop : 0; pn.innerHTML = glPanel(); const n = pn.querySelector(".fp-list"); if (n) n.scrollTop = y; if (globe) globe.refresh(); }

  function initGlobe() {
    globeLeave();
    const cv = $("#gl-cv"), box = $("#gl-box"); if (!cv || !box) return;
    if (typeof d3 === "undefined" || !d3.geoOrthographic || typeof topojson === "undefined" || typeof WORLD_TOPO === "undefined") { const m = $("#gl-msg"); if (m) m.hidden = false; cv.hidden = true; return; }
    const ctx = cv.getContext("2d"), tipEl = $("#gl-tip");
    const countries = topojson.feature(WORLD_TOPO, WORLD_TOPO.objects.countries).features, borders = topojson.mesh(WORLD_TOPO, WORLD_TOPO.objects.countries, (a, b) => a !== b), land = { type: "FeatureCollection", features: countries }, grat = d3.geoGraticule10();
    const proj = d3.geoOrthographic().clipAngle(90).precision(0.5), path = d3.geoPath(proj, ctx);
    const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const here0 = aptBy[PS.pilot.loc], home = () => [-aptBy[PS.pilot.loc].lon, -Math.max(-55, Math.min(55, aptBy[PS.pilot.loc].lat * 0.75)), 0];
    const G = globe = { raf: 0, dead: false, ro: null, rot: [-here0.lon, -here0.lat * 0.75, 0], k: 1, W: 0, H: 0, R: 100, dpr: 1, hover: null, tween: null, idle: performance.now() - 5000, dirty: true, D: glData(), vis: null, pts: [] };
    const setData = () => { G.D = glData(); G.vis = new Set(); G.D.countries.forEach(c => { if (CC_NUM[c]) G.vis.add(CC_NUM[c]); }); G.visF = { type: "FeatureCollection", features: countries.filter(f => G.vis.has(f.id)) }; G.dirty = true; };
    G.refresh = setData; setData();
    const toR = Math.PI / 180;
    // 지구 좌표 → 화면. alt만큼 지표에서 띄운다. 뒷면이면서 원반 안쪽이면 가려진 것으로 본다.
    function p3(rotFn, lon, lat, alt) {
      const q = rotFn([lon, lat]), l = q[0] * toR, p = q[1] * toR, c = Math.cos(p), x = c * Math.sin(l), y = Math.sin(p), z = c * Math.cos(l), m = 1 + alt, R = G.R * G.k;
      return { x: G.W / 2 + R * m * x, y: G.H / 2 - R * m * y, z: z, vis: z > 0 || (x * x + y * y) * m * m > 1.0004 };
    }
    function size() {
      const r = box.getBoundingClientRect(); if (!r.width || !r.height) return;
      G.W = r.width; G.H = r.height; G.dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(G.W * G.dpr); cv.height = Math.round(G.H * G.dpr); cv.style.width = G.W + "px"; cv.style.height = G.H + "px";
      G.R = Math.min(G.W, G.H) * 0.43; G.dirty = true;
    }
    function draw(now) {
      const W = G.W, H = G.H, cx = W / 2, cy = H / 2, R = G.R * G.k, rotFn = d3.geoRotation(G.rot), D = G.D, sel = GL.sel, t = now / 1000;
      proj.translate([cx, cy]).scale(R).rotate(G.rot);
      ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      let g = ctx.createRadialGradient(cx, cy, R * 0.97, cx, cy, R * 1.17); g.addColorStop(0, "rgba(96,165,250,.34)"); g.addColorStop(1, "rgba(96,165,250,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.17, 0, 7); ctx.fill();
      g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.08, cx, cy, R); g.addColorStop(0, "#23406a"); g.addColorStop(1, "#0c182b"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      ctx.beginPath(); path(grat); ctx.strokeStyle = "rgba(148,163,184,.12)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); path(land); ctx.fillStyle = "#31445c"; ctx.fill();
      if (G.visF.features.length) { ctx.beginPath(); path(G.visF); ctx.fillStyle = "#3f5f9a"; ctx.fill(); }
      ctx.beginPath(); path(borders); ctx.strokeStyle = "rgba(170,184,202,.3)"; ctx.lineWidth = 0.6; ctx.stroke();
      g = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R); g.addColorStop(0, "rgba(2,6,14,0)"); g.addColorStop(1, "rgba(2,6,14,.5)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      // 노선
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      D.routes.forEach((r, ri) => {
        const A = aptBy[r.a], B = aptBy[r.b], ip = d3.geoInterpolate([A.lon, A.lat], [B.lon, B.lat]), hmax = Math.min(0.26, 0.03 + r.km / 20000 * 0.34);
        const on = sel === r.key || sel === r.a || sel === r.b, dim = !!sel && !on, n = 56, P = [];
        for (let i = 0; i <= n; i++) { const f = i / n, q = ip(f); P.push(p3(rotFn, q[0], q[1], hmax * Math.sin(Math.PI * f))); }
        const stroke = (w, col) => { ctx.beginPath(); let pen = false; for (let i = 0; i <= n; i++) { const p = P[i]; if (!p.vis) { pen = false; continue; } if (pen) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); pen = true; } ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke(); };
        const w = Math.min(4, 1.3 + Math.log2(r.n + 1) * 0.8);
        stroke(w + 5, on ? "rgba(251,191,36,.2)" : dim ? "rgba(125,165,255,.05)" : "rgba(125,165,255,.16)");
        stroke(w, on ? "#fbbf24" : dim ? "rgba(143,180,255,.3)" : "#8fb4ff");
        if (!still) { const f = (t * (0.11 + 900 / (r.km + 3000) * 0.1) + ri * 0.37) % 1, q = ip(f), p = p3(rotFn, q[0], q[1], hmax * Math.sin(Math.PI * f)); if (p.vis && !dim) { ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, 7); ctx.fillStyle = "#ffffff"; ctx.fill(); } }
      });
      // 공항
      G.pts = []; ctx.font = "600 11px " + getComputedStyle(document.body).fontFamily; ctx.textBaseline = "middle";
      APT.forEach(a => {
        const v = D.visits[a[0]] || 0, cur = a[0] === PS.pilot.loc; if (!v && !cur && !GL.net) return;
        const p = p3(rotFn, a[5], a[4], 0); if (p.z <= 0.02) return;
        const on = sel === a[0] || (sel && sel.indexOf("-") > 0 && (sel.slice(0, 3) === a[0] || sel.slice(4) === a[0])), hov = G.hover === a[0];
        G.pts.push({ c: a[0], x: p.x, y: p.y, v: v });
        if (!v && !cur) { ctx.beginPath(); ctx.arc(p.x, p.y, hov ? 3.4 : 2, 0, 7); ctx.fillStyle = hov ? "rgba(226,232,240,.95)" : "rgba(170,184,202,.55)"; ctx.fill(); if (hov) { ctx.fillStyle = "#e2e8f0"; ctx.fillText(a[0], p.x + 7, p.y); } return; }
        if (cur && !still) { const ph = (t % 2.2) / 2.2; ctx.beginPath(); ctx.arc(p.x, p.y, 5 + ph * 11, 0, 7); ctx.strokeStyle = `rgba(52,211,153,${N(0.7 * (1 - ph))})`; ctx.lineWidth = 1.5; ctx.stroke(); }
        const rr = (cur ? 4.6 : 3.2 + Math.min(2, Math.log2(v + 1) * 0.5)) + (hov || on ? 1.4 : 0);
        ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, 7); ctx.fillStyle = cur ? "#34d399" : on ? "#fbbf24" : "#ffffff"; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = "#0c182b"; ctx.stroke();
        if (G.k > 0.85 || hov || on) { ctx.lineWidth = 3; ctx.strokeStyle = "rgba(8,14,26,.85)"; ctx.strokeText(a[0], p.x + rr + 4, p.y); ctx.fillStyle = on ? "#fde68a" : "#f1f5f9"; ctx.fillText(a[0], p.x + rr + 4, p.y); }
      });
    }
    function frame(now) {
      if (G.dead) return; G.raf = requestAnimationFrame(frame);
      if (G.tween) { const u = Math.min(1, (now - G.tween.t0) / G.tween.ms), e = 1 - Math.pow(1 - u, 3); G.rot = [G.tween.a[0] + G.tween.d[0] * e, G.tween.a[1] + G.tween.d[1] * e, 0]; if (G.tween.k) G.k = G.tween.k[0] + (G.tween.k[1] - G.tween.k[0]) * e; if (u >= 1) G.tween = null; G.dirty = true; }
      else if (GL.spin && !still && !G.drag && now - G.idle > 2600) { G.rot = [G.rot[0] + 0.045, G.rot[1], 0]; G.dirty = true; }
      if (still && !G.dirty) return;
      G.dirty = false; draw(now);
    }
    const lonDelta = (a, b) => ((b - a + 540) % 360) - 180;
    G.flyTo = (lon, lat, k) => { const to = [-lon, -Math.max(-60, Math.min(60, lat * 0.8))]; G.tween = { t0: performance.now(), ms: still ? 1 : 750, a: G.rot.slice(), d: [lonDelta(G.rot[0], to[0]), to[1] - G.rot[1]], k: k ? [G.k, k] : null }; G.idle = performance.now() + 2500; };
    const clampK = k => Math.max(0.7, Math.min(7, k));
    const zoom = f => { G.k = clampK(G.k * f); G.dirty = true; G.idle = performance.now(); };
    const rel = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const hit = (x, y) => { let best = null, bd = 14 * 14; G.pts.forEach(p => { const d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y) - (p.v ? 30 : 0); if (d < bd) { bd = d; best = p; } }); return best; };
    const ptrs = new Map(); let pinch = null;
    cv.addEventListener("pointerdown", e => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      try { cv.setPointerCapture(e.pointerId); } catch (er) { /* 무시 */ }
      const p = rel(e); ptrs.set(e.pointerId, p); G.tween = null; G.idle = performance.now();
      if (ptrs.size === 1) G.drag = { x: p[0], y: p[1], rot: G.rot.slice(), moved: 0 };
      else if (ptrs.size === 2) { const v = [...ptrs.values()]; pinch = { d: Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]) || 1, k: G.k }; G.drag = null; }
      cv.classList.add("grab");
    });
    cv.addEventListener("pointermove", e => {
      const p = rel(e);
      if (ptrs.has(e.pointerId)) {
        ptrs.set(e.pointerId, p); G.idle = performance.now();
        if (pinch && ptrs.size >= 2) { const v = [...ptrs.values()]; G.k = clampK(pinch.k * (Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]) || 1) / pinch.d); G.dirty = true; return; }
        if (G.drag) { const dx = p[0] - G.drag.x, dy = p[1] - G.drag.y, s = 57.3 / (G.R * G.k); G.drag.moved = Math.max(G.drag.moved, Math.abs(dx) + Math.abs(dy)); G.rot = [G.drag.rot[0] + dx * s, Math.max(-88, Math.min(88, G.drag.rot[1] - dy * s)), 0]; G.dirty = true; if (tipEl) tipEl.hidden = true; }
        return;
      }
      const h = hit(p[0], p[1]), c = h ? h.c : null;
      if (c !== G.hover) { G.hover = c; G.dirty = true; cv.style.cursor = c ? "pointer" : ""; }
      if (tipEl) { if (h) { const a = aptBy[h.c]; tipEl.hidden = false; tipEl.innerHTML = `<b>${a.iata} · ${esc(a.name)}</b><br>${esc(CCN[a.cc] || a.cc)} · ${h.v ? "이착륙 " + h.v + "회" : "아직 가 보지 않음"}`; tipEl.style.left = Math.min(G.W - 190, p[0] + 14) + "px"; tipEl.style.top = Math.max(6, p[1] - 44) + "px"; } else tipEl.hidden = true; }
    });
    const up = e => {
      if (!ptrs.has(e.pointerId)) return; const p = ptrs.get(e.pointerId); ptrs.delete(e.pointerId);
      if (ptrs.size < 2) pinch = null;
      if (!ptrs.size) {
        cv.classList.remove("grab");
        if (G.drag && G.drag.moved < 5 && e.type === "pointerup") { const h = hit(p[0], p[1]); GL.sel = h ? h.c : null; paintGlobePanel(); if (h) G.flyTo(aptBy[h.c].lon, aptBy[h.c].lat); }
        G.drag = null; G.idle = performance.now();
      } else { const q = [...ptrs.values()][0]; G.drag = { x: q[0], y: q[1], rot: G.rot.slice(), moved: 99 }; }
    };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    cv.addEventListener("pointerleave", () => { if (G.hover) { G.hover = null; G.dirty = true; } if (tipEl) tipEl.hidden = true; });
    cv.addEventListener("wheel", e => { e.preventDefault(); zoom(Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0016))); }, { passive: false });
    cv.addEventListener("dblclick", () => zoom(1.6));
    G.act = (act, arg) => {
      if (act === "in") zoom(1.4); else if (act === "out") zoom(1 / 1.4);
      else if (act === "home") { const a = aptBy[PS.pilot.loc]; G.flyTo(a.lon, a.lat, 1); }
      else if (act === "clear") { GL.sel = null; paintGlobePanel(); }
      else if (act === "route") { const r = G.D.routes.find(x => x.key === arg); if (!r) return; GL.sel = GL.sel === arg ? null : arg; paintGlobePanel(); if (GL.sel) { const A = aptBy[r.a], B = aptBy[r.b], m = d3.geoInterpolate([A.lon, A.lat], [B.lon, B.lat])(0.5); G.flyTo(m[0], m[1], r.km > 9000 ? 0.95 : r.km > 3000 ? 1.5 : r.km > 900 ? 2.6 : 4.2); } }
    };
    size(); if (typeof ResizeObserver !== "undefined") { G.ro = new ResizeObserver(size); G.ro.observe(box); }
    G.raf = requestAnimationFrame(frame);
  }
