// Chapter 4 and Appendix 4A visuals
ML_VIS.l4_compound = function (root) {
    let pv = 1000, rate = 0.08, years = 10, m = 1;
    const svg = V.svg(560, 300), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' },
        V.slider('deposit today', 100, 10000, 100, pv, v => { pv = v; draw(); }, v => 'RM' + V.fmt(v, 0)),
        V.slider('stated annual rate', 1, 15, 0.5, rate * 100, v => { rate = v / 100; draw(); }, v => v + '%'),
        V.slider('years', 1, 40, 1, years, v => { years = v; draw(); })),
        V.seg([[1, 'annually'], [2, 'semiannually'], [4, 'quarterly'], [12, 'monthly'], [365, 'daily']], m, v => { m = v; draw(); }), svg, read);
    function draw() {
        V.clear(svg);
        const fvC = t => pv * (1 + rate / m) ** (m * t), fvS = t => pv * (1 + rate * t), top = fvC(years) * 1.08;
        const nice = Math.pow(10, Math.floor(Math.log10(top))), yMax = Math.ceil(top / nice) * nice;
        const c = V.chart(svg, { x0: 80, x1: 520, y0: 250, y1: 30, X: [0, years], Y: [0, yMax], xticks: [0, Math.round(years / 2), years], yticks: [0, yMax / 2, yMax], fy: t => 'RM' + V.fmt(t, 0), xlabel: 'years', ylabel: 'account value' });
        const comp = [], simp = [];
        for (let i = 0; i <= 80; i++) { const t = years * i / 80; comp.push([c.X(t), c.Y(fvC(t))]); simp.push([c.X(t), c.Y(fvS(t))]); }
        const area = V.s('path', { d: 'M' + comp.map(p => p.join(' ')).join(' L') + ' L' + simp.slice().reverse().map(p => p.join(' ')).join(' L') + ' Z', fill: V.C.amberS, opacity: 0.8 });
        svg.append(area);
        V.path(svg, simp, V.C.slate, 2.2, { 'stroke-dasharray': '6 5' });
        V.path(svg, comp, V.C.green, 2.8);
        V.text(svg, c.X(years) - 4, c.Y(fvC(years)) - 12, 'compound ' + V.rm(fvC(years), 0), { size: 13, weight: 700, anchor: 'end', color: V.C.green });
        V.text(svg, c.X(years) - 4, c.Y(fvS(years)) + 16, 'simple ' + V.rm(fvS(years), 0), { size: 13, weight: 700, anchor: 'end', color: V.C.slate });
        const ear = (1 + rate / m) ** m - 1;
        read.innerHTML = `FV = PV(1 + r/m)<sup>mt</sup> = ${V.rm(pv, 0)} × (1 + ${V.pct(rate, 1)}/${m})<sup>${m}×${years}</sup> = <b>${V.rm(fvC(years))}</b>. Simple interest would give ${V.rm(fvS(years))}; the shaded gap of <b>${V.rm(fvC(years) - fvS(years))}</b> is interest earned on interest. ` +
            `True (effective) annual rate = (1 + r/m)<sup>m</sup> − 1 = <b>${V.pct(ear, 3)}</b>${m > 1 ? ` versus the stated ${V.pct(rate, 1)}` : ''}.`;
    }
    draw();
};

ML_VIS.l4_annuity = function (root) {
    let pmt = 1000, rate = 0.08, n = 8, due = false;
    const svg = V.svg(560, 300), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' },
        V.slider('payment each year', 100, 2000, 50, pmt, v => { pmt = v; draw(); }, v => 'RM' + V.fmt(v, 0)),
        V.slider('rate', 0, 15, 0.5, rate * 100, v => { rate = v / 100; draw(); }, v => v + '%'),
        V.slider('years', 2, 15, 1, n, v => { n = v; draw(); })),
        V.seg([[false, 'ordinary annuity (end of year)'], [true, 'annuity due (start of year)']], due, v => { due = v; draw(); }), svg, read);
    function draw() {
        V.clear(svg);
        const grow = k => (1 + rate) ** (due ? n - k + 1 : n - k);      // payment k (1..n) grows until the end of year n
        const parts = Array.from({ length: n }, (_, i) => pmt * grow(i + 1)), fv = parts.reduce((a, b) => a + b, 0);
        const pv = fv / (1 + rate) ** n, max = Math.max(...parts), r = V.rng(7);
        const x0 = 60, w = 460 / n, base = 240;
        V.rline(svg, 40, base, 540, base, '#94a3b8', 1.4, r);
        parts.forEach((v, i) => {
            const hp = pmt / max * 180, hv = v / max * 180, x = x0 + i * w + 4;
            V.rrect(svg, x, base - hv, w - 8, hv - hp, V.C.amber, V.C.amberS, r);
            V.rrect(svg, x, base - hp, w - 8, hp, V.C.sky, V.C.skyS, r);
            V.text(svg, x + (w - 8) / 2, base + 16, (due ? 't' + i : 't' + (i + 1)), { size: 12, color: '#64748b' });
            if (w > 40) V.text(svg, x + (w - 8) / 2, base - hv - 10, V.fmt(v, 0), { size: 12, color: V.C.amber });
        });
        V.text(svg, 300, 22, 'blue = the deposit · amber = the interest it earns by the end of year ' + n, { size: 13, color: '#475569' });
        const factor = rate ? ((1 + rate) ** n - 1) / rate : n;
        read.innerHTML = `${due ? 'Annuity due: each payment arrives at the <b>start</b> of the year, so every payment compounds one extra year. ' : 'Ordinary annuity: payments at the <b>end</b> of each year; the last one earns nothing. '}` +
            `FV = PMT × [(1 + r)<sup>n</sup> − 1] / r${due ? ' × (1 + r)' : ''} = ${V.rm(pmt, 0)} × ${V.fmt(factor * (due ? 1 + rate : 1), 4)} = <b>${V.rm(fv)}</b> from ${V.rm(pmt * n, 0)} deposited. ` +
            `Its present value today is <b>${V.rm(pv)}</b>. Earlier payments grow most: they have the most years to compound.`;
    }
    draw();
};

ML_VIS.l4_risk = function (root) {
    const data = { A: [8, 9, 10, 11, 12], B: [-30, 0, 10, 30, 40] };
    const svg = V.svg(560, 230), read = V.h('p', { class: 'vis-readout' });
    const row = k => V.h('div', { class: 'vis-returns' }, V.h('b', {}, 'Investment ' + k), ...data[k].map((v, i) => V.numIn(v, x => { data[k][i] = x; draw(); }, { 'aria-label': `Investment ${k} return, year ${i + 1}` })));
    root.append(V.h('p', { class: 'vis-note' }, 'Five annual returns (%) for each investment. Edit any of them.'), row('A'), row('B'), svg, read);
    function draw() {
        V.clear(svg);
        const st = k => { const a = data[k], m = V.mean(a), s = V.sstd(a); return { m, s, cv: m ? s / m : NaN }; };
        const A = st('A'), B = st('B'), all = [...data.A, ...data.B], lo = Math.min(-10, ...all, A.m - A.s, B.m - B.s), hi = Math.max(20, ...all, A.m + A.s, B.m + B.s);
        const X = v => 50 + (v - lo) / (hi - lo) * 470, r = V.rng(2);
        [['A', A, 70, V.C.sky, V.C.skyS], ['B', B, 160, V.C.rose, V.C.roseS]].forEach(([k, S, y, c, f]) => {
            V.rrect(svg, X(S.m - S.s), y - 22, Math.max(2, X(S.m + S.s) - X(S.m - S.s)), 44, c, f, r);
            V.rline(svg, X(S.m), y - 30, X(S.m), y + 30, c, 2.4, r);
            data[k].forEach(v => V.dot(svg, X(v), y, c, 5, '#fff'));
            V.text(svg, 30, y, k, { size: 18, weight: 700, color: c });
        });
        [lo, 0, hi].forEach(t => V.text(svg, X(t), 214, V.fmt(t, 0) + '%', { size: 12, color: '#64748b' }));
        const cv = S => Number.isFinite(S.cv) ? V.fmt(S.cv, 2) : 'undefined (mean 0)';
        read.innerHTML = `Shaded band = mean ± 1 standard deviation (sample, n − 1). ` +
            `<b>A</b>: mean ${V.fmt(A.m, 2)}%, σ = ${V.fmt(A.s, 2)}%, CV = ${cv(A)}. <b>B</b>: mean ${V.fmt(B.m, 2)}%, σ = ${V.fmt(B.s, 2)}%, CV = ${cv(B)}. ` +
            `σ measures <b>absolute</b> dispersion; CV = σ / mean measures risk <b>per unit of return</b>, so it is the fairer comparison when the averages differ.`;
    }
    draw();
};
