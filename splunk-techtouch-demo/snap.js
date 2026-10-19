// Usage: node snap.js <html> <outdir> t1 t2 ...  (or "steps" to snap mid-point of every step)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
(async () => {
  const [html, out, ...ts] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', m => console.log('console:', m.text()));
  page.on('pageerror', e => console.log('pageerror:', e.message));
  const [file, query] = html.split('?');
  await page.goto('file://' + path.resolve(file) + (query ? '?' + query : ''));
  const total = await page.evaluate(() => window.DEMO.init());
  console.log('total', total);
  let times = ts;
  if (ts[0] === 'steps') {
    const starts = await page.evaluate(() => window.DEMO.starts);
    times = starts.map((s, i) => ((i + 1 < starts.length ? starts[i + 1] : total) - 0.3).toFixed(2));
    if (ts[1]) times = times.slice(+ts[1], ts[2] ? +ts[2] : undefined);
  }
  for (const t of times) {
    await page.evaluate(t => window.DEMO.seek(+t), t);
    await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(() => 0))]));
    await page.screenshot({ path: `${out}/s_${String(t).padStart(7, '0')}.png` });
  }
  await browser.close();
})();
