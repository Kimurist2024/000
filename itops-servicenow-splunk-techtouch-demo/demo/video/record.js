// イメージデモ（../index.html）を台本どおりに自動操作し、実時間で録画して MP4（1920×1080、H.264）にする。
// 使い方（demo/video で実行）:
//   npm install
//   NODE_PATH="$(npm root -g)" FFMPEG=/path/to/ffmpeg node record.js
// 必要なもの: Playwright（Chromium）、libx264 を含む ffmpeg。字幕と操作の順番は、このファイル末尾の「台本」を直す。
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const HTML = "file://" + path.resolve(__dirname, "..", "index.html");
const OUT = process.env.OUT || path.join(__dirname, "itops-servicenow-splunk-techtouch-demo.mp4");
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const VIEW = { width: 1536, height: 864 };
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "itops-video-"));

// 中国語の字形が混ざらないよう、日本語は Noto Sans JP、英数字は Roboto を明示して使う
function fontLinks() {
  const files = [];
  for (const pkg of ["@fontsource/noto-sans-jp", "@fontsource/roboto"]) {
    for (const w of ["400", "500", "700"]) {
      try { files.push(require.resolve(pkg + "/" + w + ".css", { paths: [__dirname] })); } catch (e) { /* 未導入なら既定のフォント */ }
    }
  }
  return files.map((f) => "file://" + f);
}
const VIDEO_CSS = `
:root { --font-demo: "Noto Sans JP", sans-serif; }
body, .tt-balloon, .tw-pill, .tw-pop, .tt-note, .tt-crit, .tt-linkpop, .tw-toast, .tw-busy b, .tt-ins, .tt-chiplink { font-family: Roboto, "Noto Sans JP", sans-serif !important; }
.sn-app, .spk-app { font-family: Roboto, "Noto Sans JP", sans-serif !important; }
.topbar, .disclaimer, .ask, .notes, .foot, .ctrl { display: none !important; }
.wrap { padding: 8px 14px 0 !important; gap: 6px !important; max-width: none !important; }
.jn { padding: 3px 8px !important; }
.jn .jl { font-size: 12px !important; } .jn .jt { font-size: 10.5px !important; } .jn .no { width: 20px !important; height: 20px !important; font-size: 11px !important; }
.story { padding: 6px 14px !important; } .story-time { font-size: 20px !important; } .story h1 { font-size: 17px !important; } .story-text { font-size: 12.5px !important; line-height: 1.5 !important; }
.screen { height: calc(100vh - 196px) !important; }
#v-cursor { position: fixed; left: 760px; top: 600px; width: 24px; height: 24px; z-index: 10002; pointer-events: none; margin: -2px 0 0 -3px; transition: left .55s cubic-bezier(.4,0,.2,1), top .55s cubic-bezier(.4,0,.2,1); }
#v-ripple { position: fixed; z-index: 10001; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%; border: 3px solid #1974dc; pointer-events: none; opacity: 0; }
#v-ripple.on { animation: vrip .45s ease-out; }
@keyframes vrip { from { opacity: .9; transform: scale(.4); } to { opacity: 0; transform: scale(1.3); } }
#v-caption { position: fixed; left: 24px; right: 420px; bottom: 16px; z-index: 9998; pointer-events: none; background: rgba(17,17,34,.9); color: #fff; border-radius: 10px; padding: 10px 18px; font: 700 18px/1.55 "Noto Sans JP", sans-serif; box-shadow: 0 8px 24px rgba(0,0,0,.25); }
#v-caption[hidden] { display: none; }
#v-caption .sub { display: block; font-size: 13.5px; font-weight: 400; color: #d7d8ea; margin-top: 2px; }
#v-card { position: fixed; inset: 0; z-index: 10000; display: grid; place-items: center; padding: 40px; background: #f4f5f7; color: #1f2a37; font-family: "Noto Sans JP", sans-serif; }
#v-card[hidden] { display: none; }
.v-inner { max-width: 1180px; width: 100%; display: grid; gap: 14px; padding: 36px 48px; border-left: 8px solid var(--v-accent, #1974dc); background: #fff; border-radius: 14px; box-shadow: 0 5px 14px rgba(31,42,55,.16); }
.v-eyebrow { font-size: 17px; color: #5b6573; letter-spacing: .05em; }
.v-title { font-size: 34px; font-weight: 700; line-height: 1.35; }
.v-sub { font-size: 21px; line-height: 1.6; }
.v-text { font-size: 17px; color: #5b6573; line-height: 1.7; }
.v-note { font-size: 13.5px; color: #5b6573; border-top: 1px solid #d6dbe1; padding-top: 12px; line-height: 1.7; }
.v-list { margin: 0; padding-left: 1.2em; font-size: 19px; line-height: 1.7; }
.v-ask { font-size: 30px; font-weight: 700; line-height: 1.5; }
.v-pill { justify-self: start; border-radius: 999px; padding: 2px 14px; font-size: 15px; font-weight: 700; color: #fff; background: var(--v-accent, #1974dc); }
`;
const NOTE = "イメージデモ｜企業・人物・サービス・手順・数値はすべて架空です。ServiceNow・Splunk の画面は公開資料を手本に組んだ画面イメージで、実画面ではありません。";

let page;
const wait = (ms) => page.waitForTimeout(ms);
async function cap(text, sub) {
  await page.evaluate(([t, s]) => { const c = document.getElementById("v-caption"); c.hidden = false; c.innerHTML = ""; c.appendChild(document.createTextNode(t)); if (s) { const e = document.createElement("span"); e.className = "sub"; e.textContent = s; c.appendChild(e); } }, [text, sub || ""]);
}
async function card(html, ms, accent) {
  await page.evaluate(([h, a]) => { const c = document.getElementById("v-card"); c.style.setProperty("--v-accent", a); c.innerHTML = '<div class="v-inner">' + h + "</div>"; c.hidden = false; document.getElementById("v-caption").hidden = true; document.getElementById("v-cursor").style.visibility = "hidden"; }, [html, accent || "#1974dc"]);
  await wait(ms);
  await page.evaluate(() => { document.getElementById("v-card").hidden = true; document.getElementById("v-cursor").style.visibility = "visible"; });
}
async function pointOf(sel) {
  const loc = page.locator(sel).first();
  await loc.evaluate((el) => { const v = document.getElementById("viewport"), r = el.getBoundingClientRect(), vr = v.getBoundingClientRect(); if (r.top < vr.top + 100 || r.bottom > vr.bottom - 120) v.scrollTop += r.top - vr.top - (v.clientHeight - r.height) / 2 + 40; });
  await wait(250);
  const b = await loc.boundingBox();
  if (!b) throw new Error("見つからない要素: " + sel);
  return { x: b.x + Math.min(b.width / 2, 90), y: b.y + b.height / 2 };
}
async function moveTo(p) { await page.evaluate(([x, y]) => { const c = document.getElementById("v-cursor"); c.style.left = x + "px"; c.style.top = y + "px"; }, [p.x, p.y]); await wait(620); }
async function click(sel, after = 700) {
  const p = await pointOf(sel);
  await moveTo(p);
  await page.evaluate(([x, y]) => { const r = document.getElementById("v-ripple"); r.style.left = x + "px"; r.style.top = y + "px"; r.classList.remove("on"); void r.offsetWidth; r.classList.add("on"); }, [p.x, p.y]);
  await page.mouse.click(p.x, p.y);
  await wait(after);
}
const next = (ms = 600) => click("#tb-next", ms);
async function pick(id, value, after = 900) { await click('[data-open="' + id + '"]', 600); await click('[data-pick="' + id + "|" + value + '"]', after); }
async function pickRange(label, after = 900) {
  if (!(await page.locator("#tp-menu").count())) await click("#sp-tp", 700);
  await click("#tp-menu >> text=" + label, after);
}
async function chapter(n) { await page.keyboard.press(String(n)); await wait(700); }
async function ask(q, accent) { await card('<span class="v-pill">伺いたいこと</span><p class="v-ask">' + q + "</p>", 3600, accent); }

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEW, locale: "ja-JP", colorScheme: "light", recordVideo: { dir: TMP, size: VIEW } });
  page = await ctx.newPage();
  page.on("pageerror", (e) => console.error("pageerror:", e.message));
  await page.goto(HTML + "#s1");
  await page.evaluate(([links, css]) => {
    links.forEach((h) => { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = h; document.head.appendChild(l); });
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    document.body.insertAdjacentHTML("beforeend", '<div id="v-caption" hidden></div><div id="v-card" hidden></div><div id="v-ripple"></div><svg id="v-cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2v18l4.6-4.4 3.1 6.9 2.9-1.3-3.1-6.8H18z" fill="#fff" stroke="#111122" stroke-width="1.5" stroke-linejoin="round"/></svg>');
    window.dispatchEvent(new Event("resize"));
  }, [fontLinks(), VIDEO_CSS]);
  await page.evaluate(() => document.fonts.ready);
  await wait(600);

  /* ==================== 台本 ==================== */
  await card('<p class="v-eyebrow">イメージデモ</p><p class="v-title">IT運用 × テックタッチ<br>ServiceNow と Splunk（ITSI・サーチとレポート）をまたぐ手順を、画面の上に置く</p>' +
    '<p class="v-sub">架空のA社：監視は Zabbix・JP1、起票と記録は ServiceNow、影響と事実の確認は Splunk Cloud。夜間の一次切り分けと、月1回の稼働統計を、テックタッチのガイドで進めます。</p>' +
    '<p class="v-note">' + NOTE + "<br>ServiceNow は Polaris テーマの公式ドキュメントの画面写真、Splunk は ITSI 5.0（新しいナビゲーション）とサーチ画面の公式の画面写真を手本にしました。Splunk の画面の部品は Splunk 公式の UI ツールキット（Apache-2.0）です。テックタッチの表示は製品の見た目に合わせた案です。</p>", 8000);

  // ---------- 全体像
  await chapter(1);
  await cap("ツールは4つ。手順は、ツールの外（手順書と当番の経験）にあります。");
  await page.keyboard.press("ArrowRight"); await wait(3200);
  await cap("起点と記録の正は ServiceNow。影響と事実の確認は Splunk。テックタッチは、それぞれの画面の上に社内の手順を置きます。");
  for (let i = 0; i < 4; i++) { await next(2600); }
  await ask("障害の連絡を受けてから有識者に渡すまで、いまは何の画面を、どの順番で見ていますか？");

  // ---------- 前半 1. ServiceNow
  await chapter(2);
  await cap("前半：10月21日 22:41。夜間当番の山本さん。監視から自動起票されたインシデントを受け取ります。", "右下のテックタッチの一覧から、ガイドを再生します。");
  await wait(2200);
  await page.hover("#g-start").catch(() => {}); await wait(900);
  await click("#g-start", 1500);
  await click("#sn-row-INC0012847 .sn-num", 1600);
  await cap("ステータスを「保留中」にしようとすると、テックタッチが理由つきで止めます。", "保留中にすると SLA の時間が止まる、という A社の決まり（架空）です。");
  await pick("state", "保留中", 3200);
  await pick("state", "処理中", 1600);
  await cap("「作業メモ」のチェックが無いと、顧客に表示されるコメントになります。赤い枠は、テックタッチが置いた注意書きです。");
  await wait(2600);
  await click("#sn-wn", 1300);
  await cap("「テンプレートの挿入」で、速報の書き方をそろえます。");
  await click("#tt-tpl", 2600);
  await click("#sn-post", 1800);
  await cap("次は Splunk で影響を確かめます。テックタッチが画面の上に置いた「切り分けの手順」から開きます。");
  await click("#tt-hdr", 1500);
  await page.hover("#tt-link-itsi").catch(() => {}); await wait(1200);
  await click("#tt-link-itsi", 1200);

  // ---------- 前半 2. ITSI
  await cap("Splunk ITSI（Episode Review）。リンクで開いた先で、続きのガイドを再生します。", "ツールごとにガイドを分け、リンクで続ける設定を想定しています（ドメインをまたぐ動きは要検証）。");
  await wait(2200);
  await click("#g-start", 1400);
  await click("#ep-row-ep1", 1800);
  await cap("ITSI で「Closed」にしようとすると止めます。記録の正は ServiceNow です（A社の決まり・架空）。");
  await pick("epstatus", "Closed", 3200);
  await click("#ep-ack", 1600);
  await cap("Events Timeline は、根本原因の分析の順に並んでいます。ここでは原因を決めず、順番だけを見ます。");
  await wait(2400); await next(1200);
  await click("#nav-sa", 1200);

  // ---------- 前半 3. Service Analyzer・Deep Dive
  await cap("Service Analyzer。見る順番を「業務 → 基盤 → 連携」に固定します。");
  await click("#g-start", 1400);
  await wait(1800); await next(900);
  await click("#sa-tree", 1500);
  await click("#node-online", 1700);
  await cap("赤が同時に並んでも、原因は断定しません。断定は有識者が行います（赤い枠：テックタッチの注意書き）。");
  await wait(2600); await next(900);
  await click("#sa-deepdive", 1700);
  await cap("Deep Dive。4つの KPI が 22:31 ごろにそろって悪化。どれが先かは、ログで裏付けます。");
  await wait(2600); await next(900);
  await click("#tt-link-search", 1200);

  // ---------- 前半 4. サーチ
  await cap("運用基盤チームの保存済みサーチ。サーチ文は変えず、変えるのは時間範囲だけです。");
  await click("#g-start", 1400);
  await wait(1600); await next(900);
  await click("#sp-tp", 1200);
  await cap("「過去 24 時間」は広すぎて遅く、ほかの利用者にも影響します。テックタッチが理由つきで止めます。");
  await click("#tp-menu >> text=過去 24 時間", 3200);
  await pickRange("過去 60 分間", 1200);
  await click("#sp-run", 1800);
  await cap("時刻の早い順に、事実を読みます。最初は DC間ネットワークの再送の増加（22:30:58）。", "夜間当番はエクスポートしない、という決まりも画面の上に置いています（架空）。");
  await wait(3200); await next(900);
  await click("#tt-link-snow", 1200);

  // ---------- 前半 5. ServiceNow 引き継ぎ
  await cap("ServiceNow に戻り、決まった形で有識者に引き継ぎます。");
  await click("#g-start", 1400);
  await click("#tt-tpl", 1800);
  await cap("「作業メモ」のチェックを忘れて投稿すると、入力チェックが止めます。直すボタンもテックタッチが出します。");
  await click("#sn-post", 2800);
  await click("#tb-fix", 900);
  await click("#sn-post", 1200);
  await cap("「未確認のこと」が空のままでも止めます。確かめていないことを書けば、有識者が同じ確認を繰り返さずに済みます。");
  await wait(2400);
  await click("#tb-fix", 1200);
  await click("#sn-post", 1600);
  await cap("アサイン先グループは「？」で基準を出してから選びます。");
  await click("#tt-q-group", 1800);
  await pick("group", "アプリ保守", 3000);
  await pick("group", "基盤有識者（NW・連携）", 1400);
  await cap("ウォッチリストと作業メモリストは、テックタッチが決まりどおりに自動入力します。");
  await click("#tt-auto", 2600);
  await cap("業務部門への連絡はインシデントコマンダー経由、ベンダーへの依頼は有識者の判断（架空）。注意書きを確かめて更新します。");
  await wait(2400);
  await click("#sn-update", 2400);
  await ask("有識者に渡すときの書き方と、渡す先の選び方は、当番によって違っていませんか？");

  // ---------- 後半 6. 月次タスク
  await chapter(7);
  await cap("後半：11月4日 9:32。運用基盤チームの小林さん。月に1回の稼働統計のタスクです。", "手順はうろ覚え。右下のガイドの一覧から選びます。");
  await wait(2400);
  await click("#g-start", 1400);
  await click("#sn-row-TASK0004211 .sn-num", 1800);
  await cap("使うレポートの注意書きも、テックタッチが置いています（架空）。");
  await pick("tstate", "作業中", 1400);
  await click("#tt-hdr", 1300);
  await click("#tt-link-report", 1200);

  // ---------- 後半 7. レポート
  await cap("Splunk のレポートの一覧。名前の似たレポートが2つあります。");
  await click("#g-start", 1400);
  await cap("「_旧」を開こうとすると止めます。代理店ポータルが入っていない古い定義です。");
  await click("#rp-old", 3000);
  await click("#rp-main", 1500);
  await click("#sp-tp", 1100);
  await cap("「過去 30 日間」は今日から数えるため、10月1日〜4日が抜けます。テックタッチが止めます。");
  await click("#tp-menu >> text=過去 30 日間", 3200);
  await pickRange("前月", 1400);
  await cap("10サービスの稼働率。前半の障害（約38分）も数字に表れています。");
  await wait(2400); await next(900);
  await click("#sp-export", 1400);
  await cap("ファイル名は決まった形。テックタッチが自動入力します。");
  await click("#tt-fname", 2600);
  await click("#ex-go", 1600);
  await click("#tt-link-task", 1200);

  // ---------- 後半 8. 添付・クローズ
  await cap("ServiceNow のタスクに戻り、添付して、期間・レポート名・行数を記録して閉じます。");
  await click("#g-start", 1400);
  await click("#sn-attach", 1300);
  await click("#tt-tpl", 1500);
  await click("#sn-wn", 900);
  await click("#sn-post", 1600);
  await pick("tstate", "クローズ (完了)", 1300);
  await click("#sn-update", 2600);
  await ask("定期のレポートで、古い版や期間の取り違えに気づくのは、いまは誰で、いつですか？");

  // ---------- 振り返り
  await page.keyboard.press("0"); await wait(800);
  await page.evaluate(() => { document.querySelector(".summary").scrollIntoView(); });
  await cap("ツールは替えず、ツールをまたぐ社内の手順と決まりを、それぞれの画面の上に置きました。", "回数はこのデモを操作した回数で、効果の数値ではありません。");
  await wait(6000);
  await page.mouse.wheel(0, 700); await wait(5000);
  await card('<p class="v-eyebrow">最初の一歩</p><p class="v-title">一つの作業を、実画面で確かめる</p>' +
    '<ul class="v-list"><li>先に確かめる：端末と拡張機能の配布、画面の種類、ドメインをまたぐガイドの続き方</li><li>一次切り分けか月次作業の一つを、実画面で確かめる</li><li>変化を測る：起票から有識者へのアサインまでの時間、再アサインの件数、書き漏れ、手戻り</li></ul>' +
    '<p class="v-note">' + NOTE + "<br>Zabbix・JP1 は図だけです。Web 画面であれば同じ仕組みで載る想定ですが、製品と画面の種類によるため要検証です。</p>", 8000);

  const video = page.video();
  await ctx.close();
  await browser.close();
  const webm = await video.path();
  execFileSync(FFMPEG, ["-y", "-hide_banner", "-loglevel", "error", "-i", webm, "-vf", "scale=1920:1080:flags=lanczos,fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-movflags", "+faststart", OUT], { stdio: "inherit" });
  console.log("->", OUT);
}
main().catch((e) => { console.error(e); process.exit(1); });
