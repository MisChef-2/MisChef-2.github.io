// 허브 안에서 쓸 때(index.html?embed): 3D 화면 전체화면 단추
// 브라우저 전체화면을 먼저 쓰고, 안 되면(아이폰, 막힌 브라우저) 창 전체를 덮는 방식으로 대신한다
(function () {
  if (!document.documentElement.classList.contains('embed')) return;
  const stage = document.querySelector('.stage'); if (!stage) return;
  const root = document.documentElement, host = window.frameElement;
  const req = stage.requestFullscreen || stage.webkitRequestFullscreen;
  const canReal = !!req && !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  const real = () => document.fullscreenElement || document.webkitFullscreenElement;
  const pseudo = () => root.classList.contains('pseudo-fs');
  const ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  const OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'fs-button';
  const paint = () => {
    const on = !!real() || pseudo();
    b.innerHTML = (on ? OFF : ON) + `<span>${on ? '전체화면 끝내기' : '전체화면'}</span>`;
    b.setAttribute('aria-label', on ? '전체화면 끝내기' : '전체화면으로 보기');
    stage.classList.toggle('is-fs', on);
  };
  const setPseudo = on => {
    root.classList.toggle('pseudo-fs', on);
    if (host) { host.classList.toggle('m3d-fs', on); host.ownerDocument.documentElement.classList.toggle('m3d-fs-on', on); }
    paint();
  };
  b.onclick = () => {
    if (real()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    if (pseudo()) { setPseudo(false); return; }
    if (!canReal) { setPseudo(true); return; }
    try { const p = req.call(stage); if (p && p.catch) p.catch(() => setPseudo(true)); } catch (e) { setPseudo(true); return; }
    // 대답 없이 막히는 브라우저도 있어서, 잠깐 기다려도 전체화면이 아니면 창 전체로 덮는다
    setTimeout(() => { if (!real() && !pseudo()) setPseudo(true); }, 700);
  };
  const onReal = () => { if (real() && pseudo()) setPseudo(false); paint(); };
  addEventListener('keydown', e => { if (e.key === 'Escape' && pseudo()) setPseudo(false); });
  if (host) host.ownerDocument.addEventListener('keydown', e => { if (e.key === 'Escape' && pseudo()) setPseudo(false); });
  document.addEventListener('fullscreenchange', onReal); document.addEventListener('webkitfullscreenchange', onReal);
  paint(); stage.append(b);
})();

// 기체 버전, 치수, 도색 참고, 보기 설정을 3D 오른쪽에 펼쳐 보는 패널로 옮긴다
(function () {
  if (!document.documentElement.classList.contains('embed')) return;
  const stage = document.querySelector('.stage'), dash = document.querySelector('.dashboard');
  if (!stage || !dash) return;
  const panel = document.createElement('aside');
  panel.className = 'side-panel'; panel.id = 'side-panel'; panel.setAttribute('aria-label', '기체 정보와 보기 설정');
  panel.innerHTML = '<div class="side-head"><strong>기체 정보·설정</strong><button type="button" class="side-close" aria-label="패널 닫기">×</button></div>';
  panel.append(dash); stage.append(panel);
  const open = document.createElement('button');
  open.type = 'button'; open.className = 'side-open'; open.setAttribute('aria-controls', 'side-panel');
  open.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg><span>기체 정보·설정</span>';
  stage.append(open);
  const set = on => { stage.classList.toggle('panel-open', on); open.setAttribute('aria-expanded', on); };
  open.onclick = () => set(true);
  panel.querySelector('.side-close').onclick = () => set(false);
  // 넓은 화면은 펼친 채로 시작, 좁은 화면은 접은 채로
  set(innerWidth >= 900);
  // 객실, 조종실, 설비처럼 패널 안에 조작이 생기는 시점이면 패널을 연다
  const watch = '#walk-controls,.cockpit-views,.facilities-panel';
  new MutationObserver(ms => {
    for (const m of ms) {
      const el = m.target;
      if (m.attributeName === 'hidden' && !el.hidden && el.matches && el.matches(watch)) { set(true); el.scrollIntoView({ block: 'nearest' }); break; }
    }
  }).observe(dash, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
})();

// 배경 고르기: 어두운 배경, 흰 배경, 파란 하늘. 고른 값은 이 브라우저에 기억한다
// 객실, 조종실, 설비 같은 안쪽 시점은 늘 어두운 배경으로 보인다 (embed.css)
(function () {
  if (!document.documentElement.classList.contains('embed')) return;
  const stage = document.querySelector('.stage'); if (!stage) return;
  const KEY = 'jlv-3d-bg', LIST = [['dark', '어두운 배경'], ['white', '흰 배경'], ['sky', '연한 하늘'], ['blue', '파란 하늘']];
  // 바닥 격자와 원판 진하기: [격자, 원판]
  const FLOOR = { dark: [0.55, 0.22], blue: [0, 0], white: [0.35, 0.08], sky: [0, 0] };
  let cur = 'dark';
  try { const v = localStorage.getItem(KEY); if (FLOOR[v]) cur = v; } catch (e) { /* 저장 못 해도 그냥 쓴다 */ }
  const box = document.createElement('div');
  box.className = 'bg-pick'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', '배경');
  box.innerHTML = LIST.map(([k, t]) => `<button type="button" data-bg="${k}" title="${t}" aria-label="${t}"><i></i></button>`).join('');
  const floor = () => {
    const s = window.__hubScene; if (!s) return false;
    const [g, o] = FLOOR[cur]; s.grid.material.opacity = g; s.ground.material.opacity = o; return true;
  };
  const set = k => {
    cur = k; stage.dataset.bg = k;
    box.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.bg === k));
    floor();
    try { localStorage.setItem(KEY, k); } catch (e) { /* 무시 */ }
  };
  box.addEventListener('click', e => { const b = e.target.closest('button'); if (b) set(b.dataset.bg); });
  stage.append(box); set(cur);
  // 뷰어 모듈이 늦게 뜨면 격자를 찾을 때까지 잠깐 기다린다
  if (!floor()) { let n = 0; const t = setInterval(() => { if (floor() || ++n > 60) clearInterval(t); }, 250); }
})();
