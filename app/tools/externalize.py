"""Post-process the generated page: inline handlers -> data attributes, inline styles -> classes."""
import re

HANDLERS = [
    (r'''onclick="navTo\('([^']+)'\)"''', r'data-nav="\1"'),
    (r'''onclick="revealTeach\('([^']+)'\)"''', r'data-reveal="\1"'),
    (r'''onclick="switchConcept\('([^']+)','([^']+)',this\)"''', r'data-tab="\1" data-panel="\2"'),
    (r'''onclick="jumpTo\('([^']+)'\)"''', r'data-jump="\1"'),
    (r'''onclick="tocGo\(this,'([^']+)'\)"''', r'data-toc="\1"'),
    (r'''onclick="toggleSections\(this,true\)"''', 'data-sections="open"'),
    (r'''onclick="toggleSections\(this,false\)"''', 'data-sections="close"'),
    (r'''onclick="launchModuleQuiz\((\d+)\)"''', r'data-quiz="\1"'),
    (r'''onclick="markLearned\((\d+)\)"''', r'data-learned="\1"'),
    (r'''onclick="window\.print\(\)"''', 'data-action="print"'),
    (r'''onclick="resetProgress\(\)"''', 'data-action="reset-progress"'),
    (r'''onclick="startQuiz\(\)"''', 'data-action="start-quiz"'),
    (r'''onclick="retryMistakes\(\)"''', 'data-action="retry"'),
    (r'''onclick="toggleSidebar\(\)"''', 'data-action="toggle-sidebar"'),
    (r'''onclick="jumpToContents\(\)"''', 'data-action="contents"'),
    (r'''\s*oninput="tocFilter\(this\)"''', ''),
]


def externalize_handlers(doc):
    for pat, rep in HANDLERS:
        doc = re.sub(pat, rep, doc)
    return doc


THEMES = {'#0284c7': 'l1', '#65a30d': 'l2', '#4f46e5': 'l3', '#e11d48': 'l4', '#0d9488': 'l5', '#d97706': 'exam'}
SOFT = {'l1': '#f0f9ff', 'l2': '#f7fee7', 'l3': '#eef2ff', 'l4': '#fff1f2', 'l5': '#f0fdfa', 'exam': '#fffbeb'}

FIXED = {
    'text-align: right;': 'ta-r',
    'text-align: center;': 'ta-c',
    'text-align: left;': 'ta-l',
    'opacity:.7': 'muted',
    'margin-top:18px': 'mt-18',
    'margin:0': 'm-0',
    'margin:26px 0 12px;color:#0f172a;font-size:19px': 'block-title',
    'margin-bottom:20px': 'mb-20',
    'overflow:auto': 'scroll-x',
    'margin-top:18px;overflow:auto': 'mt-18 scroll-x',
    'margin-top:8px;color:#94a3b8': 'note-weak',
    'margin-top:8px;color:#047857': 'note-good',
    'margin:0 0 6px;font-weight:800;color:#0f172a': 'code-label',
    'margin:12px 0 0;color:#475569;font-size:13px': 'card-note',
    'margin:0;color:#0f172a;font-size:18px': 'quiz-settings-title',
    'width:100%;margin-top:17px': 'btn-block mt-17',
    'width:100%;margin-top:8px;display:none': 'btn-block mt-8 is-hidden',
    'color:#475569;font-size:13px;line-height:1.7;margin:10px 0 0': 'card-note',
    'grid-column:1 / -1': 'span-all',
    'margin-top:14px': 'mt-14',
    'padding:16px': 'p-16',
}

FIXED_CSS = '''
        /* Helper classes (generated from former inline styles) */
        .ta-r { text-align: right; }
        .ta-c { text-align: center; }
        .ta-l { text-align: left; }
        .muted { opacity: .7; }
        .m-0 { margin: 0; }
        .mt-8 { margin-top: 8px; }
        .mt-14 { margin-top: 14px; }
        .mt-17 { margin-top: 17px; }
        .mt-18 { margin-top: 18px; }
        .mb-20 { margin-bottom: 20px; }
        .p-16 { padding: 16px; }
        .scroll-x { overflow: auto; }
        .span-all { grid-column: 1 / -1; }
        .btn-block { width: 100%; }
        .is-hidden { display: none; }
        .block-title { margin: 26px 0 12px; color: #0f172a; font-size: 19px; }
        .note-weak { margin-top: 8px; color: #94a3b8; }
        .note-good { margin-top: 8px; color: #047857; }
        .code-label { margin: 0 0 6px; font-weight: 800; color: #0f172a; }
        .card-note { margin: 12px 0 0; color: #475569; font-size: 13px; line-height: 1.7; }
        .quiz-settings-title { margin: 0; color: #0f172a; font-size: 18px; }
'''


def theme_css():
    out = []
    for color, name in THEMES.items():
        out.append('        .theme-%s { --accent: %s; --soft: %s; }' % (name, color, SOFT[name]))
        out.append('        .accent-%s { --accent: %s; }' % (name, color))
        out.append('        .bg-%s { background: %s; }' % (name, color))
        out.append('        .fg-%s { color: %s; }' % (name, color))
    out.append('        .fg-gold { color: #fbbf24; }')
    return '\n'.join(out) + '\n'


def style_to_classes(style):
    s = style.strip()
    if s in FIXED:
        return FIXED[s]
    m = re.fullmatch(r'--accent:(#[0-9a-f]{6});--soft:(#[0-9a-f]{6})', s)
    if m and m.group(1) in THEMES and SOFT[THEMES[m.group(1)]] == m.group(2):
        return 'theme-' + THEMES[m.group(1)]
    m = re.fullmatch(r'--accent:(#[0-9a-f]{6})', s)
    if m and m.group(1) in THEMES:
        return 'accent-' + THEMES[m.group(1)]
    m = re.fullmatch(r'background:(#[0-9a-f]{6})', s)
    if m and m.group(1) in THEMES:
        return 'bg-' + THEMES[m.group(1)]
    m = re.fullmatch(r'color:(#[0-9a-f]{6})', s)
    if m and m.group(1) in THEMES:
        return 'fg-' + THEMES[m.group(1)]
    if s == 'color:#fbbf24':
        return 'fg-gold'
    return None


TAG = re.compile(r'<([a-zA-Z][a-zA-Z0-9-]*)(\s[^<>]*?)?\sstyle="([^"]*)"([^<>]*)>')


def externalize_styles(doc):
    unknown = set()

    def fix(m):
        tag, before, style, after = m.group(1), m.group(2) or '', m.group(3), m.group(4)
        cls = style_to_classes(style)
        if cls is None:
            unknown.add(style)
            return m.group(0)
        attrs = before + after
        cm = re.search(r'\sclass="([^"]*)"', attrs)
        if cm:
            attrs = attrs[:cm.start()] + ' class="%s %s"' % (cm.group(1), cls) + attrs[cm.end():]
        else:
            attrs = ' class="%s"' % cls + attrs
        return '<%s%s>' % (tag, attrs)

    prev = None
    while prev != doc:  # repeat in case a tag matched twice
        prev = doc
        doc = TAG.sub(fix, doc)
    return doc, unknown
