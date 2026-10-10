"""Parse app/notes.md: split into the 15 chapter sections, convert Markdown to
HTML with maths protected for KaTeX, and extract MCQs into a question bank."""
import html
import os
import re

import markdown

HERE = os.path.dirname(os.path.abspath(__file__))
NOTES = os.path.join(HERE, '..', 'notes.md')

KINDS = {'Intuitive Explanation': 'intuitive', 'MCQ Preparation': 'mcq',
         'Subjective Preparation': 'subjective'}

CITATION = re.compile(r'[ \t]*Chp\d[A-Z]?-[^\n]*?(?:\.pdf|…|(?=\s*$))', re.M)


def load_sections():
    """Return {(chapter:int, kind:str): markdown_text}."""
    text = open(NOTES, encoding='utf-8').read().replace('\r\n', '\n')
    pat = re.compile(r'<details>\n<summary><h1>Chapter (\d) (.+?)</h1></summary>\n(.*?)\n</details>', re.S)
    out = {}
    for m in pat.finditer(text):
        body = clean(m.group(3))
        out[(int(m.group(1)), KINDS[m.group(2)])] = body
    assert len(out) == 15, out.keys()
    return out


def clean(md):
    md = CITATION.sub('', md)
    # The PDFs hold one slide per page, so the notes' page numbers are slide numbers
    md = re.sub(r'\b([Pp])age(s?)(?= \**\d)', lambda m: ('S' if m.group(1) == 'P' else 's') + 'lide' + m.group(2), md)
    md = re.sub(r'[ \t]+$', lambda m: m.group(0) if len(m.group(0)) >= 2 else '', md, flags=re.M)
    md = re.sub(r'\n{3,}', '\n\n', md)
    return md.strip('\n')


# ---------------------------------------------------------------- markdown
FENCE = re.compile(r'^(```|~~~)')
DISPLAY = re.compile(r'\$\$\n?(.*?)\n?\$\$', re.S)
INLINE = re.compile(r'(?<![\\$])\$(?!\$)([^$\n]+?)(?<![\\ ])\$(?!\d)')
INLINE_CODE = re.compile(r'`[^`\n]+`')


def _protect(md):
    """Swap maths for alphanumeric tokens outside fenced code."""
    store = []
    out, buf, in_code = [], [], False

    def tok(s):
        store.append(s)
        return 'MATHTOK%dZ' % (len(store) - 1)

    def flush():
        seg = '\n'.join(buf)
        seg = DISPLAY.sub(lambda m: '\n\n' + tok('D' + m.group(1).strip()) + '\n\n', seg)
        codes = []
        seg = INLINE_CODE.sub(lambda m: codes.append(m.group(0)) or 'CODETOK%dZ' % (len(codes) - 1), seg)
        seg = INLINE.sub(lambda m: tok('I' + m.group(1)), seg)
        seg = seg.replace('\\$', 'DOLLARTOKZ')  # escaped currency sign in prose
        seg = re.sub(r'CODETOK(\d+)Z', lambda m: codes[int(m.group(1))], seg)
        out.append(seg)
        buf.clear()

    for ln in md.split('\n'):
        if FENCE.match(ln.lstrip()):
            if not in_code:
                flush()
                out.append(ln)
                in_code = True
            else:
                out.append(ln)
                in_code = False
            continue
        if in_code:
            out.append(ln)
        else:
            buf.append(ln)
    flush()
    return '\n'.join(out), store


def _restore(h, store):
    def rep(m):
        s = store[int(m.group(1))]
        body = html.escape(s[1:], quote=False)
        if s[0] == 'D':
            flow = _text_chain(s[1:])
            if flow:
                return flow
            return '<div class="math-display">$$' + body + '$$</div>'
        return '$' + body + '$'
    h = re.sub(r'<p>\s*MATHTOK(\d+)Z\s*</p>', rep, h)
    h = re.sub(r'MATHTOK(\d+)Z', rep, h)
    # A lone '$' in its own element can never pair up with another one as a KaTeX delimiter
    return h.replace('DOLLARTOKZ', '<span class="cur">$</span>')


def _text_chain(tex):
    """Render a plain '\\text{A} \\rightarrow \\text{B} \\rightarrow ...' chain as a wrapping HTML flow,
    so long step sequences fold onto new lines on narrow screens instead of scrolling sideways."""
    t = tex.strip()
    boxed = t.startswith('\\boxed{') and t.endswith('}')
    if boxed:
        t = t[len('\\boxed{'):-1]
    steps = re.split(r'\\rightarrow', t)
    if len(steps) < 3:
        return None
    labels = []
    for st in steps:
        parts = re.findall(r'\\text\{([^{}]*)\}', st)
        if not parts or re.sub(r'\\text\{[^{}]*\}|\s', '', st):
            return None
        labels.append(''.join(parts).replace('\\&', '&').replace('\\%', '%'))
    inner = '<i aria-hidden="true">→</i>'.join('<span>%s</span>' % html.escape(l) for l in labels)
    return '<div class="math-flow%s" role="img" aria-label="%s">%s</div>' % (
        ' boxed' if boxed else '', html.escape(' → '.join(labels)), inner)


_md = markdown.Markdown(extensions=['tables', 'fenced_code', 'sane_lists'])


def md_to_html(md, shift=0):
    """Convert Markdown to HTML. shift demotes headings (h2 -> h{2+shift})."""
    src, store = _protect(md)
    _md.reset()
    h = _md.convert(src)
    h = _restore(h, store)
    if shift:
        def demote(m):
            n = min(6, int(m.group(2)) + shift)
            return '<%sh%d' % (m.group(1), n)
        h = re.sub(r'<(/?)h([1-6])', demote, h)
    return h


def md_inline(md):
    h = md_to_html(md)
    m = re.fullmatch(r'<p>(.*)</p>', h.strip(), re.S)
    return m.group(1) if m else h


# ---------------------------------------------------------------- sections
def split_h2(md):
    """Split a section into [(heading, body)] on '## ' headings (outside code)."""
    parts, cur_h, cur, in_code = [], None, [], False
    for ln in md.split('\n'):
        if FENCE.match(ln.lstrip()):
            in_code = not in_code
        if not in_code and ln.startswith('## '):
            parts.append((cur_h, '\n'.join(cur).strip()))
            cur_h, cur = ln[3:].strip(), []
        else:
            cur.append(ln)
    parts.append((cur_h, '\n'.join(cur).strip()))
    return [p for p in parts if p[0] or p[1]]


# ---------------------------------------------------------------- MCQs
QHEAD = re.compile(r'^#{3,5} Q(\d+)\s*$')
OPTION = re.compile(r'^\s*-\s*\*\*([A-F])\.\*\*\s+(.*?)\s*$')
ANSWER = re.compile(r'^\*\*Answer:\s*([A-F])\.\s*(.*?)\*\*\s*$')
TRAP = re.compile(r'^\*\*Exam trap:\*\*\s*(.*)$')


def mcq_blocks(md):
    """Yield (number, [lines]) for every '### Qn' block; a block ends at the next heading."""
    cur, in_code = None, False
    for ln in md.split('\n'):
        if FENCE.match(ln.lstrip()):
            in_code = not in_code
        m = QHEAD.match(ln) if not in_code else None
        if m or (not in_code and re.match(r'^#{1,6} ', ln)):
            if cur:
                yield cur
            cur = (int(m.group(1)), []) if m else None
            continue
        if cur:
            cur[1].append(ln)
    if cur:
        yield cur


def parse_mcqs(md, chapter):
    """Return (questions, problems). Each question dict matches the quiz engine.

    Block format: question text, '- **A.** option' lines, '**Answer: C. text**',
    explanation paragraphs and a final '**Exam trap:** ...' line."""
    questions, problems, seen = [], [], set()
    for n, lines in mcq_blocks(md):
        if n in seen:
            problems.append('C%d Q%d duplicate number' % (chapter, n))
            continue
        seen.add(n)
        qlines, opts, answer, why, trap, state = [], [], None, [], '', 'q'
        for ln in lines:
            om = OPTION.match(ln)
            am = ANSWER.match(ln.strip())
            tm = TRAP.match(ln.strip())
            if om and state in ('q', 'o'):
                opts.append([om.group(1), om.group(2)])
                state = 'o'
            elif am:
                answer, state = am.group(1), 'a'
            elif tm and state == 'a':
                trap = tm.group(1).strip()
            elif state == 'q':
                qlines.append(ln)
            elif state == 'a':
                why.append(ln)
        if not opts or not answer or answer not in [o[0] for o in opts]:
            problems.append('C%d Q%d skipped (opts=%d answer=%s)' % (chapter, n, len(opts), answer))
            continue
        qmd = '\n'.join(qlines).strip()
        expl = md_to_html('\n'.join(why).strip())
        if trap:
            expl += '<p class="exam-trap"><strong>Exam trap:</strong> %s</p>' % md_inline(trap)
        questions.append({
            'module': chapter, 'number': n,
            'question': md_to_html(qmd),
            'options': [[l, md_inline(t)] for l, t in opts],
            'answers': [answer], 'multiple': False,
            'explanation': expl,
            '_inline': md_to_html(qmd),  # build-time only, stripped from the quiz JSON
            '_trap': trap,
        })
    questions.sort(key=lambda q: q['number'])
    return questions, problems


if __name__ == '__main__':
    secs = load_sections()
    for c in range(1, 6):
        qs, probs = parse_mcqs(secs[(c, 'mcq')], c)
        print('Chapter', c, len(qs), 'MCQs,', sum(1 for q in qs if q['_trap']), 'traps')
        for p in probs:
            print('  ', p)
