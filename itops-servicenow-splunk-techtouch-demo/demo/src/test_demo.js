// イメージデモ（../index.html）の自動テスト。Playwright（Chromium）で全場面を通しで進め、次を確かめる。
//  1) 各ステップで、指す先の要素があり、吹き出しとリングが表示される
//  2) 間違った操作（選び直し・チェック忘れ・書き漏れ）で入力チェックが止め、正しい操作で先に進む
//  3) ページのエラーが出ない
// 使い方: cd demo/src && NODE_PATH="$(npm root -g)" node test_demo.js
"use strict";
const path = require("path");
const { chromium } = require("playwright");
const URL = "file://" + path.resolve(__dirname, "..", "index.html");
let page, fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log("NG:", msg); } };
const st = () => page.evaluate(() => window.__demo.state());
const wait = (ms) => page.waitForTimeout(ms);
async function go(ch) { await page.goto(URL + "#s" + ch); await page.reload(); await wait(300); }
async function clickSel(sel) { await page.locator(sel).first().scrollIntoViewIfNeeded(); await page.locator(sel).first().click(); await wait(150); }
async function pick(id, value) { await clickSel('[data-open="' + id + '"]'); await clickSel('[data-pick="' + id + "|" + value + '"]'); }
async function pickRange(label) { await clickSel("#sp-tp"); await page.locator("#tp-menu").getByText(label, { exact: true }).first().click(); await wait(150); }
async function guideVisible(where) {
  const r = await page.evaluate(() => {
    const ring = document.querySelector("#tt-ring"), b = document.querySelector("#tt-balloon");
    return { ring: !ring.hidden && ring.getBoundingClientRect().width > 0, balloon: !b.hidden && b.textContent.length > 0 };
  });
  ok(r.ring && r.balloon, "ガイドが表示されない: " + where);
}
async function runAll(ch) {
  // 残りのステップを進行バーの「進める」で最後まで進め、各ステップでガイドの表示を確かめる
  for (let guard = 0; guard < 20; guard++) {
    const s = await st();
    if (s.ch !== ch || s.step > s.steps) return s;
    await guideVisible("場面" + ch + " ステップ" + s.step);
    await page.keyboard.press("ArrowRight");
    await wait(120);
    let t = await st();
    while (t.busy) { await wait(200); t = await st(); }
  }
  return st();
}
async function start(ch) {
  await go(ch);
  if (ch === 1) await page.keyboard.press("ArrowRight"); else await clickSel("#g-start");
  await wait(150);
  ok((await st()).step === 1, "場面" + ch + "：ガイドが始まらない");
}

(async () => {
  const browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1536, height: 900 }, locale: "ja-JP" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  // 全場面：進行バーで最後まで進め、次の場面へつながるか
  const expectNext = { 1: 1, 2: 3, 3: 4, 4: 5, 5: 6, 6: 6, 7: 8, 8: 9, 9: 9 };
  for (let ch = 1; ch <= 9; ch++) {
    await start(ch);
    const s = await runAll(ch);
    ok(s.ch === expectNext[ch], "場面" + ch + "：最後のステップの後の場面が " + s.ch + "（想定 " + expectNext[ch] + "）");
  }

  // 場面2：ステータスの選び直し、作業メモのチェック忘れ
  await start(2);
  await clickSel("#sn-row-INC0012847 .sn-num");
  await pick("state", "保留中"); ok(!!(await st()).warn, "場面2：保留中で止まらない");
  await pick("state", "処理中"); ok((await st()).step === 3, "場面2：処理中で進まない");
  await clickSel("#sn-wn"); ok((await st()).step === 4, "場面2：作業メモのチェックで進まない");
  await clickSel("#sn-wn"); // チェックを外してから投稿 → 止まる
  await clickSel("#tt-tpl"); await clickSel("#sn-post"); ok(!!(await st()).warn, "場面2：チェック無しの投稿で止まらない");
  await clickSel("#tb-fix"); await clickSel("#sn-post"); ok((await st()).step === 6, "場面2：直したあとの投稿で進まない");
  await clickSel("#tt-hdr"); await clickSel("#tt-link-itsi"); ok((await st()).ch === 3, "場面2：ITSIへのリンクで場面3に進まない");

  // 場面3：ITSIで閉じようとすると止まる
  await start(3);
  await clickSel("#ep-row-ep1"); await pick("epstatus", "Closed"); ok(!!(await st()).warn, "場面3：Closedで止まらない");
  await clickSel("#ep-ack"); ok((await st()).step === 3, "場面3：Acknowledgeで進まない");

  // 場面5：時間範囲の選び直し
  await start(5);
  await clickSel("#tb-next"); await clickSel("#sp-tp"); ok((await st()).step === 3, "場面5：時間範囲を開いても進まない");
  await page.locator("#tp-menu").getByText("過去 24 時間", { exact: true }).first().click(); await wait(150);
  ok(!!(await st()).warn, "場面5：過去 24 時間で止まらない");
  await pickRange("過去 60 分間"); ok((await st()).step === 4, "場面5：過去 60 分間で進まない");
  await clickSel("#sp-run"); ok(await page.locator("#sp-results").count() === 1, "場面5：サーチの結果が出ない");

  // 場面6：チェック忘れ → 書き漏れ → アサイン先グループの選び直し → 自動入力
  await start(6);
  await clickSel("#tt-tpl"); await clickSel("#sn-post"); let w = (await st()).warn || "";
  ok(w.includes("作業メモ"), "場面6：チェック無しで止まらない");
  await clickSel("#tb-fix"); await clickSel("#sn-post"); w = (await st()).warn || "";
  ok(w.includes("未確認"), "場面6：未確認のことが空でも止まらない");
  await clickSel("#tb-fix"); await clickSel("#sn-post"); ok((await st()).step === 3, "場面6：直したあとの投稿で進まない");
  await clickSel("#tt-q-group"); await pick("group", "アプリ保守"); ok(!!(await st()).warn, "場面6：アプリ保守で止まらない");
  await pick("group", "基盤有識者（NW・連携）"); ok((await st()).step === 5, "場面6：基盤有識者で進まない");
  await clickSel("#tt-auto"); await wait(300); ok((await st()).busy, "場面6：自動処理中の表示が出ない");
  await wait(1700); ok((await st()).step === 6, "場面6：自動入力のあとに進まない");
  await clickSel("#sn-update"); ok(await page.locator("#tw-toast").count() === 1, "場面6：ガイドの終了の通知が出ない");

  // 場面8：旧版のレポートと期間の取り違え
  await start(8);
  await clickSel("#rp-old"); ok(!!(await st()).warn, "場面8：旧版で止まらない");
  await clickSel("#rp-main"); await clickSel("#sp-tp");
  await page.locator("#tp-menu").getByText("過去 30 日間", { exact: true }).first().click(); await wait(150);
  ok(!!(await st()).warn, "場面8：過去 30 日間で止まらない");
  await pickRange("前月"); ok((await st()).step === 4, "場面8：前月で進まない");

  // 場面9：クローズの種類
  await start(9);
  await clickSel("#sn-attach"); await clickSel("#tt-tpl"); await clickSel("#sn-wn"); await clickSel("#sn-post");
  await pick("tstate", "クローズ (未完了)"); ok(!!(await st()).warn, "場面9：クローズ (未完了) で止まらない");
  await pick("tstate", "クローズ (完了)"); await clickSel("#sn-update"); ok((await st()).step === 6, "場面9：最後まで進まない");

  // 振り返り
  await go(10); ok(await page.locator("#summary .sum-card").count() >= 5, "振り返りが表示されない");

  ok(errors.length === 0, "ページのエラー: " + errors.join(" / "));
  await browser.close();
  console.log(fails ? "失敗 " + fails + " / " + checks : "すべて成功 " + checks + " 件");
  process.exit(fails ? 1 : 0);
})();
