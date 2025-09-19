/* eslint-disable */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtml(xml) {
  const data = { xml, highlight: '#0000ff', nav: false, resize: true, toolbar: '', border: 0 };
  const dataAttr = escapeHtml(JSON.stringify(data));
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>draw.io export viewer</title>
  <style>
    html, body { margin: 0; padding: 0; background: #ffffff; }
    #root { padding: 20px; }
    .mxgraph { border: 0; max-width: none; }
  </style>
  <script>
    // Ensure high DPI rendering
    (function(){
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      document.cookie = 'mxgraph-dpi=' + dpr;
    })();
  </script>
  <script src="https://app.diagrams.net/js/viewer-static.min.js"></script>
  </head>
<body>
  <div id="root">
    <div id="mx" class="mxgraph" data-mxgraph='${dataAttr}'></div>
  </div>
</body>
</html>`;
}

async function exportPng(xmlPath, outPath, scale = 3) {
  const xml = fs.readFileSync(xmlPath, 'utf8');
  const html = buildHtml(xml);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 2400, height: 1600, deviceScaleFactor: scale });
    await page.setContent(html, { waitUntil: 'networkidle2' });
    await page.waitForSelector('svg', { timeout: 20000 });
    // Give viewer a moment to finalize layout
    await page.waitForTimeout(1000);
    const clip = await page.evaluate(() => {
      const svg = document.querySelector('svg');
      const rect = svg.getBoundingClientRect();
      return { x: Math.max(0, rect.x - 10), y: Math.max(0, rect.y - 10), width: rect.width + 20, height: rect.height + 20 };
    });
    await page.screenshot({ path: outPath, clip, type: 'png' });
    console.log('Exported to', outPath);
  } finally {
    await browser.close();
  }
}

async function main() {
  const xmlPath = process.argv[2] || path.resolve(__dirname, 'milestone1/eer.drawio');
  const outPath = process.argv[3] || path.resolve(__dirname, 'milestone1/eer.png');
  const scale = Number(process.argv[4] || '3');
  await exportPng(xmlPath, outPath, scale);
}

main().catch((err) => {
  console.error(err.stack || String(err));
  process.exit(1);
});

