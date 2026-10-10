// Chapter 3 visuals
ML_VIS.l3_index = function (root) {
    // Three hypothetical stocks: a giant, a mid-size firm and a small high-priced firm
    const stocks = [
        { name: 'MegaBank', price: 20, shares: 5000, col: V.C.sky, colS: V.C.skyS },
        { name: 'MidTech', price: 60, shares: 400, col: V.C.indigo, colS: V.C.indigoS },
        { name: 'TinyCo', price: 150, shares: 40, col: V.C.amber, colS: V.C.amberS },
    ];
    const chg = [0, 0, 0];
    const svg = V.svg(560, 250), read = V.h('p', { class: 'vis-readout' }), table = V.h('div', { class: 'vis-table-wrap' });
    root.append(V.h('div', { class: 'vis-row' }, ...stocks.map((s, i) => V.slider(s.name + ' price change', -50, 50, 1, 0, v => { chg[i] = v / 100; draw(); }, v => (v > 0 ? '+' : '') + v + '%'))), table, svg, read);
    function draw() {
        const p0 = stocks.map(s => s.price), p1 = stocks.map((s, i) => s.price * (1 + chg[i]));
        const cap0 = stocks.map((s, i) => p0[i] * s.shares), cap1 = stocks.map((s, i) => p1[i] * s.shares);
        const sum = a => a.reduce((x, y) => x + y, 0);
        const priceW = sum(p1) / sum(p0) - 1, valueW = sum(cap1) / sum(cap0) - 1, equalW = V.mean(chg);
        table.innerHTML = `<table class="vis-table"><tr><th>stock</th><th>price</th><th>shares (m)</th><th>market value (RMm)</th><th>price weight</th><th>value weight</th></tr>${stocks.map((s, i) => `<tr><td>${s.name}</td><td>RM${V.fmt(p1[i], 2)}</td><td>${V.fmt(s.shares, 0)}</td><td>${V.fmt(cap1[i], 0)}</td><td>${V.pct(p0[i] / sum(p0), 0)}</td><td>${V.pct(cap0[i] / sum(cap0), 0)}</td></tr>`).join('')}</table>`;
        V.clear(svg);
        const r = V.rng(4), zero = 125, k = 220;
        V.rline(svg, 30, zero, 540, zero, '#94a3b8', 1.4, r);
        [['price-weighted\n(like the DJIA)', priceW, V.C.rose, V.C.roseS], ['value-weighted\n(like the S&P 500)', valueW, V.C.indigo, V.C.indigoS], ['equal-weighted\n(like Value Line)', equalW, V.C.green, V.C.greenS]].forEach(([t, v, c, f], i) => {
            const x = 70 + i * 165, h = v * k;
            V.rrect(svg, x, h >= 0 ? zero - h : zero, 110, Math.max(2, Math.abs(h)), c, f, r);
            V.text(svg, x + 55, h >= 0 ? zero - h - 12 : zero - h + 14, (v > 0 ? '+' : '') + V.pct(v, 1), { size: 15, weight: 700, color: c });
            t.split('\n').forEach((s, j) => V.text(svg, x + 55, 212 + j * 16, s, { size: 13, color: '#475569' }));
        });
        const big = [Math.abs(priceW), Math.abs(valueW), Math.abs(equalW)];
        read.innerHTML = `Same three stocks, same price moves, three different "market" returns. A price-weighted average is dominated by the <b>highest-priced</b> stock (TinyCo), a value-weighted index by the <b>largest company</b> (MegaBank), and an equal-weighted index treats every stock alike. ${Math.max(...big) - Math.min(...big) > 0.02 ? 'Here the indexes disagree by more than 2 percentage points, so benchmark choice changes the verdict on a portfolio.' : 'Move one stock at a time to see which index it drives.'}`;
    }
    draw();
};
