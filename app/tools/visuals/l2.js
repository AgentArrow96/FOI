// Chapter 2 visuals
ML_VIS.l2_margin = function (root) {
    const shares = 100, buy = 50;
    let initial = 0.5, maint = 0.3, price = 50;
    const svg = V.svg(560, 300), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' },
        V.slider('initial margin', 30, 100, 5, initial * 100, v => { initial = v / 100; draw(); }, v => v + '%'),
        V.slider('maintenance margin', 20, 50, 5, maint * 100, v => { maint = v / 100; draw(); }, v => v + '%'),
        V.slider('share price now', 10, 100, 1, price, v => { price = v; draw(); }, v => 'RM' + v)), svg, read);
    function draw() {
        V.clear(svg);
        const V0 = shares * buy, E0 = V0 * initial, D = V0 - E0, Vn = shares * price, E = Vn - D, m = E / Vn;
        const roe = (Vn - V0) / E0, cash = (Vn - V0) / V0, crit = D / (shares * (1 - maint)), call = m < maint;
        const r = V.rng(9), base = 250, k = 0.022;
        const col = (x, title, v, d) => {
            const hd = d * k, he = Math.max(0, v - d) * k;
            if (hd) V.rrect(svg, x, base - hd, 150, hd, '#64748b', '#e2e8f0', r);
            if (hd > 22) V.text(svg, x + 75, base - hd / 2, 'loan ' + V.rm(d, 0), { size: 13, weight: 700, color: '#334155' });
            if (he > 0) V.rrect(svg, x, base - hd - he, 150, he, V.C.green, V.C.greenS, r);
            if (he > 18) V.text(svg, x + 75, base - hd - he / 2, 'equity ' + V.rm(v - d, 0), { size: 13, weight: 700, color: V.C.green });
            V.text(svg, x + 75, base + 18, title, { size: 14, weight: 700 });
        };
        col(60, 'at purchase', V0, D);
        col(300, 'now', Vn, D);
        const lineY = base - (D / (1 - maint)) * k;
        V.rline(svg, 280, lineY, 470, lineY, V.C.red, 1.6, r, { 'stroke-dasharray': '6 5' });
        V.text(svg, 476, lineY, 'margin-call value', { size: 12, anchor: 'start', color: V.C.red });
        V.text(svg, 476, lineY + 15, V.rm(D / (1 - maint), 0), { size: 12, anchor: 'start', color: V.C.red });
        V.rline(svg, 30, base, 540, base, '#94a3b8', 1.2, r);
        V.text(svg, 280, 286, `margin now = (V − D) / V = ${V.pct(m, 1)}`, { size: 14, weight: 700, color: call ? V.C.red : V.C.green });
        read.innerHTML = `Buy 100 shares at RM50 with ${V.pct(initial, 0)} initial margin: your equity is ${V.rm(E0, 0)} and the loan is ${V.rm(D, 0)}. At RM${price} the stock has moved <b>${V.pct(cash, 1)}</b>, but your return on equity is <b>${V.pct(roe, 1)}</b> (before interest). ` +
            (call ? `<span class="vis-verdict bad">margin call</span> margin ${V.pct(m, 1)} is below the ${V.pct(maint, 0)} maintenance requirement.` : `<span class="vis-verdict good">no margin call</span> the call price is about <b>RM${V.fmt(crit, 2)}</b> = D / (shares × (1 − ${V.pct(maint, 0)})).`) +
            (E <= 0 ? ' Equity is wiped out: the loss now exceeds your own money.' : '');
    }
    draw();
};

ML_VIS.l2_short = function (root) {
    const shares = 100, sold = 50;
    let price = 50;
    const svg = V.svg(560, 300), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' }, V.slider('share price now', 0, 150, 1, price, v => { price = v; draw(); }, v => 'RM' + v)), svg, read);
    function draw() {
        V.clear(svg);
        const c = V.chart(svg, { x0: 80, x1: 520, y0: 250, y1: 30, X: [0, 150], Y: [-10000, 10000], xticks: [0, 25, 50, 75, 100, 125, 150], yticks: [-10000, -5000, 0, 5000, 10000], fx: t => 'RM' + t, fy: t => (t < 0 ? '−' : '') + 'RM' + V.fmt(Math.abs(t), 0), xlabel: 'share price', ylabel: 'profit on 100 shares' });
        V.path(svg, [[c.X(0), c.Y(-5000)], [c.X(150), c.Y(10000)]], V.C.sky, 2.4);
        V.path(svg, [[c.X(0), c.Y(5000)], [c.X(150), c.Y(-10000)]], V.C.rose, 2.8);
        V.text(svg, c.X(140), c.Y(8800) - 12, 'long', { size: 14, weight: 700, color: V.C.sky, anchor: 'end' });
        V.text(svg, c.X(138), c.Y(-7200), 'short', { size: 14, weight: 700, color: V.C.rose, anchor: 'end' });
        svg.append(V.s('line', { x1: c.X(price), x2: c.X(price), y1: c.Y(10000), y2: c.Y(-10000), stroke: '#94a3b8', 'stroke-dasharray': '4 4' }));
        const sp = shares * (sold - price), lp = shares * (price - sold);
        V.dot(svg, c.X(price), c.Y(sp), V.C.rose); V.dot(svg, c.X(price), c.Y(lp), V.C.sky);
        const equity = 7500 - shares * price, m = price ? equity / (shares * price) : Infinity;
        read.innerHTML = `Short 100 borrowed shares at RM50 (proceeds RM5,000, plus a RM2,500 margin deposit). At RM${price}: short profit <b>${V.rm(sp, 0)}</b>, long profit ${V.rm(lp, 0)}. ` +
            `The short's best case is <b>RM5,000</b> (price falls to 0); there is no worst case, because the price can keep rising. ` +
            `Short-account margin = (RM7,500 − cost to buy back) / cost to buy back = <b>${price ? V.pct(m, 1) : '∞'}</b>${price && m < 0.3 ? ' <span class="vis-verdict bad">below 30%: margin call</span>' : ''}.`;
    }
    draw();
};
