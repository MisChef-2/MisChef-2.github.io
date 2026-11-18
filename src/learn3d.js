  /* ================= 비행 원리: 3D 장면 =================
     작은 3D 그리기 도구. 다각형(날개, 동체)을 빛 방향에 따라 명암을 주고, 먼 것부터 그려(화가 알고리즘) 가린다.
     흐름선은 점선이 흘러가도록 움직이고, 끌면 카메라가 돈다. 좌표: x 앞(비행 방향), y 오른쪽 날개, z 위.
     공기는 x의 음의 방향으로 흐른다(비행기 기준). */
  const L3 = { cv: null, ctx: null, raf: 0, key: null, yaw: -0.65, pitch: 0.32, zoom: 1, W: 0, H: 0, dpr: 1, drag: null, t: 0 };
  const LR3_VIEW = { "learn-forces": [-0.75, 0.28, 0.9], "learn-lift": [-0.22, 0.1, 1.25], "learn-stall": [-0.22, 0.1, 1.25], "learn-winglet": [2.45, 0.42, 0.95], "learn-sweep": [-0.15, 1.3, 0.85], "learn-highlift": [-0.22, 0.1, 1.25], "learn-control": [-0.8, 0.38, 0.9] };
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
  const PL = { top: [121, 195, 234], stripe: [42, 93, 156], belly: [218, 223, 230], fin: [110, 186, 228], body: [236, 240, 246], wing: [200, 208, 220], eng: [168, 178, 192], dark: [44, 52, 66], win: [70, 92, 120], on: [47, 111, 237], off: [178, 188, 202] };
  /* 여객기: Blender에서 가져온 777 메시(PLANE_MESH)에 조종면(에일러론, 엘리베이터, 러더)만 따로 얹는다.
     조종면 위치는 메시의 날개, 꼬리날개 꼭짓점에서 뒷전을 찾아 정한다 */
  const L3M = (() => {
    const t = PLANE_MESH.t, tris = [], wing = [], hst = [], fin = [];
    for (let i = 0; i < t.length; i += 10) {
      const p = [[t[i] / 1000, t[i + 1] / 1000, t[i + 2] / 1000], [t[i + 3] / 1000, t[i + 4] / 1000, t[i + 5] / 1000], [t[i + 6] / 1000, t[i + 7] / 1000, t[i + 8] / 1000]], c = PLANE_MESH.mats[t[i + 9]];
      tris.push({ p: p, c: c });
      p.forEach(v => { if (Math.abs(v[1]) > 0.3 && v[0] > -1.2 && v[0] < 1.2 && v[2] > -0.3 && v[2] < 0.2) wing.push(v); else if (v[0] < -1.5 && Math.abs(v[1]) > 0.1 && v[2] > -0.05 && v[2] < 0.2) hst.push(v); else if (v[0] < -1.5 && Math.abs(v[1]) < 0.05 && v[2] > 0.25) fin.push(v); });
    }
    const span = Math.max(...wing.map(v => Math.abs(v[1]))), hspan = Math.max(...hst.map(v => Math.abs(v[1]))), ftop = Math.max(...fin.map(v => v[2]));
    const te = (V, k, at, w) => { const S = V.filter(v => Math.abs(Math.abs(v[k]) - at) < w); return S.length ? [Math.min(...S.map(v => v[0])), S.reduce((a, v) => a + v[k === 1 ? 2 : 1], 0) / S.length] : [0, 0]; };
    return { tris: tris, wing: wing, hst: hst, fin: fin, span: span, hspan: hspan, ftop: ftop, te: te };
  })();
  function l3plane(dfl) {
    dfl = dfl || {}; const P = L3M.tris.slice(), M = L3M;
    if (!("ail" in dfl || "elev" in dfl || "rud" in dfl)) return P;
    const surf = (A, B, d, axisAng, on, lift) => { const hA = [A[0] + d, A[1], A[2] + lift], hB = [B[0] + d, B[1], B[2] + lift], tA = [A[0], A[1], A[2] + lift], tB = [B[0], B[1], B[2] + lift], q = [hA, hB, tB, tA].map(v => rotAxis(v, hA, v3.sub(hB, hA), axisAng)); P.push({ p: q, c: on ? PL.on : PL.off }); P.push({ p: q.map(v => [v[0], v[1], v[2] - 2 * lift]), c: on ? PL.on : PL.off }); };
    [1, -1].forEach(sd => {
      // 에일러론: 날개폭 60~88%, 뒷전에서 시위 쪽으로 0.16
      const yA = M.span * 0.6, yB = M.span * 0.88, a = M.te(M.wing, 1, yA, 0.08), b = M.te(M.wing, 1, yB, 0.08);
      surf([a[0], sd * yA, a[1]], [b[0], sd * yB, b[1]], 0.16, (dfl.ail || 0) * sd, !!dfl.ail, 0.012);
      // 엘리베이터: 수평 꼬리날개 15~90%
      const hA = M.hspan * 0.15, hB = M.hspan * 0.9, c = M.te(M.hst, 1, hA, 0.06), e = M.te(M.hst, 1, hB, 0.06);
      surf([c[0], sd * hA, c[1]], [e[0], sd * hB, e[1]], 0.12, -(dfl.elev || 0) * sd, !!dfl.elev, 0.01);
    });
    // 러더: 수직 꼬리날개 높이 15~92%
    const z0 = 0.35, z1 = M.ftop * 0.92, ra = M.fin.filter(v => Math.abs(v[2] - z0) < 0.08), rb = M.fin.filter(v => Math.abs(v[2] - z1) < 0.08);
    const xa = ra.length ? Math.min(...ra.map(v => v[0])) : -2.4, xb = rb.length ? Math.min(...rb.map(v => v[0])) : -2.5;
    const rA = [xa + 0.16, 0.012, z0], rB = [xb + 0.12, 0.012, z1], rTA = [xa, 0.012, z0], rTB = [xb, 0.012, z1];
    const rud = [rA, rB, rTB, rTA].map(q => rotAxis(q, rA, v3.sub(rB, rA), dfl.rud || 0)); P.push({ p: rud, c: dfl.rud ? PL.on : PL.off }); P.push({ p: rud.map(v => [v[0], -v[1], v[2]]), c: dfl.rud ? PL.on : PL.off });
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
      out.push({ p: pts, col: upper ? (opt.sep && n >= zs.filter(v => v > 0).length - 2 ? [220, 90, 40] : [37, 99, 235]) : [100, 116, 139], speed: upper ? 1.6 : 0.85, w: 1.4, wob: upper && opt.sep && n >= zs.filter(v => v > 0).length - 2 ? opt.sep : 0, startX: le });
    }));
    return out;
  }
  // 화살표: 3D 줄기 + 화면 위 화살촉, 끝에 이름
  const l3arrow = (from, to, col, label) => ({ arrow: true, from, to, col, label });

  /* ---------- 장면들 ---------- */
  const lrVal = (id, d) => { const e = document.getElementById(id); return e ? +e.value : d; };
  // 단면 장면 안내: 바람 방향(앞), 앞전, 뒷전, 위아래 압력. noline 이름표는 선 없이 꼬리표만 그린다
  const l3guide = (y, a, top, bot) => { const R = p => rotY(p, a || 0, [-0.5, 0, 0]); return [
    { from: [3.1, y, -0.5], to: [1.35, y, -0.5], col: [100, 116, 139], label: "바람 (앞에서 옴)" },
    { from: R([0.55, y, -0.05]), to: R([0.55, y, -0.05]), col: [30, 41, 59], label: "날개 앞쪽 끝", noline: true },
    { from: R([-2.15, y, 0.12]), to: R([-2.15, y, 0.12]), col: [30, 41, 59], label: "날개 뒤쪽 끝", noline: true },
    top ? { from: R([-2.0, 1.35, 0.38]), to: R([-2.0, 1.35, 0.38]), col: [37, 99, 235], label: top, noline: true } : null,
    bot ? { from: R([-1.2, 1.2, -0.5]), to: R([-1.2, 1.2, -0.5]), col: [234, 88, 12], label: bot, noline: true } : null].filter(Boolean); };
  const l3smooth = P => { if (P.length < 5) return P; let Q = P; for (let r = 0; r < 3; r++) Q = Q.map((p, i) => i === 0 || i === Q.length - 1 ? p : [(Q[i - 1][0] + p[0] * 2 + Q[i + 1][0]) / 4, (Q[i - 1][1] + p[1] * 2 + Q[i + 1][1]) / 4, (Q[i - 1][2] + p[2] * 2 + Q[i + 1][2]) / 4]); return Q; };
  // 흐름선을 유체처럼: 아주 옅은 바탕선 위로, 작은 입자들이 꼬리를 끌며 일정하게 흘러간다(꼬리는 뒤로 갈수록 흐려짐)
  // mult = 속도 배율. 프레임마다 흐른 시간 × 배율을 쌓아 두어, 슬라이더를 움직여도 입자가 튀지 않고 빨라지거나 느려진다
  const l3nice = (L, mult, dens) => { const D = dens == null ? 1 : Math.max(0.15, Math.min(1, dens)); const now = performance.now() / 1000, dt = Math.min(0.1, now - (L3.flast || now)); L3.flast = now; L3.fx = (L3.fx || 0) + dt * (mult || 1); const T = L3.fx; return L.flatMap(l => {
    l = Object.assign({}, l, { p: l3smooth(l.p), wob: 0 }); const col = l.col[0] > 200 ? l.col : (l.col[2] > 200 ? [59, 130, 246] : [148, 163, 184]);
    const P = l.p, acc = [0]; for (let i = 1; i < P.length; i++) acc.push(acc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2])); const tot = acc[acc.length - 1] || 1;
    const at = d => { d = Math.max(0, Math.min(tot, d)); let i = 1; while (i < acc.length - 1 && acc[i] < d) i++; const k = (d - acc[i - 1]) / ((acc[i] - acc[i - 1]) || 1); return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * k, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * k, P[i - 1][2] + (P[i][2] - P[i - 1][2]) * k]; };
    const out = [Object.assign({}, l, { col: col, dash: null, speed: 0, alpha: 0.16, w: 1.2, fade: true })], N = Math.max(2, Math.round(9 * D)), sp = Math.pow(l.speed || 1, 1.8) * 0.5, tl = 0.55, ph = (P[0][1] * 3.7 + P[0][2] * 5.1) % 1;
    for (let n = 0; n < N; n++) { const head = (((T * sp / tot + n / N + ph) % 1) + 1) % 1 * (tot + tl); const pts = []; for (let k = 0; k <= 8; k++) pts.push(at(head - tl + tl * k / 8)); const edge = Math.min(1, head / 0.6, (tot + tl - head) / 0.6); out.push({ p: pts, col: col, dash: null, speed: 0, w: 1.6 + 1.2 * D, alpha: (0.45 + 0.5 * D) * Math.max(0, edge), tail: true }); }
    return out; }); };
  // 실속 때 윗면 뒤쪽의 떨어진 흐름: 매끈한 나선 몇 개가 천천히 돈다 (세기 k 0~1)
  const l3swirls = (a, t, k) => { const L = []; [-1.0, 0, 1.0].forEach((y, j) => {
      const R = q => rotY(q, a, [-0.5, 0, 0]), band = []; for (let x = -0.7; x >= -2.6; x -= 0.08) band.push(R([x, y, 0.2 + (-0.7 - x) * 0.12]));
      L.push({ p: band, col: [239, 68, 68], speed: 0, w: 16 + 10 * k, dash: null, alpha: 0.10, fade: true });
      const cx = -1.25 - 0.15 * j, cz = 0.36, Rr = 0.12 + 0.08 * k, pts = []; for (let u = 0; u <= 9; u += 0.1) { const r = Rr * (0.15 + u / 9 * 0.85), ang = u - t * 2.4 + j * 1.7; pts.push(R([cx + r * Math.cos(ang) - u * 0.03, y, cz + r * Math.sin(ang)])); }
      L.push({ p: pts, col: [220, 38, 38], speed: 0, w: 2.6, dash: null, alpha: 0.85, fade: true }); }); return L; };
  const LR3_SCENES = {
    "learn-forces": t => {
      const thr = lrVal("lr-f-thr", 62), aoa = lrVal("lr-f-aoa", 3) * LR_TOR, speed = 0.35 + thr / 100 * 0.65, lift = Math.min(1.5, (0.55 + aoa / LR_TOR * 0.09) * (0.6 + speed * 0.55)), drag = 0.28 + speed * speed * 0.42 + aoa / LR_TOR * 0.025;
      const P = l3plane().map(q => ({ p: q.p.map(p => rotY(p, aoa, [0, 0, 0])), c: q.c })), L = [];
      for (let i = 0; i < 9; i++) { const y = -4 + (i % 3) * 4, z = -1.6 + Math.floor(i / 3) * 1.6; L.push({ p: [[4.5, y, z], [-4.5, y, z]], col: [148, 163, 184], speed: 2 + speed * 6, w: 1, dash: [0.4, 0.6] }); }
      return { sky: true, shadow: [0, 0, 0, 3.2, 3.6], polys: P, lines: L, arrows: [l3arrow([0, 0, 0.35], [0, 0, 0.35 + lift * 2.2], [22, 163, 74], "양력"), l3arrow([0, 0, -0.35], [0, 0, -1.9], [220, 38, 38], "무게"), l3arrow([2.7, 0, 0], [2.7 + thr / 100 * 2.4, 0, 0], [37, 99, 235], "추력"), l3arrow([-2.6, 0, 0], [-2.6 - drag * 2.4, 0, 0], [234, 88, 12], "항력")] };
    },
    // 흐름선: 흐린 실선 위로 작은 점이 흘러가게 (점선 여러 겹 대신)
    "learn-lift": t => {
      const cl = lrVal("lr-l-cl", 0.5), a = Math.max(-3, (cl - 0.2) / 0.095) * LR_TOR, loop = l3foil(2, 2), half = loop.length / 2;
      const col = [206, 213, 223]; void half;
      const P = l3wing(loop.map(q => [q[0], q[1]]), [{ y: -1.4, dx: 0, dz: 0, k: 1 }, { y: 1.4, dx: 0, dz: 0, k: 1 }], col).map(q => ({ p: q.p.map(p => rotY(p, a, [-0.5, 0, 0])), c: q.c }));
      return { sky: true, polys: P, lines: l3nice(l3flows(2, a, [-1.2, -0.6, 0, 0.6, 1.2], [0.3, 0.62, -0.32], { down: 0.04 + cl * 0.07 }), lrVal("lr-l-v", 480) / 300, lrRho(lrVal("lr-l-h", 0)) / 1.225), arrows: [l3arrow([-0.5, 0, 0.25], [-0.5, 0, 0.45 + cl * 0.8], [22, 163, 74], "양력"), l3arrow([-2.6, 0, -0.1], [-3.3, 0, -0.1 - cl * 0.6], [37, 99, 235], "내리흐름"), { from: [1.2, 1.4, 0.9], to: [1.2, 1.4, 0.9], col: [100, 116, 139], label: `공기 밀도 해면의 ${Math.round(lrRho(lrVal("lr-l-h", 0)) / 1.225 * 100)}% (고도 ${fmt(lrVal("lr-l-h", 0))} m)`, noline: true }, ...l3guide(-1.45, a, "윗면: 압력 낮음", "아랫면: 압력 높음")] };
    },
    "learn-stall": t => {
      const ad = lrVal("lr-s-a", 4), a = ad * LR_TOR, stall = ad > 15, loop = l3foil(2, 2);
      const P = l3wing(loop, [{ y: -1.4, dx: 0, dz: 0, k: 1 }, { y: 1.4, dx: 0, dz: 0, k: 1 }], [206, 213, 223]).map(q => ({ p: q.p.map(p => rotY(p, a, [-0.5, 0, 0])), c: q.c }));
      const cl = lrCL(ad);
      return { sky: true, polys: P, lines: l3nice(l3flows(2, a, [-1.2, -0.6, 0, 0.6, 1.2], [0.3, 0.62, -0.32], { down: Math.min(cl, 1.6) * 0.08, sep: 0 })).map(l => stall && l.col[0] < 120 && l.p.some(q => q[2] > 0.1) ? Object.assign({}, l, { col: [234, 88, 12] }) : l).concat(stall ? l3swirls(a, t, Math.min(1, (ad - 15) / 5)) : []), arrows: [l3arrow([-0.5, 0, 0.3], [-0.5, 0, 0.45 + cl * 0.75], stall ? [220, 38, 38] : [22, 163, 74], stall ? "양력 급감" : "양력"), ...l3guide(-1.45, a, stall ? "윗면 흐름이 떨어져 나감" : "윗면 흐름이 날개를 따라감", null)] };
    },
    "learn-winglet": t => {
      // 777 메시 전체를 쓰고, 오른쪽 날개 끝에 윙렛 모양을 얹는다. 소용돌이는 양쪽 날개 끝에서 뒤로 끌려간다
      const w = (typeof LR_WL !== "undefined" ? LR_WL.find(x => x[0] === lrWL) : null) || [0, 0, 1], s = w[2];
      const P = l3plane(), M = L3M, tipY = M.span, tip = M.te(M.wing, 1, tipY - 0.03, 0.05), tipX = tip[0] + 0.16, tipZ = tip[1];
      const wl = { blend: [[0, 0, 0], [-0.04, 0.03, 0.06], [-0.09, 0.04, 0.19]], shark: [[0, 0, 0], [-0.03, 0.01, 0.04], [-0.1, 0.02, 0.2]], scim: [[0, 0, 0], [-0.06, 0.02, 0.18]], raked: [[0, 0, 0], [-0.3, 0.26, 0.01]] }[lrWL];
      [1, -1].forEach(sd => { if (wl) { const C = [tipX, sd * tipY, tipZ]; for (let i = 0; i < wl.length - 1; i++) { const a = v3.add(C, [wl[i][0], sd * wl[i][1], wl[i][2]]), b = v3.add(C, [wl[i + 1][0], sd * wl[i + 1][1], wl[i + 1][2]]), ch = 0.16 * (1 - i * 0.35), ch2 = 0.16 * (1 - (i + 1) * 0.35); P.push({ p: [a, b, [b[0] - ch2, b[1], b[2]], [a[0] - ch, a[1], a[2]]], c: [47, 111, 237] }); } if (lrWL === "scim") { const b = v3.add(C, [-0.05, sd * 0.02, -0.09]); P.push({ p: [C, b, [b[0] - 0.08, b[1], b[2]], [C[0] - 0.14, C[1], C[2]]], c: [47, 111, 237] }); } } });
      const L = [], R0 = 0.3, R = Math.max(0.06, 0.06 + 0.6 * (s - 0.6)), ex = lrWL === "raked" ? 0.26 : 0, ez = wl && lrWL !== "raked" ? 0.12 : 0;
      [1, -1].forEach(sd => {
        const cy = sd * (tipY + ex), cz = tipZ + ez, x0 = tipX + 0.02;
        // 지금 소용돌이: 파란 나선 세 가닥
        for (let k = 0; k < 3; k++) { const pts = []; for (let x = 0; x <= 7; x += 0.05) { const ang = sd * (x * 5 + k * 2.1 - t * 4), r = R * Math.min(1, Math.pow(x / 1.1, 0.7)); pts.push([x0 - x, cy + r * Math.cos(ang), cz + r * Math.sin(ang)]); } L.push({ p: pts, col: [37, 99, 235], speed: 0, w: 1.4 + s, dash: null, alpha: 0.8 - k * 0.2, fade: true }); }
        // 비교용: 윙렛이 없을 때 소용돌이 크기(회색 점선 고리)
        [1.2, 2.4, 3.6].forEach(x => { const pts = []; for (let a = 0; a <= 6.3; a += 0.2) pts.push([x0 - x, cy + R0 * Math.cos(a), cz + R0 * Math.sin(a)]); L.push({ p: pts, col: [148, 163, 184], speed: 0, w: 1, dash: [0.05, 0.06], alpha: 0.7 }); });
      });
      // 날개 아래 공기는 바깥(날개 끝)으로, 위 공기는 안쪽으로 휘며 흐른다: 곡선 유선 위로 입자가 흐르게
      const span3 = []; [1, -1].forEach(sd => [0.9, 1.45, 1.95].forEach(y => { const lo = [], hi = []; for (let k = 0; k <= 14; k++) { const u = k / 14, x = 0.55 - u * 1.6; lo.push([x, sd * (y + 0.42 * u * u), -0.24 - 0.02 * u]); hi.push([x, sd * (y - 0.32 * u * u), 0.16 + 0.02 * u]); } span3.push({ p: lo, col: [234, 88, 12], speed: 0.9 }, { p: hi, col: [37, 99, 235], speed: 1.3 }); }));
      L.push(...l3nice(span3));
      const pct = Math.round(s * 100), lab = [tipX - 2.6, tipY + ex, tipZ + ez + R0 + 0.05];
      const far = [tipX - 6.2, tipY + ex, tipZ + ez - 0.2];
      return { sky: true, polys: P, lines: L, arrows: [{ from: far, to: far, col: [100, 116, 139], label: "뒤로 수 km, 몇 분 동안 이어짐", noline: true }, { from: lab, to: lab, col: [37, 99, 235], label: lrWL === "none" ? "소용돌이 크기 100% (기준)" : `소용돌이 크기 ${pct}% (회색 = 윙렛 없을 때)`, noline: true }] };
    },
    "learn-sweep": t => {
      // 777 메시에서 주날개, 엔진, 착륙장치를 빼고 동체와 꼬리만 쓴다. 주날개는 슬라이더 각도로 새로 그린다
      const sw = lrVal("lr-sw-a", 25) * LR_TOR, m = lrVal("lr-sw-m", 0.78), M = L3M, span = M.span, thin = l3foil(0.95, 3);
      const WP = PLANE_MESH.mats.findIndex(c => c[0] === 200 && c[1] === 207), cut = c => c === PLANE_MESH.mats[WP];
      const P = M.tris.filter(q => { const cx = (q.p[0][0] + q.p[1][0] + q.p[2][0]) / 3, cy = Math.abs((q.p[0][1] + q.p[1][1] + q.p[2][1]) / 3), cz = (q.p[0][2] + q.p[1][2] + q.p[2][2]) / 3; if (cut(q.c) && cx > -1.5) return false; if (cy > 0.36 && cz < 0.15 && cx > -1.5) return false; if (cz < -0.42) return false; return true; });
      const rootX = 0.55, rootZ = -0.16;
      [1, -1].forEach(sd => P.push(...l3wing(thin, sd > 0 ? [{ y: 0.3, dx: rootX, dz: rootZ, k: 1 }, { y: span, dx: rootX - Math.tan(sw) * span, dz: rootZ + 0.16, k: 0.32 }] : [{ y: -span, dx: rootX - Math.tan(sw) * span, dz: rootZ + 0.16, k: 0.32 }, { y: -0.3, dx: rootX, dz: rootZ, k: 1 }], [200, 207, 217])));
      // 바람 나누기: 오른쪽 날개 앞전 위의 한 점(P0)으로 들어오는 바람을, 앞전에 수직인 몫(초록)과 앞전을 따라가는 몫(주황)으로 나눠 삼각형으로 그린다
      const yP = span * 0.55, P0 = [rootX - Math.tan(sw) * yP + 0.02, yP, rootZ + 0.16 * (yP / span) + 0.06], V = 2.3;
      const e = [-Math.sin(sw), Math.cos(sw), 0], n = [-Math.cos(sw), -Math.sin(sw), 0], S = v3.add(P0, [V, 0, 0]), vn = V * Math.cos(sw), vt = V * Math.sin(sw);
      const A = v3.add(S, v3.mul(n, vn)), B = v3.add(S, v3.mul(e, vt));
      const mn = m * Math.cos(sw), danger = mn > 0.72, L = [];
      L.push({ p: [S, B], col: [148, 163, 184], speed: 0, w: 1.2, dash: [0.06, 0.06], alpha: 0.8 }, { p: [B, P0], col: [148, 163, 184], speed: 0, w: 1.2, dash: [0.06, 0.06], alpha: 0.8 });
      // 앞전 선을 옅게 강조
      L.push({ p: [[rootX, 0.3, rootZ + 0.05], [rootX - Math.tan(sw) * span, span, rootZ + 0.2]], col: [37, 99, 235], speed: 0, w: 2, dash: null, alpha: 0.45 });
      const mid = (a, b) => v3.mul(v3.add(a, b), 0.5), tag = (pt, col, label) => ({ from: pt, to: pt, col: col, label: label, noline: true });
      return { sky: true, polys: P, lines: L, arrows: [
        l3arrow(S, P0, [100, 116, 139], ""), l3arrow(S, A, danger ? [220, 38, 38] : [22, 163, 74], ""), l3arrow(A, P0, [234, 88, 12], ""),
        tag(v3.add(mid(S, P0), [0, 0, 0.12]), [100, 116, 139], `바람 마하 ${m.toFixed(2)}`),
        tag(v3.add(mid(S, A), [0.05, -0.25, 0]), danger ? [220, 38, 38] : [22, 163, 74], `날개가 느끼는 몫 마하 ${mn.toFixed(2)}${danger ? " (충격파)" : ""}`),
        tag(v3.add(mid(A, P0), [0, 0.2, 0]), [234, 88, 12], `날개를 따라 흐르는 몫 마하 ${(m * Math.sin(sw)).toFixed(2)}`),
        tag([rootX + 0.2, 0.55, rootZ + 0.1], [37, 99, 235], "날개 앞쪽 끝 (후퇴각 " + Math.round(sw / LR_TOR) + "°)")] };
    },
    "learn-highlift": t => {
      // 접힌 상태: 매끈한 날개 단면 하나. 펼치면 앞에서 얇은 슬랫이 앞아래로, 뒤에서 작은 날개 모양 플랩이 뒤아래로 미끄러져 나오며 꺾인다
      const i = lrVal("lr-h-f", 0), k = [0, 10, 20, 32, 40][i] / 40, C = 1.8, main = l3foil(C, 2), Y = [{ y: -1.4, dx: 0, dz: 0, k: 1 }, { y: 1.4, dx: 0, dz: 0, k: 1 }];
      const P = l3wing(main, Y, [206, 213, 223]);
      if (k > 0) {
        const sl = l3foil(0.42, 2).map(q => [q[0], q[1] * 0.55]);
        P.push(...l3wing(sl, Y, [47, 111, 237]).map(q => ({ p: q.p.map(p => rotY([p[0] + 0.3 * k + 0.06, p[1], p[2] - 0.13 * k], -0.45 * k, [0.1, 0, 0])), c: q.c })));
        const fl = l3foil(0.62, 3), fx = -C + 0.18 - 0.42 * k, fz = -0.06 - 0.16 * k;
        P.push(...l3wing(fl, Y, [47, 111, 237]).map(q => ({ p: q.p.map(p => rotY([p[0] + fx, p[1], p[2] + fz], -0.75 * k, [fx, 0, fz])), c: q.c })));
      }
      return { sky: true, polys: P, lines: l3nice(l3flows(2, 0.03, [-1.2, -0.6, 0, 0.6, 1.2], [0.32, 0.66, -0.34], { down: 0.05 + k * 0.28 })), arrows: [l3arrow([-0.8, 0, 0.3], [-0.8, 0, 0.45 + [1.3, 1.75, 2.1, 2.45, 2.6][i] * 0.5], [22, 163, 74], `낼 수 있는 최대 양력 ×${[1.3, 1.75, 2.1, 2.45, 2.6][i] / 1.3 >= 1.005 ? ([1.3, 1.75, 2.1, 2.45, 2.6][i] / 1.3).toFixed(2) : "1.00"} (최대 양력계수 ${[1.3, 1.75, 2.1, 2.45, 2.6][i]})`), { from: [1.6, -1.4, 1.0], to: [1.6, -1.4, 1.0], col: [47, 111, 237], label: ["접힌 상태 (순항): 슬라이더로 펼쳐 보세요", "플랩 5 (이륙): 슬랫과 플랩이 조금 나옴", "플랩 15 (이륙, 짧은 활주로)", "플랩 30 (착륙)", "플랩 40 (최대, 짧은 착륙)"][i], noline: true }, ...l3guide(-1.45, 0, null, null), ...(k > 0 ? [{ from: [0.55, 1.45, -0.05], to: [0.55, 1.45, -0.05], col: [47, 111, 237], label: "슬랫", noline: true }, { from: [-2.35, 1.45, -0.3], to: [-2.35, 1.45, -0.3], col: [47, 111, 237], label: "플랩", noline: true }] : [])] };
    },
    "learn-control": t => {
      const ax = typeof lrAxis !== "undefined" ? lrAxis : "roll", v = lrVal("lr-c-in", 40) / 100, d = 0.55 * v;
      const P0 = l3plane({ ail: ax === "roll" ? d : 0, elev: ax === "pitch" ? -d : 0, rud: ax === "yaw" ? -d : 0 });
      const att = p => { let q = p; if (ax === "roll") q = rotX(q, v * 0.6, [0, 0, 0]); if (ax === "pitch") q = rotY(q, v * 0.4, [0, 0, 0]); if (ax === "yaw") q = rotZ(q, -v * 0.45, [0, 0, 0]); return q; };
      const P = P0.map(q => ({ p: q.p.map(att), c: q.c }));
      return { sky: true, shadow: [0, 0, 0, 3.2, 3.6], polys: P, lines: [], arrows: [l3arrow([-3.6, 0, 0], [3.8, 0, 0], ax === "roll" ? [220, 38, 38] : [203, 213, 225], "롤 축"), l3arrow([0, -3.8, 0], [0, 3.8, 0], ax === "pitch" ? [22, 163, 74] : [203, 213, 225], "피치 축"), l3arrow([0, 0, -1.4], [0, 0, 2.2], ax === "yaw" ? [37, 99, 235] : [203, 213, 225], "요 축")] };
    }
  };

  /* ---------- 그리기 ---------- */
  const LIGHT = (() => { const l = [0.35, -0.45, 0.82], n = Math.hypot(...l); return l.map(x => x / n); })();
  function l3draw(now) {
    const c = L3.ctx, sc = LR3_SCENES[L3.key]; if (!c || !sc) return;
    const dark = getComputedStyle(document.documentElement).getPropertyValue("--mg").trim() === "1";
    c.setTransform(L3.dpr, 0, 0, L3.dpr, 0, 0); c.clearRect(0, 0, L3.W, L3.H);
    const S = sc(now / 1000), items = [];
    // 바닥 모눈(원근). 하늘을 나는 장면(sky)에는 그리지 않는다
    if (!S.sky) { c.lineWidth = 1; c.strokeStyle = dark ? "rgba(148,180,220,.10)" : "rgba(100,116,139,.12)";
    for (let i = -8; i <= 8; i++) { const a = l3prj([i, -8, -2.6]), b = l3prj([i, 8, -2.6]), e = l3prj([-8, i, -2.6]), f = l3prj([8, i, -2.6]); c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.moveTo(e.x, e.y); c.lineTo(f.x, f.y); c.stroke(); } }
    if (S.shadow && !S.sky) { const sh = S.shadow, pts = Array.from({ length: 28 }, (_, i) => { const q = i / 28 * Math.PI * 2; return l3prj([sh[0] + sh[3] * Math.cos(q), sh[1] + sh[4] * Math.sin(q), -2.6]); }), cx = pts.reduce((a, p) => a + p.x, 0) / pts.length, cy = pts.reduce((a, p) => a + p.y, 0) / pts.length, rr = Math.max(...pts.map(p => Math.hypot(p.x - cx, p.y - cy)));
      const g = c.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, dark ? "rgba(0,0,0,.35)" : "rgba(15,23,42,.16)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.fill(); }
    S.polys.forEach(q => { const pr = q.p.map(l3prj), dep = pr.reduce((s, r) => s + r.d, 0) / pr.length, nrm = v3.cross(v3.sub(q.p[1], q.p[0]), v3.sub(q.p[2], q.p[0])), nl = v3.len(nrm) || 1, lam = Math.abs((nrm[0] * LIGHT[0] + nrm[1] * LIGHT[1] + nrm[2] * LIGHT[2]) / nl); items.push({ t: 0, pr, dep, col: q.c, sh: 0.5 + 0.5 * lam }); });
    S.lines.forEach(ln => { const pr = ln.p.map(l3prj); let acc = 0; for (let i = 1; i < pr.length; i++) { const a = pr[i - 1], b = pr[i], sl = Math.hypot(b.x - a.x, b.y - a.y); let wob = 0; if (ln.wob) wob = Math.sin(i * 0.9 + now / 120) * 6 * ln.wob * Math.min(1, i / 12); items.push({ t: 1, a, b, wob, dep: (a.d + b.d) / 2, ln, acc, f: i / (pr.length - 1) }); acc += sl; } });
    items.sort((p, q) => q.dep - p.dep);
    items.forEach(it => {
      if (it.t === 0) { const r = Math.round(it.col[0] * it.sh), g = Math.round(it.col[1] * it.sh), b = Math.round(it.col[2] * it.sh); c.fillStyle = `rgb(${r},${g},${b})`; c.strokeStyle = c.fillStyle; c.lineWidth = 0.8; c.lineJoin = "round"; c.beginPath(); it.pr.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); c.fill(); c.stroke(); return; }
      const ln = it.ln, k = (it.a.k + it.b.k) / 2; const fa = ln.tail ? Math.pow(Math.min(1, Math.max(0, it.f)), 1.6) : ln.fade ? Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, it.f))), 0.7) : 1; c.strokeStyle = `rgba(${ln.col.join(",")},${((ln.alpha != null ? ln.alpha : 0.8) * fa).toFixed(3)})`; c.lineWidth = (ln.w || 1.2) * k * (ln.tail ? 0.35 + 0.65 * Math.min(1, Math.max(0, it.f)) : 1); c.lineCap = "round";
      if (ln.dash !== null) { const ds = ln.dash || [0.18, 0.14], sz = Math.min(L3.W, L3.H * 1.7) * 0.125 * L3.zoom; c.setLineDash([ds[0] * sz * k, ds[1] * sz * k]); c.lineDashOffset = -(now / 1000) * (ln.speed != null ? ln.speed : 1) * sz * 0.6 + it.acc; } else c.setLineDash([]);
      c.beginPath(); c.moveTo(it.a.x, it.a.y + (it.wob || 0) * 0.6); c.lineTo(it.b.x, it.b.y + (it.wob || 0)); c.stroke();
    });
    c.setLineDash([]);
    // 화살표는 맨 위에
    L3.tags = [];
    (S.arrows || []).forEach(ar => { const a = l3prj(ar.from), b = l3prj(ar.to), ang = Math.atan2(b.y - a.y, b.x - a.x), col = `rgb(${ar.col.join(",")})`; c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 3.6; c.lineCap = "round"; if (!ar.noline) { c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x - Math.cos(ang) * 8, b.y - Math.sin(ang) * 8); c.stroke(); c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x - Math.cos(ang - 0.4) * 13, b.y - Math.sin(ang - 0.4) * 13); c.lineTo(b.x - Math.cos(ang + 0.4) * 13, b.y - Math.sin(ang + 0.4) * 13); c.closePath(); c.fill(); } if (ar.label) { c.font = "600 12px " + getComputedStyle(document.body).fontFamily; const tw = c.measureText(ar.label).width, capOn = !!document.querySelector("#app .lr-cap3.show"), bottom = L3.H - (capOn ? 92 : 26);
        // 이름표는 그림 안에, 자막이 떠 있으면 자막 위로 올린다
        let lx = Math.max(8, Math.min(L3.W - tw - 8, b.x + 8)), ly = Math.max(18, Math.min(bottom, b.y - 6)); if (capOn && ly > bottom - 4) ly = bottom;
        // 이름표: 흰 둥근 꼬리표 + 화살표 색 점 + 진한 글씨 (어두운 테마는 반대로)
        const ph = 22, pw = tw + 26, px = Math.max(6, Math.min(L3.W - pw - 6, lx - 4)); let py = ly - 15; L3.tags = L3.tags || []; for (let n = 0; n < 6 && L3.tags.some(r => px < r[0] + r[2] + 4 && px + pw + 4 > r[0] && py < r[1] + r[3] + 4 && py + ph + 4 > r[1]); n++) py += ph + 6; L3.tags.push([px, py, pw, ph]);
        c.save(); c.shadowColor = "rgba(15,23,42,.14)"; c.shadowBlur = 8; c.shadowOffsetY = 2; c.fillStyle = dark ? "rgba(15,23,42,.92)" : "rgba(255,255,255,.96)"; c.beginPath(); if (c.roundRect) c.roundRect(px, py, pw, ph, 11); else c.rect(px, py, pw, ph); c.fill(); c.restore();
        c.strokeStyle = `rgba(${ar.col.join(",")},.35)`; c.lineWidth = 1; c.beginPath(); if (c.roundRect) c.roundRect(px + 0.5, py + 0.5, pw - 1, ph - 1, 10.5); else c.rect(px, py, pw, ph); c.stroke();
        c.fillStyle = col; c.beginPath(); c.arc(px + 11, py + ph / 2, 3.6, 0, 7); c.fill();
        c.fillStyle = dark ? "#e2e8f0" : "#1e293b"; c.fillText(ar.label, px + 19, py + 15.5); } });
  }
  function l3size() { const r = L3.cv.getBoundingClientRect(); if (!r.width) return; L3.W = r.width; L3.H = r.height; L3.dpr = Math.min(2, window.devicePixelRatio || 1); L3.cv.width = Math.round(L3.W * L3.dpr); L3.cv.height = Math.round(L3.H * L3.dpr); }
  function l3loop(now) { L3.raf = 0; if (!L3.cv || !document.contains(L3.cv)) { L3.cv = null; return; } if (L3.autoSpin && !L3.drag) L3.yaw += 0.0025; { const rr = L3.cv.getBoundingClientRect(); if (L3.cv.width !== Math.round(rr.width * L3.dpr) || L3.cv.height !== Math.round(rr.height * L3.dpr)) l3size(); } l3draw(now); if (!fxCalm()) L3.raf = requestAnimationFrame(l3loop); }
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
    "learn-winglet": [{ cap: "윙렛이 없는 날개 끝. 아래 공기가 위로 말려 큰 소용돌이가 생깁니다.", click: '[data-lrw="none"]', view: [2.45, 0.42, 0.95] }, { cap: "블렌디드 윙렛. 끝을 위로 꺾어 소용돌이가 작아집니다.", click: '[data-lrw="blend"]' }, { cap: "분할 시미터 윙렛. 위아래로 갈라져 더 줄입니다.", click: '[data-lrw="scim"]', view: [2.2, 0.35, 1.05] }, { cap: "레이크드 윙팁. 꺾지 않고 날개 끝을 뒤로 길게 늘립니다.", click: '[data-lrw="raked"]', view: [2.7, 0.5, 0.75] }],
    "learn-sweep": [{ cap: "곧은 날개는 바람을 정면으로 다 받습니다.", set: { "lr-sw-a": 0, "lr-sw-m": 0.78 }, view: [-0.15, 1.3, 0.85] }, { cap: "날개를 젖히면 날개가 정면으로 받는 바람(초록)이 줄어듭니다.", set: { "lr-sw-a": 30 } }, { cap: "그래서 마하 0.85로 빨리 날아도 충격파를 늦출 수 있습니다.", set: { "lr-sw-m": 0.85 } }, { cap: "덜 젖힌 날개로 빨리 날면 빨간색, 충격파 구간에 들어갑니다.", set: { "lr-sw-a": 10 } }, { cap: "여객기는 보통 25~38도 정도로 젖힙니다.", set: { "lr-sw-a": 25, "lr-sw-m": 0.78 } }],
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
