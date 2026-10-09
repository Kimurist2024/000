// 動作確認: node demo/src/test_demo.js（Playwright と Chromium が要る。require のパスは環境に合わせる）
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const OUT = process.env.SHOTS_DIR || (__dirname + '/shots');
const URL = 'file://' + require('path').resolve(__dirname, '..', 'index.html');
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const errors = [], R = [];
  async function page(w, h, scheme, hash = '') {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
    const p = await ctx.newPage();
    p.on('console', m => { if (m.type() === 'error') errors.push(`[${w}] ${m.text()}`); });
    p.on('pageerror', e => errors.push(`[${w}] pageerror ${e.message}`));
    await p.goto(URL + hash); return p;
  }
  const ov = async (p, tag) => { const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); if (o > 0) errors.push(`overflow ${tag}: ${o}`); };
  const st = (p) => p.evaluate(() => ({
    hash: location.hash,
    now: ((document.querySelector('.overlay .steps li.now') || {}).textContent) || '(none)',
    done: document.querySelectorAll('.overlay .steps li.done').length,
    next: (document.querySelector('#panel-next') || {}).textContent,
    balloon: ((document.querySelector('.balloon') || {}).textContent) || '(none)',
    alert: ((document.querySelector('.overlay .alert') || {}).textContent) || '',
    info: ((document.querySelector('.overlay .info') || {}).textContent) || '',
    app: (document.querySelector('.app-name') || {}).textContent || '(intra)'
  }));
  const shot = (p, n) => p.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
  const expect = (cond, msg) => { if (!cond) errors.push('EXPECT ' + msg); };
  const click = (p, id) => p.click(`[data-id="${id}"]`);
  const pick = (p, id, v) => p.selectOption(`select[data-id="${id}"]`, v);
  const type = async (p, id, v) => { await p.fill(`input[data-id="${id}"]`, v); await p.press(`input[data-id="${id}"]`, 'Enter'); };
  const tip = (p, k) => p.click(`.tt-q[data-tip="${k}"]`);
  const next = (p) => p.click('#panel-next');

  let p = await page(1440, 900, 'light', '#s1');
  // ---- S0
  let s = await st(p); expect(s.next === '依頼カードを開く', 's0 start label ' + s.next); R.push(['s0', s]);
  await shot(p, 's0-0');
  await click(p, 'i-card'); s = await st(p); expect(s.now.includes('依頼カード'), 's0 step1');
  await click(p, 'i-flow'); s = await st(p); expect(s.now.includes('従来の流れ'), 's0 step2'); expect(s.balloon.includes('委託先'), 's0 balloon2');
  await shot(p, 's0-2');
  await click(p, 'i-goal'); s = await st(p); expect(s.now.includes('成果物'), 's0 step3');
  await next(p); s = await st(p); expect(s.next === 'S1へ進む（Before）', 's0 done ' + s.next);
  await next(p);
  // ---- S1
  s = await st(p); expect(s.hash === '#s2', 's1 hash'); await click(p, 'i-req'); s = await st(p); expect(s.now.includes('依頼文'), 's1 step1');
  await click(p, 'i-open-splunk'); s = await st(p); expect(s.now.includes('既存のダッシュボード'), 's1 step2'); expect(s.app.includes('Search'), 's1 app');
  await shot(p, 's1-2');
  await next(p); s = await st(p); expect(s.now.includes('不十分な検索'), 's1 step3');
  await click(p, 'sp-run'); s = await st(p); expect(s.now.includes('ケースC'), 's1 step4'); expect(await p.isVisible('#res-row-C'), 's1 row C');
  await shot(p, 's1-4');
  await next(p); s = await st(p); expect(s.now.includes('チケット'), 's1 step5'); expect(await p.isVisible('#i-ticket'), 's1 ticket');
  await next(p); s = await st(p); expect(s.next === 'S2へ進む（要件整理）', 's1 done');
  await next(p);
  // ---- S2
  s = await st(p); expect(s.hash === '#s3', 's2 hash'); expect(await p.isVisible('#chip-soc'), 's2 chip');
  await click(p, 'chip-soc'); s = await st(p); expect(s.now.includes('日本語'), 's2 step1'); expect(await p.isVisible('#hub-in'), 's2 hub open');
  await shot(p, 's2-1');
  await click(p, 'hub-fill'); s = await st(p); expect(s.now.includes('AI Hubに送'), 's2 step2');
  await click(p, 'hub-send'); s = await st(p); expect(s.now.includes('整理された要件'), 's2 step3'); expect(await p.isVisible('#hub-req'), 's2 req');
  await shot(p, 's2-3');
  await next(p); s = await st(p); expect(s.now.includes('コピー'), 's2 step4');
  await click(p, 'hub-copy'); s = await st(p); expect(s.next === 'S3へ進む（SPL生成・確認）', 's2 done ' + s.next);
  await next(p);
  // ---- S3
  s = await st(p); expect(s.hash === '#s4', 's3 hash'); await click(p, 'g-start'); s = await st(p); expect(s.now.includes('貼る'), 's3 step1');
  await click(p, 'as-paste'); s = await st(p); expect(s.now.includes('生成'), 's3 step2');
  await click(p, 'as-send'); s = await st(p); expect(s.now.includes('照合'), 's3 step3'); expect(await p.isVisible('#as-insert'), 's3 insert1');
  await click(p, 'as-insert'); s = await st(p); expect(s.alert.includes('照合の前'), 's3 input check ' + s.alert);
  await shot(p, 's3-3wrong');
  await click(p, 'hub-check'); s = await st(p); expect(s.now.includes('修正依頼'), 's3 step4'); expect(await p.isVisible('#hub-copy-fix'), 's3 fix btn');
  await shot(p, 's3-4');
  await click(p, 'hub-copy-fix'); s = await st(p); expect(s.balloon.includes('送信'), 's3 step4b ' + s.balloon);
  await click(p, 'as-send'); s = await st(p); expect(s.now.includes('検索に入れて'), 's3 step5'); expect(await p.isVisible('#as-insert2'), 's3 insert2');
  await click(p, 'as-insert2'); s = await st(p); expect(s.balloon.includes('実行'), 's3 step5b');
  await click(p, 'sp-run'); s = await st(p); expect(s.next === 'S4へ進む（データ検証）', 's3 done ' + s.next); expect(await p.isVisible('#res-row-A'), 's3 row A');
  await shot(p, 's3-done');
  await next(p);
  // ---- S4
  s = await st(p); expect(s.hash === '#s5', 's4 hash'); await click(p, 'g-start'); s = await st(p); expect(s.balloon.includes('レポート'), 's4 step1 ' + s.balloon);
  await click(p, 'nav-reports'); s = await st(p); expect(s.balloon.includes('Q1'), 's4 step1b ' + s.balloon);
  await click(p, 'rep-q2'); s = await st(p); expect(s.alert.includes('順番'), 's4 wrong order');
  await shot(p, 's4-wrong');
  await click(p, 'rep-q1'); s = await st(p); expect(s.balloon.includes('実行') || s.balloon.includes('ガイドの順'), 's4 q1 open ' + s.balloon);
  await click(p, 'sp-run'); s = await st(p); expect(s.now.includes('Q2'), 's4 step2');
  await shot(p, 's4-q1');
  for (const k of ['q2', 'q3', 'q4']) { await click(p, 'nav-reports'); await click(p, 'rep-' + k); await click(p, 'sp-run'); }
  s = await st(p); expect(s.next === 'S5へ進む（可視化）', 's4 done ' + s.next); expect(await p.isVisible('.c-line.ok'), 's4 q4 chart');
  await shot(p, 's4-done');
  await next(p);
  // ---- S5
  s = await st(p); expect(s.hash === '#s6', 's5 hash'); await click(p, 'g-start'); s = await st(p); expect(s.balloon.includes('新規'), 's5 step1');
  await click(p, 'db-new'); expect(await p.isVisible('.sp-modal'), 's5 dialog');
  await type(p, 'db-name', 'SOCダッシュボード'); s = await st(p); expect(s.alert.includes('命名規則') || s.alert.includes('チーム_対象_用途'), 's5 name check ' + s.alert);
  await shot(p, 's5-namewrong');
  await type(p, 'db-name', 'A社_SOC認証監視_デモ'); s = await st(p); expect(s.balloon.includes('作成'), 's5 name ok ' + s.balloon);
  await click(p, 'db-create'); s = await st(p); expect(s.now.includes('Q1'), 's5 step2');
  await pick(p, 'ds', 'q2'); s = await st(p); expect(s.alert.includes('順番'), 's5 ds wrong');
  await pick(p, 'ds', 'q1'); await pick(p, 'viz', 'table'); s = await st(p); expect(s.alert.includes('棒グラフ'), 's5 viz wrong');
  await pick(p, 'viz', 'bar'); await click(p, 'db-add'); s = await st(p); expect(s.now.includes('Q2'), 's5 step3');
  await shot(p, 's5-3');
  await pick(p, 'ds', 'q2'); await pick(p, 'viz', 'table'); await click(p, 'db-add');
  await pick(p, 'ds', 'q3'); await pick(p, 'viz', 'table'); await click(p, 'db-add');
  await pick(p, 'ds', 'q4'); await pick(p, 'viz', 'line'); await click(p, 'db-add'); s = await st(p); expect(s.now.includes('共有範囲'), 's5 step6 ' + s.now);
  await pick(p, 'db-share', 'me'); s = await st(p); expect(s.alert.includes('自分だけ'), 's5 share wrong');
  await shot(p, 's5-sharewrong');
  await pick(p, 'db-share', 'team'); await click(p, 'db-save'); s = await st(p); expect(s.next === 'S6へ進む（検知）', 's5 done ' + s.next);
  await shot(p, 's5-done');
  await next(p);
  // ---- S6
  s = await st(p); expect(s.hash === '#s7', 's6 hash'); await click(p, 'g-start'); s = await st(p); expect(s.app.includes('Security'), 's6 app');
  await click(p, 'sse-item-other1'); s = await st(p); expect(s.info.includes('Password Spray'), 's6 other info');
  await click(p, 'sse-item-ps'); s = await st(p); expect(s.balloon.includes('Known False'), 's6 kfp balloon ' + s.balloon);
  await shot(p, 's6-1');
  await click(p, 'sse-kfp'); s = await st(p); expect(s.now.includes('ツールチップ'), 's6 step2');
  await tip(p, 'std'); s = await st(p); expect(await p.isVisible('.tt-tip'), 's6 tip'); expect(s.now.includes('本番用'), 's6 step3');
  await shot(p, 's6-2');
  await next(p); s = await st(p); expect(s.app.includes('Search'), 's6 search'); expect(s.balloon.includes('名前を付けて保存'), 's6 step4 ' + s.balloon);
  await click(p, 'sp-saveas'); s = await st(p); expect(await p.isVisible('#sa-alert'), 's6 menu');
  await click(p, 'sa-report'); s = await st(p); expect(s.alert.includes('アラート'), 's6 wrong menu');
  await click(p, 'sa-alert'); s = await st(p); expect(await p.isVisible('.sp-modal'), 's6 dialog'); expect(s.now.includes('名前と実行'), 's6 step5');
  await type(p, 'al-name', 'SOC_認証_失敗後の特権成功'); await pick(p, 'al-sched', 'rt'); s = await st(p); expect(s.alert.includes('リアルタイム'), 's6 rt check');
  await shot(p, 's6-rtwrong');
  await pick(p, 'al-sched', '15m'); s = await st(p); expect(s.now.includes('抑制'), 's6 step6');
  await pick(p, 'al-throttle', 'none'); s = await st(p); expect(s.alert.includes('抑制が空'), 's6 throttle check');
  await pick(p, 'al-throttle', '60src'); await pick(p, 'al-to', 'me'); s = await st(p); expect(s.alert.includes('個人'), 's6 to check');
  await pick(p, 'al-to', 'soc'); s = await st(p); expect(s.now.includes('トリガーされたアラートに追加'), 's6 step7');
  await click(p, 'al-save'); s = await st(p); expect(s.alert.includes('先に付け'), 's6 save early');
  await pick(p, 'al-add', 'yes'); await shot(p, 's6-7'); await click(p, 'al-save'); s = await st(p); expect(s.next === 'S7へ進む（一次調査）', 's6 done ' + s.next);
  await next(p);
  // ---- S7
  s = await st(p); expect(s.hash === '#s8', 's7 hash'); await click(p, 'g-start'); s = await st(p); expect(s.balloon.includes('トリガーされたアラート'), 's7 step1');
  await click(p, 'act-row-a'); s = await st(p); expect(s.now.includes('AI Hub'), 's7 step2'); expect(await p.isVisible('#hub-p3'), 's7 chip');
  await click(p, 'hub-p3'); s = await st(p); expect(s.now.includes('チェックリスト'), 's7 step3');
  await shot(p, 's7-3');
  await click(p, 'ck-handoff'); s = await st(p); expect(s.alert.includes('空の項目'), 's7 handoff early ' + s.alert);
  await pick(p, 'ck1', 'done'); s = await st(p); expect(s.balloon.includes('空の項目'), 's7 partial ' + s.balloon);
  await click(p, 'ck-fill'); s = await st(p); expect(s.now.includes('追加検索'), 's7 step4 ' + s.now);
  await click(p, 'hub-copy-spl'); s = await st(p); expect(s.now.includes('引き継ぐ'), 's7 step5'); expect(await p.isVisible('.assist'), 's7 assist');
  await shot(p, 's7-5');
  await click(p, 'ck-handoff'); s = await st(p); expect(s.next === 'S8へ進む（記録・改善）', 's7 done ' + s.next);
  await next(p);
  // ---- S8
  s = await st(p); expect(s.hash === '#s9', 's8 hash'); await click(p, 'g-start'); s = await st(p); expect(s.balloon.includes('事象'), 's8 step1 ' + s.balloon);
  await click(p, 'rec-save'); s = await st(p); expect(s.alert.includes('空の項目'), 's8 save early');
  await type(p, 'r1', '事象の例'); s = await st(p); expect(s.balloon.includes('確認済み'), 's8 next field ' + s.balloon);
  await click(p, 'rec-fill'); s = await st(p); expect(s.now.includes('保存'), 's8 step2');
  await click(p, 'rec-save'); s = await st(p); expect(s.now.includes('改善候補'), 's8 step3'); expect(await p.isVisible('#hub-p4'), 's8 chip');
  await click(p, 'hub-p4'); s = await st(p); expect(s.now.includes('チケット'), 's8 step4');
  await shot(p, 's8-4');
  await click(p, 'imp-ticket'); s = await st(p); expect(s.next === '振り返りへ', 's8 done ' + s.next);
  await shot(p, 's8-done');
  await next(p);
  // ---- 振り返り
  s = await st(p); expect(s.hash === '#s10', 'summary hash ' + s.hash); expect(await p.isVisible('.summary'), 'summary');
  const stats = await p.$$eval('.stat b', els => els.map(e => e.textContent)); R.push(['stats', stats]);
  expect(+stats[0] > 20 && +stats[1] >= 10 && +stats[2] >= 1, 'stats ' + stats.join('/'));
  await shot(p, 's9-summary');
  await ov(p, '1440');
  // keys
  await p.keyboard.press('3'); s = await st(p); expect(s.hash === '#s3', 'key 3');
  await p.keyboard.press('0'); s = await st(p); expect(s.hash === '#s10', 'key 0');
  await p.keyboard.press('ArrowRight'); s = await st(p); expect(s.hash === '#s1', 'summary next');
  // dark + widths
  for (const [w, h, scheme, hash] of [[1366, 800, 'dark', '#s4'], [1000, 800, 'light', '#s6'], [400, 800, 'light', '#s7']]) {
    const q = await page(w, h, scheme, hash);
    await q.click('[data-id="g-start"]'); await ov(q, `${w} ${hash}`); await shot(q, `w${w}`);
    if (hash === '#s6') { await q.click('[data-id="db-new"]'); await ov(q, `${w} dialog`); await shot(q, `w${w}-dialog`); }
    await q.context().close();
  }
  console.log(JSON.stringify(R, null, 1));
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'ALL OK');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
