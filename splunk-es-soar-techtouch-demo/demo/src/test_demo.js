// 動作確認: node test_demo.js（Playwright と Chromium が要る。require のパスは環境に合わせる）
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const OUT = process.env.SHOTS_DIR || (__dirname + '/shots');
const URL = 'file://' + (process.env.DEMO_HTML || require('path').resolve(__dirname, '..', 'index.html'));
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const errors = [], R = [];
  async function page(w, h, scheme, hash = '') {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, locale: 'ja-JP' });
    const p = await ctx.newPage();
    p.on('console', m => { if (m.type() === 'error') errors.push(`[${w}] ${m.text().slice(0, 200)}`); });
    p.on('pageerror', e => errors.push(`[${w}] pageerror ${e.message.slice(0, 200)}`));
    await p.goto(URL + hash); await p.waitForTimeout(300); return p;
  }
  const ov = async (p, tag) => { const o = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); if (o > 0) errors.push(`overflow ${tag}: ${o}`); };
  const st = (p) => p.evaluate(() => ({
    hash: location.hash,
    now: ((document.querySelector('.overlay .steps li.now') || {}).textContent) || '(none)',
    next: (document.querySelector('#panel-next') || {}).textContent,
    balloon: ((document.querySelector('#tt-balloon') || {}).textContent) || '(none)', hidden: (document.querySelector('#tt-layer') || {}).hidden,
    alert: ((document.querySelector('.overlay .alert') || {}).textContent) || '',
    info: ((document.querySelector('.overlay .info') || {}).textContent) || '',
    app: (document.querySelector('.app-name') || {}).textContent || '(other)',
    title: (document.querySelector('#win-title') || {}).textContent || ''
  }));
  const shot = (p, n) => p.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
  const expect = (cond, msg) => { if (!cond) errors.push('EXPECT ' + msg); };
  const click = async (p, id) => { await p.locator(`#${id}, [data-id="${id}"]`).first().click(); await p.waitForTimeout(80); };
  const pick = async (p, id, label) => { await p.click(`#f-${id} button`); await p.locator('[role="option"], [role="menuitemcheckbox"]').filter({ hasText: label }).first().click(); await p.waitForTimeout(80); };
  const type = async (p, id, v) => { const inp = p.locator(`#f-${id} input`); await inp.fill(v); await inp.press('Enter'); await p.waitForTimeout(80); };
  const tip = (p, k) => p.click(`.tt-q[data-tip="${k}"]`);
  const next = async (p) => { await p.click('#panel-next'); await p.waitForTimeout(80); };

  let p = await page(1440, 900, 'light', '#s1');
  try {
  // ---- S0
  let s = await st(p); expect(s.next === '依頼カードを開く', 's0 start label ' + s.next); R.push(['s0', s]);
  await shot(p, 's0-0');
  await click(p, 'i-card'); s = await st(p); expect(s.now.includes('依頼カード'), 's0 step1');
  await click(p, 'i-flow'); s = await st(p); expect(s.now.includes('従来の流れ'), 's0 step2'); expect(s.balloon.includes('委託先'), 's0 balloon2 ' + s.balloon);
  await click(p, 'i-goal'); s = await st(p); expect(s.now.includes('成果物'), 's0 step3');
  await next(p); s = await st(p); expect(s.next === 'S1へ進む（Before）', 's0 done ' + s.next);
  await next(p);
  // ---- S1
  s = await st(p); expect(s.hash === '#s2', 's1 hash'); expect(s.app.includes('Enterprise Security'), 's1 app ' + s.app); expect(s.title.includes('Enterprise Security'), 's1 title ' + s.title);
  await shot(p, 's1-0');
  await click(p, 'ir-row-ueba'); s = await st(p); expect(s.now.includes('ノータブルを開く'), 's1 step1 ' + s.now);
  await click(p, 'ir-row-ueba'); s = await st(p); expect(s.now.includes('UEBA'), 's1 step2 ' + s.now); expect(await p.isVisible('#ir-anom'), 's1 anomalies');
  await p.waitForTimeout(500); await shot(p, 's1-2');
  await next(p); s = await st(p); expect(s.now.includes('チケット'), 's1 step3'); expect(await p.isVisible('#i-ticket'), 's1 ticket');
  await next(p); s = await st(p); expect(s.now.includes('件数だけ'), 's1 step4 ' + s.now);
  await click(p, 'sp-run'); s = await st(p); expect(s.next === 'S2へ進む（要件整理）', 's1 done ' + s.next); expect(await p.isVisible('#res-row-B'), 's1 row B'); expect(await p.isVisible('#res-row-D'), 's1 row D');
  await shot(p, 's1-4');
  await next(p);
  // ---- S2
  s = await st(p); expect(s.hash === '#s3', 's2 hash'); expect(await p.isVisible('#chip-soc'), 's2 chip');
  await click(p, 'chip-soc'); s = await st(p); expect(s.now.includes('日本語'), 's2 step1'); expect(await p.isVisible('#hub-in'), 's2 hub open');
  await click(p, 'hub-fill'); s = await st(p); expect(s.now.includes('AI Hubに送'), 's2 step2');
  await click(p, 'hub-send'); s = await st(p); expect(s.now.includes('整理された要件'), 's2 step3'); expect(await p.isVisible('#hub-req'), 's2 req');
  await shot(p, 's2-3');
  await next(p); s = await st(p); expect(s.now.includes('コピー'), 's2 step4');
  await click(p, 'hub-copy'); s = await st(p); expect(s.next === 'S3へ進む（相関検索案・照合）', 's2 done ' + s.next);
  await next(p);
  // ---- S3
  s = await st(p); expect(s.hash === '#s4', 's3 hash'); await click(p, 'g-start'); s = await st(p); expect(s.now.includes('貼る'), 's3 step1');
  await click(p, 'as-paste'); s = await st(p); expect(s.now.includes('生成'), 's3 step2');
  await click(p, 'as-send'); s = await st(p); expect(s.now.includes('照合'), 's3 step3'); expect(await p.isVisible('#as-insert'), 's3 insert1');
  await click(p, 'as-insert'); s = await st(p); expect(s.alert.includes('照合の前'), 's3 input check ' + s.alert);
  await click(p, 'hub-check'); s = await st(p); expect(s.now.includes('修正依頼'), 's3 step4'); expect(await p.isVisible('#hub-copy-fix'), 's3 fix btn');
  await shot(p, 's3-4');
  await click(p, 'hub-copy-fix'); s = await st(p); expect(s.balloon.includes('送信'), 's3 step4b ' + s.balloon);
  await click(p, 'as-send'); s = await st(p); expect(s.now.includes('検索に入れて'), 's3 step5'); expect(await p.isVisible('#as-insert2'), 's3 insert2');
  await click(p, 'as-insert2'); s = await st(p); expect(s.balloon.includes('実行'), 's3 step5b');
  await click(p, 'sp-run'); s = await st(p); expect(s.next === 'S4へ進む（検証・相関検索の保存）', 's3 done ' + s.next); expect(await p.isVisible('#res-row-A'), 's3 row A');
  await shot(p, 's3-done');
  await next(p);
  // ---- S4
  s = await st(p); expect(s.hash === '#s5', 's4 hash'); await click(p, 'g-start'); s = await st(p); expect(s.balloon.includes('Content Management'), 's4 step1 ' + s.balloon);
  await click(p, 'nav-cm'); s = await st(p); expect(s.balloon.includes('Q1'), 's4 step1b ' + s.balloon);
  await click(p, 'rep-q2'); s = await st(p); expect(s.alert.includes('順番'), 's4 wrong order ' + s.alert);
  await shot(p, 's4-wrong');
  await click(p, 'rep-q1'); s = await st(p); expect(s.balloon.includes('実行'), 's4 q1 open ' + s.balloon);
  await click(p, 'sp-run'); s = await st(p); expect(s.now.includes('Q2'), 's4 step2 ' + s.now); expect(await p.isVisible('#res-row-C'), 's4 q1 row C');
  await shot(p, 's4-q1');
  for (const k of ['q2', 'q3']) { await click(p, 'nav-cm'); await click(p, 'rep-' + k); await click(p, 'sp-run'); }
  s = await st(p); expect(s.now.includes('相関検索の作成'), 's4 step4 ' + s.now); expect(await p.isVisible('#res-row-A'), 's4 q3 row A');
  await click(p, 'nav-cm'); s = await st(p); expect(s.balloon.includes('新規コンテンツ'), 's4 cm ' + s.balloon);
  await click(p, 'cm-new'); await p.waitForTimeout(150); expect(await p.locator('[role="menuitem"]').filter({ hasText: '相関検索' }).count() > 0, 's4 menu open');
  await p.locator('[role="menuitem"]').filter({ hasText: '保存済み検索' }).first().click(); await p.waitForTimeout(100); s = await st(p); expect(s.alert.includes('相関検索'), 's4 wrong menu ' + s.alert);
  await click(p, 'cm-new'); await p.waitForTimeout(150); await p.locator('[role="menuitem"]').filter({ hasText: '相関検索' }).first().click(); await p.waitForTimeout(150);
  s = await st(p); expect(await p.isVisible('.sp-dialog'), 's4 dialog'); expect(s.now.includes('名前と実行間隔'), 's4 step5 ' + s.now);
  await type(p, 'cs-name', '異常参照'); s = await st(p); expect(s.alert.includes('SOC_対象_用途'), 's4 name check ' + s.alert);
  await type(p, 'cs-name', 'SOC_人事_異常参照_D-02'); await pick(p, 'cs-sched', 'リアルタイム'); s = await st(p); expect(s.alert.includes('リアルタイム'), 's4 rt check ' + s.alert);
  await shot(p, 's4-rtwrong');
  await pick(p, 'cs-sched', '15分ごと'); s = await st(p); expect(s.now.includes('リスク'), 's4 step6 ' + s.now);
  await pick(p, 'cs-risk', 'リスクスコア 50'); s = await st(p); expect(s.alert.includes('80'), 's4 risk check ' + s.alert);
  await pick(p, 'cs-risk', 'リスクスコア 80'); await pick(p, 'cs-urg', '緊急度：中'); s = await st(p); expect(s.alert.includes('高'), 's4 urg check ' + s.alert);
  await pick(p, 'cs-urg', '緊急度：高'); await pick(p, 'cs-throttle', '抑制しない'); s = await st(p); expect(s.alert.includes('抑制が空'), 's4 throttle check ' + s.alert);
  await pick(p, 'cs-throttle', '同じ user で60分'); s = await st(p); expect(s.balloon.includes('保存'), 's4 save balloon ' + s.balloon);
  await shot(p, 's4-dialog');
  await click(p, 'cs-save'); s = await st(p); expect(s.next === 'S5へ進む（一次対応）', 's4 done ' + s.next);
  await shot(p, 's4-done');
  await next(p);
  // ---- S5
  s = await st(p); expect(s.hash === '#s6', 's5 hash'); await click(p, 'g-start'); s = await st(p); expect(s.balloon.includes('D-02'), 's5 step1 ' + s.balloon);
  await click(p, 'ir-row-d02'); s = await st(p); expect(s.now.includes('担当者'), 's5 step2 ' + s.now); expect(await p.isVisible('#ir-own'), 's5 own btn');
  await p.waitForTimeout(500); await shot(p, 's5-1');
  await click(p, 'ir-own'); s = await st(p); expect(s.now.includes('AI Hub'), 's5 step3 ' + s.now); expect(await p.isVisible('#hub-p3'), 's5 chip');
  await click(p, 'hub-p3'); s = await st(p); expect(s.now.includes('人事部'), 's5 step4 ' + s.now); expect(await p.isVisible('#hub-ask-hr'), 's5 ask btn');
  await click(p, 'hub-ask-hr'); s = await st(p); expect(s.balloon.includes('回答'), 's5 step4b ' + s.balloon); expect(await p.isVisible('#hr-reply'), 's5 reply btn');
  await click(p, 'hr-reply'); s = await st(p); expect(s.now.includes('チェックリスト'), 's5 step5 ' + s.now); expect(await p.isVisible('#ck-list'), 's5 checklist');
  await shot(p, 's5-5');
  await click(p, 'ck-escalate'); s = await st(p); expect(s.alert.includes('空の項目'), 's5 escalate early ' + s.alert);
  await p.selectOption('select[data-id="ck1"]', 'done'); await p.waitForTimeout(80); s = await st(p); expect(s.balloon.includes('空の項目'), 's5 partial ' + s.balloon);
  await click(p, 'ck-fill'); s = await st(p); expect(s.now.includes('判定区分'), 's5 step6 ' + s.now);
  await p.selectOption('select[data-id="disp"]', 'legit'); await p.waitForTimeout(80); s = await st(p); expect(s.alert.includes('正当な利用'), 's5 legit check ' + s.alert);
  await p.selectOption('select[data-id="disp"]', 'fp'); await p.waitForTimeout(80); s = await st(p); expect(s.alert.includes('誤検知'), 's5 fp check ' + s.alert);
  await tip(p, 'disp'); await p.waitForTimeout(80); expect(await p.isVisible('.tt-tip'), 's5 tip');
  await p.selectOption('select[data-id="disp"]', 'tp'); await p.waitForTimeout(80); s = await st(p); expect(s.balloon.includes('封じ込め'), 's5 tp ' + s.balloon);
  await shot(p, 's5-6');
  await click(p, 'ck-escalate'); s = await st(p); expect(s.next === 'S6へ進む（封じ込め）', 's5 done ' + s.next);
  await next(p);
  // ---- S6
  s = await st(p); expect(s.hash === '#s7', 's6 hash'); expect(s.title.includes('SOAR'), 's6 title ' + s.title); await click(p, 'g-start'); s = await st(p); expect(s.balloon.includes('承認段階'), 's6 step1 ' + s.balloon);
  await click(p, 'hub-p5'); s = await st(p); expect(s.now.includes('実行範囲'), 's6 step2 ' + s.now);
  await shot(p, 's6-1');
  await pick(p, 'pb-scope', '①〜②'); s = await st(p); expect(s.alert.includes('③アカウント停止'), 's6 scope12 ' + s.alert);
  await pick(p, 'pb-scope', '①〜④'); s = await st(p); expect(s.alert.includes('CSIRT'), 's6 scope1234 ' + s.alert);
  await pick(p, 'pb-scope', '①〜③'); s = await st(p); expect(s.now.includes('承認チケット'), 's6 step3 ' + s.now);
  await click(p, 'pb-run'); s = await st(p); expect(s.alert.includes('承認チケット番号'), 's6 run early ' + s.alert);
  await click(p, 'pb-ticket-fill'); s = await st(p); expect(s.now.includes('実行する'), 's6 step4 ' + s.now);
  await tip(p, 'auth'); await p.waitForTimeout(80); expect(await p.isVisible('.tt-tip'), 's6 tip');
  await click(p, 'pb-run'); s = await st(p); expect(s.now.includes('承認を受ける'), 's6 step5 ' + s.now); expect(await p.isVisible('#pb-approve'), 's6 approve btn');
  await shot(p, 's6-4');
  await click(p, 'pb-approve'); s = await st(p); expect(s.next === 'S7へ進む（範囲の確定・記録）', 's6 done ' + s.next);
  await shot(p, 's6-done');
  await next(p);
  // ---- S7
  s = await st(p); expect(s.hash === '#s8', 's7 hash'); await click(p, 'g-start'); s = await st(p); expect(s.balloon.includes('範囲確定'), 's7 step1 ' + s.balloon);
  await click(p, 'hub-p6'); s = await st(p); expect(s.balloon.includes('Assistant'), 's7 step1b ' + s.balloon); expect(await p.isVisible('#hub-copy-scope'), 's7 copy btn');
  await click(p, 'hub-copy-scope'); s = await st(p); expect(s.now.includes('Q4a'), 's7 step2 ' + s.now); expect(await p.isVisible('#as-insert-q4a'), 's7 insert q4a');
  await click(p, 'as-insert-q4a'); await click(p, 'sp-run'); s = await st(p); expect(s.now.includes('Q4b'), 's7 step3 ' + s.now); expect(await p.isVisible('#res-row-total'), 's7 q4a total');
  await shot(p, 's7-2');
  await click(p, 'as-insert-q4b'); await click(p, 'sp-run'); s = await st(p); expect(s.now.includes('KB07'), 's7 step4 ' + s.now); expect(await p.isVisible('#hub-p7'), 's7 p7 chip');
  await click(p, 'hub-p7'); s = await st(p); expect(s.balloon.includes('記録'), 's7 step4b ' + s.balloon); expect(await p.isVisible('#rec-open'), 's7 rec-open');
  await shot(p, 's7-4');
  await click(p, 'rec-open'); s = await st(p); expect(s.now.includes('記録を4項目'), 's7 step5 ' + s.now); expect(await p.isVisible('#rec-form'), 's7 rec form');
  await click(p, 'rec-save'); s = await st(p); expect(s.alert.includes('空の項目'), 's7 save early ' + s.alert);
  const r1 = p.locator('input[data-id="r1"]'); await r1.fill('事象の例'); await r1.press('Enter'); await p.waitForTimeout(80); s = await st(p); expect(s.balloon.includes('確認済み'), 's7 next field ' + s.balloon);
  await click(p, 'rec-fill'); s = await st(p); expect(s.balloon.includes('保存'), 's7 fill ' + s.balloon);
  await click(p, 'rec-save'); s = await st(p); expect(s.next === 'S8へ進む（改善）', 's7 done ' + s.next);
  await shot(p, 's7-done');
  await next(p);
  // ---- S8
  s = await st(p); expect(s.hash === '#s9', 's8 hash'); await click(p, 'g-start'); s = await st(p); expect(s.balloon.includes('ナレッジ'), 's8 step1 ' + s.balloon);
  await click(p, 'hub-p4'); s = await st(p); expect(s.now.includes('役割分担'), 's8 step2 ' + s.now); expect(await p.isVisible('#hub-p8'), 's8 p8 chip');
  await click(p, 'hub-p8'); s = await st(p); expect(s.now.includes('チケット'), 's8 step3 ' + s.now);
  await shot(p, 's8-2');
  await click(p, 'imp-ticket'); s = await st(p); expect(s.next === '振り返りへ', 's8 done ' + s.next);
  await shot(p, 's8-done');
  await next(p);
  // ---- 振り返り
  s = await st(p); expect(s.hash === '#s10', 'summary hash ' + s.hash); expect(await p.isVisible('.summary'), 'summary');
  const stats = await p.$$eval('.stat b', els => els.map(e => e.textContent)); R.push(['stats', stats]);
  expect(+stats[0] > 20 && +stats[1] >= 10 && +stats[2] >= 1, 'stats ' + stats.join('/'));
  await shot(p, 's9-summary');
  await ov(p, '1440');
  await p.keyboard.press('3'); s = await st(p); expect(s.hash === '#s3', 'key 3');
  await p.keyboard.press('0'); s = await st(p); expect(s.hash === '#s10', 'key 0');
  await p.keyboard.press('ArrowRight'); s = await st(p); expect(s.hash === '#s1', 'summary next');
  for (const [w, h, scheme, hash] of [[1366, 800, 'dark', '#s6'], [1000, 800, 'light', '#s7'], [400, 800, 'light', '#s2']]) {
    const q = await page(w, h, scheme, hash);
    await q.click('#g-start'); await q.waitForTimeout(300); await ov(q, `${w} ${hash}`); await shot(q, `w${w}`);
    await q.context().close();
  }
  } catch (e) { errors.push('EXCEPTION ' + String(e.message || e).slice(0, 1200)); }
  console.log(JSON.stringify(R));
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'ALL OK');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
