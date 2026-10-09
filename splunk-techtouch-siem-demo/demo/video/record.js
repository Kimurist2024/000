// イメージデモ（../index.html）を台本どおりに自動操作して1コマずつ撮影し、MP4（1920×1080、H.264）にまとめる。
//
// 使い方（splunk-techtouch-siem-demo/demo/video で実行）:
//   npm install
//   NODE_PATH="$(npm root -g)" FFMPEG=/path/to/ffmpeg node record.js
// 必要なもの: Playwright（Chromium）、libx264 を含む ffmpeg。
// 字幕と操作の順番は、このファイル末尾の「台本」を直す。
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

// 撮影対象は旧版（v1）。Splunk公式UI部品版（../index.html）は画面の要素が違うため、台本の調整が要る
const HTML = "file://" + path.resolve(__dirname, "..", "v1", "index.html");
const OUT = process.env.OUT || path.join(__dirname, "splunk-techtouch-siem-demo.mp4");
const FRAMES = process.env.FRAMES_DIR || fs.mkdtempSync(path.join(os.tmpdir(), "sptt-frames-"));
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const FPS = 30;
// 1536×864 の画面を 1.25 倍で撮影すると 1920×1080 になる（文字を大きく見せるため）。
const VIEW = { width: 1536, height: 864 };
const SCALE = 1.25;

// 中国語の字形が混ざらないよう、日本語は Noto Sans JP、英数字は Roboto を明示して使う。
function fontLinks() {
  const files = [];
  for (const pkg of ["@fontsource/noto-sans-jp", "@fontsource/roboto"]) {
    for (const w of ["400", "500", "600", "700"]) {
      try { files.push(require.resolve(pkg + "/" + w + ".css", { paths: [__dirname] })); } catch (e) { /* 未導入なら既定のフォントで撮る */ }
    }
  }
  return files.map((f) => "file://" + f);
}

const TT = "#0B7FB5", HUB = "#6A4C9C", NOTE = "#595a7d", SP = "#006d9c";
const VIDEO_CSS = `
:root { --font: Roboto, "Noto Sans JP", sans-serif; --font-demo: "Noto Sans JP", sans-serif; }
.topbar, .foot, .notes, .ask, .disclaimer, .story-tags { display: none !important; }
.wrap { padding-block: 10px 170px !important; gap: 8px !important; }
.jn { padding: 5px 10px !important; }
.jn .jl { font-size: 13px !important; }
.jn .jt { font-size: 11px !important; }
.jn .no { width: 22px !important; height: 22px !important; }
.story { padding: 8px 16px !important; gap: 0 16px !important; }
.story-time { font-size: 22px !important; min-width: 3.8em !important; padding-right: 14px !important; }
.story h1 { font-size: 19px !important; }
.story-text { font-size: 13.5px !important; }
.overlay { font-size: 14px !important; line-height: 1.55 !important; gap: 8px !important; padding: 12px 16px 14px !important; margin-top: 48px !important; }
.ov-title { font-size: 16.5px !important; }
.ov-text, .refs { font-size: 12.5px !important; }
.steps.compact li { padding: 1px 8px !important; font-size: 13px !important; }
.soft, .part, .alert { padding: 7px 12px !important; font-size: 13px !important; }
.now-box { font-size: 14px !important; }
.btn { padding: 8px 14px !important; font-size: 14px !important; }
.spl-box { font-family: "Roboto Mono", Consolas, Menlo, "Noto Sans JP", monospace !important; }
.v-legend { display: flex; flex-wrap: wrap; gap: 8px 24px; font-size: 17px; color: #2f2f4f; }
.v-legend span { display: inline-flex; align-items: center; gap: 8px; }
.v-legend i { width: 16px; height: 16px; border-radius: 4px; display: inline-block; }
.v-journey { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
.v-journey div { border: 1px solid #dadbe4; border-radius: 12px; padding: 12px 14px; display: grid; gap: 2px; align-content: start; }
.v-journey .t { font-size: 22px; font-weight: 700; color: #2f2f4f; }
.v-journey b { font-size: 17px; line-height: 1.45; }
.v-journey span { font-size: 13.5px; color: #595a7d; line-height: 1.5; }
.is-target { animation: none !important; }
html { scroll-behavior: auto !important; }
#v-cursor { position: fixed; left: 1100px; top: 640px; width: 26px; height: 26px; z-index: 10002; pointer-events: none; margin: -2px 0 0 -3px; }
#v-ripple { position: fixed; z-index: 10001; width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%; border: 3px solid #0B7FB5; pointer-events: none; opacity: 0; }
#v-caption {
  position: fixed; left: 24px; right: 404px; bottom: 18px; z-index: 9998; pointer-events: none;
  background: rgba(17, 17, 34, 0.9); color: #fff; border-radius: 12px; padding: 12px 22px;
  font-family: "Noto Sans JP", sans-serif; font-size: 20px; font-weight: 700; line-height: 1.55;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}
#v-caption[hidden] { display: none !important; }
#v-caption .sub { display: block; margin-top: 2px; font-size: 14px; font-weight: 400; color: #d7d8ea; }
#v-caption .fixed { display: block; margin-top: 6px; font-size: 12px; font-weight: 400; color: #b1b2d2; }
#v-card {
  position: fixed; inset: 0; z-index: 10000; display: grid; place-items: center; padding: 40px;
  background: #f9f9fa; color: #2f2f4f; font-family: "Noto Sans JP", sans-serif;
}
#v-card[hidden] { display: none !important; }
#v-card.dim { background: rgba(17, 17, 34, 0.55); }
.v-inner { max-width: 1160px; width: 100%; display: grid; gap: 18px; padding: 44px 52px; border-left: 8px solid var(--v-accent, #0B7FB5); background: #fff; border-radius: 16px; box-shadow: 0 5px 11px -2px #2d2e4e29, 0 0 0 1px #2d2e4e08; }
.v-eyebrow { font-size: 18px; color: #595a7d; letter-spacing: 0.06em; }
.v-title { font-size: 40px; font-weight: 700; line-height: 1.35; }
.v-sub { font-size: 24px; color: #2f2f4f; line-height: 1.6; }
.v-text { font-size: 19px; color: #595a7d; line-height: 1.7; }
.v-note { font-size: 15px; color: #595a7d; border-top: 1px solid #dadbe4; padding-top: 14px; line-height: 1.7; }
.v-pill { justify-self: start; border-radius: 999px; padding: 2px 16px; font-size: 17px; font-weight: 700; color: #fff; background: var(--v-accent, #0B7FB5); }
.v-ask { font-size: 34px; font-weight: 700; line-height: 1.5; }
.v-flow { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; font-size: 26px; font-weight: 700; }
.v-flow span.arrow { color: #595a7d; font-weight: 400; }
.v-menu {
  position: absolute; z-index: 60; top: calc(100% + 4px); left: 0; min-width: 100%;
  background: var(--dt-surface); border-radius: 9px; box-shadow: var(--dt-shadow-float); padding: 4px;
  font-family: var(--font); font-size: 14px;
}
.v-menu div { padding: 7px 10px; border-radius: 6px; white-space: nowrap; color: var(--dt-text); }
.v-menu div.sel { color: var(--dt-primary); font-weight: 500; }
.v-menu div.hl { background: var(--dt-field-hover); }
`;

const FIXED_NOTE = "イメージデモ｜画面・人物・企業名・手順・数値は架空で、実際の製品画面や連携動作を示すものではありません。";

let page;
let frameNo = 0;
const frames = [];
let cur = { x: 1100, y: 640 };

async function snap(sec) {
  await page.evaluate(() => document.fonts.ready.then(() => true));
  const file = path.join(FRAMES, String(frameNo++).padStart(5, "0") + ".jpg");
  await page.screenshot({ path: file, type: "jpeg", quality: 92 });
  frames.push([file, sec]);
}
const hold = (sec) => snap(sec);
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const steps = (ms) => Math.max(6, Math.round((ms / 1000) * FPS));

async function moveTo(x, y, ms = 700) {
  const x0 = cur.x, y0 = cur.y, n = steps(ms);
  for (let i = 1; i <= n; i++) {
    const t = ease(i / n);
    await page.evaluate(([px, py]) => {
      const c = document.getElementById("v-cursor");
      c.style.left = px + "px"; c.style.top = py + "px";
    }, [x0 + (x - x0) * t, y0 + (y - y0) * t]);
    await snap(1 / FPS);
  }
  cur = { x, y };
}
async function ripple(action) {
  for (let i = 0; i < 9; i++) {
    if (i === 2 && action) await action();
    await page.evaluate(([x, y, k]) => {
      const r = document.getElementById("v-ripple");
      r.style.left = x + "px"; r.style.top = y + "px";
      r.style.opacity = String(1 - k / 9); r.style.transform = "scale(" + (0.4 + k * 0.1) + ")";
    }, [cur.x, cur.y, i]);
    await snap(1 / FPS);
  }
  await page.evaluate(() => { document.getElementById("v-ripple").style.opacity = "0"; });
}
async function ensureVisible(sel) {
  // 画面の外にある要素は、先に見える位置までスクロールする（右のパネルは字幕と重ならないので下端まで使う）
  const r = await page.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, h: innerHeight }; }, sel);
  const margin = r.left > 1120 ? 24 : 190;
  if (r.top < 90 || r.bottom > r.h - margin) await scrollToEl(sel, 260);
}
async function pointOf(sel, maxHalf = 110) {
  return page.evaluate(([s, m]) => {
    const r = document.querySelector(s).getBoundingClientRect();
    return { x: r.left + Math.min(r.width / 2, m), y: r.top + r.height / 2 };
  }, [sel, maxHalf]);
}
async function click(sel, opts = {}) {
  await ensureVisible(sel);
  const p = await pointOf(sel, opts.maxHalf);
  await moveTo(p.x, p.y, opts.ms);
  await ripple(() => page.evaluate((s) => document.querySelector(s).click(), sel));
}
async function choose(fieldSel, selectSel, value) {
  await ensureVisible(fieldSel);
  const p = await pointOf(selectSel, 90);
  await moveTo(p.x, p.y);
  await ripple(() => page.evaluate(([f, s]) => {
    const sel = document.querySelector(s), field = document.querySelector(f);
    const m = document.createElement("div");
    m.className = "v-menu";
    Array.from(sel.options).filter((o) => o.value !== "").forEach((o) => {
      const d = document.createElement("div");
      d.textContent = o.text; d.dataset.v = o.value;
      if (o.value === sel.value) d.className = "sel";
      m.appendChild(d);
    });
    field.appendChild(m);
  }, [fieldSel, selectSel]));
  await hold(0.3);
  const o = await page.evaluate(([f, v]) => {
    const d = Array.from(document.querySelectorAll(f + " .v-menu div")).find((x) => x.dataset.v === v);
    const r = d.getBoundingClientRect();
    return { x: r.left + Math.min(r.width / 2, 80), y: r.top + r.height / 2 };
  }, [fieldSel, value]);
  await moveTo(o.x, o.y, 450);
  await page.evaluate(([f, v]) => {
    document.querySelectorAll(f + " .v-menu div").forEach((d) => d.classList.toggle("hl", d.dataset.v === v));
  }, [fieldSel, value]);
  await hold(0.25);
  await ripple(() => page.evaluate(([f, s, v]) => {
    const m = document.querySelector(f + " .v-menu");
    if (m) m.remove();
    const sel = document.querySelector(s);
    sel.value = v;
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  }, [fieldSel, selectSel, value]));
  const r = await page.evaluate((f) => { const el = document.querySelector(f); const b = (el || document.body).getBoundingClientRect(); return { x: b.right + 22, y: b.top - 14 }; }, fieldSel);
  await moveTo(r.x, r.y, 350);
}
async function typeInto(inputSel, text) {
  await ensureVisible(inputSel);
  const p = await pointOf(inputSel, 120);
  await moveTo(p.x, p.y);
  await ripple(() => page.evaluate((s) => { const el = document.querySelector(s); el.focus(); el.value = ""; }, inputSel));
  for (const ch of Array.from(text)) {
    await page.evaluate(([s, c]) => { document.querySelector(s).value += c; }, [inputSel, ch]);
    await snap(0.07);
  }
  await hold(0.4);
  await page.evaluate((s) => { const el = document.querySelector(s); el.dispatchEvent(new Event("change", { bubbles: true })); el.blur(); }, inputSel);
  const r = await page.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.right + 24, y: b.bottom + 30 }; }, inputSel);
  await moveTo(r.x, r.y, 350);
}
async function scrollToY(y, ms = 800) {
  const [y0, maxY] = await page.evaluate(() => [scrollY, document.documentElement.scrollHeight - innerHeight]);
  const target = Math.max(0, Math.min(maxY, y)), n = steps(ms);
  if (Math.abs(target - y0) < 2) return;
  for (let i = 1; i <= n; i++) {
    await page.evaluate((v) => window.scrollTo(0, v), y0 + (target - y0) * ease(i / n));
    await snap(1 / FPS);
  }
}
async function scrollToEl(sel, offset = 120) {
  const top = await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);
  await scrollToY(top - offset);
}
async function caption(text, sub) {
  await page.evaluate(([t, s, fixed]) => {
    const c = document.getElementById("v-caption");
    c.hidden = false;
    c.innerHTML = "";
    c.appendChild(document.createTextNode(t));
    if (s) { const e = document.createElement("span"); e.className = "sub"; e.textContent = s; c.appendChild(e); }
    const f = document.createElement("span"); f.className = "fixed"; f.textContent = fixed; c.appendChild(f);
  }, [text, sub || "", FIXED_NOTE]);
}
async function card(html, opts = {}) {
  await page.evaluate(([h, dim, accent]) => {
    const c = document.getElementById("v-card");
    c.className = dim ? "dim" : "";
    c.style.setProperty("--v-accent", accent);
    c.innerHTML = '<div class="v-inner">' + h + "</div>";
    c.hidden = false;
    document.getElementById("v-caption").hidden = true;
    document.getElementById("v-cursor").style.visibility = "hidden";
  }, [html, !!opts.dim, opts.accent || TT]);
}
async function hideCard() {
  await page.evaluate(() => {
    document.getElementById("v-card").hidden = true;
    document.getElementById("v-cursor").style.visibility = "visible";
  });
}
const ask = (q, accent) => card('<span class="v-pill">伺いたいこと</span><p class="v-ask">' + q + "</p>", { dim: true, accent });
async function sceneCard(eyebrow, title, sub, note, accent) {
  await scrollToY(0, 300);
  await card('<p class="v-eyebrow">' + eyebrow + '</p><p class="v-title">' + title + '</p><p class="v-sub">' + sub + '</p><p class="v-note">' + FIXED_NOTE + (note ? "<br>" + note : "") + "</p>", { accent });
  await hold(4);
  await hideCard();
}
async function nextScene() { await click("#panel-next", { maxHalf: 80 }); await hold(0.6); }
const NAV = (k) => '.ah-nav [data-id="nav-' + k + '"]';

async function main() {
  const browser = await chromium.launch();
  page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: SCALE, colorScheme: "light", reducedMotion: "reduce" });
  await page.goto(HTML);
  await page.evaluate(([links, css]) => {
    document.documentElement.setAttribute("data-theme", "light");
    links.forEach((href) => { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); });
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    document.body.insertAdjacentHTML("beforeend",
      '<div id="v-caption" hidden></div><div id="v-card" hidden></div><div id="v-ripple"></div>' +
      '<svg id="v-cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2v18l4.6-4.4 3.1 6.9 2.9-1.3-3.1-6.8H18z" fill="#fff" stroke="#111122" stroke-width="1.5" stroke-linejoin="round"/></svg>');
  }, [fontLinks(), VIDEO_CSS]);
  await page.evaluate(() => document.fonts.ready.then(() => true));

  /* ==================== 台本 ==================== */
  // 表紙
  await card(
    '<p class="v-eyebrow">イメージデモ</p><p class="v-title">Splunk Cloud × テックタッチ（DAP＋AI Hub）<br>SIEM／SOC活用の高度化</p>' +
    '<p class="v-sub">架空のA社SOC（Splunk Cloud＋Security Essentials、ESなし）：SOC担当者が、依頼から検索・可視化・検知・調査・改善までを自分で進める</p>' +
    '<p class="v-text">ログの検索はSplunk、検索案はSplunk AI Assistant、社内の基準と次の行動はAI Hub、手順の抜け漏れ防止と入力チェックはテックタッチ。</p>' +
    '<p class="v-legend"><span><i style="background:#fff;border:1px solid ' + SP + '"></i>Splunkの画面イメージ（架空）</span>' +
    '<span><i style="background:' + TT + '"></i>テックタッチ ガイド（案）</span><span><i style="background:' + HUB + '"></i>AI Hub（構想・例文）</span><span><i style="background:#ebecf0;border:1px solid #595a7d"></i>社内（架空）</span></p>' +
    '<p class="v-note">' + FIXED_NOTE + "<br>Splunk AI AssistantとAI Hubの回答は、デモ用に準備した参考画面・例文です。接続元IPは文書用の予約アドレス（RFC 5737）です。</p>");
  await hold(8);

  // 全体像
  await card(
    '<p class="v-eyebrow">デモの流れ（37分版の9場面。動画は要約）</p><p class="v-title">一つの依頼を、SOC担当者が最後まで進める</p>' +
    '<div class="v-journey">' +
    '<div><span class="t">S0</span><b>現場の問題</b><span>機能不足ではなく、実行力と業務適合の不足</span></div>' +
    '<div><span class="t">S1</span><b>Before</b><span>AIがあっても検索が完成しない</span></div>' +
    '<div><span class="t">S2</span><b>要件整理</b><span>AI Hubが依頼を社内要件にする</span></div>' +
    '<div><span class="t">S3</span><b>SPL生成・確認</b><span>AssistantのSPL案をAI Hubが照合</span></div>' +
    '<div><span class="t">S4</span><b>データ検証</b><span>正解ログでケースA〜Dを区別</span></div>' +
    '<div><span class="t">S5</span><b>可視化</b><span>ガイドでダッシュボードを完成</span></div>' +
    '<div><span class="t">S6</span><b>検知</b><span>SSEを参照し、社内基準のアラート</span></div>' +
    '<div><span class="t">S7</span><b>一次調査</b><span>事実と未確認を分けて引き継ぐ</span></div>' +
    '<div><span class="t">S8</span><b>記録・改善</b><span>記録とナレッジ。クロージング</span></div>' +
    '<div><span class="t">まとめ</span><b>振り返り</b><span>確かめ方・伺いたいこと・最初の一歩</span></div></div>' +
    '<p class="v-note">Splunkの機能を増やすデモではありません。既にSplunkに入っているログを、SOC担当者自身が分析・監視・調査・改善に使えるようにするデモです。</p>');
  await hold(8);

  // ---------- S0
  await sceneCard("S0・現場の問題", "機能が足りないのではなく、入れたSplunkを社内で使い切れていない", "画面：社内ポータル（架空）", "", NOTE);
  await caption("架空のA社SOCは、Splunk CloudでVPNログを監視しています。委託先が作った検知はありますが、社内で直せません。");
  await hold(4.5);
  await click("#i-card", { maxHalf: 160 });
  await caption("SOC責任者の依頼：認証失敗が複数アカウントに広がった後、管理者ログインが成功するケースを見たい。ダッシュボードと一次調査の標準化まで。");
  await hold(5);
  await click("#i-flow", { maxHalf: 70 });
  await caption("いまは、担当者 → 委託先 → 見積・改修 → 確認。SPLの修正もダッシュボードの変更も、社内では直せません（架空）。");
  await hold(4.5);
  await click("#i-goal", { maxHalf: 70 });
  await caption("デモの終わりに残す5つの成果物：SPL、監視ダッシュボード、検知設計、一次調査の記録、改善ナレッジ。");
  await hold(4.5);
  await click("#panel-next", { maxHalf: 80 });
  await hold(0.8);
  await ask("SPLやダッシュボードの変更を、いまは誰に頼み、どれくらい待っていますか？", NOTE);
  await hold(4.5);
  await hideCard();
  await nextScene();

  // ---------- S1
  await sceneCard("S1・Before・仮説1　SPLと集計の作り方に迷う", "件数は見えている。しかし「同一管理者」「失敗の後」を正しく表せない", "画面：社内チャット → Splunk（既存のダッシュボード・検索）→ 改修依頼チケット", "不十分な検索は意図的に条件を省いた教材で、Splunk AI Assistantの実際の出力ではありません。", NOTE);
  await caption("依頼の要点は三つ。異なるアカウントへの失敗、同じ管理者本人、失敗の後の成功。");
  await click("#i-req", { maxHalf: 160 });
  await hold(3);
  await click("#i-open-splunk", { maxHalf: 90 });
  await caption("委託先が作ったダッシュボード（架空）には、認証失敗の件数だけがあります。異なるアカウント数と、失敗と成功の順序は見えません。");
  await hold(5);
  await click("#panel-next", { maxHalf: 80 });
  await caption("接続元IPごとに「失敗の件数」と「特権アカウントの成功の件数」を数えて絞るだけの検索を実行します（教材）。");
  await hold(3.5);
  await click("#sp-run", { maxHalf: 20 });
  await moveTo(560, 560, 500);
  await caption("AとCの2件が残りました。Cは管理者の成功（09:00:05）が失敗より前で、「失敗後の成功」ではありません。", "構文が通ることと、SOCの検知要件に正しいことは別です（検算済み）。");
  await hold(6);
  await click("#panel-next", { maxHalf: 80 });
  await caption("担当者は、この検索が正しいかを確かめられず、委託先に改修を依頼して待ちます。ここがA社のBeforeです。");
  await hold(4.5);
  await click("#panel-next", { maxHalf: 80 });
  await hold(0.8);
  await ask("生成した検索やAIの出力が「正しいか」を、いまはどなたが、どう確かめていますか？", NOTE);
  await hold(4.5);
  await hideCard();
  await nextScene();

  // ---------- S2
  await sceneCard("S2・要件整理・仮説2　AIへの依頼を社内要件に合わせられない", "日本語の依頼を、AI Hubが社内要件（ログ辞書・検知基準）に基づく依頼文にする", "支援：テックタッチのガイド＋AI Hub（構想・例文）", "AI Hubの回答は、本番前に確かめた例文です。", HUB);
  await caption("検索画面の上のテックタッチ「SOC分析アシスト」から、AI Hub（構想・架空画面）を開きます。");
  await hold(2);
  await click("#chip-soc", { maxHalf: 110 });
  await hold(1);
  await caption("やりたいことを日本語で書きます。SPLの用語は要りません。");
  await click("#hub-fill", { maxHalf: 60 });
  await hold(3);
  await caption("AI Hubが、ログ辞書（KB01）・検知基準（KB02）・承認済み検索（KB03）に照らして、対象・条件・追加条件・確認・分析の分け方に整理します。");
  await click("#hub-send", { maxHalf: 50 });
  await hold(1);
  await scrollToEl(".hub-ans", 90);
  await hold(5);
  await caption("Assistant向けの依頼文に「15分」「10件以上」「異なる失敗user」「同じsrc・同じ管理者user」「失敗の後で成功」が入っています（S2の合格判定）。", "列名と書式を依頼文に書くのは、Assistantがルックアップの列構成を自動で把握するという公式の記載が見当たらないためです。");
  await scrollToEl("#hub-req", 300);
  await hold(6.5);
  await click("#panel-next", { maxHalf: 80 });
  await caption("依頼文をコピーして、次の場面でSplunk AI Assistantに貼ります（AI Hub → Assistant は手動コピー）。");
  await click("#hub-copy", { maxHalf: 80 });
  await hold(2.5);
  await ask("Splunk AI Assistantに何をどう頼むか、御社ではどなたが決めていますか？", HUB);
  await hold(4.5);
  await hideCard();
  await nextScene();

  // ---------- S3
  await sceneCard("S3・SPL生成・確認・仮説2　AIの出力の妥当性を判断できない", "AssistantのSPL案を、AI HubがSOCの業務条件で照合し、修正依頼を作る", "Splunk AI Assistant（Splunkの機能・参考画面）＋ AI Hub（構想・例文）＋ テックタッチの入力チェック（案）", "Assistantの出力は実機ではそのまま使います（特定の失敗を演出しない進行ルール）。", HUB);
  await caption("Splunk AI Assistant（画面イメージ・架空）に、S2の依頼文を貼ります。有償のSplunk Cloudの機能で、トライアル環境では使えません。");
  await click("#g-start", { maxHalf: 120 });
  await hold(0.8);
  await click("#as-paste", { maxHalf: 90 });
  await hold(2.5);
  await caption("送信してSPL案を受け取ります。表示はデモ用の参考画面です。");
  await click("#as-send", { maxHalf: 40 });
  await hold(1);
  await scrollToEl("#as-insert", 560);
  await caption("この案は src ごとの集計だけで、同一ユーザーの判定・前後関係・15分の時間範囲が入っていません。");
  await hold(5);
  await caption("照合の前に「検索に入れる」を押すと、テックタッチの入力チェック（案）が止めます。");
  await click("#as-insert", { maxHalf: 50 });
  await hold(4.5);
  await caption("AI Hub「SOC基準との照合」：構文ではなく、ログ辞書・ユーザー数・同一ユーザー・前後関係・最終検証の5項目で評価し、修正依頼文を作ります。");
  await click("#hub-check", { maxHalf: 110 });
  await hold(0.8);
  await scrollToEl(".hub-tbl", 150);
  await hold(6.5);
  await caption("修正依頼文をAssistantに戻し、再生成します。");
  await click("#hub-copy-fix", { maxHalf: 140 });
  await hold(1);
  await click("#as-send", { maxHalf: 40 });
  await hold(1);
  await scrollToEl("#as-insert2", 560);
  await caption("再生成したSPLは、eventstats・sort・streamstats で同一ユーザーと前後関係を扱います。");
  await hold(5);
  await caption("検索に入れて実行します。固定のテストログで、ケースAだけが残れば合格です。");
  await click("#as-insert2", { maxHalf: 50 });
  await hold(0.8);
  await click("#sp-run", { maxHalf: 20 });
  await moveTo(560, 600, 500);
  await caption("198.51.100.24 ／ admin_ops ／ 09:10:00 の1行だけ。ケースAだけが残りました。", "AI Hubは真偽を断定しません。最終的な正しさはS4でテストケースと照合します。");
  await hold(5.5);
  await ask("AIが作った検索を、御社の検知要件に照らして確かめる工程は、いまありますか？", HUB);
  await hold(4.5);
  await hideCard();
  await nextScene();

  // ---------- S4
  await sceneCard("S4・データ検証・仮説2　検証の方法が無い", "固定のテストログに照らし、ケースA／B／C／Dを区別する", "支援：テックタッチの操作ナビ（案）", "期待値はPythonで検算したものです。Splunk実機での実行は構築時にSEが確かめます。", TT);
  await caption("固定のテストログ（72件・架空）に、承認済みの検索Q1〜Q4を順に実行します。ガイドが、保存済みレポートの場所と順番を案内します。");
  await click("#g-start", { maxHalf: 120 });
  await hold(1);
  await click(NAV("reports"), { maxHalf: 40 });
  await caption("順番を飛ばしてQ2を開くと、ガイドが案内します。");
  await click("#rep-q2", { maxHalf: 120 });
  await hold(3.5);
  await click("#rep-q1", { maxHalf: 120 });
  await hold(0.6);
  await click("#sp-run", { maxHalf: 20 });
  await moveTo(560, 640, 500);
  await caption("Q1：A=36件/9人、B=18件/1人、C=12件/6人、D=4件/3人。Bは18件でも1アカウントです。");
  await hold(5);
  await click(NAV("reports"), { maxHalf: 40 });
  await click("#rep-q2", { maxHalf: 120 });
  await click("#sp-run", { maxHalf: 20 });
  await moveTo(560, 640, 500);
  await caption("Q2：15分・10件以上・異なる5ユーザー以上で、AとCが残ります。");
  await hold(4);
  await click(NAV("reports"), { maxHalf: 40 });
  await click("#rep-q3", { maxHalf: 120 });
  await click("#sp-run", { maxHalf: 20 });
  await moveTo(560, 640, 500);
  await caption("Q3：同じ管理者で、失敗の後に成功。Aだけが残ります。この差が重要です。Cは時刻が逆です。");
  await hold(5.5);
  await click(NAV("reports"), { maxHalf: 40 });
  await click("#rep-q4", { maxHalf: 120 });
  await click("#sp-run", { maxHalf: 20 });
  await moveTo(560, 640, 500);
  await caption("Q4：5分単位の推移。09:05に失敗が集中し、09:10に成功が1件（admin_ops）あります。");
  await hold(4.5);
  await ask("検知条件を変えたとき、正解のテストケースで確かめる仕組みは、いまありますか？", TT);
  await hold(4.5);
  await hideCard();
  await nextScene();

  // ---------- S5
  await sceneCard("S5・可視化・仮説3　作成・修正で止まる", "テックタッチのガイドで、SOC認証監視ダッシュボードを完成させる", "画面：Dashboard Studio（画面イメージ・架空）　支援：操作ナビ＋入力チェック（案）", "保存済みレポートをデータソースにする操作は、実機で確かめます。", TT);
  await caption("ガイド「SOC認証監視ダッシュボードを作る」を開始し、新規ダッシュボードを作ります。");
  await click("#g-start", { maxHalf: 120 });
  await hold(0.8);
  await click("#db-new", { maxHalf: 90 });
  await hold(1);
  await caption("名前の入力チェック（案）：命名規則「チーム_対象_用途」に合わないと、案内します。");
  await typeInto('input[data-id="db-name"]', "SOCダッシュボード");
  await hold(3.5);
  await typeInto('input[data-id="db-name"]', "A社_SOC認証監視_デモ");
  await hold(1.5);
  await click("#db-create", { maxHalf: 80 });
  await hold(1);
  await caption("Q1を棒グラフで。データソースは保存済みレポートです。");
  await choose("#f-ds", 'select[data-id="ds"]', "q1");
  await choose("#f-viz", 'select[data-id="viz"]', "bar");
  await click("#db-add", { maxHalf: 60 });
  await hold(2);
  await caption("Q2とQ3を表で、Q4を折れ線で追加します。");
  await choose("#f-ds", 'select[data-id="ds"]', "q2");
  await choose("#f-viz", 'select[data-id="viz"]', "table");
  await click("#db-add", { maxHalf: 60 });
  await hold(1);
  await choose("#f-ds", 'select[data-id="ds"]', "q3");
  await choose("#f-viz", 'select[data-id="viz"]', "table");
  await click("#db-add", { maxHalf: 60 });
  await hold(1);
  await choose("#f-ds", 'select[data-id="ds"]', "q4");
  await choose("#f-viz", 'select[data-id="viz"]', "line");
  await click("#db-add", { maxHalf: 60 });
  await hold(1.5);
  await caption("共有範囲が「自分だけ」のままだと、案内します（入力チェック・案）。SOCチームの監視に使うため「SOCチーム（アプリ）」にします。");
  await scrollToY(0);
  await choose("#f-db-share", 'select[data-id="db-share"]', "me");
  await hold(4);
  await choose("#f-db-share", 'select[data-id="db-share"]', "team");
  await click("#db-save", { maxHalf: 40 });
  await hold(1);
  await caption("4パネルのダッシュボードを保存しました。今まで委託先に依頼していた定型的な可視化を、担当者自身が進めます。");
  await scrollToEl(".canvas", 180);
  await moveTo(900, 520, 500);
  await hold(5);
  await ask("ダッシュボードの作成・変更は、いま誰が、どの基準で行っていますか？", TT);
  await hold(4.5);
  await hideCard();
  await nextScene();

  // ---------- S6
  await sceneCard("S6・検知・仮説3　検知のチューニングで止まる", "SSEの検知コンテンツを参照し、A社の基準どおりのアラートにする", "画面：Splunk Security Essentials → 検索 → 名前を付けて保存 ＞ アラート　支援：ツールチップ＋入力チェック（案）", "権限（schedule_search）、スケジュール時刻がUTCになる点、SSEの表示は実機で確かめます。", TT);
  await caption("Splunk Security Essentials（SSE）のSecurity Content。Splunk Cloud Platformで使える無料のアプリで、ESの専用機能ではありません。");
  await click("#g-start", { maxHalf: 120 });
  await hold(0.8);
  await click("#sse-item-ps", { maxHalf: 160 });
  await hold(1);
  await caption("必要なログ、Known False Positives（誤検知になりやすい条件）、How to Respond（対応のしかた）を確かめます（Splunkの機能。要約・架空）。");
  await click('[data-id="sse-kfp"]', { maxHalf: 200 });
  await hold(4);
  await caption("A社の検知基準 D-01（KB02・架空）は、テックタッチのツールチップで示します。SSEの一般的な条件と、A社の基準は別です。");
  await click('.tt-q[data-tip="std"]', { maxHalf: 20 });
  await moveTo(900, 420, 400);
  await hold(5);
  await caption("固定CSVの定期実行は、継続的な本番監視になりません。本番はインデックス化された認証イベントを検索します（Q5の骨格）。");
  await scrollToEl("#sse-q5", 320);
  await hold(4.5);
  await click("#panel-next", { maxHalf: 80 });
  await hold(1);
  await caption("検索 → 名前を付けて保存 ＞ アラート。");
  await click("#sp-saveas", { maxHalf: 80 });
  await hold(0.6);
  await click("#sa-alert", { maxHalf: 60 });
  await hold(1);
  await caption("名前（命名規則）と実行の間隔。リアルタイムを選ぶと案内し、定期実行の15分ごとにします（社内基準・架空）。");
  await typeInto('input[data-id="al-name"]', "SOC_認証_失敗後の特権成功");
  await choose("#f-al-sched", 'select[data-id="al-sched"]', "rt");
  await hold(4);
  await choose("#f-al-sched", 'select[data-id="al-sched"]', "15m");
  await hold(1);
  await caption("抑制が空なら案内（同じ src で60分）。通知先が個人宛てなら案内（SOCチームの共有アドレス）。");
  await choose("#f-al-throttle", 'select[data-id="al-throttle"]', "none");
  await hold(3.5);
  await choose("#f-al-throttle", 'select[data-id="al-throttle"]', "60src");
  await choose("#f-al-to", 'select[data-id="al-to"]', "me");
  await hold(3.5);
  await choose("#f-al-to", 'select[data-id="al-to"]', "soc");
  await hold(1);
  await caption("「トリガーされたアラートに追加」を付けて保存します。付けないと一覧に出ず、既定で24時間で消えます（公式の記載）。");
  await choose("#f-al-add", 'select[data-id="al-add"]', "yes");
  await click("#al-save", { maxHalf: 120 });
  await hold(3.5);
  await ask("検知コンテンツを入れた後、自社のログと運用条件に合わせて直す作業は、いま誰が担っていますか？", TT);
  await hold(4.5);
  await hideCard();
  await nextScene();

  // ---------- S7
  await sceneCard("S7・一次調査・仮説4　調査が属人化する", "アラートの結果を、社内の一次調査手順で整理し、上位者へ引き継ぐ", "画面：トリガーされたアラート　支援：AI Hub（P3・KB04）＋テックタッチのチェックリスト（案）", "侵害の成立は推定しません。", HUB);
  await caption("アラート「SOC_認証_失敗後の特権成功」がケースAで発火しました（架空）。トリガーされたアラートから結果を開きます。");
  await click("#g-start", { maxHalf: 120 });
  await hold(0.8);
  await click("#act-row-a", { maxHalf: 60 });
  await hold(3);
  await caption("AI Hub（P3）が、A社の一次調査手順（KB04）に沿って、確認済み事実・追加の確認・判断の進め方・追加SPLの依頼に分けます。");
  await click("#hub-p3", { maxHalf: 110 });
  await hold(0.8);
  await scrollToEl(".hub-win", 140);
  await hold(6.5);
  await caption("テックタッチのチェックリスト。空の項目があると引き継げません（入力チェック・案）。");
  await scrollToEl("#ck-list", 200);
  await click("#ck-handoff", { maxHalf: 80 });
  await hold(4);
  await caption("①②③⑥は確認済み、④正規アクセス・⑤影響範囲は「未確認」のまま残します。未確認を隠さないことが引き継ぎの要点です。");
  await click("#ck-fill", { maxHalf: 60 });
  await hold(4.5);
  await caption("追加検索の依頼文（接続元IPと admin_ops の操作履歴）をAssistantに渡し、上位者へ引き継ぎます。");
  await click("#hub-copy-spl", { maxHalf: 160 });
  await hold(2);
  await click("#ck-handoff", { maxHalf: 80 });
  await hold(3.5);
  await ask("アラートの後の一次調査は、いま手順書どおりに進んでいますか。上位者への引き継ぎは、どの形で残っていますか？", HUB);
  await hold(5);
  await hideCard();
  await nextScene();

  // ---------- S8
  await sceneCard("S8・記録・改善・仮説5　改善が残らない", "記録を残し、改善をナレッジにする。Splunkを入れ替える前に、使いこなす力を高める", "画面：チケット管理（架空）　支援：入力チェック（案）＋AI Hub（P4）", "", HUB);
  await caption("一次調査の記録を、社内のチケット管理（架空）に4項目で残します。空欄があると保存できません（入力チェック・案）。");
  await click("#g-start", { maxHalf: 120 });
  await hold(0.8);
  await click("#rec-save", { maxHalf: 40 });
  await hold(3.5);
  await click("#rec-fill", { maxHalf: 60 });
  await hold(3);
  await click("#rec-save", { maxHalf: 40 });
  await hold(1.5);
  await caption("AI Hub（P4）が、Q3を承認済みテンプレートに足す変更申請の案を作ります。承認者と見直し日を含めます。");
  await click("#hub-p4", { maxHalf: 120 });
  await hold(0.8);
  await scrollToEl(".hub-win", 140);
  await hold(5);
  await click("#imp-ticket", { maxHalf: 90 });
  await hold(1);
  await scrollToY(0);
  await caption("改善チケットを起票。5つの成果物がそろいました。委託先に依頼して待っていた改善が、SOC担当者の手で回り始めます。");
  await moveTo(900, 560, 400);
  await hold(5);
  await ask("検知条件や手順を直したとき、その履歴はいまどこに残っていますか。次の担当者は、それを読めますか？", HUB);
  await hold(5);
  await hideCard();
  await nextScene();

  // ---------- 振り返り
  await caption("振り返り：SOC担当者が、依頼から検索・可視化・検知・調査・改善までを自分で進めました。役割は固定です。");
  await moveTo(1300, 250, 400);
  await hold(6);
  await caption("回数はこのデモを操作した回数で、効果の数値ではありません。確かめ方は、自力完了率・所要時間・依頼件数・検証。精度や削減率の数値はお約束しません。");
  await scrollToEl(".stats", 200);
  await hold(6.5);

  // 最初の一歩・クロージング
  await card(
    '<p class="v-eyebrow">クロージング</p>' +
    '<p class="v-sub">Splunkを別のSIEMに入れ替える前に、既存のSplunkを使いこなす力を高められないか。<br>AI Assistantを残し、AI Hubで自社業務に適合させ、テックタッチで操作と調査を完了する。<br>SOC担当者が自分で改善できる業務の範囲を増やす提案です。</p>' +
    '<p class="v-eyebrow">最初の一歩</p>' +
    '<p class="v-flow"><span>先に確かめる（画面の要素を指せるか・受け渡し・端末・検証環境）</span><span class="arrow">→</span><span>一つの作業で実画面を確かめる</span><span class="arrow">→</span><span>変化を測る</span></p>' +
    '<p class="v-note">' + FIXED_NOTE + "<br>Splunkの画面は、Splunk Cloud Platformの画面イメージを踏襲した架空画面です。Splunk AI AssistantとAI Hubの回答は、デモ用に準備した参考画面・例文です。</p>", { accent: SP });
  await hold(8);

  await browser.close();

  // コマの一覧（表示秒数つき）から MP4 を作る
  const listFile = path.join(FRAMES, "frames.txt");
  const lines = [];
  frames.forEach(([f, sec]) => { lines.push("file '" + f + "'"); lines.push("duration " + sec.toFixed(4)); });
  lines.push("file '" + frames[frames.length - 1][0] + "'");
  fs.writeFileSync(listFile, lines.join("\n"));
  execFileSync(FFMPEG, [
    "-y", "-hide_banner", "-loglevel", "error",
    "-f", "concat", "-safe", "0", "-i", listFile,
    "-vf", "fps=" + FPS + ",format=yuv420p",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-tune", "stillimage",
    "-movflags", "+faststart", OUT
  ], { stdio: "inherit" });
  const total = frames.reduce((a, [, s]) => a + s, 0);
  console.log("frames:", frames.length, "duration(s):", total.toFixed(1), "->", OUT);
}

main().catch((e) => { console.error(e); process.exit(1); });
