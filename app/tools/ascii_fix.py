"""Replace typographic characters that look like ASCII (en/em dashes, minus, curly quotes, x-sign,
ellipsis, full-width signs) with their plain ASCII forms in the generated output."""
import re

PLAIN = {
    '–': '-', '—': '-', '−': '-', '‐': '-', '‑': '-', '－': '-',
    '＋': '+', '×': 'x', '…': '...',
    '‘': "'", '’': "'", '“': '"', '”': '"',
    ' ': ' ', ' ': ' ', ' ': ' ', '​': '', '﻿': '',
}
MATH = dict(PLAIN, **{'×': r'\times ', '…': r'\ldots '})
TAG = dict(PLAIN, **{'“': '&quot;', '”': '&quot;'})
PATTERN = re.compile('[%s]' % ''.join(PLAIN))
TOKEN = re.compile(r'(<[^<>]*>)')
MATH_SPAN = re.compile(r'(\$\$[\s\S]+?\$\$|\$[^$]+?\$)')
SKIP_MATH = ('pre', 'code', 'script', 'style', 'textarea', 'option', 'noscript')


def code(text):
    return PATTERN.sub(lambda m: PLAIN[m.group()], text)


def _sub(text, table):
    return PATTERN.sub(lambda m: table[m.group()], text)


def html(text):
    """Like KaTeX auto-render, treat $...$ / $$...$$ inside a text node as maths (outside code blocks)."""
    out, raw = [], 0
    for part in TOKEN.split(text):
        if part.startswith('<') and part.endswith('>'):
            m = re.match(r'<(/?)([a-zA-Z0-9]+)', part)
            if m and m.group(2).lower() in SKIP_MATH:
                raw += -1 if m.group(1) else 1
            out.append(_sub(part, TAG))
        elif raw > 0:
            out.append(_sub(part, PLAIN))
        else:
            out.append(''.join(_sub(p, MATH if i % 2 else PLAIN) for i, p in enumerate(MATH_SPAN.split(part))))
    return ''.join(out)


def deep(obj):
    """Apply html() to every string in a JSON-like structure."""
    if isinstance(obj, str):
        return html(obj)
    if isinstance(obj, list):
        return [deep(x) for x in obj]
    if isinstance(obj, dict):
        return {k: deep(v) for k, v in obj.items()}
    return obj


def leftovers(text):
    return sorted(set(PATTERN.findall(text)))
