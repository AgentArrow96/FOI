// Chapter 1 visuals
ML_VIS.l1_bond_rate = function (root) {
    const coupon = 0.05, face = 1000, years = 10;
    let rate = 0.08;
    const price = y => { let p = 0; for (let t = 1; t <= years; t++) p += coupon * face / (1 + y) ** t; return p + face / (1 + y) ** years; };
    const svg = V.svg(560, 290), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' }, V.slider('market interest rate', 1, 12, 0.25, rate * 100, v => { rate = v / 100; draw(); }, v => v.toFixed(2) + '%')), svg, read);
    function draw() {
        V.clear(svg);
        const c = V.chart(svg, { x0: 70, x1: 520, y0: 240, y1: 30, X: [1, 12], Y: [600, 1500], xticks: [2, 4, 6, 8, 10, 12], yticks: [600, 800, 1000, 1200, 1400], fx: t => t + '%', fy: t => 'RM' + t, xlabel: 'market rate', ylabel: 'price of the existing 5% bond' });
        const pts = []; for (let r = 1; r <= 12; r += 0.25) pts.push([c.X(r), c.Y(price(r / 100))]);
        V.path(svg, pts, V.C.indigo, 2.6);
        svg.append(V.s('line', { x1: c.X(1), x2: c.X(12), y1: c.Y(1000), y2: c.Y(1000), stroke: V.C.amber, 'stroke-dasharray': '6 5', 'stroke-width': 1.4 }));
        V.text(svg, c.X(12), c.Y(1000) - 10, 'par RM1,000', { size: 12, anchor: 'end', color: V.C.amber });
        const p = price(rate);
        V.dot(svg, c.X(rate * 100), c.Y(p), V.C.rose, 7);
        V.text(svg, c.X(rate * 100) + 10, c.Y(p) - 16, V.rm(p), { size: 14, anchor: 'start', weight: 700, color: V.C.rose });
        const rel = Math.abs(rate - coupon) < 1e-9 ? 'at <b>par</b>: the market rate equals the coupon rate' : rate > coupon ? `at a <b>discount</b>: new bonds pay ${V.pct(rate)}, so nobody pays full price for a 5% coupon` : `at a <b>premium</b>: new bonds pay only ${V.pct(rate)}, so the old 5% coupon is worth more`;
        read.innerHTML = `A 10-year bond with a fixed 5% coupon (RM50 a year) trades ${rel}. Price = <b>${V.rm(p)}</b>. The cash flows never change; only the rate used to discount them does: <b>rates ↑ ⇒ bond prices ↓</b>.`;
    }
    draw();
};

ML_VIS.l1_real_return = function (root) {
    let nominal = 0.08, tax = 0.25, infl = 0.04;
    const svg = V.svg(560, 250), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' },
        V.slider('nominal return', 0, 20, 0.5, nominal * 100, v => { nominal = v / 100; draw(); }, v => v + '%'),
        V.slider('tax on returns', 0, 40, 1, tax * 100, v => { tax = v / 100; draw(); }, v => v + '%'),
        V.slider('inflation', 0, 12, 0.5, infl * 100, v => { infl = v / 100; draw(); }, v => v + '%')), svg, read);
    function draw() {
        V.clear(svg);
        const after = nominal * (1 - tax), real = (1 + after) / (1 + infl) - 1;
        const bars = [['nominal', nominal, V.C.sky, V.C.skyS], ['after tax', after, V.C.indigo, V.C.indigoS], ['real (after tax\nand inflation)', real, real >= 0 ? V.C.green : V.C.red, real >= 0 ? V.C.greenS : '#fee2e2']];
        const zero = 150, k = 520, r = V.rng(5);
        V.rline(svg, 40, zero, 540, zero, '#94a3b8', 1.4, r);
        bars.forEach(([name, v, col, fill], i) => {
            const x = 70 + i * 165, h = v * k;
            V.rrect(svg, x, h >= 0 ? zero - h : zero, 110, Math.max(Math.abs(h), 2), col, fill, r);
            V.text(svg, x + 55, h >= 0 ? zero - h - 14 : zero - h + 16, V.pct(v), { size: 15, weight: 700, color: col });
            name.split('\n').forEach((t, j) => V.text(svg, x + 55, 222 + j * 16, t, { size: 13, color: '#475569' }));
        });
        const keep = 10000 * after, lost = 10000 * (1 + after) / (1 + infl);
        read.innerHTML = `On RM10,000 the account grows by <b>${V.rm(keep)}</b> after tax, but in today's purchasing power it is worth <b>${V.rm(lost)}</b>. Real return ≈ after-tax return − inflation = <b>${V.pct(real)}</b>. ${real < 0 ? 'The balance rises while purchasing power <b>falls</b>: "safe" in ringgit is not safe in real terms.' : 'What matters is what the investor keeps, in real terms.'}`;
    }
    draw();
};
