// 構想デモ（../index.html）を台本どおりに自動操作して1コマずつ撮影し、MP4（1920×1080、H.264）にまとめる。
//
// 使い方（dynatrace-techtouch-demo/video で実行）:
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

const HTML = "file://" + path.resolve(__dirname, "..", "index.html");
const OUT = process.env.OUT || path.join(__dirname, "dynatrace-techtouch-demo.mp4");
const FRAMES = process.env.FRAMES_DIR || fs.mkdtempSync(path.join(os.tmpdir(), "dttt-frames-"));
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
.overlay { font-size: 14px !important; line-height: 1.55 !important; gap: 8px !important; padding: 12px 16px 14px !important; }
.ov-title { font-size: 16.5px !important; }
.ov-text, .refs { font-size: 12.5px !important; }
.steps.compact li { padding: 1px 8px !important; font-size: 13px !important; }
.soft, .part, .alert { padding: 7px 12px !important; font-size: 13px !important; }
.now-box { font-size: 14px !important; }
.btn { padding: 8px 14px !important; font-size: 14px !important; }
.v-legend { display: flex; flex-wrap: wrap; gap: 8px 24px; font-size: 17px; color: #2f2f4f; }
.v-legend span { display: inline-flex; align-items: center; gap: 8px; }
.v-legend i { width: 16px; height: 16px; border-radius: 4px; display: inline-block; }
.v-journey { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.v-journey div { border: 1px solid #dadbe4; border-radius: 12px; padding: 14px 16px; display: grid; gap: 4px; align-content: start; }
.v-journey .t { font-size: 26px; font-weight: 700; color: #2f2f4f; }
.v-journey b { font-size: 19px; line-height: 1.45; }
.v-journey span { font-size: 15px; color: #595a7d; line-height: 1.5; }
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
.v-inner { max-width: 1120px; width: 100%; display: grid; gap: 18px; padding: 44px 52px; border-left: 8px solid var(--v-accent, #0B7FB5); background: #fff; border-radius: 16px; box-shadow: 0 5px 11px -2px #2d2e4e29, 0 0 0 1px #2d2e4e08; }
.v-eyebrow { font-size: 18px; color: #595a7d; letter-spacing: 0.06em; }
.v-title { font-size: 42px; font-weight: 700; line-height: 1.35; }
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

const FIXED_NOTE = "構想デモ｜画面・サービス名・手順・数値は架空で、実際の製品画面や連携動作を示すものではありません。";

let page;
let frameNo = 0;
const frames = [];
let cur = { x: 1100, y: 640 };

async function snap(sec) {
  await page.evaluate(() => document.fonts.ready.then(() => true));
  const file = path.join(FRAMES, String(frameNo++).padStart(5, "0") + ".png");
  await page.screenshot({ path: file });
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
async function pointOf(sel, maxHalf = 110) {
  return page.evaluate(([s, m]) => {
    const r = document.querySelector(s).getBoundingClientRect();
    return { x: r.left + Math.min(r.width / 2, m), y: r.top + r.height / 2 };
  }, [sel, maxHalf]);
}
async function click(sel, opts = {}) {
  const p = await pointOf(sel, opts.maxHalf);
  await moveTo(p.x, p.y, opts.ms);
  await ripple(() => page.evaluate((s) => document.querySelector(s).click(), sel));
}
async function choose(fieldSel, selectSel, value) {
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
  const r = await page.evaluate((f) => { const b = document.querySelector(f).getBoundingClientRect(); return { x: b.right + 22, y: b.top - 14 }; }, fieldSel);
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
  }, [html, !!opts.dim, opts.accent || "#0B7FB5"]);
}
async function hideCard() {
  await page.evaluate(() => {
    document.getElementById("v-card").hidden = true;
    document.getElementById("v-cursor").style.visibility = "visible";
  });
}
const ask = (q, accent) => card('<span class="v-pill">伺いたいこと</span><p class="v-ask">' + q + "</p>", { dim: true, accent });
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
    '<p class="v-eyebrow">構想デモ</p><p class="v-title">Dynatrace × テックタッチ</p>' +
    '<p class="v-sub">運用担当者の一日（架空）：問い合わせから、再発への備えまで</p>' +
    '<p class="v-text">観測はDynatrace。利用者が迷う画面での介入はテックタッチ。</p>' +
    '<p class="v-legend"><span><i style="background:#fff;border:1px solid #464cce"></i>監視画面（Dynatraceの画面イメージ・架空）</span>' +
    '<span><i style="background:#0B7FB5"></i>テックタッチ ガイド（案）</span><span><i style="background:#6A4C9C"></i>AI Hub 理解支援（構想）</span></p>' +
    '<p class="v-note">' + FIXED_NOTE + "<br>監視画面はDynatraceの画面イメージを踏襲した架空画面です。登場する人物・部署・手順も架空です。</p>");
  await hold(7);

  // 業務の流れの全体像
  await card(
    '<p class="v-eyebrow">今日の業務の流れ（架空）</p><p class="v-title">一つの問い合わせを、業務の流れに沿って進める</p>' +
    '<div class="v-journey">' +
    '<div><span class="t">10:16</span><b>第1章　問い合わせを受けて状況を確認</b><span>デモ①・仮説1</span></div>' +
    '<div><span class="t">10:18</span><b>第2章　障害の一次確認と連絡</b><span>デモ②・仮説4・5</span></div>' +
    '<div><span class="t">14:05</span><b>第3章　再発に備えてダッシュボードを作る</b><span>デモ③・仮説3</span></div>' +
    '<div><span class="t">まとめ</span><b>振り返り</b><span>本日伺いたいこと・最初の一歩</span></div></div>' +
    '<p class="v-note">担当者がDynatraceを使うのは月に数回、という想定の人物像です。</p>');
  await hold(7);

  // 第1章（デモ①）
  await card('<p class="v-eyebrow">第1章・デモ①・仮説1　画面・操作で迷う</p><p class="v-title">10:16　問い合わせを受けて、担当サービスの状況を確認する</p>' +
    '<p class="v-sub">支援：テックタッチのガイド（案）</p><p class="v-note">' + FIXED_NOTE + "</p>", { accent: "#0B7FB5" });
  await hold(4);
  await hideCard();
  await caption("業務部門から「10時過ぎから契約照会の画面が遅い」と連絡が入りました。", "担当者がDynatraceを使うのは月に数回です（想定の人物像）。");
  await hold(5);
  await caption("テックタッチのガイド一覧から「担当サービスの状況を確認する」を選びます。");
  await hold(1.5);
  await click("#g-start", { maxHalf: 120 });
  await hold(1.2);
  await caption("① どの画面を開けばよいかを、Dockの位置で示します。");
  await hold(2.5);
  await click('.dock [data-arg="services"]', { maxHalf: 60 });
  await hold(1.2);
  await caption("② 問い合わせのあったサービスを選びます。");
  await choose("#f-c1-service", "#c1-service", "契約照会サービス（架空）");
  await hold(1.2);
  await caption("③ 問い合わせの「10時過ぎ」に合わせて、時間枠を選びます。");
  await choose("#f-c1-period", "#c1-period", "10:00–10:15");
  await hold(1.2);
  await caption("④ 比べる時間帯を選びます。");
  await choose("#f-c1-compare", "#c1-compare", "09:00–10:00");
  await caption("長さの違う期間を選ぶと、ガイドが選び直しを案内します。", "選び直しの案内は構想の表現です。");
  await hold(4.5);
  await caption("直前の同じ長さ（09:45–10:00）を選び、比較の条件をそろえます。");
  await choose("#f-c1-compare", "#c1-compare", "09:45–10:00");
  await hold(1.2);
  await caption("⑤ 3つの条件を見直してから「適用」を押します。");
  await hold(2);
  await click('[data-act="c1-apply"]', { maxHalf: 40 });
  await hold(1.2);
  await caption("⑥ 平均応答時間が 420 ms から 980 ms に上がっています。「?」で社内の指標の定義（架空）を表示します。");
  await hold(2.5);
  await click('.tt-q[data-arg="rt"]', { maxHalf: 20 });
  await moveTo(900, 330, 400);
  await hold(5);
  await ask("画面の探し方、絞り込み、時間帯の指定のどこで迷いますか？", "#0B7FB5");
  await hold(4.5);
  await hideCard();
  await caption("⑦ 同じ時間帯に検知された問題があります。社内手順の一次確認に切り替えます。");
  await hold(2.5);
  await click('[data-act="c1-problem"]', { maxHalf: 40 });
  await hold(0.6);

  // 第2章（デモ②）
  await card('<p class="v-eyebrow">第2章・デモ②・仮説4・5　実務で再現できない／学びを再利用できない</p><p class="v-title">10:18　障害の一次確認を、社内手順どおりに進めて連絡する</p>' +
    '<p class="v-sub">支援：テックタッチのステップガイド（案）</p><p class="v-note">' + FIXED_NOTE + "<br>社内手順・連絡先は架空です。お客様の実際の手順に置き換える前提です。</p>", { accent: "#0B7FB5" });
  await hold(4);
  await hideCard();
  await caption("問題の画面を開くと、テックタッチのポップアップが社内手順（架空）の一次確認を案内します。");
  await hold(4);
  await click("#m-start", { maxHalf: 120 });
  await hold(1);
  await caption("ステップ1：何が・いつから・どこで起きているかを確認します。");
  await hold(3);
  await click("#panel-next", { maxHalf: 80 });
  await hold(1);
  await caption("影響範囲の前に「ログ」を開くと、社内手順の順番を案内します。", "順番の案内は構想の表現です。");
  await click('[data-act="c2-tab"][data-arg="logs"]', { maxHalf: 20 });
  await hold(4.5);
  await caption("ステップ2：影響範囲を確認します。");
  await click('[data-act="c2-tab"][data-arg="impact"]', { maxHalf: 30 });
  await hold(2);
  await caption("「?」で社内の優先度の基準（架空）を表示します。一部の利用者に影響しているため、優先度は「中」です。");
  await click('.tt-q[data-arg="prio"]', { maxHalf: 20 });
  await moveTo(900, 470, 400);
  await hold(5);
  await caption("ステップ3：関連ログを開きます。吹き出しが、期間の設定値まで示します。");
  await click('[data-act="c2-tab"][data-arg="logs"]', { maxHalf: 20 });
  await hold(2.5);
  await choose("#f-c2-period", "#c2-period", "5min");
  await moveTo(1000, 330, 400);
  await scrollToY(110);
  await caption("問題の開始前（09:58）から、接続待ちの警告が出ていたことを確認します。原因はこの段階では確定しません。", "ログはすべて架空です。");
  await hold(5);
  await caption("ステップ4：「社内手順で連絡」から、優先度・連絡先・伝える内容の例を確認します。");
  await click('[data-act="c2-contact"]', { maxHalf: 50 });
  await moveTo(1085, 620, 400);
  await hold(6);
  await click("#m-done", { maxHalf: 120 });
  await caption("一次確認の4ステップが完了しました。パネルに、確認した内容の記録（例）を表示します。");
  await moveTo(900, 560, 400);
  await hold(4.5);
  await ask("障害時の一次確認で、人によって手順がばらつくのはどこですか？", "#0B7FB5");
  await hold(4.5);
  await hideCard();
  await click("#panel-next", { maxHalf: 80 });
  await hold(0.6);

  // 第3章（デモ③）
  await card('<p class="v-eyebrow">第3章・デモ③・仮説3　作成・修正で止まる</p><p class="v-title">14:05　再発に備えて、ダッシュボードを自分で作る</p>' +
    '<p class="v-sub">支援：テックタッチ＋AI Hub（案・構想）</p><p class="v-note">' + FIXED_NOTE + "<br>AI Hub欄は事前に作成した例文です。</p>", { accent: "#6A4C9C" });
  await hold(4);
  await hideCard();
  await caption("専門家（架空）から、毎朝確認できるダッシュボードを作るよう助言がありました。");
  await hold(4.5);
  await caption("ガイド「ダッシュボードをひな型から作る」を開始します。");
  await click("#g-start", { maxHalf: 120 });
  await hold(1);
  await caption("①② ダッシュボードの画面を開き、「ひな型から作成」を押します。");
  await click('.dock [data-arg="dashboards"]', { maxHalf: 60 });
  await hold(1.5);
  await click('[data-act="c3-create"]', { maxHalf: 60 });
  await hold(0.8);
  await scrollToY(150);
  await caption("③ 専門家が確認済みのひな型から選びます。AI Hub欄が、ひな型の意図を説明します（例文）。");
  await hold(1.5);
  await click('label:has(input[value="t1"])', { maxHalf: 90 });
  await hold(3.5);
  await caption("④ 対象サービスを担当サービスに変えます。AI Hub欄が、変える理由を説明します（例文）。");
  await choose("#f-c3-service", "#c3-service", "契約照会サービス（架空）");
  await hold(3);
  await caption("⑤ 時間枠を「過去 24 時間」に変えます。");
  await choose("#f-c3-range", "#c3-range", "24h");
  await hold(2.5);
  await caption("⑥ 変更箇所は2か所。指標の定義は変えていないことを確認して、結果をプレビューします。");
  await scrollToEl("#c3-changes", 200);
  await hold(3.5);
  await click('[data-act="c3-preview"]', { maxHalf: 60 });
  await hold(0.8);
  await caption("⑦ 10時台の上昇が、第1章で確認した時間帯と合っているかを確かめます。原因はこの画面だけでは特定できません。");
  await scrollToEl("#c3-result", 90);
  await hold(4.5);
  await caption("保存の前に、専門家に確認を依頼します。");
  await scrollToEl('[data-act="c3-ask"]', 420);
  await click('[data-act="c3-ask"]', { maxHalf: 70 });
  await hold(1);
  await caption("専門家から承認の返信が届きました。");
  await moveTo(900, 330, 400);
  await hold(3.5);
  await caption("⑧ 保存して、運用チーム（架空）に共有します。");
  await click('[data-act="c3-save"]', { maxHalf: 50 });
  await hold(0.6);
  await scrollToY(0);
  await caption("保存したダッシュボードを、チームの毎朝の確認に使います。", "デモのため実際には保存していません。");
  await moveTo(900, 560, 400);
  await hold(4.5);
  await ask("ひな型選択、条件の変更、結果の検証のどこで依頼しますか？", "#6A4C9C");
  await hold(4.5);
  await hideCard();
  await click("#panel-next", { maxHalf: 80 });
  await hold(0.6);

  // 振り返り
  await caption("振り返り：問い合わせから再発への備えまでを、一つの業務の流れとして見ました。");
  await moveTo(1300, 250, 400);
  await hold(5);
  await caption("回数はこのデモを操作した回数で、効果の数値ではありません。確かめ方は、自力完了率・所要時間・依頼件数・再実行です。");
  await scrollToY(330);
  await hold(6);

  // 最初の一歩
  await card(
    '<p class="v-eyebrow">最初の一歩</p>' +
    '<p class="v-flow"><span>対象を一つ決める</span><span class="arrow">→</span><span>実画面で確かめる</span><span class="arrow">→</span><span>変化を測る</span></p>' +
    '<p class="v-text">確かめ方：自力完了率・所要時間・依頼件数・再実行。削減率などの数値はお約束しません。</p>' +
    '<p class="v-note">' + FIXED_NOTE + "<br>監視画面はDynatraceの画面イメージを踏襲した架空画面です。</p>");
  await hold(6);

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
