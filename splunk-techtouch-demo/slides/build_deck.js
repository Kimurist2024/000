// デモ動画の事前説明資料（PowerPoint）を作る。架空のシナリオの構想デモの説明で、お客様固有の内容は入れない。
// 使い方（このフォルダで）:
//   npm install
//   node capture.js               → img/ にデモ動画の場面を切り出す（../demo.html と Playwright を使う）
//   node build_deck.js            → Splunk障害対応・ログ分析デモ_事前説明.pptx（15枚）
//   node build_deck.js --short    → Splunk障害対応・ログ分析デモ_事前説明_短縮版.pptx（4枚。動画を流す直前に使う）
// 体裁はテックタッチの資料（M365乗っ取り対応デモの事前説明）に合わせる：青 055BB8／0876E8、淡い青の要点帯 EEF7FD、
// 文字 1F2A37、枠線 D6DDE5、強調の橙 C86A00、書体 Yu Gothic、角の無い四角、左上の小見出し・題名・要点帯・青い見出し帯の付いた枠。
const path = require("path");
const pptxgen = require("pptxgenjs");

const SHORT = process.argv.includes("--short");
const OUT = process.env.OUT || path.join(__dirname, SHORT ? "Splunk障害対応・ログ分析デモ_事前説明_短縮版.pptx" : "Splunk障害対応・ログ分析デモ_事前説明.pptx");
const IMG = (n) => path.join(__dirname, "img", n);
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
const AIHUB = "5A3EA6";   // AI Hub（動画の紫）
const WARM = "FFF3E3";    // 仮説・注意の地
const GRAYHEAD = "8A96A6"; // 画面イメージの印

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "Splunk障害対応・ログ分析デモ 事前説明" + (SHORT ? "（短縮版）" : "");
pres.subject = "Splunk Cloud（ITSI・IT Essentials Work）× テックタッチ（DAP＋AI Hub）構想デモ動画の事前説明";
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
function content(label, title, band, section) {
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: section });
  s.addText(label, { placeholder: "label" });
  s.addText(title, { placeholder: "title" });
  if (band) {
    sq(s, M, 1.2, CW, 0.8, C.accent3, null, "band");
    text(s, band, { x: M + 0.15, y: 1.2, w: CW - 0.3, h: 0.8, fontSize: 13, bold: true, color: C.accent1, valign: "middle", objectName: "band-text" });
  }
  return s;
}
// 青い見出し帯の付いた枠
function card(s, x, y, w, h, head, name, headFill = C.accent2) {
  sq(s, x, y, w, h, C.background1, C.accent6, name);
  sq(s, x, y, w, 0.38, headFill, null, name + "-head");
  text(s, head, { x: x + 0.1, y, w: w - 0.2, h: 0.38, fontSize: 12, bold: true, color: C.background1, valign: "middle", objectName: name + "-head-text" });
}
// 画面の種類の印（実画面／画面イメージ／構想）
function badge(s, x, y, kind, name) {
  const k = { real: ["実画面", C.accent1], mock: ["画面イメージ", GRAYHEAD], hub: ["AI Hub：構想", AIHUB] }[kind];
  const w = 0.13 * k[0].length + 0.3;
  sq(s, x, y, w, 0.28, k[1], null, name);
  text(s, k[0], { x, y, w, h: 0.28, fontSize: 11, bold: true, color: C.background1, align: "center", valign: "middle", objectName: name + "-text" });
  return w;
}
function shot(s, file, x, y, w, aspect, name) {
  const h = w / aspect;
  s.addImage({ path: IMG(file), x, y, w, h, objectName: name });
  sq(s, x, y, w, h, null, C.accent6, name + "-frame");
  return h;
}
function foot(s, t) { text(s, t, { x: M, y: 6.92, w: CW - 0.8, h: 0.42, fontSize: 11, color: C.accent5, valign: "middle", objectName: "footnote" }); }
function tableStyle(colW, rowH) {
  return { x: M, w: CW, colW, rowH, border: { type: "solid", pt: 0.75, color: THEME.colors.accent6 }, margin: [0.07, 0.1, 0.07, 0.1], fontFace: THEME.bodyFontFace };
}
const th = (t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.accent1 }, fontSize: 12, valign: "middle" } });
const td = (t, o = {}) => ({ text: t, options: Object.assign({ fontSize: 12, color: C.text1, valign: "middle" }, o) });
const SA = 1860 / 740, RS = 1084 / 660; // 画像の縦横比（動画の場面／実画面のスクリーンショット）

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

/* ---------- 共通の内容 ---------- */
const TIMELINE = [
  ["10:16 問い合わせ", "業務部門から「契約照会の画面が遅い」"],
  ["10:17 状況確認", "健全性スコア38。応答時間とDB接続待ちが悪化"],
  ["10:18 一次確認", "エピソードの概要・影響範囲・関連サーバー"],
  ["10:22 一次連絡", "優先度「中」で、社内手順どおりに連絡"],
  ["10:30 ログ調査", "専門チームの依頼で、接続エラーの推移を確認"],
  ["10:34 共有・保存", "確認を依頼し、レポートとして保存"]
];
const POINTS = [
  ["①　迷わず、状況を確かめる", ["Service Analyzerで、時間範囲とサービスを選び、悪化したKPIを確かめる", "似た名前のサービスは、ガイドが選び直しを案内する"]],
  ["②　社内手順どおりに、確認・連絡する", ["概要→影響範囲→関連エンティティ→連絡の順で進める", "優先度の基準を画面に出し、AI Hubが連絡文を下書きする"]],
  ["③　ひな型で調べ、共有して残す", ["確認済みのSPLのひな型（レポート）から調べる", "AI HubがSPLと結果の読み方を説明し、依頼文を下書きする"]]
];
const QUESTIONS = [
  "Service Analyzerなどの画面の探し方、時間範囲の指定、サービスの選び分けのどこで迷いますか",
  "障害時の一次確認で、人によって手順（見る順番・優先度の決め方・連絡先）がばらつくのはどこですか",
  "ログを調べるとき、ひな型選び、時間範囲の確認、結果の読み方のどこで手が止まりますか",
  "迷ったとき、今は誰に聞いていますか（専門チーム・委託先・マニュアル）",
  "担当者が「自分で調べ切れた」と判断する基準はありますか"
];
// タイムラインと、章のまとまり（第1章：1〜2、第2章：3〜4、第3章：5〜6）
function timeline(s, y, cardH, bodyH) {
  const gap = 0.26, sw = (CW - 5 * gap) / 6;
  TIMELINE.forEach((st, i) => {
    const x = M + i * (sw + gap);
    card(s, x, y, sw, cardH, st[0], "step-" + i, i >= 4 ? C.accent1 : C.accent2);
    text(s, st[1], { x: x + 0.1, y: y + 0.46, w: sw - 0.2, h: bodyH, fontSize: 12, objectName: "step-body-" + i });
    if (i < TIMELINE.length - 1) s.addShape(pres.shapes.CHEVRON, { x: x + sw + 0.07, y: y + 0.04, w: 0.12, h: 0.3, fill: { color: C.accent6 }, line: { type: "none" }, objectName: "step-arrow-" + i });
  });
  const by = y + cardH + 0.12;
  [["第1章　状況確認（画面イメージ）", C.background2, C.accent5], ["第2章　一次確認・連絡（画面イメージ）", C.background2, C.accent5], ["第3章　ログを調べる（実画面）", C.accent1, C.background1]].forEach((b, i) => {
    const x = M + 2 * i * (sw + gap), w = 2 * sw + gap;
    sq(s, x, by, w, 0.4, b[1], null, "chapter-" + i);
    text(s, b[0], { x, y: by, w, h: 0.4, fontSize: 12, bold: i === 2, color: b[2], align: "center", valign: "middle", objectName: "chapter-text-" + i });
  });
  return by + 0.4;
}

async function buildFull() {
  /* ===== 1. 表紙 ===== */
  pres.addSection({ title: "はじめに" });
  {
    const s = pres.addSlide({ masterName: "TITLE", sectionTitle: "はじめに" });
    s.addText("Splunk\n障害対応・ログ分析\nデモ 事前説明", { placeholder: "title" });
    s.addText("Splunk Cloud（ITSI・IT Essentials Work）×\nテックタッチ（DAP＋AI Hub）", { placeholder: "body" });
    text(s, "たまにしかSplunkを使わない人が、\n迷わず・社内手順どおりに・自分で調べ切る", { x: 5.75, y: 2.45, w: 7.1, h: 1.05, fontSize: 22, bold: true, color: C.accent1, objectName: "headline" });
    text(s, bullets(["架空のA社の運用担当者の一日（問い合わせから、一次確認・ログ分析まで）", "デモ動画は3章＋振り返り（5分10秒）。第3章はSplunk Cloudとテックタッチの実画面です"]), { x: 5.75, y: 3.75, w: 7.1, h: 0.9, fontSize: 15, objectName: "headline-points" });
    text(s, "テックタッチ株式会社\n2026年10月\n架空のシナリオの構想デモです。特定の企業や事案を題材にしたものではありません。", { x: 5.75, y: 5.5, w: 7.1, h: 0.9, fontSize: 12, color: C.accent5, objectName: "meta" });
    s.addNotes("本日は、デモ動画の前に、シナリオの前提と見どころをご説明します。架空のA社の運用担当者の一日を題材にした構想デモです。特定の企業や事案を題材にしたものではありません。");
  }

  /* ===== 2. サマリ ===== */
  {
    const s = content("サマリ", "製品を足すのではなく、入っているSplunkを、使う人が使い切る", "ITSI・IT Essentials Work・検索は入っている。止まっているのは「たまにしか使わない人が、迷わず・同じ手順で・自分で調べ切ること」。そこを、テックタッチが画面の上から支える", "はじめに");
    const cw = (CW - 2 * 0.2) / 3;
    POINTS.forEach((c, i) => {
      const x = M + i * (cw + 0.2);
      card(s, x, 2.25, cw, 2.05, c[0], "point-" + i);
      text(s, bullets(c[1]), { x: x + 0.12, y: 2.75, w: cw - 0.24, h: 1.45, fontSize: 13, objectName: "point-body-" + i });
    });
    const tiles = [["デモ動画", "5分10秒", "3章＋振り返り"], ["実画面", "第3章", "Splunk Cloud上で再生"], ["伺いたいこと", "5つ", "章の終わりに伺う"], ["事前に伺いたいこと", "6項目", "御社の環境に合わせる"], ["効果の数値", "約束しない", "4つの指標で測る"]];
    const tw = (CW - 4 * 0.2) / 5;
    tiles.forEach((t, i) => {
      const x = M + i * (tw + 0.2), hi = i === 1;
      sq(s, x, 4.6, tw, 1.3, hi ? C.accent1 : C.background2, hi ? null : C.accent6, "tile-" + i);
      text(s, t[0], { x: x + 0.12, y: 4.7, w: tw - 0.24, h: 0.3, fontSize: 12, color: hi ? C.background1 : C.accent5, objectName: "tile-cap-" + i });
      text(s, t[1], { x: x + 0.12, y: 5.0, w: tw - 0.24, h: 0.5, fontSize: 24, bold: true, color: hi ? C.background1 : C.text1, objectName: "tile-big-" + i });
      text(s, t[2], { x: x + 0.12, y: 5.53, w: tw - 0.24, h: 0.3, fontSize: 11, color: hi ? C.background1 : C.accent5, objectName: "tile-sub-" + i });
    });
    text(s, "原因の調査と対処は、これまでどおり専門チーム・委託先が担います。担当者が自分で確かめ、手順どおりに渡せる範囲を広げる話です。", { x: M, y: 6.15, w: CW, h: 0.4, fontSize: 13, bold: true, color: C.accent4, valign: "middle", objectName: "partner" });
    foot(s, "人物・企業名・手順・数値は架空です。第3章の画面は実機（デモ環境）、ログはデモ用の架空データです。");
    s.addNotes("製品を足す提案ではありません。入っているITSI・IT Essentials Work・検索を、たまにしか使わない担当者が、迷わず、社内手順どおりに、自分で調べ切れるようにする提案です。原因の調査や対処を専門チームから取り上げる話でもありません。担当者が自分で確かめ、手順どおりに渡せる範囲を広げる話です。");
  }

  /* ===== 3. 題材 ===== */
  pres.addSection({ title: "シナリオ" });
  {
    const s = content("シナリオ｜題材", "題材：問い合わせから、ログ分析まで（運用担当者の一日・架空）", "障害の原因を突き止める話ではない。問い合わせを受けた担当者が、状況を確かめ、社内手順どおりに連絡し、ログで手がかりを渡すまでがデモの範囲", "シナリオ");
    const end = timeline(s, 2.25, 1.35, 0.8);
    const hy = end + 0.25;
    sq(s, M, hy, CW, 6.7 - hy, WARM, null, "hypo");
    text(s, "デモが置く仮説（確認必要）", { x: M + 0.2, y: hy + 0.12, w: 5, h: 0.32, fontSize: 13, bold: true, color: C.accent4, objectName: "hypo-head" });
    text(s, bullets([
      "仮説1　画面・操作で迷う：Splunkを月に数回しか使わない人は、画面の場所・時間範囲・サービスの選び分けで止まる",
      "仮説3　作成・修正で止まる：SPLを一から書けず、専門チームに依頼して待つ",
      "仮説4・5　実務で再現できない／学びを再利用できない：研修で覚えた一次確認の手順が障害時に再現できず、調べた条件も残らない"
    ], { paraSpaceAfter: 10 }), { x: M + 0.2, y: hy + 0.55, w: CW - 0.4, h: 6.7 - hy - 0.65, fontSize: 14, objectName: "hypo-body" });
    foot(s, "時刻・件数はデモ用の架空の値です。仮説の番号は、動画の章扉と同じ番号です。");
    s.addNotes("架空のA社の契約照会サービスで、応答が遅くなった、という一般的な障害の型です。原因を突き止める話ではありません。問い合わせを受けた担当者が、状況を確かめ、社内手順どおりに連絡し、ログで手がかりを専門チームに渡すまでがこのシナリオの範囲です。仮説は確かめるべき前提として置いています。");
  }

  /* ===== 4. 構造 ===== */
  {
    const s = content("シナリオ｜構造", "Splunkは入っているのに、使い切れない構造", "Splunkの画面は、使う人が「どこを・どの順で・何を基準に」見るかを決めて初めて回る。そこが人に依存していると、たまに使う人は止まる", "シナリオ");
    const z = { fill: { color: THEME.colors.lt2 } };
    const rows = [
      [th("製品"), th("製品がすること"), th("社内が決め続けること"), th("決めていないと起きること（仮説）")],
      [td("ITSI", { bold: true }), td("サービスの健全性スコアとKPI、エピソード（関連するアラートのまとまり）"), td("どのKPIを見るか、健全性スコアの判断基準、エピソードを確かめる順番と担当"), td("スコアが下がっても、見る人と手順が決まらず、専門チームへの問い合わせが続く")],
      [td("IT Essentials Work", Object.assign({ bold: true }, z)), td("サーバーなどのエンティティの状態", z), td("一次確認では、どの指標を見れば足りるか", z), td("画面はあっても、どこを見ればよいかが人による", z)],
      [td("Search & Reporting", { bold: true }), td("ログの検索（SPL）、レポートの保存・共有"), td("確認済みのSPLのひな型、その使い方、共有の範囲"), td("SPLを書ける人だけが調べられ、調べた条件が残らない")]
    ];
    s.addTable(rows, Object.assign({ y: 2.25, objectName: "structure-table" }, tableStyle([2.1, 3.3, 3.6, 3.33], [0.45, 0.95, 0.75, 0.75])));
    text(s, "どれも「入れれば使える」製品ではなく、社内の人が、見る順番・判断基準・ひな型を決め続ける仕事が付いています。", { x: M, y: 5.6, w: CW, h: 0.6, fontSize: 13, bold: true, color: C.accent4, valign: "middle", objectName: "structure-note" });
    foot(s, "ITSIは有償の追加製品、IT Essentials Workは無償のアプリです（Splunk公式ドキュメントの抜粋で確認）。");
    s.addNotes("製品が悪いという話ではありません。見る順番、判断の基準、SPLのひな型という、自社に固有の決め事を、画面の上で担当者に届ける話です。");
  }

  /* ===== 5. 問い ===== */
  {
    const s = content("シナリオ｜問い", "事前に考えていただきたい5つの問い", "すぐに答えにくい問いが、デモで一緒に確かめたいところ。動画の章の終わりごとに、この問いに沿って伺います", "シナリオ");
    QUESTIONS.forEach((q, i) => {
      const y = 2.25 + i * 0.84;
      sq(s, M, y, 0.72, 0.72, C.accent1, null, "q-num-bg-" + i);
      text(s, "Q" + (i + 1), { x: M, y, w: 0.72, h: 0.72, fontSize: 15, bold: true, color: C.background1, align: "center", valign: "middle", objectName: "q-num-" + i });
      sq(s, M + 0.72, y, CW - 0.72, 0.72, C.background1, C.accent6, "q-row-" + i);
      text(s, q, { x: M + 0.92, y, w: CW - 1.1, h: 0.72, fontSize: 14, valign: "middle", objectName: "q-text-" + i });
    });
    foot(s, "Q1〜Q3は、動画の各章の終わりに出す問いと同じです。");
    s.addNotes("動画では、章の終わりごとにQ1からQ3を一つずつお出しします。Q4とQ5は、今の解決方法と、自走できたと判断する基準を伺う問いです。");
  }

  /* ===== 6. 役割 ===== */
  {
    const s = content("シナリオ｜役割", "誰が何を担うか", "製品・テックタッチ・人の役割を固定してから、デモを組んでいます", "シナリオ");
    const cols = [
      ["Splunk（入っている製品）", C.text1, [
        ["ITSI", "サービスの健全性スコア・KPI・エピソード（Service Analyzer、Episode Review）"],
        ["IT Essentials Work", "サーバーなどのエンティティの状態（Entity Overview）"],
        ["Search & Reporting", "ログの検索（SPL）と、レポートの保存・共有"],
        ["Splunk AI Assistant", "自然言語からSPL案を作り、SPLを説明する（デモでは使っていない）"]]],
      ["テックタッチ", C.accent1, [
        ["DAP（ガイド）", "ガイド・ポップアップ・ツールチップで、Splunkの画面の上に操作の順番・選び直し・社内の判断基準を示す"],
        ["AI Hub（構想）", "社内のナレッジ（ログ辞書・SPLのひな型・判断基準・連絡の形）を参照し、説明・照合・下書きをする"]]],
      ["人（架空）", C.accent5, [
        ["運用担当者", "問い合わせを受け、状況確認・一次確認・連絡・ログ調査を行う"],
        ["専門チーム", "原因の調査と対処。SPLのひな型を作り、確認依頼に答える"],
        ["業務部門", "問い合わせの起点。影響の連絡先"]]]
    ];
    const cw = [4.45, 3.9, 3.58];
    let x = M;
    cols.forEach((col, c) => {
      card(s, x, 2.25, cw[c], 4.45, col[0], "role-" + c, col[1]);
      const ih = (4.45 - 0.38) / col[2].length;
      col[2].forEach((it, i) => {
        const y = 2.63 + i * ih;
        if (i > 0) s.addShape(pres.shapes.LINE, { x: x + 0.12, y, w: cw[c] - 0.24, h: 0, line: { color: C.accent6, width: 0.75 }, objectName: "role-sep-" + c + "-" + i });
        text(s, it[0], { x: x + 0.15, y: y + 0.12, w: cw[c] - 0.3, h: 0.3, fontSize: 13, bold: true, color: it[0].startsWith("AI Hub") ? AIHUB : it[0].startsWith("DAP") ? C.accent1 : C.text1, objectName: "role-name-" + c + "-" + i });
        text(s, it[1], { x: x + 0.15, y: y + 0.45, w: cw[c] - 0.3, h: ih - 0.55, fontSize: 12, objectName: "role-desc-" + c + "-" + i });
      });
      x += cw[c] + 0.2;
    });
    s.addNotes("サービスの健全性とエピソードはITSI、サーバーの状態はIT Essentials Work、ログの検索とひな型の保存はSearch & Reportingです。操作の順番と社内の判断基準を画面の上で示すのはテックタッチのガイド、社内のナレッジを参照して説明・下書きをするのはAI Hub（構想）です。原因の調査と対処は、これまでどおり専門チームが担います。");
  }

  /* ===== 7. Before / After ===== */
  {
    const s = content("シナリオ｜Before → After", "工程ごとの Before → After", "人によって止まっていたところを、画面の上の案内と社内の基準で進める", "シナリオ");
    const before = { fill: { color: THEME.colors.lt2 } }, after = { fill: { color: THEME.colors.accent3 } };
    const r = (a, b, c) => [td(a, { bold: true }), td(b, before), td(c, after)];
    const rows = [
      [th("工程"), th("Before（仮説）"), th("After（デモで見せる姿）")],
      r("状況確認", "アプリ・時間範囲・サービスの選び分けで迷い、専門チームに聞く", "ガイドが順に案内し、似た名前のサービスは選び直しを案内する"),
      r("一次確認", "見る順番が人によってばらつく（イベントから見始めるなど）", "社内手順の順番（概要→影響範囲→関連エンティティ→連絡）で案内する"),
      r("一次連絡", "優先度・宛先・書き方が人による", "ツールチップで優先度の基準を示し、AI Hubが社内の形で下書きする（構想）"),
      r("ログ調査", "SPLを一から書けず、専門チームに依頼して待つ", "確認済みのひな型から調べ、AI HubがSPLと結果の読み方を説明する（構想）"),
      r("共有・再利用", "調べた条件が残らず、次も同じ依頼になる", "確認依頼を送り、レポートとして保存して次回に使う")
    ];
    s.addTable(rows, Object.assign({ y: 2.25, objectName: "ba-table" }, tableStyle([2.0, 4.6, 5.73], [0.45, 0.72, 0.72, 0.72, 0.72, 0.72])));
    foot(s, "Beforeはデモが置く仮説（確認必要）です。社内手順・判断基準はデモ用の架空の例です。");
    s.addNotes("工程ごとに、これまで人によって止まっていたところと、デモで見せる姿を並べています。");
  }

  /* ===== 8. デモの流れ ===== */
  pres.addSection({ title: "デモ" });
  {
    const s = content("デモ｜流れ", "デモ動画の流れ：3章＋振り返り（5分10秒）", "運用担当者（架空）が、問い合わせから一次確認・ログ分析までを一人で進める。各章の終わりに「伺いたいこと」を出します", "デモ");
    const ch = [
      ["第1章　問い合わせ・状況確認", "約1分10秒", "Service Analyzer（ITSI）", "ガイド6ステップ。時間範囲の指定、サービスの選び直し、健全性スコアの判断基準", "mock"],
      ["第2章　一次確認・連絡", "約1分30秒", "Episode Review → Entity Overview", "社内手順の4ステップ。順番の案内、優先度の基準、AI Hubが連絡文を下書き", "mock"],
      ["第3章　ログを調べる", "約1分30秒", "Search & Reporting（Splunk Cloud）", "公開したガイド7ステップを再生。AI HubがSPLと結果を説明し、依頼文を下書き", "real"]
    ];
    const cw = (CW - 2 * 0.2) / 3, chH = 2.45;
    ch.forEach((c, i) => {
      const x = M + i * (cw + 0.2), y = 2.25;
      card(s, x, y, cw, chH, c[0], "scene-" + i, i === 2 ? C.accent1 : C.accent2);
      text(s, c[1], { x: x + cw - 1.2, y, w: 1.1, h: 0.38, fontSize: 12, bold: true, color: C.background1, align: "right", valign: "middle", objectName: "scene-time-" + i });
      text(s, "画面：" + c[2], { x: x + 0.12, y: y + 0.5, w: cw - 0.24, h: 0.32, fontSize: 12, bold: true, color: C.accent1, objectName: "scene-screen-" + i });
      text(s, c[3], { x: x + 0.12, y: y + 0.86, w: cw - 0.24, h: 1.0, fontSize: 13, objectName: "scene-desc-" + i });
      badge(s, x + 0.12, y + chH - 0.42, c[4], "scene-badge-" + i);
    });
    const sub = [
      ["ガイドの作り方（実機）", "約20秒", "Splunk Cloudの実画面の上で吹き出しをつなげ、テックタッチの管理画面で公開する", "real"],
      ["振り返り", "約30秒", "今日の流れ、テックタッチが手当てした場面、確かめ方、本日伺いたいこと", null]
    ];
    const sw = (CW - 0.2) / 2;
    sub.forEach((c, i) => {
      const x = M + i * (sw + 0.2), y = 4.9;
      card(s, x, y, sw, 1.5, c[0], "sub-" + i, C.accent5);
      text(s, c[1], { x: x + sw - 1.2, y, w: 1.1, h: 0.38, fontSize: 12, bold: true, color: C.background1, align: "right", valign: "middle", objectName: "sub-time-" + i });
      text(s, c[2], { x: x + 0.12, y: y + 0.5, w: sw - 0.24, h: 0.55, fontSize: 13, objectName: "sub-desc-" + i });
      if (c[3]) badge(s, x + 0.12, y + 1.5 - 0.4, c[3], "sub-badge-" + i);
    });
    foot(s, "時間は動画の目安です。見出しが濃い青の第3章は、Splunk Cloudとテックタッチの実画面です。");
    s.addNotes("章ごとの見どころです。第3章は、Splunk Cloudのデモ環境で、公開したテックタッチのガイドを実際に再生した画面です。時間が限られる場合は、第3章を中心にご覧ください。");
  }

  /* ===== 9. 画面 ===== */
  {
    const s = content("デモ｜画面", "デモ動画の画面", "第1・2章はSplunkの画面イメージ、第3章はSplunk Cloud（デモ環境）とテックタッチの実画面。AI Hubは構想の画面イメージ", "デモ");
    const shots = [
      ["ch1_service_analyzer.jpg", "第1章　Service Analyzer", "悪化したKPIを、テックタッチのガイド（案）で確かめる", ["mock"]],
      ["ch2_aihub_notice.jpg", "第2章　Entity Overview＋AI Hub", "画面に置いたAIボタンから、AI Hubが一次連絡文の案を作る", ["mock", "hub"]],
      ["ch3_real_aihub.jpg", "第3章　Search & Reporting＋AI Hub", "公開したガイドの吹き出し⑤と、AIチェック（社内基準との照合）", ["real", "hub"]]
    ];
    const iw = (CW - 2 * 0.2) / 3;
    shots.forEach((sh, i) => {
      const x = M + i * (iw + 0.2), y = 2.25;
      const h = shot(s, sh[0], x, y, iw, SA, "shot-" + i);
      let bx = x;
      sh[3].forEach((k, j) => { bx += badge(s, bx, y + h + 0.12, k, "shot-badge-" + i + "-" + j) + 0.1; });
      text(s, sh[1], { x, y: y + h + 0.5, w: iw, h: 0.32, fontSize: 13, bold: true, color: C.accent1, objectName: "shot-title-" + i });
      text(s, sh[2], { x, y: y + h + 0.84, w: iw, h: 0.55, fontSize: 12, objectName: "shot-desc-" + i });
    });
    sq(s, M, 5.6, CW, 0.95, C.background1, C.accent6, "screen-note");
    text(s, bullets(["ITSI・IT Essentials Workはデモ環境に入っていないため、Splunk Cloudの実画面の色・配置に合わせた画面イメージで描いています", "青い吹き出し・パネルがテックタッチのガイド、紫の「AI Hub」の札が付いた吹き出しがAI Hub（構想・例文）です。AI Hubの見た目は、公開されている製品画面に合わせています"]), { x: M + 0.15, y: 5.66, w: CW - 0.3, h: 0.85, fontSize: 12, valign: "middle", objectName: "screen-note-text" });
    s.addNotes("第1章と第2章は、ITSIとIT Essentials Workがデモ環境に入っていないため、画面イメージです。第3章は、Splunk Cloudのデモ環境とテックタッチの実画面です。AI Hubはデモ環境に入っていないため、構想の画面イメージと例文です。");
  }

  /* ===== 10. 見せ場（第3章） ===== */
  {
    const s = content("デモ｜見せ場", "第3章は、テックタッチをSplunk Cloudの上で実際に動かす", "ガイドはSplunk Cloud（デモ環境）の実画面の上で作り、公開して再生した。ログはデモ用に生成した架空データ（823件）", "デモ");
    const steps = [
      ["①", "「レポート」を開く", null],
      ["②", "確認済みのひな型を、サーチで開く", null],
      ["③", "検索の中身（SPL）を確認する", "AI Hub：1行ずつ説明"],
      ["④", "時間範囲が障害の開始を含むか確認する", null],
      ["⑤", "10時台からの増加をグラフで確かめる", "AI Hub：社内基準と照合"],
      ["⑥", "共有して、専門チームに確認を依頼する", "AI Hub：依頼文を下書き"],
      ["⑦", "レポートとして保存し、運用チームに共有する", null]
    ];
    const lw = 6.45, rowH = 0.6;
    steps.forEach((st, i) => {
      const y = 2.25 + i * (rowH + 0.04);
      sq(s, M, y, 0.6, rowH, C.accent1, null, "gstep-num-bg-" + i);
      text(s, st[0], { x: M, y, w: 0.6, h: rowH, fontSize: 15, bold: true, color: C.background1, align: "center", valign: "middle", objectName: "gstep-num-" + i });
      sq(s, M + 0.6, y, lw - 0.6, rowH, C.background1, C.accent6, "gstep-" + i);
      text(s, st[1], { x: M + 0.78, y, w: st[2] ? 3.6 : lw - 0.9, h: rowH, fontSize: 13, valign: "middle", objectName: "gstep-text-" + i });
      if (st[2]) {
        sq(s, M + lw - 2.0, y + 0.14, 1.88, 0.32, AIHUB, null, "gstep-hub-" + i);
        text(s, st[2], { x: M + lw - 2.0, y: y + 0.14, w: 1.88, h: 0.32, fontSize: 11, bold: true, color: C.background1, align: "center", valign: "middle", objectName: "gstep-hub-text-" + i });
      }
    });
    const rx = M + lw + 0.3, rw = W - M - rx;
    const h = shot(s, "real_r07.jpg", rx, 2.25, rw, RS, "real-shot");
    badge(s, rx, 2.25 + h + 0.12, "real", "real-badge");
    text(s, "公開したガイドの吹き出し⑥（ジョブの共有ボタンを指す）", { x: rx + 0.95, y: 2.25 + h + 0.12, w: rw - 0.95, h: 0.28, fontSize: 12, valign: "middle", objectName: "real-caption" });
    foot(s, "AI Hubはデモ環境に入っていないため、動画では構想の画面イメージ（例文）を実画面の横に置いています。");
    s.addNotes("第3章がこのデモの見せ場です。テックタッチのガイドは、Splunk Cloudのデモ環境の実画面の上で作り、公開して再生しています。紫の印の付いたステップで、AI Hubが説明や下書きをする構想を重ねています。");
  }

  /* ===== 11. AI機能 ===== */
  {
    const s = content("デモ｜AI機能", "AI機能は、機能ごとに分けて評価する", "Splunk AI Assistant・ITSIのAI/ML・AI Hubは別のもの。まとめて「AIで速くなる」とは言わない", "デモ");
    const z = { fill: { color: THEME.colors.lt2 } };
    const rows = [
      [th("機能"), th("提供"), th("種類"), th("すること"), th("デモでの扱い")],
      [td("Splunk AI Assistant", { bold: true }), td("Splunk Cloud"), td("対話型の支援"), td("自然言語からSPL案を作り、SPLを説明する"), td("使っていない（トライアル環境では使えない）")],
      [td("Predictive Analytics", Object.assign({ bold: true }, z)), td("ITSI", z), td("予測", z), td("30分先の健全性スコアを予測する", z), td("扱っていない", z)],
      [td("エピソードの要約（Overviewタブ）", { bold: true }), td("ITSI 5.0"), td("要約・原因の推定"), td("AIによる要約、推定される原因、次の対応の推奨を表示する"), td("扱っていない（御社の版で確認）")],
      [td("AI Hub", Object.assign({ bold: true, color: AIHUB }, z)), td("テックタッチ", z), td("対話型の支援", z), td("社内のナレッジを参照し、説明・照合・下書きをする", z), td("構想の画面イメージと例文", z)]
    ];
    s.addTable(rows, Object.assign({ y: 2.25, objectName: "ai-table" }, tableStyle([2.55, 1.6, 1.75, 3.6, 2.83], [0.45, 0.75, 0.75, 0.75, 0.75])));
    text(s, "精度や削減率の数値は、お約束しません。効果は4つの指標で確かめます（次のページ）。", { x: M, y: 6.0, w: CW, h: 0.45, fontSize: 13, bold: true, color: C.accent4, valign: "middle", objectName: "ai-note" });
    foot(s, "Splunkの機能は、Splunk公式ドキュメントの抜粋で確認しています。ITSIの版によって、使える機能が異なります。");
    s.addNotes("AIの機能は、種類ごとに分けて扱います。Splunk AI AssistantはSPLの生成と説明、ITSIのPredictive Analyticsは予測、ITSI 5.0のエピソードの要約は要約と原因の推定です。AI Hubは社内のナレッジとの照合と下書きです。このデモで扱うのはAI Hubだけで、デモ環境にはないため構想の画面イメージです。");
  }

  /* ===== 12. 効果の確かめ方 ===== */
  pres.addSection({ title: "進め方" });
  {
    const s = content("進め方｜効果", "効果の確かめ方", "一つの作業で測る。現状を伺ってから、目標を決める", "進め方");
    const m = [
      ["自力完了率", "専門チームに依頼せずに、作業を終えられた割合（対象の作業ごと）"],
      ["所要時間", "問い合わせを受けてから、一次連絡までの時間（例）"],
      ["依頼件数", "専門チーム・委託先への問い合わせの件数"],
      ["再実行", "同じ作業を、次回も自力でできたか"]
    ];
    const cw = (CW - 3 * 0.2) / 4;
    m.forEach((it, i) => {
      const x = M + i * (cw + 0.2), hi = i === 0;
      sq(s, x, 2.25, cw, 3.55, hi ? C.accent1 : C.background2, hi ? null : C.accent6, "metric-" + i);
      text(s, "指標 " + (i + 1), { x: x + 0.15, y: 2.4, w: cw - 0.3, h: 0.3, fontSize: 12, color: hi ? C.background1 : C.accent5, objectName: "metric-num-" + i });
      text(s, it[0], { x: x + 0.15, y: 2.75, w: cw - 0.3, h: 0.95, fontSize: 20, bold: true, color: hi ? C.background1 : C.text1, objectName: "metric-name-" + i });
      text(s, "測り方", { x: x + 0.15, y: 3.9, w: cw - 0.3, h: 0.28, fontSize: 11, bold: true, color: hi ? C.background1 : C.accent5, objectName: "metric-howlab-" + i });
      text(s, it[1], { x: x + 0.15, y: 4.2, w: cw - 0.3, h: 1.45, fontSize: 13, color: hi ? C.background1 : C.text1, objectName: "metric-how-" + i });
    });
    text(s, "削減率などの数値は、事前にはお示ししません。ガイドの完了率だけでは判断せず、作業の結果で確かめます。", { x: M, y: 6.05, w: CW, h: 0.45, fontSize: 13, bold: true, color: C.accent4, valign: "middle", objectName: "metric-note" });
    s.addNotes("削減率の数字はお約束しません。一つの作業を選び、いまの時間と件数を伺ってから、目標を一緒に決めます。ガイドを最後まで進めたかどうかではなく、作業が終わったかどうかで確かめます。");
  }

  /* ===== 13. 事前に伺いたいこと ===== */
  {
    const s = content("進め方｜事前の確認", "事前に伺いたいこと", "デモの前提を御社の環境に合わせるために、先に確かめたい6項目", "進め方");
    const z = { fill: { color: THEME.colors.lt2 } };
    const data = [
      ["1", "Splunkの構成（Splunk Cloud／Enterprise、ITSIかIT Essentials Workか、版）と、対象サービスのログ・KPIの取り込み", "画面と前提。画面名は版で異なる場合がある", "Splunkの管理者"],
      ["2", "運用の体制（運用担当・専門チーム・委託先の役割分担）", "担当者が自分で確かめてよい範囲が決まる", "運用の責任者"],
      ["3", "障害時の社内手順（一次確認の順番・優先度の基準・連絡先）と、その置き場所", "ガイドとAI Hubのナレッジの元になる", "運用の責任者"],
      ["4", "端末の条件（ブラウザ、VDI、拡張機能の配布）", "テックタッチを入れられるかの前提", "情報システム部門"],
      ["5", "保存済みサーチ（レポート）の管理と、共有の範囲", "SPLのひな型を使えるかの前提", "Splunkの管理者"],
      ["6", "AI Hubに渡す情報の範囲", "業務・個人の情報が含まれうる", "情報セキュリティの責任者"]
    ];
    const rows = [[th("#"), th("確かめたいこと"), th("理由"), th("主な伺い先（想定）")]].concat(data.map((d, i) => {
      const o = i % 2 ? z : {};
      return [td(d[0], Object.assign({ bold: true, align: "center" }, o)), td(d[1], o), td(d[2], o), td(d[3], o)];
    }));
    s.addTable(rows, Object.assign({ y: 2.25, objectName: "ask-table" }, tableStyle([0.5, 5.6, 3.7, 2.53], [0.45, 0.8, 0.62, 0.62, 0.62, 0.62, 0.62])));
    foot(s, "「主な伺い先」は想定です。御社の体制に合わせて伺います。");
    s.addNotes("この6項目は、デモを御社の環境に合わせるための前提です。ITSIかIT Essentials Workか、版によって画面名や使える機能が異なるため、1番を最初に伺います。");
  }

  /* ===== 14. ご覧いただく前に ===== */
  {
    const s = content("進め方｜前提", "デモ動画をご覧いただく前に", "構想デモの前提を、先にお伝えします", "進め方");
    const n = [
      ["画面は、章によって異なります", "第1・2章（ITSI・IT Essentials Work）はデモ環境に入っていないため、画面イメージです。第3章はSplunk Cloud（デモ環境）とテックタッチの実画面です。画面名は版で異なる場合があります。"],
      ["架空のシナリオです", "特定の企業や事案を題材にしたものではありません。人物・企業名・サービス名・手順・件数は架空で、ログはデモ用に生成したデータです。"],
      ["AI Hubは構想です", "デモ環境に入っていないため、画面イメージと準備した例文です。Splunk AI Assistantは使っていません。"],
      ["テックタッチのガイドは案です", "第1・2章のガイドは案、第3章のガイドはデモ環境で作ったものです。御社の手順に合わせて作ります。"],
      ["数値の約束はしません", "効果は4つの指標で、一つの作業から確かめます。"]
    ];
    const rows = n.map((it) => [td(it[0], { bold: true, color: C.accent1, fill: { color: THEME.colors.accent3 }, fontSize: 13 }), td(it[1], { fontSize: 13 })]);
    s.addTable(rows, Object.assign({ y: 2.25, objectName: "pre-table" }, tableStyle([3.4, 8.93], [0.86, 0.82, 0.82, 0.82, 0.82])));
    s.addNotes("デモ動画の前提です。第1章と第2章は画面イメージ、第3章は実画面です。AI Hubは構想です。数字や人物はすべて架空です。");
  }

  /* ===== 15. 次の一歩 ===== */
  {
    const s = content("進め方｜次の一歩", "次の一歩", "入っているSplunkを、たまにしか使わない人が使い切る。その最初の一歩を、一緒に決めさせてください", "進め方");
    const st = [
      ["①　事前に伺いたい6項目", ["Splunkの構成、体制、社内手順、端末の条件、ひな型、AI Hubに渡す範囲を伺います"]],
      ["②　デモ動画（5分10秒）", ["章の終わりごとに、5つの問いに沿って伺います", "第3章は実画面、ほかは画面イメージです"]],
      ["③　最初に確かめる作業を決める", ["近い問いを一つ選びます", "その作業で、現状の時間と件数を測ります"]]
    ];
    const gap = 0.45, cw = (CW - 2 * gap) / 3;
    st.forEach((c, i) => {
      const x = M + i * (cw + gap);
      card(s, x, 2.25, cw, 2.6, c[0], "next-" + i, i === 2 ? C.accent1 : C.accent2);
      text(s, bullets(c[1], { paraSpaceAfter: 8 }), { x: x + 0.15, y: 2.8, w: cw - 0.3, h: 1.9, fontSize: 14, objectName: "next-body-" + i });
      if (i < st.length - 1) s.addShape(pres.shapes.CHEVRON, { x: x + cw + 0.14, y: 3.35, w: 0.17, h: 0.4, fill: { color: C.accent6 }, line: { type: "none" }, objectName: "next-arrow-" + i });
    });
    foot(s, "架空のシナリオの構想デモです。特定の企業や事案を題材にしたものではありません。");
    s.addNotes("最後に、次の一歩です。事前の6項目を伺い、デモ動画で5つの問いを一緒に確かめ、最初に測る作業を一つ決めます。");
  }
}

/* ==================== 短縮版（4枚）：デモ動画を流す直前の説明 ==================== */
async function buildShort() {
  /* ----- 1. 表紙 ----- */
  {
    const s = pres.addSlide({ masterName: "TITLE" });
    s.addText("Splunk\n障害対応・ログ分析\nデモのご説明", { placeholder: "title" });
    s.addText("Splunk Cloud（ITSI・IT Essentials Work）×\nテックタッチ（DAP＋AI Hub）", { placeholder: "body" });
    text(s, "たまにしかSplunkを使わない人が、\n迷わず・社内手順どおりに・自分で調べ切る", { x: 5.75, y: 2.45, w: 7.1, h: 1.05, fontSize: 22, bold: true, color: C.accent1, objectName: "headline" });
    text(s, bullets(["架空のA社の運用担当者の一日（問い合わせから、一次確認・ログ分析まで）", "デモ動画は3章＋振り返り（5分10秒）"]), { x: 5.75, y: 3.75, w: 7.1, h: 0.9, fontSize: 15, objectName: "headline-points" });
    text(s, "テックタッチ株式会社\n2026年10月\n架空のシナリオの構想デモです。特定の企業や事案を題材にしたものではありません。", { x: 5.75, y: 5.5, w: 7.1, h: 0.9, fontSize: 12, color: C.accent5, objectName: "meta" });
    s.addNotes("デモ動画の前に、3枚で前提をご説明します。架空のA社の運用担当者の一日を題材にした構想デモです。");
  }

  /* ----- 2. お見せすること ----- */
  {
    const s = content("デモの前に", "このデモでお見せすること", "製品を足す話ではない。入っているSplunkを、たまにしか使わない人が、迷わず・社内手順どおりに・自分で調べ切る姿を見せる");
    text(s, "題材：問い合わせから、ログ分析まで（運用担当者の一日・架空）", { x: M, y: 2.12, w: CW, h: 0.3, fontSize: 13, bold: true, objectName: "theme-head" });
    const end = timeline(s, 2.48, 1.2, 0.7);
    const cw = (CW - 2 * 0.2) / 3, cy = end + 0.2;
    POINTS.forEach((c, i) => {
      const x = M + i * (cw + 0.2);
      card(s, x, cy, cw, 1.45, c[0], "point-" + i);
      text(s, c[1].join("。") , { x: x + 0.12, y: cy + 0.46, w: cw - 0.24, h: 0.95, fontSize: 12, objectName: "point-body-" + i });
    });
    text(s, "デモが置く仮説（確認必要）：月に数回しか使わない人は、画面・手順・SPLで止まり、専門チームに聞いて待つ", { x: M, y: 6.3, w: CW, h: 0.45, fontSize: 13, bold: true, color: C.accent4, valign: "middle", objectName: "hypo" });
    foot(s, "原因の調査と対処は、これまでどおり専門チームが担います。時刻・件数はデモ用の架空の値です。");
    s.addNotes("製品を足す提案ではありません。入っているSplunkを、たまにしか使わない担当者が、迷わず、社内手順どおりに、自分で調べ切れるようにする提案です。原因の調査と対処は、これまでどおり専門チームが担います。");
  }

  /* ----- 3. 流れと見どころ ----- */
  {
    const s = content("デモの前に", "デモ動画の流れと見どころ", "運用担当者（架空）が、問い合わせから一次確認・ログ分析までを一人で進める。見せ場は、実画面の第3章");
    const sc = [
      ["第1章　状況確認", "約1分10秒", "Service Analyzerで、時間範囲・サービスを選び、悪化したKPIを確かめる", "mock"],
      ["第2章　一次確認・連絡", "約1分30秒", "社内手順の順番で確認し、AI Hubが一次連絡文を下書きする", "mock"],
      ["第3章　ログを調べる", "約1分30秒", "公開したガイドで、ひな型から調べる。AI HubがSPLと結果を説明する", "real"],
      ["ガイドの作り方", "約20秒", "実画面の上で吹き出しをつなげ、管理画面で公開する", "real"]
    ];
    const lw = 8.05, cw = (lw - 0.15) / 2, ch = 2.08;
    sc.forEach((c, i) => {
      const x = M + (i % 2) * (cw + 0.15), y = 2.25 + Math.floor(i / 2) * (ch + 0.14);
      const key = i === 2;
      card(s, x, y, cw, ch, c[0], "scene-" + i, key ? C.accent1 : C.accent2);
      text(s, c[1], { x: x + cw - 1.2, y, w: 1.1, h: 0.38, fontSize: 12, bold: true, color: C.background1, align: "right", valign: "middle", objectName: "scene-time-" + i });
      text(s, c[2], { x: x + 0.12, y: y + 0.5, w: cw - 0.24, h: 0.9, fontSize: 13, objectName: "scene-desc-" + i });
      const bw = badge(s, x + 0.12, y + ch - 0.42, c[3], "scene-badge-" + i);
      if (key) text(s, "見せ場", { x: x + 0.12 + bw + 0.12, y: y + ch - 0.42, w: 1.0, h: 0.28, fontSize: 12, bold: true, color: C.accent4, valign: "middle", objectName: "scene-key-" + i });
    });
    const rx = M + lw + 0.25, rw = W - M - rx;
    card(s, rx, 2.25, rw, 4.3, "画面の見分け方", "legend", C.accent1);
    const lg = [
      ["実画面", C.accent1, "Splunk Cloudとテックタッチ\n（デモ環境）"],
      ["画面イメージ", GRAYHEAD, "ITSI・IT Essentials Work\n（デモ環境に未導入）"],
      ["青の吹き出し", C.accent2, "テックタッチのガイド"],
      ["紫の札の吹き出し", AIHUB, "AI Hub（構想・例文）"]
    ];
    lg.forEach((l, i) => {
      const y = 2.78 + i * 0.92;
      sq(s, rx + 0.18, y, 0.42, 0.42, l[1], null, "legend-swatch-" + i);
      text(s, l[0], { x: rx + 0.75, y: y - 0.02, w: rw - 0.9, h: 0.3, fontSize: 14, bold: true, objectName: "legend-name-" + i });
      text(s, l[2], { x: rx + 0.75, y: y + 0.3, w: rw - 0.9, h: 0.5, fontSize: 12, color: C.accent5, objectName: "legend-desc-" + i });
    });
    foot(s, "振り返り（約30秒）では、流れ・手当てした場面・確かめ方・伺いたいことをまとめます。");
    s.addNotes("各章の終わりに「伺いたいこと」を一つ出します。第3章は、Splunk Cloudのデモ環境で、公開したテックタッチのガイドを実際に再生した画面です。");
  }

  /* ----- 4. ご覧いただく前に ----- */
  {
    const s = content("デモの前に", "ご覧いただく前に", "人物・手順・数値は架空です。デモ動画の中で、右の問いを御社に当てはめてご覧ください");
    const lw = 5.9, rx = M + lw + 0.25, rw = W - M - rx;
    card(s, M, 2.25, lw, 4.42, "デモの前提", "premise");
    const pre = [
      ["画面は章によって異なる", "第1・2章は画面イメージ、第3章は実画面です"],
      ["架空のシナリオ", "特定の企業や事案を題材にしていません"],
      ["AI Hubは構想", "デモ環境に入っていないため、画面イメージと例文です"],
      ["ガイドは案", "御社の手順に合わせて作ります（第3章はデモ環境で作成）"],
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
      "画面の探し方・時間範囲・サービスの選び分けのどこで迷いますか",
      "一次確認で、人によって手順がばらつくのはどこですか",
      "ひな型選び・時間範囲・結果の読み方のどこで手が止まりますか",
      "迷ったとき、今は誰に聞いていますか",
      "「自分で調べ切れた」と判断する基準はありますか"
    ];
    qs.forEach((q, i) => {
      const y = 2.75 + i * 0.78;
      sq(s, rx + 0.18, y + 0.04, 0.6, 0.55, C.accent1, null, "q-num-bg-" + i);
      text(s, "Q" + (i + 1), { x: rx + 0.18, y: y + 0.04, w: 0.6, h: 0.55, fontSize: 13, bold: true, color: C.background1, align: "center", valign: "middle", objectName: "q-num-" + i });
      text(s, q, { x: rx + 0.92, y: y + 0.04, w: rw - 1.1, h: 0.55, fontSize: 13, valign: "middle", objectName: "q-text-" + i });
    });
    foot(s, "答えにくい問いが、デモで一緒に確かめたいところです。章の終わりごとに伺います。");
    s.addNotes("デモ動画の前提です。第1章と第2章は画面イメージ、第3章は実画面です。AI Hubは構想です。数字や人物はすべて架空です。デモの中で、この5つの問いを御社に当てはめてご覧ください。");
  }
}

(async () => {
  if (SHORT) await buildShort(); else await buildFull();
  await pres.writeFile({ fileName: OUT });
  if (APPLY_THEME) {
    const { applyTheme } = require(APPLY_THEME);
    await applyTheme(OUT, THEME);
  }
  await setJapaneseFont(OUT, THEME.bodyFontFace);
  console.log("ok", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
