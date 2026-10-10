"""Parse the Difficult-mode question files (tools/difficult/l1.md ... l5.md).

Format per question:

    ## D1 · Apply
    ## X3 · Extension · PhD · Evaluate
    Question text (Markdown)
    A. option
    B. option
    Answer: A, C
    Why: explanation (Markdown, may span several paragraphs)
"""
import os
import re

import notes_parser as np_

HERE = os.path.dirname(os.path.abspath(__file__))
BLOOM = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']
EXT_LEVELS = ['Industry', 'CFA', 'Case competition', "Master's", 'PhD', 'Postdoc']
HEAD = re.compile(r'^## ([DX]\d+) · (.+)$')
OPTION = re.compile(r'^([A-F])\. (.+)$')


def parse_file(lecture):
    path = os.path.join(HERE, 'difficult', 'l%d.md' % lecture)
    text = open(path, encoding='utf-8').read().replace('\r\n', '\n')
    blocks, cur = [], None
    in_code = False
    for ln in text.split('\n'):
        if ln.lstrip().startswith('```'):
            in_code = not in_code
        m = HEAD.match(ln) if not in_code else None
        if m:
            cur = {'id': m.group(1), 'tags': [t.strip() for t in m.group(2).split('·')], 'lines': []}
            blocks.append(cur)
        elif cur is not None:
            cur['lines'].append(ln)
    questions, problems = [], []
    for b in blocks:
        qid, tags = b['id'], b['tags']
        where = 'C%d %s' % (lecture, qid)
        bloom = tags[-1]
        ext = None
        if qid.startswith('X'):
            if len(tags) != 3 or tags[0] != 'Extension' or tags[1] not in EXT_LEVELS:
                problems.append('%s: extension heading must be "Extension · <level> · <Bloom>"' % where)
            else:
                ext = tags[1]
        elif len(tags) != 1:
            problems.append('%s: heading must be "D<n> · <Bloom>"' % where)
        if bloom not in BLOOM:
            problems.append('%s: unknown Bloom level %r' % (where, bloom))
            continue
        q_lines, opts, answer, why, state, in_code = [], [], None, [], 'q', False
        for ln in b['lines']:
            if ln.lstrip().startswith('```'):
                in_code = not in_code
            om = OPTION.match(ln) if not in_code and state in ('q', 'o') else None
            if om:
                opts.append([om.group(1), om.group(2).strip()])
                state = 'o'
                continue
            if not in_code and state == 'o' and ln.startswith('Answer:'):
                answer = [a.strip() for a in ln[len('Answer:'):].split(',') if a.strip()]
                state = 'a'
                continue
            if not in_code and state == 'a' and ln.startswith('Why:'):
                why.append(ln[len('Why:'):].strip())
                state = 'w'
                continue
            if state == 'q':
                q_lines.append(ln)
            elif state == 'w':
                why.append(ln)
            elif ln.strip():
                problems.append('%s: unexpected line %r' % (where, ln[:60]))
        letters = [l for l, _ in opts]
        if not 2 <= len(opts) <= 6 or ''.join(letters) != 'ABCDEF'[:len(opts)]:
            problems.append('%s: options must be A, B, C... (got %s)' % (where, ''.join(letters)))
        if not answer or any(a not in letters for a in answer):
            problems.append('%s: answer %r not among options' % (where, answer))
        if not '\n'.join(why).strip():
            problems.append('%s: missing explanation' % where)
        if not '\n'.join(q_lines).strip():
            problems.append('%s: missing question text' % where)
        if problems and problems[-1].startswith(where):
            continue
        qhtml = np_.md_to_html('\n'.join(q_lines).strip())
        questions.append({
            'module': lecture, 'number': qid, 'set': 'difficult', 'bloom': bloom, 'bloom_rank': BLOOM.index(bloom) + 1,
            'ext': ext, 'question': qhtml, '_inline': qhtml,
            'options': [[l, np_.md_inline(t)] for l, t in opts],
            'answers': answer, 'multiple': len(answer) > 1,
            'explanation': np_.md_to_html('\n'.join(why).strip()),
        })
    d = [q for q in questions if not q['ext']]
    x = [q for q in questions if q['ext']]
    for level in BLOOM:
        n = sum(1 for q in d if q['bloom'] == level)
        if n != 3:
            problems.append('C%d: expected 3 Bloom-graded %s questions, found %d' % (lecture, level, n))
    if len(x) != 12:
        problems.append('C%d: expected 12 extension questions, found %d' % (lecture, len(x)))
    ids = [q['number'] for q in questions]
    for i in set(ids):
        if ids.count(i) > 1:
            problems.append('C%d: duplicate id %s' % (lecture, i))
    order = lambda q: (q['bloom_rank'], 1 if q['ext'] else 0, int(q['number'][1:]))
    return sorted(questions, key=order), problems


def load_all():
    allq, problems = [], []
    for lec in range(1, 6):
        if os.path.exists(os.path.join(HERE, 'difficult', 'l%d.md' % lec)):
            q, p = parse_file(lec)
            allq += q
            problems += p
        else:
            problems.append('missing difficult/l%d.md' % lec)
    return allq, problems
