// Usage: node record.js <html> <out.mp4> [fps]
// Seeks the page frame by frame and pipes PNGs to ffmpeg; identical frames reuse the last capture.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { spawn } = require('child_process');
const path = require('path');
(async () => {
  const [html, out, fpsArg] = process.argv.slice(2);
  const fps = +(fpsArg || 30);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.log('pageerror:', e.message));
  await page.goto('file://' + path.resolve(html));
  const total = await page.evaluate(() => window.DEMO.init());
  const n = Math.round(total * fps);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-tune', 'stillimage', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const write = buf => new Promise(r => ff.stdin.write(buf) ? r() : ff.stdin.once('drain', r));
  let lastSig = null, lastBuf = null, shots = 0;
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const sig = await page.evaluate(t => window.DEMO.seek(t), i / fps);
    if (sig !== lastSig) {
      await page.evaluate(() => document.fonts.ready);
      lastBuf = await page.screenshot({ type: 'png' });
      lastSig = sig; shots++;
    }
    await write(lastBuf);
    if (i % 300 === 0) console.log(`frame ${i}/${n} captured=${shots} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log(`done frames=${n} unique=${shots} total=${total}s elapsed=${((Date.now() - t0) / 1000).toFixed(0)}s`);
})();
