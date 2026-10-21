// デモ動画の説明資料（PowerPoint・4枚）を作る。架空のシナリオの構想デモの説明で、お客様固有の内容は入れない。
// 使い方（このフォルダで）:
//   npm install pptxgenjs@3.12.0
//   node build_deck.js            → Dynatrace_デモのご説明.pptx
// 体裁はテックタッチの資料に合わせる：青 055BB8／0876E8、淡い青の要点帯 EEF7FD、文字 1F2A37、枠線 D6DDE5、
// 強調の橙 C86A00、書体 Yu Gothic、角の無い四角、左上の小見出し・題名・要点帯・青い見出し帯の付いた枠。
// 時刻・章の長さ・問いは、デモ（../index.html）と動画（../video/dynatrace-techtouch-demo.mp4、3分35秒）に合わせる。
const path = require("path");
const pptxgen = require("pptxgenjs");

const OUT = process.env.OUT || path.join(__dirname, "Dynatrace_デモのご説明.pptx");
const APPLY_THEME = process.env.APPLY_THEME; // pptx スキルの scripts/apply_theme.js（無ければテーマ色の書き込みを省く）

const THEME = {
  name: "Techtouch",
  headFontFace: "Yu Gothic",
  bodyFontFace: "Yu Gothic",
  colors: {
    dk1: "1F2A37", lt1: "FFFFFF", dk2: "055BB8", lt2: "F0F3F6",
    accent1: "055BB8", // テックタッチの青
    accent2: "0876E8", // 見出し帯の青
    accent3: "EEF7FD", // 要点帯の淡い青
    accent4: "C86A00", // 強調の橙
    accent5: "596573", // 補足の文字
    accent6: "D6DDE5", // 枠線
    hlink: "0876E8", folHlink: "4A90E2"
  }
};
const IMAGE_GRAY = "8A96A6"; // 「画面イメージ」の札
const HUB_PURPLE = "6A4C9C"; // AI Hub の枠（デモの紫）
const TT_BLUE = "0B7FB5";    // テックタッチの吹き出し（デモの青）

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "Dynatrace 運用担当者の一日 デモのご説明";
pres.subject = "Dynatrace × テックタッチ（DAP＋AI Hub）構想デモの説明";
pres.author = "テックタッチ";
pres.company = "テックタッチ株式会社";
const C = pres.SchemeColor;
const W = 13.333, M = 0.5, CW = W - 2 * M;
const TAG = "構想デモ・架空のシナリオ";

/* ---------- レイアウト ---------- */
pres.defineSlideMaster({
  title: "TITLE",
  background: { color: C.background1 },
  objects: [
    { rect: { x: 0, y: 0, w: 5.2, h: 7.5, fill: { color: C.accent1 }, line: { type: "none" } } },
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 2.25, w: 4.2, h: 2.0, fontSize: 30, bold: true, color: C.background1, align: "left", valign: "top", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.6, y: 4.55, w: 4.2, h: 0.9, fontSize: 13, color: C.background1, align: "left", valign: "top", margin: 0 }, text: "" } }
  ]
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.background1 },
  margin: [0.5, 0.5, 0.6, 0.5],
  objects: [
    { placeholder: { options: { name: "label", type: "body", x: M, y: 0.22, w: 8.0, h: 0.3, fontSize: 11, bold: true, color: C.accent2, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.5, w: CW, h: 0.6, fontSize: 22, bold: true, color: C.text1, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { text: { text: TAG, options: { x: W - M - 3.5, y: 0.22, w: 3.5, h: 0.3, fontSize: 11, color: C.accent5, align: "right", valign: "middle", margin: 0 } } }
  ],
  slideNumber: { x: W - M - 0.6, y: 6.98, w: 0.6, h: 0.3, fontSize: 11, color: C.accent5, align: "right" }
});

/* ---------- 部品 ---------- */
const sq = (s, x, y, w, h, fill, line, name) => s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: fill ? { color: fill } : { type: "none" }, line: line ? { color: line, width: 0.75 } : { type: "none" }, objectName: name });
function text(s, t, o) {
  s.addText(t, Object.assign({ isTextBox: true, margin: 0, valign: "top", color: C.text1, fontSize: 12, paraSpaceAfter: 0 }, o));
}
const bullets = (items, o = {}) => items.map((t, i) => ({ text: t, options: Object.assign({ bullet: { indent: 12 }, breakLine: i < items.length - 1, paraSpaceAfter: 4 }, o) }));
function content(label, title, band) {
  const s = pres.addSlide({ masterName: "CONTENT" });
  s.addText(label, { placeholder: "label" });
  s.addText(title, { placeholder: "title" });
  sq(s, M, 1.2, CW, 0.8, C.accent3, null, "band");
  text(s, band, { x: M + 0.15, y: 1.2, w: CW - 0.3, h: 0.8, fontSize: 13, bold: true, color: C.accent1, valign: "middle", objectName: "band-text" });
  return s;
}
// 青い見出し帯の付いた枠
function card(s, x, y, w, h, head, name, headFill = C.accent2) {
  sq(s, x, y, w, h, C.background1, C.accent6, name);
  sq(s, x, y, w, 0.38, headFill, null, name + "-head");
  text(s, head, { x: x + 0.1, y, w: w - 0.2, h: 0.38, fontSize: 12, bold: true, color: C.background1, valign: "middle", objectName: name + "-head-text" });
}
// 小さな札（「画面イメージ」など）
function chip(s, x, y, label, fill, name) {
  const w = 0.24 + label.length * 0.15;
  sq(s, x, y, w, 0.26, fill, null, name);
  text(s, label, { x, y, w, h: 0.26, fontSize: 10, bold: true, color: C.background1, align: "center", valign: "middle", objectName: name + "-text" });
}
function foot(s, t) { text(s, t, { x: M, y: 6.92, w: CW - 0.8, h: 0.42, fontSize: 11, color: C.accent5, valign: "middle", objectName: "footnote" }); }

// 日本語の文字に使う書体（テーマの ea と Jpan）を、見出し・本文とも同じ書体にそろえる
async function setJapaneseFont(file, face) {
  const fs = require("fs");
  const JSZip = require(require.resolve("jszip", { paths: [require.resolve("pptxgenjs")] }));
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/theme\/theme\d+\.xml$/.test(n))) {
    let xml = await zip.file(name).async("string");
    xml = xml.replace(/<a:ea typeface="[^"]*"\/>/g, '<a:ea typeface="' + face + '"/>')
      .replace(/<a:font script="Jpan" typeface="[^"]*"\/>/g, '<a:font script="Jpan" typeface="' + face + '"/>');
    zip.file(name, xml);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

(async () => {
  /* ----- 1. 表紙 ----- */
  {
    const s = pres.addSlide({ masterName: "TITLE" });
    s.addText("Dynatrace\n運用担当者の一日\nデモのご説明", { placeholder: "title" });
    s.addText("Dynatrace ×\nテックタッチ（DAP＋AI Hub）", { placeholder: "body" });
    text(s, "月に数回しかDynatraceを使わない人が、\n迷わず・社内手順どおりに・自分で進める", { x: 5.75, y: 2.45, w: 7.1, h: 1.05, fontSize: 22, bold: true, color: C.accent1, objectName: "headline" });
    text(s, bullets(["架空の運用担当者の一日（問い合わせから、一次確認・連絡、再発への備えまで）", "デモ動画は3章＋振り返り（3分35秒）"]), { x: 5.75, y: 3.75, w: 7.1, h: 0.9, fontSize: 15, objectName: "headline-points" });
    text(s, "テックタッチ株式会社\n2026年10月\n架空のシナリオの構想デモです。特定の企業や事案を題材にしたものではありません。", { x: 5.75, y: 5.5, w: 7.1, h: 0.9, fontSize: 12, color: C.accent5, objectName: "meta" });
    s.addNotes("デモ動画の前に、3枚で前提をご説明します。架空の運用担当者の一日を題材にした構想デモです。画面はすべてDynatraceの画面イメージで、実画面ではありません。");
  }

  /* ----- 2. お見せすること ----- */
  {
    const s = content("デモの前に", "このデモでお見せすること", "入っているDynatraceを、月に数回しか使わない人が、迷わず・社内手順どおりに・自分で進める姿を見せる");
    text(s, "題材：問い合わせから、再発への備えまで（運用担当者の一日・架空）", { x: M, y: 2.12, w: CW, h: 0.3, fontSize: 13, bold: true, objectName: "theme-head" });
    const steps = [
      ["10:16　問い合わせ", "業務部門から「契約照会の画面が遅い」"],
      ["10:17　状況確認", "平均応答時間が\n420 ms → 980 ms"],
      ["10:18　一次確認", "問題の概要と影響範囲。優先度は「中」"],
      ["10:21　関連ログ", "09:58から警告。\n原因は未確定"],
      ["10:22　一次連絡", "社内手順どおりに、運用チームと窓口へ"],
      ["14:05　作成・共有", "ひな型からダッシュボードを作り、共有"]
    ];
    const gap = 0.26, sw = (CW - 5 * gap) / 6;
    steps.forEach((st, i) => {
      const x = M + i * (sw + gap);
      card(s, x, 2.48, sw, 1.0, st[0], "step-" + i);
      text(s, st[1], { x: x + 0.1, y: 2.9, w: sw - 0.2, h: 0.54, fontSize: 12, valign: "middle", objectName: "step-body-" + i });
      if (i < steps.length - 1) s.addShape(pres.shapes.CHEVRON, { x: x + sw + 0.07, y: 2.83, w: 0.12, h: 0.3, fill: { color: C.accent6 }, line: { type: "none" }, objectName: "step-arrow-" + i });
    });
    // 章の範囲（すべて画面イメージ）
    const chapters = [[0, 2, "第1章　状況確認（画面イメージ）"], [2, 3, "第2章　一次確認・連絡（画面イメージ）"], [5, 1, "第3章（画面イメージ）"]];
    chapters.forEach(([from, n, label], i) => {
      const x = M + from * (sw + gap), w = n * sw + (n - 1) * gap;
      sq(s, x, 3.58, w, 0.4, C.background2, null, "chapter-" + i);
      text(s, label, { x, y: 3.58, w, h: 0.4, fontSize: 11, color: C.accent5, align: "center", valign: "middle", objectName: "chapter-text-" + i });
    });
    const cards = [
      ["①　迷わず、状況を確かめる", "Dockで画面を探し、サービス・時間枠・比較期間をそろえる。長さの違う比較期間は、ガイドが選び直しを案内する"],
      ["②　社内手順どおりに、確認・連絡する", "概要→影響範囲→関連ログ→連絡の順で進める。順番を飛ばすと案内し、優先度の基準を画面に出す"],
      ["③　ひな型で作り、確認を受けて共有する", "確認済みのひな型から作る。AI Hubが変える理由を説明し、専門家の承認後に保存・共有する"]
    ];
    const cw = (CW - 2 * 0.2) / 3;
    cards.forEach((c, i) => {
      const x = M + i * (cw + 0.2);
      card(s, x, 4.18, cw, 1.7, c[0], "point-" + i);
      text(s, c[1], { x: x + 0.12, y: 4.66, w: cw - 0.24, h: 1.12, fontSize: 13, objectName: "point-body-" + i });
    });
    text(s, "デモが置く仮説（確認必要）：月に数回しか使わない人は、画面の探し方・社内手順・ダッシュボードの作成で止まり、専門家に聞いて待つ", { x: M, y: 6.02, w: CW, h: 0.45, fontSize: 13, bold: true, color: C.accent4, valign: "middle", objectName: "hypo" });
    foot(s, "原因の特定は、このデモの範囲外です（画面上でも「原因はこの段階では確定しない」と扱います）。時刻・数値はデモ用の架空の値です。");
    s.addNotes("入っているDynatraceを、月に数回しか使わない担当者が、迷わず、社内手順どおりに、自分で進められるようにする提案です。原因の特定はこのデモの範囲外です。");
  }

  /* ----- 3. 流れと見どころ ----- */
  {
    const s = content("デモの前に", "デモ動画の流れと見どころ", "運用担当者（架空）が、問い合わせから一次確認・連絡、再発への備えまでを一人で進める。各章の終わりに「伺いたいこと」を出す");
    const ch = [
      ["第1章　状況確認", "約1分", "ガイド7ステップ。Dockで画面を探し、サービス・時間枠・比較期間をそろえ、悪化した指標を確かめる"],
      ["第2章　一次確認・連絡", "約1分", "ガイド4ステップ。社内手順の順番で、概要・影響範囲・関連ログを確かめ、優先度「中」で連絡する"],
      ["第3章　再発に備える", "約1分", "ガイド8ステップ。ひな型からダッシュボードを作り、専門家の確認を受けて運用チームに共有する"],
      ["振り返り", "約20秒", "今日の流れ、手当てした場面、確かめ方、最初の一歩をまとめる"]
    ];
    const lw = 8.05, cw = (lw - 0.2) / 2, chh = 2.12;
    ch.forEach((c, i) => {
      const x = M + (i % 2) * (cw + 0.2), y = 2.25 + Math.floor(i / 2) * (chh + 0.18);
      card(s, x, y, cw, chh, c[0], "chapter-" + i);
      text(s, c[1], { x: x + cw - 1.0, y, w: 0.9, h: 0.38, fontSize: 12, bold: true, color: C.background1, align: "right", valign: "middle", objectName: "chapter-time-" + i });
      text(s, c[2], { x: x + 0.12, y: y + 0.5, w: cw - 0.24, h: 1.1, fontSize: 13, objectName: "chapter-desc-" + i });
      if (i < 3) chip(s, x + 0.12, y + chh - 0.38, "画面イメージ", IMAGE_GRAY, "chapter-chip-" + i);
    });
    const rx = M + lw + 0.25, rw = W - M - rx;
    card(s, rx, 2.25, rw, 4.42, "画面の見分け方", "legend", C.accent1);
    const legend = [
      [IMAGE_GRAY, "画面イメージ", "Dynatraceの公式デザインに合わせた架空の画面（全章）"],
      [TT_BLUE, "青の吹き出し", "テックタッチのガイド（案）"],
      [HUB_PURPLE, "紫の欄", "AI Hub（構想・例文）"]
    ];
    legend.forEach((l, i) => {
      const y = 2.8 + i * 1.12;
      sq(s, rx + 0.2, y, 0.45, 0.45, l[0], null, "legend-mark-" + i);
      text(s, l[1], { x: rx + 0.85, y: y - 0.02, w: rw - 1.0, h: 0.32, fontSize: 14, bold: true, objectName: "legend-name-" + i });
      text(s, l[2], { x: rx + 0.85, y: y + 0.32, w: rw - 1.0, h: 0.6, fontSize: 12, color: C.accent5, objectName: "legend-desc-" + i });
    });
    foot(s, "画面上には「構想デモ｜画面・サービス名・手順・数値は架空」の注記を常に表示しています。");
    s.addNotes("各章の終わりに「伺いたいこと」を一つ出します。画面はすべて、Dynatraceの公式デザインに合わせた画面イメージです。");
  }

  /* ----- 4. ご覧いただく前に ----- */
  {
    const s = content("デモの前に", "ご覧いただく前に", "人物・手順・数値は架空です。デモ動画の中で、右の問いを御社に当てはめてご覧ください");
    const lw = 5.9, rx = M + lw + 0.25, rw = W - M - rx;
    card(s, M, 2.25, lw, 4.42, "デモの前提", "premise");
    const pre = [
      ["画面はイメージ", "Dynatraceの公式デザインに合わせた画面で、実画面ではありません"],
      ["架空のシナリオ", "特定の企業や事案を題材にしていません"],
      ["AI Hubは構想", "回答は、事前に用意した例文です"],
      ["ガイドは案", "案内は構想の表現です。御社の手順に合わせて作ります"],
      ["数値の約束はしない", "効果は、自力完了率などの4つの指標で確かめます"]
    ];
    pre.forEach((p, i) => {
      const y = 2.72 + i * 0.78;
      if (i > 0) s.addShape(pres.shapes.LINE, { x: M + 0.15, y: y - 0.08, w: lw - 0.3, h: 0, line: { color: C.accent6, width: 0.75 }, objectName: "premise-sep-" + i });
      text(s, p[0], { x: M + 0.18, y, w: lw - 0.36, h: 0.3, fontSize: 13, bold: true, color: C.accent1, objectName: "premise-head-" + i });
      text(s, p[1], { x: M + 0.18, y: y + 0.3, w: lw - 0.36, h: 0.36, fontSize: 12, objectName: "premise-body-" + i });
    });
    card(s, rx, 2.25, rw, 4.42, "デモの中で考えていただきたい問い", "questions", C.accent1);
    const qs = [
      "画面の探し方、絞り込み、時間帯の指定のどこで迷いますか",
      "障害時の一次確認で、人によって手順がばらつくのはどこですか",
      "ひな型選択、条件の変更、結果の検証のどこで依頼しますか",
      "迷ったとき、今は誰に聞いていますか",
      "「自分でできた」と判断する基準はありますか"
    ];
    qs.forEach((q, i) => {
      const y = 2.72 + i * 0.78;
      sq(s, rx + 0.18, y + 0.04, 0.6, 0.55, C.accent1, null, "q-num-bg-" + i);
      text(s, "Q" + (i + 1), { x: rx + 0.18, y: y + 0.04, w: 0.6, h: 0.55, fontSize: 13, bold: true, color: C.background1, align: "center", valign: "middle", objectName: "q-num-" + i });
      text(s, q, { x: rx + 0.92, y: y + 0.04, w: rw - 1.1, h: 0.55, fontSize: 13, valign: "middle", objectName: "q-text-" + i });
    });
    foot(s, "答えにくい問いが、デモで一緒に確かめたいところです。章の終わりごとに伺います。");
    s.addNotes("デモの前提です。画面はイメージで、実画面ではありません。数字や人物はすべて架空です。デモ動画の中で、この5つの問いを御社に当てはめてご覧ください。");
  }

  await pres.writeFile({ fileName: OUT });
  if (APPLY_THEME) {
    const { applyTheme } = require(APPLY_THEME);
    await applyTheme(OUT, THEME);
  }
  await setJapaneseFont(OUT, THEME.bodyFontFace);
  console.log("ok", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
