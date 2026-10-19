// ES＋UEBA＋SOAR版（M365アカウントの乗っ取り）のイメージデモ（../index.html）を台本どおりに自動操作して1コマずつ撮影し、MP4（1920×1080、H.264）にまとめる。
//
// 使い方（splunk-es-soar-techtouch-demo/demo/video で実行）:
//   npm install
//   NODE_PATH="$(npm root -g)" FFMPEG=/path/to/ffmpeg node record.js
//   確認だけ（動画を作らず、要所の画像を checks/ に保存）: CHECK=1 NODE_PATH="$(npm root -g)" node record.js
// 必要なもの: Playwright（Chromium）、libx264 を含む ffmpeg。
// 画面はSplunk公式UI部品（React）で組んでいるため、選択欄・文字入力・メニューは実際のマウスとキーボードの操作で動かす。
// 字幕と操作の順番は、このファイル末尾の「台本」を直す。
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright");

const HTML = "file://" + path.resolve(__dirname, "..", "index.html");
const OUT = process.env.OUT || path.join(__dirname, "splunk-es-soar-techtouch-demo.mp4");
const CHECK = !!process.env.CHECK;
const CHECKS = path.join(__dirname, "checks");
const FRAMES = process.env.FRAMES_DIR || fs.mkdtempSync(path.join(os.tmpdir(), "es-frames-"));
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

const TT = "#0B7FB5", HUB = "#6A4C9C", NOTE = "#595a7d", SP = "#1a8929", RED = "#dc4e41";
const VIDEO_CSS = `
:root { --font: Roboto, "Noto Sans JP", sans-serif; --font-demo: "Noto Sans JP", sans-serif; }
.topbar, .foot, .notes, .ask, .disclaimer, .story-tags { display: none !important; }
.wrap { padding-block: 10px 180px !important; gap: 8px !important; }
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
.soft, .part, .alert, .info { padding: 7px 12px !important; font-size: 13px !important; }
.now-box { font-size: 14px !important; }
.btn { padding: 8px 14px !important; font-size: 14px !important; }
.ck-row .dt-field, #f-disp { position: relative; }
.v-legend { display: flex; flex-wrap: wrap; gap: 8px 24px; font-size: 17px; color: #2f2f4f; }
.v-legend span { display: inline-flex; align-items: center; gap: 8px; }
.v-legend i { width: 16px; height: 16px; border-radius: 4px; display: inline-block; }
.v-journey { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
.v-journey div { border: 1px solid #dadbe4; border-radius: 12px; padding: 12px 14px; display: grid; gap: 2px; align-content: start; }
.v-journey .t { font-size: 22px; font-weight: 700; color: #2f2f4f; }
.v-journey b { font-size: 17px; line-height: 1.45; }
.v-journey span { font-size: 13.5px; color: #595a7d; line-height: 1.5; }
.v-chain { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.v-chain li { display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 12px; align-items: start; font-size: 21px; line-height: 1.5; }
.v-chain li b { display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--v-accent, #0B7FB5); color: #fff; font-size: 16px; }
.v-chain li small { display: block; font-size: 15px; color: #595a7d; }
.v-table { width: 100%; border-collapse: collapse; font-size: 18px; }
.v-table th, .v-table td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #dadbe4; vertical-align: top; line-height: 1.5; }
.v-table th { color: #595a7d; font-weight: 600; font-size: 15px; }
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
.v-inner { max-width: 1180px; width: 100%; display: grid; gap: 16px; padding: 40px 52px; border-left: 8px solid var(--v-accent, #0B7FB5); background: #fff; border-radius: 16px; box-shadow: 0 5px 11px -2px #2d2e4e29, 0 0 0 1px #2d2e4e08; }
.v-eyebrow { font-size: 18px; color: #595a7d; letter-spacing: 0.06em; }
.v-title { font-size: 38px; font-weight: 700; line-height: 1.35; }
.v-sub { font-size: 23px; color: #2f2f4f; line-height: 1.6; }
.v-text { font-size: 19px; color: #595a7d; line-height: 1.7; }
.v-note { font-size: 15px; color: #595a7d; border-top: 1px solid #dadbe4; padding-top: 14px; line-height: 1.7; }
.v-pill { justify-self: start; border-radius: 999px; padding: 2px 16px; font-size: 17px; font-weight: 700; color: #fff; background: var(--v-accent, #0B7FB5); }
.v-ask { font-size: 34px; font-weight: 700; line-height: 1.5; }
.v-flow { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; font-size: 25px; font-weight: 700; }
.v-flow span.arrow { color: #595a7d; font-weight: 400; }
.v-menu {
  position: absolute; z-index: 60; top: calc(100% + 4px); left: 0; min-width: 100%;
  background: #fff; border-radius: 6px; box-shadow: 0 5px 11px -2px #2d2e4e29, 0 0 0 1px #2d2e4e14; padding: 4px;
  font-family: var(--font); font-size: 14px;
}
.v-menu div { padding: 7px 10px; border-radius: 4px; white-space: nowrap; color: #2f2f4f; }
.v-menu div.sel { color: #006d9c; font-weight: 500; }
.v-menu div.hl { background: #e1e6eb; }
`;

const FIXED_NOTE = "イメージデモ｜画面・人物・企業名・手順・数値は架空で、実在の事案や、実際の製品画面・連携動作を示すものではありません。";

let page;
let frameNo = 0, checkNo = 0;
const frames = [];
let total = 0;
let cur = { x: 1100, y: 640 };

async function snap(sec) {
  total += sec;
  if (CHECK) return;
  await page.evaluate(() => document.fonts.ready.then(() => true));
  const file = path.join(FRAMES, String(frameNo++).padStart(5, "0") + ".jpg");
  await page.screenshot({ path: file, type: "jpeg", quality: 92 });
  frames.push([file, sec]);
}
// 確認モードでは、字幕が出たまま止まる場面（hold）ごとに画像を残す
async function hold(sec) {
  if (CHECK && sec >= 2.5) await page.screenshot({ path: path.join(CHECKS, String(checkNo++).padStart(3, "0") + ".png") });
  await snap(sec);
}
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const steps = (ms) => (CHECK ? 1 : Math.max(6, Math.round((ms / 1000) * FPS)));

async function moveTo(x, y, ms = 650) {
  const x0 = cur.x, y0 = cur.y, n = steps(ms);
  for (let i = 1; i <= n; i++) {
    const t = ease(i / n);
    await page.evaluate(([px, py]) => {
      const c = document.getElementById("v-cursor");
      c.style.left = px + "px"; c.style.top = py + "px";
    }, [x0 + (x - x0) * t, y0 + (y - y0) * t]);
    await snap(CHECK ? ms / 1000 : 1 / FPS);
  }
  cur = { x, y };
}
async function ripple(action) {
  const n = CHECK ? 3 : 9;
  for (let i = 0; i < n; i++) {
    if (i === 2 && action) await action();
    await page.evaluate(([x, y, k, m]) => {
      const r = document.getElementById("v-ripple");
      r.style.left = x + "px"; r.style.top = y + "px";
      r.style.opacity = String(1 - k / m); r.style.transform = "scale(" + (0.4 + k * 0.1) + ")";
    }, [cur.x, cur.y, i, n]);
    await snap(CHECK ? 0.1 : 1 / FPS);
  }
  await page.evaluate(() => { document.getElementById("v-ripple").style.opacity = "0"; });
}
async function rectOf(sel) {
  const r = await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const b = el.getBoundingClientRect(), pn = document.querySelector("#panel");
    const pl = pn && !pn.hidden && pn.offsetParent ? pn.getBoundingClientRect().left : 1e9;
    return { top: b.top, bottom: b.bottom, left: b.left, width: b.width, height: b.height, h: innerHeight, inPanel: b.left >= pl - 4 };
  }, sel);
  if (!r) throw new Error("見つからない要素: " + sel);
  return r;
}
async function ensureVisible(sel, offset = 260) {
  // 画面の外にある要素は、先に見える位置までスクロールする（右のパネルは字幕と重ならないので下端まで使う）
  const r = await rectOf(sel);
  const margin = r.inPanel ? 24 : 205;
  if (r.top < 80 || r.bottom > r.h - margin) await scrollToEl(sel, Math.min(offset, Math.max(90, r.h - margin - r.height - 20)));
}
async function pointOf(sel, maxHalf = 110) {
  const r = await rectOf(sel);
  return { x: r.left + Math.min(r.width / 2, maxHalf), y: r.top + r.height / 2 };
}
async function click(sel, opts = {}) {
  if (!opts.noScroll) await ensureVisible(sel, opts.offset);
  const p = await pointOf(sel, opts.maxHalf);
  await moveTo(p.x, p.y, opts.ms);
  await ripple(async () => { await page.mouse.click(p.x, p.y); await page.waitForTimeout(80); });
}
// 一時的な目印を付けて、テキストで探した要素を選べるようにする
async function mark(roleSel, text) {
  await page.waitForTimeout(250);
  const ok = await page.evaluate(([rs, t]) => {
    document.querySelectorAll("[data-vmark]").forEach((x) => x.removeAttribute("data-vmark"));
    const el = Array.from(document.querySelectorAll(rs)).filter((e) => e.getBoundingClientRect().height > 0).find((e) => e.textContent.includes(t));
    if (!el) return false;
    el.setAttribute("data-vmark", "1");
    return true;
  }, [roleSel, text]);
  if (!ok) throw new Error("見つからない選択肢: " + text);
  return '[data-vmark="1"]';
}
// Splunk公式UI部品の選択欄（Select）：開いて、選択肢を押す
async function pick(id, label) {
  await click("#f-" + id + " button", { maxHalf: 90 });
  await hold(0.35);
  await click(await mark('[role="option"]', label), { maxHalf: 90, ms: 450, noScroll: true });
  await page.waitForTimeout(120);
}
// メニュー（Dropdown）の項目
async function menu(label) {
  await hold(0.35);
  await click(await mark('[role="menuitem"]', label), { maxHalf: 80, ms: 450, noScroll: true });
}
// Splunk公式UI部品の文字入力（Text）：1文字ずつ入れて、Enterで確定
async function typeText(id, text) {
  const sel = "#f-" + id + " input";
  await click(sel, { maxHalf: 120 });
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Backspace");
  for (const ch of Array.from(text)) { await page.keyboard.insertText(ch); await snap(CHECK ? 0.07 : 0.07); }
  await hold(0.4);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(120);
  const r = await rectOf(sel);
  await moveTo(r.left + Math.min(r.width, 300) + 24, r.top + r.height + 26, 350);
}
// 素の選択欄（チェックリスト）：一覧を描いて、選んだ値で change を起こす
async function choose(id, value) {
  const fieldSel = "#f-" + id, selectSel = 'select[data-id="' + id + '"]';
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
  const r = await rectOf(fieldSel);
  await moveTo(r.left - 30, r.top + r.height + 18, 350);
}
async function scrollToY(y, ms = 800) {
  const [y0, maxY] = await page.evaluate(() => [scrollY, document.documentElement.scrollHeight - innerHeight]);
  const target = Math.max(0, Math.min(maxY, y)), n = steps(ms);
  if (Math.abs(target - y0) < 2) return;
  for (let i = 1; i <= n; i++) {
    await page.evaluate((v) => window.scrollTo(0, v), y0 + (target - y0) * ease(i / n));
    await snap(CHECK ? ms / 1000 : 1 / FPS);
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
  await hold(4.5);
  await hideCard();
}
async function next() { await click("#panel-next", { maxHalf: 80 }); await hold(0.6); }
async function sceneEnd(q, accent) {
  await ask(q, accent);
  await hold(4.5);
  await hideCard();
  await next();
}
const expectText = async (sel, text) => {
  const t = await page.evaluate((s) => (document.querySelector(s) || {}).textContent || "", sel);
  if (!t.includes(text)) throw new Error("想定と違う表示: " + sel + " に「" + text + "」が無い（" + t.slice(0, 80) + "）");
};

async function main() {
  if (CHECK) { fs.rmSync(CHECKS, { recursive: true, force: true }); fs.mkdirSync(CHECKS, { recursive: true }); }
  const browser = await chromium.launch();
  page = await browser.newPage({ viewport: VIEW, deviceScaleFactor: SCALE, colorScheme: "light", reducedMotion: "reduce", locale: "ja-JP" });
  page.on("pageerror", (e) => console.error("pageerror:", e.message));
  await page.goto(HTML + "#s1");
  await page.waitForTimeout(400);
  await page.evaluate(([links, css]) => {
    document.documentElement.setAttribute("data-theme", "light");
    links.forEach((href) => { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); });
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    document.body.insertAdjacentHTML("beforeend",
      '<div id="v-caption" hidden></div><div id="v-card" hidden></div><div id="v-ripple"></div>' +
      '<svg id="v-cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2v18l4.6-4.4 3.1 6.9 2.9-1.3-3.1-6.8H18z" fill="#fff" stroke="#111122" stroke-width="1.5" stroke-linejoin="round"/></svg>');
    window.dispatchEvent(new Event("resize"));
  }, [fontLinks(), VIDEO_CSS]);
  await page.waitForTimeout(500);
  await page.evaluate(() => document.fonts.ready.then(() => true));

  /* ==================== 台本 ==================== */
  // 表紙
  await card(
    '<p class="v-eyebrow">イメージデモ</p><p class="v-title">Splunk ES＋UEBA＋SOAR × テックタッチ（DAP＋AI Hub）<br>M365アカウントの乗っ取りへの対応を、社内で回す</p>' +
    '<p class="v-sub">架空のA社SOC：ES・UEBA・SOARは導入済み、夜間監視は委託先。M365アカウントの乗っ取りを、SOC担当者が検知から封じ込め・範囲の確定・記録・改善まで進める</p>' +
    '<p class="v-text">ログの相関と調査画面はES、行動の異常はUEBA、自動対応はSOAR、検索案はSplunk AI Assistant。社内の基準・手順・権限と次の行動はAI Hub、手順の抜け漏れ防止と入力チェックはテックタッチ。</p>' +
    '<p class="v-legend"><span><i style="background:#fff;border:1px solid ' + SP + '"></i>Splunk（ES・SOAR）の画面イメージ（架空）</span>' +
    '<span><i style="background:' + TT + '"></i>テックタッチ ガイド（案）</span><span><i style="background:' + HUB + '"></i>AI Hub（構想・例文）</span><span><i style="background:#ebecf0;border:1px solid #595a7d"></i>社内（架空）</span></p>' +
    '<p class="v-note">' + FIXED_NOTE + "<br>どの組織でも起きうる一般的な事案の型を題材にしたもので、特定の企業や事案を題材にしたものではありません。画面はSplunk公式のUIツールキット（Apache-2.0）で組んだ画面イメージで、ES・UEBA・SOARの実画面ではありません。Splunk AI AssistantとAI Hubの回答は、デモ用に準備した参考画面・例文です。接続元IPとASNは文書用の番号（RFC 5737・RFC 5398）です。</p>", { accent: SP });
  await hold(9);

  // 仮説
  await card(
    '<p class="v-eyebrow">このデモが置く仮説（一般的な事案の型）</p><p class="v-title">ツールはそろっている。止まるのは、ノータブルの後</p>' +
    '<ol class="v-chain">' +
    "<li><b>1</b><span>取引先を装ったメールのリンクからサインインし、セッションを盗まれる（AiTM型フィッシングの想定）<small>入口（フィッシング）の防止は、このデモでは扱いません</small></span></li>" +
    "<li><b>2</b><span>深夜、普段と違う国・ASNからサインインし、60分以内に外部への転送ルールを作り、ファイルを大量にダウンロードし、社内へリンク付きメールを送る</span></li>" +
    "<li><b>3</b><span>UEBAのノータブルは出る。しかし「本人の利用か」を確かめる手順と担当が社内に無く、委託先の問い合わせ待ちで止まる</span></li>" +
    "<li><b>4</b><span>封じ込めの承認者が決まっておらず、範囲の確定も委託先の分析待ちになる</span></li></ol>" +
    '<p class="v-note">速く気づき、社内で止め、範囲を確定し、記録する。そこまでを、入っているSplunkとテックタッチで社内に置くデモです。委託先を外す話ではありません。</p>', { accent: RED });
  await hold(11);

  // 全体像
  await card(
    '<p class="v-eyebrow">デモの流れ（36分版の9場面。動画は要約）</p><p class="v-title">一つの事案を、SOC担当者が最後まで進める</p>' +
    '<div class="v-journey">' +
    '<div><span class="t">S0</span><b>現場の問題</b><span>ノータブルの後の判断・承認・記録が社内に無い</span></div>' +
    '<div><span class="t">S1</span><b>Before</b><span>UEBAの異常が委託先待ちで4時間</span></div>' +
    '<div><span class="t">S2</span><b>要件整理</b><span>AI Hubが依頼を検知基準D-02にする</span></div>' +
    '<div><span class="t">S3</span><b>相関検索・照合</b><span>Assistantの案をAI Hubが照合</span></div>' +
    '<div><span class="t">S4</span><b>検証・保存</b><span>テストログで検証し、相関検索に</span></div>' +
    '<div><span class="t">S5</span><b>一次対応</b><span>担当者を自分に。本人・上長に確認</span></div>' +
    '<div><span class="t">S6</span><b>封じ込め</b><span>SOARを承認段階どおりに実行</span></div>' +
    '<div><span class="t">S7</span><b>範囲確定・記録</b><span>操作の範囲と他アカウントを確定し記録</span></div>' +
    '<div><span class="t">S8</span><b>改善</b><span>ナレッジと委託先との役割分担</span></div>' +
    '<div><span class="t">まとめ</span><b>振り返り</b><span>確かめ方・伺いたいこと・最初の一歩</span></div></div>' +
    '<p class="v-note">AI Hubは、S2〜S8の7場面で社内のナレッジ（KB01〜KB08）と照合します。</p>', { accent: TT });
  await hold(9);

  // ---------- S0
  await sceneCard("S0・現場の問題", "ES・UEBA・SOARは入っている。しかしノータブルの後、社内が動けない", "画面：社内ポータル（架空）", "", NOTE);
  await caption("架空のA社SOCは、ES・UEBA・SOARを導入済み。夜間の監視は委託先です。先週、M365アカウントのノータブルが委託先待ちで4時間止まりました。");
  await hold(5);
  await click("#i-card", { maxHalf: 160 });
  await caption("SOC責任者の依頼：検知から封じ込め・範囲の確定・記録まで、社内で回せるようにしてほしい。");
  await hold(5);
  await click("#i-flow", { maxHalf: 70 });
  await caption("いまは、ノータブル → 委託先の問い合わせ → A社の確認待ち → 承認者を探す → 封じ込め。待ち時間は社内で把握できていません（架空）。");
  await hold(5.5);
  await click("#i-goal", { maxHalf: 70 });
  await caption("デモの終わりに残す5つの成果物：相関検索、一次対応のチェックリスト、封じ込めの承認段階、範囲の確定と記録、役割分担。");
  await hold(5);
  await click("#panel-next", { maxHalf: 80 });
  await hold(0.8);
  await sceneEnd("ノータブルやアラートの後の一次対応は、いまは委託先のチケットを待つ形になっていますか？", NOTE);

  // ---------- S1
  await sceneCard("S1・Before・仮説1　ノータブルの後の判断が社内に無い", "UEBAの異常は出ている。しかし本人確認の手順も封じ込めの承認も、社内に無い", "画面：ES Incident Review → 委託先チケット → 検索（いずれも画面イメージ・架空）", "件数だけの検索は意図的に条件を省いた教材で、Splunk AI Assistantの実際の出力ではありません。", NOTE);
  await caption("ESのIncident Review。02:20にUEBAのノータブルが出ていますが、06:30まで担当者は未割当のままです（架空）。");
  await click("#g-start", { maxHalf: 120 });
  await hold(4);
  await click("#ir-row-ueba", { maxHalf: 140 });
  await hold(1);
  await caption("UEBAの異常は、普段と違う国からのサインイン、普段と違う時間帯、初めての外部転送ルール、平常の60倍超のダウンロード。異常スコアは85です。", "UEBAは「普段と違う」を出します。「出張中か」「本人の操作か」は、社内の人が確かめる仕事です。");
  await scrollToEl("#ir-anom", 150);
  await hold(7);
  await click("#panel-next", { maxHalf: 80 });
  await caption("夜間の委託先は「出張中の可能性あり。A社の確認待ち」とチケットを起票。封じ込めは何もされていません。", "委託先は悪くありません。「本人の利用か」を確かめる手順と「止める承認」が、社内に無いことが問題です。");
  await hold(7);
  await click("#panel-next", { maxHalf: 80 });
  await caption("担当者は、ダウンロードが500件以上のアカウントを数えるだけの検索で確かめようとします（教材）。");
  await hold(4);
  await click("#sp-run", { maxHalf: 20 });
  await moveTo(560, 560, 500);
  await caption("B・D・Aの3件が残りました。Bは申請済みのサイト移行、Dは申請済みの委託先の移行作業です。", "件数だけでは、正当な作業と区別できません。前後関係・外部への転送ルール・申請の例外が足りません（検算済み）。");
  await scrollToEl(".sp-results", 140);
  await hold(7);
  await sceneEnd("UEBAやESのノータブルが出たとき、「本人の利用か」を誰がどう確かめていますか？", NOTE);

  // ---------- S2
  await sceneCard("S2・要件整理・仮説2　検知条件を社内で決められない", "日本語の依頼を、AI Hubが社内基準D-02（ログ辞書・検知基準・例外）に基づく依頼文にする", "支援：テックタッチのガイド＋AI Hub（構想・例文）", "AI Hubの回答は、本番前に確かめた例文です。", HUB);
  await caption("ESの検索画面の上のテックタッチ「SOC分析アシスト」から、AI Hub（構想・架空画面）を開きます。");
  await hold(2.5);
  await click("#chip-soc", { maxHalf: 120 });
  await hold(1);
  await caption("やりたいことを日本語で書きます。「普段と違う場所からのサインインの後、外部への転送ルールと大量ダウンロードがあったらノータブルにしたい」。");
  await click("#hub-fill", { maxHalf: 60 });
  await hold(4);
  await caption("AI Hubが、ログ辞書（KB01）・検知基準D-02（KB02）・承認済み検索（KB03）に照らして、対象・条件・例外・確認・分析の分け方に整理します。");
  await click("#hub-send", { maxHalf: 50 });
  await hold(1);
  await scrollToEl(".hub-ans", 90);
  await hold(6);
  await caption("Assistant向けの依頼文に「普段と違う接続元」「60分以内」「外部への転送ルール」「ダウンロード500件以上」「申請番号があれば除外」が入っています（S2の合格判定）。", "列名と書式を書くのは、Assistantがルックアップの列構成を自動で把握するという公式の記載が見当たらないためです。");
  await scrollToEl("#hub-req", 300);
  await hold(7);
  await click("#panel-next", { maxHalf: 80 });
  await caption("依頼文をコピーして、次の場面でSplunk AI Assistantに貼ります（AI Hub → Assistant は手動コピー）。");
  await click("#hub-copy", { maxHalf: 80 });
  await hold(3);
  await sceneEnd("M365など自社のクラウドサービスの検知条件を変えるとき、社内で完結していますか？", HUB);

  // ---------- S3
  await sceneCard("S3・相関検索案・照合・仮説2　AIの出力の妥当性を判断できない", "AssistantのSPL案を、AI Hubが検知基準D-02（外部転送ルール・例外）で照合し、修正依頼を作る", "Splunk AI Assistant（Splunkの機能・参考画面）＋ AI Hub（構想・例文）＋ テックタッチの入力チェック（案）", "Assistantの出力は実機ではそのまま使います（特定の失敗を演出しない進行ルール）。", HUB);
  await caption("Splunk AI Assistant（画面イメージ・架空）に、S2の依頼文を貼ります。有償のSplunk Cloudの機能で、トライアル環境では使えません。");
  await click("#g-start", { maxHalf: 120 });
  await hold(0.8);
  await click("#as-paste", { maxHalf: 90 });
  await hold(3);
  await caption("送信してSPL案を受け取ります。表示はデモ用の参考画面です。");
  await click("#as-send", { maxHalf: 40 });
  await hold(1);
  await scrollToEl("#as-insert", 560);
  await caption("この案は、普段と違う接続元・60分の窓・ダウンロード件数は扱えていますが、外部への転送ルールの条件と、申請番号による除外が入っていません。");
  await hold(5.5);
  await caption("照合の前に「検索に入れる」を押すと、テックタッチの入力チェック（案）が止めます。");
  await click("#as-insert", { maxHalf: 50 });
  await hold(4.5);
  await caption("AI Hub「D-02との照合」：構文ではなく、ログ辞書・普段と違う接続元・60分の窓・外部転送ルール・例外・最終検証の6項目で評価し、修正依頼文を作ります。");
  await click("#hub-check", { maxHalf: 110 });
  await hold(0.8);
  await scrollToEl(".hub-tbl", 150);
  await hold(7);
  await caption("修正依頼文をAssistantに戻し、再生成します。");
  await click("#hub-copy-fix", { maxHalf: 140 });
  await hold(1);
  await click("#as-send", { maxHalf: 40 });
  await hold(1);
  await scrollToEl("#as-insert2", 560);
  await caption("再生成したSPLは、external_rules と isnull(request_id) で、外部への転送ルールと申請済みの例外を扱います。");
  await hold(5);
  await caption("検索に入れて実行します。固定のテストログで、ケースAだけが残れば合格です。");
  await click("#as-insert2", { maxHalf: 50 });
  await hold(0.8);
  await click("#sp-run", { maxHalf: 20 });
  await scrollToEl(".sp-results", 160);
  await moveTo(560, 520, 500);
  await caption("s.tanaka ／ 198.51.100.77 ／ ダウンロード1,200件・転送ルール1・社内送信380・申請なしの1行だけ。ケースAだけが残りました。", "AI Hubは真偽を断定しません。最終的な正しさはS4でテストケースと照合します。");
  await hold(6);
  await sceneEnd("AIが作った検索を、御社の検知基準に照らして確かめる工程は、いまありますか？", HUB);

  // ---------- S4
  await sceneCard("S4・検証・相関検索の保存・仮説2・3", "テストログでA／B／C／Dを区別し、ESの相関検索として保存する", "画面：Content Management → 検索 → 相関検索の作成　支援：操作ナビ＋入力チェック（案）", "期待値はPythonで検算したものです。ES実機での相関検索の作成（画面・権限・項目名）は、構築時にSEが確かめます。", TT);
  await caption("固定のテストログ（39件・架空）に、承認済みの検索Q1〜Q3を順に実行します。ガイドが、場所と順番を案内します。");
  await click("#g-start", { maxHalf: 120 });
  await hold(1);
  await click("#nav-cm", { maxHalf: 60 });
  await caption("順番を飛ばしてQ2を開くと、ガイドが案内します。");
  await click("#rep-q2", { maxHalf: 140 });
  await hold(3.5);
  await click("#rep-q1", { maxHalf: 140 });
  await hold(0.6);
  await click("#sp-run", { maxHalf: 20 });
  await scrollToEl(".sp-results", 160);
  await moveTo(560, 560, 500);
  await caption("Q1：普段と違う接続元からのサインインは3件（C 出張先、D 委託先の移行作業、A 深夜）。Aだけではありません。");
  await hold(5);
  await click("#nav-cm", { maxHalf: 60 });
  await click("#rep-q2", { maxHalf: 140 });
  await click("#sp-run", { maxHalf: 20 });
  await scrollToEl(".sp-results", 160);
  await moveTo(560, 560, 500);
  await caption("Q2：サインイン後60分の操作。D 2,000件・転送ルール1（申請 CHG-2026-1004 あり）、A 1,200件・転送ルール1・送信380、C 12件。");
  await hold(5.5);
  await click("#nav-cm", { maxHalf: 60 });
  await click("#rep-q3", { maxHalf: 140 });
  await click("#sp-run", { maxHalf: 20 });
  await scrollToEl(".sp-results", 160);
  await moveTo(560, 560, 500);
  await caption("Q3：外部転送ルールあり・500件以上・申請なし。Aだけが残ります。これを検知基準D-02の相関検索にします。");
  await hold(5.5);
  await caption("Content Management ＞ 新規コンテンツの作成 ＞ 相関検索（ESの機能）。");
  await click("#nav-cm", { maxHalf: 60 });
  await hold(0.6);
  await click("#cm-new", { maxHalf: 90 });
  await menu("相関検索");
  await hold(1);
  await caption("名前の入力チェック（案）：命名規則「SOC_対象_用途」に合わないと、案内します。");
  await typeText("cs-name", "乗っ取り検知");
  await hold(3.5);
  await typeText("cs-name", "SOC_M365_乗っ取り_D-02");
  await hold(1);
  await caption("実行間隔でリアルタイムを選ぶと案内し、定期実行の15分ごとにします（社内基準・架空）。");
  await pick("cs-sched", "リアルタイム");
  await hold(3.5);
  await pick("cs-sched", "15分ごと");
  await hold(1);
  await caption("リスクスコアはD-02の80（リスクオブジェクトは user）、ノータブルの緊急度は「高」。違う値なら案内します。");
  await pick("cs-risk", "リスクスコア 50");
  await hold(3.5);
  await pick("cs-risk", "リスクスコア 80");
  await pick("cs-urg", "緊急度：高");
  await hold(1);
  await caption("抑制が空なら案内します。同じ user で60分抑制して、保存します。");
  await pick("cs-throttle", "抑制しない");
  await hold(3.5);
  await pick("cs-throttle", "同じ user で60分");
  await click("#cs-save", { maxHalf: 30 });
  await hold(1);
  await scrollToY(0);
  await caption("相関検索「SOC_M365_乗っ取り_D-02」を保存しました。委託先に頼まずに、検知ルールを社内で足せる姿です。");
  await moveTo(700, 420, 400);
  await hold(5);
  await sceneEnd("検知条件を変えたとき、正解のテストケースで確かめる仕組みと、社内で相関検索を保存できる権限は、いまありますか？", TT);

  // ---------- S5
  await sceneCard("S5・一次対応・仮説4　一次対応が委託先待ちで止まる", "ノータブルを自分の担当にし、AI Hubの手順で事実と未確認を分け、本人と上長に確かめる", "画面：ES Incident Review　支援：AI Hub（P3・KB04）＋社内チャット＋テックタッチのチェックリスト（案）", "侵害の範囲は推定しません。", HUB);
  await caption("相関検索D-02がケースAで発火。UEBAの異常85と合わせて、リスクスコア165・緊急度「高」のノータブルになりました（架空）。");
  await click("#g-start", { maxHalf: 120 });
  await hold(1);
  await click("#ir-row-d02", { maxHalf: 160 });
  await hold(4.5);
  await caption("最初の一歩は「担当者を自分にする」。状態が「進行中」になり、誰が対応しているかが残ります。");
  await click("#ir-own", { maxHalf: 80 });
  await hold(3.5);
  await caption("AI Hub（P3）が、A社の一次調査手順（KB04：M365アカウント）に沿って、確認済み事実・追加の確認・本人と上長への確認文・判断の進め方に分けます。");
  await click("#hub-p3", { maxHalf: 110 });
  await hold(0.8);
  await scrollToEl(".hub-win", 120);
  await hold(7);
  await caption("AI Hubが作った確認文を、社内チャットで上長に送ります。本人には、メールではなく電話で確かめます（メールボックスが乗っ取られている可能性）。");
  await click("#hub-ask-hr", { maxHalf: 140 });
  await hold(3.5);
  await click("#hr-reply", { maxHalf: 80 });
  await scrollToEl(".hr-chat", 200);
  await caption("上長の回答：出張の予定はありません。本人は深夜に利用しておらず、前日に取引先を名乗るメールのリンクからサインインしたそうです。");
  await hold(6);
  await caption("テックタッチのチェックリスト。空の項目があると、封じ込めに進めません（入力チェック・案）。");
  await click("#ck-escalate", { maxHalf: 80 });
  await hold(4);
  await caption("①〜⑤は確認済み、⑥入口の裏付け・⑦影響範囲は「未確認」のまま残します。未確認を隠さないことが要点です。");
  await click("#ck-fill", { maxHalf: 60 });
  await hold(4.5);
  await caption("判定区分で「正当な利用」を選ぶと案内します。回答は「出張なし・深夜の利用なし」です。");
  await choose("disp", "legit");
  await hold(4.5);
  await caption("区分の定義は「?」で確かめられます。本人・上長が利用を否定し、外部への転送ルールがあるため「要対応」として、封じ込めへ進みます（KB04）。");
  await click('.tt-q[data-tip="disp"]', { maxHalf: 20 });
  await hold(4.5);
  await choose("disp", "tp");
  await click("#ck-escalate", { maxHalf: 80 });
  await hold(3);
  await sceneEnd("ノータブルの後、「本人の利用か」を本人や上長に確かめる手順は、誰が、どの形で持っていますか？", HUB);

  // ---------- S6
  await sceneCard("S6・封じ込め・仮説5　承認が取れず、乗っ取りが続く", "SOARのプレイブックを、社内の承認段階（KB06）どおりに動かす", "画面：Splunk SOAR（画面イメージ・架空）　支援：AI Hub（P5・KB06）＋入力チェック（案）", "SOARの画面は公式UI部品で組んだ画面イメージです。プレイブックの実行と承認の実装は、SOAR実機で確かめます。", HUB);
  await caption("SOARのプレイブック「M365_乗っ取り_封じ込め」。AI Hub（P5）が対応権限表（KB06）と照合します。");
  await click("#g-start", { maxHalf: 120 });
  await hold(1);
  await click("#hub-p5", { maxHalf: 120 });
  await hold(1);
  await caption("対象 s.tanaka は例外アカウントではない。①セッション失効・②転送ルールの無効化とパスワードリセットは即時、③アカウント停止はSOC責任者、④テナント全体の外部自動転送の禁止はCSIRT責任者。");
  await scrollToEl(".hub-win", 110);
  await hold(8);
  await caption("実行範囲で「①〜④」を選ぶと案内します。④は全社の業務に影響するため、CSIRT責任者の判断です。いまは判断材料を渡す段階です。");
  await pick("pb-scope", "①〜④");
  await hold(4.5);
  await pick("pb-scope", "①〜③");
  await hold(1);
  await caption("承認チケット番号が空のまま「実行」を押すと、止めます（入力チェック・案）。");
  await click("#pb-run", { maxHalf: 30 });
  await hold(4);
  await caption("③アカウント停止の、SOC責任者の承認チケット番号を入れます。承認の記録がプレイブックの入力に残ります。");
  await typeText("pb-ticket", "APV-2026-1006-01");
  await hold(2);
  await click('.tt-q[data-tip="auth"]', { maxHalf: 20 });
  await hold(4.5);
  await caption("実行します。①②は即時に成功し、③は承認待ちになります。");
  await click("#pb-run", { maxHalf: 30 });
  await hold(4);
  await caption("SOC責任者が承認します（デモでは同じ画面のボタンで代用）。③アカウント停止が実行され、攻撃者の操作が止まります。", "SOARがあっても「誰の承認で何を止めるか」が決まっていなければ動きません。その部分を社内に置きます。");
  await click("#pb-approve", { maxHalf: 120 });
  await hold(6.5);
  await sceneEnd("SOARのプレイブックが「いつ・何を・誰の承認で」動くかを、社内の担当者が説明できますか？", HUB);

  // ---------- S7
  await sceneCard("S7・範囲の確定・記録・仮説6　範囲の確定が委託先の分析待ち", "乗っ取られた間の操作を確定し、他アカウントへの広がりを確かめ、記録を4項目で残す", "Splunk AI Assistant ＋ AI Hub（P6・P7・KB07）＋ テックタッチの入力チェック（案）", "通知と報告の要否は、法務とCSIRTが判断します。SOCは、その判断材料を速くそろえます。", HUB);
  await caption("AI Hub（P6）が、承認済み検索（KB03）を対象アカウント・接続元に当てはめた依頼文を作ります。");
  await click("#g-start", { maxHalf: 120 });
  await hold(1);
  await click("#hub-p6", { maxHalf: 120 });
  await hold(3.5);
  await caption("依頼文をSplunk AI Assistantに渡すと、範囲確定の検索案（Q4a・Q4b）が返ります。");
  await click("#hub-copy-scope", { maxHalf: 100 });
  await hold(1);
  await click("#as-insert-q4a", { maxHalf: 70 });
  await hold(0.6);
  await click("#sp-run", { maxHalf: 20 });
  await scrollToEl(".sp-results", 160);
  await moveTo(560, 560, 500);
  await caption("Q4a：乗っ取られた間の操作は、外部への転送ルール1件、営業部サイトからのダウンロード1,200件（社外秘 840・一般 360）、社内380名へのリンク付きメール。");
  await hold(7);
  await click("#as-insert-q4b", { maxHalf: 70 });
  await hold(0.6);
  await click("#sp-run", { maxHalf: 20 });
  await scrollToEl(".sp-results", 160);
  await moveTo(560, 560, 500);
  await caption("Q4b：同じ接続元から、他のアカウントへのサインインや操作は0件。", "0件は「この範囲では確認されない」です。リンクを開いた社員のアカウントは、未確認として記録します。");
  await hold(7);
  await caption("AI Hub（P7）が、通知・報告の判断材料（KB07）を確認済みと未確認に分けて整理します。報告の要否は判断しません。");
  await click("#hub-p7", { maxHalf: 140 });
  await hold(0.8);
  await scrollToEl("#rec-open", 520);
  await hold(7);
  await click("#rec-open", { maxHalf: 120 });
  await hold(0.8);
  await caption("記録は4項目（事象・確認済み・未確認・対応）。空欄のまま保存すると止めます（入力チェック・案）。");
  await click("#rec-save", { maxHalf: 40 });
  await hold(4);
  await click("#rec-fill", { maxHalf: 60 });
  await hold(4.5);
  await click("#rec-save", { maxHalf: 40 });
  await caption("記録を保存しました。法務・CSIRTは、この記録をもとに通知と報告の要否を判断します。");
  await hold(4.5);
  await sceneEnd("乗っ取られたアカウントで「いつ・何が・どこまで行われたか」を、いまは誰が、どれくらいで確定できますか？", HUB);

  // ---------- S8
  await sceneCard("S8・改善・仮説7　改善が残らず、同じ構造が繰り返される", "検知条件・承認段階・記録をナレッジにし、委託先との役割分担を書き換える", "画面：社内ポータル（架空）　支援：AI Hub（P4・P8・KB08）", "委託先を外す話ではありません。", HUB);
  await caption("AI Hub（P4）が、ナレッジへの反映候補を作ります。D-02をKB03へ、事例をKB05へ、承認SLAをKB06へ。外部自動転送の既定やMFAの方式は要望として分けます。");
  await click("#g-start", { maxHalf: 120 });
  await hold(1);
  await click("#hub-p4", { maxHalf: 120 });
  await hold(0.8);
  await scrollToEl(".hub-win", 120);
  await hold(7.5);
  await caption("AI Hub（P8）が、委託先との役割分担（KB08）の書き換え案を作ります。夜間監視・高度な分析は委託先、判断・承認・記録・ルール変更は社内。");
  await click("#hub-p8", { maxHalf: 140 });
  await hold(0.8);
  await scrollToEl('[aria-label^="AI Hub：委託先"]', 110);
  await hold(8);
  await click("#imp-ticket", { maxHalf: 90 });
  await hold(1);
  await scrollToY(0);
  await caption("改善チケットを起票。5つの成果物がそろいました。事案の時に社内が判断し・動き・記録できる範囲が広がりました。");
  await moveTo(900, 560, 400);
  await hold(5.5);
  await sceneEnd("過去の事案の調査記録と判断理由は、社内が読める場所にありますか。委託先のチケットにしかありませんか？", HUB);

  // ---------- 振り返り
  await expectText("#story h1", "振り返り");
  await caption("振り返り：SOC担当者が、検知条件の社内化から一次対応・封じ込め・範囲の確定・記録・改善までを進めました。役割は固定です。");
  await moveTo(1300, 250, 400);
  await hold(6.5);
  await caption("回数はこのデモを操作した回数で、効果の数値ではありません。確かめ方は、封じ込めまでの時間・範囲確定までの時間・委託先への依頼件数・社内で完結したルール変更の件数。");
  await scrollToEl(".stats", 200);
  await hold(7);

  // 言ってはいけないこと
  await card(
    '<p class="v-eyebrow">お客様の前で守ること</p><p class="v-title">言わないこと</p>' +
    '<table class="v-table"><tr><th>言わない</th><th>代わりに</th></tr>' +
    "<tr><td>他社の事案への言及、原因の決めつけ</td><td>一般的な事案の型と、御社の運用の話に絞る</td></tr>" +
    "<tr><td>「委託先に依存した結果」</td><td>「社内に残る判断・記録を増やす」</td></tr>" +
    "<tr><td>「テックタッチがあれば防げた」</td><td>入口はDAPの範囲外。速く気づき、社内で止め、範囲を確定し、記録するまで</td></tr>" +
    "<tr><td>削減率・検知精度の数値、Assistantの精度向上</td><td>一つの作業で、時間と件数を測って確かめる</td></tr></table>", { accent: RED });
  await hold(10);

  // クロージング
  await card(
    '<p class="v-eyebrow">クロージング</p>' +
    '<p class="v-sub">委託先を外す話ではありません。ES・UEBA・SOARはそのまま、事案の時に社内が判断し・動き・記録できる範囲を広げる話です。<br>AI Assistantで検索を作り、AI Hubで社内の基準・手順・権限と照合し、テックタッチで操作と入力を完了します。</p>' +
    '<p class="v-eyebrow">最初の一歩</p>' +
    '<p class="v-flow"><span>先に確かめる（ESの構成・SOCの体制・端末の条件）</span><span class="arrow">→</span><span>一次対応か封じ込めの一つを実画面で確かめる</span><span class="arrow">→</span><span>変化を測る</span></p>' +
    '<p class="v-note">' + FIXED_NOTE + "<br>画面はSplunk公式のUIツールキットで組んだ画面イメージで、ES・UEBA・SOARの実画面ではありません。Splunk AI AssistantとAI Hubの回答は、デモ用に準備した参考画面・例文です。</p>", { accent: SP });
  await hold(9);

  await browser.close();
  console.log("duration(s):", total.toFixed(1), "(", Math.floor(total / 60) + ":" + String(Math.round(total % 60)).padStart(2, "0"), ")");
  if (CHECK) { console.log("checks:", checkNo, "->", CHECKS); return; }

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
    "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-tune", "stillimage",
    "-movflags", "+faststart", OUT
  ], { stdio: "inherit" });
  console.log("frames:", frames.length, "->", OUT);
}

main().catch((e) => { console.error(e); process.exit(1); });
