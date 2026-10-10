"""Build app/index.html — the Fundamentals of Investing Chapters 1–5 study site.

Inputs
  ../notes.md                 chapter notes (intuitive / MCQ / subjective per chapter)
  template_style.css          site stylesheet (inherited from the earlier study site)
  template_app.js             navigation, quiz engine, progress and last-updated logic
  pages/*.html                hand-written exam-prep pages (home, cheat, traps, strategy)
  lessons/*.html              hand-written guided lessons, one per lesson id
  subjective/l{n}.html        hand-written subjective-prep intro per chapter
  difficult/l{n}.md           Difficult-mode question bank per chapter
  figures/*.webp              slide figures rendered by figures.py

Run:  python tools/build_site.py
"""
import shutil
import html
import json
import os
import re
import sys

import ascii_fix
import difficult_parser as dp
import notes_parser as np_
from diagrams import DIAGRAMS
from toc_labels import LABELS as TOC_LABELS
from figures import FIGURES, OUT_DIR as FIG_DIR
from externalize import externalize_handlers, externalize_styles, FIXED_CSS, theme_css
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'index.html')
ASSETS = os.path.join(HERE, '..', 'assets')

# GitHub repository ('owner/name') whose last push the sidebar shows; empty hides the badge.
REPO = ''
BRANCH = 'main'

CHAPTERS = [
    {
        'n': 1, 'color': '#0284c7', 'soft': '#f0f9ff', 'icon': '', 'nav': 'CHAPTER 1',
        'title': 'The Investment Environment',
        'blurb': 'What makes something an investment, how to classify it, how funds flow through the financial system, the seven-step process, taxes and the life cycle, and short-term investments.',
        'lessons': [
            ('l1-what', '', 'What an investment is', 'What Makes Something an Investment', 'An investment is defined by its purpose, not by the object: funds placed in an asset with the expectation of income and/or growth in value. Then classify it along several dimensions at once.'),
            ('l1-system', '', 'Flow of funds & investors', 'Why Financial Markets Exist', 'Suppliers of funds meet demanders of funds directly, through financial institutions or through markets. Individuals and institutions invest for different objectives.'),
            ('l1-process', '', 'The seven-step process', 'Investing Is a Process, Not a Product', 'Survive, define, plan, analyse, select, diversify, monitor. The order matters: prerequisites and goals come before any product.'),
            ('l1-life', '', 'Taxes, life cycle & economy', 'Taxes, the Life Cycle and the Business Cycle', 'What you keep after tax matters more than what you make; age changes your capacity for risk; and interest rates move bond prices the opposite way.'),
            ('l1-short', '', 'Short-term investments', 'Liquidity, Safety and Suitability', 'Short-term investments buy liquidity and low default risk at the price of low returns and inflation risk. There is no best investment, only a suitable one.'),
        ],
    },
    {
        'n': 2, 'color': '#65a30d', 'soft': '#f7fee7', 'icon': '', 'nav': 'CHAPTER 2',
        'title': 'Securities Markets and Transactions',
        'blurb': 'Money vs capital and primary vs secondary markets, IPOs and investment banking, brokers and dealers, global markets and regulation, margin trading and short selling.',
        'lessons': [
            ('l2-markets', '', 'Market types', 'Two Separate Questions About Every Market', 'Money vs capital market asks how long until maturity; primary vs secondary asks whether the security is new. Follow the money to classify any transaction.'),
            ('l2-ipo', '', 'IPOs & investment banking', 'How a Company Goes Public', 'Underwriting, the prospectus, the red herring, the quiet period and the road show: an IPO is a risk-transfer and information problem, not just a listing.'),
            ('l2-trading', '', 'Brokers, dealers & trading', 'Who Is on the Other Side of Your Trade?', 'A broker matches buyers and sellers; a dealer is the other side, quoting a bid and an ask. Alternative trading systems exist to cut costs.'),
            ('l2-global', '', 'Global markets & regulation', 'Going Global and Staying Honest', 'Foreign markets add diversification but also currency and policy risk. Regulation exists to fight information asymmetry, fraud and insider trading.'),
            ('l2-margin', '', 'Long purchases & margin', 'Margin Trading: Investing With Borrowed Money', 'Leverage magnifies gains and losses on your equity. The loan stays fixed, so a falling price eats your equity until a margin call.'),
            ('l2-short', '', 'Short selling', 'Short Selling: Sell First, Buy Back Later', 'Borrow shares, sell them, buy them back cheaper and return them. The gain is capped at the sale price; the loss has no ceiling.'),
        ],
    },
    {
        'n': 3, 'color': '#4f46e5', 'soft': '#eef2ff', 'icon': '', 'nav': 'CHAPTER 3',
        'title': 'Investment Information and Securities Transactions',
        'blurb': 'Online investing, descriptive vs analytical information and source reliability, market averages and indexes, brokers and accounts, order types, transaction costs and investor protection.',
        'lessons': [
            ('l3-info', '', 'Information & online investing', 'Turning Information Into Decisions', 'The modern problem is not finding information but judging it: separate facts from forecasts, primary sources from opinion, and evidence from a sales pitch.'),
            ('l3-indexes', '', 'Averages, indexes & benchmarks', 'A Return Means Nothing Without a Benchmark', 'Indexes summarise a market so that performance can be judged. How an index is built (price-, value- or equal-weighted) changes what it measures.'),
            ('l3-brokers', '', 'Brokers & accounts', 'Choosing a Broker and an Account', 'A broker executes trades; how much service you pay for, and how your account is funded and controlled, are separate decisions.'),
            ('l3-orders', '', 'Orders & execution', 'Execution Certainty vs Price Control', 'Market orders fill fast at an uncertain price; limit orders protect the price but may never fill. Stops are triggers, not guarantees.'),
            ('l3-protect', '', 'Costs, protection & advice', 'Costs, Protection and Advice', 'Transaction costs are a hurdle every trade must clear. Investor protection covers broker failure, not bad decisions, and a licence does not guarantee skill.'),
        ],
    },
    {
        'n': 4, 'color': '#e11d48', 'soft': '#fff1f2', 'icon': '', 'nav': 'CHAPTER 4 + 4A',
        'title': 'Return and Risk (with Appendix 4A: Time Value of Money)',
        'blurb': 'Compounding and discounting, annuities and mixed streams; then return, required return, HPR, IRR, growth rates, the sources of risk, standard deviation and the coefficient of variation.',
        'lessons': [
            ('l4-tvm', '', 'Compounding, FV & PV', 'Money Has an Amount and a Date', 'A ringgit today is worth more than a ringgit later because it can earn interest. Compounding moves money forward; discounting moves it back.'),
            ('l4-annuity', '', 'Annuities & mixed streams', 'Annuities, Mixed Streams and Compounding Frequency', 'Equal payments at equal intervals allow a shortcut; unequal ones must be discounted one by one. Compounding more often raises the true rate.'),
            ('l4-return', '', 'Return & required return', 'Is the Return Good Enough?', 'Total return = income + capital gain. Whether it is good enough depends on the required return: the risk-free rate plus a premium for the risk taken.'),
            ('l4-hpr', '', 'HPR, IRR & growth rates', 'Measuring Return Over Time', 'HPR is simple but ignores time; IRR gives the compound annual rate that makes the cash flows worth the price; growth rates use the same arithmetic.'),
            ('l4-risk', '', 'Sources & measures of risk', 'What Can Go Wrong, and How Much', 'Nine sources of risk, each a different question; standard deviation measures absolute dispersion and the coefficient of variation measures risk per unit of return.'),
        ],
    },
    {
        'n': 5, 'color': '#0d9488', 'soft': '#f0fdfa', 'icon': '', 'nav': 'CHAPTER 5',
        'title': 'Modern Portfolio Concepts',
        'blurb': 'Portfolio return and risk, correlation and diversification, systematic vs unsystematic risk, beta, CAPM and the Security Market Line, the efficient frontier and traditional vs modern portfolio management.',
        'lessons': [
            ('l5-portfolio', '', 'Portfolio return & risk', 'A Portfolio Is More Than Its Parts', 'Portfolio return is a weighted average; portfolio risk is not, because it depends on how the assets move together.'),
            ('l5-correlation', '', 'Correlation & diversification', 'Why Diversification Works', 'The lower the correlation, the more the assets offset each other. A riskier asset can even lower portfolio risk.'),
            ('l5-beta', '', 'Systematic risk & beta', 'The Risk You Cannot Diversify Away', 'Diversification removes firm-specific risk but not market-wide risk. Beta measures an asset\'s sensitivity to that market risk.'),
            ('l5-capm', '', 'CAPM & the SML', 'Pricing Systematic Risk: CAPM and the SML', 'Required return = risk-free rate + beta × market risk premium. Securities above the Security Market Line offer more than CAPM requires.'),
            ('l5-frontier', '', 'Efficient frontier & MPT', 'Efficient Portfolios and How to Choose Between Them', 'The efficient frontier holds the best risk-return combinations; the investor\'s risk preference picks one. Traditional and modern management work best together.'),
        ],
    },
]

CH = {C['n']: C for C in CHAPTERS}


# ------------------------------------------------------------------ helpers
def read(*parts):
    return open(os.path.join(HERE, *parts), encoding='utf-8').read()


_fig_size = {}
_diagrams_used = set()


def figure(key, extra=''):
    if key not in FIGURES:
        raise KeyError('unknown figure ' + key)
    if key not in _fig_size:
        with Image.open(os.path.join(FIG_DIR, key + '.webp')) as im:
            _fig_size[key] = im.size
    _, page, alt, cap = FIGURES[key]
    w, h = _fig_size[key]
    return ('<figure class="svg-figure pdf-figure%s"><img loading="lazy" src="assets/img/%s.webp" width="%d" height="%d" alt="%s">'
            '<figcaption>%s <span class="muted">· Slide %d</span></figcaption></figure>'
            % (' ' + extra if extra else '', key, w, h, html.escape(alt), html.escape(cap), page))


WIDGETS = {
    'l1_bond_rate': ('Interactive · Move the market interest rate and watch an existing 5% bond\'s price move the opposite way.', 'Interest rates and bond prices'),
    'l1_real_return': ('Interactive · Strip tax and inflation out of a nominal return to see what the investor actually keeps.', 'Nominal, after-tax and real return'),
    'l2_margin': ('Interactive · Change the margin and the share price; watch equity, return on equity and the margin-call line.', 'Margin trading'),
    'l2_short': ('Interactive · Compare the profit of a long and a short position as the share price moves.', 'Long versus short payoff'),
    'l3_index': ('Interactive · Move one stock\'s price and compare a price-weighted, value-weighted and equal-weighted index.', 'How index construction changes the answer'),
    'l4_compound': ('Interactive · Simple versus compound growth, and how compounding frequency raises the true rate.', 'Compounding'),
    'l4_annuity': ('Interactive · What each deposit grows to by the end, for an ordinary annuity and an annuity due.', 'Future value of an annuity'),
    'l4_risk': ('Interactive · Edit five annual returns for two investments; mean, standard deviation and CV update live.', 'Standard deviation and coefficient of variation'),
    'l5_correlation': ('Interactive · Slide the weight and the correlation; the risk-return curve bends left as correlation falls.', 'Correlation and portfolio risk'),
    'l5_sml': ('Interactive · Set the risk-free rate, market return, beta and your expected return; compare it with the SML.', 'CAPM and the Security Market Line'),
    'l5_sigma3d': ('3D · Portfolio standard deviation for every weight and correlation: the valley only reaches zero at ρ = −1.', 'Portfolio risk surface in 3D'),
}


def visual(key):
    if key in DIAGRAMS:
        _, cap = DIAGRAMS[key]
        _diagrams_used.add(key)
        return ('<figure class="vis-figure vis-sketch" data-diagram="%s"><div class="sketch-slot"></div><figcaption>%s</figcaption></figure>'
                % (key, html.escape(cap)))
    if key in WIDGETS:
        cap, title = WIDGETS[key]
        return ('<figure class="vis-figure vis-widget" data-vis="%s"><div class="vis-title">%s</div><div class="vis-root"></div>'
                '<figcaption>%s</figcaption></figure>' % (key, html.escape(title), html.escape(cap)))
    raise KeyError('unknown visual ' + key)


def expand(fragment):
    fragment = re.sub(r'\{\{vis:([a-z0-9_]+)\}\}', lambda m: visual(m.group(1)), fragment)
    fragment = re.sub(r'\{\{see:([a-z0-9_]+)\}\}', lambda m: '<details class="trap-visual"><summary><span class="when-closed">Show it visually</span><span class="when-open">Hide visual</span></summary>%s</details>' % visual(m.group(1)), fragment)
    return re.sub(r'\{\{fig:([a-z0-9_]+)(?:\|([a-z-]+))?\}\}', lambda m: figure(m.group(1), m.group(2) or ''), fragment)


def section(page, body, hidden=True):
    return '<section class="page-section%s" data-page="%s" id="sec-%s">\n%s\n</section>\n' % (
        ' hidden' if hidden else '', page, page, body)


def header(C, eyebrow, title, text):
    return ('<header class="page-header" style="--accent:%s;--soft:%s"><span class="eyebrow">%s</span>'
            '<h2>%s</h2><p>%s</p></header>' % (C['color'], C['soft'], eyebrow, title, text))


def lesson_nav(C, idx):
    lessons = C['lessons']
    prev_btn = '<span></span>'
    if idx > 0:
        pid, _, plabel, _, _ = lessons[idx - 1]
        prev_btn = '<button onclick="navTo(\'%s\')">← %s</button>' % (pid, plabel)
    if idx + 1 < len(lessons):
        nid, _, nlabel, _, _ = lessons[idx + 1]
        nxt = '<button class="next" onclick="navTo(\'%s\')">Next: %s →</button>' % (nid, nlabel)
    else:
        nxt = '<button class="next" onclick="navTo(\'l%d-prep\')">Test yourself: Chapter %d MCQs →</button>' % (C['n'], C['n'])
    return '<div class="lesson-nav" style="--accent:%s">%s%s</div>' % (C['color'], prev_btn, nxt)


# ------------------------------------------------------------------ sidebar
def sidebar():
    out = ['''        <aside class="sidebar" id="sidebar">
            <div class="brand">
                <h1>Fundamentals of Investing</h1>
                <p>Chapters 1–5 · Guided learning &amp; exam prep</p>
                <p class="last-updated" id="last-updated" title="Fetching from GitHub…">
                    <span class="live-dot" aria-hidden="true"></span><span id="last-updated-text">Checking last update…</span>
                </p>
            </div>
            <div class="nav-panel">
                <p class="nav-label" style="color:#fbbf24">EXAM PREP</p>
                <button class="nav-btn nav-exam active" id="nav-home" onclick="navTo('home')">Quick Start</button>
                <button class="nav-btn nav-exam" id="nav-cheat" onclick="navTo('cheat')">Master Cheat Sheet</button>
                <button class="nav-btn nav-exam" id="nav-traps" onclick="navTo('traps')">Dangerous Confusions</button>
                <button class="nav-btn nav-exam" id="nav-simulator" onclick="navTo('simulator')">MCQ Simulator</button>
                <button class="nav-btn nav-exam" id="nav-strategy" onclick="navTo('strategy')">Test Strategy</button>
            </div>''']
    for C in CHAPTERS:
        n = C['n']
        btns = ['<button class="nav-btn nav-l%d" id="nav-%s" onclick="navTo(\'%s\')">%s</button>'
                % (n, pid, pid, label) for pid, icon, label, _, _ in C['lessons']]
        for page, label in (('notes', 'Full intuitive explanation'), ('subjective', 'Subjective exam prep'), ('prep', 'MCQ prep')):
            btns.append('<button class="nav-btn nav-l%d" id="nav-l%d-%s" onclick="navTo(\'l%d-%s\')">%s</button>' % (n, n, page, n, page, label))
        out.append('''            <details class="nav-module">
                <summary class="nav-module-summary" style="color:%s"><span>%s</span><span class="chevron">⌄</span></summary>
                <div class="nav-module-body">
                    %s
                </div>
            </details>''' % (C['color'], C['nav'], '\n                    '.join(btns)))
    out.append('        </aside>')
    return '\n'.join(out)


# ------------------------------------------------------------------ pages
def home_page():
    cards = []
    for C in CHAPTERS:
        n = C['n']
        first = C['lessons'][0][0]
        cards.append('''<div class="module-card" style="--accent:{c}">
    <div class="module-icon">C{n}</div>
    <h3>Chapter {n}: {title}</h3>
    <p>{blurb}</p>
    <div class="module-progress"><span id="status-m{n}">Not started</span><span id="best-m{n}">Best: 0%</span></div>
    <div class="progress-track"><div class="progress-fill" id="progress-m{n}" style="background:{c}"></div></div>
    <div class="hard-best" id="hard-m{n}">Difficult mode: not tried</div>
    <div class="module-actions"><button onclick="navTo('{first}')">Learn</button><button onclick="navTo('l{n}-subjective')">Subjective</button><button onclick="launchModuleQuiz({n})">Test</button></div>
</div>'''.format(c=C['color'], n=n, title=C['title'], blurb=C['blurb'], first=first))
    body = read('pages', 'home.html').replace('{{LECTURE_CARDS}}', '\n'.join(cards))
    return section('home', expand(body), hidden=False)


def lesson_pages(C):
    out = []
    total = len(C['lessons'])
    for i, (pid, icon, label, title, intro) in enumerate(C['lessons']):
        frag = read('lessons', pid + '.html')
        body = header(C, 'CHAPTER %d · GUIDED LESSON %d OF %d' % (C['n'], i + 1, total), title, intro)
        body += '\n<div class="lesson-body" style="--accent:%s;--soft:%s">\n%s\n</div>\n' % (C['color'], C['soft'], expand(frag))
        if i + 1 == total:
            body += ('<div class="action-row" style="margin-top:18px"><button class="secondary-btn" onclick="markLearned(%d)">Mark Chapter %d as learned</button></div>'
                     % (C['n'], C['n']))
        body += lesson_nav(C, i)
        out.append(section(pid, body))
    return out


# Visuals dropped at the top of a matching notes section: (chapter, kind) -> [(heading prefix, visual key)]
NOTES_VISUALS = {
    (1, 'intuitive'): [('2. Don', 'l1_classify'), ('6. Direct finance', 'l1_flow_funds'), ('11. The seven-step', 'l1_seven_steps'),
                       ('15. Taxes', 'l1_real_return'), ('17. Life-cycle', 'l1_lifecycle'), ('20. Why interest rates', 'l1_bond_rate')],
    (2, 'intuitive'): [('Market classifications', 'l2_market_grid'), ('The IPO process intuitively', 'l2_ipo_chain'),
                       ('Broker market vs dealer market', 'l2_broker_dealer'), ('Margin is NOT', 'l2_margin_sheet'),
                       ('The most intuitive way to understand a margin call', 'l2_margin'), ('Short selling: reverse', 'l2_short_steps'),
                       ('Why short-selling losses', 'l2_short')],
    (3, 'intuitive'): [('5. Information hierarchy', 'l3_info_layers'), ('15. Equal weighting', 'l3_index'), ('23. Order types', 'l3_order_matrix')],
    (4, 'intuitive'): [('4. Compound interest', 'l4_compound'), ('13. Compounding vs discounting', 'l4_tvm_timeline'),
                       ('20. Future value of an annuity', 'l4_annuity'), ('28. Mixed cash flow', 'l4_annuity_vs_mixed'),
                       ('10. Required return', 'l4_required_stack'), ('39. Measuring risk', 'l4_risk'), ('45. Figure 4.2', 'l4_risk_spectrum')],
    (5, 'intuitive'): [('6. Why negative correlation', 'l5_offset'), ('7. The mathematical formula', 'l5_sigma3d'),
                       ('8. Worked example', 'l5_correlation'), ('13. Why diversification cannot', 'l5_risk_floor'),
                       ('22. The Security Market Line', 'l5_sml'), ('23. Above, on or below', 'l5_sml_sketch'), ('27. The efficient frontier', 'l5_frontier')],
}
# Subjective and MCQ-notes counterparts: only where the section teaches the same concept.
NOTES_VISUALS.update({
    (2, 'mcq'): [('Numerical formulas', 'l2_margin')],
    (3, 'mcq'): [('One question-selection', 'l3_order_matrix')],
    (4, 'mcq'): [('Essential formula sheet', 'l4_tvm_timeline')],
    (5, 'mcq'): [('Chapter 5 formula sheet', 'l5_sml_sketch')],
    (4, 'subjective'): [('5. Chapter 4 formula sheet', 'l4_required_stack'), ('3. Appendix 4A formula sheet', 'l4_annuity_vs_mixed')],
    (5, 'subjective'): [('5. Chapter 5 formula sheet', 'l5_frontier')],
})
KIND_PREFIX = {'intuitive': 'n', 'subjective': 's', 'mcq': 'p'}
_notes_visuals_used = set()


def sectioned(md, prefix, visuals=()):
    """Render notes as one collapsible <details> per '## ' section.

    Returns (html, toc) where toc = [(anchor_id, heading, is_divider)] for the section list."""
    parts, toc = [], []
    for i, (h, b) in enumerate(np_.split_h2(md)):
        if not h:
            parts.append(np_.md_to_html(b, shift=1))
            continue
        title = np_.md_inline(re.sub(r'^(\d+)\. ', r'\1\\. ', h))  # escape "3. " so it isn't turned into a list
        if not b.strip(' -\n'):
            did = '%s-d%d' % (prefix, i)
            toc.append((did, h, True))
            parts.append('<h2 class="notes-divider" id="%s">%s</h2>' % (did, title))
            continue
        sid = '%s-s%d' % (prefix, i)
        toc.append((sid, h, False))
        vis = ''
        for head, key in visuals:
            if h.startswith(head):
                vis += '<div class="notes-visual"><span>Visual</span>%s</div>' % visual(key)
                _notes_visuals_used.add((prefix, head))
        parts.append('<details class="note-section" id="%s"><summary><span class="ns-title">%s</span><span class="chevron">⌄</span></summary>'
                     '<div class="note-body">%s%s</div></details>' % (sid, title, vis, np_.md_to_html(b, shift=1)))
    toolbar = ('<div class="notes-toolbar"><button type="button" onclick="toggleSections(this,true)">Expand all</button>'
               '<button type="button" onclick="toggleSections(this,false)">Collapse all</button>'
               '<span>%d sections · click a heading to open it</span></div>' % sum(1 for t in toc if not t[2]))
    return toolbar + ''.join(parts), toc


def topic_chips(C, toc, label, cid, kind):
    labels = TOC_LABELS.get((C['n'], kind), {})
    items = ''
    for sid, h, divider in toc:
        if divider:
            items += '<li class="toc-group">%s</li>' % np_.md_inline(h)
            continue
        if h not in labels:
            _missing_labels.append('C%d %s: %s' % (C['n'], kind, h))
        m = re.match(r'^(?:Part )?(\d+)(?:\.| —) ', h)
        num = '<span class="toc-no">%s</span>' % m.group(1) if m else ''
        items += ('<li data-full="%s"><button type="button" onclick="tocGo(this,\'%s\')" title="%s">%s%s</button></li>'
                  % (html.escape(h), sid, html.escape(re.sub(r'[`*$\\]', '', h)), num, np_.md_inline(labels.get(h, h))))
    n = sum(1 for t in toc if not t[2])
    return ('<details class="topic-index toc-panel" id="%s" style="--accent:%s;--soft:%s"><summary><strong>%s</strong>'
            '<span class="toc-count">%d sections</span><span class="chevron">⌄</span></summary>'
            '<input type="search" class="toc-search" placeholder="Filter sections..." aria-label="Filter sections" oninput="tocFilter(this)">'
            '<ul class="toc-list">%s</ul></details>' % (cid, C['color'], C['soft'], label, n, items))


_missing_labels = []


def notes_page(C, md):
    n = C['n']
    html_, toc = sectioned(md, 'l%dn' % n, NOTES_VISUALS.get((n, 'intuitive'), ()))
    body = header(C, 'CHAPTER %d · COMPLETE REFERENCE' % n, 'Full Intuitive Explanation',
                  'The complete Chapter %d narrative, preserved in full. Use the guided lessons for a first pass; open this when a concept still isn\'t clicking.' % n)
    body += ('<div class="action-row"><button class="primary-btn" style="background:%s" onclick="window.print()">Print this page</button>'
             '<button class="secondary-btn" onclick="navTo(\'l%d-subjective\')">Go to subjective prep</button>'
             '<button class="secondary-btn" onclick="navTo(\'l%d-prep\')">Go to MCQ prep</button></div>' % (C['color'], n, n))
    body += topic_chips(C, toc, 'Reading order', 'l%dn-toc' % n, 'intuitive')
    body += ('<details class="full-notes" open style="--accent:%s;--soft:%s"><summary><div><strong>Chapter %d — complete intuitive explanation</strong>'
             '<small>Every section of the notes, with worked numbers, maths and interactive visuals.</small></div><span class="chevron">⌄</span></summary>'
             '<div class="markdown-body">%s</div></details>' % (C['color'], C['soft'], n, html_))
    return section('l%d-notes' % n, body)


def subsections(md, pattern):
    """{number: (title, body)} for '### <pattern> n — title' headings; a body runs to the next ### or ## heading."""
    out, cur, in_code = {}, None, False
    for ln in md.split('\n'):
        if np_.FENCE.match(ln.lstrip()):
            in_code = not in_code
        if not in_code and re.match(r'^#{2,3} ', ln):
            m = re.match(r'^### %s (\d+) — (.+?)\s*$' % pattern, ln)
            cur = None
            if m:
                cur = int(m.group(1))
                out[cur] = [m.group(2), []]
            continue
        if cur is not None:
            out[cur][1].append(ln)
    return {k: (t, '\n'.join(b).strip()) for k, (t, b) in out.items()}


def subjective_page(C, md):
    n = C['n']
    body = header(C, 'CHAPTER %d · SUBJECTIVE EXAM PREPARATION' % n, 'Writing Answers That Earn Marks',
                  'Define, explain the mechanism, apply it to the scenario, then evaluate and conclude. Each mock question below has its full model answer behind a reveal; the complete subjective notes are underneath.')
    body += '<div style="--accent:%s;--soft:%s">%s</div>' % (C['color'], C['soft'], expand(read('subjective', 'l%d.html' % n)))
    questions, answers = subsections(md, 'Question'), subsections(md, 'Model Answer')
    if questions:
        body += '<h3 style="margin:26px 0 12px;color:#0f172a;font-size:19px">Mock examination: questions with model answers</h3><div class="question-bank">'
        for k in sorted(questions):
            title, qmd = questions[k]
            ans = answers.get(k)
            reveal_html = reveal(ans[1], 'Reveal the model answer') if ans else ''
            body += ('<details class="bank-question"><summary><span class="qno">Q%d</span><span>%s</span></summary>'
                     '<div class="bank-body markdown-body compact">%s%s</div></details>' % (k, np_.md_inline(title), np_.md_to_html(qmd, shift=1), reveal_html))
            if not ans:
                _missing_answers.append('C%d Question %d has no model answer' % (n, k))
        body += '</div>'
    html_, toc = sectioned(md, 'l%ds' % n, NOTES_VISUALS.get((n, 'subjective'), ()))
    body += topic_chips(C, toc, 'Notes cover', 'l%ds-toc' % n, 'subjective')
    body += ('<details class="full-notes" open style="--accent:%s;--soft:%s"><summary><div><strong>Complete Chapter %d subjective notes</strong>'
             '<small>Every part of the subjective preparation, one dropdown per part.</small></div><span class="chevron">⌄</span></summary>'
             '<div class="markdown-body">%s</div></details>' % (C['color'], C['soft'], n, html_))
    return section('l%d-subjective' % n, body)


_missing_answers = []


def bank_item(q):
    """One MCQ as a collapsible card: question + options, answer and logic behind a reveal."""
    opts = ''.join('<div class="bank-option"><b>%s.</b> %s</div>' % (l, t) for l, t in q['options'])
    return ('<details class="bank-question"><summary><span class="qno">Q%d</span><div>%s</div></summary>'
            '<div class="bank-body"><div class="bank-options">%s</div><details class="answer-reveal"><summary>Reveal answer and logic</summary>'
            '<div class="answer-box"><strong>Answer: %s</strong>%s</div></details></div></details>'
            % (q['number'], q['_inline'], opts, ', '.join(q['answers']), q['explanation'] or ''))


def bloom_badges(q):
    out = '<span class="bloom-chip bloom-%d">%s</span>' % (q['bloom_rank'], q['bloom'])
    if q['ext']:
        out += '<span class="ext-badge">Extension · %s</span>' % q['ext']
    return '<div class="bloom-badges">%s</div>' % out


def hard_item(q):
    """A Difficult-mode card: same reveal card as bank_item, plus Bloom and extension badges."""
    opts = ''.join('<div class="bank-option"><b>%s.</b> %s</div>' % (l, t) for l, t in q['options'])
    return ('<details class="bank-question hard-question"><summary><span class="qno">%s</span><div>%s%s</div></summary>'
            '<div class="bank-body"><div class="bank-options">%s</div><details class="answer-reveal"><summary>Reveal answer and logic</summary>'
            '<div class="answer-box"><strong>Answer: %s</strong>%s</div></details></div></details>'
            % (q['number'], bloom_badges(q), q['_inline'], opts, ', '.join(q['answers']), q['explanation']))


def difficult_section(C, hard):
    n = C['n']
    graded = [q for q in hard if not q['ext']]
    ext = [q for q in hard if q['ext']]
    body = ('<p class="hard-intro">Questions climb Bloom&#39;s taxonomy from <b>Remember</b> to <b>Create</b>. '
            'The <b>extension</b> questions go beyond the slides (industry practice, CFA-style, case competitions, Master&#39;s, PhD and postdoc level) '
            'but can be reasoned out from the chapter&#39;s principles.</p>'
            '<div class="action-row"><button class="primary-btn" data-quiz="%d" data-quiz-mode="difficult">Start Chapter %d difficult mode</button>'
            '<button class="secondary-btn" data-quiz="%d" data-quiz-mode="extensions">Extensions only</button></div>' % (n, n, n))
    for level in dp.BLOOM:
        qs = [q for q in graded if q['bloom'] == level]
        body += '<h4 class="hard-level"><span class="bloom-chip bloom-%d">%s</span></h4><div class="question-bank">%s</div>' % (
            dp.BLOOM.index(level) + 1, level, ''.join(hard_item(q) for q in qs))
    body += '<h4 class="hard-level"><span class="ext-badge">Extension questions</span><small>beyond the notes, lowest Bloom level first</small></h4>'
    body += '<div class="question-bank">%s</div>' % ''.join(hard_item(q) for q in ext)
    return ('<details class="question-bank-wrap hard-wrap" id="l%d-hard"><summary><div><strong>Difficult mode — %d questions</strong>'
            '<small>%d Bloom-graded questions (3 per level) and %d marked extension questions. Answers hidden.</small></div>'
            '<span class="chevron">⌄</span></summary><div class="bank-body">%s</div></details>' % (n, len(hard), len(graded), len(ext), body))


def reveal(md, label='Reveal answer'):
    return ('<details class="answer-reveal"><summary>%s</summary><div class="answer-box">%s</div></details>'
            % (label, np_.md_to_html(md)))


# Part dividers for the MCQ notes: (heading prefix of the first section in the part, divider title)
MCQ_PARTS = {
    1: [('How to approach', 'PART A — EXAM STRATEGY'), ('Practice questions', 'PART B — PRACTICE QUESTIONS'),
        ('How to interpret', 'PART C — REVIEW')],
    2: [('Your practice examination', 'PART A — EXAM STRATEGY'), ('Practice questions', 'PART B — PRACTICE QUESTIONS'),
        ('Numerical formulas', 'PART C — FORMULAS AND REVIEW')],
    3: [('Your practice examination', 'PART A — EXAM STRATEGY'), ('Practice questions', 'PART B — PRACTICE QUESTIONS'),
        ('Revision sheet', 'PART C — REVISION')],
    4: [('Section A', 'PART A — APPENDIX 4A QUESTIONS'), ('Section B', 'PART B — CHAPTER 4 QUESTIONS'),
        ('Essential formula', 'PART C — FORMULAS AND REVIEW')],
    5: [('Your practice examination', 'PART A — EXAM STRATEGY'), ('Section A', 'PART B — PORTFOLIO CONSTRUCTION QUESTIONS'),
        ('Section B', 'PART C — BETA, CAPM AND MPT QUESTIONS'), ('Chapter 5 formula', 'PART D — FORMULAS AND REVIEW')],
}
_mcq_parts_used = set()


def mcq_notes(md, questions, part_titles=()):
    """Keep every section of the MCQ notes in its original order (so numbering matches notes.md),
    but render each '### Qn' block as an interactive question card (answer, logic and exam trap
    behind a reveal)."""
    by_no = {q['number']: q for q in questions}
    tokens = []

    def token(html_):
        tokens.append(html_)
        return '\n\nVISTOK%dZ\n\n' % (len(tokens) - 1)

    def questions_to_cards(body):
        out, block, in_code = [], None, False

        def flush():
            n_ = block[0]
            if n_ in by_no:
                out.append(token(bank_item(by_no[n_])))
            else:  # unparsed question: show it as written
                out.append(token('<div class="bank-question loose"><span class="qno">Q%d</span>%s</div>'
                                 % (n_, np_.md_to_html('\n'.join(block[1])))))
        for ln in body.split('\n'):
            if np_.FENCE.match(ln.lstrip()):
                in_code = not in_code
            m = np_.QHEAD.match(ln) if not in_code else None
            if block is not None and not in_code and (m or re.match(r'^#{1,4} ', ln)):
                flush()
                block = None
            if m:
                block = (int(m.group(1)), [])
            elif block is not None:
                block[1].append(ln)
            else:
                out.append(ln)
        if block is not None:
            flush()
        return '\n'.join(out)

    parts = []
    for h, b in np_.split_h2(md):
        for head, title in part_titles:
            if h and h.startswith(head):
                parts.append('## %s' % title)
                _mcq_parts_used.add(title)
        b = questions_to_cards(b)
        b = re.sub(r'(?:\n\s*---\s*)+\s*$', '', b)
        parts.append('## %s\n\n%s' % (h, b) if h else b)
    return '\n\n'.join(parts), tokens


def fill_tokens(html_, tokens):
    return re.sub(r'(?:<p>)?VISTOK(\d+)Z(?:</p>)?', lambda m: tokens[int(m.group(1))], html_)


def prep_page(C, md, questions, hard):
    n = C['n']
    traps = sum(1 for q in questions if q['_trap'])
    body = header(C, 'CHAPTER %d · MCQ PREPARATION' % n, 'Chapter %d MCQ Prep' % n,
                  'The complete MCQ preparation notes in their original order: %d multiple-choice questions sit inside the sections they belong to, with the answer, the logic and the exam trap hidden until you reveal them.'
                  % len(questions))
    body += ('<div class="study-grid three-col"><div class="metric-card"><strong>%d</strong><span>MCQs in the notes</span></div>'
             '<div class="metric-card"><strong>%d</strong><span>Exam traps explained</span></div>'
             '<div class="metric-card"><strong>%d</strong><span>Difficult-mode questions</span></div></div>' % (len(questions), traps, len(hard)))
    body += ('<div class="action-row"><button class="primary-btn" onclick="launchModuleQuiz(%d)" style="background:%s">Start Chapter %d simulator</button></div>'
             % (n, C['color'], n))
    notes_md, tokens = mcq_notes(md, questions, MCQ_PARTS.get(n, ()))
    html_, toc = sectioned(notes_md, 'l%dp' % n, NOTES_VISUALS.get((n, 'mcq'), ()))
    html_ = fill_tokens(html_, tokens)
    body += topic_chips(C, toc, 'MCQ notes', 'l%dp-toc' % n, 'mcq')
    body += ('<details class="prep-notes" open style="--accent:%s;--soft:%s"><summary><div><strong>Chapter %d MCQ preparation</strong>'
             '<small>Exam strategy, practice questions, formula sheets and review — section by section, answers hidden.</small></div><span class="chevron">⌄</span></summary>'
             '<div class="markdown-body compact">%s</div></details>' % (C['color'], C['soft'], n, html_))
    body += difficult_section(C, hard)
    return section('l%d-prep' % n, body)


def simulator_page(total, hard_total):
    opts = ''.join('<option value="%d">Chapter %d: %s</option>' % (C['n'], C['n'], C['title']) for C in CHAPTERS)
    return section('simulator', '''<header class="page-header" style="--accent:#d97706;--soft:#fffbeb"><span class="eyebrow">%d CHAPTER-STYLE QUESTIONS</span>
    <h2>MCQ Simulator</h2>
    <p>Standard mode uses the questions from the MCQ preparation notes for Chapters 1–5. <b>Difficult mode</b> adds %d harder questions that climb Bloom&#39;s taxonomy from Remember to Create, including marked extension questions beyond the notes. Read the scenario, pick an answer, then read the logic — especially when you got it right by luck.</p>
</header>
<div class="quiz-layout">
    <aside class="quiz-settings">
        <h3 style="margin:0;color:#0f172a;font-size:18px">Quiz settings</h3>
        <label>MODE</label><select id="quiz-mode"><option value="standard">Standard (notes questions)</option><option value="difficult">Difficult (Bloom-graded + extensions)</option><option value="extensions">Extensions only</option></select>
        <label>CHAPTER</label><select id="quiz-module"><option value="all">All Chapters 1–5</option>%s</select>
        <label>QUESTION COUNT</label><select id="quiz-count"><option value="10">10 questions</option><option selected value="20">20 questions</option><option value="30">30 questions</option><option value="all">All matching questions</option></select>
        <label>ORDER</label><select id="quiz-order"><option value="shuffle">Shuffle questions</option><option value="sequence">Keep chapter order</option></select>
        <p class="quiz-mode-note" id="quiz-mode-note" hidden>Difficult questions always run from the lowest Bloom level to the highest. Shuffle mixes questions within each level.</p>
        <button class="primary-btn" onclick="startQuiz()" style="width:100%%;margin-top:17px">Start / Shuffle</button>
        <button class="secondary-btn" id="retry-btn" onclick="retryMistakes()" style="width:100%%;margin-top:8px;display:none">Retry missed questions</button>
        <div class="score-box">
            <div class="score-row"><span>Score</span><strong id="quiz-score">0 / 0</strong></div>
            <div class="score-row"><span>Accuracy</span><strong id="quiz-accuracy">0%%</strong></div>
        </div>
    </aside>
    <div class="quiz-stage">
        <div class="quiz-progress-track"><div class="quiz-progress-fill" id="quiz-progress"></div></div>
        <div class="quiz-card" id="quiz-card"><div class="empty-state"><div><h3>Ready when you are</h3><p>Choose the chapter and number of questions, then press Start / Shuffle.</p></div></div></div>
    </div>
</div>''' % (total + hard_total, hard_total, opts))


# ------------------------------------------------------------------ checks
EMOJI = re.compile('[\U0001F000-\U0001FAFF☀-➿⬀-⯿️⃣▶]')
# Text that would betray a page left over from the previous (machine learning) version of the site
LEFTOVER = re.compile(r'\bMachine Learning\b|\bTEB3123\b|\bsklearn\b|\bLecture \d|\bAWS\b')


def checks(doc, js_all):
    problems = []
    navs = set(re.findall(r'id="nav-([a-z0-9-]+)"', doc))
    secs = set(re.findall(r'id="sec-([a-z0-9-]+)"', doc))
    for x in sorted(navs - secs):
        problems.append('nav button without section: ' + x)
    for x in sorted(set(re.findall(r'data-nav="([a-z0-9-]+)"', doc)) - secs):
        problems.append('nav target missing: ' + x)
    ids = re.findall(r'\bid="([^"]+)"', doc)
    dup, seen = set(), set()
    for i in ids:
        if i in seen:
            dup.add(i)
        seen.add(i)
    for d in sorted(dup):
        problems.append('duplicate id: ' + d)
    idset = set(ids)
    for attr in ('data-reveal', 'data-jump', 'data-toc'):
        for x in set(re.findall(attr + r'="([^"]+)"', doc)):
            if x not in idset:
                problems.append('%s target missing: %s' % (attr, x))
    for g, p in re.findall(r'data-tab="([^"]+)" data-panel="([^"]+)"', doc):
        if g + '-' + p not in idset:
            problems.append('tab panel missing: %s-%s' % (g, p))
    for m in sorted(set(LEFTOVER.findall(doc + js_all))):
        problems.append('leftover text from the old site: %r' % m)
    for key in set(re.findall(r'data-vis="([a-z0-9_]+)"', doc)):
        if not re.search(r'ML_VIS\.%s\s*=' % key, js_all):
            problems.append('widget has no JS: ' + key)
    for (ch, kind), items in NOTES_VISUALS.items():
        for head, key in items:
            if ('l%d%s' % (ch, KIND_PREFIX[kind]), head) not in _notes_visuals_used:
                problems.append('notes visual heading not found: C%d %s %r -> %s' % (ch, kind, head, key))
    for m in _missing_labels:
        problems.append('no short label: ' + m)
    problems += _missing_answers
    for ch, items in MCQ_PARTS.items():
        for head, title in items:
            if title not in _mcq_parts_used:
                problems.append('MCQ part anchor not found: C%d %r' % (ch, head))
    emoji = EMOJI.findall(doc + js_all)
    if emoji:
        problems.append('emoji in output: ' + ' '.join(sorted(set(emoji))))
    m = re.search(r'\son[a-z]+="[^"]*"', doc)
    if m:
        problems.append('inline event handler left: ' + m.group(0)[:80])
    m = re.search(r'\sstyle="[^"]*"', doc)
    if m:
        problems.append('inline style left: ' + m.group(0)[:80])
    if '<script>' in doc or '<style>' in doc:
        problems.append('inline <script> or <style> block left')
    return problems


SECTION_RE = re.compile(r'(<section class="page-section[^"]*" data-page="([a-z0-9-]+)" id="sec-[a-z0-9-]+">)\n(.*?)\n</section>\n', re.S)


def split_pages(doc):
    """Move each page's content into its own file; leave an empty, hidden section in the shell."""
    pages = {}

    def cut(m):
        opening, pid, inner = m.group(1), m.group(2), m.group(3)
        assert '<section' not in inner, 'nested <section> in ' + pid
        pages[pid] = inner
        return '                ' + re.sub(r'class="page-section[^"]*"', 'class="page-section hidden"', opening) + '</section>\n'

    shell = SECTION_RE.sub(cut, doc)
    shell = re.sub(r'</section>\n\s*\n(?=\s*<section)', '</section>\n', shell)
    shell = re.sub(r'\n(?=                <section)', '\n', shell)
    assert shell.count('<section') == len(pages) == len(re.findall(r'data-page="', doc)), 'page split mismatch'
    return shell, pages


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8', newline='\n').write(text)


PAGE = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    <title>Fundamentals of Investing Chapters 1–5: Guided Learning &amp; Exam Prep</title>
    <meta name="description" content="Guided lessons, interactive visuals, full notes, subjective model answers and an MCQ simulator for Fundamentals of Investing, Chapters 1–5." />
    <link rel="icon" href="data:," />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&amp;display=swap" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css" />
    <link rel="stylesheet" href="assets/css/main.css" />
    <script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"></script>
    <script defer src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js"></script>
    <script defer src="assets/js/questions.js"></script>
    <script defer src="assets/js/diagrams.js"></script>
    <script defer src="assets/js/visuals.js"></script>
    <script defer src="assets/js/app.js"></script>
</head>
<body>
    <div class="app">
%s
        <button aria-controls="sidebar" aria-expanded="false" aria-label="Open navigation" class="mobile-menu" id="mobile-menu" onclick="toggleSidebar()"><span class="bars" aria-hidden="true"></span></button>
        <button type="button" class="contents-fab" id="contents-fab" onclick="jumpToContents()" title="Back to the section list" hidden>↑ Contents</button>
        <main class="main">
            <div class="content">
                <div class="topbar">
                    <button onclick="window.print()">Print current page</button>
                    <button onclick="resetProgress()">↺ Reset progress</button>
                </div>
%s
%s
            </div>
        </main>
    </div>
</body>
</html>
"""


def main():
    secs = np_.load_sections()
    hard_bank, hard_problems = dp.load_all()
    hard_problems = ['difficult: ' + p for p in hard_problems]
    bank, pages = [], []
    for C in CHAPTERS:
        n = C['n']
        qs, probs = np_.parse_mcqs(secs[(n, 'mcq')], n)
        for p in probs:
            print('  note:', p)
        bank += qs
        print('Chapter %d: %d MCQs' % (n, len(qs)))
        pages += lesson_pages(C)
        pages.append(notes_page(C, secs[(n, 'intuitive')]))
        pages.append(subjective_page(C, secs[(n, 'subjective')]))
        pages.append(prep_page(C, secs[(n, 'mcq')], qs, [q for q in hard_bank if q['module'] == n]))

    exam_pages = [home_page()]
    exam_pages.append(section('cheat', expand(read('pages', 'cheat.html'))))
    exam_pages.append(section('traps', expand(read('pages', 'traps.html'))))
    exam_pages.append(simulator_page(len(bank), len(hard_bank)))
    exam_pages.append(section('strategy', expand(read('pages', 'strategy.html'))))

    doc = PAGE % (sidebar(), '\n'.join(exam_pages), '\n'.join(pages))
    doc = externalize_handlers(doc)
    doc, unknown_styles = externalize_styles(doc)
    doc = ascii_fix.html(doc)

    css = ascii_fix.code(read('template_style.css') + read('template_style_visuals.css') + FIXED_CSS + theme_css())
    app_js = ascii_fix.code(read('template_app.js').replace('/*REPO*/', REPO).replace('/*BRANCH*/', BRANCH))
    visuals_js = ascii_fix.code(''.join(read('visuals', f) for f in ('_lib.js', 'l1.js', 'l2.js', 'l3.js', 'l4.js', 'l5.js')))
    questions_js = 'window.QUESTION_BANK = %s;\n' % json.dumps(
        ascii_fix.deep([{k: v for k, v in q.items() if not k.startswith('_')} for q in bank]), ensure_ascii=False)
    questions_js += 'window.DIFFICULT_BANK = %s;\n' % json.dumps(
        ascii_fix.deep([{k: v for k, v in q.items() if not k.startswith('_')} for q in hard_bank]), ensure_ascii=False)
    diagrams_js = 'window.ML_DIAGRAMS = %s;\n' % json.dumps(
        {k: ascii_fix.html(DIAGRAMS[k][0]()) for k in sorted(_diagrams_used)}, ensure_ascii=False)

    problems = checks(doc, app_js + visuals_js + questions_js + diagrams_js) + hard_problems
    odd = ascii_fix.leftovers(doc + css + app_js + visuals_js + questions_js + diagrams_js)
    if odd:
        problems.append('ASCII look-alike characters left: ' + ' '.join('U+%04X' % ord(c) for c in odd))
    for st in sorted(unknown_styles):
        problems.append('no class mapping for inline style: ' + st)
    for p in problems:
        print('  CHECK:', p)

    shell, page_files = split_pages(doc)
    for pid in set(re.findall(r'data-nav="([a-z0-9-]+)"', doc)) - set(page_files):
        problems.append('no page file for nav target: ' + pid)
        print('  CHECK: no page file for nav target: ' + pid)
    pages_dir = os.path.join(ASSETS, 'pages')
    if os.path.isdir(pages_dir):
        shutil.rmtree(pages_dir)
    for pid, inner in page_files.items():
        write(os.path.join(pages_dir, pid + '.js'), 'ML_PAGE(%s, %s);\n' % (json.dumps(pid), json.dumps(inner, ensure_ascii=False)))
    write(OUT, shell)
    write(os.path.join(ASSETS, 'css', 'main.css'), css)
    write(os.path.join(ASSETS, 'js', 'app.js'), app_js)
    write(os.path.join(ASSETS, 'js', 'visuals.js'), visuals_js)
    write(os.path.join(ASSETS, 'js', 'questions.js'), questions_js)
    write(os.path.join(ASSETS, 'js', 'diagrams.js'), diagrams_js)
    img_dir = os.path.join(ASSETS, 'img')
    if os.path.isdir(img_dir):
        shutil.rmtree(img_dir)
    os.makedirs(img_dir)
    for key in sorted(_fig_size):
        shutil.copy(os.path.join(FIG_DIR, key + '.webp'), os.path.join(img_dir, key + '.webp'))

    total_assets = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(ASSETS) for f in fs) / 1e6
    largest = sorted(page_files, key=lambda k: -len(page_files[k].encode('utf-8')))[:3]
    print('wrote index.html (%.1f KB) + assets (%.2f MB: %d page files, %d images), %d questions'
          % (os.path.getsize(OUT) / 1e3, total_assets, len(page_files), len(_fig_size), len(bank) + len(hard_bank)))
    print('  largest pages: ' + ', '.join('%s %.0f KB' % (k, len(page_files[k].encode('utf-8')) / 1e3) for k in largest))
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())
