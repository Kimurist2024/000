// スライド用に、デモ動画の場面を字幕・カーソルなしで切り出す（node slides/capture.js）
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
const SHOTS = [
  ['ch1_service_analyzer.jpg', 70],   // 第1章 Service Analyzer（悪化しているKPI）
  ['ch2_episode_review.jpg', 128],    // 第2章 Episode Review（優先度の基準）
  ['ch2_aihub_notice.jpg', 159],      // 第2章 AI Hub（一次連絡文の下書き）
  ['ch3_real_aihub.jpg', 224],        // 第3章 実画面＋AI Hub（結果の読み方）
];
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  await p.goto('file://' + path.resolve(__dirname, '..', 'demo.html'));
  await p.evaluate(() => window.DEMO.init());
  for (const [f, t] of SHOTS) {
    await p.evaluate((t) => { window.DEMO.seek(t); for (const id of ['cap', 'cursor', 'rip']) document.getElementById(id).style.display = 'none'; }, t);
    await p.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images].map((i) => i.decode().catch(() => 0))]));
    await p.screenshot({ path: path.join(__dirname, 'img', f), type: 'jpeg', quality: 90, clip: { x: 30, y: 214, width: 1860, height: 740 } });
    console.log('saved', f);
  }
  await b.close();
})();
