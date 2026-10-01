// 会議資料のデモ①〜③（p.11〜13）に貼る画面を、New Relic版デモ（../index.html）から撮影する。
// 画像はスライドの画像枠（11.4in × 4.293in）と同じ縦横比で、PNG（3168×1193）になる。
//
// 使い方（newrelic-techtouch-demo/slides で実行。フォントは ../video で npm install したものを使う）:
//   NODE_PATH="$(npm root -g)" node capture.js        # shots/nr_s1.png〜nr_s3.png
//   ONLY=s2 NODE_PATH="$(npm root -g)" node capture.js # 1枚だけ撮り直す
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const HTML = "file://" + path.resolve(__dirname, "..", "index.html");
const NM = path.resolve(__dirname, "..", "video", "node_modules");
const OUT = process.env.OUT_DIR || path.join(__dirname, "shots");
fs.mkdirSync(OUT, { recursive: true });
const RATIO = 11.4 / 4.293;
const WIN_W = +(process.env.WIN_W || 1320);

const fontLinks = [];
for (const pkg of ["@fontsource/noto-sans-jp", "@fontsource/roboto"]) {
  for (const w of ["400", "500", "600", "700"]) fontLinks.push("file://" + path.join(NM, pkg, w + ".css"));
}
const CSS = `
:root { --font: Roboto, "Noto Sans JP", sans-serif; --font-demo: "Noto Sans JP", sans-serif; }
.topbar, .disclaimer, #journey, #story, .ask, .foot, .notes, .win-bar { display: none !important; }
.wrap { max-width: none !important; padding: 0 !important; gap: 0 !important; }
.window { border-radius: 0 !important; box-shadow: none !important; }
.dt { min-height: 0 !important; }
.dock, .dt-app { border-radius: 0 !important; }
.is-target { animation: none !important; }
.gh { padding: 5px 12px !important; }
.appheader { min-height: 42px !important; }
.ah-nav span { padding: 10px 10px !important; }
.dt-page { padding: 12px 16px 14px !important; gap: 10px !important; }
.has-overlay .dt-page { padding-right: 372px !important; }
.overlay { gap: 6px !important; padding: 10px 14px 12px !important; top: 8px !important; }
.ov-title { font-size: 15px !important; line-height: 1.4 !important; }
.steps.compact li { padding: 0 8px !important; font-size: 12.5px !important; line-height: 1.55 !important; }
.now-box { font-size: 13px !important; line-height: 1.55 !important; }
.soft, .part, .alert { padding: 6px 10px !important; font-size: 12px !important; line-height: 1.55 !important; }
.refs { font-size: 11px !important; }
.btn { padding: 6px 12px !important; font-size: 13px !important; }
.dock-spacer ~ .dock-group { display: none !important; }
.overlay { margin-top: 52px !important; }
.steps { gap: 1px !important; }
.steps li::before { width: 18px !important; height: 18px !important; }
${process.env.EXTRA_CSS || ""}
`;

async function setup(browser, hash, extraCss = "") {
  const page = await browser.newPage({ viewport: { width: WIN_W, height: 1400 }, deviceScaleFactor: 2.4, colorScheme: "light" });
  await page.goto(HTML + hash);
  await page.evaluate(([links, css]) => {
    document.documentElement.setAttribute("data-theme", "light");
    links.forEach((h) => { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = h; document.head.appendChild(l); });
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  }, [fontLinks, CSS + extraCss]);
  await page.evaluate(() => document.fonts.ready.then(() => true));
  return page;
}
const rerender = (page) => page.evaluate(() => window.dispatchEvent(new Event("resize"))).then(() => page.waitForTimeout(300));

async function shoot(page, name) {
  await rerender(page);
  // 画面の下に余白（背景色の帯）が出ないよう、画面を画像枠の高さまで伸ばす
  await page.evaluate((ratio) => {
    const w = document.querySelector(".window"), gh = document.querySelector(".gh");
    const h = Math.round(w.getBoundingClientRect().width / ratio);
    document.querySelector(".dt").style.setProperty("min-height", (h - gh.getBoundingClientRect().height) + "px", "important");
  }, RATIO);
  await page.evaluate(() => document.fonts.ready.then(() => true));
  const box = await page.evaluate(() => {
    const w = document.querySelector(".window").getBoundingClientRect();
    const ov = document.querySelector(".overlay").getBoundingClientRect();
    const pg = document.querySelector(".dt-page").getBoundingClientRect();
    return { x: w.left, y: w.top, w: w.width, ovBottom: ov.bottom - w.top, pageBottom: pg.bottom - w.top };
  });
  const h = Math.round(box.w / RATIO);
  console.log(JSON.stringify({ name, width: box.w, cropH: h, panelBottom: Math.round(box.ovBottom), pageBottom: Math.round(box.pageBottom) }));
  await page.screenshot({ path: path.join(OUT, name + ".png"), clip: { x: box.x, y: box.y, width: box.w, height: h } });
}

(async () => {
  const browser = await chromium.launch();
  const only = process.env.ONLY;

  if (!only || only === "s1") {
    // デモ①：Apply 後、上がっている値を確認するステップ（⑥）
    const p = await setup(browser, "#c1", ".dt-page > .surface:has(.chart-wrap), .dt-page > .dt-fine, .crumbs { display: none !important; }");
    await p.click("#g-start");
    await p.click('.dock [data-arg="services"]');
    await p.click('[data-act="c1-pick"][data-arg="契約照会サービス（架空）"]');
    await p.selectOption("#c1-period", "10:00–10:15");
    await p.selectOption("#c1-compare", "09:45–10:00");
    await p.click('[data-act="c1-apply"]');
    await shoot(p, "nr_s1");
  }
  if (!only || only === "s2") {
    // デモ②：ステップ3（Logs を開き、Time range を設定する前）
    const p = await setup(browser, "#c2", ".dt-page > .dt-fine { display: none !important; }");
    await p.click("#m-start");
    for (let i = 0; i < 4; i++) await p.keyboard.press("ArrowRight");
    await shoot(p, "nr_s2");
  }
  if (!only || only === "s3") {
    // デモ③：ステップ5（Time range を変える。AI Hub欄が変える理由を説明）
    const p = await setup(browser, "#c3", "#c3-result.empty, .dt-page > .tt-note, .tpl-desc, .dt-page > div > .dt-h, .overlay .steps, .overlay .refs { display: none !important; } .tpl { padding: 7px 12px !important; gap: 2px !important; } .dt-page { gap: 8px !important; } .changes { padding: 8px 14px !important; } .changes ul { gap: 0 !important; } .changes li { padding: 1px 0 !important; } .changes .dt-emph { padding: 2px 12px !important; } .dql { padding-top: 6px !important; }");
    await p.click("#g-start");
    await p.click('.dock [data-arg="dashboards"]');
    await p.click('[data-act="c3-create"]');
    await p.click('label:has(input[value="t1"])');
    await p.selectOption("#c3-service", "契約照会サービス（架空）");
    await shoot(p, "nr_s3");
  }
  await browser.close();
})();
