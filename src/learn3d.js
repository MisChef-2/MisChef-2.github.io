  /* ================= 비행 원리: 3D 장면 =================
     작은 3D 그리기 도구. 다각형(날개, 동체)을 빛 방향에 따라 명암을 주고, 먼 것부터 그려(화가 알고리즘) 가린다.
     흐름선은 점선이 흘러가도록 움직이고, 끌면 카메라가 돈다. 좌표: x 앞(비행 방향), y 오른쪽 날개, z 위.
     공기는 x의 음의 방향으로 흐른다(비행기 기준). */
  const L3 = { cv: null, ctx: null, raf: 0, key: null, yaw: -0.65, pitch: 0.32, zoom: 1, W: 0, H: 0, dpr: 1, drag: null, t: 0 };
  const LR3_VIEW = { "learn-forces": [-0.75, 0.28, 0.9], "learn-lift": [-0.22, 0.1, 1.25], "learn-stall": [-0.22, 0.1, 1.25], "learn-winglet": [2.7, 0.3, 0.75], "learn-sweep": [-0.35, 0.95, 0.95], "learn-highlift": [-0.22, 0.1, 1.25], "learn-control": [-0.8, 0.38, 0.9] };
  const v3 = { add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], len: a => Math.hypot(a[0], a[1], a[2]) };
  // y축(날개폭) 둘레로 돌리기: 받음각. 기수가 들리면 앞(+x)이 올라간다
  const rotY = (p, a, c) => { const ca = Math.cos(a), sa = Math.sin(a), x = p[0] - c[0], z = p[2] - c[2]; return [c[0] + x * ca - z * sa, p[1], c[2] + x * sa + z * ca]; };
  const rotX = (p, a, c) => { const ca = Math.cos(a), sa = Math.sin(a), y = p[1] - c[1], z = p[2] - c[2]; return [p[0], c[1] + y * ca - z * sa, c[2] + y * sa + z * ca]; };
  const rotZ = (p, a, c) => { const ca = Math.cos(a), sa = Math.sin(a), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * ca - y * sa, c[1] + x * sa + y * ca, p[2]]; };
  function l3prj(p) {
    const cy = Math.cos(L3.yaw), sy = Math.sin(L3.yaw), x1 = p[0] * cy - p[1] * sy, y1 = p[0] * sy + p[1] * cy;
    const cp = Math.cos(L3.pitch), sp = Math.sin(L3.pitch), depth = y1 * cp - p[2] * sp, up = p[2] * cp + y1 * sp, D = 9, k = D / (D + depth), s = L3.zoom * Math.min(L3.W, L3.H * 1.7) * 0.125;
    return { x: L3.W / 2 + s * x1 * k, y: L3.H * 0.54 - s * up * k, d: depth, k: k };
  }
  // 날개 단면 고리: 앞전 x=0, 뒷전 x=-c (비행 방향 +x), 두께는 z
  function l3foil(c, n) { const P = lrFoilPts(c), up = P.up.filter((_, i) => i % n === 0), lo = P.lo.filter((_, i) => i % n === 0); return up.map(q => [-q[0], -q[1]]).concat(lo.slice(1, -1).reverse().map(q => [-q[0], -q[1]])); }
  // 고리(x,z)를 날개폭 방향 여러 단면으로 이어 면을 만든다. st: [{y, dx, dz, k(크기), a(비틀림)}]
  function l3wing(loop, st, col, tag) {
    const P = [], sec = st.map(s => loop.map(q => { let p = [q[0] * s.k + s.dx, s.y, q[1] * s.k + s.dz]; if (s.a) p = rotY(p, s.a, [s.dx - 0.25 * s.k * 2, s.y, s.dz]); return p; }));
    for (let j = 0; j < sec.length - 1; j++) for (let i = 0; i < loop.length; i++) { const i2 = (i + 1) % loop.length; P.push({ p: [sec[j][i], sec[j][i2], sec[j + 1][i2], sec[j + 1][i]], c: typeof col === "function" ? col(i, loop.length) : col, tag: tag }); }
    P.push({ p: sec[0].slice(), c: typeof col === "function" ? col(0, 1) : col }); P.push({ p: sec[sec.length - 1].slice(), c: typeof col === "function" ? col(0, 1) : col });
    return P;
  }
  // 원통(동체, 엔진): x 방향으로, 단면 n각형, 반지름 함수 r(t)
  function l3tube(x0, x1, y, z, rf, col, n) {
    n = n || 10; const P = [], M = 14, ring = j => { const t = j / M, x = x0 + (x1 - x0) * t, r = rf(t); return Array.from({ length: n }, (_, i) => [x, y + r * Math.cos(i / n * Math.PI * 2), z + r * Math.sin(i / n * Math.PI * 2)]); };
    let a = ring(0); for (let j = 1; j <= M; j++) { const b = ring(j); for (let i = 0; i < n; i++) { const i2 = (i + 1) % n; P.push({ p: [a[i], a[i2], b[i2], b[i]], c: col }); } a = b; }
    return P;
  }
  // 임의의 축(점 a, 방향 u) 둘레로 점 p를 각 t만큼 돌린다 (조종면 경첩)
  function rotAxis(p, a, u, t) {
    const n = Math.hypot(u[0], u[1], u[2]), k = [u[0] / n, u[1] / n, u[2] / n], v = v3.sub(p, a), c = Math.cos(t), s = Math.sin(t), d = k[0] * v[0] + k[1] * v[1] + k[2] * v[2], cr = v3.cross(k, v);
    return v3.add(a, [v[0] * c + cr[0] * s + k[0] * d * (1 - c), v[1] * c + cr[1] * s + k[1] * d * (1 - c), v[2] * c + cr[2] * s + k[2] * d * (1 - c)]);
  }
  // 여객기 모형 (737/A320 정도의 비율). 앞이 +x. dfl: 조종면 각도 {ail, elev, rud}(라디안)
  const PL = { body: [236, 240, 246], wing: [200, 208, 220], eng: [168, 178, 192], dark: [44, 52, 66], win: [70, 92, 120], on: [47, 111, 237], off: [178, 188, 202] };
  function l3plane(dfl) {
    dfl = dfl || {}; const P = [], N = 16;
    // 동체: [x, 반지름, 중심 높이]. 앞은 둥근 기수, 뒤는 위로 쳐든 꼬리 원뿔
    const ST = [[2.75, 0.0, -0.02], [2.68, 0.1, -0.02], [2.55, 0.18, -0.01], [2.35, 0.25, 0], [2.1, 0.3, 0], [1.75, 0.32, 0], [-1.3, 0.32, 0], [-1.7, 0.29, 0.03], [-2.05, 0.23, 0.08], [-2.35, 0.16, 0.13], [-2.6, 0.09, 0.17], [-2.75, 0.03, 0.19]];
    const ring = st => Array.from({ length: N }, (_, i) => { const t = i / N * Math.PI * 2; return [st[0], st[1] * Math.cos(t), st[2] + st[1] * Math.sin(t) * 1.04]; });
    for (let j = 0; j < ST.length - 1; j++) { const A = ring(ST[j]), B = ring(ST[j + 1]); for (let i = 0; i < N; i++) { const i2 = (i + 1) % N; P.push({ p: [A[i], A[i2], B[i2], B[i]], c: PL.body }); } }
    // 조종석 창: 기수 위쪽 앞 비스듬한 띠
    [[0.08, 0.2], [-0.2, -0.08]].forEach(w => { const r1 = 0.245, r2 = 0.285; P.push({ p: [[2.36, w[0] * 1.2, 0.17], [2.36, w[1] * 1.2, 0.17], [2.2, w[1] * 1.4, r2 * 0.86], [2.2, w[0] * 1.4, r2 * 0.86]], c: PL.win }); void r1; });
    // 객실 창 줄
    for (let x = 1.6; x > -1.2; x -= 0.32) [1, -1].forEach(sd => P.push({ p: [[x, sd * 0.323, 0.07], [x - 0.12, sd * 0.323, 0.07], [x - 0.12, sd * 0.323, 0.11], [x, sd * 0.323, 0.11]], c: PL.win }));
    // 주날개: 낮은 날개, 끝으로 갈수록 올라감(상반각 6도), 후퇴각 약 25도
    const foil = l3foil(1, 3), span = 3.4, rootLE = 0.72, rootC = 2.1, tipLE = rootLE - 1.6, tipC = 0.7, rootZ = -0.2, tipZ = rootZ + span * Math.tan(6 * LR_TOR);
    const wingSec = sd => sd > 0 ? [{ y: 0.2, dx: rootLE, dz: rootZ, k: rootC }, { y: span, dx: tipLE, dz: tipZ, k: tipC }] : [{ y: -span, dx: tipLE, dz: tipZ, k: tipC }, { y: -0.2, dx: rootLE, dz: rootZ, k: rootC }];
    [1, -1].forEach(sd => {
      P.push(...l3wing(foil, wingSec(sd), PL.wing));
      // 블렌디드 윙렛
      const t0 = [tipLE, sd * span, tipZ], t1 = [tipLE - 0.38, sd * (span + 0.08), tipZ + 0.42];
      P.push({ p: [t0, t1, [t1[0] - 0.28, t1[1], t1[2]], [t0[0] - tipC * 0.9, t0[1], t0[2]]], c: PL.wing });
      // 엔진: 날개 아래 파일런에 매달린 나셀, 앞에는 어두운 흡입구
      const ey = sd * 1.2, ez = -0.55, ex0 = 1.25, ex1 = 0.05;
      P.push(...l3tube(ex1, ex0, ey, ez, t => t > 0.85 ? 0.2 - (t - 0.85) * 0.25 : t < 0.18 ? 0.15 + t * 0.28 : 0.2, PL.eng, 14));
      P.push({ p: Array.from({ length: 14 }, (_, i) => { const q = i / 14 * Math.PI * 2; return [ex0 + 0.001, ey + 0.165 * Math.cos(q), ez + 0.165 * Math.sin(q)]; }), c: PL.dark });
      const wingZ = rootZ + 1.2 * Math.tan(6 * LR_TOR) - 0.04, leAt = rootLE + (tipLE - rootLE) * (1.2 / span);
      P.push({ p: [[ex0 - 0.35, ey, ez + 0.19], [ex1 + 0.05, ey, ez + 0.19], [leAt - 1.1, ey, wingZ], [leAt + 0.05, ey, wingZ]], c: PL.eng });
      // 에일러론: 날개 바깥쪽 뒷전 (날개폭 58~88%), 경첩선을 축으로
      const yA = 0.58 * span, yB = 0.88 * span, chordAt = y => rootC + (tipC - rootC) * (y / span), leX = y => rootLE + (tipLE - rootLE) * (y / span), zAt = y => rootZ + y * Math.tan(6 * LR_TOR) + 0.01;
      const hA = [leX(yA) - chordAt(yA) * 0.76, sd * yA, zAt(yA)], hB = [leX(yB) - chordAt(yB) * 0.76, sd * yB, zAt(yB)], tA = [leX(yA) - chordAt(yA), sd * yA, zAt(yA) - 0.01], tB = [leX(yB) - chordAt(yB), sd * yB, zAt(yB) - 0.01];
      const ang = (dfl.ail || 0) * sd, axis = v3.sub(hB, hA), on = !!dfl.ail;
      const ail = [hA, hB, tB, tA].map(q => rotAxis(q, hA, axis, ang));
      P.push({ p: ail, c: on ? PL.on : PL.off }); P.push({ p: ail.map(q => [q[0], q[1], q[2] + 0.012]), c: on ? PL.on : PL.off });
      // 수평 꼬리날개와 엘리베이터
      const hs = sd > 0 ? [{ y: 0.12, dx: -1.95, dz: 0.12, k: 0.95 }, { y: 1.3, dx: -2.55, dz: 0.2, k: 0.4 }] : [{ y: -1.3, dx: -2.55, dz: 0.2, k: 0.4 }, { y: -0.12, dx: -1.95, dz: 0.12, k: 0.95 }];
      P.push(...l3wing(l3foil(1, 4), hs, PL.wing));
      const eA = [-1.95 - 0.95 * 0.68, sd * 0.15, 0.13], eB = [-2.55 - 0.4 * 0.68, sd * 1.25, 0.2], eTA = [-1.95 - 0.95, sd * 0.15, 0.12], eTB = [-2.55 - 0.4, sd * 1.25, 0.19];
      const elev = [eA, eB, eTB, eTA].map(q => rotAxis(q, eA, v3.sub(eB, eA), -(dfl.elev || 0) * sd));
      P.push({ p: elev, c: dfl.elev ? PL.on : PL.off });
    });
    // 수직 꼬리날개 (얇은 날개 단면을 세로로 세운 것)와 러더
    const fin = l3wing(l3foil(1, 4), [{ y: 0.22, dx: -1.6, dz: 0, k: 1.05 }, { y: 1.45, dx: -2.35, dz: 0, k: 0.5 }], PL.wing).map(q => ({ p: q.p.map(v => [v[0], v[2] * 0.9, v[1]]), c: q.c }));
    P.push(...fin);
    const rA = [-1.6 - 1.05 * 0.7, 0, 0.25], rB = [-2.35 - 0.5 * 0.7, 0, 1.42], rTA = [-1.6 - 1.05, 0, 0.25], rTB = [-2.35 - 0.5, 0, 1.42];
    const rud = [rA, rB, rTB, rTA].map(q => rotAxis(q, rA, v3.sub(rB, rA), dfl.rud || 0));
    P.push({ p: rud, c: dfl.rud ? PL.on : PL.off });
    return P;
  }
  // 날개 단면 주위 흐름선(3D). 날개 모양(받음각 포함)을 따라 위아래로 휘고, 뒤에서 내리흐름
  function l3flows(c, a, ys, zs, opt) {
    opt = opt || {}; const F = lrFoilPts(c), rot = q => rotY([-q[0], 0, -q[1]], a, [-c * 0.25, 0, 0]);
    const U = F.up.map(rot).sort((p, q) => q[0] - p[0]), L = F.lo.map(rot).sort((p, q) => q[0] - p[0]);
    const at = (S, x) => { for (let i = 1; i < S.length; i++) if (S[i][0] <= x) { const k = (S[i - 1][0] - x) / ((S[i - 1][0] - S[i][0]) || 1); return S[i - 1][2] + (S[i][2] - S[i - 1][2]) * k; } return S[S.length - 1][2]; };
    const le = U[0][0], te = U[U.length - 1][0], leZ = U[0][2], out = [];
    ys.forEach(y => zs.forEach((z0, n) => {
      const upper = z0 > 0, pts = [], w = Math.exp(-Math.abs(z0) / 0.9), gap = 0.06 + Math.abs(z0) * 0.25;
      for (let x = c * 1.1; x >= -c * 2.4; x -= c * 0.05) {
        let z;
        if (x > le) { const k = Math.exp(-(x - le) / (c * 0.5)); z = z0 + (leZ - 0) * k * w * 0.5; }
        else if (x >= te) { let S = upper ? at(U, x) : at(L, x); if (upper && opt.sep && x < le - (le - te) * 0.3) S = at(U, le - (le - te) * 0.3) + opt.sep * (le - (le - te) * 0.3 - x) * 0.25; z = upper ? Math.max(z0 + w * (S - leZ) * 0.9, S + gap) : Math.min(z0 + w * (S - leZ) * 0.9, S - gap); }
        else { const S0 = upper ? at(U, te) : at(L, te), z1 = upper ? Math.max(z0 + w * (S0 - leZ) * 0.9, S0 + gap) : Math.min(z0 + w * (S0 - leZ) * 0.9, S0 - gap); z = z1 - (te - x) * (opt.down || 0.1) * (0.5 + w * 0.5) * (opt.sep && upper ? 0.3 : 1) + (z0 - z1) * (1 - Math.exp(-(te - x) / (c * 1.2))) * 0.3; }
        pts.push([x, y, z]);
      }
      for (let p = 0; p < 3; p++) for (let i = 1; i < pts.length - 1; i++) pts[i][2] = (pts[i - 1][2] + pts[i][2] * 2 + pts[i + 1][2]) / 4;
      out.push({ p: pts, col: upper ? (opt.sep && n >= zs.filter(v => v > 0).length - 2 ? [220, 90, 40] : [37, 99, 235]) : [100, 116, 139], speed: upper ? 1.5 : 0.9, w: 1.4, wob: upper && opt.sep && n >= zs.filter(v => v > 0).length - 2 ? opt.sep : 0, startX: le });
    }));
    return out;
  }
  // 화살표: 3D 줄기 + 화면 위 화살촉, 끝에 이름
  const l3arrow = (from, to, col, label) => ({ arrow: true, from, to, col, label });

  /* ---------- 장면들 ---------- */
  const lrVal = (id, d) => { const e = document.getElementById(id); return e ? +e.value : d; };
  const LR3_SCENES = {
    "learn-forces": t => {
      const thr = lrVal("lr-f-thr", 62), aoa = lrVal("lr-f-aoa", 3) * LR_TOR, speed = 0.35 + thr / 100 * 0.65, lift = Math.min(1.5, (0.55 + aoa / LR_TOR * 0.09) * (0.6 + speed * 0.55)), drag = 0.28 + speed * speed * 0.42 + aoa / LR_TOR * 0.025;
      const P = l3plane().map(q => ({ p: q.p.map(p => rotY(p, aoa, [0, 0, 0])), c: q.c })), L = [];
      for (let i = 0; i < 9; i++) { const y = -4 + (i % 3) * 4, z = -1.6 + Math.floor(i / 3) * 1.6; L.push({ p: [[4.5, y, z], [-4.5, y, z]], col: [148, 163, 184], speed: 2 + speed * 6, w: 1, dash: [0.4, 0.6] }); }
      return { shadow: [0, 0, 0, 3.2, 3.6], polys: P, lines: L, arrows: [l3arrow([0, 0, 0.35], [0, 0, 0.35 + lift * 2.2], [22, 163, 74], "양력"), l3arrow([0, 0, -0.35], [0, 0, -1.9], [220, 38, 38], "무게"), l3arrow([2.7, 0, 0], [2.7 + thr / 100 * 2.4, 0, 0], [37, 99, 235], "추력"), l3arrow([-2.6, 0, 0], [-2.6 - drag * 2.4, 0, 0], [234, 88, 12], "항력")] };
    },
    "learn-lift": t => {
      const cl = lrVal("lr-l-cl", 0.5), a = Math.max(-3, (cl - 0.2) / 0.095) * LR_TOR, loop = l3foil(2, 2), half = loop.length / 2;
      const col = (i) => i < half ? [120, 160, 235] : [240, 170, 120];
      const P = l3wing(loop.map(q => [q[0], q[1]]), [{ y: -2, dx: 0, dz: 0, k: 1 }, { y: 2, dx: 0, dz: 0, k: 1 }], col).map(q => ({ p: q.p.map(p => rotY(p, a, [-0.5, 0, 0])), c: q.c }));
      return { polys: P, lines: l3flows(2, a, [-1.5, -0.5, 0.5, 1.5], [0.35, 0.75, 1.15, -0.35, -0.75], { down: 0.04 + cl * 0.07 }), arrows: [l3arrow([-0.5, 0, 0.25], [-0.5, 0, 0.45 + cl * 0.8], [22, 163, 74], "양력"), l3arrow([-2.6, 0, -0.1], [-3.3, 0, -0.1 - cl * 0.6], [37, 99, 235], "내리흐름")] };
    },
    "learn-stall": t => {
      const ad = lrVal("lr-s-a", 4), a = ad * LR_TOR, stall = ad > 15, loop = l3foil(2, 2);
      const P = l3wing(loop, [{ y: -2, dx: 0, dz: 0, k: 1 }, { y: 2, dx: 0, dz: 0, k: 1 }], [200, 210, 224]).map(q => ({ p: q.p.map(p => rotY(p, a, [-0.5, 0, 0])), c: q.c }));
      const cl = lrCL(ad);
      return { polys: P, lines: l3flows(2, a, [-1.5, -0.5, 0.5, 1.5], [0.3, 0.65, 1.0, -0.35, -0.75], { down: Math.min(cl, 1.6) * 0.08, sep: stall ? Math.min(1, (ad - 15) / 5) : 0 }), arrows: [l3arrow([-0.5, 0, 0.3], [-0.5, 0, 0.45 + cl * 0.75], stall ? [220, 38, 38] : [22, 163, 74], stall ? "양력 급감" : "양력")] };
    },
    "learn-winglet": t => {
      const w = (typeof LR_WL !== "undefined" ? LR_WL.find(x => x[0] === lrWL) : null) || [0, 0, 1], s = w[2], thin = l3foil(1.6, 3);
      const span = 4, st = [{ y: 0, dx: 0, dz: 0, k: 1 }, { y: span, dx: -1.2, dz: 0.25, k: 0.45 }];
      const P = l3wing(thin, st, [190, 200, 214]);
      P.push(...l3tube(-3, 2.2, 0, -0.1, tt => tt < 0.1 ? 0.2 + tt * 3 : tt > 0.85 ? 0.5 - (tt - 0.85) * 2 : 0.5, [214, 222, 232], 12).filter(q => q.p.every(p => p[1] >= -0.05)));
      const tipX = -1.2 - 0.36, tipZ = 0.25, tipY = span;
      const wl = { blend: [[0, 0, 0], [-0.15, 0.12, 0.25], [-0.3, 0.18, 0.75]], shark: [[0, 0, 0], [-0.1, 0.05, 0.15], [-0.35, 0.08, 0.8]], scim: [[0, 0, 0], [-0.2, 0.1, 0.7]], raked: [[0, 0, 0], [-0.9, 0.9, 0.05]] }[lrWL];
      if (wl) { const C = [tipX + 0.36, tipY, tipZ]; for (let i = 0; i < wl.length - 1; i++) { const a = v3.add(C, wl[i]), b = v3.add(C, wl[i + 1]), ch = 0.65 * (1 - i * 0.3), ch2 = 0.65 * (1 - (i + 1) * 0.3); P.push({ p: [a, b, [b[0] - ch2, b[1], b[2]], [a[0] - ch, a[1], a[2]]], c: [47, 111, 237] }); } if (lrWL === "scim") { const a = C, b = v3.add(C, [-0.15, 0.06, -0.35]); P.push({ p: [a, b, [b[0] - 0.3, b[1], b[2]], [a[0] - 0.55, a[1], a[2]]], c: [47, 111, 237] }); } }
      // 날개 끝 소용돌이: 뒤로 끌려가는 나선
      const L = [], R = 0.07 + 0.26 * s, ex = lrWL === "raked" ? 0.9 : 0, ez = wl && lrWL !== "raked" ? 0.45 : 0;
      for (let k = 0; k < 3; k++) { const pts = []; for (let x = 0; x <= 6; x += 0.05) { const ang = x * 5 + k * 2.1 - t * 4, r = R * (0.4 + Math.min(1, x / 1.2) * 0.6); pts.push([tipX - x, tipY + ex + r * Math.cos(ang), tipZ + ez + r * Math.sin(ang)]); } L.push({ p: pts, col: [37, 99, 235], speed: 0, w: 1.2 + s, dash: null, alpha: 0.75 - k * 0.18 }); }
      // 날개 아래는 바깥으로, 위는 안으로 도는 흐름
      [1.2, 2.2, 3.1].forEach(y => { L.push({ p: [[-0.4, y, -0.35], [-0.9, y + 0.6, -0.3]], col: [234, 88, 12], speed: 1, w: 1.2, dash: [0.12, 0.1] }); L.push({ p: [[-0.4, y + 0.3, 0.5], [-0.9, y - 0.3, 0.5]], col: [37, 99, 235], speed: 1, w: 1.2, dash: [0.12, 0.1] }); });
      return { polys: P, lines: L, arrows: [] };
    },
    "learn-sweep": t => {
      const sw = lrVal("lr-sw-a", 25) * LR_TOR, m = lrVal("lr-sw-m", 0.78), thin = l3foil(1.6, 3), span = 4, P = [];
      [1, -1].forEach(s => P.push(...l3wing(thin, s > 0 ? [{ y: 0, dx: 0, dz: 0, k: 1 }, { y: span, dx: -Math.tan(sw) * span, dz: 0.15, k: 0.45 }] : [{ y: -span, dx: -Math.tan(sw) * span, dz: 0.15, k: 0.45 }, { y: 0, dx: 0, dz: 0, k: 1 }], [190, 200, 214])));
      P.push(...l3tube(-3.5, 2.5, 0, 0, tt => tt < 0.1 ? 0.15 + tt * 2.5 : tt > 0.85 ? 0.4 - (tt - 0.85) * 1.6 : 0.4, [214, 222, 232], 12));
      const mid = [-Math.tan(sw) * span * 0.5, span * 0.5, 0.5], V = 2.4 * m / 0.9, n = [-Math.cos(sw), Math.sin(sw), 0], tg = [-Math.sin(sw), -Math.cos(sw), 0];
      const vn = V * Math.cos(sw), vt = V * Math.sin(sw), base = v3.add(mid, [V, 0, 0]);
      const L = []; for (let i = 0; i < 7; i++) L.push({ p: [[3.5, -3 + i, 0.5], [-5.5, -3 + i, 0.5]], col: [148, 163, 184], speed: 4, w: 1, dash: [0.3, 0.5] });
      return { polys: P, lines: L, arrows: [l3arrow(base, mid, [100, 116, 139], `바람 M${m.toFixed(2)}`), l3arrow(v3.add(mid, v3.mul(n, -vn)), mid, m * Math.cos(sw) > 0.72 ? [220, 38, 38] : [22, 163, 74], "날개가 느끼는 몫"), l3arrow(v3.add(mid, v3.mul(tg, -vt)), mid, [234, 88, 12], "날개를 따라 흐르는 몫")] };
    },
    "learn-highlift": t => {
      const i = lrVal("lr-h-f", 0), k = [0, 10, 20, 32, 40][i] / 40, main = l3foil(2, 2), slat = main.filter(q => q[0] > -0.35), flap = main.filter(q => q[0] < -1.55);
      const P = [];
      P.push(...l3wing(main.filter(q => q[0] <= -0.3 && q[0] >= -1.6), [{ y: -1.8, dx: 0, dz: 0, k: 1 }, { y: 1.8, dx: 0, dz: 0, k: 1 }], [190, 200, 214]));
      P.push(...l3wing(slat, [{ y: -1.8, dx: 0.25 * k, dz: -0.18 * k, k: 1 }, { y: 1.8, dx: 0.25 * k, dz: -0.18 * k, k: 1 }], [47, 111, 237]).map(q => ({ p: q.p.map(p => rotY(p, -0.35 * k, [0, 0, 0])), c: q.c })));
      P.push(...l3wing(flap, [{ y: -1.8, dx: -0.35 * k, dz: -0.15 * k, k: 1 }, { y: 1.8, dx: -0.35 * k, dz: -0.15 * k, k: 1 }], [47, 111, 237]).map(q => ({ p: q.p.map(p => rotY(p, -0.7 * k, [-1.6 - 0.35 * k, 0, -0.15 * k])), c: q.c })));
      return { polys: P, lines: l3flows(2, 0.03, [-1.2, 0, 1.2], [0.35, 0.75, -0.35, -0.7], { down: 0.05 + k * 0.28 }), arrows: [l3arrow([-0.8, 0, 0.3], [-0.8, 0, 0.45 + [1.3, 1.75, 2.1, 2.45, 2.6][i] * 0.5], [22, 163, 74], "최대 양력")] };
    },
    "learn-control": t => {
      const ax = typeof lrAxis !== "undefined" ? lrAxis : "roll", v = lrVal("lr-c-in", 40) / 100, d = 0.55 * v;
      const P0 = l3plane({ ail: ax === "roll" ? d : 0, elev: ax === "pitch" ? -d : 0, rud: ax === "yaw" ? -d : 0 });
      const att = p => { let q = p; if (ax === "roll") q = rotX(q, v * 0.6, [0, 0, 0]); if (ax === "pitch") q = rotY(q, v * 0.4, [0, 0, 0]); if (ax === "yaw") q = rotZ(q, -v * 0.45, [0, 0, 0]); return q; };
      const P = P0.map(q => ({ p: q.p.map(att), c: q.c }));
      return { shadow: [0, 0, 0, 3.2, 3.6], polys: P, lines: [], arrows: [l3arrow([-3.6, 0, 0], [3.8, 0, 0], ax === "roll" ? [220, 38, 38] : [203, 213, 225], "롤 축"), l3arrow([0, -3.8, 0], [0, 3.8, 0], ax === "pitch" ? [22, 163, 74] : [203, 213, 225], "피치 축"), l3arrow([0, 0, -1.4], [0, 0, 2.2], ax === "yaw" ? [37, 99, 235] : [203, 213, 225], "요 축")] };
    }
  };

  /* ---------- 그리기 ---------- */
  const LIGHT = (() => { const l = [0.35, -0.45, 0.82], n = Math.hypot(...l); return l.map(x => x / n); })();
  function l3draw(now) {
    const c = L3.ctx, sc = LR3_SCENES[L3.key]; if (!c || !sc) return;
    const dark = getComputedStyle(document.documentElement).getPropertyValue("--mg").trim() === "1";
    c.setTransform(L3.dpr, 0, 0, L3.dpr, 0, 0); c.clearRect(0, 0, L3.W, L3.H);
    // 바닥 모눈(원근)
    c.lineWidth = 1; c.strokeStyle = dark ? "rgba(148,180,220,.10)" : "rgba(100,116,139,.12)";
    for (let i = -8; i <= 8; i++) { const a = l3prj([i, -8, -2.6]), b = l3prj([i, 8, -2.6]), e = l3prj([-8, i, -2.6]), f = l3prj([8, i, -2.6]); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.moveTo(e.x, e.y); c.lineTo(f.x, f.y); c.stroke(); }
    const S = sc(now / 1000), items = [];
    if (S.shadow) { const sh = S.shadow, pts = Array.from({ length: 28 }, (_, i) => { const q = i / 28 * Math.PI * 2; return l3prj([sh[0] + sh[3] * Math.cos(q), sh[1] + sh[4] * Math.sin(q), -2.6]); }), cx = pts.reduce((a, p) => a + p.x, 0) / pts.length, cy = pts.reduce((a, p) => a + p.y, 0) / pts.length, rr = Math.max(...pts.map(p => Math.hypot(p.x - cx, p.y - cy)));
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, dark ? "rgba(0,0,0,.35)" : "rgba(15,23,42,.16)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.fill(); }
    S.polys.forEach(q => { const pr = q.p.map(l3prj), dep = pr.reduce((s, r) => s + r.d, 0) / pr.length, nrm = v3.cross(v3.sub(q.p[1], q.p[0]), v3.sub(q.p[2], q.p[0])), nl = v3.len(nrm) || 1, lam = Math.abs((nrm[0] * LIGHT[0] + nrm[1] * LIGHT[1] + nrm[2] * LIGHT[2]) / nl); items.push({ t: 0, pr, dep, col: q.c, sh: 0.5 + 0.5 * lam }); });
    S.lines.forEach(ln => { const pr = ln.p.map(l3prj); let acc = 0; for (let i = 1; i < pr.length; i++) { const a = pr[i - 1], b = pr[i], sl = Math.hypot(b.x - a.x, b.y - a.y); let wob = 0; if (ln.wob) wob = Math.sin(i * 0.9 + now / 120) * 6 * ln.wob * Math.min(1, i / 12); items.push({ t: 1, a, b, wob, dep: (a.d + b.d) / 2, ln, acc }); acc += sl; } });
    items.sort((p, q) => q.dep - p.dep);
    items.forEach(it => {
      if (it.t === 0) { const r = Math.round(it.col[0] * it.sh), g = Math.round(it.col[1] * it.sh), b = Math.round(it.col[2] * it.sh); c.fillStyle = `rgb(${r},${g},${b})`; c.strokeStyle = c.fillStyle; c.lineWidth = 0.8; c.lineJoin = "round"; c.beginPath(); it.pr.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.fill(); c.stroke(); return; }
      const ln = it.ln, k = (it.a.k + it.b.k) / 2; c.strokeStyle = `rgba(${ln.col.join(",")},${ln.alpha != null ? ln.alpha : 0.8})`; c.lineWidth = (ln.w || 1.2) * k; c.lineCap = "round";
      if (ln.dash !== null) { const ds = ln.dash || [0.18, 0.14], sz = Math.min(L3.W, L3.H * 1.7) * 0.125 * L3.zoom; c.setLineDash([ds[0] * sz * k, ds[1] * sz * k]); c.lineDashOffset = -(now / 1000) * (ln.speed || 1) * sz * 0.6 + it.acc; } else c.setLineDash([]);
      c.beginPath(); c.moveTo(it.a.x, it.a.y + (it.wob || 0) * 0.6); c.lineTo(it.b.x, it.b.y + (it.wob || 0)); c.stroke();
    });
    c.setLineDash([]);
    // 화살표는 맨 위에
    (S.arrows || []).forEach(ar => { const a = l3prj(ar.from), b = l3prj(ar.to), ang = Math.atan2(b.y - a.y, b.x - a.x), col = `rgb(${ar.col.join(",")})`; c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 3; c.lineCap = "round"; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x - Math.cos(ang) * 8, b.y - Math.sin(ang) * 8); c.stroke(); c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x - Math.cos(ang - 0.4) * 13, b.y - Math.sin(ang - 0.4) * 13); c.lineTo(b.x - Math.cos(ang + 0.4) * 13, b.y - Math.sin(ang + 0.4) * 13); c.closePath(); c.fill(); if (ar.label) { c.font = "700 12.5px " + getComputedStyle(document.body).fontFamily; const tw = c.measureText(ar.label).width, capOn = !!document.querySelector("#app .lr-cap3.show"), bottom = L3.H - (capOn ? 92 : 26);
        // 이름표는 그림 안에, 자막이 떠 있으면 자막 위로 올린다
        let lx = Math.max(8, Math.min(L3.W - tw - 8, b.x + 8)), ly = Math.max(18, Math.min(bottom, b.y - 6)); if (capOn && ly > bottom - 4) ly = bottom;
        c.lineWidth = 4; c.strokeStyle = dark ? "#0e1726" : "#ffffff"; c.strokeText(ar.label, lx, ly); c.fillText(ar.label, lx, ly); } });
  }
  function l3size() { const r = L3.cv.getBoundingClientRect(); if (!r.width) return; L3.W = r.width; L3.H = r.height; L3.dpr = Math.min(2, window.devicePixelRatio || 1); L3.cv.width = Math.round(L3.W * L3.dpr); L3.cv.height = Math.round(L3.H * L3.dpr); }
  function l3loop(now) { L3.raf = 0; if (!L3.cv || !document.contains(L3.cv)) { L3.cv = null; return; } if (L3.autoSpin && !L3.drag) L3.yaw += 0.0025; if (L3.cv.width !== Math.round(L3.cv.getBoundingClientRect().width * L3.dpr)) l3size(); l3draw(now); if (!fxCalm()) L3.raf = requestAnimationFrame(l3loop); }
  function lr3start(h) {
    if (L3.raf) cancelAnimationFrame(L3.raf); L3.raf = 0;
    const cv = document.querySelector("#app canvas[data-lr3]"); if (!cv) { L3.cv = null; return; }
    L3.cv = cv; L3.ctx = cv.getContext("2d"); L3.key = h; const v = LR3_VIEW[h] || [-0.65, 0.32, 1]; L3.yaw = v[0]; L3.pitch = v[1]; L3.zoom = v[2];
    l3size(); L3.raf = requestAnimationFrame(l3loop);
    cv.addEventListener("pointerdown", e => { L3.drag = { x: e.clientX, y: e.clientY, yaw: L3.yaw, pitch: L3.pitch }; cv.setPointerCapture(e.pointerId); cv.classList.add("grab"); });
    cv.addEventListener("pointermove", e => { if (!L3.drag) return; L3.yaw = L3.drag.yaw - (e.clientX - L3.drag.x) * 0.008; L3.pitch = Math.max(-0.2, Math.min(1.4, L3.drag.pitch + (e.clientY - L3.drag.y) * 0.006)); if (fxCalm()) l3draw(performance.now()); });
    const up = () => { L3.drag = null; cv.classList.remove("grab"); }; cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    cv.addEventListener("dblclick", () => { const v2 = LR3_VIEW[h] || [-0.65, 0.32, 1]; L3.yaw = v2[0]; L3.pitch = v2[1]; L3.zoom = v2[2]; if (fxCalm()) l3draw(performance.now()); });
    cv.addEventListener("wheel", e => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); L3.zoom = Math.max(0.5, Math.min(2.4, L3.zoom * Math.pow(1.0015, -e.deltaY))); if (fxCalm()) l3draw(performance.now()); }, { passive: false });
  }
  // 카메라를 부드럽게 옮긴다 (조종면에서 축을 고를 때)
  function lr3view(v) { if (!v || !L3.cv) return; const f = [L3.yaw, L3.pitch, L3.zoom], t0 = performance.now(), d = fxCalm() ? 1 : 600; let dy = v[0] - f[0]; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
    const step = now => { const k = Math.min(1, (now - t0) / d), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; L3.yaw = f[0] + dy * e; L3.pitch = f[1] + (v[1] - f[1]) * e; L3.zoom = f[2] + (v[2] - f[2]) * e; if (fxCalm()) l3draw(now); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
  // 막대를 움직이면(움직임 줄이기 상태에서도) 다시 그린다
  document.addEventListener("input", e => { if (L3.cv && e.target && e.target.id && e.target.id.indexOf("lr-") === 0 && fxCalm()) l3draw(performance.now()); });
  document.addEventListener("click", e => { if (L3.cv && e.target.closest && e.target.closest("[data-lrw],[data-lra]") && fxCalm()) setTimeout(() => l3draw(performance.now()), 0); });

  /* ---------- 자동 설명: 영상처럼 자막이 나오고 막대와 카메라가 저절로 움직인다 ----------
     단계마다 {cap 자막, set 막대 값, click 누를 버튼, view 카메라}. 사용자가 막대나 그림을 만지면 멈춘다. */
  const LR_AUTO = {
    "learn-forces": [{ cap: "비행기에는 늘 네 가지 힘이 작용합니다.", set: { "lr-f-thr": 62, "lr-f-aoa": 3 }, view: [-0.75, 0.28, 0.9] }, { cap: "위로 드는 양력(초록)과 아래로 당기는 무게(빨강).", view: [-1.2, 0.12, 0.95] }, { cap: "앞으로 미는 추력(파랑)과 뒤로 잡는 항력(주황).", view: [-0.3, 0.3, 0.9] }, { cap: "추력을 올리면 항력보다 커져서 빨라집니다.", set: { "lr-f-thr": 95 } }, { cap: "추력을 줄이면 항력이 이겨서 느려집니다.", set: { "lr-f-thr": 30 } }, { cap: "기수를 들면 양력이 커져서 올라갑니다.", set: { "lr-f-thr": 62, "lr-f-aoa": 8 } }, { cap: "네 힘이 맞서면 속도와 고도 그대로 순항합니다.", set: { "lr-f-aoa": 3 } }],
    "learn-lift": [{ cap: "날개를 옆에서 봅니다. 공기는 앞에서 뒤로 흐릅니다.", set: { "lr-l-cl": 0.5, "lr-l-v": 480, "lr-l-h": 0 }, view: [-0.22, 0.1, 1.25] }, { cap: "윗면(파랑)은 공기가 빨리 흐르고 압력이 낮아집니다.", view: [-0.5, 0.35, 1.3] }, { cap: "아랫면(주황)은 압력이 조금 높습니다. 이 차이가 날개를 들어 올립니다.", view: [-0.5, -0.1, 1.3] }, { cap: "더 기울이면(받음각) 공기를 더 아래로 밀어 양력이 커집니다.", set: { "lr-l-cl": 1.2 }, view: [-0.22, 0.1, 1.25] }, { cap: "속도가 두 배가 되면 양력은 네 배가 됩니다.", set: { "lr-l-cl": 0.5, "lr-l-v": 900 } }, { cap: "높이 오르면 공기가 옅어져 같은 속도에서도 양력이 줄어듭니다.", set: { "lr-l-h": 11000 } }, { cap: "그래서 높은 곳에서는 더 빠르게 날아야 합니다.", set: { "lr-l-h": 0, "lr-l-v": 480 } }],
    "learn-stall": [{ cap: "받음각 4도. 공기가 날개 윗면을 따라 붙어 흐릅니다.", set: { "lr-s-a": 4 }, view: [-0.22, 0.1, 1.25] }, { cap: "더 기울이면 양력이 계속 커집니다.", set: { "lr-s-a": 11 } }, { cap: "15도 근처가 한계입니다. 이때 실속 경고가 울립니다.", set: { "lr-s-a": 14.5 } }, { cap: "넘으면 윗면 흐름이 떨어져 나가고 양력이 뚝 떨어집니다. 실속입니다.", set: { "lr-s-a": 19 } }, { cap: "회복은 기수를 숙여 받음각을 줄이는 것부터입니다.", set: { "lr-s-a": 5 } }],
    "learn-winglet": [{ cap: "윙렛이 없는 날개 끝. 아래 공기가 위로 말려 큰 소용돌이가 생깁니다.", click: '[data-lrw="none"]', view: [2.7, 0.3, 0.75] }, { cap: "블렌디드 윙렛. 끝을 위로 꺾어 소용돌이가 작아집니다.", click: '[data-lrw="blend"]' }, { cap: "분할 시미터 윙렛. 위아래로 갈라져 더 줄입니다.", click: '[data-lrw="scim"]', view: [2.3, 0.2, 0.8] }, { cap: "레이크드 윙팁. 꺾지 않고 날개 끝을 뒤로 길게 늘립니다.", click: '[data-lrw="raked"]', view: [2.7, 0.5, 0.75] }],
    "learn-sweep": [{ cap: "곧은 날개는 바람을 정면으로 다 받습니다.", set: { "lr-sw-a": 0, "lr-sw-m": 0.78 }, view: [-0.35, 0.95, 0.95] }, { cap: "날개를 젖히면 날개가 정면으로 받는 바람(초록)이 줄어듭니다.", set: { "lr-sw-a": 30 } }, { cap: "그래서 마하 0.85로 빨리 날아도 충격파를 늦출 수 있습니다.", set: { "lr-sw-m": 0.85 } }, { cap: "덜 젖힌 날개로 빨리 날면 빨간색, 충격파 구간에 들어갑니다.", set: { "lr-sw-a": 10 } }, { cap: "여객기는 보통 25~38도 정도로 젖힙니다.", set: { "lr-sw-a": 25, "lr-sw-m": 0.78 } }],
    "learn-highlift": [{ cap: "순항 때 날개. 얇고 매끈합니다.", set: { "lr-h-f": 0 }, view: [-0.22, 0.1, 1.25] }, { cap: "이륙: 슬랫과 플랩을 조금 펼칩니다.", set: { "lr-h-f": 1 } }, { cap: "더 펼치면 날개가 넓고 휘어져 양력이 커집니다.", set: { "lr-h-f": 3 }, view: [-0.6, 0.25, 1.2] }, { cap: "착륙: 가장 깊이 펼쳐 느린 속도에서도 날 수 있게 합니다.", set: { "lr-h-f": 4 } }, { cap: "펼칠수록 실속 속도가 내려가 더 천천히 내릴 수 있습니다.", view: [-0.22, 0.1, 1.25] }],
    "learn-control": [{ cap: "롤: 에일러론이 반대로 꺾여 한쪽 날개 양력만 커지고 기체가 기웁니다.", click: '[data-lra="roll"]', set: { "lr-c-in": 70 } }, { cap: "반대로 입력하면 반대쪽으로 기웁니다.", set: { "lr-c-in": -70 } }, { cap: "피치: 엘리베이터가 꼬리를 눌러 기수가 들립니다.", click: '[data-lra="pitch"]', set: { "lr-c-in": 70 } }, { cap: "요: 러더가 꼬리를 옆으로 밀어 기수가 돕니다.", click: '[data-lra="yaw"]', set: { "lr-c-in": 70 } }, { cap: "실제 선회에서는 세 축을 함께 씁니다.", click: '[data-lra="roll"]', set: { "lr-c-in": 40 } }]
  };
  const AUTO = { on: false, tok: 0 };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function autoTween(id, to, ms) {
    const el = document.getElementById(id); if (!el) return Promise.resolve();
    const from = +el.value, t0 = performance.now();
    return new Promise(res => { const step = now => { const k = Math.min(1, (now - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; el.value = from + (to - from) * e; el.dispatchEvent(new Event("input", { bubbles: true })); if (k < 1 && AUTO.on) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
  }
  function autoUi(state) {
    const b = document.querySelector("#app .lr-auto"); if (b) { b.classList.toggle("on", state); b.innerHTML = state ? "❚❚ 멈추기" : "▶ 자동 설명"; }
    const c = document.querySelector("#app .lr-cap3"); if (c && !state) c.classList.remove("show");
  }
  async function autoPlay() {
    const key = L3.key, steps = LR_AUTO[key]; if (!steps) return;
    AUTO.on = true; const tok = ++AUTO.tok; autoUi(true); L3.autoSpin = true;
    const cap = document.querySelector("#app .lr-cap3"), bar = document.querySelector("#app .lr-autobar span");
    for (let i = 0; i < steps.length; i++) {
      if (!AUTO.on || tok !== AUTO.tok || L3.key !== key) break;
      const st = steps[i];
      if (cap) { cap.classList.remove("show"); await sleep(180); cap.textContent = st.cap; cap.classList.add("show"); }
      if (bar) bar.style.width = ((i + 1) / steps.length * 100) + "%";
      if (st.click) { const el = document.querySelector("#app " + st.click); if (el) el.click(); }
      if (st.view) lr3view(st.view);
      if (st.set) await Promise.all(Object.keys(st.set).map(id => autoTween(id, st.set[id], 1100)));
      await sleep(st.set ? 2600 : 3400);
    }
    if (tok === AUTO.tok) { AUTO.on = false; L3.autoSpin = false; autoUi(false); if (bar) setTimeout(() => { bar.style.width = "0"; }, 600); }
  }
  function autoStop() { if (!AUTO.on) return; AUTO.on = false; AUTO.tok++; L3.autoSpin = false; autoUi(false); }
  document.addEventListener("click", e => { const b = e.target.closest && e.target.closest(".lr-auto"); if (!b) return; if (AUTO.on) autoStop(); else autoPlay(); });
  // 사용자가 직접 만지면 멈춘다 (자동 재생이 보낸 이벤트는 isTrusted가 false)
  document.addEventListener("pointerdown", e => { if (AUTO.on && e.isTrusted && e.target.closest && e.target.closest("#app .lr-stage") && !e.target.closest(".lr-auto")) autoStop(); }, true);
  window.addEventListener("hashchange", autoStop);
  // 페이지 HTML에서 평면 그림을 '단면으로 보기' 상자로 옮기고, 그 자리에 3D 캔버스를 넣는다
  function lr3wrap(html, key) {
    const a = html.indexOf('<div class="lr-fig'), b = html.indexOf('<div class="lr-side">', a); if (a < 0 || b < 0) return html;
    const fig = html.slice(a, b), endStage = html.indexOf("</section>", b) + "</section>".length;
    const canvas = `<div class="lr-fig lr3-fig"><canvas data-lr3="${key}" role="img" aria-label="끌어서 돌려 볼 수 있는 3D 그림"></canvas><span class="lr3-hint">끌어서 돌려 보기, 두 번 누르면 처음 시점</span>${LR_AUTO[key] ? `<button type="button" class="lr-auto">▶ 자동 설명</button><p class="lr-cap3" aria-live="polite"></p><div class="lr-autobar"><span></span></div>` : ""}</div>`;
    return html.slice(0, a) + canvas + html.slice(b, endStage) + `\n<section class="card c12 lr-sec2">${cardH(ICON.layers, "단면으로 보기")}${fig}</section>` + html.slice(endStage);
  }
