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
        const rel = Math.abs(rate - coupon) < 1e-9 ? 'at <b>par</b>: the market rate equals the coupon rate' : rate > coupon ? `at a <b>discount</b>: new bonds pay ${V.pct(rate)}, so nobody pays full price for a 5% coupon` : `at a <b>premium</b>: new bonds pay only ${V.pct(rate)}, so the old 5% coupon is worth more`;
        read.innerHTML = `A 10-year bond with a fixed 5% coupon (RM50 a year) trades ${rel}. Price = <b>${V.rm(p)}</b>. The cash flows never change; only the rate used to discount them does: <b>rates ↑ ⇒ bond prices ↓</b>.`;
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
        // maths for KaTeX: a percent sign must be escaped, and thousands separators need braces
        const t = x => V.pct(x).replace('%', '\\%'), g = n => String(n).replace(/,/g, '{,}');
        const on = k => mode === k ? 'font-weight:800' : 'opacity:.75';
        const wealth = 10000 * (1 + after), power = wealth / (1 + infl);
        read.innerHTML =
            `<div>Step 1, take the <b>after-tax</b> return, where $t$ is the tax rate: $$R_{\\text{after-tax}} = R_{\\text{nominal}}\\,(1-t) = ${t(nominal)} \\times ${V.fmt(1 - tax, 2)} = ${t(after)}$$</div>` +
            `<div>Step 2, remove inflation $i = ${t(infl)}$ in one of two ways:</div>` +
            `<div style="${on('approx')}">1. Quick approximation: $$R_{\\text{real}} \\approx R_{\\text{after-tax}} - i = ${t(after)} - ${t(infl)} = ${t(approx)}$$</div>` +
            `<div style="${on('fisher')}">2. Exact (Fisher equation): $$R_{\\text{real}} = \\frac{1+R_{\\text{after-tax}}}{1+i} - 1 = \\frac{${V.fmt(1 + after, 4)}}{${V.fmt(1 + infl, 4)}} - 1 = ${t(exact)}$$</div>` +
            `<div>The approximation is ${approx >= exact ? 'higher' : 'lower'} than the exact answer by ${V.fmt(Math.abs(approx - exact) * 100, 3)} percentage points. The gap is small when inflation is low and grows as inflation rises.</div>` +
            `<div>Check in ringgit: $\\text{RM}${g(V.fmt(10000, 0))}$ grows to $\\text{RM}${g(V.fmt(wealth, 2))}$, which buys what $\\dfrac{${g(V.fmt(wealth, 2))}}{${V.fmt(1 + infl, 4)}} = \\text{RM}${g(V.fmt(power, 2))}$ buys today. That is a true change of $${t(exact)}$, so the exact method is the one that matches the money. ${real < 0 ? 'Here purchasing power <b>falls</b> although the balance rises.' : ''}</div>`;
        if (typeof renderMath === 'function') renderMath(read);
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
        read.innerHTML = `Buy 100 shares at RM50 with ${V.pct(initial, 0)} initial margin: your equity is ${V.rm(E0, 0)} and the loan is ${V.rm(D, 0)}. At RM${price} the stock has moved <b>${V.pct(cash, 1)}</b>, but your return on equity is <b>${V.pct(roe, 1)}</b> (before interest). ` +
            (call ? `<span class="vis-verdict bad">margin call</span> margin ${V.pct(m, 1)} is below the ${V.pct(maint, 0)} maintenance requirement.` : `<span class="vis-verdict good">no margin call</span> the call price is about <b>RM${V.fmt(crit, 2)}</b> = D / (shares x (1 - ${V.pct(maint, 0)})).`) +
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
        const c = V.chart(svg, { x0: 80, x1: 520, y0: 250, y1: 30, X: [0, 150], Y: [-10000, 10000], xticks: [0, 25, 50, 75, 100, 125, 150], yticks: [-10000, -5000, 0, 5000, 10000], fx: t => 'RM' + t, fy: t => (t < 0 ? '-' : '') + 'RM' + V.fmt(Math.abs(t), 0), xlabel: 'share price', ylabel: 'profit on 100 shares' });
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
            `Short-account margin = (RM7,500 - cost to buy back) / cost to buy back = <b>${price ? V.pct(m, 1) : '∞'}</b>${price && m < 0.3 ? ' <span class="vis-verdict bad">below 30%: margin call</span>' : ''}.`;
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
        read.innerHTML = `FV = PV(1 + r/m)<sup>mt</sup> = ${V.rm(pv, 0)} x (1 + ${V.pct(rate, 1)}/${m})<sup>${m}x${years}</sup> = <b>${V.rm(fvC(years))}</b>. Simple interest would give ${V.rm(fvS(years))}; the shaded gap of <b>${V.rm(fvC(years) - fvS(years))}</b> is interest earned on interest. ` +
            `True (effective) annual rate = (1 + r/m)<sup>m</sup> - 1 = <b>${V.pct(ear, 3)}</b>${m > 1 ? ` versus the stated ${V.pct(rate, 1)}` : ''}.`;
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
            `FV = PMT x [(1 + r)<sup>n</sup> - 1] / r${due ? ' x (1 + r)' : ''} = ${V.rm(pmt, 0)} x ${V.fmt(factor * (due ? 1 + rate : 1), 4)} = <b>${V.rm(fv)}</b> from ${V.rm(pmt * n, 0)} deposited. ` +
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
        read.innerHTML = `Shaded band = mean ± 1 standard deviation (sample, n - 1). ` +
            `<b>A</b>: mean ${V.fmt(A.m, 2)}%, σ = ${V.fmt(A.s, 2)}%, CV = ${cv(A)}. <b>B</b>: mean ${V.fmt(B.m, 2)}%, σ = ${V.fmt(B.s, 2)}%, CV = ${cv(B)}. ` +
            `σ measures <b>absolute</b> dispersion; CV = σ / mean measures risk <b>per unit of return</b>, so it is the fairer comparison when the averages differ.`;
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
        read.innerHTML = `Required return = R<sub>f</sub> + β(E(R<sub>m</sub>) - R<sub>f</sub>) = ${V.pct(rf, 1)} + ${beta.toFixed(2)} x ${V.pct(rm - rf, 1)} = <b>${V.pct(R)}</b>. Your estimate ${V.pct(er, 1)} gives expected alpha <b>${(alpha >= 0 ? '+' : '') + V.pct(alpha)}</b>: ${verdict}. ` +
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
    let line = null;
    function slice() {
        if (line) scene.remove(line);
        const pts = []; for (let i = 0; i <= 40; i++) { const w = i / 40; pts.push([(w - 0.5) * sz, sigmaP(w, rho) * 100 * k + 0.02, rho / 2 * sz]); }
        line = V.line3d(THREE, pts, 0xe11d48); scene.add(line); S.dirty();
        const den = PORT.sA ** 2 + PORT.sB ** 2 - 2 * rho * PORT.sA * PORT.sB, wMin = Math.min(1, Math.max(0, (PORT.sB ** 2 - rho * PORT.sA * PORT.sB) / den));
        read.innerHTML = `Height = portfolio σ for A (σ = 20%) and B (σ = 10%). The red slice is ρ = ${rho.toFixed(1)}: its lowest point is about <b>${V.pct(wMin, 0)}</b> in A, σ<sub>p</sub> = <b>${V.pct(sigmaP(wMin, rho))}</b>. Move ρ down and the whole valley sinks; only at ρ = -1 with w = 1/3 does risk reach zero.`;
    }
    slice();
};
