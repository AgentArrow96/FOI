"""Tiny Excalidraw-style SVG generator (a minimal port of the rough.js idea).

Every stroke is drawn twice as slightly jittered cubic curves, rectangles can be
hachure-filled with rough diagonal lines, and labels use a handwriting font.
Randomness is seeded per diagram so builds are reproducible.
"""
import html
import math
import random

FONT = "Kalam, 'Segoe Print', 'Comic Sans MS', cursive"

INK = '#1e293b'
PALETTE = {
    'sky': ('#0284c7', '#e0f2fe'),
    'lime': ('#65a30d', '#ecfccb'),
    'indigo': ('#4f46e5', '#e0e7ff'),
    'rose': ('#e11d48', '#ffe4e6'),
    'amber': ('#d97706', '#fef3c7'),
    'slate': ('#475569', '#f1f5f9'),
    'green': ('#059669', '#d1fae5'),
    'violet': ('#7c3aed', '#ede9fe'),
}


class Sketch:
    def __init__(self, w, h, seed=1, title=''):
        self.w, self.h = w, h
        self.rng = random.Random(seed)
        self.parts = []
        self.title = title

    # -------------------------------------------------------------- primitives
    def _j(self, amount):
        return self.rng.uniform(-amount, amount)

    def _curve(self, x1, y1, x2, y2, rough):
        length = math.hypot(x2 - x1, y2 - y1)
        off = min(rough * 1.6, max(0.6, length * 0.012 * rough))
        dx, dy = x2 - x1, y2 - y1
        px, py = (-dy / length, dx / length) if length else (0, 0)
        bow = self._j(off * 1.2)
        c1 = (x1 + dx * 0.35 + px * bow + self._j(off), y1 + dy * 0.35 + py * bow + self._j(off))
        c2 = (x1 + dx * 0.7 + px * bow + self._j(off), y1 + dy * 0.7 + py * bow + self._j(off))
        return 'M%.1f %.1f C%.1f %.1f %.1f %.1f %.1f %.1f' % (
            x1 + self._j(off), y1 + self._j(off), c1[0], c1[1], c2[0], c2[1], x2 + self._j(off), y2 + self._j(off))

    def line(self, x1, y1, x2, y2, color=INK, width=1.8, rough=1.0, dash=None):
        d = self._curve(x1, y1, x2, y2, rough) + ' ' + self._curve(x1, y1, x2, y2, rough)
        extra = ' stroke-dasharray="%s"' % dash if dash else ''
        self.parts.append('<path d="%s" fill="none" stroke="%s" stroke-width="%.1f" stroke-linecap="round"%s/>' % (d, color, width, extra))

    def arrow(self, x1, y1, x2, y2, color=INK, width=1.8, head=11, dash=None):
        self.line(x1, y1, x2, y2, color, width, dash=dash)
        ang = math.atan2(y2 - y1, x2 - x1)
        for s in (-1, 1):
            a = ang + math.pi - s * 0.45
            self.line(x2, y2, x2 + head * math.cos(a), y2 + head * math.sin(a), color, width, rough=0.6)

    def hachure(self, x, y, w, h, color, gap=7, width=1.1):
        # diagonal lines y = -x + c clipped to the rectangle
        c = x + y
        while c < x + w + y + h:
            c += gap
            pts = []
            for xx in (x, x + w):
                yy = c - xx
                if y <= yy <= y + h:
                    pts.append((xx, yy))
            for yy in (y, y + h):
                xx = c - yy
                if x <= xx <= x + w:
                    pts.append((xx, yy))
            pts = sorted(set(pts))
            if len(pts) >= 2:
                (a, b), (cc, dd) = pts[0], pts[-1]
                self.parts.append('<path d="%s" fill="none" stroke="%s" stroke-width="%.1f" stroke-linecap="round" opacity=".55"/>'
                                  % (self._curve(a, b, cc, dd, 0.5), color, width))

    def rect(self, x, y, w, h, color=INK, fill=None, hachure=False, width=1.8, radius=0):
        if fill:
            if hachure:
                self.hachure(x + 2, y + 2, w - 4, h - 4, color)
            else:
                self.parts.append('<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="%d" fill="%s"/>'
                                  % (x + 1.5, y + 1.5, w - 3, h - 3, max(radius, 4), fill))
        self.line(x, y, x + w, y, color, width)
        self.line(x + w, y, x + w, y + h, color, width)
        self.line(x + w, y + h, x, y + h, color, width)
        self.line(x, y + h, x, y, color, width)

    def ellipse(self, cx, cy, rx, ry, color=INK, fill=None, width=1.8):
        if fill:
            self.parts.append('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s"/>' % (cx, cy, rx - 2, ry - 2, fill))
        for k in range(2):
            n = 14
            start = self.rng.uniform(0, math.pi * 2)
            pts = []
            for i in range(n + 3):
                t = start + i * 2 * math.pi / n
                f = 1 + self._j(0.035)
                pts.append((cx + rx * f * math.cos(t), cy + ry * f * math.sin(t)))
            d = 'M%.1f %.1f' % pts[1]
            for i in range(1, len(pts) - 2):
                p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[i + 2]
                c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
                c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
                d += ' C%.1f %.1f %.1f %.1f %.1f %.1f' % (c1[0], c1[1], c2[0], c2[1], p2[0], p2[1])
            self.parts.append('<path d="%s" fill="none" stroke="%s" stroke-width="%.1f" stroke-linecap="round"/>' % (d, color, width))

    def text(self, x, y, s, size=17, color=INK, anchor='middle', weight=400, lh=1.2):
        lines = s.split('\n')
        y0 = y - (len(lines) - 1) * size * lh / 2
        spans = ''.join('<tspan x="%.1f" y="%.1f">%s</tspan>' % (x, y0 + i * size * lh, html.escape(t)) for i, t in enumerate(lines))
        self.parts.append('<text font-family="%s" font-size="%d" fill="%s" text-anchor="%s" font-weight="%d" dominant-baseline="middle">%s</text>'
                          % (FONT, size, color, anchor, weight, spans))

    # -------------------------------------------------------------- composites
    def box(self, x, y, w, h, label, tone='slate', size=17, hachure=False, bold=False):
        stroke, fill = PALETTE[tone]
        self.rect(x, y, w, h, stroke, fill, hachure=hachure)
        self.text(x + w / 2, y + h / 2, label, size=size, weight=700 if bold else 400)

    def svg(self):
        title = '<title>%s</title>' % html.escape(self.title) if self.title else ''
        return ('<svg class="sketch" viewBox="0 0 %d %d" role="img" aria-label="%s" preserveAspectRatio="xMidYMid meet">%s%s</svg>'
                % (self.w, self.h, html.escape(self.title), title, ''.join(self.parts)))
