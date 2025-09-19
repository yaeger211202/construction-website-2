/* eslint-disable */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function exportPng(xmlPath, outPath, scale = 3) {
  const xml = fs.readFileSync(xmlPath, 'utf8');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage'
    ]
  });
  try {
    const page = await browser.newPage();
    // Use the diagrams.net embed export page and wait for App to initialize
    await page.goto('https://app.diagrams.net/?embed=1&ui=min&spin=1', { waitUntil: 'networkidle2' });
    await page.waitForFunction('window.App && window.App.editor && window.mxUtils', { timeout: 15000 });
    // inject xml and request export via client API
    const b64 = await page.evaluate((xmlContent, scaleFactor) => {
      return new Promise((resolve, reject) => {
        try {
          const app = window.App;
          if (!app || !app.editor || !window.mxUtils) {
            reject(new Error('Editor not ready'));
            return;
          }
          // Open graph from XML
          app.editor.setGraphXml(mxUtils.parseXml(xmlContent).documentElement);
          // Export to PNG using built-in export
          const svgXml = mxUtils.getXml(app.editor.graph.getSvg());
          const canvas = document.createElement('canvas');
          const img = new Image();
          img.onload = function() {
            canvas.width = Math.ceil(img.width * scaleFactor);
            canvas.height = Math.ceil(img.height * scaleFactor);
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.setTransform(scaleFactor, 0, 0, scaleFactor, 0, 0);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, img.width, img.height);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png').split(',')[1]);
          };
          img.onerror = reject;
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgXml);
        } catch (e) { reject(e); }
      });
    }, xml, scale);
    if (!b64) throw new Error('Failed to capture PNG base64');
    const buf = Buffer.from(b64, 'base64');
    fs.writeFileSync(outPath, buf);
  } finally {
    await browser.close();
  }
}

async function main() {
  const xmlPath = process.argv[2] || path.resolve(__dirname, 'milestone1/eer.drawio');
  const outPath = process.argv[3] || path.resolve(__dirname, 'milestone1/eer.png');
  const scale = Number(process.argv[4] || '3');
  await exportPng(xmlPath, outPath, scale);
  console.log('Exported to', outPath);
}

main().catch((err) => {
  console.error(err.stack || String(err));
  process.exit(1);
});

