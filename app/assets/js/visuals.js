// Visual helpers
const ML_VIS = {};
const V = {
    FONT: "Kalam, 'Segoe Print', 'Comic Sans MS', cursive",
    C: {
        sky: '#0284c7', skyS: '#e0f2fe', lime: '#65a30d', limeS: '#ecfccb', indigo: '#4f46e5', indigoS: '#e0e7ff',
        rose: '#e11d48', roseS: '#ffe4e6', amber: '#d97706', amberS: '#fef3c7', green: '#059669', greenS: '#d1fae5',
        violet: '#7c3aed', violetS: '#ede9fe', slate: '#475569', slateS: '#f1f5f9', ink: '#1e293b', red: '#dc2626'
    },
    rng(seed) {
        let a = seed >>> 0;
        return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    },
    gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
    h(tag, attrs, ...kids) {
        const e = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs || {})) {
            if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
            else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
            else if (k === 'html') e.innerHTML = v;
            else e.setAttribute(k, v);
        }
        for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(String(c)));
        return e;
    },
    s(tag, attrs, ...kids) {
        const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs || {})) {
            if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
        }
        for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(String(c)));
        return e;
    },
    svg(w, h, cls) { return V.s('svg', { viewBox: `0 0 ${w} ${h}`, class: 'vis-svg ' + (cls || '') }); },
    // Hand-drawn line
    rough(x1, y1, x2, y2, r, amt = 1) {
        r = r || Math.random;
        const L = Math.hypot(x2 - x1, y2 - y1) || 1, off = Math.min(amt * 1.6, Math.max(0.5, L * 0.012 * amt));
        const j = () => (r() * 2 - 1) * off, dx = x2 - x1, dy = y2 - y1, px = -dy / L, py = dx / L;
        let d = '';
        for (let k = 0; k < 2; k++) {
            const bow = j() * 1.2;
            d += `M${x1 + j()} ${y1 + j()} C${x1 + dx * .35 + px * bow + j()} ${y1 + dy * .35 + py * bow + j()} ${x1 + dx * .7 + px * bow + j()} ${y1 + dy * .7 + py * bow + j()} ${x2 + j()} ${y2 + j()} `;
        }
        return d;
    },
    rline(g, x1, y1, x2, y2, color, width = 1.8, r, extra = {}) {
        const p = V.s('path', Object.assign({ d: extra['stroke-dasharray'] ? `M${x1} ${y1} L${x2} ${y2}` : V.rough(x1, y1, x2, y2, r), fill: 'none', stroke: color || V.C.ink, 'stroke-width': width, 'stroke-linecap': 'round' }, extra));
        g.append(p); return p;
    },
    rrect(g, x, y, w, h, color, fill, r, width = 1.6) {
        if (fill) g.append(V.s('rect', { x: x + 1, y: y + 1, width: Math.max(0, w - 2), height: Math.max(0, h - 2), rx: 4, fill }));
        V.rline(g, x, y, x + w, y, color, width, r); V.rline(g, x + w, y, x + w, y + h, color, width, r);
        V.rline(g, x + w, y + h, x, y + h, color, width, r); V.rline(g, x, y + h, x, y, color, width, r);
    },
    text(g, x, y, str, o = {}) {
        const t = V.s('text', { x, y, 'font-family': V.FONT, 'font-size': o.size || 15, fill: o.color || V.C.ink, 'text-anchor': o.anchor || 'middle', 'dominant-baseline': 'middle', 'font-weight': o.weight || 400 });
        t.textContent = str; g.append(t); return t;
    },
    arrow(g, x1, y1, x2, y2, color, width = 1.8, r) {
        V.rline(g, x1, y1, x2, y2, color, width, r);
        const a = Math.atan2(y2 - y1, x2 - x1);
        for (const s of [-1, 1]) { const b = a + Math.PI - s * 0.45; V.rline(g, x2, y2, x2 + 10 * Math.cos(b), y2 + 10 * Math.sin(b), color, width, r, {}); }
    },
    slider(label, min, max, step, value, onInput, fmt) {
        const out = V.h('output', {}, fmt ? fmt(value) : value);
        const inp = V.h('input', { type: 'range', min, max, step, value });
        inp.addEventListener('input', () => { const v = Number(inp.value); out.textContent = fmt ? fmt(v) : v; onInput(v); });
        const w = V.h('label', { class: 'vis-slider' }, V.h('span', {}, label), inp, out);
        w.input = inp; return w;
    },
    seg(options, value, onChange) {
        const w = V.h('div', { class: 'vis-seg', role: 'group' });
        const btns = options.map(([v, label]) => {
            const b = V.h('button', { type: 'button', class: v === value ? 'on' : '' }, label);
            b.addEventListener('click', () => { btns.forEach(x => x.classList.remove('on')); b.classList.add('on'); onChange(v); });
            return b;
        });
        w.append(...btns); return w;
    },
    btn(label, onClick, cls) { return V.h('button', { type: 'button', class: 'vis-btn ' + (cls || ''), onclick: onClick }, label); },
    fmt(n, d = 2) { return Number.isFinite(n) ? Number(n.toFixed(d)).toLocaleString('en-US', { maximumFractionDigits: d }) : '-'; },
    clear(e) { while (e.firstChild) e.removeChild(e.firstChild); },
    median(a) { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; },
    mean(a) { return a.reduce((x, y) => x + y, 0) / a.length; },
    std(a) { const m = V.mean(a); return Math.sqrt(V.mean(a.map(x => (x - m) ** 2))); },
    // Sample standard deviation (n - 1), as used in the textbook
    sstd(a) { const m = V.mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); },
    pct(n, d = 2) { return V.fmt(n * 100, d) + '%'; },
    rm(n, d = 2) { return (n < 0 ? '-RM' : 'RM') + V.fmt(Math.abs(n), d); },
    // The same numbers written for KaTeX: thousands separators in braces, an escaped percent sign
    tn(n, d = 2) { return Number.isFinite(n) ? (n < 0 ? '-' : '') + V.fmt(Math.abs(n), d).replace(/,/g, '{,}') : '\\infty'; },
    tp(n, d = 2) { return V.tn(n * 100, d) + '\\%'; },
    trm(n, d = 2) { return (n < 0 ? '-' : '') + '\\text{RM}' + V.tn(Math.abs(n), d); },
    par(s) { return String(s).startsWith('-') ? '(' + s + ')' : s; },
    // Set HTML that contains $...$ maths and typeset it (readouts are rewritten on every slider move)
    math(el, html) { el.innerHTML = html; if (typeof renderMath === 'function') renderMath(el); },
    // Axes inside a plot box; returns scale functions X(v) and Y(v)
    chart(svg, o) {
        const { x0, x1, y0, y1 } = o, [xa, xb] = o.X, [ya, yb] = o.Y, r = V.rng(o.seed || 3);
        const X = v => x0 + (v - xa) / (xb - xa) * (x1 - x0), Y = v => y0 - (v - ya) / (yb - ya) * (y0 - y1);
        (o.yticks || []).forEach(t => { svg.append(V.s('line', { x1: x0, x2: x1, y1: Y(t), y2: Y(t), stroke: '#e2e8f0', 'stroke-width': 1 })); V.text(svg, x0 - 8, Y(t), o.fy ? o.fy(t) : t, { size: 12, anchor: 'end', color: '#64748b' }); });
        (o.xticks || []).forEach(t => V.text(svg, X(t), y0 + 16, o.fx ? o.fx(t) : t, { size: 12, color: '#64748b' }));
        V.arrow(svg, x0, y0, x1 + 8, y0, '#64748b', 1.4, r); V.arrow(svg, x0, y0, x0, y1 - 8, '#64748b', 1.4, r);
        if (o.xlabel) V.text(svg, x1 + 8, y0 + 32, o.xlabel, { size: 13, anchor: 'end', color: '#475569' });
        if (o.ylabel) V.text(svg, x0 + 6, y1 - 14, o.ylabel, { size: 13, anchor: 'start', color: '#475569' });
        return { X, Y };
    },
    path(g, pts, color, width = 2.4, extra = {}) {
        const p = V.s('path', Object.assign({ d: 'M' + pts.map(([x, y]) => x.toFixed(1) + ' ' + y.toFixed(1)).join(' L'), fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, extra));
        g.append(p); return p;
    },
    dot(g, x, y, color, r = 6, fill) { const c = V.s('circle', { cx: x, cy: y, r, fill: fill || '#fff', stroke: color, 'stroke-width': 2.4 }); g.append(c); return c; },
    numIn(value, onInput, attrs = {}) {
        const inp = V.h('input', Object.assign({ type: 'number', value, class: 'vis-input vis-num', step: 'any' }, attrs));
        inp.addEventListener('input', () => { const v = parseFloat(inp.value); if (Number.isFinite(v)) onInput(v); });
        return inp;
    },

    // 3D helpers
    _three: null,
    three() {
        if (window.THREE) return Promise.resolve(window.THREE);
        if (!V._three) V._three = new Promise((res, rej) => {
            const sc = document.createElement('script');
            sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            sc.onload = () => res(window.THREE); sc.onerror = rej; document.head.append(sc);
        });
        return V._three;
    },
    async scene3d(host, opt = {}) {
        let THREE;
        try { THREE = await V.three(); } catch (e) { host.append(V.h('p', { class: 'vis-note' }, '3D view needs an internet connection to load three.js.')); return null; }
        const canvas = V.h('canvas', { class: 'vis-canvas3d', 'aria-label': opt.label || '3D view' });
        host.append(canvas);
        let renderer;
        try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { canvas.remove(); host.append(V.h('p', { class: 'vis-note' }, 'WebGL is not available in this browser.')); return null; }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1.6, 0.1, 100);
        scene.add(new THREE.AmbientLight(0xffffff, 0.75));
        const dl = new THREE.DirectionalLight(0xffffff, 0.55); dl.position.set(3, 5, 4); scene.add(dl);
        const target = new THREE.Vector3(...(opt.target || [0, 0, 0]));
        let theta = opt.theta ?? 0.8, phi = opt.phi ?? 1.05, radius = opt.radius ?? 6, needs = true, visible = false, auto = opt.autoRotate ?? true;
        const frameFns = [];
        const place = () => { camera.position.set(target.x + radius * Math.sin(phi) * Math.cos(theta), target.y + radius * Math.cos(phi), target.z + radius * Math.sin(phi) * Math.sin(theta)); camera.lookAt(target); };
        const resize = () => { const w = host.clientWidth || 600, h = Math.round(w / (opt.aspect || 1.7)); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); needs = true; };
        let drag = null;
        canvas.addEventListener('pointerdown', e => { drag = [e.clientX, e.clientY]; auto = false; canvas.setPointerCapture(e.pointerId); });
        canvas.addEventListener('pointermove', e => { if (!drag) return; theta += (e.clientX - drag[0]) * 0.01; phi = Math.min(2.9, Math.max(0.2, phi - (e.clientY - drag[1]) * 0.01)); drag = [e.clientX, e.clientY]; needs = true; });
        canvas.addEventListener('pointerup', () => { drag = null; });
        const zoom = d => { radius = Math.min(18, Math.max(2.5, radius * d)); needs = true; };
        const bar = V.h('div', { class: 'vis-row vis-3dbar' }, V.btn('+ zoom', () => zoom(0.85)), V.btn('- zoom', () => zoom(1.18)), V.btn('⟳ auto-rotate', () => { auto = !auto; needs = true; }), V.h('span', { class: 'vis-note' }, 'Drag to rotate'));
        host.append(bar);
        new IntersectionObserver(es => es.forEach(x => { visible = x.isIntersecting; if (visible) { resize(); loop(); } })).observe(canvas);
        window.addEventListener('resize', resize);
        let last = 0;
        function loop(t = 0) {
            if (!visible) return;
            const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
            if (auto) { theta += dt * 0.25; needs = true; }
            frameFns.forEach(f => { if (f(dt)) needs = true; });
            if (needs) { place(); renderer.render(scene, camera); needs = false; }
            requestAnimationFrame(loop);
        }
        resize();
        return { THREE, scene, camera, renderer, dirty: () => { needs = true; }, onFrame: f => frameFns.push(f) };
    },
    label3d(THREE, text, color = '#1e293b', size = 0.35) {
        const c = document.createElement('canvas'), ctx = c.getContext('2d'), fs = 64;
        ctx.font = `700 ${fs}px Kalam, 'Segoe Print', cursive`;
        const w = Math.ceil(ctx.measureText(text).width) + 24; c.width = w; c.height = fs + 24;
        ctx.font = `700 ${fs}px Kalam, 'Segoe Print', cursive`; ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.fillText(text, 12, c.height / 2 + 4);
        const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
        sp.scale.set(size * w / c.height, size, 1); sp.renderOrder = 10; return sp;
    },
    line3d(THREE, pts, color, dashed) {
        const g = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p)));
        const m = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.12, gapSize: 0.08 }) : new THREE.LineBasicMaterial({ color });
        const l = new THREE.Line(g, m); if (dashed) l.computeLineDistances(); return l;
    },
    axes3d(THREE, scene, names, size = 2) {
        const col = 0x94a3b8;
        for (let i = 0; i < 3; i++) {
            const a = [0, 0, 0], b = [0, 0, 0]; a[i] = -size; b[i] = size;
            scene.add(V.line3d(THREE, [a, b], col));
            if (names[i]) { const s = V.label3d(THREE, names[i], '#475569', 0.28); s.position.set(b[0] * 1.15, b[1] * 1.15, b[2] * 1.15); scene.add(s); }
        }
    }
};

function initVisuals(root) {
    (root || document).querySelectorAll('.vis-widget:not([data-observed])').forEach(fig => {
        fig.setAttribute('data-observed', '1');
        const io = new IntersectionObserver(es => es.forEach(x => {
            if (!x.isIntersecting || fig.dataset.ready) return;
            io.disconnect();
            const fn = ML_VIS[fig.dataset.vis], host = fig.querySelector('.vis-root');
            if (!fn) { host.textContent = 'Missing visual: ' + fig.dataset.vis; return; }
            try { const r = fn(host); Promise.resolve(r).then(() => { fig.dataset.ready = '1'; renderMath(host); }); }
            catch (e) { console.error('visual ' + fig.dataset.vis, e); host.textContent = 'This visual failed to load.'; }
        }), { rootMargin: '200px' });
        io.observe(fig);
    });
}
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
        const rel = Math.abs(rate - coupon) < 1e-9 ? 'at <b>par</b>: the market rate equals the coupon rate' : rate > coupon ? `at a <b>discount</b>: new bonds pay $${V.tp(rate)}$, so nobody pays full price for a $5\\%$ coupon` : `at a <b>premium</b>: new bonds pay only $${V.tp(rate)}$, so the old $5\\%$ coupon is worth more`;
        V.math(read, `A 10-year bond with a fixed $5\\%$ coupon ($\\text{RM}50$ a year) trades ${rel}. Its price is the present value of the cash flows at the market rate $y = ${V.tp(rate)}$:` +
            `$$P = \\sum_{t=1}^{10}\\frac{50}{(1+y)^t} + \\frac{1{,}000}{(1+y)^{10}} = \\boxed{${V.trm(p)}}$$` +
            `The cash flows never change; only the rate used to discount them does: <b>$y\\uparrow \\Rightarrow P\\downarrow$</b>.`);
    }
    draw();
};

ML_VIS.l1_real_return = function (root) {
    let nominal = 0.08, tax = 0.25, infl = 0.04, mode = 'approx';
    const svg = V.svg(560, 250), read = V.h('div', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' },
        V.slider('nominal return', 0, 20, 0.5, nominal * 100, v => { nominal = v / 100; draw(); }, v => v + '%'),
        V.slider('tax on returns', 0, 40, 1, tax * 100, v => { tax = v / 100; draw(); }, v => v + '%'),
        V.slider('inflation', 0, 12, 0.5, infl * 100, v => { infl = v / 100; draw(); }, v => v + '%')),
        V.seg([['approx', 'Quick approximation (the chapter\'s formula)'], ['fisher', 'Exact (Fisher equation)']], mode, v => { mode = v; draw(); }), svg, read);
    function draw() {
        V.clear(svg);
        const after = nominal * (1 - tax), approx = after - infl, exact = (1 + after) / (1 + infl) - 1, real = mode === 'approx' ? approx : exact;
        const bars = [['nominal', nominal, V.C.sky, V.C.skyS], ['after tax', after, V.C.indigo, V.C.indigoS],
            [(mode === 'approx' ? 'real: approximation' : 'real: exact (Fisher)') + '\n(after tax and inflation)', real, real >= 0 ? V.C.green : V.C.red, real >= 0 ? V.C.greenS : '#fee2e2']];
        const zero = 150, k = 520, r = V.rng(5);
        V.rline(svg, 40, zero, 540, zero, '#94a3b8', 1.4, r);
        bars.forEach(([name, v, col, fill], i) => {
            const x = 70 + i * 165, h = v * k;
            V.rrect(svg, x, h >= 0 ? zero - h : zero, 110, Math.max(Math.abs(h), 2), col, fill, r);
            V.text(svg, x + 55, h >= 0 ? zero - h - 14 : zero - h + 16, V.pct(v), { size: 15, weight: 700, color: col });
            name.split('\n').forEach((t, j) => V.text(svg, x + 55, 222 + j * 16, t, { size: 13, color: '#475569' }));
        });
        const t = x => V.tp(x);
        const on = k => mode === k ? 'font-weight:800' : 'opacity:.75';
        const wealth = 10000 * (1 + after), power = wealth / (1 + infl);
        V.math(read,
            `<div>Step 1, take the <b>after-tax</b> return, where $t$ is the tax rate: $$R_{\\text{after-tax}} = R_{\\text{nominal}}\\,(1-t) = ${t(nominal)} \\times ${V.fmt(1 - tax, 2)} = ${t(after)}$$</div>` +
            `<div>Step 2, remove inflation $i = ${t(infl)}$ in one of two ways:</div>` +
            `<div style="${on('approx')}">1. Quick approximation: $$R_{\\text{real}} \\approx R_{\\text{after-tax}} - i = ${t(after)} - ${t(infl)} = ${t(approx)}$$</div>` +
            `<div style="${on('fisher')}">2. Exact (Fisher equation): $$R_{\\text{real}} = \\frac{1+R_{\\text{after-tax}}}{1+i} - 1 = \\frac{${V.fmt(1 + after, 4)}}{${V.fmt(1 + infl, 4)}} - 1 = ${t(exact)}$$</div>` +
            `<div>The approximation is ${approx >= exact ? 'higher' : 'lower'} than the exact answer by $${V.tn(Math.abs(approx - exact) * 100, 3)}$ percentage points. The gap is small when inflation is low and grows as inflation rises.</div>` +
            `<div>Check in ringgit: $\\text{RM}10{,}000$ grows to $${V.trm(wealth)}$, which buys what $\\dfrac{${V.tn(wealth)}}{${V.fmt(1 + infl, 4)}} = ${V.trm(power)}$ buys today. That is a true change of $${t(exact)}$, so the exact method is the one that matches the money. ${real < 0 ? 'Here purchasing power <b>falls</b> although the balance rises.' : ''}</div>`);
    }
    draw();
};

ML_VIS.l1_scorecard = function (root) {
    // Slide 38 (Table 1.4): letter grades turned into a 0-10 scale, in order of quality
    const G = { 'A++': 10, 'A+': 9, 'A/A+': 8.5, 'A': 8, 'A±': 7.5, 'A-': 7, 'B+': 6, 'B': 5, 'B-': 4, 'C': 3, 'C-': 2, 'D': 1, 'F': 0 };
    const DIMS = ['Availability', 'Safety', 'Liquidity', 'Rate'];
    const ROWS = [
        ['Passbook savings account', ['A+', 'A+', 'A', 'D'], '0.10%'],
        ['NOW account', ['A-', 'A+', 'A+', 'F'], '0.05%'],
        ['Money market deposit account', ['B', 'A+', 'A', 'C'], '0.15%'],
        ['Asset management account', ['B-', 'A', 'A+', 'B'], '0.20%'],
        ['I bonds', ['A+', 'A++', 'C-', 'A'], '1.50%'],
        ['U.S. Treasury bill (1 year)', ['B-', 'A++', 'A-', 'B'], '0.20%'],
        ['Certificate of deposit (1 year)', ['B', 'A±', 'B', 'A-'], '1.00%'],
        ['Commercial paper (90 day)', ['B-', 'A-', 'B-', 'A-'], '0.70%'],
        ["Banker's acceptance (90 day)", ['B-', 'A', 'B', 'B+'], '0.40%'],
        ['Money market mutual fund', ['B', 'A/A+', 'B+', 'B'], '0.20%'],
    ];
    const PRESETS = [
        ['balanced', 'Balanced', [1, 1, 1, 1]],
        ['emergency', 'Emergency fund', [2, 2, 3, 0.5]],
        ['safe', 'Park cash safely', [1, 4, 1, 0.5]],
        ['yield', 'Chase yield', [1, 1, 1, 4]],
    ];
    let W = [1, 1, 1, 1];
    const sliders = DIMS.map((d, i) => V.slider(d, 0, 5, 0.5, W[i], v => { W[i] = v; draw(); }, v => v));
    const setW = w => { W = w.slice(); sliders.forEach((s, i) => { s.input.value = W[i]; s.querySelector('output').textContent = W[i]; }); draw(); };
    const out = V.h('div', { class: 'vis-table-wrap' }), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('p', { class: 'vis-note' }, 'What matters most to you? Pick a goal or set the four importance sliders. Cells are coloured by grade (green = best, red = worst); an outline marks the best instrument in that column.'),
        V.seg(PRESETS.map(p => [p[0], p[1]]), 'balanced', v => setW(PRESETS.find(p => p[0] === v)[2])),
        V.h('div', { class: 'vis-row' }, ...sliders), out, read);
    const colour = s => `hsl(${Math.round(s / 10 * 125)},62%,${86 - Math.round(Math.abs(s - 5) * 1.2)}%)`;
    function draw() {
        const sum = W.reduce((a, b) => a + b, 0) || 1;
        const rows = ROWS.map(([name, grades, rate]) => { const sc = grades.map(g => G[g]); return { name, grades, rate, sc, fit: sc.reduce((a, s, i) => a + s * W[i], 0) / sum }; });
        const best = DIMS.map((_, i) => Math.max(...rows.map(r => r.sc[i])));
        rows.sort((a, b) => b.fit - a.fit);
        const cell = (r, i) => `<td style="background:${colour(r.sc[i])};text-align:center;${r.sc[i] === best[i] ? 'outline:2.5px solid #0f172a;outline-offset:-3px;font-weight:800' : ''}">${r.grades[i]}${i === 3 ? '<br><small>$' + r.rate.replace('%', '\\%') + '$</small>' : ''}</td>`;
        V.math(out, `<table class="vis-table"><tr><th>Instrument (best fit first)</th>${DIMS.map(d => `<th>${d}${d === 'Rate' ? ' (2012)' : ''}</th>`).join('')}<th>Fit for your goal</th></tr>` +
            rows.map((r, k) => `<tr${k === 0 ? ' class="hl"' : ''}><td><b>${k === 0 ? '1st · ' : ''}${r.name}</b></td>${[0, 1, 2, 3].map(i => cell(r, i)).join('')}<td><div style="background:#e2e8f0;border-radius:99px;height:10px;width:110px"><div style="background:#4f46e5;border-radius:99px;height:10px;width:${Math.round(r.fit * 10)}%"></div></div><small>$${V.tn(r.fit, 1)}/10$</small></td></tr>`).join('') + '</table>');
        const winners = DIMS.map((d, i) => `${d.toLowerCase()}: <b>${rows.filter(r => r.sc[i] === best[i]).map(r => r.name.replace(/ \(.*\)/, '')).join(' / ')}</b>`);
        const all = rows.filter(r => r.sc.every((s, i) => s === best[i]));
        read.innerHTML = `Best fit for these priorities: <b>${rows[0].name}</b>. But the best instrument in each column differs: ${winners.join('; ')}. ` +
            (all.length ? `<b>${all[0].name}</b> is best on every dimension.` : 'No instrument is outlined in all four columns, so there is <b>no overall winner</b>: change the priorities and the ranking changes. That trade-off, not "instrument X is best", is the lesson.');
    }
    draw();
};
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
        V.text(svg, 280, 286, `margin now = (V - D) / V = ${V.pct(m, 1)}`, { size: 14, weight: 700, color: call ? V.C.red : V.C.green });
        V.math(read, `Buy $100$ shares at $\\text{RM}50$ with $${V.tp(initial, 0)}$ initial margin: your equity is $E_0 = ${V.trm(E0, 0)}$ and the loan is $D = ${V.trm(D, 0)}$. At $\\text{RM}${price}$ the stock has moved <b>$${V.tp(cash, 1)}$</b>, but your return on equity (before interest) is` +
            `$$\\frac{V - V_0}{E_0} = \\frac{${V.tn(Vn, 0)} - ${V.tn(V0, 0)}}{${V.tn(E0, 0)}} = \\boxed{${V.tp(roe, 1)}}$$` +
            (call ? `<span class="vis-verdict bad">margin call</span> margin $\\dfrac{V-D}{V} = ${V.tp(m, 1)}$ is below the $${V.tp(maint, 0)}$ maintenance requirement.` : `<span class="vis-verdict good">no margin call</span> the call price is about <b>$\\text{RM}${V.tn(crit, 2)}$</b>: $P^* = \\dfrac{D}{N(1-m)} = \\dfrac{${V.tn(D, 0)}}{100(1-${V.fmt(maint, 2)})}$.`) +
            (E <= 0 ? ' Equity is wiped out: the loss now exceeds your own money.' : ''));
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
        const c = V.chart(svg, { x0: 80, x1: 520, y0: 250, y1: 30, X: [0, 150], Y: [-10000, 10000], xticks: [0, 25, 50, 75, 100, 125, 150], yticks: [-10000, -5000, 0, 5000, 10000], fx: t => 'RM' + t, fy: t => (t < 0 ? '-' : '') + 'RM' + V.fmt(Math.abs(t), 0), xlabel: 'share price', ylabel: 'profit on 100 shares' });
        V.path(svg, [[c.X(0), c.Y(-5000)], [c.X(150), c.Y(10000)]], V.C.sky, 2.4);
        V.path(svg, [[c.X(0), c.Y(5000)], [c.X(150), c.Y(-10000)]], V.C.rose, 2.8);
        V.text(svg, c.X(140), c.Y(8800) - 12, 'long', { size: 14, weight: 700, color: V.C.sky, anchor: 'end' });
        V.text(svg, c.X(138), c.Y(-7200), 'short', { size: 14, weight: 700, color: V.C.rose, anchor: 'end' });
        svg.append(V.s('line', { x1: c.X(price), x2: c.X(price), y1: c.Y(10000), y2: c.Y(-10000), stroke: '#94a3b8', 'stroke-dasharray': '4 4' }));
        const sp = shares * (sold - price), lp = shares * (price - sold);
        V.dot(svg, c.X(price), c.Y(sp), V.C.rose); V.dot(svg, c.X(price), c.Y(lp), V.C.sky);
        const equity = 7500 - shares * price, m = price ? equity / (shares * price) : Infinity;
        V.math(read, `Short $100$ borrowed shares at $\\text{RM}50$ (proceeds $\\text{RM}5{,}000$, plus a $\\text{RM}2{,}500$ margin deposit). At $\\text{RM}${price}$:` +
            `$$\\text{Short profit} = (P_{\\text{sell}} - P_{\\text{now}})\\times N = (50 - ${price})\\times 100 = \\boxed{${V.trm(sp, 0)}}$$` +
            `while the long position would make $${V.trm(lp, 0)}$. The short's best case is <b>$\\text{RM}5{,}000$</b> (the price falls to $0$); there is no worst case, because the price can keep rising. ` +
            `Short-account margin $= \\dfrac{\\text{funds held} - \\text{cost to buy back}}{\\text{cost to buy back}} = \\dfrac{7{,}500 - ${V.tn(shares * price, 0)}}{${V.tn(shares * price, 0)}} = $ <b>$${price ? V.tp(m, 1) : '\\infty'}$</b>${price && m < 0.3 ? ' <span class="vis-verdict bad">below $30\\%$: margin call</span>' : ''}.`);
    }
    draw();
};

ML_VIS.l2_underwrite = function (root) {
    // TechCo sells 10 million shares; the bank pays RM9.40 each and offers them to the public at RM10.00
    const N = 10, offer = 10, paid = 9.4;
    let p = 10;
    const svg = V.svg(620, 300), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('p', { class: 'vis-note' }, 'TechCo sells $10$ million new shares. The bank agrees to pay $\\text{RM}9.40$ a share and offers them to the public at $\\text{RM}10.00$. Drag the slider to change what the public is actually willing to pay.'),
        V.h('div', { class: 'vis-row' }, V.slider('price the public will pay', 7, 12, 0.1, p, v => { p = v; draw(); }, v => 'RM' + v.toFixed(2))), svg, read);
    function draw() {
        V.clear(svg);
        const sell = Math.min(p, offer), alone = sell * N, withUW = paid * N, bank = (sell - paid) * N;
        const zero = 195, k = 1.55, r = V.rng(11);
        V.rline(svg, 30, zero, 600, zero, '#94a3b8', 1.4, r);
        const target = zero - 100 * k;
        svg.append(V.s('line', { x1: 30, x2: 600, y1: target, y2: target, stroke: V.C.amber, 'stroke-dasharray': '6 5', 'stroke-width': 1.4 }));
        V.text(svg, 600, target - 10, 'target RM100m', { size: 12, anchor: 'end', color: V.C.amber });
        const bars = [
            ['TechCo, no underwriter', 'sells the shares itself', alone, V.C.slate, V.C.slateS],
            ['TechCo, with underwriter', 'paid by the bank', withUW, V.C.green, V.C.greenS],
            ['Bank\'s profit or loss', 'resale price minus RM9.40', bank, bank >= 0 ? V.C.indigo : V.C.red, bank >= 0 ? V.C.indigoS : '#fee2e2'],
        ];
        bars.forEach(([name, sub, v, col, fill], i) => {
            const x = 60 + i * 190, h = v * k;
            V.rrect(svg, x, h >= 0 ? zero - h : zero, 120, Math.max(Math.abs(h), 2), col, fill, r);
            V.text(svg, x + 60, h >= 0 ? (h > 30 ? zero - h + 20 : zero - h - 13) : zero - h + 15, (v < 0 ? '-' : '') + 'RM' + V.fmt(Math.abs(v), 1) + 'm', { size: 15, weight: 700, color: col });
            V.text(svg, x + 60, 272, name, { size: 13, weight: 700, color: '#334155' });
            V.text(svg, x + 60, 290, sub, { size: 12, color: '#64748b' });
        });
        const pr = '$\\text{RM}' + p.toFixed(2) + '$', m = x => `$\\text{RM}${V.tn(x, 1)}\\text{m}$`;
        const bankLine = `$$\\text{Bank's result} = (P_{\\text{resale}} - P_{\\text{paid}})\\times N = (${sell.toFixed(2)} - 9.40)\\times 10\\text{m} = \\boxed{${V.trm(bank, 1)}\\text{m}}$$`;
        let msg;
        if (p >= offer) msg = `Demand is strong: every share sells at the $\\text{RM}10.00$ offer price${p > offer ? ' (investors would pay ' + pr + ', so the shares are likely to rise once trading starts)' : ''}. Alone, TechCo would have raised ${m(100)}; with the underwriter it gets ${m(94)} and the bank keeps the <b>${m(6)} spread</b>.${bankLine}In hindsight the underwriter cost ${m(6)}, like an insurance premium paid in a year with no accident.`;
        else if (p >= paid) msg = `Demand is a little weak: the shares only sell at ${pr}. Alone, TechCo would raise ${m(alone)}. With the underwriter it still gets ${m(94)}, and the bank's profit shrinks:${bankLine}`;
        else msg = `Demand is weak: the public pays only ${pr}. Alone, TechCo would raise just ${m(alone)}, <b>${m(100 - alone)} short</b> of its target. With the underwriter TechCo still gets <b>${m(94)}</b>, and the bank takes the loss:${bankLine}That loss is the risk it was paid to carry.`;
        V.math(read, msg + ' Notice the green bar never moves: <b>certainty is what underwriting sells</b>.');
    }
    draw();
};
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
        V.math(table, `<table class="vis-table"><tr><th>stock</th><th>price</th><th>shares (m)</th><th>market value (RMm)</th><th>price weight</th><th>value weight</th></tr>${stocks.map((s, i) => `<tr><td>${s.name}</td><td>$${V.trm(p1[i], 2)}$</td><td>$${V.tn(s.shares, 0)}$</td><td>$${V.tn(cap1[i], 0)}$</td><td>$${V.tp(p0[i] / sum(p0), 0)}$</td><td>$${V.tp(cap0[i] / sum(cap0), 0)}$</td></tr>`).join('')}</table>`);
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
        const sg = v => (v > 0 ? '+' : '') + V.tp(v, 2);
        V.math(read, `Same three stocks, same price moves, three different "market" returns:` +
            `$$\\begin{aligned}\\text{price-weighted} &= \\frac{\\sum P_1}{\\sum P_0} - 1 = ${sg(priceW)} \\\\ \\text{value-weighted} &= \\frac{\\sum P_1Q}{\\sum P_0Q} - 1 = ${sg(valueW)} \\\\ \\text{equal-weighted} &= \\frac{1}{n}\\sum R_i = ${sg(equalW)}\\end{aligned}$$` +
            `A price-weighted average is dominated by the <b>highest-priced</b> stock (TinyCo), a value-weighted index by the <b>largest company</b> (MegaBank), and an equal-weighted index treats every stock alike. ${Math.max(...big) - Math.min(...big) > 0.02 ? 'Here the indexes disagree by more than $2$ percentage points, so benchmark choice changes the verdict on a portfolio.' : 'Move one stock at a time to see which index it drives.'}`);
    }
    draw();
};

// Stop-loss and stop-limit orders, shown on a simplified price board
function stopBoard(root, limitMode) {
    const N = 100, bought = 20, stop = 17, lim = 16.5, p0 = 18.5;
    let price = 15, jump = true;
    const svg = V.svg(700, 540), read = V.h('div', { class: 'vis-readout' });
    root.append(
        V.h('p', { class: 'vis-note', html: `You own $100$ shares bought at $\\text{RM}20.00$ and set a ${limitMode ? 'stop-limit order: stop price $\\text{RM}17.00$, limit price $\\text{RM}16.50$' : 'stop-loss order at $\\text{RM}17.00$'}. Drag the slider to make the price fall, and choose how it gets there.` }),
        V.h('div', { class: 'vis-row' }, V.slider('price falls to', 12, 20, 0.1, price, v => { price = Math.round(v * 10) / 10; draw(); }, v => 'RM' + v.toFixed(2))),
        V.seg([[true, 'in one jump (a gap)'], [false, 'step by step']], jump, v => { jump = v; draw(); }), svg, read);
    function draw() {
        V.clear(svg);
        const r = V.rng(21), C = V.C, f2 = x => x.toFixed(2), m = x => `$\\text{RM}${f2(x)}$`;
        const trig = price <= stop + 1e-9;
        const T = trig ? (jump ? price : stop) : price;                     // price of the first trade at or below the stop
        const filled = trig && (!limitMode || T >= lim - 1e-9);
        const waiting = limitMode && trig && !filled;
        const X = p => 60 + (20 - p) / 8 * 580;
        // ---- price strip
        V.text(svg, 60, 20, 'you bought at RM20', { size: 13, anchor: 'start', color: '#64748b' });
        V.rline(svg, 60, 60, 640, 60, '#94a3b8', 2, r);
        [20, 18, 16, 14, 12].forEach(p => { V.rline(svg, X(p), 55, X(p), 65, '#94a3b8', 1.4, r); V.text(svg, X(p), 82, 'RM' + p, { size: 12, color: '#64748b' }); });
        V.rline(svg, X(stop), 44, X(stop), 72, C.rose, 2.4, r, { 'stroke-dasharray': '5 4' });
        V.text(svg, X(stop), 102, 'stop RM17', { size: 13, weight: 700, color: C.rose });
        if (limitMode) {
            V.rline(svg, X(lim), 50, X(lim), 70, C.amber, 2.4, r, { 'stroke-dasharray': '2 4' });
            V.text(svg, X(lim), 120, 'limit RM16.50', { size: 13, weight: 700, color: C.amber });
        }
        if (price < p0) {
            if (jump) {
                V.rline(svg, X(p0), 60, X(price), 60, C.red, 3.2, r, { 'stroke-dasharray': '7 6' });
                V.text(svg, (X(p0) + X(price)) / 2, 24, 'GAP: no trades in between', { size: 13, weight: 700, color: C.red });
            } else {
                for (let p = p0; p >= price - 1e-9; p -= 0.25) V.dot(svg, X(p), 60, '#334155', 2.5, '#334155');
                V.text(svg, (X(p0) + X(price)) / 2, 24, 'trades at every price on the way down', { size: 13, weight: 700, color: '#334155' });
            }
        }
        V.dot(svg, X(price), 60, trig ? C.rose : C.green, 8, trig ? C.roseS : C.greenS);
        V.text(svg, Math.min(Math.max(X(price), 70), 630), 42, 'price now RM' + f2(price), { size: 14, weight: 700, color: trig ? C.rose : C.green });
        // ---- price board
        const lx = 300, lw = 240, rowH = 26, step = 30;
        const asks = [[T + 0.08, 300], [T + 0.06, 500], [T + 0.04, 200], [T + 0.02, 400]];
        const bids = [[T, 300], [T - 0.02, 600], [T - 0.04, 250], [T - 0.06, 400]];
        V.text(svg, lx + lw / 2, 160, 'ABC Bhd price board (simplified)', { size: 15, weight: 700, color: '#334155' });
        V.text(svg, lx + lw / 2, 182, 'SELLERS waiting ("ask" side)', { size: 13, weight: 700, color: C.rose });
        const drawRow = (y, px, q, col, fill, hit, label) => {
            V.rrect(svg, lx, y, lw, rowH, col, fill, r, hit ? 3 : 1.6);
            V.text(svg, lx + 14, y + rowH / 2, 'RM' + f2(px), { size: 15, weight: 700, anchor: 'start' });
            V.text(svg, lx + lw - 12, y + rowH / 2, label || q + ' shares', { size: 13, anchor: 'end', color: label ? col : '#475569', weight: label ? 700 : 400 });
        };
        const y0 = 194;
        let yourY = null, hitY = null;
        if (waiting) { yourY = y0; drawRow(y0, lim, 0, C.indigo, C.indigoS, true, 'YOU, waiting'); }
        asks.forEach(([px, q], i) => drawRow(y0 + (i + 1) * step, px, q, C.rose, C.roseS, false));
        V.text(svg, lx + lw / 2, y0 + 5 * step + 8, 'gap between the cheapest seller and the highest buyer', { size: 12, color: '#64748b' });
        V.text(svg, lx + lw / 2, y0 + 5 * step + 40, 'BUYERS waiting ("bid" side)', { size: 13, weight: 700, color: C.green });
        const by = y0 + 5 * step + 52;
        bids.forEach(([px, q], i) => { const hit = filled && i === 0; if (hit) hitY = by; drawRow(by + i * step, px, q, C.green, C.greenS, hit); });
        // ---- your order card
        const cy = 330, col = !trig ? '#64748b' : filled ? C.green : C.indigo;
        V.rrect(svg, 10, cy, 250, 120, col, !trig ? '#f1f5f9' : filled ? C.greenS : C.indigoS, r, 2.2);
        const lines = ['YOU own 100 shares', limitMode ? 'STOP RM17 then LIMIT RM16.50' : 'SELL STOP at RM17', !trig ? 'asleep: not on the board' : filled ? 'SOLD at RM' + f2(T) : 'NOT SOLD: still waiting'];
        lines.forEach((t, i) => V.text(svg, 135, cy + 26 + i * 30, t, { size: i === 2 ? 16 : 15, weight: i === 2 ? 700 : 400, color: i === 2 ? col : '#1e293b' }));
        if (hitY !== null) V.arrow(svg, 264, cy + 60, lx - 6, hitY + rowH / 2, C.green, 2.8, r);
        if (yourY !== null) V.arrow(svg, 264, cy + 40, lx - 6, yourY + rowH / 2, C.indigo, 2.8, r);
        // ---- short notes beside the board
        const nx = 556;
        if (!trig) ['Your stop is only an alarm.', 'It is not on the board,', 'so nobody can see it.'].forEach((t, i) => V.text(svg, nx, 300 + i * 18, t, { size: 13, anchor: 'start', color: '#475569' }));
        if (filled) V.text(svg, nx, hitY + rowH / 2, '<- matched: sold here', { size: 14, weight: 700, anchor: 'start', color: C.green });
        if (waiting) {
            V.text(svg, nx, yourY + rowH / 2, '<- your limit order waits', { size: 14, weight: 700, anchor: 'start', color: C.indigo });
            ['Best buyer only pays', 'RM' + f2(T) + ': below your limit,', 'so nothing sells.'].forEach((t, i) => V.text(svg, nx, by + 6 + i * 18, t, { size: 13, anchor: 'start', color: C.red }));
        }
        // ---- readout
        const planned = (bought - stop) * N, loss = (bought - T) * N;
        let h;
        if (!trig) {
            h = `The price is ${m(price)}, still above the stop price $\\text{RM}17.00$, so nothing has happened. Your stop is a "suspended" order: only your broker knows it exists.`;
        } else {
            h = jump ? `The price jumped straight past $\\text{RM}17.00$ with no trades in between. The first trade at or below the stop price was at ${m(T)}, and that set the alarm off.`
                : `The price fell step by step, so there were trades at every price on the way down. The first trade at or below the stop price was at $\\text{RM}17.00$, and that set the alarm off.`;
            if (!limitMode) {
                h += ` The stop fires and becomes a <b>market order</b> to sell, which takes the best buyer waiting, at ${m(T)}.` +
                    `$$\\text{Loss} = (P_{\\text{bought}} - P_{\\text{sold}}) \\times N = (20.00 - ${f2(T)}) \\times 100 = \\boxed{\\text{RM}${V.tn(loss, 0)}}$$` +
                    (loss > planned + 0.5 ? `You planned to lose $\\text{RM}${V.tn(planned, 0)}$ and lost $\\text{RM}${V.tn(loss, 0)}$: a stop price is a trigger, not a guaranteed price.` : `This matches the $\\text{RM}${V.tn(planned, 0)}$ loss you planned, because trading was continuous. A gap would have cost more: try the "in one jump" button.`);
            } else if (filled) {
                h += ` The stop fires and becomes a <b>limit order</b> to sell at $\\text{RM}16.50$ or better. The best buyer waiting pays ${m(T)}, which is at least your limit, so it fills.` +
                    `$$\\text{Loss} = (20.00 - ${f2(T)}) \\times 100 = \\boxed{\\text{RM}${V.tn(loss, 0)}}$$` +
                    `The limit price was not a problem here. Move the slider lower, with the jump option on, to see when it becomes one.`;
            } else {
                h += ` The stop fires and becomes a <b>limit order</b> to sell at $\\text{RM}16.50$ or better. The best buyer waiting only offers ${m(T)}, below your limit, so the order joins the queue of sellers and <b>waits</b>. You still own the $100$ shares.` +
                    `$$\\text{Loss so far (on paper)} = (20.00 - ${f2(T)}) \\times 100 = \\boxed{\\text{RM}${V.tn(loss, 0)}}$$` +
                    `It keeps growing if the price keeps falling. The limit protected your selling price, but not your shares: price control cost you execution certainty.`;
            }
        }
        V.math(read, h);
    }
    draw();
}
ML_VIS.l3_stop_board = root => stopBoard(root, false);
ML_VIS.l3_stoplimit_board = root => stopBoard(root, true);
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
        V.math(read, `$$FV = PV\\left(1+\\frac{r}{m}\\right)^{mt} = ${V.trm(pv, 0)}\\left(1+\\frac{${V.tp(rate, 1)}}{${m}}\\right)^{${m}\\times${years}} = \\boxed{${V.trm(fvC(years))}}$$` +
            `Simple interest would give $PV(1+rt) = ${V.trm(fvS(years))}$; the shaded gap of <b>$${V.trm(fvC(years) - fvS(years))}$</b> is interest earned on interest. True (effective) annual rate:` +
            `$$EAR = \\left(1+\\frac{r}{m}\\right)^{m} - 1 = \\left(1+\\frac{${V.tp(rate, 1)}}{${m}}\\right)^{${m}} - 1 = \\boxed{${V.tp(ear, 3)}}$$` +
            (m > 1 ? `versus the stated $${V.tp(rate, 1)}$: compounding more often raises the true rate.` : 'With annual compounding the effective rate equals the stated rate.'));
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
        V.math(read, `${due ? 'Annuity due: each payment arrives at the <b>start</b> of the year, so every payment compounds one extra year.' : 'Ordinary annuity: payments at the <b>end</b> of each year; the last one earns nothing.'}` +
            `$$FV = PMT\\left[\\frac{(1+r)^n - 1}{r}\\right]${due ? '(1+r)' : ''} = ${V.trm(pmt, 0)} \\times ${V.tn(factor * (due ? 1 + rate : 1), 4)} = \\boxed{${V.trm(fv)}}$$` +
            `from $${V.trm(pmt * n, 0)}$ deposited. Its present value today is <b>$PV = \\dfrac{FV}{(1+r)^n} = ${V.trm(pv)}$</b>. Earlier payments grow most: they have the most years to compound.`);
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
        const cv = S => Number.isFinite(S.cv) ? V.tn(S.cv, 2) : '\\text{undefined (mean } 0)';
        const line = (k, S) => `\\text{${k}:}\\quad \\bar R = ${V.tn(S.m, 2)}\\%, \\quad s = \\sqrt{\\frac{\\sum (R_t - \\bar R)^2}{n-1}} = ${V.tn(S.s, 2)}\\%, \\quad CV = \\frac{s}{\\bar R} = ${cv(S)}`;
        V.math(read, `Shaded band = mean $\\pm 1$ standard deviation (sample, $n - 1$).` +
            `$$\\begin{aligned}&${line('A', A)} \\\\ &${line('B', B)}\\end{aligned}$$` +
            `$s$ measures <b>absolute</b> dispersion; $CV = \\dfrac{s}{\\bar R}$ measures risk <b>per unit of return</b>, so it is the fairer comparison when the averages differ.`);
    }
    draw();
};
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
        V.text(svg, c.X(0.012), c.Y(0.08), 'ρ = -1', { size: 12, color: '#64748b', anchor: 'start' });
        V.dot(svg, c.X(PORT.sA), c.Y(PORT.eA), V.C.rose, 5); V.text(svg, c.X(PORT.sA) + 8, c.Y(PORT.eA), 'A', { size: 14, weight: 700, anchor: 'start', color: V.C.rose });
        V.dot(svg, c.X(PORT.sB), c.Y(PORT.eB), V.C.sky, 5); V.text(svg, c.X(PORT.sB) + 8, c.Y(PORT.eB), 'B', { size: 14, weight: 700, anchor: 'start', color: V.C.sky });
        const sp = sigmaP(w, rho), er = w * PORT.eA + (1 - w) * PORT.eB, avg = w * PORT.sA + (1 - w) * PORT.sB;
        V.dot(svg, c.X(sp), c.Y(er), V.C.amber, 7, V.C.amberS);
        const den = PORT.sA ** 2 + PORT.sB ** 2 - 2 * rho * PORT.sA * PORT.sB, wMin = den > 1e-12 ? Math.min(1, Math.max(0, (PORT.sB ** 2 - rho * PORT.sA * PORT.sB) / den)) : 0.5;
        const wa = V.fmt(w, 2), wb = V.fmt(1 - w, 2), rr = V.par(rho.toFixed(2));
        V.math(read, `A: $E(R_A) = 12\\%$, $\\sigma_A = 20\\%$. B: $E(R_B) = 6\\%$, $\\sigma_B = 10\\%$. With $w_A = ${wa}$ and $\\rho = ${rho.toFixed(2)}$:` +
            `$$E(R_p) = w_AE(R_A) + w_BE(R_B) = ${wa}(12\\%) + ${wb}(6\\%) = \\boxed{${V.tp(er)}}$$` +
            `$$\\sigma_p = \\sqrt{w_A^2\\sigma_A^2 + w_B^2\\sigma_B^2 + 2w_Aw_B\\sigma_A\\sigma_B\\rho} = \\sqrt{${wa}^2(0.20)^2 + ${wb}^2(0.10)^2 + 2(${wa})(${wb})(0.20)(0.10)${rr}} = \\boxed{${V.tp(sp)}}$$` +
            `$E(R_p)$ is always the weighted average, but $\\sigma_p$ is not: averaging the $\\sigma$s would give $${V.tp(avg)}$. The diversification benefit is <b>$${V.tp(avg - sp)}$</b>; it is zero only when $\\rho = +1$. Lowest-risk mix at this $\\rho$: about $w_A = ${V.tp(wMin, 0)}$ ($\\sigma_p = ${V.tp(sigmaP(wMin, rho))}$).`);
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
        V.math(read, `$$R = R_f + \\beta\\left[E(R_m) - R_f\\right] = ${V.tp(rf, 1)} + ${V.par(beta.toFixed(2))}\\times${V.par(V.tp(rm - rf, 1))} = \\boxed{${V.tp(R)}}$$` +
            `Your estimate $${V.tp(er, 1)}$ gives expected alpha <b>$\\alpha = E(R) - R = ${(alpha >= 0 ? '+' : '') + V.tp(alpha)}$</b>: ${verdict}. ` +
            `${beta < 0 ? 'A negative beta moves against the market, so CAPM asks for <b>less</b> than the risk-free rate: the hedge itself is valuable. ' : ''}Alpha is only as good as the expected-return estimate behind it.`);
    }
    draw();
};

ML_VIS.l5_sigma3d = async function (root) {
    let rho = -1, line = null, ready = false;   // declared before the first await, so an early slider move cannot hit them uninitialised
    const read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' }, V.slider('highlight correlation ρ', -1, 1, 0.1, rho, v => { rho = v; slice(); }, v => (v > 0 ? '+' : '') + v.toFixed(1))), read);
    const S = await V.scene3d(root, { radius: 6.2, phi: 1.05, theta: 0.65, target: [0, 0.5, 0], label: 'Portfolio standard deviation for every weight and correlation' });
    if (!S) return;
    const { THREE, scene } = S, N = 30, sz = 3, k = 0.12;
    // x = weight in A (0..1), z = correlation (-1..1), y = sigma_p (in % x k)
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
    [['weight in A →', [0.3, 0, o - 0.4]], ['ρ = -1', [o - 0.45, 0, o]], ['ρ = +1', [o - 0.45, 0, -o]], ['σp', [o, 2.85, o]]].forEach(([t, pos]) => { const s = V.label3d(THREE, t, '#475569', 0.26); s.position.set(...pos); scene.add(s); });
    const zeroPt = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), new THREE.MeshLambertMaterial({ color: 0xd97706 }));
    zeroPt.position.set((1 / 3 - 0.5) * sz, 0, o); scene.add(zeroPt);
    const zl = V.label3d(THREE, 'σp = 0 at w = 1/3, ρ = -1', '#b45309', 0.24); zl.position.set((1 / 3 - 0.5) * sz + 0.9, 0.7, o + 0.5); scene.add(zl);
    function slice() {
        if (!ready) return;
        if (line) scene.remove(line);
        const pts = []; for (let i = 0; i <= 40; i++) { const w = i / 40; pts.push([(w - 0.5) * sz, sigmaP(w, rho) * 100 * k + 0.02, rho / 2 * sz]); }
        line = V.line3d(THREE, pts, 0xe11d48); scene.add(line); S.dirty();
        const den = PORT.sA ** 2 + PORT.sB ** 2 - 2 * rho * PORT.sA * PORT.sB, wMin = Math.min(1, Math.max(0, (PORT.sB ** 2 - rho * PORT.sA * PORT.sB) / den));
        V.math(read, `Height = portfolio $\\sigma_p$ for A ($\\sigma_A = 20\\%$) and B ($\\sigma_B = 10\\%$). The red slice is $\\rho = ${rho.toFixed(1)}$: its lowest point is about <b>$w_A = ${V.tp(wMin, 0)}$</b>, where <b>$\\sigma_p = ${V.tp(sigmaP(wMin, rho))}$</b>. Move $\\rho$ down and the whole valley sinks; only at $\\rho = -1$ with $w_A = \\tfrac{1}{3}$ does risk reach zero.`);
    }
    ready = true;
    slice();
};
// Chapter 6 visuals
const L6 = {
    sg: v => (v > 0 ? '+' : '') + V.tp(v, 2),
    sgrm: (v, d = 2) => (v > 0 ? '+' : '') + V.trm(v, d),
    rm2: v => (v < 0 ? '-' : '') + 'RM' + Math.abs(v).toFixed(2),
};

// Holding-period return on a share: dividend income plus capital gain or loss
ML_VIS.l6_hpr = function (root) {
    let p0 = 20, d = 0.8, p1 = 22, n = 100;
    const svg = V.svg(560, 270), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' },
        V.slider('purchase price', 5, 40, 0.5, p0, v => { p0 = v; draw(); }, v => 'RM' + v.toFixed(2)),
        V.slider('dividends received', 0, 3, 0.05, d, v => { d = v; draw(); }, v => 'RM' + v.toFixed(2)),
        V.slider('sale (or current) price', 5, 40, 0.5, p1, v => { p1 = v; draw(); }, v => 'RM' + v.toFixed(2)),
        V.slider('shares held', 10, 1000, 10, n, v => { n = v; draw(); })), svg, read);
    function draw() {
        V.clear(svg);
        const gain = p1 - p0, tot = d + gain, hpr = tot / p0, r = V.rng(61);
        const parts = [['dividend income', d, V.C.amber, V.C.amberS], ['capital gain / loss', gain, gain >= 0 ? V.C.green : V.C.rose, gain >= 0 ? V.C.greenS : V.C.roseS], ['total return', tot, V.C.sky, V.C.skyS]];
        const big = Math.max(1, ...parts.map(p => Math.abs(p[1]))), zero = 125, k = 78 / big;
        V.rline(svg, 30, zero, 540, zero, '#94a3b8', 1.4, r);
        V.text(svg, 34, zero - 10, 'RM0', { size: 12, anchor: 'start', color: '#64748b' });
        parts.forEach(([t, v, c, f], i) => {
            const x = 80 + i * 160, h = v * k;
            V.rrect(svg, x, h >= 0 ? zero - h : zero, 110, Math.max(2, Math.abs(h)), c, f, r);
            V.text(svg, x + 55, h >= 0 ? zero - h - 12 : zero - h + 14, L6.rm2(v), { size: 15, weight: 700, color: c });
            V.text(svg, x + 55, 256, t, { size: 13, color: '#475569' });
            if (i < 2) V.text(svg, x + 135, zero, i ? '=' : '+', { size: 22, weight: 700, color: '#94a3b8' });
        });
        const verdict = hpr >= 0 ? `<span class="vis-verdict good">gain</span>` : `<span class="vis-verdict bad">loss</span>`;
        V.math(read, `Per share: income $\\text{RM}${d.toFixed(2)}$ and price change $${V.trm(p1, 2)} - ${V.trm(p0, 2)} = ${L6.sgrm(gain)}$.` +
            `$$HPR = \\frac{D + (P_1 - P_0)}{P_0} = \\frac{${V.tn(d)} + (${V.tn(p1)} - ${V.tn(p0)})}{${V.tn(p0)}} = \\underbrace{${V.tp(d / p0)}}_{\\text{income}} ${gain >= 0 ? '+' : '-'} \\underbrace{${V.tp(Math.abs(gain) / p0)}}_{\\text{price}} = \\boxed{${V.tp(hpr)}}$$` +
            `${verdict} On $${V.tn(n, 0)}$ shares that is $${V.tn(n, 0)} \\times ${V.par(V.tn(tot))} = ${V.trm(n * tot)}$ before fees and taxes. ` +
            (d > 0 && hpr < 0 ? 'A dividend was paid, yet the total return is negative: income does not guarantee a gain. ' : '') +
            `The income part, $${V.tp(d / p0)}$, is <b>not</b> the whole return; the price part is a paper (unrealised) gain or loss until you sell.`);
    }
    draw();
};

// Decline from a peak: routine decline, correction, bear market (the slides' 5% / 10% / 20% conventions)
ML_VIS.l6_decline = function (root) {
    const peak = 1000;
    let level = 780;
    const svg = V.svg(560, 290), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' }, V.slider('index level now (peak = 1,000)', 550, 1000, 5, level, v => { level = v; draw(); }, v => V.fmt(v, 0))), svg, read);
    function draw() {
        V.clear(svg);
        const c = V.chart(svg, { x0: 70, x1: 530, y0: 250, y1: 24, X: [0, 10], Y: [500, 1050], yticks: [600, 800, 1000], fy: t => V.fmt(t, 0), xlabel: 'time', ylabel: 'index level' });
        [[0.05, 'routine decline -5%', V.C.amber], [0.10, 'correction -10%', V.C.violet], [0.20, 'bear market -20%', V.C.rose]].forEach(([q, t, col]) => {
            const y = c.Y(peak * (1 - q));
            svg.append(V.s('line', { x1: c.X(0), x2: c.X(10), y1: y, y2: y, stroke: col, 'stroke-dasharray': '6 5', 'stroke-width': 1.4 }));
            V.text(svg, c.X(10), y - 9, t, { size: 12, anchor: 'end', color: col });
        });
        const pts = [[0, 820], [1, 870], [2, 860], [3, 930], [4, 960], [5, 1000]];
        const steps = 5;
        for (let i = 1; i <= steps; i++) pts.push([5 + i, peak + (level - peak) * (i / steps) + (i < steps ? 12 * Math.sin(i * 2.1) : 0)]);
        V.path(svg, pts.map(([x, y]) => [c.X(x), c.Y(y)]), V.C.indigo, 2.6);
        V.dot(svg, c.X(5), c.Y(peak), V.C.green, 5); V.text(svg, c.X(5), c.Y(peak) - 14, 'peak', { size: 12, color: V.C.green });
        V.dot(svg, c.X(10), c.Y(level), V.C.indigo, 6, V.C.indigoS);
        const dec = (peak - level) / peak, back = level < peak ? peak / level - 1 : 0;
        const label = dec >= 0.2 ? ['bear market', 'bad'] : dec >= 0.1 ? ['correction', 'bad'] : dec >= 0.05 ? ['routine decline', 'bad'] : ['below every threshold', 'good'];
        V.math(read, `$$\\text{Decline from peak} = \\frac{\\text{peak} - \\text{now}}{\\text{peak}} = \\frac{1{,}000 - ${V.tn(level, 0)}}{1{,}000} = \\boxed{${V.tp(dec, 1)}}$$` +
            `<span class="vis-verdict ${label[1]}">${label[0]}</span> under the slides' conventions (routine decline $5\\%$, correction $10\\%$, bear market $20\\%$ in a major index). ` +
            (level < peak ? `To get back to the peak the index must now rise $\\dfrac{1{,}000}{${V.tn(level, 0)}} - 1 = ${V.tp(back, 1)}$: a bigger percentage than the fall, because the base is smaller. ` : '') +
            'These are descriptive labels, not forecasts, and one stock falling $20\\%$ is not a bear market.');
    }
    draw();
};

// Corporate actions: what happens to shares outstanding, your ownership and the value of your holding
ML_VIS.l6_corp_actions = function (root) {
    const N0 = 1000, P0 = 100, MY0 = 100;     // company: 1,000 shares at RM100; you own 100 shares (10%)
    let act = 'issue', size = 200, px = 100, ratio = 2, m = 4, sub = true, stockDiv = 10;
    const ctl = V.h('div', { class: 'vis-row' }), svg = V.svg(560, 250), table = V.h('div', { class: 'vis-table-wrap' }), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('p', { class: 'vis-note', html: 'The company has $1{,}000$ shares trading at $\\text{RM}100$ (equity value $\\text{RM}100{,}000$). You own $100$ shares: $10\\%$, worth $\\text{RM}10{,}000$. Pick an action.' }),
        V.seg([['issue', 'new shares sold to others'], ['rights', 'rights offering'], ['split', 'stock split'], ['reverse', 'reverse split'], ['sdiv', 'stock dividend'], ['buyback', 'buyback']], act, v => { act = v; size = 200; px = v === 'rights' ? 80 : 100; controls(); draw(); }),
        ctl, svg, table, read);
    function controls() {
        V.clear(ctl);
        if (act === 'issue') ctl.append(V.slider('new shares issued', 0, 1000, 50, size, v => { size = v; draw(); }), V.slider('issue price (% of RM100)', 50, 120, 5, px, v => { px = v; draw(); }, v => v + '%'));
        if (act === 'rights') ctl.append(V.slider('1 new share for every', 2, 10, 1, m, v => { m = v; draw(); }, v => v + ' held'), V.slider('subscription price (% of RM100)', 50, 100, 5, px, v => { px = v; draw(); }, v => v + '%'),
            V.seg([[true, 'you subscribe'], [false, 'you do not subscribe']], sub, v => { sub = v; draw(); }));
        if (act === 'split' || act === 'reverse') ctl.append(V.seg([[2, act === 'split' ? '2-for-1' : '1-for-2'], [3, act === 'split' ? '3-for-1' : '1-for-3'], [5, act === 'split' ? '5-for-1' : '1-for-5'], [10, act === 'split' ? '10-for-1' : '1-for-10']], ratio, v => { ratio = v; draw(); }));
        if (act === 'sdiv') ctl.append(V.slider('stock dividend', 5, 50, 5, stockDiv, v => { stockDiv = v; draw(); }, v => v + '%'));
        if (act === 'buyback') ctl.append(V.slider('shares bought back (from others)', 0, 500, 25, size, v => { size = v; draw(); }), V.slider('price paid (% of RM100)', 70, 140, 5, px, v => { px = v; draw(); }, v => v + '%'));
    }
    function model() {
        const q = px / 100 * P0;
        if (act === 'issue') { const N = N0 + size, V1 = N0 * P0 + size * q; return { N, my: MY0, P: V1 / N, cash: size * q, paid: 0, note: px < 100 ? 'below' : px > 100 ? 'above' : 'at' }; }
        if (act === 'rights') {
            const newOthers = (N0 - MY0) / m, mine = sub ? MY0 / m : 0, N = N0 + newOthers + mine, V1 = N0 * P0 + (newOthers + mine) * q;
            return { N, my: MY0 + mine, P: V1 / N, cash: (newOthers + mine) * q, paid: mine * q };
        }
        if (act === 'split') return { N: N0 * ratio, my: MY0 * ratio, P: P0 / ratio, cash: 0, paid: 0 };
        if (act === 'reverse') return { N: N0 / ratio, my: MY0 / ratio, P: P0 * ratio, cash: 0, paid: 0 };
        if (act === 'sdiv') { const f = 1 + stockDiv / 100; return { N: N0 * f, my: MY0 * f, P: P0 / f, cash: 0, paid: 0 }; }
        const b = Math.min(size, 500), N = N0 - b, V1 = N0 * P0 - b * q;
        return { N, my: MY0, P: V1 / N, cash: -b * q, paid: 0 };
    }
    function bar(y, title, N, my, P, maxV, r) {
        const W = 470, tot = N * P, w = tot / maxV * W, wm = my * P / maxV * W;
        V.rrect(svg, 45, y, w, 46, '#64748b', '#e2e8f0', r);
        V.rrect(svg, 45, y, Math.max(2, wm), 46, V.C.amber, V.C.amberS, r);
        V.text(svg, 45, y - 14, `${title}: ${V.fmt(N, 2)} shares x ${L6.rm2(P)} = ${V.rm(tot, 0)}`, { size: 15, anchor: 'start', weight: 700, color: '#334155' });
        if (wm > 60) V.text(svg, 45 + wm / 2, y + 23, 'you', { size: 13, weight: 700, color: V.C.amber });
        V.text(svg, 45 + Math.max(w, wm) + 8, y + 23, `you: ${V.pct(my / N, 2)}`, { size: 15, anchor: 'start', color: V.C.amber });
    }
    function draw() {
        V.clear(svg);
        const s = model(), r = V.rng(63), maxV = Math.max(N0 * P0, s.N * s.P) * 1.18;
        bar(52, 'Before', N0, MY0, P0, maxV, r);
        bar(162, 'After', s.N, s.my, s.P, maxV, r);
        V.text(svg, 280, 238, 'amber = your slice: its length is your wealth in shares, its share of the bar is your ownership %', { size: 12, color: '#64748b' });
        const val0 = MY0 * P0, val1 = s.my * s.P, wealth = val1 - s.paid - val0;
        V.math(table, `<table class="vis-table"><tr><th></th><th>shares out</th><th>yours</th><th>your %</th><th>price</th><th>holding</th></tr>` +
            `<tr><td>before</td><td>$${V.tn(N0, 0)}$</td><td>$${V.tn(MY0, 0)}$</td><td>$10\\%$</td><td>$\\text{RM}100$</td><td>$\\text{RM}10{,}000$</td></tr>` +
            `<tr><td>after</td><td>$${V.tn(s.N, 2)}$</td><td>$${V.tn(s.my, 2)}$</td><td class="${Math.abs(s.my / s.N - 0.1) < 1e-9 ? '' : 'hl'}">$${V.tp(s.my / s.N, 2)}$</td><td>$${V.trm(s.P, 2)}$</td><td class="${Math.abs(wealth) < 0.005 ? '' : wealth < 0 ? 'neg' : 'one'}">$${V.trm(val1, 2)}$</td></tr></table>`);
        const own = `your ownership is $${V.tn(s.my, 2)} \\div ${V.tn(s.N, 2)} = ${V.tp(s.my / s.N, 2)}$`, ownC = 'Y' + own.slice(1);
        const wl = Math.abs(wealth) < 0.005 ? 'Your wealth is <b>unchanged</b>.' : `Your wealth changes by <b>$${L6.sgrm(wealth)}$</b>${s.paid ? ' (after the cash you paid in)' : ''}.`;
        const text = {
            issue: `The company sells $${V.tn(size, 0)}$ new shares at $${V.trm(px, 0)}$ and receives $${V.trm(s.cash, 0)}$ (primary issue, before costs). You buy none, so ${own}: that fall is <b>dilution</b>. ` +
                (px === 100 ? 'Sold at the market price, the new money exactly matches the new shares, so the price and your holding do not change. ' : px < 100 ? 'Sold <b>below</b> the market price, the new shares bring in less value than they claim, so old holders lose value. ' : 'Sold <b>above</b> the market price, new buyers overpay and old holders gain. ') + wl,
            rights: `Every holder may buy $1$ new share for every $${m}$ held at $${V.trm(px, 0)}$. ` + (sub ? `You pay $${V.trm(s.paid, 0)}$ for $${V.tn(MY0 / m, 2)}$ new shares, so ${own}: unchanged. Your shares are worth $${V.trm(val1, 2)}$, but $${V.trm(s.paid, 0)}$ of that is your own new cash. ` : `You buy none while everyone else subscribes, so ${own}. ` + (px < 100 ? 'Because the new shares are priced below the market, the price per share falls and you lose value unless you can sell your rights. ' : '')) + wl,
            split: `A $${ratio}$-for-$1$ split gives $${ratio}$ shares for each old one: $${V.tn(MY0, 0)} \\times ${ratio} = ${V.tn(s.my, 0)}$ shares at about $\\text{RM}100 \\div ${ratio} = ${V.trm(s.P, 2)}$. ${ownC}. The cake is cut into more pieces; there is no more cake. ${wl}`,
            reverse: `A $1$-for-$${ratio}$ reverse split turns every $${ratio}$ shares into one: $${V.tn(MY0, 0)} \\div ${ratio} = ${V.tn(s.my, 2)}$ shares at about $\\text{RM}100 \\times ${ratio} = ${V.trm(s.P, 0)}$. ${ownC}. ${wl}`,
            sdiv: `A $${stockDiv}\\%$ stock dividend gives $${stockDiv}$ new shares per $100$ held: $${V.tn(s.my, 2)}$ shares. With no change in the company's total value the price adjusts to $\\dfrac{100}{1 + ${V.fmt(stockDiv / 100, 2)}} = ${V.trm(s.P, 2)}$. ${ownC}. More shares, not more wealth. ${wl}`,
            buyback: `The company spends $${V.trm(-s.cash, 0)}$ buying back $${V.tn(N0 - s.N, 0)}$ shares from other holders at $${V.trm(px, 0)}$. You keep your $100$, so ${own}: a bigger share of a company that has less cash. ` +
                (px === 100 ? 'Bought at the market price, value per remaining share is unchanged. ' : px > 100 ? 'Paying <b>more</b> than the shares are worth transfers value to the sellers. ' : 'Buying <b>below</b> value benefits the holders who stay. ') + wl,
        }[act];
        V.math(read, text + ' <i>(Mechanical illustration: the price is assumed to equal the value per share and nothing else changes.)</i>');
    }
    controls(); draw();
};

// Dividend dates: who receives the dividend depends on when you buy
ML_VIS.l6_exdate = function (root) {
    const DEC = 3, EX = 16, REC = 18, PAY = 30, D = 0.8, CUM = 20.8;
    let day = 12;
    const svg = V.svg(560, 275), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('p', { class: 'vis-note', html: 'A $\\text{RM}0.80$ dividend is declared on day $3$ (dates as in the slide\'s June calendar). Slide the day on which you buy the share.' }),
        V.h('div', { class: 'vis-row' }, V.slider('you buy on day', 1, 29, 1, day, v => { day = v; draw(); })), svg, read);
    function draw() {
        V.clear(svg);
        const r = V.rng(64), X = d => 40 + (d - 1) / 29 * 480, y = 80;
        svg.append(V.s('rect', { x: X(1), y: y - 16, width: X(EX) - X(1), height: 32, fill: V.C.greenS, rx: 4 }));
        svg.append(V.s('rect', { x: X(EX), y: y - 16, width: X(30) - X(EX), height: 32, fill: V.C.roseS, rx: 4 }));
        V.text(svg, (X(1) + X(EX)) / 2, y, 'buy here: YOU get the dividend', { size: 12, weight: 700, color: V.C.green });
        V.text(svg, (X(EX) + X(30)) / 2, y, 'buy here: the SELLER keeps it', { size: 12, weight: 700, color: V.C.rose });
        V.rline(svg, X(1), y + 16, X(30), y + 16, '#94a3b8', 1.4, r);
        // date labels sit below the timeline (ex-dividend to the left of its tick, record to the right); the buyer's marker sits above it
        [[DEC, 'declaration', 'middle', V.C.slate], [EX, 'ex-dividend', 'end', V.C.rose], [REC, 'record', 'start', V.C.indigo], [PAY, 'payment', 'end', V.C.green]].forEach(([d, t, anc, col]) => {
            V.rline(svg, X(d), y - 22, X(d), y + 26, col, 2.2, r);
            const tx = X(d) + (anc === 'end' && d !== PAY ? -6 : anc === 'start' ? 6 : 0), ty = y + 42;
            V.text(svg, tx, ty, t, { size: 13, weight: 700, color: col, anchor: anc });
            V.text(svg, tx, ty + 16, 'day ' + d, { size: 12, color: col, anchor: anc });
        });
        V.arrow(svg, X(day), y - 52, X(day), y - 18, V.C.amber, 2.2, r);
        V.text(svg, X(day), y - 62, 'you buy (day ' + day + ')', { size: 13, weight: 700, color: V.C.amber, anchor: day > 24 ? 'end' : day < 5 ? 'start' : 'middle' });
        // illustrative price path: drops by about the dividend on the ex-date
        const py = p => 280 - (p - 19.6) * 65;
        V.text(svg, 40, py(CUM) + 18, 'illustrative share price', { size: 12, anchor: 'start', color: '#64748b' });
        V.path(svg, [[X(1), py(CUM)], [X(EX), py(CUM)], [X(EX), py(CUM - D)], [X(30), py(CUM - D)]], V.C.sky, 2.4);
        V.text(svg, X(8), py(CUM) - 12, 'RM20.80 (with the dividend)', { size: 12, color: V.C.sky });
        V.text(svg, X(23), py(CUM - D) - 12, 'about RM20.00 (without it)', { size: 12, color: V.C.sky });
        const gets = day < EX, paid = gets ? CUM : CUM - D;
        V.math(read, (gets ? `<span class="vis-verdict good">you receive $\\text{RM}0.80$</span> You bought before the ex-dividend date, so (under the market's settlement rules) you are on the register on the record date, day $${REC}$, and are paid on day $${PAY}$.`
            : `<span class="vis-verdict bad">no dividend for you</span> You bought on or after the ex-dividend date, day $${EX}$, so the seller keeps the entitlement even though the payment arrives on day $${PAY}$.`) +
            ` You paid about $\\text{RM}${paid.toFixed(2)}$. ` + (gets ? `After the ex-date the price drops by roughly the dividend, so $\\text{RM}20.80 \\approx \\text{RM}20.00 + \\text{RM}0.80$: buying just before the ex-date is not free money.` : `The price has already dropped by roughly the dividend, so you are not worse off for missing it.`) +
            ' Real prices also move on news, and the gap between ex-date and record date depends on the market\'s rules.');
    }
    draw();
};

// EPS, dividend yield and payout ratio from the same inputs
ML_VIS.l6_div_metrics = function (root) {
    let ni = 2, sh = 1, dps = 0.8, price = 20;
    const svg = V.svg(560, 260), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' },
        V.slider('net income to common (RM m)', -2, 20, 0.5, ni, v => { ni = v; draw(); }, v => (v < 0 ? '-RM' + (-v) : 'RM' + v) + 'm'),
        V.slider('weighted-average shares (m)', 0.5, 10, 0.5, sh, v => { sh = v; draw(); }, v => v + 'm'),
        V.slider('annual dividend per share', 0, 4, 0.05, dps, v => { dps = v; draw(); }, v => 'RM' + v.toFixed(2)),
        V.slider('share price', 2, 60, 0.5, price, v => { price = v; draw(); }, v => 'RM' + v.toFixed(2))), svg, read);
    function draw() {
        V.clear(svg);
        const eps = ni / sh, yld = dps / price, pay = eps > 0 ? dps / eps : NaN, r = V.rng(65);
        // top bar: price with the dividend slice
        const W = 440, x0 = 90;
        V.text(svg, 20, 30, 'price', { size: 14, weight: 700, anchor: 'start', color: V.C.sky });
        V.rrect(svg, x0, 16, W, 30, V.C.sky, V.C.skyS, r);
        V.rrect(svg, x0, 16, Math.max(3, Math.min(W, W * yld)), 30, V.C.amber, V.C.amberS, r);
        V.text(svg, x0 + W / 2, 64, `dividend ${L6.rm2(dps)} is ${V.pct(yld, 2)} of the ${L6.rm2(price)} price  →  YIELD`, { size: 13, color: '#475569' });
        // bottom bar: EPS split into paid and retained
        V.text(svg, 20, 130, 'EPS', { size: 14, weight: 700, anchor: 'start', color: V.C.green });
        if (eps > 0) {
            const scale = W / Math.max(eps, dps), we = eps * scale, wd = dps * scale;
            V.rrect(svg, x0, 116, we, 30, V.C.green, V.C.greenS, r);
            V.rrect(svg, x0, 116, Math.max(3, Math.min(wd, we)), 30, V.C.amber, V.C.amberS, r);
            if (wd > we) { V.rrect(svg, x0 + we, 116, wd - we, 30, V.C.red, V.C.roseS, r); V.text(svg, Math.min(x0 + (we + wd) / 2, 470), 104, 'paid beyond EPS', { size: 12, weight: 700, color: V.C.red }); }
            V.text(svg, x0 + W / 2, 164, `dividend ${L6.rm2(dps)} is ${V.pct(pay, 1)} of EPS ${L6.rm2(eps)}  →  PAYOUT`, { size: 13, color: '#475569' });
        } else {
            V.text(svg, x0 + W / 2, 131, `EPS = ${L6.rm2(eps)}: no positive earnings to pay out of`, { size: 13, weight: 700, color: V.C.red });
        }
        V.text(svg, 280, 214, 'yield and payout share a numerator (the dividend) but not a denominator', { size: 13, color: '#64748b' });
        V.text(svg, 280, 236, 'price falls → yield rises · payout does not move', { size: 13, weight: 700, color: V.C.rose });
        V.math(read, `$$EPS = \\frac{\\text{net income to common}}{\\text{weighted-average shares}} = \\frac{${V.trm(ni, 1)}\\text{m}}{${V.tn(sh, 1)}\\text{m}} = \\boxed{${V.trm(eps)}}$$` +
            `$$\\text{Dividend yield} = \\frac{D}{P} = \\frac{${V.tn(dps)}}{${V.tn(price)}} = \\boxed{${V.tp(yld)}}\\qquad \\text{Payout} = \\frac{D}{EPS} = ${eps > 0 ? `\\frac{${V.tn(dps)}}{${V.tn(eps)}} = \\boxed{${V.tp(pay, 1)}}` : '\\text{undefined}'}$$` +
            (eps <= 0 ? 'With zero or negative EPS the ordinary payout ratio is undefined or misleading: any dividend is coming from cash reserves or borrowing.'
                : pay > 1 ? `<span class="vis-verdict bad">payout above $100\\%$</span> The company pays out more than it earned. That needs other cash (reserves, borrowing, asset sales): investigate sustainability, but it does not by itself prove a cut is coming.`
                    : `Retained: $1 - ${V.tp(pay, 1)} = ${V.tp(1 - pay, 1)}$ of earnings ($${V.trm(eps - dps)}$ a share) stays in the company. EPS is profit per share, not cash paid per share.`));
    }
    draw();
};

// Foreign share: local-currency return and currency return compound into the ringgit return
ML_VIS.l6_fx = function (root) {
    const p0 = 100, s0 = 4.0;
    let p1 = 110, d = 2, s1 = 3.8;
    const svg = V.svg(560, 270), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('p', { class: 'vis-note', html: 'A Malaysian investor buys one foreign share for $\\text{USD}100$ when $\\text{USD}1 = \\text{RM}4.00$.' }),
        V.h('div', { class: 'vis-row' },
            V.slider('share price after one year (USD)', 60, 150, 1, p1, v => { p1 = v; draw(); }, v => 'USD' + v),
            V.slider('dividend received (USD)', 0, 6, 0.5, d, v => { d = v; draw(); }, v => 'USD' + v.toFixed(2)),
            V.slider('exchange rate at the end (RM per USD)', 3.2, 4.8, 0.05, s1, v => { s1 = v; draw(); }, v => 'RM' + v.toFixed(2))), svg, read);
    function draw() {
        V.clear(svg);
        const rl = (p1 + d - p0) / p0, rc = s1 / s0 - 1, rh = (1 + rl) * (1 + rc) - 1, r = V.rng(66);
        const bars = [['local return (USD)', rl, V.C.indigo, V.C.indigoS], ['currency return', rc, V.C.amber, V.C.amberS], ['interaction', rl * rc, V.C.slate, V.C.slateS], ['ringgit return', rh, rh >= 0 ? V.C.green : V.C.rose, rh >= 0 ? V.C.greenS : V.C.roseS]];
        const big = Math.max(0.1, ...bars.map(b => Math.abs(b[1]))), zero = 120, k = 80 / big;
        V.rline(svg, 30, zero, 540, zero, '#94a3b8', 1.4, r);
        bars.forEach(([t, v, c, f], i) => {
            const x = 50 + i * 125, h = v * k;
            V.rrect(svg, x, h >= 0 ? zero - h : zero, 90, Math.max(2, Math.abs(h)), c, f, r);
            V.text(svg, x + 45, h >= 0 ? zero - h - 12 : zero - h + 14, (v > 0 ? '+' : '') + V.pct(v, 2), { size: 14, weight: 700, color: c });
            V.text(svg, x + 45, 252, t, { size: 12, color: '#475569' });
            if (i < 3) V.text(svg, x + 107, zero, i < 2 ? '+' : '=', { size: 20, weight: 700, color: '#94a3b8' });
        });
        const costRM = p0 * s0, endRM = (p1 + d) * s1;
        const dir = rc > 0 ? 'The US dollar <b>strengthened</b> against the ringgit, adding to the return.' : rc < 0 ? 'The US dollar <b>weakened</b> against the ringgit, so each dollar converts into fewer ringgit.' : 'The exchange rate did not move.';
        V.math(read, `$$R_{\\text{USD}} = \\frac{${V.tn(p1, 0)} + ${V.tn(d)} - 100}{100} = ${V.tp(rl)},\\qquad R_{\\text{currency}} = \\frac{${s1.toFixed(2)}}{4.00} - 1 = ${V.tp(rc)}$$` +
            `$$1 + R_{\\text{RM}} = (1 + R_{\\text{USD}})(1 + R_{\\text{currency}}) = ${V.tn(1 + rl, 4)} \\times ${V.tn(1 + rc, 4)} = ${V.tn(1 + rh, 4)} \\;\\Rightarrow\\; R_{\\text{RM}} = \\boxed{${V.tp(rh)}}$$` +
            `Check in ringgit: cost $100 \\times 4.00 = \\text{RM}400$; proceeds $(${V.tn(p1, 0)} + ${V.tn(d)}) \\times ${s1.toFixed(2)} = ${V.trm(endRM)}$; return $\\dfrac{${V.tn(endRM)} - 400}{400} = ${V.tp(rh)}$. ${dir} ` +
            `Simply adding the two returns gives $${V.tp(rl + rc)}$; the gap, $${V.tp(rl * rc)}$, is the interaction $R_{\\text{USD}} \\times R_{\\text{currency}}$.` +
            (rl > 0 && rh < 0 ? ' <span class="vis-verdict bad">local gain, ringgit loss</span>' : ''));
    }
    draw();
};
// Chapter 7 visuals
ML_VIS.l7_dashboard = function (root) {
    // RM million except shares (million), price and dividends per share (RM) and growth (%)
    const FIELDS = [
        ['Income statement', [['sales', 'Sales'], ['ni', 'Net profit after tax'], ['ebit', 'EBIT'], ['interest', 'Interest expense']]],
        ['Balance sheet (year-end)', [['ca', 'Current assets'], ['inv', 'of which inventory'], ['ar', 'of which receivables'], ['cl', 'Current liabilities'], ['ta', 'Total assets'], ['ltd', 'Long-term debt'], ['eq', 'Stockholders\' equity']]],
        ['Shares and market', [['shares', 'Common shares (m)'], ['price', 'Share price (RM)'], ['div', 'Common dividends'], ['pref', 'Preferred dividends'], ['growth', 'EPS growth (%)']]],
    ];
    // The notes' integrated case (section 12); EBIT, interest and the share data are illustrative additions
    const PRESETS = {
        cur: { sales: 12, ni: 1.2, ebit: 2.0, interest: 0.3, ca: 4.8, inv: 2.5, ar: 2.0, cl: 3.4, ta: 8.0, ltd: 1.6, eq: 3.0, shares: 1, price: 15, div: 0.48, pref: 0, growth: 10 },
        prior: { sales: 10, ni: 1.0, ebit: 1.7, interest: 0.2, ca: 3.0, inv: 1.5, ar: 1.0, cl: 1.5, ta: 5.5, ltd: 1.0, eq: 3.0, shares: 1, price: 15, div: 0.40, pref: 0, growth: 10 },
    };
    let d = Object.assign({}, PRESETS.cur);
    const inputs = {};
    const groups = FIELDS.map(([title, fs]) => V.h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '6px 12px', margin: '4px 0 8px' } },
        V.h('b', { style: { gridColumn: '1 / -1', fontSize: '13px', color: '#334155' } }, title),
        ...fs.map(([k, label]) => {
            inputs[k] = V.numIn(d[k], v => { d[k] = v; draw(); }, { 'aria-label': label });
            return V.h('label', { style: { display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px', color: '#475569', fontWeight: 700 } }, label, inputs[k]);
        })));
    const load = k => { d = Object.assign({}, PRESETS[k]); Object.keys(inputs).forEach(f => { inputs[f].value = d[f]; }); draw(); };
    const table = V.h('div', { class: 'vis-table-wrap' }), read = V.h('div', { class: 'vis-readout' });
    root.append(V.h('p', { class: 'vis-note' }, 'Figures in RM million unless marked. Load a year of the integrated case, then edit any number. EBIT, interest and the share data are illustrative additions to the notes\' case.'),
        V.seg([['cur', 'Integrated case: current year'], ['prior', 'Integrated case: prior year']], 'cur', load), ...groups, table, read);

    const div = (a, b) => (b === 0 ? NaN : a / b);
    const calc = x => {
        const eps = div(x.ni - x.pref, x.shares), dps = div(x.div, x.shares), bvps = div(x.eq, x.shares), pe = div(x.price, eps), rt = div(x.sales, x.ar);
        return {
            cr: div(x.ca, x.cl), nwc: x.ca - x.cl, quick: div(x.ca - x.inv, x.cl),
            rt, days: div(365, rt), it: div(x.sales, x.inv), tat: div(x.sales, x.ta),
            de: div(x.ltd, x.eq), tie: div(x.ebit, x.interest),
            npm: div(x.ni, x.sales), roa: div(x.ni, x.ta), roe: div(x.ni, x.eq), em: div(x.ta, x.eq),
            eps, pe: eps > 0 ? pe : NaN, peg: eps > 0 && x.growth > 0 ? div(pe, x.growth) : NaN, dps, payout: eps > 0 ? div(dps, eps) : NaN,
            yld: div(dps, x.price), bvps, pb: bvps > 0 ? div(x.price, bvps) : NaN,
        };
    };
    const n = v => V.tn(v, 2), fr = (a, b) => `\\dfrac{${n(a)}}{${n(b)}}`;
    const T = v => (Number.isFinite(v) ? V.tn(v, 2) + '\\times' : '\\text{n/a}');
    const P = v => (Number.isFinite(v) ? V.tp(v, 1) : '\\text{n/a}');
    const M = v => (Number.isFinite(v) ? V.trm(v, 2) + '\\text{m}' : '\\text{n/a}');
    const S = v => (Number.isFinite(v) ? V.trm(v, 2) : '\\text{n/a}');
    const D = v => (Number.isFinite(v) ? V.tn(v, 1) + '\\ \\text{days}' : '\\text{n/a}');
    const X = v => (Number.isFinite(v) ? V.tn(v, 2) : '\\text{n/a}');
    // [family, name, formula with numbers, key, formatter, better direction (+1 higher, -1 lower, 0 none)]
    const ROWS = (x, c) => [
        ['Liquidity', 'Current ratio', `\\dfrac{CA}{CL} = ${fr(x.ca, x.cl)}`, 'cr', T, 1],
        ['Liquidity', 'Net working capital', `CA - CL = ${n(x.ca)} - ${n(x.cl)}`, 'nwc', M, 1],
        ['Liquidity', 'Quick ratio (extension)', `\\dfrac{CA - \\text{Inv}}{CL} = \\dfrac{${n(x.ca)} - ${n(x.inv)}}{${n(x.cl)}}`, 'quick', T, 1],
        ['Activity', 'Receivables turnover', `\\dfrac{\\text{sales}}{AR} = ${fr(x.sales, x.ar)}`, 'rt', T, 1],
        ['Activity', 'Collection period', `\\dfrac{365}{\\text{turnover}} = ${fr(365, c.rt)}`, 'days', D, -1],
        ['Activity', 'Inventory turnover', `\\dfrac{\\text{sales}}{\\text{Inv}} = ${fr(x.sales, x.inv)}`, 'it', T, 1],
        ['Activity', 'Total asset turnover', `\\dfrac{\\text{sales}}{TA} = ${fr(x.sales, x.ta)}`, 'tat', T, 1],
        ['Leverage', 'Debt-equity', `\\dfrac{\\text{LT debt}}{\\text{equity}} = ${fr(x.ltd, x.eq)}`, 'de', T, -1],
        ['Leverage', 'Times interest earned', `\\dfrac{EBIT}{\\text{interest}} = ${fr(x.ebit, x.interest)}`, 'tie', T, 1],
        ['Profitability', 'Net profit margin', `\\dfrac{NI}{\\text{sales}} = ${fr(x.ni, x.sales)}`, 'npm', P, 1],
        ['Profitability', 'Return on assets', `\\dfrac{NI}{TA} = ${fr(x.ni, x.ta)}`, 'roa', P, 1],
        ['Profitability', 'Return on equity', `\\dfrac{NI}{\\text{equity}} = ${fr(x.ni, x.eq)}`, 'roe', P, 0],
        ['Profitability', 'Equity multiplier', `\\dfrac{TA}{\\text{equity}} = ${fr(x.ta, x.eq)}`, 'em', T, 0],
        ['Per share', 'EPS', `\\dfrac{NI - \\text{pref.}}{\\text{shares}} = \\dfrac{${n(x.ni)} - ${n(x.pref)}}{${n(x.shares)}}`, 'eps', S, 0],
        ['Per share', 'P/E', `\\dfrac{P}{EPS} = ${fr(x.price, c.eps)}`, 'pe', T, 0],
        ['Per share', 'PEG', `\\dfrac{P/E}{g} = ${fr(c.pe, x.growth)}`, 'peg', X, 0],
        ['Per share', 'Dividends per share', `\\dfrac{\\text{dividends}}{\\text{shares}} = ${fr(x.div, x.shares)}`, 'dps', S, 0],
        ['Per share', 'Payout ratio', `\\dfrac{DPS}{EPS} = ${fr(c.dps, c.eps)}`, 'payout', P, 0],
        ['Per share', 'Dividend yield', `\\dfrac{DPS}{P} = ${fr(c.dps, x.price)}`, 'yld', P, 0],
        ['Per share', 'Book value per share', `\\dfrac{\\text{equity}}{\\text{shares}} = ${fr(x.eq, x.shares)}`, 'bvps', S, 0],
        ['Per share', 'Price-to-book', `\\dfrac{P}{BVPS} = ${fr(x.price, c.bvps)}`, 'pb', T, 0],
    ];
    function draw() {
        const c = calc(d), ref = calc(PRESETS.prior);
        let fam = '', html = '<table class="vis-table"><tr><th>Ratio</th><th>Formula with your numbers</th><th>Value</th><th>Prior year</th></tr>';
        ROWS(d, c).forEach(([f, name, form, key, fmt, dir]) => {
            if (f !== fam) { fam = f; html += `<tr class="ref"><td colspan="4"><b>${f}</b></td></tr>`; }
            const v = c[key], r = ref[key];
            const worse = dir && Number.isFinite(v) && Number.isFinite(r) && Math.abs(r) > 1e-9 && dir * (v - r) / Math.abs(r) < -0.05;
            html += `<tr><td>${name}</td><td>$${form}$</td><td${worse ? ' class="neg"' : ''}>$${fmt(v)}$</td><td>$${fmt(r)}$</td></tr>`;
        });
        V.math(table, html + '</table>');
        const other = Math.round((d.ta - d.cl - d.ltd - d.eq) * 1e6) / 1e6, g = (a, b) => (b ? (a - b) / b : NaN), pr = PRESETS.prior;
        const grow = [['sales', g(d.sales, pr.sales)], ['receivables', g(d.ar, pr.ar)], ['inventory', g(d.inv, pr.inv)]];
        V.math(read,
            `<div>DuPont check: $$ROE = \\underbrace{${P(c.npm)}}_{\\text{margin}} \\times \\underbrace{${T(c.tat)}}_{\\text{asset turnover}} \\times \\underbrace{${T(c.em)}}_{\\text{equity multiplier}} = ${P(c.npm * c.tat * c.em)}$$</div>` +
            `<div>Growth against the prior-year reference: ${grow.map(([k, v]) => `${k} $${P(v)}$`).join(', ')}. ` +
            (grow[1][1] > grow[0][1] + 0.05 || grow[2][1] > grow[0][1] + 0.05 ? '<b>Working capital is growing faster than sales</b>: check collections, credit terms and inventory quality (slide 7-54).' : 'Receivables and inventory are not outgrowing sales.') + '</div>' +
            `<div>Balance-sheet check: other liabilities implied $= TA - CL - \\text{LT debt} - \\text{equity} = ${M(other)}$${other < -1e-9 ? ' <b>(negative: the figures do not balance)</b>' : ''}. Red cells are weaker than the prior year in the usual reading; ROE and the market multiples are left uncoloured because a higher value can be good news or a warning.</div>`);
    }
    draw();
};

ML_VIS.l7_cash_bridge = function (root) {
    const PRE = {
        case: { ni: 1.2, dep: 0.3, ar: 1.0, inv: 1.0, ap: 0.9 },
        healthy: { ni: 1.2, dep: 0.3, ar: 0.1, inv: 0.0, ap: 0.1 },
    };
    let s = Object.assign({}, PRE.case);
    const f = v => (v < 0 ? '-' : '') + V.fmt(Math.abs(v), 1);
    const sl = {
        ni: V.slider('net income', 0, 3, 0.1, s.ni, v => { s.ni = v; draw(); }, f),
        dep: V.slider('depreciation (noncash)', 0, 1, 0.1, s.dep, v => { s.dep = v; draw(); }, f),
        ar: V.slider('increase in receivables', -1, 2, 0.1, s.ar, v => { s.ar = v; draw(); }, f),
        inv: V.slider('increase in inventory', -1, 2, 0.1, s.inv, v => { s.inv = v; draw(); }, f),
        ap: V.slider('increase in payables', -1, 2, 0.1, s.ap, v => { s.ap = v; draw(); }, f),
    };
    const load = k => { s = Object.assign({}, PRE[k]); Object.keys(sl).forEach(key => { sl[key].input.value = s[key]; sl[key].querySelector('output').textContent = f(s[key]); }); draw(); };
    const svg = V.svg(560, 300), read = V.h('div', { class: 'vis-readout' });
    root.append(V.h('p', { class: 'vis-note' }, 'RM million. The notes give net income 1.2 and operating cash flow 0.4 but not the reconciliation; the first preset is one illustrative split that fits.'),
        V.seg([['case', 'Integrated case (illustrative)'], ['healthy', 'Collections keep pace']], 'case', load),
        V.h('div', { class: 'vis-row' }, ...Object.values(sl)), svg, read);
    function draw() {
        V.clear(svg);
        const steps = [['net income', s.ni, 'start'], ['+ deprec.', s.dep, 'step'], ['- Δ receiv.', -s.ar, 'step'], ['- Δ invent.', -s.inv, 'step'], ['+ Δ payables', s.ap, 'step']];
        const cfo = s.ni + s.dep - s.ar - s.inv + s.ap;
        let run = 0;
        const bars = steps.map(([label, v, kind]) => { const a = kind === 'start' ? 0 : run, b = kind === 'start' ? v : run + v; run = b; return [label, v, a, b, kind]; });
        bars.push(['= CFO', cfo, 0, cfo, 'end']);
        const lo = Math.min(0, ...bars.map(b => Math.min(b[2], b[3]))), hi = Math.max(0.5, ...bars.map(b => Math.max(b[2], b[3])));
        const pad = (hi - lo) * 0.12, Y = v => 250 - (v - (lo - pad)) / (hi - lo + 2 * pad) * 215, r = V.rng(11), w = 62;
        V.rline(svg, 30, Y(0), 545, Y(0), '#94a3b8', 1.4, r);
        bars.forEach(([label, v, a, b, kind], i) => {
            const x = 40 + i * 85, top = Math.min(Y(a), Y(b)), h = Math.max(2, Math.abs(Y(a) - Y(b)));
            const col = kind === 'start' ? V.C.violet : kind === 'end' ? (cfo >= 0 ? V.C.green : V.C.red) : (v >= 0 ? V.C.green : V.C.rose);
            const fill = kind === 'start' ? V.C.violetS : kind === 'end' ? (cfo >= 0 ? V.C.greenS : V.C.roseS) : (v >= 0 ? V.C.greenS : V.C.roseS);
            V.rrect(svg, x, top, w, h, col, fill, r);
            if (i < bars.length - 1) svg.append(V.s('line', { x1: x + w, x2: x + 85, y1: Y(b), y2: Y(b), stroke: '#94a3b8', 'stroke-dasharray': '4 4', 'stroke-width': 1.2 }));
            V.text(svg, x + w / 2, top - 11, (v > 0 && kind === 'step' ? '+' : '') + f(v), { size: 13, weight: 700, color: col });
            V.text(svg, x + w / 2, 284, label, { size: 12, color: '#475569' });
        });
        const conv = s.ni ? cfo / s.ni : NaN;
        V.math(read, `$$CFO = NI + \\text{dep.} - \\Delta AR - \\Delta \\text{Inv} + \\Delta AP = ${V.tn(s.ni, 1)} + ${V.tn(s.dep, 1)} - ${V.par(V.tn(s.ar, 1))} - ${V.par(V.tn(s.inv, 1))} + ${V.par(V.tn(s.ap, 1))} = \\boxed{${V.tn(cfo, 1)}}$$` +
            `Cash conversion $\\dfrac{CFO}{NI} = ${Number.isFinite(conv) ? V.tp(conv, 0) : '\\text{n/a}'}$. ` +
            (cfo < s.ni ? 'Operating cash is <b>below</b> profit: sales booked on credit and stock built up have absorbed cash. That is a question to investigate (seasonality? looser credit? slow-moving stock?), not proof of trouble.' : 'Operating cash is at or above profit: working capital is not absorbing cash this year.'));
    }
    draw();
};

ML_VIS.l7_leverage = function (root) {
    const TA = 10;
    let eq = 4, roa = 0.10;
    const svg = V.svg(560, 300), read = V.h('div', { class: 'vis-readout' });
    root.append(V.h('p', { class: 'vis-note' }, 'Total assets are fixed at RM10 million. Firm A has RM8 million of equity, Firm B RM4 million (the notes\' example). Set your own equity and ROA.'),
        V.h('div', { class: 'vis-row' },
            V.slider('your equity (RM m)', 2, 10, 0.5, eq, v => { eq = v; draw(); }, v => V.fmt(v, 1)),
            V.slider('ROA', -10, 20, 1, roa * 100, v => { roa = v / 100; draw(); }, v => v + '%')), svg, read);
    function draw() {
        V.clear(svg);
        const c = V.chart(svg, { x0: 70, x1: 520, y0: 262, y1: 62, X: [-10, 20], Y: [-60, 100], xticks: [-10, 0, 10, 20], yticks: [-50, 0, 50, 100], fx: t => t + '%', fy: t => t + '%', xlabel: 'ROA', ylabel: 'ROE' });
        svg.append(V.s('line', { x1: c.X(-10), x2: c.X(20), y1: c.Y(0), y2: c.Y(0), stroke: '#94a3b8', 'stroke-width': 1.2 }));
        const line = (em, col, extra) => {
            const a = Math.max(-10, -60 / em), b = Math.min(20, 100 / em);   // keep ROE inside the plotted range
            return V.path(svg, [[c.X(a), c.Y(a * em)], [c.X(b), c.Y(b * em)]], col, 2.2, extra);
        };
        line(1, '#94a3b8', { 'stroke-dasharray': '2 5' });
        line(TA / 8, V.C.slate, { 'stroke-dasharray': '7 5' });
        line(TA / 4, V.C.rose, { 'stroke-dasharray': '7 5' });
        const em = TA / eq;
        line(em, V.C.violet);
        const roe = roa * em;
        if (roe * 100 >= -60 && roe * 100 <= 100) V.dot(svg, c.X(roa * 100), c.Y(roe * 100), V.C.violet, 7);
        [['all equity (EM 1)', '#94a3b8'], ['Firm A (EM 1.25)', V.C.slate], ['Firm B (EM 2.5)', V.C.rose], [`you (EM ${V.fmt(em, 2)})`, V.C.violet]]
            .forEach(([t, col], i) => V.text(svg, 90 + i * 118, 14, t, { size: 12, weight: 700, color: col, anchor: 'start' }));
        const roeA = roa * TA / 8, roeB = roa * TA / 4;
        V.math(read, `$$EM = \\frac{\\text{assets}}{\\text{equity}} = \\frac{10}{${V.tn(eq, 1)}} = ${V.tn(em, 2)},\\qquad ROE = ROA \\times EM = ${V.tp(roa, 0)} \\times ${V.tn(em, 2)} = \\boxed{${V.tp(roe, 1)}}$$` +
            `At this ROA, Firm A earns $ROE = ${V.tp(roeA, 1)}$ and Firm B $${V.tp(roeB, 1)}$. ` +
            (roa < 0 ? '<b>In a loss year leverage works in reverse</b>: the thinner the equity, the bigger the percentage loss to shareholders.' : 'A steeper line means each point of ROA is magnified more, upwards now and downwards in a bad year.') +
            ' This holds net profit fixed, as the notes do; in reality extra debt also adds interest, which lowers profit and ROA.');
    }
    draw();
};
// Chapter 8 visuals: stock valuation
(function () {
    const verdict = (value, price) => {
        if (!Number.isFinite(value)) return '';
        const gap = (value - price) / price;
        if (Math.abs(gap) < 0.02) return `<span class="vis-verdict even">about fairly valued</span> the estimate is within $2\\%$ of the price`;
        return gap > 0
            ? `<span class="vis-verdict good">potentially undervalued</span> the estimate is $${V.tp(gap, 1)}$ above the price`
            : `<span class="vis-verdict bad">potentially overvalued</span> the estimate is $${V.tp(-gap, 1)}$ below the price`;
    };
    const show = (el, on) => { el.style.display = on ? '' : 'none'; };
    // Money keeps its cents (RM1.20, not RM1.2); dividends show 2 to 4 decimals
    const fx = (n, lo, hi) => Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: lo, maximumFractionDigits: hi });
    const rm2 = (n, d = 2) => Number.isFinite(n) ? (n < 0 ? '-RM' : 'RM') + fx(n, d, d) : '-';
    const tn2 = (n, d = 2) => Number.isFinite(n) ? (n < 0 ? '-' : '') + fx(n, d, d).replace(/,/g, '{,}') : '\\infty';
    const trm2 = (n, d = 2) => Number.isFinite(n) ? (n < 0 ? '-' : '') + '\\text{RM}' + fx(n, d, d).replace(/,/g, '{,}') : '\\infty';
    const tnv = n => Number.isFinite(n) ? (n < 0 ? '-' : '') + fx(n, 2, 4).replace(/,/g, '{,}') : '\\infty';
    const halo = t => { t.setAttribute('stroke', '#fff'); t.setAttribute('stroke-width', 4); t.setAttribute('paint-order', 'stroke'); return t; };

    // ---------------------------------------------------------------- forecast chain
    ML_VIS.l8_chain = function (root) {
        let s0 = 100, gs = 8, m = 6, n = 2, pay = 40, pe = 17.5;
        const svg = V.svg(560, 250), read = V.h('p', { class: 'vis-readout' });
        root.append(V.h('div', { class: 'vis-row' },
            V.slider('last year\'s sales', 20, 300, 5, s0, v => { s0 = v; draw(); }, v => 'RM' + v + 'm'),
            V.slider('sales growth', -20, 30, 0.5, gs, v => { gs = v; draw(); }, v => v + '%'),
            V.slider('net profit margin', -5, 20, 0.5, m, v => { m = v; draw(); }, v => v + '%')),
            V.h('div', { class: 'vis-row' },
            V.slider('common shares', 0.5, 10, 0.1, n, v => { n = v; draw(); }, v => V.fmt(v, 1) + 'm'),
            V.slider('payout ratio', 0, 100, 5, pay, v => { pay = v; draw(); }, v => v + '%'),
            V.slider('year-end P/E', 4, 40, 0.5, pe, v => { pe = v; draw(); }, v => V.fmt(v, 1) + 'x')), svg, read);
        function box(x, y, w, h, title, val, col, fill, r) {
            V.rrect(svg, x, y, w, h, col, fill, r);
            V.text(svg, x + w / 2, y + 20, title, { size: 13, color: '#475569' });
            V.text(svg, x + w / 2, y + 44, val, { size: 15, weight: 700, color: col });
        }
        function draw() {
            V.clear(svg);
            const r = V.rng(81), C = V.C;
            const s1 = s0 * (1 + gs / 100), np = s1 * m / 100, eps = np / n, loss = eps <= 0;
            const d1 = loss ? 0 : eps * pay / 100, p1 = loss ? NaN : eps * pe;
            box(6, 92, 104, 64, 'Sales', V.rm(s1, 1) + 'm', C.sky, C.skyS, r);
            box(146, 92, 104, 64, 'Net profit', rm2(np, 2) + 'm', loss ? C.red : C.indigo, loss ? C.roseS : C.indigoS, r);
            box(286, 92, 104, 64, 'EPS', rm2(eps, 2), loss ? C.red : C.violet, loss ? C.roseS : C.violetS, r);
            box(440, 14, 114, 64, 'Dividend D₁', rm2(d1, 3), C.amber, C.amberS, r);
            box(440, 170, 114, 64, 'Price P₁', loss ? 'n/m' : rm2(p1, 2), loss ? C.slate : C.green, loss ? C.slateS : C.greenS, r);
            V.arrow(svg, 112, 128, 142, 128, '#64748b', 1.6, r); V.text(svg, 127, 80, 'x ' + m + '%', { size: 12, color: '#475569' });
            V.arrow(svg, 252, 128, 282, 128, '#64748b', 1.6, r); V.text(svg, 267, 80, '÷ ' + V.fmt(n, 1) + 'm', { size: 12, color: '#475569' });
            V.arrow(svg, 392, 112, 436, 60, C.amber, 1.6, r); V.text(svg, 404, 66, 'x ' + pay + '%', { size: 12, color: C.amber, anchor: 'end' });
            V.arrow(svg, 392, 144, 436, 196, C.green, 1.6, r); V.text(svg, 404, 196, 'x ' + V.fmt(pe, 1), { size: 12, color: C.green, anchor: 'end' });
            V.text(svg, 58, 176, 'from ' + V.rm(s0, 0) + 'm', { size: 12, color: '#64748b' });
            V.text(svg, 200, 230, 'all values are year-1 forecasts', { size: 13, color: '#64748b' });
            const lossNote = loss ? `<br><b>Profit is zero or negative:</b> EPS $\\le 0$, so a payout ratio of a loss means nothing and a P/E applied to negative EPS is <b>not meaningful</b> (n/m). This is where a price-to-sales multiple or a cash-flow forecast takes over.` : '';
            V.math(read, `$$\\begin{aligned}\\text{Sales}_1 &= ${V.tn(s0, 0)}(1 ${gs < 0 ? '-' : '+'} ${V.tn(Math.abs(gs) / 100, 3)}) = ${trm2(s1, 2)}\\text{m}\\\\` +
                `\\text{Net profit}_1 &= ${V.tn(s1, 2)} \\times ${V.tp(m / 100, 1)} = ${V.trm(np, 3)}\\text{m}\\\\` +
                `EPS_1 &= \\dfrac{${V.tn(np, 3)}\\text{m}}{${V.tn(n, 1)}\\text{m shares}} = ${V.trm(eps, 3)}\\\\` +
                (loss ? '' : `D_1 &= ${V.tn(eps, 3)} \\times ${V.tp(pay / 100, 0)} = \\boxed{${trm2(d1, 3)}}\\\\` +
                `P_1 &= ${V.tn(eps, 3)} \\times ${V.tn(pe, 1)} = \\boxed{${trm2(p1, 2)}}`) +
                `\\end{aligned}$$` +
                (loss ? lossNote : `Both boxed numbers arrive at the <b>end of year 1</b>. The notes' firm ($\\text{RM}100$m, $8\\%$, $6\\%$, $2$m shares, $40\\%$, $17.5$) gives $\\text{RM}1.296$ and $\\text{RM}56.70$. Raise the share count with profit unchanged and EPS, the dividend and the price all fall: <b>dilution</b>.`));
        }
        draw();
    };

    // ---------------------------------------------------------------- one-year valuation
    ML_VIS.l8_oneyear = function (root) {
        let d1 = 1.2, p1 = 24, k = 12, p0 = 22, mode = 'direct', rf = 5.5, beta = 1.3, rm = 15;
        const svg = V.svg(560, 250), read = V.h('p', { class: 'vis-readout' });
        const kRow = V.h('div', { class: 'vis-row' }, V.slider('required return k', 2, 25, 0.25, k, v => { k = v; draw(); }, v => V.fmt(v, 2) + '%'));
        const capmRow = V.h('div', { class: 'vis-row' },
            V.slider('risk-free rate', 0, 10, 0.5, rf, v => { rf = v; draw(); }, v => v + '%'),
            V.slider('beta β', 0, 2.5, 0.05, beta, v => { beta = v; draw(); }, v => v.toFixed(2)),
            V.slider('expected market return', 2, 20, 0.5, rm, v => { rm = v; draw(); }, v => v + '%'));
        root.append(V.h('div', { class: 'vis-row' },
            V.slider('dividend D₁ (end of year 1)', 0, 5, 0.05, d1, v => { d1 = v; draw(); }, v => 'RM' + V.fmt(v, 2)),
            V.slider('sale price P₁ (end of year 1)', 5, 60, 0.5, p1, v => { p1 = v; draw(); }, v => 'RM' + V.fmt(v, 2)),
            V.slider('market price today P₀', 5, 60, 0.5, p0, v => { p0 = v; draw(); }, v => 'RM' + V.fmt(v, 2))),
            V.seg([['direct', 'set k directly'], ['capm', 'k from CAPM']], mode, v => { mode = v; draw(); }), kRow, capmRow, svg, read);
        function draw() {
            show(kRow, mode === 'direct'); show(capmRow, mode === 'capm');
            V.clear(svg);
            const kk = mode === 'capm' ? (rf + beta * (rm - rf)) / 100 : k / 100;
            const v0 = (d1 + p1) / (1 + kk), er = (d1 + p1 - p0) / p0, r = V.rng(82), C = V.C;
            const top = Math.max(d1 + p1, p0, v0) * 1.12, base = 205, H = 170, sc = v => v / top * H;
            V.rline(svg, 30, base, 540, base, '#94a3b8', 1.4, r);
            V.text(svg, 130, base + 18, 't0 (today)', { size: 13, color: '#64748b' });
            V.text(svg, 430, base + 18, 't1 (one year later)', { size: 13, color: '#64748b' });
            // payoff at t1
            V.rrect(svg, 395, base - sc(p1), 70, sc(p1), C.sky, C.skyS, r);
            if (d1 > 0) V.rrect(svg, 395, base - sc(p1 + d1), 70, Math.max(2, sc(d1)), C.amber, C.amberS, r);
            V.text(svg, 470, base - sc(p1) / 2, 'P₁ ' + rm2(p1), { size: 12, anchor: 'start', color: C.sky });
            V.text(svg, 470, base - sc(p1 + d1) - 2, 'D₁ ' + rm2(d1), { size: 12, anchor: 'start', color: C.amber });
            // value and price at t0
            V.rrect(svg, 75, base - sc(v0), 60, sc(v0), C.green, C.greenS, r);
            V.text(svg, 105, base - sc(v0) - 12, 'V₀ ' + rm2(v0), { size: 13, weight: 700, color: C.green });
            V.rrect(svg, 150, base - sc(p0), 50, sc(p0), C.slate, C.slateS, r);
            V.text(svg, 175, base - sc(p0) - 12, 'P₀ ' + rm2(p0), { size: 13, weight: 700, color: C.slate });
            V.arrow(svg, 385, base - sc(p1 + d1) + 10, 215, base - sc(v0) + 18, C.rose, 1.6, r);
            V.text(svg, 300, base - Math.max(sc(p1 + d1), sc(v0)) - 6, '÷ (1 + k) = ÷ ' + V.fmt(1 + kk, 4), { size: 13, color: C.rose });
            const naiveBuy = p0 < p1, rightBuy = v0 > p0;
            const capmLine = mode === 'capm' ? `$$k = r_f + \\beta\\,[E(R_m) - r_f] = ${V.tp(rf / 100, 1)} + ${beta.toFixed(2)}(${V.tp(rm / 100, 1)} - ${V.tp(rf / 100, 1)}) = \\boxed{${V.tp(kk, 2)}}$$` : '';
            V.math(read, capmLine +
                `$$V_0 = \\frac{D_1 + P_1}{1+k} = \\frac{${tnv(d1)} + ${tn2(p1)}}{${V.tn(1 + kk, 4)}} = \\boxed{${trm2(v0)}}\\qquad E(R) = \\frac{D_1 + P_1 - P_0}{P_0} = \\frac{${tnv(d1)} + ${tn2(p1)} - ${tn2(p0)}}{${tn2(p0)}} = \\boxed{${V.tp(er)}}$$` +
                `${verdict(v0, p0)}. The two tests always agree: $V_0 ${v0 >= p0 ? '\\ge' : '&lt;'} P_0$ and $E(R) ${er >= kk ? '\\ge' : '&lt;'} k = ${V.tp(kk, 2)}$. ` +
                (naiveBuy !== rightBuy
                    ? `<b>Watch the trap:</b> the naive rule "$P_0 ${naiveBuy ? '&lt;' : '\\ge'} P_1$, so ${naiveBuy ? 'buy' : 'do not buy'}" gives the <b>wrong</b> answer here, because it ignores the dividend, the wait and $k$.`
                    : `Comparing $P_0$ with $P_1$ directly happens to agree here, but only by luck: it ignores the dividend, the wait and $k$.`));
        }
        draw();
    };

    // ---------------------------------------------------------------- dividend valuation model
    function dvm(root, startMode) {
        const two = startMode === 'two';
        let mode = startMode, D = two ? 1 : 2, dType = 'D0', g = 4, k = two ? 12 : 10, price = two ? 17 : 30, g1 = 20, n1 = 2;
        const svg = V.svg(560, 300), read = V.h('p', { class: 'vis-readout' });
        const dSlider = V.slider('dividend', 0.1, 5, 0.05, D, v => { D = v; draw(); }, v => 'RM' + V.fmt(v, 2));
        const typeSeg = V.seg([['D0', 'it is D₀ (just paid)'], ['D1', 'it is D₁ (next year)']], dType, v => { dType = v; draw(); });
        const gSlider = V.slider('growth g (long run)', -5, 15, 0.25, g, v => { g = v; draw(); }, v => V.fmt(v, 2) + '%');
        const twoRow = V.h('div', { class: 'vis-row' },
            V.slider('high growth g₁', -10, 40, 1, g1, v => { g1 = v; draw(); }, v => v + '%'),
            V.slider('years of high growth n', 1, 8, 1, n1, v => { n1 = v; draw(); }));
        root.append(V.seg([['zero', 'zero growth'], ['const', 'constant growth'], ['two', 'two-stage growth']], mode, v => { mode = v; draw(); }),
            V.h('div', { class: 'vis-row' }, dSlider, gSlider,
                V.slider('required return k', 1, 25, 0.25, k, v => { k = v; draw(); }, v => V.fmt(v, 2) + '%'),
                V.slider('market price', 1, 100, 0.5, price, v => { price = v; draw(); }, v => 'RM' + V.fmt(v, 2))),
            typeSeg, twoRow, svg, read);
        function draw() {
            show(twoRow, mode === 'two'); show(gSlider, mode !== 'zero');
            dSlider.querySelector('span').textContent = mode === 'zero' ? 'level dividend D' : 'dividend';
            V.clear(svg);
            const kk = k / 100, gg = mode === 'zero' ? 0 : g / 100, G1 = g1 / 100, r = V.rng(83), C = V.C;
            // dividend stream and value
            let divs = [], value = NaN, tv = NaN, pvTv = 0, valid = true, Nshow, d1;
            if (mode === 'two') {
                const first = dType === 'D0' ? D * (1 + G1) : D;
                for (let t = 1; t <= n1; t++) divs.push(first * (1 + G1) ** (t - 1));
                const dn1 = divs[n1 - 1] * (1 + gg);
                valid = kk > gg;
                Nshow = Math.min(12, n1 + 4);
                for (let t = n1 + 1; t <= Nshow; t++) divs.push(divs[n1 - 1] * (1 + gg) ** (t - n1));
                if (valid) { tv = dn1 / (kk - gg); pvTv = tv / (1 + kk) ** n1; value = divs.slice(0, n1).reduce((a, d, i) => a + d / (1 + kk) ** (i + 1), 0) + pvTv; }
                d1 = divs[0];
            } else {
                d1 = mode === 'zero' ? D : (dType === 'D0' ? D * (1 + gg) : D);
                Nshow = 10;
                for (let t = 1; t <= Nshow; t++) divs.push(d1 * (1 + gg) ** (t - 1));
                valid = kk > gg;
                if (valid) value = d1 / (kk - gg);
            }
            // top panel: each dividend and its present value
            const maxD = Math.max(...divs.map(Math.abs), 0.01), x0 = 50, bw = 470 / Nshow, base = 170, H = 120;
            V.rline(svg, 30, base, 540, base, '#94a3b8', 1.4, r);
            divs.forEach((d, i) => {
                const t = i + 1, h = Math.max(0, d) / maxD * H, pv = Math.max(0, d) / (1 + kk) ** t, hp = pv / maxD * H, x = x0 + i * bw + 3;
                const hi = mode === 'two' && t <= n1, col = hi ? C.amber : C.sky, fill = hi ? C.amberS : C.skyS;
                V.rrect(svg, x, base - h, bw - 6, h, col, fill, r);
                svg.append(V.s('rect', { x: x + 3, y: base - hp, width: Math.max(0, bw - 12), height: hp, fill: col, opacity: 0.55 }));
                V.text(svg, x + (bw - 6) / 2, base + 14, 't' + t, { size: 11, color: '#64748b' });
            });
            V.text(svg, 535, base - 10, '...', { size: 18, color: C.sky, anchor: 'end' });
            V.text(svg, 40, 16, 'outline = dividend in that year · solid = its present value today', { size: 12, color: '#475569', anchor: 'start' });
            // bottom panel: what the value is made of
            const by = 230;
            if (!valid) {
                V.text(svg, 280, by + 12, 'k ≤ g: this perpetual-growth model gives no finite value', { size: 15, weight: 700, color: C.red });
            } else {
                const top = Math.max(value, price) * 1.08, X = v => 40 + v / top * 480;
                if (mode === 'two') {
                    const explicit = value - pvTv;
                    V.rrect(svg, X(0), by, X(explicit) - X(0), 26, C.amber, C.amberS, r);
                    V.rrect(svg, X(explicit), by, X(value) - X(explicit), 26, C.indigo, C.indigoS, r);
                    V.text(svg, X(value) - 6, by + 13, 'PV of terminal value ' + V.pct(pvTv / value, 0), { size: 12, color: C.indigo, anchor: 'end' });
                } else {
                    const n10 = divs.reduce((a, d, i) => a + d / (1 + kk) ** (i + 1), 0);
                    V.rrect(svg, X(0), by, X(n10) - X(0), 26, C.sky, C.skyS, r);
                    V.rrect(svg, X(n10), by, X(value) - X(n10), 26, C.indigo, C.indigoS, r);
                    V.text(svg, X(n10) + 6, by + 13, 'years 11 on: ' + V.pct((value - n10) / value, 0), { size: 12, color: C.indigo, anchor: 'start' });
                    V.text(svg, X(0) + 6, by - 8, 'years 1-10', { size: 12, color: C.sky, anchor: 'start' });
                }
                V.text(svg, X(value), by + 44, 'V₀ ' + rm2(value), { size: 13, weight: 700, color: C.green, anchor: X(value) > 470 ? 'end' : 'middle' });
                svg.append(V.s('line', { x1: X(price), x2: X(price), y1: by - 14, y2: by + 34, stroke: C.rose, 'stroke-width': 2.4, 'stroke-dasharray': '5 4' }));
                V.text(svg, X(price), by - 22, 'price ' + rm2(price), { size: 12, weight: 700, color: C.rose, anchor: X(price) > 480 ? 'end' : 'middle' });
            }
            // readout
            let html = '';
            if (mode === 'zero') {
                html = `$$V_0 = \\frac{D}{k} = \\frac{${tnv(D)}}{${V.tn(kk, 4)}} = \\boxed{${trm2(value)}}$$` +
                    `A level dividend forever, first payment one year from now (with no growth, $D_0 = D_1 = D$, so the timing switch changes nothing). Implied return at the market price: $D / P_0 = ${V.tp(D / price)}$.`;
            } else if (mode === 'const') {
                const step1 = dType === 'D0' ? `$$D_1 = D_0(1+g) = ${tnv(D)}(${V.tn(1 + gg, 4)}) = ${trm2(d1, 4)}$$` : `$D_1 = ${trm2(D)}$ is already next year's dividend: do <b>not</b> grow it again.`;
                const ratio = (1 + gg) / (1 + kk);
                html = step1 + (valid
                    ? `$$V_0 = \\frac{D_1}{k-g} = \\frac{${tnv(d1)}}{${V.tn(kk, 4)} - ${V.par(V.tn(gg, 4))}} = \\boxed{${trm2(value)}}$$` +
                      `Return implied by the market price: $\\dfrac{D_1}{P_0} + g = ${V.tp(d1 / price)} + ${V.tp(gg)} = ${V.tp(d1 / price + gg)}$ against $k = ${V.tp(kk)}$. ` +
                      `Each year's dividend is worth $\\frac{1+g}{1+k} = ${V.tn(ratio, 4)}$ times the previous one in present value, so the sum converges.` +
                      (dType === 'D0' ? ` Using $D_0$ by mistake would give $${trm2(D / (kk - gg))}$.` : '')
                    : `With $k = ${V.tp(kk)} \\le g = ${V.tp(gg)}$, each later dividend is worth $\\frac{1+g}{1+k} = ${V.tn(ratio, 4)} \\ge 1$ times the previous one in present value: the sum never settles. The formula's ${kk === gg ? 'zero' : 'negative'} denominator does <b>not</b> mean the share is worth ${kk === gg ? 'infinity' : 'a negative amount'}; it means this model does not fit. Revisit the long-run growth or use a multi-stage model.`);
            } else {
                const n = n1, dn = divs[n - 1], dn1 = dn * (1 + gg);
                const list = divs.slice(0, n).map((d, i) => `D_{${i + 1}} = ${tnv(d)}`);
                const shown = n <= 4 ? list.join(',\\ ') : list.slice(0, 2).join(',\\ ') + ',\\ \\dots,\\ ' + list[n - 1];
                const pvTerms = n <= 3 ? divs.slice(0, n).map((d, i) => i === n - 1 ? `\\frac{${tnv(d)} + ${tn2(tv)}}{${V.tn(1 + kk, 2)}^{${i + 1}}}` : `\\frac{${tnv(d)}}{${V.tn(1 + kk, 2)}^{${i + 1}}}`).join(' + ') : `\\sum_{t=1}^{${n}}\\frac{D_t}{${V.tn(1 + kk, 2)}^t} + \\frac{${tn2(tv)}}{${V.tn(1 + kk, 2)}^{${n}}}`;
                html = `High growth: ${dType === 'D0' ? '$D_t = D_0(1+g_1)^t$' : '$D_1$ is given, so $D_t = D_1(1+g_1)^{t-1}$'} gives $${shown}$. First stable dividend: $D_{${n + 1}} = D_{${n}}(1+g) = ${tnv(dn1)}$.` +
                    (valid
                        ? `$$P_{${n}} = \\frac{D_{${n + 1}}}{k-g} = \\frac{${tnv(dn1)}}{${V.tn(kk, 4)} - ${V.par(V.tn(gg, 4))}} = ${trm2(tv)}\\ \\text{(a value at year } ${n}\\text{)}$$` +
                          `$$V_0 = ${pvTerms} = \\boxed{${trm2(value)}}$$` +
                          `The terminal value supplies <b>$${V.tp(pvTv / value, 0)}$</b> of today's value: the long-run assumptions dominate.`
                        : `<br>With $k = ${V.tp(kk)} \\le g = ${V.tp(gg)}$ the terminal value has no finite answer: the stable-phase growth must be below the required return.`);
            }
            if (valid) html += `<br>${verdict(value, price)} at a market price of $${trm2(price)}$, under these assumptions only.`;
            V.math(read, html);
        }
        draw();
    }
    ML_VIS.l8_dvm = root => dvm(root, 'const');
    ML_VIS.l8_twostage = root => dvm(root, 'two');

    // ---------------------------------------------------------------- relative valuation
    ML_VIS.l8_multiples = function (root) {
        const rows = [
            { key: 'P/E', what: 'EPS', v: 2.5, m: 12, col: V.C.indigo },
            { key: 'P/CF', what: 'cash flow per share', v: 4, m: 8, col: V.C.sky },
            { key: 'P/S', what: 'sales per share', v: 20, m: 1.2, col: V.C.amber },
            { key: 'P/B', what: 'book value per share', v: 10, m: 2.5, col: V.C.violet },
        ];
        let price = 28;
        const svg = V.svg(560, 200), read = V.h('p', { class: 'vis-readout' });
        root.append(V.h('p', { class: 'vis-note' }, 'Per-share figure (RM) and the multiple chosen from comparable firms. Defaults: Delta from the subjective notes.'));
        rows.forEach(rw => root.append(V.h('div', { class: 'vis-returns' }, V.h('b', {}, rw.key),
            V.h('span', {}, rw.what), V.numIn(rw.v, x => { rw.v = x; draw(); }, { 'aria-label': rw.what }),
            V.h('span', {}, 'x multiple'), V.numIn(rw.m, x => { rw.m = x; draw(); }, { 'aria-label': rw.key + ' multiple' }))));
        root.append(V.h('div', { class: 'vis-row' }, V.slider('market price', 1, 80, 0.5, price, v => { price = v; draw(); }, v => 'RM' + V.fmt(v, 2))), svg, read);
        function draw() {
            V.clear(svg);
            const r = V.rng(84), C = V.C;
            const ok = rows.filter(rw => rw.v > 0 && rw.m > 0).map(rw => Object.assign({ p: rw.v * rw.m }, rw));
            const vals = ok.map(o => o.p).concat([price]), lo = 0, hi = Math.max(...vals) * 1.12;
            const X = v => 40 + (v - lo) / (hi - lo) * 490, y = 110;
            V.arrow(svg, 30, y, 540, y, '#94a3b8', 1.4, r);
            [0, hi / 2, hi].forEach(t => V.text(svg, X(t), y + 64, V.rm(t, 0), { size: 12, color: '#64748b' }));
            if (ok.length) {
                const mn = Math.min(...ok.map(o => o.p)), mx = Math.max(...ok.map(o => o.p));
                svg.append(V.s('rect', { x: X(mn), y: y - 8, width: Math.max(2, X(mx) - X(mn)), height: 16, fill: V.C.greenS, opacity: 0.9 }));
            }
            ok.slice().sort((a, b) => a.p - b.p).forEach((o, i) => {
                const up = i % 2 === 0, ly = up ? y - 26 - (i % 4 === 2 ? 20 : 0) : y + 28 + (i % 4 === 3 ? 18 : 0);
                V.dot(svg, X(o.p), y, o.col, 6, '#fff');
                halo(V.text(svg, X(o.p), ly, o.key + ' ' + rm2(o.p), { size: 12, weight: 700, color: o.col }));
            });
            svg.append(V.s('line', { x1: X(price), x2: X(price), y1: 18, y2: y + 40, stroke: C.rose, 'stroke-width': 2.4, 'stroke-dasharray': '5 4' }));
            V.text(svg, X(price), 12, 'market ' + rm2(price), { size: 12, weight: 700, color: C.rose, anchor: X(price) > 470 ? 'end' : X(price) < 90 ? 'start' : 'middle' });
            const lines = rows.map(rw => {
                if (!(rw.v > 0)) return `\\text{${rw.key}:}\\ & \\text{not meaningful (the ${rw.what} is } ${tnv(rw.v)} \\le 0)`;
                if (!(rw.m > 0)) return `\\text{${rw.key}:}\\ & \\text{enter a positive multiple}`;
                return `\\text{${rw.key}:}\\ & ${V.tn(rw.m)} \\times ${trm2(rw.v)} = ${trm2(rw.v * rw.m)} \\qquad \\text{market: } \\tfrac{${tn2(price)}}{${tnv(rw.v)}} = ${V.tn(price / rw.v)}\\times`;
            });
            let tail = '';
            if (ok.length) {
                const ps = ok.map(o => o.p), mn = Math.min(...ps), mx = Math.max(...ps), below = ps.filter(p => p > price).length;
                tail = `The estimates run from $${trm2(mn)}$ to $${trm2(mx)}$ (median $${trm2(V.median(ps))}$). The price is below <b>${below}</b> of ${ps.length} of them. ` +
                    (below === ps.length ? 'Every multiple points the same way, but all of them share the same peer group: check growth, risk, debt and accounting before calling it cheap.'
                        : below === 0 ? 'Every multiple puts the price above the estimates; still, peers may be mispriced or not truly comparable.'
                            : '<b>The verdict depends on the multiple you choose</b>: the methods disagree, so no single number proves under- or overvaluation.');
            }
            V.math(read, `$$\\begin{aligned}${lines.join('\\\\')}\\end{aligned}$$` + tail + ' A negative EPS makes P/E meaningless; P/S still works, but sales do not show the margin.');
        }
        draw();
    };
})();
// Chapter 9 visuals
(function () {
    const setSlider = (sl, v, fmt) => { sl.input.value = v; sl.querySelector('output').textContent = fmt(v); };
    const sgn = (v, d = 2) => (v > 0 ? '+' : '') + V.tn(v, d);
    // a computed value cell that lines up with the number inputs above it
    const cell = () => V.h('span', { class: 'vis-num', style: { display: 'inline-block', padding: '0 5px' } });
    // narrow side padding so four-digit values stay visible in the five-column grid on a phone
    // (a text input with a decimal keypad: a number input's spinner would hide the digits)
    const TIGHT = { type: 'text', inputmode: 'decimal', style: { padding: '6px 4px', fontSize: '12.5px' } };

    // ------------------------------------------------------------------ abnormal return
    ML_VIS.l9_abnormal = function (root) {
        let act = 12, exp = 10, cost = 1.5;
        const fp = v => v.toFixed(1) + '%', fc = v => v.toFixed(1) + ' points';
        const svg = V.svg(560, 290), read = V.h('div', { class: 'vis-readout' });
        const sA = V.slider('actual return', -10, 30, 0.1, act, v => { act = v; draw(); }, fp);
        const sE = V.slider('expected return for its risk', -10, 30, 0.1, exp, v => { exp = v; draw(); }, fp);
        const sC = V.slider('trading costs', 0, 5, 0.1, cost, v => { cost = v; draw(); }, fc);
        const presets = {
            notes: [12, 10, 1.5], q2: [3.2, 2.4, 0.5], trap: [15, 16, 0.5], down: [-4, -7, 0.5],
        };
        root.append(
            V.seg([['notes', 'Notes: 12% vs 10%'], ['q2', 'Subjective Q2: 3.2% vs 2.4%'], ['trap', '"15% must be abnormal"'], ['down', 'A falling market']], 'notes', k => {
                [act, exp, cost] = presets[k];
                setSlider(sA, act, fp); setSlider(sE, exp, fp); setSlider(sC, cost, fc); draw();
            }),
            V.h('div', { class: 'vis-row' }, sA, sE, sC), svg, read);
        function draw() {
            V.clear(svg);
            const gross = act - exp, net = gross - cost, vals = [act, exp, gross, net];
            const lo = Math.min(0, ...vals) - 1, hi = Math.max(0, ...vals) + 2;
            const Y = v => 50 + (hi - v) / (hi - lo) * 172, r = V.rng(9), zero = Y(0);
            V.rline(svg, 40, zero, 540, zero, '#94a3b8', 1.4, r);
            V.text(svg, 36, zero, '0', { size: 12, anchor: 'end', color: '#64748b' });
            const cols = [
                ['actual', 'return', act, V.C.sky, V.C.skyS],
                ['expected', '(risk model)', exp, V.C.slate, V.C.slateS],
                ['gross', 'abnormal', gross, V.C.indigo, V.C.indigoS],
                ['net of', 'costs', net, net > 0 ? V.C.green : V.C.rose, net > 0 ? V.C.greenS : V.C.roseS],
            ];
            cols.forEach(([t1, t2, v, c, f], i) => {
                const x = 70 + i * 120, top = Math.min(Y(v), zero), h = Math.max(2, Math.abs(Y(v) - zero));
                V.rrect(svg, x, top, 80, h, c, f, r);
                V.text(svg, x + 40, v >= 0 ? top - 12 : top + h + 13, (v > 0 && i > 1 ? '+' : '') + V.fmt(v, 2) + (i > 1 ? ' pts' : '%'), { size: 17, weight: 700, color: c });
                V.text(svg, x + 40, 250, t1, { size: 15, color: '#475569' });
                V.text(svg, x + 40, 268, t2, { size: 15, color: '#475569' });
            });
            V.text(svg, 190 + 60, 18, 'gross = actual - expected', { size: 15, color: V.C.indigo });
            V.text(svg, 430 + 30, 18, 'net = gross - costs', { size: 15, color: '#475569' });
            let verdict;
            if (gross <= 0 && act > 0) verdict = `A positive return, but <b>not abnormal</b>: it ${gross < 0 ? 'fell short of' : 'only matched'} what its risk predicted. High-risk assets are expected to earn more in a strong market.`;
            else if (gross <= 0) verdict = 'Below (or equal to) the risk-adjusted benchmark: no abnormal return, before or after costs.';
            else if (net <= 0) verdict = 'A <b>gross</b> excess that trading costs wipe out: as measured, nothing is left to exploit.';
            else verdict = `A positive estimate after costs${act < 0 ? ' (even though the raw return is negative: the benchmark expected worse)' : ''}, but still <b>not proof</b> of skill or inefficiency: the risk model may miss a risk, one sample may be luck or data-mining, and the result must survive new data.`;
            V.math(read,
                `$$AR = R_{\\text{actual}} - E(R) = ${V.tn(act, 2)}\\% - ${V.par(V.tn(exp, 2) + '\\%')} = ${sgn(gross)} \\text{ points}$$` +
                `$$AR_{\\text{net}} = ${V.par(sgn(gross))} - ${V.tn(cost, 2)} = \\boxed{${sgn(net)} \\text{ points}}$$` + verdict);
        }
        draw();
    };

    // ------------------------------------------------------------------ price reaction to a surprise
    ML_VIS.l9_reaction = function (root) {
        let actual = 1.2, mode = 'eff';
        const EXP = 1.0, P0 = 20, K = 10;
        const svg = V.svg(560, 300), read = V.h('div', { class: 'vis-readout' });
        root.append(
            V.h('div', { class: 'vis-row' }, V.slider('actual EPS (expected RM1.00)', 0.7, 1.3, 0.01, actual, v => { actual = v; draw(); }, v => 'RM' + v.toFixed(2))),
            V.seg([['eff', 'efficient: adjusts at once'], ['slow', 'slow: under-reacts, then drifts'], ['over', 'over-reacts, then reverses']], mode, v => { mode = v; draw(); }),
            svg, read);
        function path() {
            const d = K * (actual - EXP), V1 = P0 + d, r = V.rng(17), out = [];
            for (let t = -10; t <= 20; t++) {
                const n = (r() - 0.5) * 0.12;
                let p;
                if (t < 0) p = P0;
                else if (mode === 'eff') p = V1;
                else if (mode === 'slow') p = V1 - 0.5 * d * Math.exp(-t / 6);
                else p = V1 + 0.6 * d * Math.exp(-t / 4);
                out.push([t, p + (t === 0 ? 0 : n)]);
            }
            return { pts: out, V1, d };
        }
        function draw() {
            V.clear(svg);
            const { pts, V1, d } = path(), ps = pts.map(p => p[1]);
            const lo = Math.min(...ps, P0, V1) - 0.6, hi = Math.max(...ps, P0, V1) + 0.6;
            const c = V.chart(svg, { x0: 70, x1: 530, y0: 250, y1: 30, X: [-10, 20], Y: [lo, hi], xticks: [-10, -5, 0, 5, 10, 15, 20], yticks: [Math.ceil(lo), Math.floor(hi)].filter((v, i, a) => a.indexOf(v) === i), fy: v => 'RM' + v, xlabel: 'trading day (0 = announcement)', seed: 5 });
            V.rline(svg, c.X(0), 30, c.X(0), 250, '#94a3b8', 1.2, null, { 'stroke-dasharray': '4 5' });
            V.rline(svg, c.X(-10), c.Y(P0), c.X(0), c.Y(P0), '#94a3b8', 1.6, null, { 'stroke-dasharray': '7 6' });
            V.rline(svg, c.X(0), c.Y(V1), c.X(20), c.Y(V1), V.C.green, 1.8, null, { 'stroke-dasharray': '7 6' });
            V.text(svg, c.X(20), c.Y(V1) + (d >= 0 ? 16 : -14), 'new value RM' + V1.toFixed(2), { size: 12, anchor: 'end', color: V.C.green });
            V.path(svg, pts.map(([t, p]) => [c.X(t), c.Y(p)]), V.C.indigo, 2.6);
            const p0 = pts[10][1], p20 = pts[30][1];
            V.dot(svg, c.X(0), c.Y(p0), V.C.amber, 6, V.C.amberS);
            V.dot(svg, c.X(20), c.Y(p20), V.C.amber, 6, V.C.amberS);
            V.text(svg, c.X(0) + 8, d >= 0 ? c.Y(p0) - 16 : c.Y(p0) + 18, 'buy here: day-0 close, news public', { size: 12, anchor: 'start', color: V.C.amber, weight: 700 });
            V.text(svg, c.X(0) - 6, 40, 'news released on day 0', { size: 12, anchor: 'end', color: '#64748b' });
            const s = actual - EXP, ret = (p20 - p0) / p0;
            let msg;
            if (Math.abs(s) < 0.005) msg = 'No surprise: the result was already expected, so there is nothing new to price and no jump.';
            else if (mode === 'eff') msg = 'The price jumps to the new value on the announcement day. Anyone who buys <b>after</b> the news is public gets roughly a normal return: the jump was the information, and it is already gone. This is what semi-strong efficiency predicts.';
            else if (mode === 'slow') msg = `Only half the adjustment happens on day 0; the rest drifts in the direction of the news. That is <b>post-earnings-announcement drift</b>. If a pre-specified rule earned this ${s > 0 ? 'drift' : 'drift (by avoiding or shorting the stock)'} repeatedly, after costs and risk adjustment and in new samples, it would challenge semi-strong efficiency.`;
            else msg = `The price overshoots and then reverses. Buying after ${s > 0 ? 'good' : 'bad'} news would ${s > 0 ? 'lose' : 'gain'} as the overreaction unwinds; a contrarian reading would do the opposite. Again, one path is an illustration, not evidence.`;
            V.math(read,
                `$$\\text{surprise} = \\text{actual} - \\text{expected} = ${actual.toFixed(2)} - 1.00 = ${s >= 0 ? '+' : '-'}\\text{RM}${Math.abs(s).toFixed(2)}$$` +
                `Illustrative rule: value moves $\\text{RM}10$ per $\\text{RM}1$ of surprise, so the value goes from $${V.trm(P0)}$ to $${V.trm(V1)}$.` +
                `$$\\text{return from day-0 close to day 20} = \\frac{${p20.toFixed(2)} - ${p0.toFixed(2)}}{${p0.toFixed(2)}} = \\boxed{${(ret >= 0 ? '+' : '') + V.tp(ret, 2)}}$$` +
                msg + ' <span class="vis-note">(A normal return of zero over the 20 days is assumed, so this whole figure is abnormal; costs are ignored.)</span>');
        }
        draw();
    };

    // ------------------------------------------------------------------ breadth: A-D line and TRIN
    ML_VIS.l9_breadth = function (root) {
        const P = {
            notes: { start: 1000, A: [800, 500, 800, 1200, 1200], D: [600, 750, 400, 800, 800], AV: [500, 300, 600, 360, 900], DV: [350, 520, 200, 120, 600], I: [100, 99.4, 100.6, 101.5, 101.9],
                note: 'Days 1-2: the notes\' A-D example (line starts at 1,000). Day 3: the notes\' TRIN example. Day 4: subjective Q4. Day 5: MCQ Q25. Volumes on days 1-2 and the index are illustrative. Volume in millions of shares.' },
            narrow: { start: 1000, A: [700, 650, 600, 560, 520], D: [800, 850, 900, 950, 1000], AV: [520, 540, 560, 600, 640], DV: [480, 470, 460, 450, 440], I: [100, 100.6, 101.1, 101.9, 102.6],
                note: 'Illustrative: the index rises every day while more stocks fall than rise. Volume in millions of shares.' },
        };
        let D = JSON.parse(JSON.stringify(P.notes)), day = 0;
        const note = V.h('p', { class: 'vis-note' }), grid = V.h('div'), svg = V.svg(560, 330), read = V.h('div', { class: 'vis-readout' });
        const daySeg = V.seg([0, 1, 2, 3, 4].map(i => [i, 'Day ' + (i + 1)]), 0, v => { day = v; draw(); });
        root.append(
            V.seg([['notes', 'Notes and exam numbers'], ['narrow', 'A narrowing rally']], 'notes', k => { D = JSON.parse(JSON.stringify(P[k])); build(); draw(); }),
            note, grid, V.h('p', { class: 'vis-note' }, 'Explain one day:'), daySeg, svg, read);
        let out = {};
        function build() {
            V.clear(grid);
            note.textContent = D.note;
            // one grid for every row, so the label column and the five day columns line up
            const row = (label, key) => [V.h('b', {}, label),
                ...D[key].map((v, i) => V.numIn(v, x => { D[key][i] = x; draw(); }, Object.assign({ 'aria-label': label + ', day ' + (i + 1) }, TIGHT)))];
            const calc = (label, key) => { out[key] = [0, 1, 2, 3, 4].map(() => cell()); return [V.h('b', {}, label), ...out[key]]; };
            grid.append(
                V.h('div', { class: 'vis-returns' }, V.h('span'), ...[1, 2, 3, 4, 5].map(i => V.h('b', {}, 'Day ' + i)),
                    ...row('advancing issues A', 'A'), ...row('declining issues D', 'D'), ...row('advancing volume AV', 'AV'), ...row('declining volume DV', 'DV'), ...row('index close', 'I'),
                    ...calc('net breadth A - D', 'net'), ...calc('A-D line', 'line'), ...calc('TRIN', 'trin')),
                V.h('div', { class: 'vis-row' }, V.h('b', {}, 'A-D line before day 1'), V.numIn(D.start, x => { D.start = x; draw(); }, { 'aria-label': 'Starting level of the A-D line' })));
        }
        function draw() {
            const n = 5, net = D.A.map((a, i) => a - D.D[i]), line = [D.start];
            net.forEach(x => line.push(line[line.length - 1] + x));
            const trin = D.A.map((a, i) => (D.D[i] > 0 && D.AV[i] > 0 && D.DV[i] > 0) ? (a / D.D[i]) / (D.AV[i] / D.DV[i]) : NaN);
            for (let i = 0; i < n; i++) {
                V.math(out.net[i], `$${sgn(net[i], 0)}$`);
                V.math(out.line[i], `$${V.tn(line[i + 1], 0)}$`);
                V.math(out.trin[i], Number.isFinite(trin[i]) ? `$${trin[i].toFixed(2)}$` : '-');
            }
            V.clear(svg);
            const r = V.rng(12), X = d => 90 + d * 84;
            // panel 1: A-D line (days 0..5) and index (days 1..5)
            const lmin = Math.min(...line), lmax = Math.max(...line), lpad = Math.max(1, (lmax - lmin) * 0.15);
            const Y1 = v => 160 - (v - (lmin - lpad)) / ((lmax + lpad) - (lmin - lpad)) * 120;
            const imin = Math.min(...D.I), imax = Math.max(...D.I), ipad = Math.max(0.1, (imax - imin) * 0.15);
            const YI = v => 160 - (v - (imin - ipad)) / ((imax + ipad) - (imin - ipad)) * 120;
            svg.append(V.s('rect', { x: X(day + 1) - 34, y: 22, width: 68, height: 296, rx: 8, fill: '#fdf4ff' }));
            V.text(svg, 20, 18, 'A-D line (solid) and index (dashed, own scale)', { size: 13, anchor: 'start', color: '#475569', weight: 700 });
            V.path(svg, D.I.map((v, i) => [X(i + 1), YI(v)]), V.C.slate, 2, { 'stroke-dasharray': '6 5' });
            V.path(svg, line.map((v, i) => [X(i), Y1(v)]), V.C.indigo, 2.8);
            line.forEach((v, i) => { V.dot(svg, X(i), Y1(v), V.C.indigo, 5); V.text(svg, X(i), Y1(v) - 14, V.fmt(v, 0), { size: 12, color: V.C.indigo, weight: 700 }); });
            V.text(svg, X(5) + 10, YI(D.I[4]), 'index', { size: 12, anchor: 'start', color: V.C.slate });
            for (let d = 0; d <= 5; d++) V.text(svg, X(d), 180, d === 0 ? 'start' : 'day ' + d, { size: 12, color: '#64748b' });
            // panel 2: TRIN
            const tmax = Math.max(2, ...trin.filter(Number.isFinite)) * 1.1, Y2 = v => 310 - v / tmax * 100;
            V.text(svg, 20, 200, 'TRIN each day (1 = neutral)', { size: 13, anchor: 'start', color: '#475569', weight: 700 });
            V.rline(svg, 60, Y2(1), 520, Y2(1), V.C.amber, 1.4, null, { 'stroke-dasharray': '6 5' });
            V.rline(svg, 60, 310, 520, 310, '#94a3b8', 1.2, r);
            V.text(svg, 56, Y2(1), '1', { size: 12, anchor: 'end', color: V.C.amber });
            V.text(svg, 56, 310, '0', { size: 12, anchor: 'end', color: '#64748b' });
            trin.forEach((t, i) => {
                if (!Number.isFinite(t)) { V.text(svg, X(i + 1), 290, 'n/a', { size: 12, color: V.C.red }); return; }
                const col = t < 1 ? V.C.green : t > 1 ? V.C.rose : V.C.slate;
                V.rline(svg, X(i + 1), 310, X(i + 1), Y2(t), col, 3, r);
                V.dot(svg, X(i + 1), Y2(t), col, 5, '#fff');
                V.text(svg, X(i + 1) + 22, Y2(t) - 4, t.toFixed(2), { size: 12, weight: 700, color: col });
            });
            // readout for the chosen day
            const i = day, a = D.A[i], dd = D.D[i], av = D.AV[i], dv = D.DV[i], t = trin[i];
            let h = `<b>Day ${i + 1}.</b> $\\text{net breadth} = A - D = ${V.tn(a, 0)} - ${V.tn(dd, 0)} = ${sgn(net[i], 0)}$ issues, so ` +
                `$\\text{A-D line} = ${V.tn(line[i], 0)} ${net[i] < 0 ? '-' : '+'} ${V.tn(Math.abs(net[i]), 0)} = ${V.tn(line[i + 1], 0)}$.`;
            if (Number.isFinite(t)) {
                h += `$$\\text{TRIN} = \\frac{A/D}{AV/DV} = \\frac{${V.tn(a, 0)}/${V.tn(dd, 0)}}{${V.tn(av, 2)}/${V.tn(dv, 2)}} = \\frac{${V.tn(a / dd, 2)}}{${V.tn(av / dv, 2)}} = \\boxed{${t.toFixed(2)}}$$`;
                const pa = av / a, pd = dv / dd;
                h += Math.abs(t - 1) < 0.005 ? 'Exactly neutral: volume is split between advancers and decliners in the same proportion as the issues.'
                    : `The average advancing issue traded $${V.tn(pa, 3)}$ million shares and the average declining issue $${V.tn(pd, 3)}$ million, so volume leaned toward the <b>${t < 1 ? 'advancers' : 'decliners'}</b>. The slides read TRIN ${t < 1 ? 'below $1$ as bullish' : 'above $1$ as bearish'}.`;
            } else h += ' TRIN is undefined: a denominator ($D$, $AV$ or $DV$) is zero.';
            const di = D.I[4] - D.I[0], dl = line[5] - line[1];
            h += '<br><b>Five days together:</b> ' + (di > 0 && dl < 0 ? `the index rose but the A-D line fell by $${V.tn(-dl, 0)}$ from day 1: a <b>divergence</b>, fewer stocks taking part in the rise. A reason to look closer, not a guaranteed reversal.`
                : di > 0 && dl > 0 ? 'the index and the A-D line both rose: breadth confirms the move.'
                : di < 0 && dl > 0 ? 'the index fell while the A-D line rose: most stocks did better than the index suggests.'
                : 'the index and breadth moved the same way.') +
                ' Each reading summarises the days shown; none of them forecasts tomorrow\'s return.';
            V.math(read, h);
        }
        build();
        draw();
    };

    // ------------------------------------------------------------------ moving average and OBV
    ML_VIS.l9_ma_obv = function (root) {
        const P = {
            q5: { c: [10, 11, 10, 12, 13], v: [0, 1, 2, 3, 4], res: 12, w: 3, note: 'Subjective Q5: closes on Days 1-5, volume in millions of shares; OBV starts at zero on Day 1, so Day 1\'s volume is not used. A trader sees resistance near RM12.' },
            ma: { c: [10, 11, 12, 11, 16], v: [0, 1.2, 1.0, 0.8, 2.5], res: null, w: 5, note: 'The notes\' moving-average example: five closes of RM10, RM11, RM12, RM11 and RM16. Volumes are illustrative.' },
            obv: { c: [10, 10.5, 10.2, 10.2], v: [0, 1000, 600, 800], res: null, w: 2, note: 'The notes\' OBV example, in shares: start at zero, an up day on 1,000, a down day on 600, then an unchanged close.' },
            story: { c: [11.0, 11.6, 11.9, 11.4, 11.1, 11.7, 11.95, 11.5, 12.4, 12.9], v: [2.0, 1.5, 2.2, 1.4, 1.6, 2.0, 2.4, 1.5, 3.8, 4.2], res: 12, w: 3, note: 'Illustrative ten days: the price is held below RM12 twice, then closes above it on rising volume. Volume in millions of shares.' },
        };
        let D = JSON.parse(JSON.stringify(P.q5)), w = 3;
        const note = V.h('p', { class: 'vis-note' }), grid = V.h('div'), svg = V.svg(560, 360), read = V.h('div', { class: 'vis-readout' });
        const winHost = V.h('div');
        let out = {};
        const mkWin = () => { V.clear(winHost); winHost.append(V.h('div', { class: 'vis-row' }, V.h('b', {}, 'window n'), V.seg([2, 3, 4, 5].map(k => [k, k + ' days']), w, k => { w = k; draw(); }))); };
        root.append(
            V.seg([['q5', 'Subjective Q5'], ['ma', 'Notes: MA example'], ['obv', 'Notes: OBV example'], ['story', 'Ten-day breakout']], 'q5', k => { D = JSON.parse(JSON.stringify(P[k])); w = D.w; build(); mkWin(); draw(); }),
            note, grid, winHost, svg, read);
        function build() {
            V.clear(grid); out = { chg: [], obv: [], sma: [] };
            note.textContent = D.note;
            const N = D.c.length;
            for (let s = 0; s < N; s += 5) {
                const idx = []; for (let i = s; i < Math.min(N, s + 5); i++) idx.push(i);
                // one grid per block of five days, so labels and day columns line up
                const pad = () => Array.from({ length: 5 - idx.length }, () => V.h('span'));
                const row = (label, key) => [V.h('b', {}, label),
                    ...idx.map(i => V.numIn(D[key][i], x => { D[key][i] = x; draw(); }, Object.assign({ 'aria-label': label + ', day ' + (i + 1) }, TIGHT))), ...pad()];
                const calc = (label, key) => [V.h('b', {}, label), ...idx.map(i => (out[key][i] = cell())), ...pad()];
                grid.append(V.h('div', { class: 'vis-returns' },
                    V.h('span'), ...idx.map(i => V.h('b', {}, 'Day ' + (i + 1))), ...pad(),
                    ...row('close (RM)', 'c'), ...row('volume', 'v'), ...calc('close vs previous', 'chg'), ...calc('OBV', 'obv'), ...calc('SMA', 'sma')));
            }
        }
        function draw() {
            const c = D.c, v = D.v, N = c.length;
            const obv = [0];
            for (let i = 1; i < N; i++) obv.push(obv[i - 1] + (c[i] > c[i - 1] ? v[i] : c[i] < c[i - 1] ? -v[i] : 0));
            const sma = c.map((_, i) => i >= w - 1 ? V.mean(c.slice(i - w + 1, i + 1)) : NaN);
            for (let i = 0; i < N; i++) {
                V.math(out.chg[i], i === 0 ? '-' : c[i] > c[i - 1] ? '$\\uparrow$ up' : c[i] < c[i - 1] ? '$\\downarrow$ down' : '$=$ flat');
                V.math(out.obv[i], `$${V.tn(obv[i], 2)}$`);
                V.math(out.sma[i], Number.isFinite(sma[i]) ? `$${V.tn(sma[i], 2)}$` : '-');
            }
            // signals: the close crosses the average
            const sig = [];
            for (let i = 1; i < N; i++) {
                if (!Number.isFinite(sma[i]) || !Number.isFinite(sma[i - 1])) continue;
                if (c[i - 1] <= sma[i - 1] && c[i] > sma[i]) sig.push([i, 'buy']);
                if (c[i - 1] >= sma[i - 1] && c[i] < sma[i]) sig.push([i, 'sell']);
            }
            V.clear(svg);
            const r = V.rng(31), X = i => 80 + (N > 1 ? i / (N - 1) : 0.5) * 430;
            const all = c.concat(sma.filter(Number.isFinite), D.res != null ? [D.res] : []);
            const lo = Math.min(...all), hi = Math.max(...all), pad = Math.max(0.2, (hi - lo) * 0.15);
            const Y = p => 190 - (p - (lo - pad)) / ((hi + pad) - (lo - pad)) * 160;
            V.text(svg, 20, 16, 'closing price (solid), ' + w + '-day SMA (dashed)', { size: 13, anchor: 'start', color: '#475569', weight: 700 });
            [lo, hi].forEach(p => V.text(svg, 66, Y(p), 'RM' + V.fmt(p, 2), { size: 11, anchor: 'end', color: '#64748b' }));
            if (D.res != null) {
                V.rline(svg, 70, Y(D.res), 530, Y(D.res), V.C.rose, 1.4, null, { 'stroke-dasharray': '8 6' });
                V.text(svg, 530, Y(D.res) - 10, 'resistance RM' + D.res, { size: 12, anchor: 'end', color: V.C.rose });
            }
            V.path(svg, c.map((p, i) => [X(i), Y(p)]), V.C.indigo, 2.6);
            c.forEach((p, i) => V.dot(svg, X(i), Y(p), V.C.indigo, 4.5));
            const sp = sma.map((s, i) => [X(i), Y(s)]).filter((_, i) => Number.isFinite(sma[i]));
            if (sp.length > 1) V.path(svg, sp, V.C.amber, 2.4, { 'stroke-dasharray': '7 5' });
            else if (sp.length === 1) V.dot(svg, sp[0][0], sp[0][1], V.C.amber, 4.5, V.C.amberS);
            sig.forEach(([i, k]) => {
                const col = k === 'buy' ? V.C.green : V.C.red, y = Y(c[i]) + (k === 'buy' ? 22 : -20);
                V.text(svg, X(i), y, k + '?', { size: 13, weight: 700, color: col });
            });
            for (let i = 0; i < N; i++) V.text(svg, X(i), 206, 'd' + (i + 1), { size: 11, color: '#64748b' });
            // OBV panel
            const omin = Math.min(0, ...obv), omax = Math.max(0, ...obv), orng = (omax - omin) || 1;
            const YO = o => 340 - (o - omin) / orng * 90;
            V.text(svg, 20, 232, 'on-balance volume (running total)', { size: 13, anchor: 'start', color: '#475569', weight: 700 });
            V.rline(svg, 70, YO(0), 530, YO(0), '#94a3b8', 1.2, r);
            V.text(svg, 66, YO(0), '0', { size: 11, anchor: 'end', color: '#64748b' });
            V.path(svg, obv.map((o, i) => [X(i), YO(o)]), V.C.violet, 2.4);
            obv.forEach((o, i) => { V.dot(svg, X(i), YO(o), V.C.violet, 4); V.text(svg, X(i), YO(o) + (o >= 0 ? -12 : 14), V.fmt(o, 2), { size: 11, color: V.C.violet, weight: 700 }); });
            // readout
            const L = N - 1;
            let h = '';
            if (Number.isFinite(sma[L])) {
                const win = c.slice(L - w + 1, L + 1);
                h += `Day ${N} ${w}-day simple moving average (Days ${N - w + 1}-${N}):$$SMA_{${w}} = \\frac{${win.map(x => V.tn(x, 2)).join(' + ')}}{${w}} = \\boxed{${V.trm(sma[L])}}$$`;
            } else h += `A ${w}-day average needs at least ${w} closes; this series has ${N}.<br>`;
            const steps = obv.slice(1).map((o, k) => { const i = k + 1, dv = o - obv[k]; return dv > 0 ? '+ ' + V.tn(dv, 2) : dv < 0 ? '- ' + V.tn(-dv, 2) : '+ 0'; });
            h += `On-balance volume from a start of zero:$$OBV_{${N}} = 0 ${steps.join(' ')} = \\boxed{${V.tn(obv[L], 2)}}$$`;
            const up = c[L] > c[0], oup = obv[L] > 0;
            h += '<b>Reading it.</b> ' + (Number.isFinite(sma[L]) ? `The last close is ${c[L] > sma[L] ? 'above' : c[L] < sma[L] ? 'below' : 'exactly on'} its ${w}-day average; ` : `The ${w}-day average is not yet defined; `) +
                (sig.length ? `the rule "close crosses the average" fired on ${sig.map(([i, k]) => 'day ' + (i + 1) + ' (' + k + ')').join(', ')}. ` : 'no crossing signal fired. ') +
                `OBV ${oup ? 'rose' : obv[L] < 0 ? 'fell' : 'ended flat'} while the price ${up ? 'rose' : c[L] < c[0] ? 'fell' : 'ended flat'}, so volume ${(oup && up) || (obv[L] < 0 && c[L] < c[0]) ? '<b>confirms</b>' : 'does <b>not</b> clearly confirm'} the price move. `;
            if (D.res != null && c[L] > D.res && c.slice(0, L).every(x => x <= D.res)) h += `The last close $${V.trm(c[L])}$ is above the $${V.trm(D.res, 0)}$ resistance area: a possible breakout. `;
            h += 'All of this is built from <b>past</b> prices and volume: it describes, it does not predict. A usable rule fixes entry, exit and position size in advance and is tested on new data after costs.';
            V.math(read, h);
        }
        build();
        mkWin();
        draw();
    };
})();
// Chapter 10 visuals
// Set a V.slider's value from code (used by the preset buttons)
function l10Set(w, v, fmt) { w.input.value = v; w.querySelector('output').textContent = fmt ? fmt(v) : v; }

ML_VIS.l10_yields = function (root) {
    const par = 1000;
    let cr = 0.06, p0 = 900, p1 = 850;
    const svg = V.svg(560, 280), read = V.h('div', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' },
        V.slider('coupon rate', 0, 12, 0.5, cr * 100, v => { cr = v / 100; draw(); }, v => v + '%'),
        V.slider('price you pay', 600, 1400, 10, p0, v => { p0 = v; draw(); }, v => 'RM' + V.fmt(v, 0)),
        V.slider('price one year later', 600, 1400, 10, p1, v => { p1 = v; draw(); }, v => 'RM' + V.fmt(v, 0))), svg, read);
    function draw() {
        V.clear(svg);
        const C = cr * par, cy = C / p0, hpr = (C + p1 - p0) / p0, r = V.rng(11);
        const bars = [['coupon rate', 'on par: never changes', cr, V.C.slate, V.C.slateS],
            ['current yield', 'coupon ÷ price paid', cy, V.C.sky, V.C.skyS],
            ['one-year total return', '(coupon + price change) ÷ price paid', hpr, hpr >= 0 ? V.C.green : V.C.red, hpr >= 0 ? V.C.greenS : '#fee2e2']];
        const neg = bars.some(b => b[2] < 0), zero = neg ? 135 : 205, mp = Math.max(0.08, ...bars.map(b => b[2])), mn = Math.max(0.12, ...bars.map(b => -b[2]));
        const k = neg ? Math.min((zero - 40) / mp, (220 - zero) / mn) : (zero - 40) / mp;
        V.rline(svg, 30, zero, 540, zero, '#94a3b8', 1.4, r);
        V.text(svg, 26, zero, '0%', { size: 12, anchor: 'end', color: '#64748b' });
        bars.forEach(([name, sub, v, col, fill], i) => {
            const x = 60 + i * 170, h = v * k;
            V.rrect(svg, x, h >= 0 ? zero - h : zero, 120, Math.max(Math.abs(h), 2), col, fill, r);
            V.text(svg, x + 60, h >= 0 ? zero - h - 12 : zero - h + 14, V.pct(v, 2), { size: 15, weight: 700, color: col });
            V.text(svg, x + 60, 252, name, { size: 14, weight: 700, color: '#334155' });
            V.text(svg, x + 60, 270, sub, { size: 11, color: '#64748b' });
        });
        const rel = Math.abs(p0 - par) < 1e-9 ? 'You paid par, so current yield equals the coupon rate.' :
            p0 < par ? 'You paid <b>below par</b> (a discount), so current yield is <b>above</b> the coupon rate.' :
                'You paid <b>above par</b> (a premium), so current yield is <b>below</b> the coupon rate.';
        V.math(read,
            `<div>Annual coupon $= ${V.tp(cr, 1)} \\times \\text{RM}1{,}000 = ${V.trm(C)}$: fixed by the contract, whatever the price.</div>` +
            `<div>$$\\text{Current yield} = \\frac{\\text{annual coupon}}{\\text{price paid}} = \\frac{${V.tn(C)}}{${V.tn(p0)}} = \\boxed{${V.tp(cy)}}$$</div>` +
            `<div>$$\\text{One-year return} = \\frac{C + (P_1 - P_0)}{P_0} = \\frac{${V.tn(C)} + (${V.tn(p1)} - ${V.tn(p0)})}{${V.tn(p0)}} = \\boxed{${V.tp(hpr)}}$$</div>` +
            `<div>${rel} Current yield ignores the price change; the total return includes it. ${hpr < 0 && C > 0 ? '<span class="vis-verdict bad">a positive coupon, a negative return</span>' : ''}</div>`);
    }
    draw();
};

ML_VIS.l10_maturity = function (root) {
    const cr = 0.06, par = 1000;
    let y = 0.08, nLong = 20;
    const price = (n, yy) => { let p = 0; for (let t = 1; t <= n; t++) p += cr * par / (1 + yy) ** t; return p + par / (1 + yy) ** n; };
    const svg = V.svg(560, 300), read = V.h('div', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' },
        V.slider('required yield', 2, 12, 0.25, y * 100, v => { y = v / 100; draw(); }, v => v.toFixed(2) + '%'),
        V.seg([[10, 'long bond: 10 years'], [20, '20 years'], [30, '30 years']], nLong, v => { nLong = v; draw(); })), svg, read);
    function draw() {
        V.clear(svg);
        const c = V.chart(svg, { x0: 80, x1: 520, y0: 250, y1: 30, X: [2, 12], Y: [400, 2000], xticks: [2, 4, 6, 8, 10, 12], yticks: [500, 1000, 1500, 2000], fx: t => t + '%', fy: t => 'RM' + V.fmt(t, 0), xlabel: 'required yield', ylabel: 'price of a 6% coupon bond', seed: 4 });
        svg.append(V.s('line', { x1: c.X(2), x2: c.X(12), y1: c.Y(1000), y2: c.Y(1000), stroke: V.C.amber, 'stroke-dasharray': '6 5', 'stroke-width': 1.4 }));
        svg.append(V.s('line', { x1: c.X(6), x2: c.X(6), y1: c.Y(400), y2: c.Y(2000), stroke: '#cbd5e1', 'stroke-dasharray': '4 4', 'stroke-width': 1.2 }));
        V.text(svg, c.X(6) + 4, c.Y(1950), 'yield = coupon', { size: 12, anchor: 'start', color: '#64748b' });
        V.text(svg, c.X(2.15), c.Y(1000) + 14, 'par RM1,000', { size: 12, anchor: 'start', color: V.C.amber });
        const curveOf = n => { const pts = []; for (let r = 2; r <= 12.001; r += 0.25) pts.push([c.X(r), c.Y(Math.max(400, price(n, r / 100)))]); return pts; };
        V.path(svg, curveOf(2), V.C.sky, 2.4);
        V.path(svg, curveOf(nLong), V.C.rose, 2.8);
        V.text(svg, c.X(10.6), c.Y(price(2, 0.106)) - 12, '2-year', { size: 13, weight: 700, anchor: 'start', color: V.C.sky });
        V.text(svg, c.X(2.9), c.Y(Math.min(1900, price(nLong, 0.029))) - 14, nLong + '-year', { size: 13, weight: 700, anchor: 'start', color: V.C.rose });
        const ps = price(2, y), pl = price(nLong, y);
        V.dot(svg, c.X(y * 100), c.Y(ps), V.C.sky, 6);
        V.dot(svg, c.X(y * 100), c.Y(Math.max(400, pl)), V.C.rose, 6);
        const ps1 = price(2, y + 0.01), pl1 = price(nLong, y + 0.01);
        const state = Math.abs(y - cr) < 1e-9 ? 'equals the $6\\%$ coupon: both bonds sell <b>at par</b>' :
            y > cr ? 'is above the $6\\%$ coupon: both sell at a <b>discount</b> (below par)' : 'is below the $6\\%$ coupon: both sell at a <b>premium</b> (above par)';
        V.math(read,
            `<div>The required yield $y = ${V.tp(y)}$ ${state}. The coupons never change; only the price does.</div>` +
            `<div class="vis-table-wrap"><table class="vis-table"><tr><th></th><th>2-year bond</th><th>${nLong}-year bond</th></tr>` +
            `<tr><td>price at $${V.tp(y)}$</td><td>$${V.trm(ps)}$</td><td>$${V.trm(pl)}$</td></tr>` +
            `<tr><td>versus par</td><td>$${V.tp(ps / par - 1)}$</td><td>$${V.tp(pl / par - 1)}$</td></tr>` +
            `<tr><td>if $y$ rises $1$ point</td><td class="neg">$${V.tp(ps1 / ps - 1)}$</td><td class="neg">$${V.tp(pl1 / pl - 1)}$</td></tr></table></div>` +
            `<div>Same coupon, same rate change: the longer bond moves about $${V.tn((pl1 / pl - 1) / (ps1 / ps - 1), 1)}$ times as much, because more of its cash arrives far in the future. Each price is the present value of the promised cash flows; Chapter 11 shows the calculation.</div>`);
    }
    draw();
};

ML_VIS.l10_recovery = function (root) {
    const SEC = 100, SEN = 80, SUB = 60;
    let value = 200, cost = 10, coll = 120;
    const svg = V.svg(560, 300), read = V.h('div', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' },
        V.slider('value left in default', 0, 300, 5, value, v => { value = v; draw(); }, v => 'RM' + v + 'm'),
        V.slider('legal and admin costs', 0, 40, 1, cost, v => { cost = v; draw(); }, v => 'RM' + v + 'm'),
        V.slider('value of the collateral', 0, 150, 5, coll, v => { coll = v; draw(); }, v => 'RM' + v + 'm')), svg, read);
    function draw() {
        V.clear(svg);
        const net = Math.max(0, value - cost), cv = Math.min(coll, net);
        const fromColl = Math.min(SEC, cv), short = SEC - fromColl;
        let rest = net - fromColl;
        const pool = short + SEN, poolPaid = Math.min(pool, rest), share = pool ? poolPaid / pool : 0;
        rest -= poolPaid;
        const subPaid = Math.min(SUB, rest); rest -= subPaid;
        const eq = rest, secPaid = fromColl + short * share, senPaid = SEN * share;
        const cols = [['secured bond', SEC, secPaid, V.C.green, V.C.greenS], ['senior unsecured', SEN, senPaid, V.C.sky, V.C.skyS],
            ['subordinated', SUB, subPaid, V.C.amber, V.C.amberS], ['shareholders', null, eq, V.C.violet, V.C.violetS]];
        const base = 240, k = 1.6, r = V.rng(21);
        V.rline(svg, 20, base, 540, base, '#94a3b8', 1.4, r);
        cols.forEach(([name, claim, paid, col, fill], i) => {
            const x = 40 + i * 130, w = 90;
            if (claim) {
                svg.append(V.s('rect', { x, y: base - claim * k, width: w, height: claim * k, fill: 'none', stroke: col, 'stroke-dasharray': '5 4', 'stroke-width': 1.4 }));
                V.text(svg, x + w / 2, base - claim * k - 12, 'claim RM' + claim + 'm', { size: 12, color: '#64748b' });
            }
            if (paid > 0.01) V.rrect(svg, x, base - paid * k, w, paid * k, col, fill, r);
            V.text(svg, x + w / 2, base - Math.max(paid * k, 0) / 2 - (paid * k < 30 ? 22 : 0), claim ? V.pct(paid / claim, 0) : (paid > 0.01 ? 'RM' + V.fmt(paid, 1) + 'm' : 'nothing'), { size: 15, weight: 700, color: col });
            V.text(svg, x + w / 2, base + 18, name, { size: 13, weight: 700, color: '#334155' });
            V.text(svg, x + w / 2, base + 35, 'paid RM' + V.fmt(paid, 1) + 'm', { size: 12, color: '#64748b' });
        });
        V.text(svg, 280, 22, 'dashed box = what each class is owed · filled = what it recovers', { size: 13, color: '#475569' });
        const mrm = x => `\\text{RM}${V.tn(x, 1)}\\text{m}`;
        V.math(read,
            `<div>Step 1: costs come off the top: $${mrm(value)} - ${mrm(cost)} = ${mrm(net)}$ to share out.</div>` +
            `<div>Step 2: the secured bond takes its collateral first: $${mrm(fromColl)}$ of its $\\text{RM}100\\text{m}$ claim.${short > 0.01 ? ` The $${mrm(short)}$ shortfall becomes an <b>unsecured</b> claim alongside senior unsecured debt.` : ''}</div>` +
            `<div>Step 3: unsecured senior claims ($${mrm(pool)}$) share what is left: $${V.tp(share, 1)}$ of each ringgit owed.</div>` +
            `<div>Step 4: subordinated debt recovers $${mrm(subPaid)}$ of $\\text{RM}60\\text{m}$; shareholders get ${eq > 0.01 ? `the residual $${mrm(eq)}$` : '<b>nothing</b>'}.</div>` +
            `<div>Recovery: secured $${V.tp(secPaid / SEC, 1)}$ · senior unsecured $${V.tp(share, 1)}$ · subordinated $${V.tp(subPaid / SUB, 1)}$. Simplified strict-priority illustration; real recoveries depend on the indenture, the law and the actual collateral value.</div>`);
    }
    draw();
};

ML_VIS.l10_tey = function (root) {
    let ex = 0.042, tx = 0.06, tf = 0.28, ts = 0.05, mode = 'one';
    const svg = V.svg(560, 290), read = V.h('div', { class: 'vis-readout' });
    const stateSl = V.slider('state tax rate', 0, 12, 0.5, ts * 100, v => { ts = v / 100; draw(); }, v => v + '%');
    root.append(V.h('div', { class: 'vis-row' },
        V.slider('tax-exempt yield', 1, 8, 0.05, ex * 100, v => { ex = v / 100; draw(); }, v => v.toFixed(2) + '%'),
        V.slider('taxable yield', 1, 12, 0.05, tx * 100, v => { tx = v / 100; draw(); }, v => v.toFixed(2) + '%'),
        V.slider('marginal tax rate', 0, 45, 1, tf * 100, v => { tf = v / 100; draw(); }, v => v + '%')),
        V.seg([['one', 'one tax rate (course formula)'], ['two', 'federal + state (slide 10-24)']], mode, v => { mode = v; draw(); }),
        V.h('div', { class: 'vis-row' }, stateSl), svg, read);
    function draw() {
        stateSl.style.display = mode === 'two' ? '' : 'none';
        V.clear(svg);
        const t = mode === 'two' ? tf + ts * (1 - tf) : tf, tey = ex / (1 - t), aft = tx * (1 - t), tStar = 1 - ex / tx;
        const yMax = Math.max(0.12, tx * 1.15);
        const c = V.chart(svg, { x0: 70, x1: 520, y0: 245, y1: 30, X: [0, 0.6], Y: [0, yMax], xticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6], yticks: [0, yMax / 2, yMax], fx: v => Math.round(v * 100) + '%', fy: v => V.fmt(v * 100, 1) + '%', xlabel: 'tax rate', ylabel: 'yield', seed: 6 });
        if (tStar > 0 && tStar < 0.6) {
            svg.append(V.s('rect', { x: c.X(tStar), y: c.Y(yMax), width: c.X(0.6) - c.X(tStar), height: c.Y(0) - c.Y(yMax), fill: V.C.greenS, opacity: 0.6 }));
            V.text(svg, (c.X(tStar) + c.X(0.6)) / 2, c.Y(yMax) + 14, 'tax-exempt bond wins', { size: 12, weight: 700, color: V.C.green });
            svg.append(V.s('line', { x1: c.X(tStar), x2: c.X(tStar), y1: c.Y(0), y2: c.Y(yMax), stroke: V.C.green, 'stroke-dasharray': '4 4', 'stroke-width': 1.2 }));
            V.text(svg, c.X(tStar), c.Y(0) - 10, 'break-even ' + V.pct(tStar, 1), { size: 12, weight: 700, color: V.C.green, anchor: tStar > 0.45 ? 'end' : 'start' });
        }
        svg.append(V.s('line', { x1: c.X(0), x2: c.X(0.6), y1: c.Y(tx), y2: c.Y(tx), stroke: V.C.sky, 'stroke-width': 2.4 }));
        V.text(svg, c.X(0.01), c.Y(tx) - 10, 'taxable bond ' + V.pct(tx, 2), { size: 13, weight: 700, anchor: 'start', color: V.C.sky });
        const pts = []; for (let u = 0; u <= 0.6001; u += 0.01) { const v = ex / (1 - u); if (v <= yMax) pts.push([c.X(u), c.Y(v)]); }
        V.path(svg, pts, V.C.rose, 2.6);
        V.text(svg, c.X(0.01), c.Y(ex) + 14, 'TEY of the ' + V.pct(ex, 2) + ' tax-exempt bond', { size: 13, weight: 700, anchor: 'start', color: V.C.rose });
        if (tey <= yMax) V.dot(svg, c.X(t), c.Y(tey), V.C.rose, 6);
        const win = Math.abs(tx - tey) < 1e-9 ? '<span class="vis-verdict even">a tie</span>' : tx > tey ? '<span class="vis-verdict good">the taxable bond pays more after tax</span>' : '<span class="vis-verdict good">the tax-exempt bond pays more after tax</span>';
        const tLine = mode === 'two' ? `<div>Combined rate: $t = t_f + t_s(1 - t_f) = ${V.tp(tf, 0)} + ${V.tp(ts, 1)}(1 - ${V.fmt(tf, 2)}) = ${V.tp(t, 2)}$.</div>` : '';
        V.math(read, tLine +
            `<div>$$\\text{Taxable-equivalent yield} = \\frac{${V.tp(ex)}}{1 - ${V.fmt(t, 4)}} = \\boxed{${V.tp(tey)}}$$</div><div>$$\\text{After-tax taxable yield} =${V.tp(tx)}(1 - ${V.fmt(t, 4)}) = \\boxed{${V.tp(aft)}}$$</div>` +
            `<div>${win}: compare $${V.tp(tx)}$ with $${V.tp(tey)}$ before tax, or equivalently $${V.tp(aft)}$ with $${V.tp(ex)}$ after tax; the gap is $${V.tn(Math.abs(aft - ex) * 100, 2)}$ percentage points after tax. Break-even tax rate $t^{*} = 1 - \\dfrac{${V.tp(ex)}}{${V.tp(tx)}} = ${V.tp(tStar, 1)}$: above it the exemption is worth more.</div>` +
            `<div>Valid only if the two bonds match on credit, maturity, liquidity and call terms, and the stated tax treatment really applies to this investor.</div>`);
    }
    draw();
};

ML_VIS.l10_zero = function (root) {
    const F = 1000;
    let P = 800, n = 5;
    const svg = V.svg(560, 290), read = V.h('div', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' },
        V.slider('price paid today', 200, 990, 10, P, v => { P = v; draw(); }, v => 'RM' + V.fmt(v, 0)),
        V.slider('years to maturity', 1, 30, 1, n, v => { n = v; draw(); }, v => v + (v === 1 ? ' year' : ' years'))), svg, read);
    function draw() {
        V.clear(svg);
        const r = (F / P) ** (1 / n) - 1, Pd = F / (1 + r + 0.01) ** n, drop = Pd / P - 1;
        const c = V.chart(svg, { x0: 80, x1: 520, y0: 245, y1: 30, X: [0, n], Y: [0, 1100], xticks: [0, Math.round(n / 2), n], yticks: [0, 250, 500, 750, 1000], fy: v => 'RM' + V.fmt(v, 0), xlabel: 'years from today', ylabel: 'value of the zero', seed: 8 });
        svg.append(V.s('line', { x1: c.X(0), x2: c.X(n), y1: c.Y(F), y2: c.Y(F), stroke: V.C.amber, 'stroke-dasharray': '6 5', 'stroke-width': 1.4 }));
        V.text(svg, c.X(0) + 6, c.Y(F) - 10, 'RM1,000 paid at maturity: the only cash flow', { size: 12, anchor: 'start', color: V.C.amber });
        const path = (p0, rr) => { const pts = []; for (let i = 0; i <= 60; i++) { const t = n * i / 60; pts.push([c.X(t), c.Y(F / (1 + rr) ** (n - t))]); } return pts; };
        V.path(svg, path(Pd, r + 0.01), V.C.rose, 2, { 'stroke-dasharray': '6 5' });
        V.path(svg, path(P, r), V.C.green, 2.8);
        V.dot(svg, c.X(0), c.Y(P), V.C.green, 6);
        V.dot(svg, c.X(0), c.Y(Pd), V.C.rose, 5);
        V.text(svg, c.X(n), c.Y(170), 'green: you pay ' + V.rm(P, 0) + ', value climbs to par', { size: 13, weight: 700, anchor: 'end', color: V.C.green });
        V.text(svg, c.X(n), c.Y(80), 'red dashed: yields jump 1 point today, price ' + V.rm(Pd, 0), { size: 12, anchor: 'end', color: V.C.rose });
        V.math(read,
            `<div>Gain if held to maturity and paid in full: $\\text{RM}1{,}000 - ${V.trm(P, 0)} = ${V.trm(F - P, 0)}$, a total return of $${V.tp((F - P) / P)}$. Spread over $${n}$ ${n === 1 ? 'year' : 'years'}, the compound annual return is` +
            `$$r = \\left(\\frac{F}{P}\\right)^{1/n} - 1 = \\left(\\frac{1{,}000}{${V.tn(P, 0)}}\\right)^{1/${n}} - 1 = \\boxed{${V.tp(r)}}$$</div>` +
            `<div>Rate sensitivity: if the required yield rises from $${V.tp(r)}$ to $${V.tp(r + 0.01)}$ today, the price becomes $\\dfrac{1{,}000}{(1 + ${V.fmt(r + 0.01, 4)})^{${n}}} = ${V.trm(Pd)}$, a change of <b>$${V.tp(drop)}$</b>. With no coupons to collect along the way, the longer the wait, the bigger the swing.</div>`);
    }
    draw();
};

ML_VIS.l10_fx = function (root) {
    const P0 = 1000, S0 = 4.0;
    let P1 = 980, C = 50, S1 = 3.8;
    const svg = V.svg(560, 270), read = V.h('div', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' },
        V.slider('bond price after a year', 900, 1100, 5, P1, v => { P1 = v; draw(); }, v => 'USD' + V.fmt(v, 0)),
        V.slider('coupon received', 0, 100, 5, C, v => { C = v; draw(); }, v => 'USD' + v),
        V.slider('RM per USD at the end', 3.4, 4.6, 0.01, S1, v => { S1 = v; draw(); }, v => 'RM' + v.toFixed(2))), svg, read);
    function draw() {
        V.clear(svg);
        const rU = (P1 + C - P0) / P0, fx = S1 / S0 - 1, rR = (1 + rU) * (1 + fx) - 1, start = P0 * S0, end = (P1 + C) * S1, r = V.rng(13);
        const bars = [['USD return', 'what the bond earned', rU, V.C.sky, V.C.skyS], ['currency change', 'USD vs ringgit', fx, V.C.amber, V.C.amberS],
            ['RM return', 'what YOU earned', rR, rR >= 0 ? V.C.green : V.C.red, rR >= 0 ? V.C.greenS : '#fee2e2']];
        const neg = bars.some(b => b[2] < 0), zero = neg ? 120 : 195, mp = Math.max(0.05, ...bars.map(b => b[2])), mn = Math.max(0.05, ...bars.map(b => -b[2]));
        const k = neg ? Math.min((zero - 30) / mp, (204 - zero) / mn) : (zero - 30) / mp;
        V.rline(svg, 30, zero, 540, zero, '#94a3b8', 1.4, r);
        bars.forEach(([name, sub, v, col, fill], i) => {
            const x = 60 + i * 170, h = v * k;
            V.rrect(svg, x, h >= 0 ? zero - h : zero, 120, Math.max(Math.abs(h), 2), col, fill, r);
            V.text(svg, x + 60, h >= 0 ? zero - h - 12 : zero - h + 14, V.pct(v, 2), { size: 15, weight: 700, color: col });
            V.text(svg, x + 60, 240, name, { size: 14, weight: 700, color: '#334155' });
            V.text(svg, x + 60, 258, sub, { size: 12, color: '#64748b' });
        });
        V.math(read,
            `<div>In USD: $R_{\\text{USD}} = \\dfrac{${V.tn(P1, 0)} - 1{,}000 + ${V.tn(C, 0)}}{1{,}000} = ${V.tp(rU)}$. The dollar moved from $\\text{RM}4.00$ to $\\text{RM}${S1.toFixed(2)}$: $${V.tp(fx)}$.</div>` +
            `<div>In ringgit: cost $1{,}000 \\times 4.00 = \\text{RM}4{,}000$; proceeds $(${V.tn(P1, 0)} + ${V.tn(C, 0)}) \\times ${S1.toFixed(2)} = ${V.trm(end)}$.` +
            `$$1 + R_{\\text{RM}} = (1 + R_{\\text{USD}})\\,\\frac{S_1}{S_0} = ${(1 + rU).toFixed(4)} \\times ${(S1 / S0).toFixed(4)} \\;\\Rightarrow\\; R_{\\text{RM}} = \\boxed{${V.tp(rR)}}$$</div>` +
            `<div>Adding the two returns would give $${V.tp(rU + fx)}$; the exact answer differs by the cross term $R_{\\text{USD}} \\times$ currency change $= ${V.tp(rU * fx, 3)}$. ${rU > 0 && rR < 0 ? '<span class="vis-verdict bad">a USD gain became a ringgit loss</span>' : ''}</div>`);
    }
    draw();
};

ML_VIS.l10_convertible = function (root) {
    const par = 1000;
    const presets = {
        notes: { N: 20, S: 50, C: 60, D: 2, F: 950, k: Math.sqrt(15000) },
        mcq: { N: 25, S: 36, C: 70, D: 1.6, F: 950, k: Math.sqrt(15000) },
        q6: { N: 40, S: 22, C: 50, D: 0.6, F: 950, k: 120 },
    };
    let st = Object.assign({}, presets.notes);
    const svg = V.svg(560, 310), read = V.h('div', { class: 'vis-readout' });
    const fRm = v => 'RM' + V.fmt(v, 2);
    const sS = V.slider('share price', 1, 120, 0.5, st.S, v => { st.S = v; draw(); }, fRm);
    const sN = V.slider('conversion ratio', 10, 50, 1, st.N, v => { st.N = v; draw(); }, v => v + ' shares');
    const sC = V.slider('annual coupon', 0, 100, 5, st.C, v => { st.C = v; draw(); }, v => 'RM' + v);
    const sD = V.slider('dividend per share', 0, 3, 0.05, st.D, v => { st.D = v; draw(); }, fRm);
    const sF = V.slider('bond floor (estimate)', 700, 1000, 10, st.F, v => { st.F = v; draw(); }, v => 'RM' + V.fmt(v, 0));
    const load = key => {
        st = Object.assign({}, presets[key]);
        l10Set(sS, st.S, fRm); l10Set(sN, st.N, v => v + ' shares'); l10Set(sC, st.C, v => 'RM' + v); l10Set(sD, st.D, fRm); l10Set(sF, st.F, v => 'RM' + V.fmt(v, 0));
        draw();
    };
    root.append(V.seg([['notes', 'Notes example'], ['mcq', 'MCQ Q27-30'], ['q6', 'Subjective Q6']], 'notes', load),
        V.h('div', { class: 'vis-row' }, sS, sN), V.h('div', { class: 'vis-row' }, sC, sD, sF), svg, read);
    // Illustrative market price: hugs the bond floor when the stock is low and conversion value when it is high
    const model = (cv, F, k) => (F + cv) / 2 + Math.sqrt(((cv - F) / 2) ** 2 + k * k);
    function draw() {
        V.clear(svg);
        const { N, S, C, D, F, k } = st, cp = par / N, cv = N * S, pc = model(cv, F, k);
        const xMax = Math.max(2.4 * cp, S * 1.1), yTop = model(N * xMax, F, k), yMax = Math.ceil(yTop / 500) * 500;
        const ticks = []; for (let v = 0; v <= yMax; v += yMax > 2500 ? 1000 : 500) ticks.push(v);
        const c = V.chart(svg, { x0: 80, x1: 520, y0: 255, y1: 30, X: [0, xMax], Y: [0, yMax], xticks: [0, Math.round(cp), Math.round(2 * cp)], yticks: ticks, fx: v => 'RM' + v, fy: v => 'RM' + V.fmt(v, 0), xlabel: 'share price', ylabel: 'value of one bond', seed: 9 });
        svg.append(V.s('line', { x1: c.X(0), x2: c.X(xMax), y1: c.Y(F), y2: c.Y(F), stroke: V.C.amber, 'stroke-dasharray': '6 5', 'stroke-width': 1.6 }));
        V.text(svg, c.X(xMax) - 4, c.Y(F) + 14, 'bond floor (a model estimate)', { size: 12, anchor: 'end', color: V.C.amber });
        V.path(svg, [[c.X(0), c.Y(0)], [c.X(xMax), c.Y(N * xMax)]], V.C.green, 2.2);
        V.text(svg, c.X(xMax * 0.8) + 8, c.Y(N * xMax * 0.8) + 14, 'conversion value', { size: 12, weight: 700, anchor: 'start', color: V.C.green });
        const pts = []; for (let i = 0; i <= 80; i++) { const x = xMax * i / 80; pts.push([c.X(x), c.Y(model(N * x, F, k))]); }
        V.path(svg, pts, V.C.indigo, 2.8);
        V.text(svg, c.X(xMax * 0.02), c.Y(model(N * xMax * 0.02, F, k)) - 26, 'convertible price (illustrative)', { size: 12, weight: 700, anchor: 'start', color: V.C.indigo });
        svg.append(V.s('line', { x1: c.X(cp), x2: c.X(cp), y1: c.Y(0), y2: c.Y(yMax), stroke: '#94a3b8', 'stroke-dasharray': '4 4', 'stroke-width': 1.2 }));
        V.text(svg, c.X(cp) + 4, c.Y(yMax) + 10, 'conversion price', { size: 12, anchor: 'start', color: '#64748b' });
        V.text(svg, c.X(cp * 0.62), c.Y(0) - 14, 'trades like a BOND', { size: 13, weight: 700, color: V.C.amber });
        if (xMax > 1.7 * cp) V.text(svg, c.X(Math.min(xMax * 0.86, cp * 1.85)), c.Y(0) - 14, 'trades like the SHARES', { size: 13, weight: 700, color: V.C.green });
        svg.append(V.s('line', { x1: c.X(S), x2: c.X(S), y1: c.Y(cv), y2: c.Y(pc), stroke: V.C.rose, 'stroke-width': 3 }));
        V.dot(svg, c.X(S), c.Y(pc), V.C.indigo, 6);
        V.dot(svg, c.X(S), c.Y(cv), V.C.green, 5);
        const prem = pc - cv, premPct = prem / cv, divs = N * D, gap = C - divs, ce = pc / N;
        const regime = cv < 0.85 * F ? '<span class="vis-verdict even">bond-like</span> the shares are worth far less than the bond floor, so the debt side supports the price and a large premium is paid for the option.' :
            cv > 1.25 * F ? '<span class="vis-verdict good">share-like</span> conversion value dominates, the premium is thin, and the price moves almost one-for-one with the shares.' :
                '<span class="vis-verdict even">hybrid</span> near the conversion price both sides matter: the price is above both the floor and conversion value.';
        const pay = gap <= 0 ? `incremental income is $${V.trm(gap)}$, not positive, so the premium is <b>not recovered</b> through extra income: no ordinary payback.` :
            prem <= 0 ? 'there is no positive premium to recover.' :
                `$$\\text{Payback} = \\frac{\\text{premium}}{C - N\\,D} = \\frac{${V.tn(prem)}}{${V.tn(C, 2)} - ${N} \\times ${V.tn(D, 2)}} = \\frac{${V.tn(prem)}}{${V.tn(gap)}} = \\boxed{${V.tn(prem / gap, 2)}\\text{ years}}$$`;
        V.math(read,
            `<div>${regime}</div>` +
            `<div>$$\\text{Conversion price} = \\frac{1{,}000}{${N}} = ${V.trm(cp)}$$</div><div>$$\\text{Conversion value} = ${N} \\times ${V.tn(S, 2)} = ${V.trm(cv)}$$</div>` +
            `<div>Convertible price here: $P_c = ${V.trm(pc)}$, so the conversion equivalent is $\\dfrac{${V.tn(pc)}}{${N}} = ${V.trm(ce)}$ a share.</div>` +
            `<div>$$\\text{Premium} = ${V.tn(pc)} - ${V.tn(cv)} = \\boxed{${V.trm(prem)}}$$</div><div>$$\\text{Premium \\%} = \\frac{${V.tn(prem)}}{${V.tn(cv)}} = \\boxed{${V.tp(premPct)}}\\text{ of conversion value}$$</div>` +
            `<div>Income: coupon $${V.trm(C)}$ vs dividends on $${N}$ shares $= ${V.trm(divs)}$. ${pay}</div>` +
            `<div class="vis-note">The red segment is the premium. The price curve is an illustrative model, not a valuation; in an exam the convertible's market price is given.</div>`);
    }
    draw();
};
// Chapter 11 visuals: bond pricing, yield measures, duration and immunization
const BOND11 = {
    // price of a level-coupon bond: coupon c per period, face f, yield i per period, n periods
    price(c, f, i, n) { return Math.abs(i) < 1e-10 ? c * n + f : c * (1 - Math.pow(1 + i, -n)) / i + f * Math.pow(1 + i, -n); },
    // the rate that makes the present value of [t, cash flow] pairs equal p (value falls as the rate rises)
    irr(cfs, p) {
        const pv = r => cfs.reduce((s, [t, cf]) => s + cf / Math.pow(1 + r, t), 0);
        let lo = -0.9, hi = 3;
        if (pv(lo) < p || pv(hi) > p) return NaN;
        for (let k = 0; k < 200; k++) { const m = (lo + hi) / 2; if (pv(m) > p) lo = m; else hi = m; }
        return (lo + hi) / 2;
    },
    flows(c, f, n) { return Array.from({ length: n }, (_, k) => [k + 1, c + (k + 1 === n ? f : 0)]); },
    mac(c, f, i, n) {
        let s = 0;
        for (let t = 1; t <= n; t++) s += t * (c + (t === n ? f : 0)) / Math.pow(1 + i, t);
        return s / BOND11.price(c, f, i, n);
    },
    ticks(max, n) { const raw = max / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), step = [1, 2, 2.5, 5, 10].map(k => k * mag).find(s => s >= raw); const out = []; for (let v = 0; v <= max + 1e-9; v += step) out.push(v); return out; },
    setSlider(w, v) { w.input.value = v; w.input.dispatchEvent(new Event('input')); },
};

ML_VIS.l11_pricer = function (root) {
    let m = 1, cr = 0.06, N = 10, y = 0.08;
    const F = 1000, svg = V.svg(560, 320), read = V.h('p', { class: 'vis-readout' });
    root.append(V.seg([[1, 'annual coupons'], [2, 'semiannual coupons']], m, v => { m = v; draw(); }),
        V.h('div', { class: 'vis-row' },
            V.slider('coupon rate', 0, 15, 0.25, cr * 100, v => { cr = v / 100; draw(); }, v => v + '%'),
            V.slider('years to maturity', 1, 30, 1, N, v => { N = v; draw(); }),
            V.slider('market (required) yield', 1, 15, 0.1, y * 100, v => { y = v / 100; draw(); }, v => v.toFixed(1) + '%')), svg, read);
    const P = (yy, n) => BOND11.price(F * cr / m, F, yy / m, n * m);
    function draw() {
        V.clear(svg);
        const nCmp = N > 5 ? 2 : 20, top = Math.max(P(0.01, N), P(0.01, nCmp), 1200);
        const yt = BOND11.ticks(top * 1.05, 4), yMax = yt[yt.length - 1] < top ? yt[yt.length - 1] + (yt[1] - yt[0]) : yt[yt.length - 1];
        if (yt[yt.length - 1] < yMax) yt.push(yMax);
        const c = V.chart(svg, { x0: 78, x1: 520, y0: 270, y1: 30, X: [0.01, 0.15], Y: [0, yMax], xticks: [0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14], yticks: yt, fx: t => V.pct(t, 0), fy: t => 'RM' + V.fmt(t, 0), xlabel: 'market yield', ylabel: 'bond price' });
        svg.append(V.s('line', { x1: c.X(0.01), x2: c.X(0.15), y1: c.Y(F), y2: c.Y(F), stroke: '#94a3b8', 'stroke-width': 1.6, 'stroke-dasharray': '6 5' }));
        const pts = n => { const a = []; for (let k = 0; k <= 70; k++) { const yy = 0.01 + 0.14 * k / 70; a.push([c.X(yy), c.Y(P(yy, n))]); } return a; };
        V.path(svg, pts(nCmp), V.C.slate, 2, { 'stroke-dasharray': '7 5' });
        V.path(svg, pts(N), V.C.indigo, 3);
        // legend in the top-right corner, which the falling price-yield curves never reach
        [[N + '-year bond', V.C.indigo, {}, 3], [nCmp + '-year bond, same coupon', V.C.slate, { 'stroke-dasharray': '7 5' }, 2], ['par value RM1,000', '#94a3b8', { 'stroke-dasharray': '6 5' }, 1.6]].forEach(([lab, col, ex, wd], k) => {
            const ly = 38 + k * 19;
            svg.append(V.s('line', Object.assign({ x1: 340, x2: 372, y1: ly, y2: ly, stroke: col, 'stroke-width': wd }, ex)));
            V.text(svg, 380, ly, lab, { size: 12, anchor: 'start', weight: k ? 400 : 700, color: k === 2 ? '#64748b' : col });
        });
        const p0 = P(y, N);
        svg.append(V.s('line', { x1: c.X(y), x2: c.X(y), y1: c.Y(0), y2: c.Y(p0), stroke: V.C.amber, 'stroke-width': 1.4, 'stroke-dasharray': '4 4' }));
        V.dot(svg, c.X(y), c.Y(p0), V.C.amber, 7, V.C.amberS);
        V.text(svg, c.X(y) + 10, c.Y(p0) - 16, V.rm(p0), { size: 13, anchor: 'start', weight: 700, color: V.C.amber });
        const cp = F * cr / m, i = y / m, n = N * m, af = (1 - Math.pow(1 + i, -n)) / i, pvC = cp * af, pvF = F / Math.pow(1 + i, n);
        const conv = m === 2 ? `Semiannual: coupon $C = \\dfrac{${V.tp(cr, 2)} \\times 1{,}000}{2} = ${V.trm(cp)}$, yield per half-year $i = \\dfrac{${V.tp(y, 1)}}{2} = ${V.tp(i, 2)}$, periods $n = ${N} \\times 2 = ${n}$.`
            : `Annual: coupon $C = ${V.tp(cr, 2)} \\times 1{,}000 = ${V.trm(cp)}$, yield $i = ${V.tp(i, 2)}$, periods $n = ${n}$.`;
        const d = cr - y;
        const verdict = Math.abs(d) < 0.0005 ? `<span class="vis-verdict even">at par</span> the coupon rate equals the required yield.`
            : d < 0 ? `<span class="vis-verdict bad">discount</span> the $${V.tp(cr, 2)}$ coupon is below the $${V.tp(y, 1)}$ required yield, so the price must sit below par for a buyer to earn that yield.`
                : `<span class="vis-verdict good">premium</span> the $${V.tp(cr, 2)}$ coupon is above the $${V.tp(y, 1)}$ required yield, so buyers bid the price above par.`;
        const ch = P(y + 0.01, N) / p0 - 1, ch2 = P(y + 0.01, nCmp) / P(y, nCmp) - 1;
        V.math(read, conv + `$$\\begin{gathered}P_0 = C\\left[\\frac{1-(1+i)^{-n}}{i}\\right] + \\frac{F}{(1+i)^{n}} \\\\ = ${V.trm(cp)} \\times ${V.tn(af, 4)} + \\frac{1{,}000}{${V.tn(1 + i, 4)}^{${n}}} \\\\ = ${V.trm(pvC)} + ${V.trm(pvF)} = \\boxed{${V.trm(p0)}}\\end{gathered}$$` +
            verdict + ` If the yield rises by $1$ percentage point, this bond moves $${V.tp(ch)}$; the ${nCmp}-year bond with the same coupon moves $${V.tp(ch2)}$. ` +
            (N > nCmp ? 'The longer the maturity, the steeper the curve and the bigger the price swing.' : 'The longer bond has the steeper curve: more price risk.'));
    }
    draw();
};

ML_VIS.l11_yields = function (root) {
    const F = 1000;
    let P0 = 1000, C = 100, N = 10, Nc = 2, CP = 1050, P1 = 960;
    const svg = V.svg(560, 230), read = V.h('p', { class: 'vis-readout' });
    const sl = {
        P0: V.slider('price today', 500, 1500, 0.5, P0, v => { P0 = v; draw(); }, v => 'RM' + V.fmt(v, 2)),
        C: V.slider('annual coupon', 0, 150, 2.5, C, v => { C = v; draw(); }, v => 'RM' + V.fmt(v, 1)),
        N: V.slider('years to maturity', 1, 30, 1, N, v => { N = v; draw(); }),
        Nc: V.slider('years to first call (0 = not callable)', 0, 10, 1, Nc, v => { Nc = v; draw(); }),
        CP: V.slider('call price', 1000, 1150, 5, CP, v => { CP = v; draw(); }, v => 'RM' + V.fmt(v, 0)),
        P1: V.slider('expected price in 1 year', 500, 1500, 5, P1, v => { P1 = v; draw(); }, v => 'RM' + V.fmt(v, 0)),
    };
    const presets = {
        q4: { P0: 1000, C: 100, N: 10, Nc: 2, CP: 1050, P1: 960 },
        ytm: { P0: 809.5, C: 75, N: 15, Nc: 0, CP: 1050, P1: 820 },
        ytc: { P0: 1204, C: 105, N: 20, Nc: 5, CP: 1085, P1: 1190 },
    };
    root.append(V.seg([['q4', 'Subjective Q4 bond'], ['ytm', 'Slide YTM example'], ['ytc', 'Slide YTC example']], 'q4', k => {
        Object.entries(presets[k]).forEach(([key, v]) => BOND11.setSlider(sl[key], v));
    }), V.h('div', { class: 'vis-row' }, sl.P0, sl.C, sl.N), V.h('div', { class: 'vis-row' }, sl.Nc, sl.CP, sl.P1), svg, read);
    function draw() {
        V.clear(svg);
        const cy = C / P0, ytm = BOND11.irr(BOND11.flows(C, F, N), P0), callable = Nc > 0 && Nc < N;
        const ytc = callable ? BOND11.irr(BOND11.flows(C, CP, Nc), P0) : NaN, hpr = (C + P1 - P0) / P0, approx = (C + (F - P0) / N) / ((F + P0) / 2);
        const rows = [['coupon rate (C / par)', C / F, V.C.slate], ['current yield', cy, V.C.amber], ['yield to maturity', ytm, V.C.indigo]];
        if (callable) rows.push(['yield to call', ytc, V.C.violet]);
        rows.push(['1-year HPR', hpr, V.C.green]);
        const vals = rows.map(r => r[1]).filter(Number.isFinite), lo = Math.min(0, ...vals), hi = Math.max(0.02, ...vals) * 1.12;
        const x0 = 185, x1 = 470, X = v => x0 + (v - lo) / (hi - lo) * (x1 - x0), r = V.rng(11), h = 26, gap = (210 - rows.length * h) / (rows.length + 1);
        svg.append(V.s('line', { x1: X(0), x2: X(0), y1: 8, y2: 222, stroke: '#94a3b8', 'stroke-width': 1.4 }));
        rows.forEach(([lab, v, col], k) => {
            const yy = 10 + gap + k * (h + gap);
            V.text(svg, x0 - 10, yy + h / 2, lab, { size: 14, anchor: 'end', color: '#334155' });
            if (!Number.isFinite(v)) { V.text(svg, X(0) + 8, yy + h / 2, 'no solution', { size: 12, anchor: 'start', color: '#64748b' }); return; }
            const a = Math.min(X(0), X(v)), w = Math.max(2, Math.abs(X(v) - X(0)));
            V.rrect(svg, a, yy, w, h, col, col === V.C.slate ? V.C.slateS : col === V.C.amber ? V.C.amberS : col === V.C.indigo ? V.C.indigoS : col === V.C.violet ? V.C.violetS : V.C.greenS, r);
            V.text(svg, v >= 0 ? a + w + 8 : X(0) + 8, yy + h / 2, V.pct(v, 2), { size: 14, weight: 700, anchor: 'start', color: col });
        });
        const pos = P0 < F - 0.005 ? 'discount' : P0 > F + 0.005 ? 'premium' : 'par';
        const order = pos === 'discount' ? 'Price below par: coupon rate $&lt;$ current yield $&lt;$ YTM, because the climb back to par adds to the return.'
            : pos === 'premium' ? 'Price above par: coupon rate $&gt;$ current yield $&gt;$ YTM, because the fall back to par subtracts from the return.'
                : 'Price at par: coupon rate, current yield and YTM coincide.';
        const ytcTxt = callable
            ? `$$\\begin{gathered}${V.trm(P0)} = \\sum_{t=1}^{${Nc}} \\frac{${V.tn(C, 1)}}{(1+YTC)^t} + \\frac{${V.tn(CP, 0)}}{(1+YTC)^{${Nc}}} \\\\ \\Rightarrow\\; YTC = \\boxed{${V.tp(ytc)}}\\end{gathered}$$ It assumes the issuer calls at $${V.trm(CP, 0)}$ after year ${Nc}: a scenario, not a prediction.`
            : `<br>Yield to call: not shown (set years to first call between $1$ and the maturity).`;
        V.math(read, `$$CY = \\frac{C}{P_0} = \\frac{${V.tn(C, 1)}}{${V.tn(P0)}} = \\boxed{${V.tp(cy)}}$$` +
            `$$\\begin{gathered}${V.trm(P0)} = \\sum_{t=1}^{${N}} \\frac{${V.tn(C, 1)}}{(1+YTM)^t} + \\frac{1{,}000}{(1+YTM)^{${N}}} \\\\ \\Rightarrow\\; YTM = \\boxed{${Number.isFinite(ytm) ? V.tp(ytm) : '\\text{no solution}'}}\\end{gathered}$$` +
            `Solved by trial and error (as a calculator does). A rough shortcut sometimes used for a check, not in the notes: $\\dfrac{C + (F - P_0)/N}{(F + P_0)/2} = ${V.tp(approx)}$.` + ytcTxt +
            `$$HPR = \\frac{C + P_1 - P_0}{P_0} = \\frac{${V.tn(C, 1)} + ${V.tn(P1, 0)} - ${V.tn(P0)}}{${V.tn(P0)}} = \\boxed{${V.tp(hpr)}}$$` + order +
            ' YTM is a promised yield: it needs every payment on time, holding to maturity and reinvestment at the YTM itself.');
    }
    draw();
};

ML_VIS.l11_duration = function (root) {
    let cr = 0.075, N = 15, y = 0.08, dy = 0.01;
    const F = 1000, saw = V.svg(560, 215), svg = V.svg(560, 270), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' },
        V.slider('coupon rate', 0, 15, 0.5, cr * 100, v => { cr = v / 100; draw(); }, v => v + '%'),
        V.slider('years to maturity', 1, 30, 1, N, v => { N = v; draw(); }),
        V.slider('yield', 1, 15, 0.1, y * 100, v => { y = v / 100; draw(); }, v => v.toFixed(1) + '%'),
        V.slider('yield change Δy', -3, 3, 0.1, dy * 100, v => { dy = v / 100; draw(); }, v => (v > 0 ? '+' : '') + v.toFixed(1) + ' pp')),
        V.h('p', { class: 'vis-note' }, 'Annual coupons, RM1,000 par. Starts at the Table 11.1 bond: 7.5% coupon, 15 years, priced to yield 8%.'), saw, svg, read);
    function draw() {
        V.clear(saw); V.clear(svg);
        const c = F * cr, P = BOND11.price(c, F, y, N), D = BOND11.mac(c, F, y, N), Dm = D / (1 + y), r = V.rng(5);
        // ---- seesaw: PV of each cash flow sitting on a plank, balanced at D
        const X = t => 40 + t / N * 470, plank = 150, pvs = BOND11.flows(c, F, N).map(([t, cf]) => [t, cf / Math.pow(1 + y, t)]);
        const maxPv = Math.max(...pvs.map(p => p[1])), bw = Math.max(3, Math.min(26, 380 / N));
        V.rline(saw, 24, plank, 528, plank, '#334155', 3, r);
        pvs.forEach(([t, pv]) => { const hh = Math.max(1.5, pv / maxPv * 112); V.rrect(saw, X(t) - bw / 2, plank - hh - 1, bw, hh, t === N ? V.C.indigo : V.C.sky, t === N ? V.C.indigoS : V.C.skyS, r, 1.2); });
        const fx = X(D);
        saw.append(V.s('path', { d: `M${fx} ${plank + 3} L${fx - 15} ${plank + 30} L${fx + 15} ${plank + 30} Z`, fill: '#fee2e2', stroke: V.C.red, 'stroke-width': 2 }));
        V.text(saw, fx, plank + 46, `D = ${V.fmt(D, 2)} years`, { size: 14, weight: 700, color: V.C.red, anchor: fx > 430 ? 'end' : fx < 110 ? 'start' : 'middle' });
        if (X(N) - fx > 70) V.text(saw, X(N), plank + 16, `maturity ${N}`, { size: 12, color: '#64748b' });
        V.text(saw, 24, 16, 'bars = present value of each cash flow; the plank balances at D', { size: 13, anchor: 'start', color: '#475569' });
        // ---- price-yield curve with the duration tangent
        const lo = Math.max(0.002, y - 0.045), hi = y + 0.045, pr = yy => BOND11.price(c, F, yy, N);
        const pMax = pr(lo), pMin = pr(hi), pad = (pMax - pMin) * 0.12;
        const g = V.chart(svg, { x0: 78, x1: 520, y0: 230, y1: 26, X: [lo, hi], Y: [pMin - pad, pMax + pad], xticks: [y - 0.04, y - 0.02, y, y + 0.02, y + 0.04].filter(t => t >= lo - 1e-9), yticks: [pMin, P, pMax], fx: t => V.pct(t, 1), fy: t => 'RM' + V.fmt(t, 0), xlabel: 'yield', ylabel: 'price' });
        const curvePts = [];
        for (let k = 0; k <= 60; k++) { const yy = lo + (hi - lo) * k / 60; curvePts.push([g.X(yy), g.Y(pr(yy))]); }
        V.path(svg, curvePts, V.C.indigo, 3);
        const tan = yy => P * (1 - Dm * (yy - y)), tl = Math.max(lo, y - 0.035), th = Math.min(hi, y + 0.035);
        V.path(svg, [[g.X(tl), g.Y(tan(tl))], [g.X(th), g.Y(tan(th))]], V.C.rose, 2, { 'stroke-dasharray': '7 5' });
        V.text(svg, g.X(tl) + 4, g.Y(tan(tl)) + 56, 'duration line', { size: 12, anchor: 'start', color: V.C.rose });
        V.text(svg, g.X(lo) + 8, g.Y(pr(lo)) + 4, 'actual price', { size: 12, anchor: 'start', weight: 700, color: V.C.indigo });
        V.dot(svg, g.X(y), g.Y(P), V.C.slate, 5);
        const y1 = y + dy, P1 = pr(y1), est = -Dm * dy, act = P1 / P - 1;
        if (Math.abs(dy) > 1e-9) {
            V.dot(svg, g.X(y1), g.Y(P1), V.C.indigo, 6, V.C.indigoS);
            V.dot(svg, g.X(y1), g.Y(P * (1 + est)), V.C.rose, 6, V.C.roseS);
        }
        const wt = k => V.tn(pvs[k][1] / P, 4);
        const terms = pvs.length <= 3 ? pvs.map(([t], k) => `${t}(${wt(k)})`).join(' + ')
            : `1(${wt(0)}) + 2(${wt(1)}) + \\cdots + ${N}(${wt(N - 1)})`;
        V.math(read, `Price at $${V.tp(y, 1)}$: $${V.trm(P)}$. Each weight is $\\dfrac{PV(CF_t)}{P_0}$, for example $\\dfrac{${V.tn(pvs[0][1])}}{${V.tn(P)}} = ${wt(0)}$ for year $1$.` +
            `$$\\begin{gathered}D_{Mac} = \\sum_{t=1}^{${N}} t\\,\\frac{PV(CF_t)}{P_0} \\\\ = ${terms} = \\boxed{${V.tn(D, 4)}\\text{ years}}\\end{gathered}$$` +
            `$$D_{mod} = \\frac{D_{Mac}}{1+y} = \\frac{${V.tn(D, 4)}}{${V.tn(1 + y, 3)}} = \\boxed{${V.tn(Dm, 4)}}$$` +
            (Math.abs(dy) > 1e-9
                ? `$$\\frac{\\Delta P}{P} \\approx -D_{mod}\\,\\Delta y = -${V.tn(Dm, 4)} \\times ${V.par(V.tn(dy, 4))} = \\boxed{${V.tp(est)}}$$` +
                `Full repricing at $${V.tp(y1, 1)}$ gives $${V.trm(P1)}$, an actual change of <b>$${V.tp(act)}$</b>. The gap of $${V.tp(act - est, 3)}$ is convexity: the curve bends above the straight duration line, so the estimate overstates a fall and understates a rise. The bigger $\\Delta y$, the bigger the gap.`
                : 'Move the yield-change slider to compare the duration estimate with the full repricing.') +
            ` A ${cr === 0 ? 'zero-coupon bond has all its value at maturity, so its duration equals its maturity' : 'higher coupon or a higher yield moves the balance point earlier; a longer maturity moves it later'}.`);
    }
    draw();
};

ML_VIS.l11_horizon = function (root) {
    // an 8% annual-coupon, 10-year bond bought at par when yields are 8%; yields then jump once and stay there
    const F = 1000, C = 80, N = 10, Y0 = 0.08, DUR = BOND11.mac(C, F, Y0, N);
    let H = 8, ny = 0.06;
    const svg = V.svg(560, 290), read = V.h('p', { class: 'vis-readout' });
    root.append(V.h('div', { class: 'vis-row' },
        V.slider('investment horizon (years)', 1, 10, 0.25, H, v => { H = v; draw(); }, v => v.toFixed(2)),
        V.slider('new market yield right after purchase', 2, 14, 0.1, ny * 100, v => { ny = v / 100; draw(); }, v => v.toFixed(1) + '%')),
        V.h('p', { class: 'vis-note' }, `Bond: 8% annual coupon, 10 years, bought at RM1,000 when yields are 8%. Its Macaulay duration is ${V.fmt(DUR, 2)} years. Yields jump once, then stay put.`), svg, read);
    const parts = (yy, h) => {
        let re = 0, sale = 0;
        BOND11.flows(C, F, N).forEach(([t, cf]) => { if (t <= h + 1e-9) re += cf * Math.pow(1 + yy, h - t); else sale += cf / Math.pow(1 + yy, t - h); });
        return { re, sale, w: re + sale };
    };
    const realized = (yy, h) => Math.pow(parts(yy, h).w / F, 1 / h) - 1;
    function draw() {
        V.clear(svg);
        const xs = []; for (let k = 0; k <= 60; k++) xs.push(0.02 + 0.12 * k / 60);
        const rs = xs.map(x => realized(x, H)), lo0 = Math.min(...rs), hi0 = Math.max(...rs);
        const mid = 0.08, half = Math.max(0.02, Math.abs(hi0 - mid), Math.abs(lo0 - mid)) * 1.1;
        const c = V.chart(svg, { x0: 78, x1: 520, y0: 245, y1: 28, X: [0.02, 0.14], Y: [mid - half, mid + half], xticks: [0.02, 0.04, 0.06, 0.08, 0.1, 0.12, 0.14], yticks: [mid - half, mid, mid + half], fx: t => V.pct(t, 0), fy: t => V.pct(t, 1), xlabel: 'new market yield', ylabel: 'realized annual return over the horizon' });
        svg.append(V.s('line', { x1: c.X(0.02), x2: c.X(0.14), y1: c.Y(mid), y2: c.Y(mid), stroke: V.C.green, 'stroke-width': 1.6, 'stroke-dasharray': '6 5' }));
        V.text(svg, c.X(0.14), c.Y(mid) + 16, '8% target', { size: 12, anchor: 'end', color: V.C.green });
        V.path(svg, xs.map((x, k) => [c.X(x), c.Y(rs[k])]), V.C.indigo, 3);
        const now = realized(ny, H), p = parts(ny, H), base = parts(Y0, H), target = F * Math.pow(1 + Y0, H);
        V.dot(svg, c.X(ny), c.Y(now), V.C.amber, 7, V.C.amberS);
        V.text(svg, c.X(ny) + (ny > 0.11 ? -10 : 10), c.Y(now) - 16, V.pct(now, 2), { size: 13, weight: 700, anchor: ny > 0.11 ? 'end' : 'start', color: V.C.amber });
        const gap = H - DUR, tilt = Math.abs(gap) < 0.4 ? `<span class="vis-verdict good">horizon ≈ duration</span> the curve is almost flat around $8\\%$: price and reinvestment effects offset, so the bond is close to immunized for small moves.`
            : gap < 0 ? `<span class="vis-verdict bad">horizon shorter than duration</span> price risk dominates: higher yields hurt because you must sell the bond early at a lower price.`
                : `<span class="vis-verdict bad">horizon longer than duration</span> reinvestment risk dominates: lower yields hurt because coupons are reinvested at lower rates for longer.`;
        const dR = p.re - base.re, dS = p.sale - base.sale, sg = v => (Math.abs(v) < 0.005 ? V.trm(0) : (v > 0 ? '+' : '') + V.trm(v));
        V.math(read, tilt +
            `$$W_H = \\underbrace{\\sum_{t \\le H} CF_t(1+y)^{H-t}}_{\\text{coupons reinvested}} + \\underbrace{\\sum_{t \\gt H} \\frac{CF_t}{(1+y)^{t-H}}}_{\\text{sale price at } H}$$ $$= ${V.trm(p.re)} + ${V.trm(p.sale)} = \\boxed{${V.trm(p.w)}}$$` +
            `Compared with yields staying at $8\\%$: reinvestment effect $${sg(dR)}$, price effect $${sg(dS)}$, net $${sg(p.w - target)}$ against the target $1{,}000 \\times 1.08^{${V.tn(H, 2)}} = ${V.trm(target)}$. ` +
            `Realized return $\\left(\\dfrac{W_H}{1{,}000}\\right)^{1/H} - 1 = ${V.tp(now)}$. Set the horizon near $${V.tn(DUR, 2)}$ years to see the curve flatten. Real immunization also needs rebalancing as duration drifts, and fails against large, non-parallel shifts, default or calls.`);
    }
    draw();
};
// Chapter 12 visuals: mutual funds and ETFs

// Money and prices always with two decimals (V.fmt drops trailing zeros: RM17.5 instead of RM17.50)
const L12F = {
    n2: n => Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
    rm: n => (n < 0 ? '-RM' : 'RM') + L12F.n2(n),
    tn: n => (n < 0 ? '-' : '') + L12F.n2(n).replace(/,/g, '{,}'),
    trm: n => (n < 0 ? '-' : '') + '\\text{RM}' + L12F.n2(n).replace(/,/g, '{,}')
};

// NAV per share, and the market price's premium or discount to it
ML_VIS.l12_nav = function (root) {
    let A = 105, L = 5, N = 10, P = 9, kind = 'cef';
    const svg = V.svg(560, 250), read = V.h('p', { class: 'vis-readout' });
    const sP = V.slider('market price per share', 3, 30, 0.05, P, v => { P = v; draw(); }, v => 'RM' + v.toFixed(2));
    root.append(
        V.seg([['open', 'open-end fund'], ['cef', 'closed-end fund'], ['etf', 'ETF']], kind, v => { kind = v; draw(); }),
        V.h('div', { class: 'vis-row' },
            V.slider('fund assets (RM million)', 50, 250, 1, A, v => { A = v; draw(); }, v => 'RM' + v + 'm'),
            V.slider('liabilities (RM million)', 0, 40, 0.5, L, v => { L = v; draw(); }, v => 'RM' + v + 'm'),
            V.slider('shares outstanding (million)', 4, 25, 0.5, N, v => { N = v; draw(); }, v => v + 'm'),
            sP),
        svg, read);
    function draw() {
        V.clear(svg);
        const r = V.rng(12), net = A - L, nav = net / N, open = kind === 'open';
        sP.input.disabled = open;
        sP.style.opacity = open ? 0.4 : 1;
        const price = open ? nav : P, gap = (price - nav) / nav;
        // balance-sheet bar: assets = liabilities + net assets
        const x0 = 40, W = 480, sx = W / 250;
        V.text(svg, x0, 18, 'what the fund owns and owes (RM million)', { size: 13, anchor: 'start', color: '#475569' });
        V.rrect(svg, x0, 30, net * sx, 38, V.C.green, V.C.greenS, r);
        if (L > 0) V.rrect(svg, x0 + net * sx, 30, Math.max(3, L * sx), 38, V.C.rose, V.C.roseS, r);
        V.text(svg, x0 + net * sx / 2, 49, 'net assets ' + V.fmt(net, 1), { size: 13, weight: 700, color: V.C.green });
        if (L > 0) V.text(svg, x0 + net * sx + Math.max(3, L * sx) + 6, 49, 'liabilities ' + V.fmt(L, 1), { size: 12, anchor: 'start', color: V.C.rose });
        V.text(svg, x0, 86, 'divide net assets by ' + V.fmt(N, 1) + 'm shares: NAV = RM' + nav.toFixed(2) + ' per share', { size: 13, anchor: 'start', color: '#475569' });
        // price ruler: NAV in the middle, -30% to +30%
        const lo = nav * 0.7, hi = nav * 1.3, X = v => x0 + (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo) * W, y = 170;
        V.rline(svg, x0, y, x0 + W, y, '#94a3b8', 1.6, r);
        [lo, nav, hi].forEach((t, i) => V.text(svg, X(t), y + 20, ['-30%', 'NAV', '+30%'][i], { size: 12, color: '#64748b' }));
        if (Math.abs(price - nav) > 1e-9) {
            const prem = price > nav, a = Math.min(X(price), X(nav)), b = Math.max(X(price), X(nav));
            svg.append(V.s('rect', { x: a, y: y - 16, width: b - a, height: 32, rx: 4, fill: prem ? V.C.roseS : V.C.skyS }));
            V.text(svg, (a + b) / 2, y - 30, prem ? 'premium' : 'discount', { size: 14, weight: 700, color: prem ? V.C.rose : V.C.sky });
        }
        V.rline(svg, X(nav), y - 26, X(nav), y + 8, V.C.green, 2.6, r);
        V.text(svg, X(nav), y - 54, 'NAV RM' + nav.toFixed(2), { size: 13, weight: 700, color: V.C.green });
        V.dot(svg, X(price), y, V.C.ink, 7, '#fff');
        V.text(svg, X(price), y + 42, (open ? 'you deal at NAV ' : 'market price ') + 'RM' + price.toFixed(2) + (price > hi || price < lo ? ' (off scale)' : ''), { size: 13, weight: 700 });
        let html = `$$NAV = \\frac{\\text{assets} - \\text{liabilities}}{\\text{shares}} = \\frac{${V.tn(A, 1)} - ${V.tn(L, 1)}}{${V.tn(N, 1)}} = \\boxed{${L12F.trm(nav)}}$$`;
        if (open) {
            html += 'In an open-end fund you buy from and sell back to the fund itself at the <b>next calculated NAV</b> (plus any sales load), so there is no market premium or discount for you to pay.';
        } else {
            const word = gap > 1e-9 ? 'premium' : gap < -1e-9 ? 'discount' : 'neither premium nor discount';
            html += `$$\\frac{P - NAV}{NAV} = \\frac{${L12F.tn(P)} - ${L12F.tn(nav)}}{${L12F.tn(nav)}} = \\boxed{${V.tp(gap)}}$$` +
                `A <b>${word}</b>${Math.abs(gap) > 1e-9 ? ` of $${L12F.trm(Math.abs(P - nav))}$ a share` : ''}. ` +
                (kind === 'cef'
                    ? 'A closed-end fund\'s share count is fixed, so supply and demand set its price. A discount can persist or widen: by itself it is not proof of a bargain.'
                    : 'For an ETF a gap this size gives authorized participants a reason to create or redeem shares, which tends to narrow it. Check that price and NAV refer to the same moment.');
        }
        V.math(read, html);
    }
    draw();
};

// Front-end load: what it takes from the amount paid, and the return needed to recover it
ML_VIS.l12_load = function (root) {
    let paid = 10000, nav = 10, load = 0.03, r = 0.05, base = 'offer';
    const svg = V.svg(560, 230), read = V.h('p', { class: 'vis-readout' });
    root.append(
        V.seg([['offer', 'load quoted as % of amount paid (offer price)'], ['nav', 'load quoted as % of amount invested (NAV)']], base, v => { base = v; draw(); }),
        V.h('div', { class: 'vis-row' },
            V.slider('amount paid', 1000, 50000, 500, paid, v => { paid = v; draw(); }, v => 'RM' + V.fmt(v, 0)),
            V.slider('NAV per share', 5, 30, 0.5, nav, v => { nav = v; draw(); }, v => 'RM' + v.toFixed(2)),
            V.slider('front-end load', 0, 8.5, 0.25, load * 100, v => { load = v / 100; draw(); }, v => V.fmt(v, 2) + '%'),
            V.slider('fund return over the year', -10, 20, 0.5, r * 100, v => { r = v / 100; draw(); }, v => V.fmt(v, 1) + '%')),
        svg, read);
    function draw() {
        V.clear(svg);
        const g = V.rng(5);
        const inv = base === 'offer' ? paid * (1 - load) : paid / (1 + load), fee = paid - inv, shares = inv / nav;
        const offer = base === 'offer' ? nav / (1 - load) : nav * (1 + load), end = inv * (1 + r), ret = end / paid - 1, need = paid / inv - 1;
        const top = Math.max(paid, end) * 1.05, H = 150, by = 190, Y = v => v / top * H;
        // bar 1: amount paid split into load and invested
        V.rrect(svg, 80, by - Y(inv), 120, Y(inv), V.C.sky, V.C.skyS, g);
        if (fee > 0) V.rrect(svg, 80, by - Y(paid), 120, Math.max(2, Y(fee)), V.C.rose, V.C.roseS, g);
        V.text(svg, 140, by - Y(inv) / 2, 'invested', { size: 14, weight: 700, color: V.C.sky });
        V.text(svg, 140, by + 18, 'when you buy', { size: 13, color: '#475569' });
        if (fee > 0) V.text(svg, 208, by - Y(paid) + 18, 'load ' + V.rm(fee, 0) + ' (top slice)', { size: 13, anchor: 'start', weight: 700, color: V.C.rose });
        // bar 2: value after one year
        V.rrect(svg, 360, by - Y(end), 120, Y(end), end >= paid ? V.C.green : V.C.amber, end >= paid ? V.C.greenS : V.C.amberS, g);
        V.text(svg, 420, by - Y(end) / 2, V.rm(end, 0), { size: 14, weight: 700 });
        V.text(svg, 420, by + 18, 'after one year', { size: 13, color: '#475569' });
        // dashed line at the amount paid
        V.rline(svg, 60, by - Y(paid), 520, by - Y(paid), V.C.ink, 1.4, g, { 'stroke-dasharray': '6 5' });
        V.text(svg, 520, by - Y(paid) - 10, 'amount paid ' + V.rm(paid, 0), { size: 12, anchor: 'end', color: '#475569' });
        V.rline(svg, 40, by, 540, by, '#94a3b8', 1.4, g);
        const L = V.tp(load), quoted = base === 'offer'
            ? `$$\\text{invested} = ${V.trm(paid, 0)} \\times (1 - ${L}) = \\boxed{${L12F.trm(inv)}}$$` +
              `The load is $${L12F.trm(fee)}$.` +
              `$$\\text{offer price} = \\frac{NAV}{1 - L} = \\frac{${L12F.tn(nav)}}{1 - ${L}} = ${V.trm(offer, 3)}$$` +
              `As a share of NAV the same load is $\\dfrac{L}{1 - L} = ${V.tp(load / (1 - load), 3)}$. `
            : `$$\\text{invested} = \\frac{${V.trm(paid, 0)}}{1 + ${L}} = \\boxed{${L12F.trm(inv)}}$$` +
              `The load is $${L12F.trm(fee)}$.` +
              `$$\\text{offer price} = NAV(1 + L) = ${L12F.tn(nav)}(1 + ${L}) = ${V.trm(offer, 3)}$$` +
              `As a share of the amount paid the same load is $\\dfrac{L}{1 + L} = ${V.tp(load / (1 + load), 3)}$. `;
        V.math(read, quoted +
            `You get $${L12F.trm(inv)} / ${L12F.trm(nav)} = ${V.tn(shares, 2)}$ shares. After a $${V.tp(r, 1)}$ year: $${L12F.trm(inv)}(1 ${r < 0 ? '-' : '+'} ${V.tp(Math.abs(r), 1)}) = ${L12F.trm(end)}$, ` +
            `a return of <b>$${V.tp(ret)}$</b> on the $${V.trm(paid, 0)}$ you paid, not $${V.tp(r, 1)}$. ` +
            `The fund must earn $${V.tp(need)}$ just to give you back what you paid.`);
    }
    draw();
};

// Fee drag: two funds, same gross return, different loads and expense ratios
ML_VIS.l12_fee_drag = function (root) {
    let amt = 10000, gross = 0.065, n = 10, la = 0, ea = 0.005, lb = 0, eb = 0.015, when = 'front';
    const svg = V.svg(560, 300), read = V.h('p', { class: 'vis-readout' });
    root.append(
        V.h('div', { class: 'vis-row' },
            V.slider('amount invested', 1000, 50000, 1000, amt, v => { amt = v; draw(); }, v => 'RM' + V.fmt(v, 0)),
            V.slider('gross return before expenses', 0, 12, 0.5, gross * 100, v => { gross = v / 100; draw(); }, v => V.fmt(v, 1) + '% a year'),
            V.slider('years held', 1, 40, 1, n, v => { n = v; draw(); })),
        V.h('div', { class: 'vis-row' },
            V.slider('Fund A load', 0, 6, 0.5, la * 100, v => { la = v / 100; draw(); }, v => v + '%'),
            V.slider('Fund A expense ratio', 0, 2.5, 0.05, ea * 100, v => { ea = v / 100; draw(); }, v => v.toFixed(2) + '%'),
            V.slider('Fund B load', 0, 6, 0.5, lb * 100, v => { lb = v / 100; draw(); }, v => v + '%'),
            V.slider('Fund B expense ratio', 0, 2.5, 0.05, eb * 100, v => { eb = v / 100; draw(); }, v => v.toFixed(2) + '%')),
        V.seg([['front', 'loads charged at entry (front-end)'], ['back', 'loads charged at exit (back-end)']], when, v => { when = v; draw(); }),
        svg, read);
    function draw() {
        V.clear(svg);
        const na = gross - ea, nb = gross - eb;
        const path = (l, net) => Array.from({ length: n + 1 }, (_, t) => {
            const v = (when === 'front' ? amt * (1 - l) : amt) * (1 + net) ** t;
            return when === 'back' && t === n ? v * (1 - l) : v;
        });
        const A = path(la, na), B = path(lb, nb), top = Math.max(...A, ...B, amt) * 1.08;
        const nice = Math.pow(10, Math.floor(Math.log10(top))), yMax = Math.ceil(top / nice * 2) * nice / 2;
        const c = V.chart(svg, { x0: 82, x1: 470, y0: 260, y1: 30, X: [0, n], Y: [0, yMax], xticks: [0, Math.round(n / 2), n], yticks: [0, yMax / 2, yMax], fy: t => 'RM' + V.fmt(t, 0), xlabel: 'years', ylabel: 'value of the holding', seed: 4 });
        const pa = A.map((v, t) => [c.X(t), c.Y(v)]), pb = B.map((v, t) => [c.X(t), c.Y(v)]);
        svg.append(V.s('path', { d: 'M' + pa.map(p => p.join(' ')).join(' L') + ' L' + pb.slice().reverse().map(p => p.join(' ')).join(' L') + ' Z', fill: V.C.amberS, opacity: 0.8 }));
        V.path(svg, pb, V.C.rose, 2.6);
        V.path(svg, pa, V.C.green, 2.6);
        const fa = A[n], fb = B[n], hiA = fa >= fb;
        V.text(svg, c.X(n) + 8, c.Y(fa) + (hiA ? -8 : 10), 'A ' + V.rm(fa, 0), { size: 13, weight: 700, anchor: 'start', color: V.C.green });
        V.text(svg, c.X(n) + 8, c.Y(fb) + (hiA ? 10 : -8), 'B ' + V.rm(fb, 0), { size: 13, weight: 700, anchor: 'start', color: V.C.rose });
        const g = net => (net < 0 ? '1 - ' : '1 + ') + V.tp(Math.abs(net));
        const f = (l, net) => when === 'front'
            ? `${V.trm(amt, 0)}(1 - ${V.tp(l, 1)})(${g(net)})^{${n}}`
            : `${V.trm(amt, 0)}(${g(net)})^{${n}}(1 - ${V.tp(l, 1)})`;
        const gap = fa - fb, free = amt * (1 + gross) ** n;
        V.math(read, `Net return $\\approx$ gross return $-$ expense ratio: A earns $${V.tp(na)}$, B earns $${V.tp(nb)}$ a year.` +
            `$$\\begin{aligned} FV_A &= ${f(la, na)} \\\\ &= ${L12F.trm(fa)} \\\\[4pt] FV_B &= ${f(lb, nb)} \\\\ &= ${L12F.trm(fb)} \\end{aligned}$$` +
            (Math.abs(gap) < 0.005 ? `With identical costs there is no gap after $${n}$ years. ` : `The shaded gap after $${n}$ years is <b>$${L12F.trm(Math.abs(gap))}$</b> in favour of Fund ${gap >= 0 ? 'A' : 'B'}. `) +
            `With no costs at all the money would have grown to $${V.trm(free, 0)}$, so A's costs took $${V.trm(free - fa, 0)}$ and B's took $${V.trm(free - fb, 0)}$. ` +
            'A load is a one-off cut; the expense ratio is taken every year, so its damage compounds with time.');
    }
    draw();
};

// Fund total return: distributions plus the change in NAV, with cash or reinvested distributions
ML_VIS.l12_total_return = function (root) {
    const s = { N: 100, P0: 10, P1: 10.4, inc: 0.3, cg: 0.2, Pr: 10 };
    let mode = 'cash';
    const svg = V.svg(560, 280), read = V.h('p', { class: 'vis-readout' }), sl = {};
    const mk = (k, label, min, max, step, fmt) => (sl[k] = V.slider(label, min, max, step, s[k], v => { s[k] = v; draw(); }, fmt));
    const rm = v => 'RM' + v.toFixed(2);
    const modeSeg = V.seg([['cash', 'distributions taken in cash'], ['reinvest', 'distributions reinvested']], mode, v => { mode = v; draw(); });
    const preset = (o, m) => () => {
        Object.entries(o).forEach(([k, v]) => { sl[k].input.value = v; sl[k].input.dispatchEvent(new Event('input')); });
        modeSeg.querySelectorAll('button')[m === 'cash' ? 0 : 1].click();
    };
    root.append(
        V.h('div', { class: 'vis-row' },
            V.btn('Subjective Q4 (cash)', preset({ N: 100, P0: 10, P1: 10.4, inc: 0.3, cg: 0.2, Pr: 10 }, 'cash')),
            V.btn('Subjective Q4(d) (reinvested)', preset({ N: 100, P0: 10, P1: 10.4, inc: 0.3, cg: 0.2, Pr: 10 }, 'reinvest')),
            V.btn('MCQ Q26', preset({ N: 100, P0: 10, P1: 10.5, inc: 0.5, cg: 0, Pr: 10 }, 'reinvest')),
            V.btn('Table 12.2, 2013', preset({ N: 1, P0: 24.47, P1: 29.14, inc: 0.55, cg: 1.75, Pr: 29.14 }, 'cash'))),
        modeSeg,
        V.h('div', { class: 'vis-row' },
            mk('N', 'shares held at the start', 1, 1000, 1),
            mk('P0', 'NAV at the start', 5, 35, 0.01, rm),
            mk('P1', 'NAV at the end', 5, 35, 0.01, rm),
            mk('inc', 'income paid per share', 0, 2, 0.01, rm),
            mk('cg', 'capital gains paid per share', 0, 3, 0.01, rm),
            mk('Pr', 'reinvestment price', 5, 35, 0.01, rm)),
        svg, read);
    function draw() {
        V.clear(svg);
        const { N, P0, P1, inc, cg, Pr } = s, re = mode === 'reinvest';
        sl.Pr.input.disabled = !re;
        sl.Pr.style.opacity = re ? 1 : 0.4;
        const begin = N * P0, D = N * (inc + cg), newSh = re ? D / Pr : 0;
        const steps = re
            ? [['start value', begin, 'base'], ['NAV change on the original shares', N * (P1 - P0), 'step'], ['distributions reinvested', D, 'step'], ['gain on the new shares', newSh * (P1 - Pr), 'step']]
            : [['start value', begin, 'base'], ['income distributions', N * inc, 'step'], ['capital-gain distributions', N * cg, 'step'], ['change in NAV', N * (P1 - P0), 'step']];
        const end = re ? (N + newSh) * P1 : N * P1 + D, hpr = end / begin - 1;
        steps.push(['ending wealth', end, 'base']);
        let run = 0; const bars = steps.map(([lab, v, t]) => { const a = t === 'base' ? null : run, b = t === 'base' ? v : run + v; run = b; return [lab, v, t, a, b]; });
        const vals = bars.flatMap(b => [b[3], b[4]]).filter(v => v !== null), lo = Math.min(...vals), hi = Math.max(...vals);
        const span = hi - lo || 1, ymin = Math.max(0, lo - span * 0.6), Y = v => 230 - (v - ymin) / (hi - ymin) * 170, g = V.rng(9);
        bars.forEach(b => { if (b[3] === null) b[3] = ymin; });
        V.rline(svg, 20, 230, 540, 230, '#94a3b8', 1.4, g);
        const w = 92;
        bars.forEach(([lab, v, t, a, b], i) => {
            const x = 30 + i * 104, top = Y(Math.max(a, b)), h = Math.max(2, Math.abs(Y(a) - Y(b)));
            const col = t === 'base' ? V.C.indigo : v >= 0 ? V.C.green : V.C.rose, fill = t === 'base' ? V.C.indigoS : v >= 0 ? V.C.greenS : V.C.roseS;
            V.rrect(svg, x, top, w, h, col, fill, g);
            V.text(svg, x + w / 2, top - 10, (t === 'step' && v >= 0 ? '+' : '') + L12F.rm(v), { size: 12, weight: 700, color: col });
            const words = lab.split(' '), half = Math.ceil(words.length / 2);
            V.text(svg, x + w / 2, 248, words.slice(0, half).join(' '), { size: 11, color: '#475569' });
            V.text(svg, x + w / 2, 263, words.slice(half).join(' '), { size: 11, color: '#475569' });
        });
        if (ymin > 0) V.text(svg, 24, 20, 'bars start at ' + V.rm(ymin, 0) + ', not at zero, so the small pieces show', { size: 12, anchor: 'start', color: '#64748b' });
        V.math(read, re
            ? `Distributions $${V.tn(N, 0)} \\times ${L12F.trm(inc + cg)} = ${L12F.trm(D)}$ buy $${L12F.trm(D)} / ${L12F.trm(Pr)} = ${V.tn(newSh, 4)}$ new shares, so you end with $${V.tn(N + newSh, 4)}$ shares.` +
              `$$N_1 P_1 = ${V.tn(N + newSh, 4)} \\times ${L12F.tn(P1)} = ${L12F.trm(end)},\\quad N_0 P_0 = ${L12F.trm(begin)}$$` +
              `$$HPR = \\frac{N_1 P_1 - N_0 P_0}{N_0 P_0} = \\frac{${L12F.tn(end)} - ${L12F.tn(begin)}}{${L12F.tn(begin)}} = \\boxed{${V.tp(hpr)}}$$` +
              `The $${L12F.trm(D)}$ is already inside the ending value through the new shares. Adding it again as cash would count it twice.`
            : `$$HPR = \\frac{(P_1 - P_0) + \\text{income} + \\text{capital gains}}{P_0}$$` +
              `$$= \\frac{(${L12F.tn(P1)} - ${L12F.tn(P0)}) + ${L12F.tn(inc)} + ${L12F.tn(cg)}}{${L12F.tn(P0)}} = \\boxed{${V.tp(hpr)}}$$` +
              `In ringgit: $${L12F.trm(N * P1)}$ of shares plus $${L12F.trm(D)}$ of cash against $${L12F.trm(begin)}$ at the start. ` +
              (Math.abs(P1 - P0) < 1e-9 ? 'NAV did not move, yet the return is not zero: the distributions are return too. ' : '') +
              'Using the NAV change alone would leave out the distributions.');
    }
    draw();
};

// Integrated case: index mutual fund with automatic monthly investing vs an index ETF bought through a broker
ML_VIS.l12_etf_vs_mf = function (root) {
    let c = 200, yrs = 20, gross = 0.07, ea = 0.003, eb = 0.001, comm = 5, spread = 0.002, freq = 12;
    const svg = V.svg(560, 290), read = V.h('p', { class: 'vis-readout' });
    root.append(
        V.h('div', { class: 'vis-row' },
            V.slider('saved each month', 50, 2000, 50, c, v => { c = v; draw(); }, v => 'RM' + V.fmt(v, 0)),
            V.slider('years', 1, 40, 1, yrs, v => { yrs = v; draw(); }),
            V.slider('gross index return', 0, 12, 0.5, gross * 100, v => { gross = v / 100; draw(); }, v => V.fmt(v, 1) + '%')),
        V.h('div', { class: 'vis-row' },
            V.slider('mutual fund expense ratio', 0, 1.5, 0.05, ea * 100, v => { ea = v / 100; draw(); }, v => v.toFixed(2) + '%'),
            V.slider('ETF expense ratio', 0, 1.5, 0.05, eb * 100, v => { eb = v / 100; draw(); }, v => v.toFixed(2) + '%'),
            V.slider('ETF commission per trade', 0, 20, 0.5, comm, v => { comm = v; draw(); }, v => 'RM' + v.toFixed(2)),
            V.slider('ETF spread + premium', 0, 1, 0.05, spread * 100, v => { spread = v / 100; draw(); }, v => v.toFixed(2) + '%')),
        V.seg([[12, 'buy the ETF monthly'], [4, 'quarterly'], [1, 'once a year']], freq, v => { freq = v; draw(); }),
        svg, read);
    function draw() {
        V.clear(svg);
        const ma = (1 + gross - ea) ** (1 / 12) - 1, mb = (1 + gross - eb) ** (1 / 12) - 1, every = 12 / freq;
        let A = 0, B = 0, cash = 0, trade = 0, buys = 0;
        const diff = [[0, 0]];
        for (let m = 1; m <= yrs * 12; m++) {
            A = (A + c) * (1 + ma);
            cash += c;
            if ((m - 1) % every === 0 || m === yrs * 12) {
                const cost = Math.min(cash, comm + cash * spread);
                trade += cost; buys++;
                B += cash - cost; cash = 0;
            }
            B *= 1 + mb;
            if (m % 12 === 0) diff.push([m / 12, B + cash - A]);
        }
        const endB = B + cash, d = endB - A, ext = Math.max(10, ...diff.map(p => Math.abs(p[1]))) * 1.15;
        const ch = V.chart(svg, { x0: 82, x1: 500, y0: 250, y1: 30, X: [0, yrs], Y: [-ext, ext], xticks: [0, Math.round(yrs / 2), yrs], yticks: [-ext, 0, ext].map(v => Math.round(v)), fy: t => (t > 0 ? '+' : '') + V.rm(t, 0), xlabel: 'years', ylabel: 'ETF value minus mutual-fund value', seed: 6 });
        V.rline(svg, 82, ch.Y(0), 500, ch.Y(0), V.C.ink, 1.4, V.rng(2), { 'stroke-dasharray': '5 5' });
        const pts = diff.map(([t, v]) => [ch.X(t), ch.Y(v)]);
        V.path(svg, pts, d >= 0 ? V.C.violet : V.C.rose, 2.8);
        V.text(svg, 92, ch.Y(ext) + 14, 'above the line: ETF ahead', { size: 12, anchor: 'start', color: V.C.violet });
        V.text(svg, 92, ch.Y(-ext) - 14, 'below the line: mutual fund ahead', { size: 12, anchor: 'start', color: V.C.rose });
        const cross = diff.findIndex((p, i) => i > 0 && p[1] > 0 && diff[i - 1][1] <= 0);
        if (cross > 0 && diff.slice(cross).every(p => p[1] > 0)) {
            V.dot(svg, ch.X(diff[cross][0]), ch.Y(diff[cross][1]), V.C.violet, 6);
            V.text(svg, ch.X(diff[cross][0]), ch.Y(diff[cross][1]) + 22, 'ETF pulls ahead in year ' + diff[cross][0], { size: 12, weight: 700, color: V.C.violet });
        }
        const paid = c * yrs * 12;
        V.math(read, `Both track the same index. After $${yrs}$ years of saving $${V.trm(c, 0)}$ a month ($${V.trm(paid, 0)}$ in total):` +
            `$$\\begin{aligned} \\text{Fund A (mutual fund)} &= ${V.trm(A, 0)} \\\\ \\text{Fund B (ETF)} &= ${V.trm(endB, 0)} \\end{aligned}$$` +
            `The ETF made $${buys}$ purchases and paid $${V.trm(trade, 0)}$ in commissions and spreads; ` + (Math.abs(ea - eb) < 1e-9 ? 'the two expense ratios are the same. ' : `its expense ratio is $${V.tp(Math.abs(ea - eb))}$ ${ea > eb ? 'lower' : 'higher'} each year. `) +
            `Net result: <b>${d >= 0 ? 'the ETF ends ahead by' : 'the mutual fund ends ahead by'} $${V.trm(Math.abs(d), 0)}$</b>. ` +
            'Small, frequent purchases make per-trade costs bite; large balances held for long periods make the expense ratio matter more. The expense ratio alone never settles it.');
    }
    draw();
};
