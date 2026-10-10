"""Hand-drawn (Excalidraw-style) diagrams rendered to inline SVG at build time."""
import math

from sketch import Sketch, PALETTE

RED = '#dc2626'
GREY = '#64748b'


def curve(s, pts, color, width=2.2, rough=0.4, dash=None):
    """A hand-drawn polyline through pts."""
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        s.line(x1, y1, x2, y2, color, width, rough=rough, dash=dash)


def axes(s, x0, y0, x1, y1, xlabel, ylabel, color=GREY):
    """Axes with the origin at (x0, y0); x runs to x1, y runs up to y1."""
    s.arrow(x0, y0, x1, y0, color, 1.6)
    s.arrow(x0, y0, x0, y1, color, 1.6)
    s.text(x1 - 4, y0 + 22, xlabel, size=15, anchor='end', color=color)
    s.text(x0 + 10, y1 - 4, ylabel, size=15, anchor='start', color=color)


# ------------------------------------------------------------------ Chapter 1
def l1_flow_funds():
    s = Sketch(920, 420, seed=101, title='How funds flow from suppliers to demanders: directly, through institutions or through markets')
    s.box(20, 160, 170, 100, 'Suppliers\nof funds', 'sky', size=19, bold=True, hachure=True)
    s.text(105, 285, 'mainly individuals\n(net suppliers)', size=14, color=PALETTE['sky'][0])
    s.box(730, 160, 170, 100, 'Demanders\nof funds', 'amber', size=19, bold=True, hachure=True)
    s.text(815, 285, 'businesses and\ngovernments\n(net demanders)', size=14, color=PALETTE['amber'][0])
    s.box(300, 30, 320, 84, 'Financial institutions\nbanks · insurers · pension funds', 'indigo', size=16)
    s.box(300, 306, 320, 84, 'Financial markets\nmoney (short term) · capital (long term)', 'lime', size=16)
    s.arrow(195, 175, 296, 80, PALETTE['indigo'][0])
    s.arrow(625, 80, 726, 175, PALETTE['indigo'][0])
    s.arrow(195, 245, 296, 340, PALETTE['lime'][0])
    s.arrow(625, 340, 726, 245, PALETTE['lime'][0])
    s.arrow(195, 210, 726, 210, '#475569', 2)
    s.text(460, 192, 'direct transactions', size=16, color='#475569')
    s.text(460, 140, 'why bother with a middleman?', size=14, color=PALETTE['indigo'][0])
    s.text(460, 240, 'screening · pooling · diversifying · monitoring', size=14, color=PALETTE['indigo'][0])
    return s.svg()


def l1_classify():
    s = Sketch(920, 440, seed=102, title='One investment carries several classification labels at the same time')
    s.ellipse(460, 220, 150, 62, PALETTE['amber'][0], PALETTE['amber'][1])
    s.text(460, 210, 'Units in an equity', size=18, weight=700)
    s.text(460, 236, 'mutual fund', size=18, weight=700)
    tiles = [
        (30, 30, 'Security or property?', 'SECURITY'),
        (330, 20, 'Direct or indirect?', 'INDIRECT (pooled)'),
        (630, 30, 'Debt, equity or derivative?', 'EQUITY exposure'),
        (30, 330, 'Low or high risk?', 'HIGHER than cash'),
        (330, 350, 'Short or long term?', 'LONG-TERM oriented'),
        (630, 330, 'Domestic or foreign?', 'depends on holdings'),
    ]
    for x, y, q, a in tiles:
        s.box(x, y, 260, 76, '', 'sky')
        s.text(x + 130, y + 24, q, size=15, color='#475569')
        s.text(x + 130, y + 52, a, size=17, weight=700, color=PALETTE['sky'][0])
    for x, y in ((290, 75), (460, 98), (630, 75), (290, 368), (460, 348), (630, 368)):
        s.line(460 + (x - 460) * 0.35, 220 + (y - 220) * 0.5, x, y, GREY, 1.3, dash='5 5')
    return s.svg()


def l1_seven_steps():
    s = Sketch(940, 430, seed=103, title='The seven-step investment process as a decision loop')
    steps = [('1  Meet prerequisites', 'emergency fund · insurance', 'SURVIVE'),
             ('2  Establish goals', 'retirement · income · purchases', 'DEFINE'),
             ('3  Adopt a plan', 'target dates · risk tolerance', 'PLAN'),
             ('4  Evaluate return & risk', 'expected return vs uncertainty', 'ANALYSE'),
             ('5  Select investments', 'research, then choose', 'SELECT'),
             ('6  Diversify the portfolio', 'spread across assets', 'DIVERSIFY'),
             ('7  Manage the portfolio', 'compare actual vs expected', 'MONITOR')]
    pos = [(20, 40), (320, 40), (620, 40), (620, 200), (320, 200), (20, 200), (320, 340)]
    for i, ((t, sub, key), (x, y)) in enumerate(zip(steps, pos)):
        s.box(x, y, 270, 96 if i < 6 else 76, '', 'sky' if i < 3 else 'indigo' if i < 6 else 'amber', hachure=(i == 6))
        s.text(x + 135, y + 24, t, size=17, weight=700)
        s.text(x + 135, y + 50, sub, size=14, color='#475569')
        s.text(x + 135, y + (74 if i < 6 else 66), key, size=14, weight=700, color=PALETTE['amber'][0])
    s.arrow(294, 88, 316, 88)
    s.arrow(594, 88, 616, 88)
    s.arrow(755, 140, 755, 196)
    s.arrow(616, 248, 594, 248)
    s.arrow(316, 248, 294, 248)
    s.arrow(155, 300, 316, 372)
    s.line(594, 378, 905, 378, PALETTE['amber'][0], 1.6, dash='7 6')
    s.line(905, 378, 905, 20, PALETTE['amber'][0], 1.6, dash='7 6')
    s.line(905, 20, 455, 20, PALETTE['amber'][0], 1.6, dash='7 6')
    s.arrow(455, 20, 455, 36, PALETTE['amber'][0], 1.6, head=8)
    s.text(750, 400, 'feedback loop: when actual results or circumstances\nchange, revisit the goals and the plan', size=14, color=PALETTE['amber'][0])
    return s.svg()


def l1_lifecycle():
    s = Sketch(920, 400, seed=104, title='Investing over the life cycle: growth, consolidation, income')
    stages = [('Growth-oriented youth', 'age ~20 to 45', 0.8, 'capital gains, higher risk'),
              ('Middle-age consolidation', 'age ~45 to 60', 0.5, 'move to higher-quality, lower risk'),
              ('Income-oriented retirement', 'age 60+', 0.2, 'preserve capital, earn income')]
    for i, (t, age, g, note) in enumerate(stages):
        x = 30 + i * 300
        s.box(x, 24, 260, 64, t + '\n' + age, ['rose', 'amber', 'sky'][i], size=16, bold=True)
        if i < 2:
            s.arrow(x + 264, 56, x + 296, 56)
        top, h = 120, 170
        s.rect(x + 70, top, 120, h * g, PALETTE['rose'][0], PALETTE['rose'][1], hachure=True)
        s.rect(x + 70, top + h * g, 120, h * (1 - g), PALETTE['sky'][0], PALETTE['sky'][1])
        s.text(x + 130, top + h * g / 2, 'growth' if g > 0.3 else '', size=14, weight=700, color=PALETTE['rose'][0])
        s.text(x + 130, top + h * g + h * (1 - g) / 2, 'income /\npreservation' if g < 0.7 else 'income', size=14, weight=700, color=PALETTE['sky'][0])
        s.text(x + 130, 312, note, size=14, color='#475569')
    s.arrow(60, 360, 880, 360, GREY, 1.6)
    s.text(470, 382, 'time left to recover from a market fall keeps shrinking  →  risk CAPACITY falls', size=15, color=RED)
    return s.svg()


# ------------------------------------------------------------------ Chapter 2
def l2_market_grid():
    s = Sketch(920, 430, seed=201, title='Two separate questions: has it been issued before, and how long until it matures?')
    x0, y0, cw, ch = 230, 70, 330, 150
    s.text(x0 + cw / 2, 40, 'MONEY market\nmatures within a year', size=16, weight=700, color=PALETTE['sky'][0])
    s.text(x0 + cw * 1.5, 40, 'CAPITAL market\nlonger term: stocks, bonds', size=16, weight=700, color=PALETTE['indigo'][0])
    s.text(115, y0 + ch / 2, 'PRIMARY\nnew issue:\nissuer gets\nthe cash', size=16, weight=700, color=PALETTE['lime'][0])
    s.text(115, y0 + ch * 1.5, 'SECONDARY\nresale: the\nseller gets\nthe cash', size=16, weight=700, color=PALETTE['amber'][0])
    cells = [('new 90-day Treasury bill\nbought at issuance', 'sky'), ('IPO shares, or a new\n10-year corporate bond', 'indigo'),
             ('that T-bill resold\nbefore it matures', 'sky'), ('shares traded between\ninvestors on an exchange', 'indigo')]
    for k, (t, tone) in enumerate(cells):
        x, y = x0 + (k % 2) * cw, y0 + (k // 2) * ch
        s.box(x + 8, y + 8, cw - 16, ch - 16, t, tone, size=16)
    s.text(460, 405, 'Classify BOTH dimensions: a new 10-year bond is primary AND capital market.', size=15, color=RED)
    return s.svg()


def l2_ipo_chain():
    s = Sketch(940, 430, seed=202, title='How a large new issue reaches investors, and how the investment bank is paid')
    s.box(30, 30, 200, 70, 'Issuing company\nneeds capital', 'slate', size=16, bold=True)
    s.arrow(235, 65, 315, 65)
    s.text(275, 45, 'sells issue', size=13, color=GREY)
    s.box(320, 20, 300, 90, 'Lead investment banker\n+ underwriting syndicate\nshare the underwriting risk', 'indigo', size=15, bold=True, hachure=True)
    s.arrow(625, 65, 705, 65)
    s.box(710, 30, 200, 70, 'Selling group\nwidens distribution', 'lime', size=15)
    s.arrow(810, 105, 810, 165)
    s.box(700, 170, 220, 64, 'Public investors', 'amber', size=17, bold=True)
    s.text(470, 160, 'bank buys at $19  →  investors pay $20', size=17, weight=700, color=PALETTE['indigo'][0])
    s.text(470, 192, 'the $1 spread pays for distribution work + underwriting risk', size=15, color='#475569')
    s.line(30, 262, 910, 262, '#94a3b8', 1.2, dash='6 8')
    steps = ['Prospectus\nfiled', 'Red herring\n(preliminary)', 'Quiet period', 'Road show\ntests demand', 'Offering\nprice set']
    for i, t in enumerate(steps):
        x = 30 + i * 180
        s.box(x, 290, 150, 70, t, 'sky', size=15)
        if i < 4:
            s.arrow(x + 154, 325, x + 176, 325)
    s.text(470, 395, 'disclosure reduces information asymmetry; marketing discovers the price', size=15, color=PALETTE['sky'][0])
    return s.svg()


def l2_broker_dealer():
    s = Sketch(940, 400, seed=203, title='A broker matches the two sides; a dealer is the other side')
    s.text(220, 28, 'BROKER market: agent', size=19, weight=700, color=PALETTE['sky'][0])
    s.box(20, 90, 120, 60, 'Seller', 'slate', size=16)
    s.box(300, 90, 120, 60, 'Buyer', 'slate', size=16)
    s.ellipse(220, 210, 80, 36, PALETTE['sky'][0], PALETTE['sky'][1])
    s.text(220, 210, 'Broker', size=17, weight=700)
    s.arrow(145, 120, 295, 120, '#475569', 2)
    s.text(220, 102, 'trade each other', size=14, color='#475569')
    s.arrow(80, 155, 160, 190, PALETTE['sky'][0], 1.4, dash='5 5')
    s.arrow(360, 155, 280, 190, PALETTE['sky'][0], 1.4, dash='5 5')
    s.text(220, 275, 'finds the other side\nearns a commission\nno inventory risk', size=15, color=PALETTE['sky'][0])
    s.line(470, 20, 470, 380, '#94a3b8', 1.2, dash='6 8')
    s.text(710, 28, 'DEALER market: principal', size=19, weight=700, color=PALETTE['amber'][0])
    s.box(485, 160, 100, 60, 'You sell', 'slate', size=16)
    s.box(835, 160, 100, 60, 'You buy', 'slate', size=16)
    s.ellipse(710, 190, 82, 50, PALETTE['amber'][0], PALETTE['amber'][1])
    s.text(710, 180, 'Dealer /', size=16, weight=700)
    s.text(710, 202, 'market maker', size=16, weight=700)
    s.arrow(590, 190, 624, 190)
    s.arrow(796, 190, 830, 190)
    s.text(600, 110, 'dealer BUYS at the\nBID: $99.50', size=15, weight=700, color=PALETTE['amber'][0])
    s.text(830, 110, 'dealer SELLS at the\nASK: $100.00', size=15, weight=700, color=PALETTE['amber'][0])
    s.text(710, 290, 'bid < ask: the $0.50 spread pays for\nliquidity and inventory risk', size=15, color='#475569')
    return s.svg()


def l2_margin_sheet():
    s = Sketch(920, 470, seed=204, title='With margin the loan stays fixed, so equity absorbs every price fall')
    base, scale = 340, 0.026
    cols = [('Buy: V = 10,000', 10000, 4000, 'margin = 6,000 / 10,000 = 60%'),
            ('Price −30%: V = 7,000', 7000, 4000, 'margin = 3,000 / 7,000 = 42.9%'),
            ('Critical: V = 5,714', 5714, 4000, 'margin = 30% → margin call')]
    for i, (t, v, d, note) in enumerate(cols):
        x = 60 + i * 290
        hd, he = d * scale, (v - d) * scale
        s.rect(x, base - hd, 170, hd, GREY, '#e2e8f0')
        s.text(x + 85, base - hd / 2, 'loan D = 4,000', size=15, weight=700, color='#334155')
        s.rect(x, base - hd - he, 170, he, PALETTE['green'][0], PALETTE['green'][1], hachure=True)
        s.text(x + 85, base - hd - he / 2, 'equity %s' % format(v - d, ','), size=15, weight=700, color=PALETTE['green'][0])
        s.text(x + 85, base + 24, t, size=15, weight=700)
        s.text(x + 85, base + 52, note, size=14, color=RED if i == 2 else '#475569')
    s.line(30, base, 900, base, GREY, 1.4)
    s.text(460, 30, 'stock fell 30%, but equity fell 50%: the debt did not shrink', size=17, weight=700, color=PALETTE['amber'][0])
    s.text(460, 448, 'margin = (V − D) / V   ·   margin-call value V* = D / (1 − m) = 4,000 / 0.70', size=15, color='#475569')
    return s.svg()


def l2_short_steps():
    s = Sketch(940, 420, seed=205, title='Short selling: borrow, sell, buy back, return, and why the loss is unlimited')
    steps = [('1  Borrow', '100 shares\nfrom the broker'), ('2  Sell now', 'at RM50:\n+RM5,000'),
             ('3  Buy back later', 'at RM30:\n−RM3,000'), ('4  Return shares', 'profit = RM2,000')]
    for i, (t, sub) in enumerate(steps):
        x = 20 + i * 230
        s.box(x, 30, 200, 100, '', 'rose' if i < 2 else 'lime')
        s.text(x + 100, 54, t, size=17, weight=700)
        s.text(x + 100, 98, sub, size=15, color='#475569')
        if i < 3:
            s.arrow(x + 204, 80, x + 226, 80)
    x0, y0 = 140, 360
    s.arrow(x0, y0 - 100, 860, y0 - 100, GREY, 1.4)
    s.arrow(x0, 395, x0, 170, GREY, 1.4)
    s.text(860, y0 - 80, 'share price', size=14, anchor='end', color=GREY)
    s.text(x0 - 12, 186, 'short-seller\nprofit', size=14, anchor='end', color=GREY)
    zero = y0 - 100
    curve(s, [(x0, zero - 60), (x0 + 200, zero), (700, zero + 120)], PALETTE['rose'][0], 2.6)
    s.text(x0 + 14, zero - 66, '← max gain = RM5,000 (price falls to 0)', size=14, anchor='start', color=PALETTE['green'][0])
    s.text(x0 + 200, zero - 14, 'RM50', size=14, color=GREY)
    s.text(720, zero + 104, 'loss keeps growing\nas the price rises:\nno ceiling', size=15, anchor='start', weight=700, color=RED)
    return s.svg()


# ------------------------------------------------------------------ Chapter 3
def l3_info_layers():
    s = Sketch(920, 400, seed=301, title='Not all information deserves equal trust')
    layers = [('Primary sources', 'company filings · audited statements · regulatory disclosures', 'green'),
              ('Professional interpretation', 'broker research · financial news · analyst reports', 'sky'),
              ('Opinion', 'blogs · forums · newsletters', 'amber'),
              ('Anonymous commentary', 'a stranger on social media with a Lamborghini avatar', 'rose')]
    for i, (t, sub, tone) in enumerate(layers):
        inset = i * 45
        s.box(40 + inset, 30 + i * 84, 640 - 2 * inset, 70, '', tone, hachure=(i == 3))
        s.text(360, 52 + i * 84, t, size=17, weight=700)
        s.text(360, 78 + i * 84, sub, size=14, color='#475569')
    s.arrow(760, 40, 760, 370, RED, 2.2)
    s.text(840, 200, 'apply\nmore\nskepticism', size=17, weight=700, color=RED)
    s.text(360, 385, 'and always ask: what does the source gain if I believe it?', size=15, color='#475569')
    return s.svg()


def l3_order_matrix():
    s = Sketch(920, 440, seed=302, title='Choosing an order: execution certainty versus price control')
    axes(s, 90, 380, 860, 40, 'price control →', 'execution certainty ↑')
    s.box(120, 70, 250, 80, 'Market order\nfills fast at the best\navailable price', 'sky', size=15, bold=True)
    s.box(560, 200, 260, 80, 'Limit order\nyour price or better,\nmay never fill', 'indigo', size=15, bold=True)
    s.box(120, 200, 250, 80, 'Stop (stop-loss)\ntrigger → MARKET order\nmay fill below the stop', 'rose', size=14)
    s.box(560, 290, 260, 80, 'Stop-limit\ntrigger → LIMIT order\nmay not fill at all', 'amber', size=14)
    s.arrow(374, 262, 554, 322, GREY, 1.4, dash='5 5')
    s.text(452, 278, 'add a limit', size=14, color=GREY)
    s.arrow(374, 110, 554, 230, GREY, 1.4, dash='5 5')
    s.text(470, 152, 'trade speed for price', size=14, color=GREY)
    s.text(475, 412, 'time conditions sit on top: Day · Good-til-canceled · Fill-or-kill', size=15, color='#475569')
    return s.svg()


# ------------------------------------------------------------------ Chapter 4
def l4_tvm_timeline():
    s = Sketch(920, 360, seed=401, title='Compounding moves money forward in time; discounting moves it back')
    y = 190
    s.arrow(60, y, 880, y, GREY, 1.8)
    for i in range(6):
        x = 100 + i * 150
        s.line(x, y - 10, x, y + 10, GREY, 1.6)
        s.text(x, y + 30, 't%d' % i, size=16, color=GREY)
    s.box(40, y - 150, 120, 60, 'PV\ntoday', 'sky', size=16, bold=True)
    s.box(780, y - 150, 120, 60, 'FV\nlater', 'amber', size=16, bold=True)
    s.arrow(165, y - 120, 775, y - 120, PALETTE['green'][0], 2.4)
    s.text(470, y - 140, 'compound:  × (1 + r)ⁿ', size=18, weight=700, color=PALETTE['green'][0])
    s.arrow(775, y + 80, 165, y + 80, PALETTE['rose'][0], 2.4)
    s.text(470, y + 104, 'discount:  ÷ (1 + r)ⁿ', size=18, weight=700, color=PALETTE['rose'][0])
    s.text(470, y - 66, 'RM1,000 at 8% for 2 years  →  RM1,166.40', size=15, color='#475569')
    s.text(470, y + 140, 'RM1,000 due in 7 years at 8%  →  RM583.49 today', size=15, color='#475569')
    return s.svg()


def l4_annuity_vs_mixed():
    s = Sketch(940, 460, seed=402, title='Ordinary annuity versus mixed stream on a timeline')

    def line(y, label, flows, tone, note):
        s.text(20, y - 125, label, size=17, anchor='start', weight=700, color=PALETTE[tone][0])
        s.arrow(60, y, 900, y, GREY, 1.6)
        for i in range(6):
            x = 110 + i * 150
            s.line(x, y - 8, x, y + 8, GREY, 1.4)
            s.text(x, y + 26, 't%d' % i, size=14, color=GREY)
            if i and i <= len(flows):
                f = flows[i - 1]
                h = 18 + f / max(flows) * 32
                s.arrow(x, y - 10, x, y - 10 - h, PALETTE[tone][0], 2.2, head=8)
                s.text(x, y - 22 - h, str(f), size=15, weight=700, color=PALETTE[tone][0])
        s.text(470, y + 54, note, size=15, color='#475569')
    line(160, 'Ordinary annuity: equal amounts, end of each period', [50, 50, 50, 50, 50], 'sky',
         'no cash flow at t0 · use the annuity shortcut PMT × [1 − (1 + r)⁻ⁿ] / r')
    line(375, 'Mixed stream: no pattern', [30, 40, 50, 60, 70], 'amber',
         'no shortcut: discount each one, PV = Σ CF_t / (1 + r)^t  (at 8% → 193.51)')
    return s.svg()


def l4_required_stack():
    s = Sketch(920, 420, seed=403, title='Building the required return from its components')
    base, k = 360, 22
    blocks = [('real return 2%', 2, 'sky'), ('inflation premium 3%', 3, 'lime'), ('risk premium 6%', 6, 'rose')]
    y = base
    for t, v, tone in blocks:
        h = v * k
        s.rect(120, y - h, 220, h, PALETTE[tone][0], PALETTE[tone][1], hachure=(tone == 'rose'))
        s.text(230, y - h / 2, t, size=16, weight=700, color=PALETTE[tone][0])
        y -= h
    s.line(100, base - 5 * k, 380, base - 5 * k, PALETTE['indigo'][0], 1.6, dash='6 5')
    s.text(400, base - 5 * k, 'risk-free rate Rf = 5%', size=16, anchor='start', weight=700, color=PALETTE['indigo'][0])
    s.text(400, base - 11 * k, 'required return = Rf + risk premium = 11%', size=16, anchor='start', weight=700, color=PALETTE['rose'][0])
    s.line(30, base, 900, base, GREY, 1.4)
    s.text(720, 205, 'expected return 13% ≥ 11%\n→ adequate compensation', size=16, color=PALETTE['green'][0])
    s.text(720, 300, 'expected return 9% < 11%\n→ not enough for the risk', size=16, color=RED)
    s.text(460, 395, 'expected return = a forecast   ·   required return = the hurdle it must clear', size=15, color='#475569')
    return s.svg()


def l4_risk_spectrum():
    s = Sketch(920, 420, seed=404, title='The risk-return spectrum: more expected return for more risk')
    axes(s, 80, 370, 880, 30, 'risk →', 'expected return ↑')
    pts = [(80, 300, 'Rf'), (170, 282, 'government\nsecurities'), (260, 262, 'bonds'), (350, 240, 'preferred stock'),
           (450, 215, 'mutual funds'), (540, 192, 'common stock'), (640, 166, 'real estate'), (740, 140, 'options'), (830, 116, 'futures')]
    curve(s, [(80, 300), (860, 108)], PALETTE['indigo'][0], 2.6)
    for i, (x, y, t) in enumerate(pts):
        s.ellipse(x, y, 7, 7, PALETTE['amber'][0], PALETTE['amber'][1])
        s.text(x + (10 if i else -10), y + (32 if i % 2 else -30), t, size=14, anchor='start' if i else 'end', color='#334155')
    s.text(440, 404, 'a compensation relationship for bearing risk, not a guarantee of higher realized return', size=15, color=RED)
    return s.svg()


# ------------------------------------------------------------------ Chapter 5
def l5_offset():
    s = Sketch(940, 300, seed=501, title='Combining two negatively correlated assets smooths the portfolio return')
    panels = [('Asset F', 1, 'sky'), ('Asset G', -1, 'rose'), ('Portfolio of F and G', 0, 'green')]
    for i, (t, sign, tone) in enumerate(panels):
        x0 = 30 + i * 310
        s.text(x0 + 135, 30, t, size=17, weight=700, color=PALETTE[tone][0])
        s.arrow(x0, 250, x0 + 270, 250, GREY, 1.4)
        s.arrow(x0, 260, x0, 60, GREY, 1.4)
        s.line(x0, 155, x0 + 260, 155, '#cbd5e1', 1, dash='4 5')
        pts = [(x0 + 8 + j * 8, 155 - sign * 62 * math.sin(j / 31 * 2 * math.pi * 1.5) - (0 if sign else 6 * math.sin(j / 4))) for j in range(32)]
        curve(s, pts, PALETTE[tone][0], 2.4, rough=0.25)
        s.text(x0 + 135, 278, 'time', size=13, color=GREY)
    s.text(320, 150, '+', size=34, weight=700, color=GREY)
    s.text(630, 150, '=', size=34, weight=700, color=GREY)
    return s.svg()


def l5_risk_floor():
    s = Sketch(920, 450, seed=502, title='Diversification removes unsystematic risk but leaves systematic risk')
    axes(s, 80, 370, 880, 30, 'number of securities →', 'portfolio risk σp ↑')
    floor = 260
    pts = [(x, floor - (floor - 70) * math.exp(-(x - 90) / 120)) for x in range(90, 870, 18)]
    curve(s, pts, PALETTE['indigo'][0], 2.8, rough=0.2)
    s.line(80, floor, 870, floor, PALETTE['rose'][0], 2, dash='8 6')
    s.text(600, 150, 'diversifiable (unsystematic) risk\nfirm-specific: strikes, lawsuits,\na CEO leaving', size=15, color=PALETTE['indigo'][0])
    s.text(600, 318, 'undiversifiable (systematic) risk\nwar, inflation, recessions: the floor', size=15, color=PALETTE['rose'][0])
    s.arrow(330, 120, 330, floor - 6, PALETTE['indigo'][0], 1.4, dash='5 5')
    s.arrow(330, floor + 4, 330, 366, PALETTE['rose'][0], 1.4, dash='5 5')
    s.text(460, 432, 'total risk = systematic + unsystematic: only the systematic part earns a CAPM reward', size=15, color='#475569')
    return s.svg()


def l5_frontier():
    s = Sketch(920, 470, seed=503, title='The feasible set, the efficient frontier and an investor\'s utility curve')
    axes(s, 80, 390, 880, 30, 'portfolio risk σp →', 'expected return ↑')
    blob = [(250, 330), (200, 260), (215, 190), (300, 120), (430, 75), (560, 62), (640, 90), (690, 170), (660, 250), (560, 320), (420, 360), (300, 360), (250, 330)]
    s.parts.append('<path d="M%s Z" fill="%s" opacity=".7"/>' % (' L'.join('%d %d' % p for p in blob), PALETTE['sky'][1]))
    curve(s, blob, PALETTE['sky'][0], 1.6, rough=0.3)
    frontier = [(200, 260), (215, 190), (300, 120), (430, 75), (560, 62)]
    curve(s, frontier, PALETTE['indigo'][0], 4.2, rough=0.2)
    s.text(150, 120, 'efficient\nfrontier', size=17, weight=700, color=PALETTE['indigo'][0])
    s.ellipse(470, 250, 8, 8, RED, '#fee2e2')
    s.text(480, 278, 'inside the set: dominated', size=14, anchor='start', color=RED)
    s.arrow(462, 244, 360, 112, RED, 1.4, dash='5 5')
    s.text(330, 210, 'same risk,\nmore return', size=14, color=RED)
    curve(s, [(200, 124), (280, 116), (365, 96), (440, 66), (500, 30)], PALETTE['amber'][0], 1.8, dash='6 5')
    s.ellipse(365, 96, 9, 9, PALETTE['amber'][0], PALETTE['amber'][1])
    s.text(512, 34, 'utility (indifference) curve:\ntouches the frontier at this\ninvestor\'s best portfolio', size=14, anchor='start', color=PALETTE['amber'][0])
    s.text(560, 200, 'feasible (attainable) set', size=15, color=PALETTE['sky'][0])
    s.text(460, 452, 'the frontier offers the choices · the investor\'s risk preference makes the choice', size=15, color='#475569')
    return s.svg()


def l5_sml_sketch():
    s = Sketch(920, 470, seed=504, title='The Security Market Line: required return rises with beta')
    axes(s, 80, 390, 880, 30, 'beta β →', 'required return ↑')
    X = lambda b: 80 + b * 300
    Y = lambda r: 390 - r * 20
    curve(s, [(X(0), Y(6)), (X(2.5), Y(16))], PALETTE['green'][0], 3, rough=0.2)
    s.text(X(2.45), Y(16) - 24, 'SML:  R = 6% + β(10% − 6%)', size=15, anchor='end', weight=700, color=PALETTE['green'][0])
    for b in (0.5, 1, 1.5, 2):
        s.line(X(b), 384, X(b), 396, GREY, 1.4)
        s.text(X(b), 412, str(b), size=14, color=GREY)
    s.text(70, Y(6), '6% = Rf', size=14, anchor='end', color=GREY)
    s.ellipse(X(1), Y(10), 7, 7, PALETTE['indigo'][0], PALETTE['indigo'][1])
    s.text(X(1) + 12, Y(10) + 22, 'market: β = 1, 10%', size=14, anchor='start', color=PALETTE['indigo'][0])
    s.ellipse(X(1.5), Y(15), 8, 8, PALETTE['green'][0], PALETTE['green'][1])
    s.text(X(1.5) - 12, Y(15) - 22, 'expects 15%, needs 12%:\nabove the line, +3% alpha', size=14, anchor='end', color=PALETTE['green'][0])
    s.ellipse(X(2), Y(11), 8, 8, RED, '#fee2e2')
    s.text(X(2) + 12, Y(11) + 26, 'expects 11%, needs 14%:\nbelow the line, −3% alpha', size=14, anchor='start', color=RED)
    s.text(460, 452, 'intercept = risk-free rate · slope = market risk premium', size=15, color='#475569')
    return s.svg()


DIAGRAMS = {
    'l1_flow_funds': (l1_flow_funds, 'Funds reach businesses and governments directly, through financial institutions, or through financial markets.'),
    'l1_classify': (l1_classify, 'Classify by asking several questions at once: one investment answers all of them.'),
    'l1_seven_steps': (l1_seven_steps, 'Survive, define, plan, analyse, select, diversify, monitor: and monitoring feeds back into the plan.'),
    'l1_lifecycle': (l1_lifecycle, 'As the time left to recover from losses shrinks, the emphasis moves from growth to income and preservation.'),
    'l2_market_grid': (l2_market_grid, 'Primary/secondary and money/capital are independent dimensions: every security sits in one cell of each.'),
    'l2_ipo_chain': (l2_ipo_chain, 'Underwriters carry the resale risk and are paid through the spread between their buying and offering price.'),
    'l2_broker_dealer': (l2_broker_dealer, 'Read a quote from the dealer\'s side: the dealer buys at the bid and sells at the ask.'),
    'l2_margin_sheet': (l2_margin_sheet, 'The loan does not move, so every fall in value comes straight out of the investor\'s equity.'),
    'l2_short_steps': (l2_short_steps, 'A short sale reverses the order of buying and selling; its gain is capped but its loss is not.'),
    'l3_info_layers': (l3_info_layers, 'The further a source is from audited, primary evidence, the more skeptical you should be.'),
    'l3_order_matrix': (l3_order_matrix, 'No order gives certainty of both execution and price: each order type picks a side of the trade-off.'),
    'l4_tvm_timeline': (l4_tvm_timeline, 'FV and PV are the same equation run in opposite directions along the timeline.'),
    'l4_annuity_vs_mixed': (l4_annuity_vs_mixed, 'Equal, evenly spaced, end-of-period payments allow the annuity shortcut; anything else is a mixed stream.'),
    'l4_required_stack': (l4_required_stack, 'Required return = real return + inflation premium + risk premium = risk-free rate + risk premium.'),
    'l4_risk_spectrum': (l4_risk_spectrum, 'Investors demand more expected return to accept more risk, from government securities to futures.'),
    'l5_offset': (l5_offset, 'When one asset is up the other is down: the combined return barely moves.'),
    'l5_risk_floor': (l5_risk_floor, 'Adding securities quickly removes firm-specific risk, then levels off at the systematic-risk floor.'),
    'l5_frontier': (l5_frontier, 'Only the upper-left edge of the feasible set is efficient; the utility curve picks the investor\'s point on it.'),
    'l5_sml_sketch': (l5_sml_sketch, 'Securities above the SML offer more than CAPM requires for their beta; below it, less.'),
}
