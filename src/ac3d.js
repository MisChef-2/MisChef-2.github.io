  /* ================= 기종 백과: 3D 보기 =================
     비행 원리와 같은 3D 그리기 도구(learn3d.js의 L3)로 기종별 가벼운 메시를 그린다.
     메시는 models3d/<기종>.json (Blender 모델에서 외형만, 공통 도색, 777 길이 = 5.5 단위의 공통 축척).
     페이지를 열 때만 내려받고, 한 번 받은 것은 기억해 둔다. */
  const AC3 = { cache: {}, cur: null, polys: [], floor: -1, ext: 5.5 };
  // 기종 페이지 맨 위: 이름과 버튼, 그 아래 3D 모형. 사진은 무대 아래에 따로 놓는다
  function ac3dStage(o) {
    const ac = o.ac, p = o.photo, actions = String(o.actions || "").replace(/\bon-dark\b/g, "ghost");
    const hp = p ? Object.assign({}, p, { focus: p.hfocus || p.focus || "50% 50%" }) : null;
    return `<header class="card ac-stage mk-${o.mk}"><div class="ac-stage-h"><div><div class="crumbs">${o.crumbs}</div><h1>${o.title}</h1>${o.sub}</div><div class="actions">${actions}</div></div>
<div class="ac3d"><canvas data-lr3="ac3d" role="img" aria-label="${esc(ac.name)} 3D 모형, 끌어서 돌려 볼 수 있음"></canvas><p class="ac3d-wait">3D 모형을 불러오는 중</p><span class="lr3-hint">끌어서 돌려 보기, 두 번 누르면 처음 시점</span><span class="ac3d-note">${esc(ac.variant)} 외형 모형, 실제 치수 비율. 도색은 사이트 공통 색</span></div></header>
${hp ? `<figure class="hero ac-photo mk-${o.mk}">${pimg(hp, false, o.alt, true)}<div class="pcr">${pcredit(p)}${p.koreanAir ? ", 대한항공 기재" : ""}</div></figure>` : ""}`;
  }
  function ac3dScene() {
    return { polys: AC3.polys, lines: [], arrows: [], floor: AC3.floor, shadow: [0, 0, 0, AC3.len * 0.5, AC3.span * 0.42] };
  }
  LR3_SCENES.ac3d = ac3dScene;
  function ac3dUse(id, M) {
    const t = M.t, P = []; let zmin = 9, xmax = 0, ymax = 0;
    for (let i = 0; i < t.length; i += 10) {
      const p = [[t[i] / 1000, t[i + 1] / 1000, t[i + 2] / 1000], [t[i + 3] / 1000, t[i + 4] / 1000, t[i + 5] / 1000], [t[i + 6] / 1000, t[i + 7] / 1000, t[i + 8] / 1000]];
      p.forEach(v => { if (v[2] < zmin) zmin = v[2]; if (Math.abs(v[0]) > xmax) xmax = Math.abs(v[0]); if (Math.abs(v[1]) > ymax) ymax = Math.abs(v[1]); });
      P.push({ p: p, c: M.mats[t[i + 9]] });
    }
    AC3.cur = id; AC3.polys = P; AC3.floor = zmin; AC3.len = xmax * 2; AC3.span = ymax * 2; AC3.ext = Math.max(xmax * 2, ymax * 2 * 0.9);
  }
  function ac3dStart(ac) {
    const cv = document.querySelector("#app canvas[data-lr3=ac3d]"); if (!cv) return;
    const box = cv.parentNode, wait = box.querySelector(".ac3d-wait");
    const go = () => {
      if (!document.contains(cv)) return;
      ac3dUse(ac.id, AC3.cache[ac.id]);
      // 작은 기종도 화면을 알맞게 채우도록 확대 (큰 기종일수록 덜)
      LR3_VIEW.ac3d = [-0.7, 0.3, Math.max(0.9, Math.min(2.8, 7.2 / AC3.ext)) * (cv.clientWidth < 520 ? 0.8 : 1)];
      if (wait) wait.remove();
      lr3start("ac3d"); L3.autoSpin = !fxCalm();
      cv.addEventListener("pointerdown", () => { L3.autoSpin = false; });
    };
    if (AC3.cache[ac.id]) return go();
    fetch("models3d/" + ac.id + ".json").then(r => { if (!r.ok) throw 0; return r.json(); })
      .then(M => { AC3.cache[ac.id] = M; go(); })
      .catch(() => { if (wait) wait.textContent = "3D 모형을 불러오지 못했습니다. 3면도 탭에서 도면을 볼 수 있습니다."; });
  }
