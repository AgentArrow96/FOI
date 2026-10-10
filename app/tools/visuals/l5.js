// Chapter 5 visuals
const PORT = { sA: 0.20, sB: 0.10, eA: 0.12, eB: 0.06 };
const sigmaP = (w, rho) => Math.sqrt(w * w * PORT.sA ** 2 + (1 - w) ** 2 * PORT.sB ** 2 + 2 * w * (1 - w) * PORT.sA * PORT.sB * rho);

ML_VIS.l5_correlation = function (root) {
    let w = 0.5, rho = 0;
    const svg = V.svg(560, 310), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' },
        V.slider('weight in A', 0, 100, 1, w * 100, v => { w = v / 100; draw(); }, v => v + '%'),
        V.slider('correlation ρ', -1, 1, 0.05, rho, v => { rho = v; draw(); }, v => (v > 0 ? '+' : '') + v.toFixed(2))), svg, read);
    function draw() {
        V.clear(svg);
        const c = V.chart(svg, { x0: 70, x1: 520, y0: 260, y1: 30, X: [0, 0.22], Y: [0.05, 0.13], xticks: [0, 0.05, 0.1, 0.15, 0.2], yticks: [0.06, 0.08, 0.1, 0.12], fx: t => V.pct(t, 0), fy: t => V.pct(t, 0), xlabel: 'portfolio risk σp', ylabel: 'expected return' });
        const curveFor = r => { const p = []; for (let i = 0; i <= 50; i++) { const ww = i / 50; p.push([c.X(sigmaP(ww, r)), c.Y(ww * PORT.eA + (1 - ww) * PORT.eB)]); } return p; };
        V.path(svg, curveFor(1), '#94a3b8', 1.6, { 'stroke-dasharray': '6 5' });
        V.path(svg, curveFor(-1), '#94a3b8', 1.6, { 'stroke-dasharray': '6 5' });
        V.path(svg, curveFor(rho), V.C.indigo, 2.8);
        V.text(svg, c.X(0.155), c.Y(0.098) - 14, 'ρ = +1', { size: 12, color: '#64748b' });
        V.text(svg, c.X(0.012), c.Y(0.08), 'ρ = −1', { size: 12, color: '#64748b', anchor: 'start' });
        V.dot(svg, c.X(PORT.sA), c.Y(PORT.eA), V.C.rose, 5); V.text(svg, c.X(PORT.sA) + 8, c.Y(PORT.eA), 'A', { size: 14, weight: 700, anchor: 'start', color: V.C.rose });
        V.dot(svg, c.X(PORT.sB), c.Y(PORT.eB), V.C.sky, 5); V.text(svg, c.X(PORT.sB) + 8, c.Y(PORT.eB), 'B', { size: 14, weight: 700, anchor: 'start', color: V.C.sky });
        const sp = sigmaP(w, rho), er = w * PORT.eA + (1 - w) * PORT.eB, avg = w * PORT.sA + (1 - w) * PORT.sB;
        V.dot(svg, c.X(sp), c.Y(er), V.C.amber, 7, V.C.amberS);
        const den = PORT.sA ** 2 + PORT.sB ** 2 - 2 * rho * PORT.sA * PORT.sB, wMin = den > 1e-12 ? Math.min(1, Math.max(0, (PORT.sB ** 2 - rho * PORT.sA * PORT.sB) / den)) : 0.5;
        read.innerHTML = `A: E(R) = 12%, σ = 20%. B: E(R) = 6%, σ = 10%. With ${V.pct(w, 0)} in A and ρ = ${rho.toFixed(2)}: E(R<sub>p</sub>) = <b>${V.pct(er)}</b> (always the weighted average) but σ<sub>p</sub> = <b>${V.pct(sp)}</b>, versus the ${V.pct(avg)} you would get by averaging the σs. ` +
            `The diversification benefit is <b>${V.pct(avg - sp)}</b>; it is zero only when ρ = +1. Lowest-risk mix at this ρ: about ${V.pct(wMin, 0)} in A (σ<sub>p</sub> = ${V.pct(sigmaP(wMin, rho))}).`;
    }
    draw();
};

ML_VIS.l5_sml = function (root) {
    let rf = 0.06, rm = 0.10, beta = 1.25, er = 0.12;
    const svg = V.svg(560, 310), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' },
        V.slider('risk-free rate', 0, 10, 0.5, rf * 100, v => { rf = v / 100; draw(); }, v => v + '%'),
        V.slider('expected market return', 2, 18, 0.5, rm * 100, v => { rm = v / 100; draw(); }, v => v + '%'),
        V.slider('beta β', -1, 2.5, 0.05, beta, v => { beta = v; draw(); }, v => v.toFixed(2)),
        V.slider('your expected return', -5, 25, 0.5, er * 100, v => { er = v / 100; draw(); }, v => v + '%')), svg, read);
    function draw() {
        V.clear(svg);
        const c = V.chart(svg, { x0: 70, x1: 520, y0: 260, y1: 30, X: [-1, 2.5], Y: [-0.05, 0.25], xticks: [-1, 0, 0.5, 1, 1.5, 2, 2.5], yticks: [0, 0.05, 0.1, 0.15, 0.2, 0.25], fy: t => V.pct(t, 0), xlabel: 'beta β', ylabel: 'return' });
        const req = b => rf + b * (rm - rf);
        svg.append(V.s('line', { x1: c.X(0), x2: c.X(0), y1: c.Y(-0.05), y2: c.Y(0.25), stroke: '#e2e8f0' }));
        V.path(svg, [[c.X(-1), c.Y(req(-1))], [c.X(2.5), c.Y(req(2.5))]], V.C.green, 2.8);
        V.text(svg, c.X(2.45), c.Y(req(2.5)) - 14, 'SML', { size: 14, weight: 700, color: V.C.green, anchor: 'end' });
        V.dot(svg, c.X(0), c.Y(rf), V.C.slate, 5); V.text(svg, c.X(0) + 8, c.Y(rf) + 16, 'Rf', { size: 13, anchor: 'start', color: '#475569' });
        V.dot(svg, c.X(1), c.Y(rm), V.C.indigo, 5); V.text(svg, c.X(1) + 8, c.Y(rm) + 16, 'market', { size: 13, anchor: 'start', color: V.C.indigo });
        const R = req(beta), alpha = er - R;
        svg.append(V.s('line', { x1: c.X(beta), x2: c.X(beta), y1: c.Y(R), y2: c.Y(er), stroke: alpha >= 0 ? V.C.green : V.C.red, 'stroke-width': 2, 'stroke-dasharray': '4 3' }));
        V.dot(svg, c.X(beta), c.Y(R), V.C.green, 5, V.C.greenS);
        V.dot(svg, c.X(beta), c.Y(er), V.C.amber, 7, V.C.amberS);
        const verdict = Math.abs(alpha) < 0.0005 ? '<span class="vis-verdict even">on the SML</span> fairly priced' : alpha > 0 ? '<span class="vis-verdict good">above the SML</span> potentially undervalued' : '<span class="vis-verdict bad">below the SML</span> potentially overvalued';
        read.innerHTML = `Required return = R<sub>f</sub> + β(E(R<sub>m</sub>) − R<sub>f</sub>) = ${V.pct(rf, 1)} + ${beta.toFixed(2)} × ${V.pct(rm - rf, 1)} = <b>${V.pct(R)}</b>. Your estimate ${V.pct(er, 1)} gives expected alpha <b>${(alpha >= 0 ? '+' : '') + V.pct(alpha)}</b>: ${verdict}. ` +
            `${beta < 0 ? 'A negative beta moves against the market, so CAPM asks for <b>less</b> than the risk-free rate: the hedge itself is valuable. ' : ''}Alpha is only as good as the expected-return estimate behind it.`;
    }
    draw();
};

ML_VIS.l5_sigma3d = async function (root) {
    let rho = -1;
    const read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' }, V.slider('highlight correlation ρ', -1, 1, 0.1, rho, v => { rho = v; slice(); }, v => (v > 0 ? '+' : '') + v.toFixed(1))), read);
    const S = await V.scene3d(root, { radius: 6.2, phi: 1.05, theta: 0.65, target: [0, 0.5, 0], label: 'Portfolio standard deviation for every weight and correlation' });
    if (!S) return;
    const { THREE, scene } = S, N = 30, sz = 3, k = 0.12;
    // x = weight in A (0..1), z = correlation (-1..1), y = sigma_p (in % × k)
    const g = new THREE.PlaneGeometry(sz, sz, N, N); g.rotateX(-Math.PI / 2);
    const p = g.attributes.position, colors = [];
    for (let i = 0; i < p.count; i++) {
        const w = p.getX(i) / sz + 0.5, r = p.getZ(i) / sz * 2, s = sigmaP(w, Math.max(-1, Math.min(1, r))) * 100;
        p.setY(i, s * k); const t = s / 20; colors.push(0.31 + 0.6 * t, 0.27 + 0.2 * (1 - t), 0.9 - 0.5 * t);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); g.computeVertexNormals();
    scene.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })));
    scene.add(new THREE.LineSegments(new THREE.WireframeGeometry(g), new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.12 })));
    const o = -sz / 2;
    scene.add(V.line3d(THREE, [[o, 0, o], [-o, 0, o]], 0x64748b), V.line3d(THREE, [[o, 0, o], [o, 0, -o]], 0x64748b), V.line3d(THREE, [[o, 0, o], [o, 2.6, o]], 0x64748b));
    [['weight in A →', [0.3, 0, o - 0.4]], ['ρ = −1', [o - 0.45, 0, o]], ['ρ = +1', [o - 0.45, 0, -o]], ['σp', [o, 2.85, o]]].forEach(([t, pos]) => { const s = V.label3d(THREE, t, '#475569', 0.26); s.position.set(...pos); scene.add(s); });
    const zeroPt = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), new THREE.MeshLambertMaterial({ color: 0xd97706 }));
    zeroPt.position.set((1 / 3 - 0.5) * sz, 0, o); scene.add(zeroPt);
    const zl = V.label3d(THREE, 'σp = 0 at w = 1/3, ρ = −1', '#b45309', 0.24); zl.position.set((1 / 3 - 0.5) * sz + 0.9, 0.7, o + 0.5); scene.add(zl);
    let line = null;
    function slice() {
        if (line) scene.remove(line);
        const pts = []; for (let i = 0; i <= 40; i++) { const w = i / 40; pts.push([(w - 0.5) * sz, sigmaP(w, rho) * 100 * k + 0.02, rho / 2 * sz]); }
        line = V.line3d(THREE, pts, 0xe11d48); scene.add(line); S.dirty();
        const den = PORT.sA ** 2 + PORT.sB ** 2 - 2 * rho * PORT.sA * PORT.sB, wMin = Math.min(1, Math.max(0, (PORT.sB ** 2 - rho * PORT.sA * PORT.sB) / den));
        read.innerHTML = `Height = portfolio σ for A (σ = 20%) and B (σ = 10%). The red slice is ρ = ${rho.toFixed(1)}: its lowest point is about <b>${V.pct(wMin, 0)}</b> in A, σ<sub>p</sub> = <b>${V.pct(sigmaP(wMin, rho))}</b>. Move ρ down and the whole valley sinks; only at ρ = −1 with w = 1/3 does risk reach zero.`;
    }
    slice();
};
