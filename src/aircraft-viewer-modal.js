/* Jetliner Hub: lazy, isolated Blender viewer. Loaded before hub-app.js. */
const AircraftViewerModal = (() => {
  let dialog, frame, opener, previousOverflow;
  const css = `
    .av-dialog{padding:0;width:min(1440px,calc(100vw - 40px));max-width:none;height:calc(100dvh - 40px);max-height:none;border:1px solid var(--line);border-radius:16px;background:var(--surface);color:var(--fg);box-shadow:0 24px 90px #0008;overflow:hidden}
    .av-dialog::backdrop{background:#101827b8;backdrop-filter:blur(5px)}
    .av-dialog[open]{display:flex;flex-direction:column}
    .av-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 20px;border-bottom:1px solid var(--line);flex-shrink:0}
    .av-head h2{font-size:18px;margin:0;color:var(--fg);font-weight:650}.av-head p{font-size:13px;margin:3px 0 0;color:var(--muted)}
    .av-actions{display:flex;gap:8px;align-items:center;flex-shrink:0}.av-actions .btn{min-height:40px}
    .av-body{flex:1;min-height:0;position:relative;background:#101821}.av-body iframe{width:100%;height:100%;border:0;display:block;position:relative;background:#101821}
    .av-wait{position:absolute;inset:0;display:grid;place-items:center;color:#d6e4ef;padding:24px;font-size:16px;text-align:center}
    .av-entry{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:20px 24px;background:var(--surface);border:1px solid var(--line);border-radius:8px}
    .av-entry h3{font-size:18px;margin:0 0 6px;color:var(--fg)}.av-entry p{margin:0;color:var(--muted);font-size:14px;line-height:1.6}.av-entry .btn{flex-shrink:0;min-height:44px}
    @media(max-width:720px){.av-dialog{width:100%;height:100dvh;max-height:100dvh;margin:0;border:0;border-radius:0}.av-head{padding:10px 12px;gap:8px}.av-head h2{font-size:16px}.av-head p{display:none}.av-actions .btn{padding:9px 11px;font-size:13px}.av-entry{align-items:flex-start;flex-direction:column;padding:18px}.av-entry .btn{width:100%}}
  `;
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function url(id) {
    if (!/^(boeing|airbus)-[a-z0-9]+$/.test(id)) return null;
    const base = /^(https?:)$/.test(location.protocol) && !location.hostname.endsWith('claudeusercontent.com') && !location.hostname.endsWith('claude.ai') ? document.baseURI : 'https://mischef-2.github.io/';
    const u = new URL('3d/viewer/index.html', base);
    u.hash = id; return u.href;
  }
  function button(ac, cls = '') {
    const href = url(ac.id); if (!href) return '';
    return `<a class="btn ${escape(cls)}" href="${escape(href)}" data-aircraft-viewer="${escape(ac.id)}" data-aircraft-name="${escape(ac.name)}" aria-haspopup="dialog">3D 내부·외부 보기</a><a class="btn ${escape(cls)}" data-flight-experience href="${escape(href.replace("3d/viewer/index.html", "src/aircraft-3d/flight/index.html"))}" target="_blank" rel="noopener">조종석 비행</a>`;
  }
  function card(ac) {
    return `<section class="av-entry" aria-label="항공기 3D 탐색"><div><h3>기체 안팎을 직접 둘러보세요</h3><p>외관부터 객실·조종실·화물칸까지, 회전하고 확대하며 살펴볼 수 있습니다.<br>자료를 바탕으로 만든 연구 모델이며, 일부 형상과 내부 배치는 예시입니다.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap">${button(ac)}</div></section>`;
  }
  function close() { if (dialog?.open) dialog.close(); }
  function setup() {
    if (dialog) return;
    dialog = document.createElement('dialog'); dialog.className = 'av-dialog'; dialog.setAttribute('aria-labelledby','av-title');
    dialog.innerHTML = '<header class="av-head"><div><h2 id="av-title">항공기 3D 탐색</h2><p>드래그로 회전 · 휠로 확대 · 아래 시점 버튼으로 내부 탐색</p></div><div class="av-actions"><a class="btn ghost av-popout" target="_blank" rel="noopener">새 탭</a><button type="button" class="btn ghost av-close" aria-label="3D 보기 닫기" autofocus>닫기 ×</button></div></header><div class="av-body"></div>';
    document.body.append(dialog);
    dialog.querySelector('.av-close').addEventListener('click',close);
    dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
    dialog.addEventListener('close',()=>{frame?.remove();frame=null;dialog.querySelector('.av-body').replaceChildren();document.body.style.overflow=previousOverflow;opener?.focus();});
    window.addEventListener('hashchange',close);
  }
  function open(link) {
    setup(); if (dialog.open) return;
    opener = link; previousOverflow = document.body.style.overflow;
    dialog.querySelector('#av-title').textContent = `${link.dataset.aircraftName} · 3D 탐색`;
    dialog.querySelector('.av-popout').href = link.href;
    const body = dialog.querySelector('.av-body');
    const wait = document.createElement('div');wait.className='av-wait';wait.textContent='3D 보기 창을 여는 중입니다…';body.append(wait);
    frame = document.createElement('iframe');frame.title = `${link.dataset.aircraftName} 내부·외부 3D 뷰어`;frame.src=link.href;
    frame.addEventListener('load',()=>{
      wait.remove();
      try {
        const doc=frame.contentDocument;
        if(!doc?.querySelector('#canvas-host'))return;
        const style=doc.createElement('style');
        style.textContent='.sidebar,.topbar{display:none!important}body{display:block}main{width:100%}.stage{height:calc(100dvh - 165px);min-height:380px}.view-controls button{font-size:12px;min-height:40px}.aircraft-versions{padding-top:12px}@media(max-width:720px){.stage{height:calc(100dvh - 185px);min-height:360px}.view-controls{width:calc(100% - 24px);max-width:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;padding:6px;bottom:48px}.view-controls button{font-size:12px;padding:8px 3px;min-width:0;white-space:nowrap}.title-block{left:16px;top:16px}.title-block h1{font-size:26px}.prototype{font-size:10px}}';
        doc.head.append(style);
        doc.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close();}},true);
      } catch (_) { /* Cross-origin artifact: keep the independent viewer intact. */ }
    });
    body.append(frame);document.body.style.overflow='hidden';dialog.showModal();
  }
  document.addEventListener('click',e=>{
    const link=e.target.closest?.('[data-aircraft-viewer]');
    if(!link||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    if(new URL(link.href).origin!==location.origin)return;
    e.preventDefault();e.stopImmediatePropagation();open(link);
  },true);
  // Install styling before the first aircraft page is rendered; no iframe is created here.
  const style=document.createElement('style');style.textContent=css;document.head.append(style);
  return Object.freeze({button,card,close});
})();
