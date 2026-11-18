  /* ================= 화면 움직임 =================
     페이지를 열 때 카드가 차례로 올라오고, 숫자는 0부터 세어 올라가고, 막대는 왼쪽부터 찬다.
     움직임 줄이기 설정을 켠 사용자에게는 아무것도 하지 않는다. */
  // 조사 결과에 따른 원칙 (.claude/research-interactive.md):
  //  - 등장 효과는 한 세션에서 그 페이지를 처음 열 때만, 짧게 (250ms 안팎, 늦어도 400ms 안에 끝).
  //  - 같은 묶음 안에서 탭을 바꿀 때는 본문만 150ms 페이드. 머리 상자와 탭 줄은 움직이지 않는다.
  //  - 숫자 세기는 큰 통계 타일(.stat-n)에만, 700ms. 표 안 숫자는 세지 않는다.
  const FX_SYS = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  let fxCalmPref = false; try { fxCalmPref = localStorage.getItem("hub-calm") === "1"; } catch (e) { /* 저장소 없음 */ }
  const fxCalm = () => FX_SYS || fxCalmPref;
  const fxSetCalm = on => { fxCalmPref = !!on; try { localStorage.setItem("hub-calm", on ? "1" : "0"); } catch (e) { /* 무시 */ } document.documentElement.classList.toggle("calm", fxCalm()); };
  document.documentElement.classList.toggle("calm", fxCalm());
  document.addEventListener("change", e => { if (e.target && e.target.id === "set-calm") fxSetCalm(e.target.checked); });
  // 비행기 모양 커서. 기본으로 켜 두고 설정에서 끌 수 있다 (터치 기기에는 커서가 없으니 상관없다)
  let planeCur = true; try { planeCur = localStorage.getItem("hub-planecur") !== "0"; } catch (e) { /* 저장소 없음 */ }
  const planeCurOn = () => planeCur;
  document.documentElement.classList.toggle("plane-cur", planeCur);
  document.addEventListener("change", e => { if (e.target && e.target.id === "set-planecur") { planeCur = e.target.checked; try { localStorage.setItem("hub-planecur", planeCur ? "1" : "0"); } catch (er) { /* 무시 */ } document.documentElement.classList.toggle("plane-cur", planeCur); } });
  let fxSeen = {}; try { fxSeen = JSON.parse(sessionStorage.getItem("hub-seen") || "{}") || {}; } catch (e) { /* 무시 */ }
  let fxObs = null, fxPrevCat = null;
  function fxCount(el) {
    const tn = Array.from(el.childNodes).find(n => n.nodeType === 3 && n.textContent.trim()); if (!tn) return;
    const raw = tn.textContent.trim(); if (!/^[+-]?[\d,]+(\.\d+)?$/.test(raw)) return;
    const end = parseFloat(raw.replace(/,/g, "")), dec = (raw.split(".")[1] || "").length, comma = raw.indexOf(",") >= 0, sign = raw[0] === "+" ? "+" : "";
    if (!isFinite(end) || Math.abs(end) < 2 || (!comma && !dec && end >= 1900 && end <= 2100)) return; // 연도는 세지 않는다
    const out = v => sign + (comma ? v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : v.toFixed(dec));
    const t0 = performance.now(), dur = 700;
    const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); tn.textContent = out(end * e); if (k < 1) requestAnimationFrame(step); else tn.textContent = raw; };
    requestAnimationFrame(step);
  }
  function fxShow(card) {
    card.classList.add("fx-in");
    card.querySelectorAll(".stat-n").forEach(fxCount);
    card.querySelectorAll(".hbar-f, .prog-f").forEach(b => { const w = b.style.width; b.style.width = "0"; void b.offsetWidth; b.classList.add("fx-grow"); b.style.width = w; });
    // 움직임이 끝나면 transform을 걷어 낸다 (안쪽의 전체 화면 차트가 fixed로 뜰 수 있게)
    setTimeout(() => { card.classList.remove("fx-wait", "fx-in"); card.style.removeProperty("--fx-i"); }, 700);
  }
  function fxPage(root, key) {
    if (fxObs) { fxObs.disconnect(); fxObs = null; }
    const cat = typeof catOf === "function" ? catOf(key) : null, sameCat = !!cat && cat === fxPrevCat;
    fxPrevCat = cat;
    if (fxCalm()) return;
    const first = !fxSeen[key]; fxSeen[key] = 1; try { sessionStorage.setItem("hub-seen", JSON.stringify(fxSeen)); } catch (e) { /* 무시 */ }
    const blocks = Array.from(root.children).filter(c => !c.matches(".ctabs, header.ph, header.hero"));
    if (!first || sameCat) { // 다시 온 페이지나 탭 전환: 본문만 짧게 페이드
      blocks.forEach(b => { b.classList.remove("fx-fade"); void b.offsetWidth; b.classList.add("fx-fade"); });
      return;
    }
    const cards = Array.from(root.querySelectorAll(".card")).filter(c => !c.parentElement.closest(".card") && !c.matches("header.ph"));
    fxObs = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { fxObs.unobserve(en.target); fxShow(en.target); } }), { rootMargin: "0px 0px -40px 0px" }) : null;
    let i = 0;
    cards.forEach(c => {
      const inView = c.getBoundingClientRect().top < window.innerHeight;
      c.style.setProperty("--fx-i", inView ? Math.min(i++, 5) : 0);
      c.classList.add("fx-wait");
      if (fxObs) fxObs.observe(c); else fxShow(c);
    });
  }

  /* ================= 지도 전체 화면 =================
     지도가 든 카드(.mapwrap, .gl-wrap)마다 오른쪽 아래에 전체 화면 버튼을 단다.
     브라우저 전체 화면을 먼저 시도하고, 안 되면 창 안에서 카드를 꽉 채운다. Esc로 나온다. */
  const FS_IN = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  const FS_OUT = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
  let mfCard = null;
  // 만들어진 세계 지도(jsVectorMap)를 모아 두었다가 크기가 바뀌면 다시 맞춘다
  const VMAPS = new Set();
  if (typeof jsVectorMap !== "undefined" && !jsVectorMap.__fx) {
    const Orig = jsVectorMap;
    // 지도 위에서 휠을 굴리면 부드럽게 확대, 축소한다
    const Wrapped = function (o) {
      const wheel = !!(o && o.zoomOnScroll); if (wheel) o = Object.assign({}, o, { zoomOnScroll: false });
      const m = new Orig(o); VMAPS.add(m);
      if (wheel && m.container) {
        const c = m.container; let hintT = 0;
        c.addEventListener("wheel", e => {
          { // 휠만 굴려도 확대, 축소한다 (사용자 요청)
            e.preventDefault(); const r = c.getBoundingClientRect(), d = e.deltaY || 0, f = Math.pow(1.0015, -d * (e.deltaMode === 1 ? 33 : 1));
            // 목표 배율을 정해 두고 몇 프레임에 걸쳐 다가간다
            m.__zt = Math.max(m._baseScale * (m.params.zoomMin || 1), Math.min(m._baseScale * (m.params.zoomMax || 120), (m.__zt || m.scale) * f)); m.__za = [e.clientX - r.left, e.clientY - r.top];
            if (!m.__zr) { const z = () => { const ns = m.scale + (m.__zt - m.scale) * 0.28; try { m._setScale(ns, m.__za[0], m.__za[1]); } catch (er) { /* 무시 */ } if (Math.abs(m.__zt - m.scale) / m.scale > 0.002) m.__zr = requestAnimationFrame(z); else { m.__zr = 0; m.__zt = 0; } }; m.__zr = requestAnimationFrame(z); }
            return;
          }
        }, { passive: false });
      }
      return m;
    };
    Object.setPrototypeOf(Wrapped, Orig); Wrapped.prototype = Orig.prototype; Wrapped.__fx = true;
    try { window.jsVectorMap = Wrapped; } catch (e) { /* 그대로 둔다 */ }
  }
  // 크기를 바꿔도 보던 곳이 가운데에 남도록 중심을 지킨다
  const mfFit = () => { VMAPS.forEach(m => {
    const el = m.container; if (!el || !document.contains(el)) { VMAPS.delete(m); return; }
    const W1 = el.offsetWidth, H1 = el.offsetHeight; if (!W1 || !H1 || (W1 === m._width && H1 === m._height)) return;
    try { const s0 = m.scale, cx = m._width / 2 / s0 - m.transX, cy = m._height / 2 / s0 - m.transY; m.updateSize(); const s1 = m.scale; m.transX = m._width / 2 / s1 - cx; m.transY = m._height / 2 / s1 - cy; m._applyTransform(); } catch (e) { /* 무시 */ }
  }); };
  const mfNudge = () => { requestAnimationFrame(mfFit); setTimeout(mfFit, 150); setTimeout(mfFit, 400); };
  function mfSet(card, on) {
    if (!card) return;
    card.classList.toggle("map-full", on); document.body.classList.toggle("ch-lock", on);
    card.querySelectorAll(".mf-btn").forEach(b => { b.innerHTML = on ? FS_OUT : FS_IN; b.setAttribute("aria-label", on ? "전체 화면 끝내기" : "지도 전체 화면"); b.title = b.getAttribute("aria-label"); });
    mfCard = on ? card : null; mfNudge();
  }
  function mfToggle(card) {
    const on = !card.classList.contains("map-full");
    if (on) { mfSet(card, true); if (card.requestFullscreen) card.requestFullscreen().catch(() => {}); }
    else { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); mfSet(card, false); }
  }
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && mfCard) mfSet(mfCard, false); else mfNudge(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && mfCard && !document.fullscreenElement) mfSet(mfCard, false); });
  document.addEventListener("click", e => { const b = e.target.closest(".mf-btn"); if (b) { e.preventDefault(); mfToggle(b.closest(".card")); } });
  window.addEventListener("hashchange", () => { if (mfCard) { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); mfSet(mfCard, false); } });
  function mapFullButtons(root) {
    root.querySelectorAll(".mapwrap, .gl-wrap").forEach(w => {
      const card = w.closest(".card"); if (!card || w.querySelector(".mf-btn")) return;
      if (card.classList.contains("nomap")) return;
      const host = w.querySelector(".gl-stage") || w.querySelector(".sitemap") || w;
      host.insertAdjacentHTML("beforeend", `<button type="button" class="mf-btn" aria-label="지도 전체 화면" title="지도 전체 화면">${FS_IN}</button>`);
    });
  }

  /* ================= 목록과 지도 함께 강조 =================
     비행 예약에서 목록 행에 올리면 지도 점이, 지도 점에 올리면 목록 행이 같이 밝아진다. */
  let lnkKey = null;
  function lnkSet(key, from) {
    const card = document.getElementById("bookcard"); if (!card) return;
    card.querySelectorAll(".hl").forEach(n => n.classList.remove("hl"));
    lnkKey = key; if (!key) return;
    card.querySelectorAll(`[data-pilot="${key}"]`).forEach(n => n.classList.add("hl"));
    if (from === "map") { const row = card.querySelector(`.bk-row[data-pilot="${key}"]`), box = row && row.parentElement; if (row && box && box.scrollHeight > box.clientHeight) { const t = row.offsetTop - box.offsetTop; if (t < box.scrollTop || t > box.scrollTop + box.clientHeight - row.offsetHeight) box.scrollTo({ top: t - box.clientHeight / 2, behavior: fxCalm() ? "auto" : "smooth" }); } }
  }
  document.addEventListener("mouseover", e => {
    const t = e.target.closest && e.target.closest('#bookcard [data-pilot^="dest:"]');
    const k = t ? t.getAttribute("data-pilot") : null; if (k !== lnkKey) lnkSet(k, t && t.closest(".live-ov") ? "map" : "list");
  });
  document.addEventListener("focusin", e => { const t = e.target.closest && e.target.closest('#bookcard .bk-row'); if (t) lnkSet(t.getAttribute("data-pilot"), "list"); });
  // 지도를 다시 그려도 강조가 남도록 한다
  new MutationObserver(() => { if (lnkKey) { const card = document.getElementById("bookcard"); if (card) card.querySelectorAll(`.live-ov [data-pilot="${lnkKey}"]:not(.hl)`).forEach(n => n.classList.add("hl")); } }).observe(document.getElementById("app"), { childList: true, subtree: true });

  /* ================= 점수 계산기 =================
     점수 기준 페이지: 착륙률과 비행 시간을 움직이면 실제 채점 함수(scorePirep)로 다시 계산하고,
     위 규칙표에서 해당하는 줄을 밝힌다. */
  function scCalc() {
    const L = document.getElementById("sc-land"), T = document.getElementById("sc-time"); if (!L || !T) return;
    const land = +L.value, min = +T.value, sc = scorePirep({ land: -land, time: min });
    document.getElementById("sc-land-v").textContent = `-${land} fpm`;
    document.getElementById("sc-time-v").textContent = hm(min);
    document.getElementById("sc-total").textContent = sc.total;
    document.getElementById("sc-rows").innerHTML = sc.rows.map(r => `<div><span>${esc(r[0])}</span><b class="${r[1] > 0 ? "pos" : r[1] < 0 ? "neg" : ""}">${r[1] > 0 ? "+" : ""}${r[1]}</b></div>`).join("");
    const li = land <= 100 ? 0 : land <= 200 ? 1 : land <= 300 ? 2 : land <= 500 ? 3 : 4, ti = min < 120 ? 0 : min < 300 ? 1 : 2;
    const mark = (id, i) => { const box = document.getElementById(id); if (box) Array.from(box.children).forEach((c, j) => c.classList.toggle("hit", j === i)); };
    mark("sc-pl", li); mark("sc-pt", ti);
    const pct = (el) => ((el.value - el.min) / (el.max - el.min) * 100) + "%"; L.style.setProperty("--p", pct(L)); T.style.setProperty("--p", pct(T));
  }
  document.addEventListener("input", e => { if (e.target && (e.target.id === "sc-land" || e.target.id === "sc-time")) scCalc(); });

  /* ================= 기종 비교: 다른 점만 보기 ================= */
  document.addEventListener("change", e => {
    if (!e.target || e.target.id !== "cmp-diff") return;
    const on = e.target.checked;
    document.querySelectorAll("#cmp-ov tbody tr").forEach(tr => { const td = tr.querySelectorAll("td"); const same = td.length >= 3 && td[1].textContent.trim() === td[2].textContent.trim(); tr.hidden = on && same; });
  });

  /* ================= 기종 도면과 제원 연결 =================
     제원 칸(길이, 날개폭, 높이, 동체 폭)에 올리면 도면의 같은 치수선이, 치수선에 올리면 제원 칸이 밝아진다.
     칸을 누르면 도면으로 스크롤한다. */
  const DIM_KEYS = ["동체 폭", "날개폭", "길이", "높이"];
  const dimKeyOf = t => DIM_KEYS.find(k => (t || "").trim().indexOf(k) === 0) || null;
  function dimLink(root) {
    let n = 0;
    root.querySelectorAll(".ac-svg .dim").forEach(g => { const k = dimKeyOf(g.textContent); if (k) { g.setAttribute("data-dim", k); n++; } });
    if (!n) return;
    root.querySelectorAll(".kv").forEach(kv => { const l = kv.querySelector(".lbl"), k = l && dimKeyOf(l.textContent); if (k && root.querySelector(`.ac-svg .dim[data-dim="${k}"]`)) { kv.setAttribute("data-dim", k); kv.classList.add("kv-dim"); kv.tabIndex = 0; kv.title = "도면에서 보기"; } });
  }
  let dimOn = null;
  const dimSet = k => { if (k === dimOn) return; dimOn = k; document.querySelectorAll("#app .dim-hl").forEach(x => x.classList.remove("dim-hl")); if (k) document.querySelectorAll(`#app [data-dim="${k}"]`).forEach(x => x.classList.add("dim-hl")); };
  document.addEventListener("mouseover", e => { const t = e.target.closest && e.target.closest("#app [data-dim]"); dimSet(t ? t.getAttribute("data-dim") : null); });
  document.addEventListener("focusin", e => { const t = e.target.closest && e.target.closest("#app .kv-dim"); dimSet(t ? t.getAttribute("data-dim") : null); });
  const dimJump = kv => { const g = document.querySelector(`#app .ac-svg .dim[data-dim="${kv.getAttribute("data-dim")}"]`); if (!g) return; const svg = g.closest("svg"); (svg || g).scrollIntoView({ block: "center", behavior: fxCalm() ? "auto" : "smooth" }); dimSet(kv.getAttribute("data-dim")); };
  document.addEventListener("click", e => { const kv = e.target.closest && e.target.closest("#app .kv-dim"); if (kv) dimJump(kv); });
  document.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("kv-dim")) { e.preventDefault(); dimJump(e.target); } });
  // 도면 보기를 바꿔 다시 그려도 연결이 남도록 한다
  new MutationObserver(() => { const app = document.getElementById("app"); if (app.querySelector(".ac-svg .dim:not([data-dim])")) dimLink(app); }).observe(document.getElementById("app"), { childList: true, subtree: true });

  /* ================= 비행운 =================
     비행기 커서가 움직이면 꼬리 쪽에서 가는 두 줄 비행운이 나와 퍼지면서 사라진다.
     화면 전체를 덮는 캔버스 하나에 그리고, 클릭이나 스크롤은 막지 않는다(pointer-events:none).
     움직일 때만 그리고, 다 사라지면 멈춘다. 움직임 줄이기나 비행기 커서를 끄면 나오지 않는다. */
  let trailOn = true; try { trailOn = localStorage.getItem("hub-trail") !== "0"; } catch (e) { /* 저장소 없음 */ }
  const trailOk = () => trailOn && planeCurOn() && !fxCalm();
  // 비행운 색: 연회색(gray) 또는 연하늘색(sky). 배경이 어두우면 더 밝은 쪽으로 쓴다
  let trailCol = "gray"; try { trailCol = localStorage.getItem("hub-trail-col") || "gray"; } catch (e) { /* 저장소 없음 */ }
  const TR_COL = { gray: { dark: ["232,236,242", 0.42], light: ["168,176,188", 0.36] }, sky: { dark: ["178,224,252", 0.46], light: ["120,192,238", 0.4] } };
  document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("[data-trailcol]"); if (!b) return; trailCol = b.getAttribute("data-trailcol"); try { localStorage.setItem("hub-trail-col", trailCol); } catch (er) { /* 무시 */ } document.querySelectorAll("[data-trailcol]").forEach(x => x.classList.toggle("on", x === b)); });
  document.addEventListener("change", e => { if (e.target && e.target.id === "set-trail") { trailOn = e.target.checked; try { localStorage.setItem("hub-trail", trailOn ? "1" : "0"); } catch (er) { /* 무시 */ } } });
  const TR = { cv: null, ctx: null, pts: [], raf: 0, dpr: 1, last: null, bgT: 0, bgDark: false };
    function trailCanvas() {
    if (TR.cv) return;
    const cv = document.createElement("canvas"); cv.className = "trail-cv"; cv.setAttribute("aria-hidden", "true");
    document.body.appendChild(cv); TR.cv = cv; TR.ctx = cv.getContext("2d"); trailSize();
    window.addEventListener("resize", trailSize);
  }
  function trailSize() { if (!TR.cv) return; TR.dpr = Math.min(2, window.devicePixelRatio || 1); TR.cv.width = innerWidth * TR.dpr; TR.cv.height = innerHeight * TR.dpr; TR.cv.style.width = innerWidth + "px"; TR.cv.style.height = innerHeight + "px"; }
  // 커서 아래가 어두운지 본다: 사진, 지도, 캔버스는 어둡다고 보고, 그 밖에는 배경색 밝기로 정한다
  function trailBgDark(x, y) {
    let el = document.elementFromPoint(x, y);
    for (let i = 0; el && i < 12; i++, el = el.parentElement) {
      if (el.matches && el.matches("img, canvas, .livemap, .lv3d, .gl-wrap, .banner, .hero > img, .chart.night")) return true;
      const bg = getComputedStyle(el).backgroundColor, m = bg && bg.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/);
      if (m && (m[4] === undefined || +m[4] > 0.5)) return (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) < 128;
    }
    return getComputedStyle(document.documentElement).getPropertyValue("--mg").trim() === "1";
  }
  // 짧게 남는 실제 비행운처럼: 비행기 바로 뒤에 가늘고 밝은 한 줄기가 생기고, 조금만 멀어져도 가늘어지며 사라진다
  // (NASA GLOBE, UCAR 짧은 비행운 사진 설명). 커서 꼬리 효과의 관례대로 움직일 때만 생기고,
  // 빨리 움직이면 길고 굵게, 멈추면 금방 거둬진다. 선을 긋지 않고 끝이 뾰족한 리본 하나를 채워 그린다.
  const TR_LIFE = 420, TR_GAP = 0;
  function trailDraw() {
    TR.raf = 0; const now = performance.now(), c = TR.ctx; if (!c) return;
    // 멈춰 있으면 수명을 짧게 해서 꼬리를 빨리 거둔다
    const idle = now - (TR.lastMove || 0), life = idle > 60 ? TR_LIFE * 0.55 : TR_LIFE;
    TR.pts = TR.pts.filter(p => now - p.t < life);
    c.setTransform(TR.dpr, 0, 0, TR.dpr, 0, 0); c.clearRect(0, 0, innerWidth, innerHeight);
    const P = TR.pts.slice().reverse(); // 머리(최근)부터
    // 꼬리 시작은 커서에서 조금 떨어뜨린다(엔진 뒤의 틈)
    let acc = 0, start = 0; for (let i = 1; i < P.length; i++) { acc += Math.hypot(P[i].x - P[i - 1].x, P[i].y - P[i - 1].y); if (acc >= TR_GAP) { start = i; break; } }
    const Q0 = P.slice(start);
    // 각지는 이유: 마우스 이벤트 사이가 멀면 점과 점이 직선으로 이어져 꺾인다.
    // 그래서 점들을 지나는 매끈한 곡선(캐트멀-롬)을 만들고 3px 간격으로 촘촘히 다시 찍는다
    const Q = [];
    for (let i = 0; i < Q0.length - 1; i++) {
      const p0 = Q0[Math.max(0, i - 1)], p1 = Q0[i], p2 = Q0[i + 1], p3 = Q0[Math.min(Q0.length - 1, i + 2)];
      const seg = Math.max(1, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 3));
      for (let k = 0; k < seg; k++) {
        const t = k / seg, t2 = t * t, t3 = t2 * t;
        const x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
        const y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
        Q.push({ x: x, y: y, t: p1.t + (p2.t - p1.t) * t, dark: p1.dark });
      }
    }
    if (Q0.length) Q.push(Q0[Q0.length - 1]);
    for (let pass = 0; pass < 2; pass++) for (let i = 1; i < Q.length - 1; i++) { const a = Q[i - 1], b = Q[i + 1]; Q[i] = { x: (a.x + Q[i].x * 2 + b.x) / 4, y: (a.y + Q[i].y * 2 + b.y) / 4, t: Q[i].t, dark: Q[i].dark }; }
    if (Q.length >= 3) {
      const wHead = Math.max(0.7, Math.min(2.6, 0.7 + (TR.speed || 0) * 1.6)), n = Q.length;
      const L = [], R = [];
      for (let i = 0; i < n; i++) {
        // 방향은 앞뒤로 두 칸 떨어진 점으로 구해 들쭉날쭉하지 않게 한다
        const a = Q[Math.max(0, i - 2)], b = Q[Math.min(n - 1, i + 2)], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
        const age = (now - Q[i].t) / life, pos = i / (n - 1), w = wHead * Math.pow(1 - pos, 0.9) * (1 - Math.min(1, age) * 0.5) + 0.15 * (1 - pos);
        L.push([Q[i].x + nx * w, Q[i].y + ny * w]); R.push([Q[i].x - nx * w, Q[i].y - ny * w]);
      }
      const head = Q[0], tail = Q[n - 1], dark = head.dark, tc = (TR_COL[trailCol] || TR_COL.gray)[dark ? "dark" : "light"], col = tc[0], a0 = tc[1];
      const gr = c.createLinearGradient(head.x, head.y, tail.x, tail.y); gr.addColorStop(0, `rgba(${col},${a0})`); gr.addColorStop(0.45, `rgba(${col},${a0 * 0.45})`); gr.addColorStop(1, `rgba(${col},0)`);
      c.beginPath(); c.moveTo(L[0][0], L[0][1]); for (let i = 1; i < n; i++) c.lineTo(L[i][0], L[i][1]); for (let i = n - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.closePath();
      c.filter = "blur(0.7px)"; c.fillStyle = gr; c.fill(); c.filter = "none";
    }
    if (TR.pts.length) TR.raf = requestAnimationFrame(trailDraw);
  }
  function trailAdd(cx, cy, now) {
    // 24px 커서 그림에서 꼬리 끝은 클릭 지점(기수 끝)에서 오른쪽 아래로 약 14px. 비행운을 바로 거기서 시작한다
    const x = cx + 14, y = cy + 14, l = TR.last;
    if (l && Math.hypot(x - l.x, y - l.y) < 4) return;
    // 속도(px/ms)를 부드럽게 따라가게 한다. 빠를수록 굵고, 오래 남은 점들이 길게 이어진다
    if (l && TR.lastMove) { const v = Math.hypot(x - l.x, y - l.y) / Math.max(4, now - TR.lastMove); TR.speed = (TR.speed || 0) * 0.8 + v * 0.2; }
    if (!l || now - TR.lastMove > 200) TR.pts = [];
    TR.pts.push({ x: x, y: y, t: now, dark: TR.bgDark });
    if (TR.pts.length > 120) TR.pts.shift();
    TR.last = { x: x, y: y }; TR.lastMove = now;
  }
  document.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse" || !trailOk()) return;
    trailCanvas();
    const now = performance.now();
    if (now - TR.bgT > 120) { TR.bgT = now; TR.bgDark = trailBgDark(e.clientX, e.clientY); }
    trailAdd(e.clientX, e.clientY, now);
    if (!TR.raf) TR.raf = requestAnimationFrame(trailDraw);
  }, { passive: true });
  document.addEventListener("mouseleave", () => { TR.last = null; });

  /* ================= 휴대폰에서 넓은 표 =================
     칸이 4개 이상인 표는 각 칸에 머리글 이름(data-label)을 붙여 두고, 좁은 화면에서는 CSS가 한 줄을 카드처럼 쌓는다 */
  function stackTables(root) {
    root.querySelectorAll("table.tbl").forEach(t => {
      const hs = Array.from(t.querySelectorAll("thead th")).map(th => th.textContent.trim()); if (hs.length < 4) return;
      t.classList.add("tbl-stack");
      t.querySelectorAll("tbody tr").forEach(tr => Array.from(tr.children).forEach((td, i) => { if (hs[i] && !td.hasAttribute("data-label")) td.setAttribute("data-label", hs[i]); }));
    });
  }
  new MutationObserver(() => { const app = document.getElementById("app"); if (app.querySelector("table.tbl:not(.tbl-stack) thead")) stackTables(app); }).observe(document.getElementById("app"), { childList: true, subtree: true });
