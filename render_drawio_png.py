import math
import os
import re
import sys
import xml.etree.ElementTree as ET
from typing import Dict, Tuple, List, Optional

try:
    from PIL import Image, ImageDraw, ImageFont
except Exception as exc:
    print("Pillow not installed. Please run: pip install --user pillow", file=sys.stderr)
    raise


def parse_style(style: str) -> Dict[str, str]:
    result: Dict[str, str] = {}
    if not style:
        return result
    parts = style.split(';')
    for p in parts:
        if not p:
            continue
        if '=' in p:
            k, v = p.split('=', 1)
            result[k] = v
    return result


def html_to_text(html: str) -> str:
    if html is None:
        return ''
    text = html
    text = text.replace('<br/>', '\n').replace('<br>', '\n').replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&')
    # strip remaining tags
    text = re.sub(r'<[^>]+>', '', text)
    return text


class Vertex:
    def __init__(self, id_: str, x: float, y: float, w: float, h: float, value: str, style: Dict[str, str]):
        self.id = id_
        self.x = x
        self.y = y
        self.w = w
        self.h = h
        self.value = value
        self.style = style

    def bounds(self) -> Tuple[float, float, float, float]:
        return self.x, self.y, self.x + self.w, self.y + self.h


class Edge:
    def __init__(self, id_: str, source: str, target: str, value: str, style: Dict[str, str]):
        self.id = id_
        self.source = source
        self.target = target
        self.value = value
        self.style = style


def choose_connection_points(a: Vertex, b: Vertex) -> Tuple[Tuple[float, float], Tuple[float, float], str]:
    # Decide side based on relative position
    axc = a.x + a.w / 2
    ayc = a.y + a.h / 2
    bxc = b.x + b.w / 2
    byc = b.y + b.h / 2
    gap = 30

    if b.x >= a.x + a.w + gap:  # b to the right
        sp = (a.x + a.w, ayc)
        tp = (b.x, byc)
        orientation = 'horizontal'
    elif a.x >= b.x + b.w + gap:  # b to the left
        sp = (a.x, ayc)
        tp = (b.x + b.w, byc)
        orientation = 'horizontal'
    elif b.y >= a.y + a.h + gap:  # b below
        sp = (axc, a.y + a.h)
        tp = (bxc, b.y)
        orientation = 'vertical'
    else:  # b above
        sp = (axc, a.y)
        tp = (bxc, b.y + b.h)
        orientation = 'vertical'
    return sp, tp, orientation


def orthogonal_path(sp: Tuple[float, float], tp: Tuple[float, float], orientation: str) -> List[Tuple[float, float]]:
    # Simple 3-segment orthogonal path via midpoint
    x1, y1 = sp
    x2, y2 = tp
    pts: List[Tuple[float, float]] = [sp]
    if orientation == 'horizontal':
        mx = (x1 + x2) / 2
        pts.append((mx, y1))
        pts.append((mx, y2))
    else:
        my = (y1 + y2) / 2
        pts.append((x1, my))
        pts.append((x2, my))
    pts.append(tp)
    return pts


def draw_dashed_rectangle(draw: ImageDraw.ImageDraw, bbox: Tuple[int, int, int, int], dash: int = 6):
    x1, y1, x2, y2 = bbox
    # top
    for x in range(x1, x2, dash * 2):
        draw.line([(x, y1), (min(x + dash, x2), y1)], fill=(0, 0, 0), width=2)
    # bottom
    for x in range(x1, x2, dash * 2):
        draw.line([(x, y2), (min(x + dash, x2), y2)], fill=(0, 0, 0), width=2)
    # left
    for y in range(y1, y2, dash * 2):
        draw.line([(x1, y), (x1, min(y + dash, y2))], fill=(0, 0, 0), width=2)
    # right
    for y in range(y1, y2, dash * 2):
        draw.line([(x2, y), (x2, min(y + dash, y2))], fill=(0, 0, 0), width=2)


def draw_text_wrapped(draw: ImageDraw.ImageDraw, text: str, xy: Tuple[int, int], font: ImageFont.ImageFont, max_width: int, line_height: int):
    x, y = xy
    for paragraph in text.split('\n'):
        line = ''
        for word in paragraph.split(' '):
            test = (line + ' ' + word).strip()
            w, _ = draw.textbbox((0, 0), test, font=font)[2:]
            if w <= max_width:
                line = test
            else:
                draw.text((x, y), line, fill=(0, 0, 0), font=font)
                y += line_height
                line = word
        if line:
            draw.text((x, y), line, fill=(0, 0, 0), font=font)
            y += line_height
    return y


def draw_marker(draw: ImageDraw.ImageDraw, point: Tuple[float, float], direction: str, kind: str):
    # direction: 'left','right','up','down'
    x, y = point
    size = 10
    if kind == 'ERmany':
        if direction in ('left', 'right'):
            dx = -1 if direction == 'left' else 1
            # three prongs
            draw.line([(x, y - 8), (x + dx * size, y)], fill=(0, 0, 0), width=2)
            draw.line([(x, y + 8), (x + dx * size, y)], fill=(0, 0, 0), width=2)
            draw.line([(x, y), (x + dx * size, y)], fill=(0, 0, 0), width=2)
        else:
            dy = -1 if direction == 'up' else 1
            draw.line([(x - 8, y), (x, y + dy * size)], fill=(0, 0, 0), width=2)
            draw.line([(x + 8, y), (x, y + dy * size)], fill=(0, 0, 0), width=2)
            draw.line([(x, y), (x, y + dy * size)], fill=(0, 0, 0), width=2)
    elif kind == 'ERone':
        # a perpendicular bar
        if direction in ('left', 'right'):
            draw.line([(x, y - 8), (x, y + 8)], fill=(0, 0, 0), width=2)
        else:
            draw.line([(x - 8, y), (x + 8, y)], fill=(0, 0, 0), width=2)
    elif kind == 'ERzero':
        draw.ellipse((x - 6, y - 6, x + 6, y + 6), outline=(0, 0, 0), width=2)


def determine_marker_direction(sp: Tuple[float, float], tp: Tuple[float, float]) -> Tuple[str, str]:
    # infer entering direction at target and leaving direction at source from last segment
    sx, sy = sp
    tx, ty = tp
    if abs(tx - sx) > abs(ty - sy):
        sdir = 'right' if tx > sx else 'left'
        tdir = 'left' if tx > sx else 'right'
    else:
        sdir = 'down' if ty > sy else 'up'
        tdir = 'up' if ty > sy else 'down'
    return sdir, tdir


def render(xml_path: str, out_path: str, scale: float = 2.0):
    tree = ET.parse(xml_path)
    root = tree.getroot()
    mgm = root.find('.//mxGraphModel')
    if mgm is None:
        raise RuntimeError('mxGraphModel not found in drawio file')
    # Parse cells
    vertices: Dict[str, Vertex] = {}
    edges: List[Edge] = []
    max_x = 0.0
    max_y = 0.0
    for cell in mgm.findall('.//mxCell'):
        id_ = cell.attrib.get('id')
        if not id_:
            continue
        value = cell.attrib.get('value') or ''
        style = parse_style(cell.attrib.get('style', ''))
        if cell.attrib.get('vertex') == '1':
            geo = cell.find('./mxGeometry')
            if geo is None:
                continue
            x = float(geo.attrib.get('x', '0'))
            y = float(geo.attrib.get('y', '0'))
            w = float(geo.attrib.get('width', '160'))
            h = float(geo.attrib.get('height', '100'))
            vertices[id_] = Vertex(id_, x, y, w, h, value, style)
            max_x = max(max_x, x + w)
            max_y = max(max_y, y + h)
        elif cell.attrib.get('edge') == '1':
            source = cell.attrib.get('source')
            target = cell.attrib.get('target')
            edges.append(Edge(id_, source or '', target or '', value, style))

    margin = 80
    width = int((max_x + margin) * scale)
    height = int((max_y + margin) * scale)
    if width < 1200:
        width = 1200
    if height < 800:
        height = 800
    img = Image.new('RGB', (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype('DejaVuSans.ttf', int(12 * scale))
        font_bold = ImageFont.truetype('DejaVuSans-Bold.ttf', int(12 * scale))
    except Exception:
        font = ImageFont.load_default()
        font_bold = font

    def sx(x: float) -> int:
        return int((x + margin / 2) * scale)

    def sy(y: float) -> int:
        return int((y + margin / 2) * scale)

    # Draw vertices
    for v in vertices.values():
        x1, y1, x2, y2 = sx(v.x), sy(v.y), sx(v.x + v.w), sy(v.y + v.h)
        if v.style.get('shape') == 'note':
            # Draw note shape
            draw.rectangle((x1, y1, x2, y2), fill=(255, 242, 182), outline=(229, 195, 101), width=2)
            # small folded corner
            corner = 12 * scale
            draw.polygon([(x2 - corner, y1), (x2 - corner, y1 + corner), (x2, y1 + corner)], fill=(255, 255, 255), outline=(229, 195, 101))
            txt = html_to_text(v.value)
            draw_text_wrapped(draw, txt, (x1 + int(8 * scale), y1 + int(8 * scale)), font, x2 - x1 - int(16 * scale), int(16 * scale))
            continue

        dashed = v.style.get('dashed', '0') == '1'
        if dashed:
            draw_dashed_rectangle(draw, (x1, y1, x2, y2))
        else:
            draw.rectangle((x1, y1, x2, y2), outline=(0, 0, 0), width=2)

        # Text
        text = html_to_text(v.value)
        lines = text.split('\n')
        y = y1 + int(8 * scale)
        for idx, line in enumerate(lines):
            font_use = font_bold if (idx == 0) else font
            y = draw_text_wrapped(draw, line, (x1 + int(8 * scale), y), font_use, x2 - x1 - int(16 * scale), int(16 * scale))

    # Draw edges
    for e in edges:
        if e.source not in vertices or e.target not in vertices:
            continue
        a = vertices[e.source]
        b = vertices[e.target]
        sp, tp, orient = choose_connection_points(a, b)
        path = orthogonal_path(sp, tp, orient)
        # scale path
        spx, spy = sx(sp[0]), sy(sp[1])
        tpx, tpy = sx(tp[0]), sy(tp[1])
        scaled = [(sx(x), sy(y)) for (x, y) in path]
        # draw polyline
        draw.line(scaled, fill=(0, 0, 0), width=2)
        # draw cardinality markers
        sdir, tdir = determine_marker_direction(sp, tp)
        start_arrow = e.style.get('startArrow')
        end_arrow = e.style.get('endArrow')
        if start_arrow:
            draw_marker(draw, (spx, spy), sdir, start_arrow)
        if end_arrow:
            draw_marker(draw, (tpx, tpy), tdir, end_arrow)
        # edge label if any
        if e.value:
            label = html_to_text(e.value)
            # place near middle segment
            mx, my = scaled[len(scaled)//2]
            draw.text((mx + 6, my + 6), label, fill=(0, 0, 0), font=font)

    # Save PNG
    img.save(out_path, format='PNG')


def main():
    in_path = sys.argv[1] if len(sys.argv) > 1 else '/workspace/milestone1/eer.drawio'
    out_path = sys.argv[2] if len(sys.argv) > 2 else '/workspace/milestone1/eer.png'
    scale = float(sys.argv[3]) if len(sys.argv) > 3 else 2.0
    render(in_path, out_path, scale)
    print(f'Wrote {out_path}')


if __name__ == '__main__':
    main()

