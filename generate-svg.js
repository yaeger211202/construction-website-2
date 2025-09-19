/* eslint-disable */
const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

function parseStyle(style) {
  const res = {};
  if (!style) return res;
  for (const part of style.split(';')) {
    if (!part) continue;
    const idx = part.indexOf('=');
    if (idx !== -1) res[part.slice(0, idx)] = part.slice(idx + 1);
  }
  return res;
}

function htmlToText(html) {
  if (!html) return '';
  return html
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/<br\s*\/>/g, '\n')
    .replace(/<br>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function chooseConnectionPoints(a, b) {
  const axc = a.x + a.w / 2;
  const ayc = a.y + a.h / 2;
  const bxc = b.x + b.w / 2;
  const byc = b.y + b.h / 2;
  const gap = 30;
  if (b.x >= a.x + a.w + gap) {
    return [{ x: a.x + a.w, y: ayc }, { x: b.x, y: byc }, 'horizontal'];
  } else if (a.x >= b.x + b.w + gap) {
    return [{ x: a.x, y: ayc }, { x: b.x + b.w, y: byc }, 'horizontal'];
  } else if (b.y >= a.y + a.h + gap) {
    return [{ x: axc, y: a.y + a.h }, { x: bxc, y: b.y }, 'vertical'];
  } else {
    return [{ x: axc, y: a.y }, { x: bxc, y: b.y + b.h }, 'vertical'];
  }
}

function orthogonalPath(sp, tp, orientation) {
  const pts = [sp];
  if (orientation === 'horizontal') {
    const mx = (sp.x + tp.x) / 2;
    pts.push({ x: mx, y: sp.y });
    pts.push({ x: mx, y: tp.y });
  } else {
    const my = (sp.y + tp.y) / 2;
    pts.push({ x: sp.x, y: my });
    pts.push({ x: tp.x, y: my });
  }
  pts.push(tp);
  return pts;
}

function markerDirection(sp, tp) {
  if (Math.abs(tp.x - sp.x) > Math.abs(tp.y - sp.y)) {
    return [tp.x > sp.x ? 'right' : 'left', tp.x > sp.x ? 'left' : 'right'];
  }
  return [tp.y > sp.y ? 'down' : 'up', tp.y > sp.y ? 'up' : 'down'];
}

function render(svgWidth, svgHeight, vertices, edges, scale = 1) {
  const defs = `
    <defs>
      <style>
        text { font-family: Arial, Helvetica, sans-serif; font-size: 12px; fill: #000; }
        .bold { font-weight: bold; }
      </style>
    </defs>`;
  const items = [];
  const pad = 20;

  for (const v of vertices) {
    const x = pad + v.x * scale;
    const y = pad + v.y * scale;
    const w = v.w * scale;
    const h = v.h * scale;
    if (v.style.shape === 'note') {
      items.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FFF2B6" stroke="#E5C365" stroke-width="2"/>`);
      const c = 12 * scale;
      items.push(`<polygon points="${x + w - c},${y} ${x + w - c},${y + c} ${x + w},${y + c}" fill="#ffffff" stroke="#E5C365"/>`);
      const lines = htmlToText(v.value).split('\n');
      let ty = y + 10 * scale;
      for (const line of lines) {
        items.push(`<text x="${x + 8 * scale}" y="${ty}" >${line.replace(/&/g, '&amp;')}</text>`);
        ty += 16 * scale;
      }
      continue;
    }
    const dashed = v.style.dashed === '1';
    const dashAttr = dashed ? ' stroke-dasharray="6,6"' : '';
    items.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff" stroke="#000000" stroke-width="2"${dashAttr}/>\n`);
    const lines = htmlToText(v.value).split('\n');
    let ty = y + 14 * scale;
    for (let i = 0; i < lines.length; i++) {
      const cls = i === 0 ? ' class="bold"' : '';
      items.push(`<text x="${x + 8 * scale}" y="${ty}"${cls}>${lines[i].replace(/&/g, '&amp;')}</text>`);
      ty += 16 * scale;
    }
  }

  function drawMarker(pt, dir, kind) {
    const x = pad + pt.x * scale;
    const y = pad + pt.y * scale;
    const size = 10 * scale;
    if (kind === 'ERone') {
      if (dir === 'left' || dir === 'right') return `<line x1="${x}" y1="${y - 8 * scale}" x2="${x}" y2="${y + 8 * scale}" stroke="#000" stroke-width="2"/>`;
      return `<line x1="${x - 8 * scale}" y1="${y}" x2="${x + 8 * scale}" y2="${y}" stroke="#000" stroke-width="2"/>`;
    }
    if (kind === 'ERzero') {
      return `<circle cx="${x}" cy="${y}" r="${6 * scale}" fill="none" stroke="#000" stroke-width="2"/>`;
    }
    if (kind === 'ERmany') {
      if (dir === 'left' || dir === 'right') {
        const dx = dir === 'left' ? -1 : 1;
        return `<g stroke="#000" stroke-width="2" fill="none">
          <line x1="${x}" y1="${y - 8 * scale}" x2="${x + dx * size}" y2="${y}" />
          <line x1="${x}" y1="${y + 8 * scale}" x2="${x + dx * size}" y2="${y}" />
          <line x1="${x}" y1="${y}" x2="${x + dx * size}" y2="${y}" />
        </g>`;
      } else {
        const dy = dir === 'up' ? -1 : 1;
        return `<g stroke="#000" stroke-width="2" fill="none">
          <line x1="${x - 8 * scale}" y1="${y}" x2="${x}" y2="${y + dy * size}" />
          <line x1="${x + 8 * scale}" y1="${y}" x2="${x}" y2="${y + dy * size}" />
          <line x1="${x}" y1="${y}" x2="${x}" y2="${y + dy * size}" />
        </g>`;
      }
    }
    return '';
  }

  for (const e of edges) {
    const a = vertices.find(v => v.id === e.source);
    const b = vertices.find(v => v.id === e.target);
    if (!a || !b) continue;
    const [sp, tp, orient] = chooseConnectionPoints(a, b);
    const pts = orthogonalPath(sp, tp, orient);
    const scaledPts = pts.map(p => `${pad + p.x * scale},${pad + p.y * scale}`).join(' ');
    items.push(`<polyline points="${scaledPts}" fill="none" stroke="#000000" stroke-width="2"/>`);
    const [sdir, tdir] = markerDirection(sp, tp);
    if (e.startArrow) items.push(drawMarker(sp, sdir, e.startArrow));
    if (e.endArrow) items.push(drawMarker(tp, tdir, e.endArrow));
    if (e.value) {
      const mid = pts[Math.floor(pts.length / 2)];
      items.push(`<text x="${pad + mid.x * scale + 6}" y="${pad + mid.y * scale + 6}">${htmlToText(e.value).replace(/&/g,'&amp;')}</text>`);
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
    ${defs}
    ${items.join('\n')}
  </svg>`;
}

function main() {
  const inPath = process.argv[2] || path.resolve(__dirname, 'milestone1/eer.drawio');
  const outSvg = process.argv[3] || path.resolve(__dirname, 'milestone1/eer.svg');
  const scale = Number(process.argv[4] || '1');
  const xml = fs.readFileSync(inPath, 'utf8');
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const json = parser.parse(xml);
  const mgm = json.mxfile.diagram.mxGraphModel;
  const root = mgm.root;
  const cells = Array.isArray(root.mxCell) ? root.mxCell : [root.mxCell];
  const vertices = [];
  const edges = [];
  let maxX = 0, maxY = 0;
  for (const cell of cells) {
    if (!cell || !cell.id) continue;
    if (cell.vertex === '1') {
      const g = cell.mxGeometry || (cell['mxGeometry'] || {});
      const x = Number(g.x || 0), y = Number(g.y || 0), w = Number(g.width || 160), h = Number(g.height || 100);
      vertices.push({ id: cell.id, x, y, w, h, value: cell.value || '', style: parseStyle(cell.style || '') });
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    } else if (cell.edge === '1') {
      edges.push({ id: cell.id, source: cell.source, target: cell.target, value: cell.value || '', ...{ startArrow: parseStyle(cell.style || '').startArrow, endArrow: parseStyle(cell.style || '').endArrow } });
    }
  }

  const pad = 80;
  const width = Math.max(1800, Math.ceil((maxX + pad)));
  const height = Math.max(1200, Math.ceil((maxY + pad)));
  const svg = render(width, height, vertices, edges, 1);
  fs.writeFileSync(outSvg, svg, 'utf8');
  console.log('Wrote', outSvg);
}

main();

