// 事前説明資料（PowerPoint）を作る。架空のシナリオ・イメージデモの説明で、お客様固有の内容は入れない。
// 使い方（このフォルダで）:
//   npm install pptxgenjs@3.12.0 react-icons@5.3.0 react@18.3.1 react-dom@18.3.1 sharp@0.33.5
//   node build_deck.js            → M365乗っ取り対応デモ_事前説明.pptx
// 配色はテックタッチの資料（青 0B7FB5・濃紺 1B2B45・AI Hub の紫 6A4C9C）に合わせる。
const path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");

const OUT = process.env.OUT || path.join(__dirname, "M365乗っ取り対応デモ_事前説明.pptx");
const IMG = (n) => path.join(__dirname, "img", n);
const APPLY_THEME = process.env.APPLY_THEME; // pptx スキルの scripts/apply_theme.js（無ければテーマ色の書き込みを省く）

const THEME = {
  name: "Techtouch Briefing",
  headFontFace: "游ゴシック",
  bodyFontFace: "游ゴシック",
  colors: {
    dk1: "1F2937", lt1: "FFFFFF", dk2: "1B2B45", lt2: "EAF4FA",
    accent1: "0B7FB5", // テックタッチの青
    accent2: "6A4C9C", // AI Hub の紫
    accent3: "2E7D5B", // 緑（完了・社内）
    accent4: "B35F17", // 橙（注意）
    accent5: "6B7280", // グレー（補足・委託先）
    accent6: "075E86", // 濃い青
    hlink: "0B7FB5", folHlink: "6A4C9C"
  }
};
const HEX = THEME.colors;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "M365アカウントの乗っ取りを、入っているSplunkで社内で回す（事前説明）";
pres.subject = "Splunk ES＋UEBA＋SOAR × テックタッチ（DAP＋AI Hub）イメージデモの事前説明";
pres.author = "テックタッチ";
const C = pres.SchemeColor;
const W = 13.333, M = 0.6;
const FOOT = "テックタッチ｜事前説明資料（架空のシナリオ・イメージデモ）";

/* ---------- レイアウト ---------- */
pres.defineSlideMaster({
  title: "TITLE_DARK",
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 1.75, w: 6.6, h: 2.1, fontSize: 30, bold: true, color: C.background1, align: "left", valign: "top", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M, y: 3.3, w: 6.6, h: 1.3, fontSize: 16, color: C.background2, align: "left", valign: "top", margin: 0 }, text: "" } }
  ]
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: C.background1 },
  margin: [0.5, 0.6, 0.7, 0.6],
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.38, w: W - 2 * M, h: 0.62, fontSize: 26, bold: true, color: C.text2, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "lead", type: "body", x: M, y: 1.0, w: W - 2 * M, h: 0.42, fontSize: 15, color: C.accent5, valign: "top", margin: 0 }, text: "" } },
    { text: { text: FOOT, options: { x: M, y: 7.02, w: 9, h: 0.28, fontSize: 10, color: C.accent5, margin: 0, valign: "middle" } } }
  ],
  slideNumber: { x: W - M - 0.6, y: 7.02, w: 0.6, h: 0.28, fontSize: 10, color: C.accent5, align: "right" }
});
pres.defineSlideMaster({
  title: "CLOSING_DARK",
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.55, w: W - 2 * M, h: 0.8, fontSize: 30, bold: true, color: C.background1, align: "left", valign: "middle", margin: 0 }, text: "" } },
    { text: { text: FOOT, options: { x: M, y: 7.02, w: 9, h: 0.28, fontSize: 10, color: C.background2, margin: 0, valign: "middle" } } }
  ],
  slideNumber: { x: W - M - 0.6, y: 7.02, w: 0.6, h: 0.28, fontSize: 10, color: C.background2, align: "right" }
});

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

/* ---------- 部品 ---------- */
const iconCache = new Map();
async function icon(Comp, hex = "FFFFFF") {
  const key = Comp.name + hex;
  if (!iconCache.has(key)) {
    const svg = renderToStaticMarkup(React.createElement(Comp, { color: "#" + hex, size: 256 }));
    const buf = await sharp(Buffer.from(svg)).png().toBuffer();
    iconCache.set(key, "image/png;base64," + buf.toString("base64"));
  }
  return iconCache.get(key);
}
// 色の丸の中に白いアイコン（資料全体の目印）
async function badge(s, Comp, x, y, d, color, name) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color }, line: { type: "none" }, objectName: name + "-circle" });
  const p = d * 0.27;
  s.addImage({ data: await icon(Comp), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, objectName: name + "-icon" });
}
function numBadge(s, n, x, y, d, color, name) {
  s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color }, line: { type: "none" }, objectName: name + "-circle" });
  s.addText(String(n), { x, y, w: d, h: d, fontSize: d > 0.5 ? 16 : 13, bold: true, color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: name + "-num" });
}
function card(s, x, y, w, h, color, transparency, name) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color, transparency }, line: { type: "none" }, objectName: name });
}
function text(s, t, o) {
  s.addText(t, Object.assign({ isTextBox: true, margin: 0, valign: "top", color: C.text1, fontSize: 14, paraSpaceAfter: 0 }, o));
}
function content(title, lead, section) {
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: section });
  s.addText(title, { placeholder: "title" });
  if (lead) s.addText(lead, { placeholder: "lead" });
  return s;
}

(async () => {
  /* ===== 1. 表紙 ===== */
  pres.addSection({ title: "はじめに" });
  {
    const s = pres.addSlide({ masterName: "TITLE_DARK", sectionTitle: "はじめに" });
    text(s, "事前説明資料", { x: M, y: 1.15, w: 4, h: 0.4, fontSize: 14, bold: true, color: C.background2, objectName: "eyebrow" });
    s.addText("M365アカウントの乗っ取りを、\n入っているSplunkで社内で回す", { placeholder: "title" });
    s.addText("Splunk ES＋UEBA＋SOAR ×\nテックタッチ（DAP＋AI Hub）\nイメージデモのご案内", { placeholder: "body" });
    text(s, "2026年10月　テックタッチ", { x: M, y: 5.2, w: 5, h: 0.35, fontSize: 14, color: C.background1, objectName: "date" });
    text(s, "架空のシナリオとイメージデモです。特定の企業や事案を題材にしたものではありません。画面・人物・企業名・手順・数値はすべて架空です。", { x: M, y: 6.35, w: 12.1, h: 0.5, fontSize: 11, color: C.background2, objectName: "disclaimer" });
    s.addImage({ path: IMG("screen_ir.jpg"), x: 7.45, y: 1.55, w: 5.3, h: 3.15, sizing: { type: "cover", w: 5.3, h: 3.15 }, shadow: { type: "outer", color: "000000", opacity: 0.35, blur: 8, offset: 3, angle: 90 }, objectName: "cover-screen" });
    text(s, "Incident Review の画面イメージ（架空）", { x: 7.45, y: 4.8, w: 5.3, h: 0.3, fontSize: 11, color: C.background2, objectName: "cover-caption" });
    s.addNotes("本日は、デモの前に、シナリオの前提と見どころをご説明します。架空のA社を舞台にした、一般的なSOC事案の型のシナリオです。特定の企業や事案を題材にしたものではありません。");
  }

  /* ===== 2. お伝えしたいこと ===== */
  {
    const s = content("本日お伝えしたいこと", null, "はじめに");
    card(s, M, 1.25, 5.3, 4.55, C.background2, 0, "message-bg");
    text(s, "製品を足す話ではありません。", { x: M + 0.4, y: 1.65, w: 4.6, h: 0.5, fontSize: 20, bold: true, color: C.text2, objectName: "message-1" });
    text(s, "入っているES・UEBA・SOARを、社内の人が判断・承認・記録まで使い切る話です。", { x: M + 0.4, y: 2.25, w: 4.6, h: 1.6, fontSize: 20, bold: true, color: C.accent1, objectName: "message-2" });
    text(s, "このデモで確かめるのは「ツールが動くこと」ではなく、SOC担当者がノータブルの後を、社内の基準で最後まで進められることです。", { x: M + 0.4, y: 4.0, w: 4.6, h: 1.4, fontSize: 14, color: C.text1, objectName: "message-3" });
    const pts = [
      [fa.FaUserCheck, "ノータブルの後を、社内で進める", "「本人の利用か」の確認と一次対応を、社内の手順で最後まで"],
      [fa.FaLock, "承認段階を決めて、SOARを動かす", "誰の承認で何を止めるかを、プレイブックの入力に組み込む"],
      [fa.FaClipboardList, "範囲・記録・改善を、社内に残す", "次の事案で、同じ時間をかけない"]
    ];
    for (let i = 0; i < pts.length; i++) {
      const y = 1.25 + i * 1.55;
      card(s, 6.3, y, 6.43, 1.35, C.background1, 0, "point-" + i);
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 6.3, y, w: 6.43, h: 1.35, rectRadius: 0.08, fill: { type: "none" }, line: { color: C.background2, width: 1.25 }, objectName: "point-frame-" + i });
      await badge(s, pts[i][0], 6.55, y + 0.33, 0.7, C.accent1, "point-badge-" + i);
      text(s, pts[i][1], { x: 7.5, y: y + 0.22, w: 5.0, h: 0.42, fontSize: 16, bold: true, color: C.text2, objectName: "point-head-" + i });
      text(s, pts[i][2], { x: 7.5, y: y + 0.68, w: 5.0, h: 0.5, fontSize: 14, color: C.text1, objectName: "point-body-" + i });
    }
    await badge(s, fa.FaHandsHelping, M, 6.12, 0.5, C.accent5, "partner");
    text(s, "委託先の夜間監視・高度な分析・フォレンジックは、これまでどおりです。社内が判断し、動き、記録できる範囲を広げる話です。", { x: M + 0.65, y: 6.1, w: 11.4, h: 0.55, fontSize: 14, color: C.text1, valign: "middle", objectName: "partner-text" });
    s.addNotes("製品を足す提案ではありません。入っているES・UEBA・SOARを、社内の人が判断・承認・記録まで使い切る提案です。委託先の仕事を取り上げる話でもありません。夜間監視や高度な分析は委託先に続けていただき、一次対応の判断、封じ込めの承認、範囲の確定、記録、ルール変更を社内で持てるようにする話です。");
  }

  /* ===== 3. 題材 ===== */
  pres.addSection({ title: "シナリオ" });
  {
    const s = content("題材：M365アカウントの乗っ取り", "多くの組織で起きる一般的な事案の型を、架空のA社に置いたシナリオです", "シナリオ");
    const steps = [
      [fa.FaFish, "フィッシング\nメール", "取引先を装った\nリンク"],
      [fa.FaKey, "セッションを\n盗まれる", "AiTM型の想定"],
      [fa.FaGlobeAsia, "普段と違う場所\nからサインイン", "深夜・国外・\nMFA済み"],
      [fa.FaShareSquare, "外部への\n転送ルール", "受信トレイの\nルールを作成"],
      [fa.FaCloudDownloadAlt, "大量の\nダウンロード", "SharePointから\n1,200件"],
      [fa.FaEnvelopeOpenText, "社内へ\nフィッシング", "380名へ\nリンク付きメール"]
    ];
    const x0 = M, cw = 1.85, gap = 0.2;
    for (let i = 0; i < steps.length; i++) {
      const x = x0 + i * (cw + gap), inScope = i >= 2;
      card(s, x, 1.65, cw, 2.5, inScope ? C.accent1 : C.accent5, inScope ? 90 : 90, "step-" + i);
      await badge(s, steps[i][0], x + (cw - 0.75) / 2, 1.85, 0.75, inScope ? C.accent1 : C.accent5, "step-badge-" + i);
      text(s, steps[i][1], { x: x + 0.12, y: 2.75, w: cw - 0.24, h: 0.75, fontSize: 14, bold: true, color: C.text2, align: "center", objectName: "step-head-" + i });
      text(s, steps[i][2], { x: x + 0.12, y: 3.5, w: cw - 0.24, h: 0.55, fontSize: 12, color: C.text1, align: "center", objectName: "step-body-" + i });
      if (i < steps.length - 1) s.addShape(pres.shapes.CHEVRON, { x: x + cw + 0.04, y: 2.78, w: 0.13, h: 0.28, fill: { color: C.accent5 }, line: { type: "none" }, objectName: "step-arrow-" + i });
    }
    // 範囲の表示
    card(s, x0, 4.35, 2 * cw + gap, 0.62, C.accent5, 85, "scope-out");
    text(s, "入口の防止は、SIEM・DAPの範囲外", { x: x0 + 0.1, y: 4.35, w: 2 * cw + gap - 0.2, h: 0.62, fontSize: 13, color: C.text1, align: "center", valign: "middle", objectName: "scope-out-text" });
    card(s, x0 + 2 * (cw + gap), 4.35, 4 * cw + 3 * gap, 0.62, C.accent1, 0, "scope-in");
    text(s, "デモの範囲：速く気づき、社内で止め、範囲を確定し、記録する", { x: x0 + 2 * (cw + gap) + 0.1, y: 4.35, w: 4 * cw + 3 * gap - 0.2, h: 0.62, fontSize: 15, bold: true, color: C.background1, align: "center", valign: "middle", objectName: "scope-in-text" });
    // 仮説
    card(s, M, 5.3, W - 2 * M, 1.3, C.accent4, 90, "hypo-bg");
    await badge(s, fa.FaExclamationTriangle, M + 0.3, 5.6, 0.7, C.accent4, "hypo-badge");
    text(s, "デモが置く仮説（確認必要）", { x: M + 1.25, y: 5.45, w: 10.5, h: 0.4, fontSize: 14, bold: true, color: C.accent4, objectName: "hypo-head" });
    text(s, "UEBAのノータブルは出たが、「本人の利用か」を確かめる手順と担当が社内に無く、委託先の問い合わせ待ちで一次対応が4時間止まる。誰の承認でアカウントを止めるかも決まっていない。", { x: M + 1.25, y: 5.85, w: 10.7, h: 0.7, fontSize: 14, color: C.text1, objectName: "hypo-body" });
    text(s, "件数・時刻はデモ用の架空の値です。", { x: M, y: 6.65, w: 6, h: 0.3, fontSize: 10, color: C.accent5, objectName: "fiction-note" });
    s.addNotes("Microsoft 365のアカウントの乗っ取りは、多くの組織で起きる一般的な事案の型です。入口のフィッシングを防ぐ話はしません。速く気づき、社内で止め、範囲を確定し、記録する、までがこのシナリオの範囲です。仮説は確かめるべき前提として置いています。");
  }

  /* ===== 4. 構造 ===== */
  {
    const s = content("ツールはそろっているのに、守り切れない構造", "ES・UEBA・SOARには、それぞれ社内の人が決め続ける仕事が付いています", "シナリオ");
    const head = (t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text2 }, fontSize: 14, valign: "middle" } });
    const cell = (t, o = {}) => ({ text: t, options: Object.assign({ fontSize: 14, color: C.text1, valign: "top" }, o) });
    const rows = [
      [head("製品"), head("製品がすること"), head("社内が決め続けること"), head("社内に決める人がいないと起きること")],
      [cell("ES（SIEM）", { bold: true, color: C.text2 }), cell("ログの相関、ノータブル、調査画面"), cell("M365の監査ログを入れるか、閾値と例外（移行作業・出張）、誰がノータブルを見るか"), cell("ルールの変更が数週間待ち。ノータブルの後の判断が社内に残らない")],
      [cell("UEBA", { bold: true, color: C.text2 }), cell("利用者・端末の行動の異常"), cell("「異常」と「本人の利用」の境目（出張・在宅・新しい端末）、本人確認の手順"), cell("異常のスコアが出ても、誰が本人に確かめるかが決まらず、放置される")],
      [cell("SOAR", { bold: true, color: C.text2 }), cell("プレイブックによる自動対応"), cell("どこまで自動で動かすか、誰の承認で止めるか、例外（役員・管理者）"), cell("承認待ちでプレイブックが止まる。または止めてはいけないものを止める")]
    ];
    s.addTable(rows, { x: M, y: 1.65, w: W - 2 * M, colW: [1.75, 2.7, 4.05, 3.63], border: { type: "solid", pt: 0.75, color: "D5DCE4" }, fill: { color: C.background1 }, margin: [0.1, 0.12, 0.1, 0.12], rowH: [0.5, 1.05, 1.05, 1.05], objectName: "structure-table" });
    card(s, M, 5.75, W - 2 * M, 0.85, C.background2, 0, "structure-note-bg");
    await badge(s, fa.FaLightbulb, M + 0.25, 5.92, 0.5, C.accent1, "structure-note-badge");
    text(s, "監視を委託先に任せるほど、自社に固有の判断（その人は出張中か、誰が止めてよいか）は、社内が持っていないと回りません。", { x: M + 0.95, y: 5.75, w: 11.0, h: 0.85, fontSize: 14, color: C.text1, valign: "middle", objectName: "structure-note" });
    s.addNotes("ES・UEBA・SOARは、入れれば守れる製品ではありません。閾値と例外、異常と本人の利用の境目、誰の承認で止めるか、を社内の人が決め続ける仕事が付いています。委託先が悪いという話ではなく、自社に固有の判断を社内に置く、という話です。");
  }

  /* ===== 5. 5つの問い ===== */
  {
    const s = content("事前に考えていただきたい5つの問い", "デモの各場面の終わりに、この問いに沿って伺います", "シナリオ");
    const qs = [
      "ノータブルやアラートの後の一次対応は、委託先のチケットを待つ形になっていますか",
      "M365など自社のクラウドサービスの検知ルールや閾値を変えるとき、社内で完結せず、見積もりと改修を待ちますか",
      "SOARのプレイブックが「いつ・何を・誰の承認で」動くかを、社内の担当者が説明できますか",
      "過去の事案の調査記録と判断理由は、社内が読める場所にありますか。委託先のチケットにしかありませんか",
      "直近の事案の発見は、自社の検知でしたか。外部（クラウド事業者・委託先・通報）でしたか"
    ];
    for (let i = 0; i < qs.length; i++) {
      const y = 1.65 + i * 0.98;
      numBadge(s, "Q" + (i + 1), M, y + 0.08, 0.62, C.accent1, "q-" + i);
      text(s, qs[i], { x: M + 0.85, y, w: 7.3, h: 0.8, fontSize: 15, color: C.text1, valign: "middle", objectName: "q-text-" + i });
    }
    card(s, 9.05, 1.65, 3.68, 4.75, C.background2, 0, "q-callout");
    await badge(s, fa.FaComments, 9.35, 1.95, 0.7, C.accent1, "q-callout-badge");
    text(s, "すぐに答えにくい問いが、デモで一緒に確かめたいところです", { x: 9.35, y: 2.85, w: 3.1, h: 1.3, fontSize: 17, bold: true, color: C.text2, objectName: "q-callout-head" });
    text(s, "答えが委託先寄りになるほど、論点は「ツールの機能」ではなく「運用の実行力」になります。", { x: 9.35, y: 4.25, w: 3.1, h: 1.6, fontSize: 14, color: C.text1, objectName: "q-callout-body" });
    s.addNotes("当日は、場面の終わりごとに「伺いたいこと」を一つずつお出しします。事前にこの5つを見ていただくと、どの場面を厚く見るかを決めやすくなります。");
  }

  /* ===== 6. 役割 ===== */
  {
    const s = content("誰が何を担うか", "製品・テックタッチ・人の役割を固定してから、デモを組んでいます", "シナリオ");
    const cols = [
      { head: "Splunk（入っている製品）", color: C.text2, items: [
        ["Splunk ES", "ログの相関、ノータブル、Incident Review、相関検索、リスクベースアラート"],
        ["UEBA（ESの機能）", "行動の異常（普段と違う場所・時間・量、初めての操作）"],
        ["Splunk SOAR", "プレイブックによる自動対応（セッション失効、ルール無効化、アカウント停止）"],
        ["Splunk AI Assistant", "自然言語からSPL案を作り、既存SPLを説明・修正する"]] },
      { head: "テックタッチ", color: C.accent1, items: [
        ["AI Hub（構想）", "社内の基準・手順・権限と照合し、確認事項・確認文・記録の形・次の行動を整理する"],
        ["DAP（ガイド・入力チェック）", "ES・SOARの画面の上で、操作の順番・必須の確認・入力のルール・承認段階を示す"]] },
      { head: "人", color: C.accent3, items: [
        ["委託先（MSSP）", "夜間監視・高度な分析・\nフォレンジック（これまでどおり）"],
        ["社内（SOC・CSIRT）", "判断・承認・記録・ルール変更を持つ"]] }
    ];
    const cw = [4.45, 3.7, 3.64], gap = 0.17;
    let x = M;
    for (let c = 0; c < cols.length; c++) {
      const col = cols[c];
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.6, w: cw[c], h: 0.5, rectRadius: 0.08, fill: { color: col.color }, line: { type: "none" }, objectName: "role-head-bg-" + c });
      text(s, col.head, { x: x + 0.15, y: 1.6, w: cw[c] - 0.3, h: 0.5, fontSize: 15, bold: true, color: C.background1, valign: "middle", objectName: "role-head-" + c });
      const ih = col.items.length === 4 ? 1.08 : 2.25;
      for (let i = 0; i < col.items.length; i++) {
        const y = 2.25 + i * (ih + 0.1);
        const isHub = col.items[i][0].startsWith("AI Hub");
        card(s, x, y, cw[c], ih, isHub ? C.accent2 : col.color, 90, "role-card-" + c + "-" + i);
        text(s, col.items[i][0], { x: x + 0.2, y: y + 0.12, w: cw[c] - 0.4, h: 0.36, fontSize: 15, bold: true, color: isHub ? C.accent2 : C.text2, objectName: "role-name-" + c + "-" + i });
        text(s, col.items[i][1], { x: x + 0.2, y: y + 0.5, w: cw[c] - 0.4, h: ih - 0.6, fontSize: 13, color: C.text1, objectName: "role-desc-" + c + "-" + i });
      }
      x += cw[c] + gap;
    }
    s.addNotes("ログの相関と調査画面はES、行動の異常はUEBA、自動対応はSOAR、検索案はSplunk AI Assistant。社内の基準・手順・権限との照合はAI Hub、手順の抜け漏れ防止と入力チェックはテックタッチのガイドです。委託先は夜間の監視と高度な分析を続け、社内は判断・承認・記録・改善を持ちます。");
  }

  /* ===== 7. Before / After ===== */
  {
    const s = content("工程ごとの Before → After", "委託先任せで止まっていたところを、社内の基準と承認で進めます", "シナリオ");
    const rows = [
      ["検知", "閾値が業務に合わず、ルールの変更は委託先の改修待ち", "社内基準D-02（普段と違う接続元の後の、外部転送ルールと大量ダウンロード）で相関検索を社内で作る"],
      ["一次対応", "委託先に連絡し、回答を待つ", "チェックリストを埋めてから封じ込めへ。本人と上長に確かめる"],
      ["封じ込め", "停止の承認が取れず、乗っ取りが続く", "①②は担当者が即時、③はSOC責任者、④はCSIRT責任者の判断"],
      ["範囲の確定・記録", "「いつ・何が・どこまで」が委託先の分析待ち", "操作を種類別に確定し、他アカウントも確かめて、4項目で記録"],
      ["改善", "一件ごとに終わり、次も同じ時間がかかる", "検知条件・承認段階・記録をナレッジにし、役割分担を書き換える"]
    ];
    text(s, "Before", { x: 2.6, y: 1.55, w: 3.6, h: 0.32, fontSize: 13, bold: true, color: C.accent5, objectName: "ba-h1" });
    text(s, "After（社内が回す）", { x: 6.85, y: 1.55, w: 5.9, h: 0.32, fontSize: 13, bold: true, color: C.accent1, objectName: "ba-h2" });
    for (let i = 0; i < rows.length; i++) {
      const y = 1.95 + i * 0.97;
      text(s, rows[i][0], { x: M, y, w: 1.85, h: 0.85, fontSize: 15, bold: true, color: C.text2, valign: "middle", objectName: "ba-step-" + i });
      card(s, 2.5, y, 3.85, 0.85, C.accent5, 88, "ba-before-" + i);
      text(s, rows[i][1], { x: 2.65, y, w: 3.55, h: 0.85, fontSize: 13, color: C.text1, valign: "middle", objectName: "ba-before-text-" + i });
      s.addShape(pres.shapes.RIGHT_ARROW, { x: 6.42, y: y + 0.29, w: 0.36, h: 0.28, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "ba-arrow-" + i });
      card(s, 6.85, y, 5.88, 0.85, C.accent1, 88, "ba-after-" + i);
      text(s, rows[i][2], { x: 7.0, y, w: 5.6, h: 0.85, fontSize: 13, color: C.text1, valign: "middle", objectName: "ba-after-text-" + i });
    }
    s.addNotes("工程ごとに、これまで止まっていたところと、デモで見せる姿を並べています。①〜④の承認段階は、デモ用の架空の例です。実際の承認者は御社の対応権限表に合わせます。");
  }

  /* ===== 8. デモの流れ ===== */
  pres.addSection({ title: "デモ" });
  {
    const s = content("デモの流れ：9場面（36分）＋振り返り（1分）", "SOC担当者の山田さん（架空）が、検知の社内化から記録・改善までを一人で進めます", "デモ");
    const sc = [
      ["S0", "現場の問題", "2分", "依頼カードと、画面に残す5つの成果物"],
      ["S1", "Before", "3分", "ノータブルが4時間未割当。件数だけの検索では区別できない"],
      ["S2", "要件整理", "4分", "日本語の依頼を、AI Hubが社内基準で依頼文に"],
      ["S3", "相関検索案・照合", "5分", "Assistantの案を、AI Hubが検知基準D-02と照合"],
      ["S4", "検証・保存", "5分", "テストログで検証し、相関検索として保存"],
      ["S5", "一次対応", "5分", "担当者を自分に。本人と上長に確認。チェックリスト"],
      ["S6", "封じ込め", "4分", "SOARのプレイブックを、承認段階どおりに実行"],
      ["S7", "範囲の確定・記録", "5分", "操作と他アカウントを確定し、4項目で記録"],
      ["S8", "改善", "3分", "ナレッジへの反映と、委託先との役割分担の書き換え"]
    ];
    const cw = 3.9, ch = 1.48, gx = 0.21, gy = 0.18;
    for (let i = 0; i < sc.length; i++) {
      const x = M + (i % 3) * (cw + gx), y = 1.6 + Math.floor(i / 3) * (ch + gy);
      const hub = ["S2", "S3", "S8"].includes(sc[i][0]);
      card(s, x, y, cw, ch, C.background2, 0, "scene-" + i);
      numBadge(s, sc[i][0], x + 0.2, y + 0.2, 0.62, hub ? C.accent2 : C.accent1, "scene-badge-" + i);
      text(s, sc[i][1], { x: x + 0.98, y: y + 0.2, w: cw - 1.9, h: 0.4, fontSize: 15, bold: true, color: C.text2, objectName: "scene-name-" + i });
      text(s, sc[i][2], { x: x + cw - 0.9, y: y + 0.22, w: 0.72, h: 0.36, fontSize: 13, color: C.accent5, align: "right", objectName: "scene-time-" + i });
      text(s, sc[i][3], { x: x + 0.98, y: y + 0.64, w: cw - 1.15, h: 0.75, fontSize: 13, color: C.text1, objectName: "scene-desc-" + i });
    }
    numBadge(s, "", M, 6.62, 0.26, C.accent2, "legend-hub");
    text(s, "AI Hubが中心の場面", { x: M + 0.36, y: 6.6, w: 2.2, h: 0.3, fontSize: 11, color: C.accent5, objectName: "legend-hub-text" });
    numBadge(s, "", M + 2.6, 6.62, 0.26, C.accent1, "legend-tt");
    text(s, "テックタッチのガイドが中心の場面", { x: M + 2.96, y: 6.6, w: 4, h: 0.3, fontSize: 11, color: C.accent5, objectName: "legend-tt-text" });
    s.addNotes("場面ごとの見せ場です。各場面の終わりに「伺いたいこと」を一つ出します。時間が限られる場合は、S1・S5・S6を中心に短くできます。");
  }

  /* ===== 9. 画面イメージ ===== */
  {
    const s = content("デモの画面（イメージ）", "Splunk公式のUI部品で組んだ画面イメージです。ES・SOARの実画面ではありません", "デモ");
    const shots = [
      ["screen_ir.jpg", "S1　Incident Review", "UEBAのノータブルが、担当者未割当のまま"],
      ["screen_cs.jpg", "S4　相関検索の作成", "命名規則・実行間隔・リスク・緊急度・抑制を入力チェック（案）"],
      ["screen_soar.jpg", "S6　SOARのプレイブック", "承認段階どおりに①〜③を実行。③はSOC責任者の承認待ち"]
    ];
    const iw = 3.9, ih = 2.2, gx = 0.21;
    for (let i = 0; i < shots.length; i++) {
      const x = M + i * (iw + gx), y = 1.75;
      s.addImage({ path: IMG(shots[i][0]), x, y, w: iw, h: ih, sizing: { type: "cover", w: iw, h: ih }, shadow: { type: "outer", color: "1B2B45", opacity: 0.25, blur: 6, offset: 2, angle: 90 }, objectName: "shot-" + i });
      text(s, shots[i][1], { x, y: y + ih + 0.18, w: iw, h: 0.38, fontSize: 15, bold: true, color: C.text2, objectName: "shot-title-" + i });
      text(s, shots[i][2], { x, y: y + ih + 0.58, w: iw, h: 0.65, fontSize: 13, color: C.text1, objectName: "shot-desc-" + i });
    }
    card(s, M, 5.55, W - 2 * M, 1.05, C.background2, 0, "screen-note-bg");
    await badge(s, fa.FaExchangeAlt, M + 0.25, 5.8, 0.55, C.accent1, "screen-note-badge");
    text(s, "社内ポータル（チケット管理・チャット）は、Splunkとは別のシステムとして描いています。チケットの「Splunk ESで開く」から、Splunkに移ります。青い吹き出しがテックタッチのガイド（案）、紫の枠がAI Hub（構想・例文）です。", { x: M + 1.0, y: 5.55, w: 11.0, h: 1.05, fontSize: 13, color: C.text1, valign: "middle", objectName: "screen-note" });
    s.addNotes("画面はSplunk公式のUIツールキットで組んだイメージで、ESやSOARの実画面ではありません。画面名や項目名は、ESの版によって異なる場合があります。本番のデモでは、御社の版の実画面で確かめます。");
  }

  /* ===== 10. 封じ込めの承認段階 ===== */
  {
    const s = content("見せ場：封じ込めを、社内の承認段階どおりに動かす", "SOARがあっても「誰の承認で何を止めるか」が決まっていなければ動きません", "デモ");
    const lv = [
      ["①", "セッションの失効（Entra ID）", "SOC担当者の判断で即時", C.accent3],
      ["②", "転送ルールの無効化・パスワードリセット・MFA再登録", "SOC担当者の判断で即時", C.accent3],
      ["③", "アカウントの一時停止（Entra ID）", "SOC責任者の承認", C.accent1],
      ["④", "テナント全体の外部自動転送の禁止", "CSIRT責任者の判断（デモでは判断材料を渡すまで）", C.accent4]
    ];
    for (let i = 0; i < lv.length; i++) {
      const y = 1.65 + i * 1.05, ind = i * 0.35;
      card(s, M + ind, y, 7.2 - ind, 0.9, lv[i][3], 88, "level-" + i);
      numBadge(s, lv[i][0], M + ind + 0.18, y + 0.17, 0.56, lv[i][3], "level-badge-" + i);
      text(s, lv[i][1], { x: M + ind + 0.95, y: y + 0.08, w: 6.1 - ind, h: 0.42, fontSize: 15, bold: true, color: C.text2, objectName: "level-name-" + i });
      text(s, lv[i][2], { x: M + ind + 0.95, y: y + 0.48, w: 6.1 - ind, h: 0.36, fontSize: 13, color: C.text1, objectName: "level-who-" + i });
    }
    text(s, "承認段階はデモ用の架空の例です。御社の対応権限表に合わせて作ります。", { x: M, y: 5.95, w: 7.2, h: 0.5, fontSize: 11, color: C.accent5, objectName: "level-note" });
    card(s, 8.1, 1.65, 4.63, 4.8, C.background2, 0, "check-bg");
    await badge(s, fa.FaClipboardCheck, 8.4, 1.92, 0.62, C.accent1, "check-badge");
    text(s, "テックタッチの入力チェック（案）", { x: 9.15, y: 1.92, w: 3.45, h: 0.62, fontSize: 15, bold: true, color: C.text2, valign: "middle", objectName: "check-head" });
    text(s, [
      { text: "実行範囲で「①〜②」「①〜④」を選ぶと、承認段階に合わせて案内する", options: { bullet: true, breakLine: true } },
      { text: "③の承認チケット番号が空のままでは、実行できない", options: { bullet: true, breakLine: true } },
      { text: "AI Hubが対応権限表（KB06）と照合し、例外アカウントかを示す", options: { bullet: true } }
    ], { x: 8.4, y: 2.75, w: 4.1, h: 3.5, fontSize: 14, color: C.text1, paraSpaceAfter: 10, objectName: "check-list" });
    s.addNotes("SOARのプレイブックは、承認の段階が社内で決まっていてこそ動きます。デモでは、①②は即時に成功し、③はSOC責任者の承認待ちで止まり、承認後に実行されます。④はテナント全体の業務に影響するため、CSIRT責任者に判断材料を渡す段階で止めます。");
  }

  /* ===== 11. 5つの成果物 ===== */
  {
    const s = content("デモの終わりに、画面に残す5つの成果物", "「ツールが動いた」ではなく、社内に残るものでデモの成否を判断します", "デモ");
    const g = [
      [fa.FaSearch, "社内基準D-02の\n相関検索", "ノータブルとリスクスコア。テストログで、ケースAだけが残ることを確かめる"],
      [fa.FaUserCheck, "一次対応の\nチェックリスト", "本人・上長への確認を含む7項目。埋まるまで封じ込めに進めない"],
      [fa.FaLock, "封じ込めの\n承認段階", "SOARプレイブックの入力に、実行範囲と承認番号を残す"],
      [fa.FaFileSignature, "範囲の確定と\n記録", "転送ルール・ダウンロード・社内送信・他アカウントを確定し、4項目で記録"],
      [fa.FaSyncAlt, "ナレッジと\n役割分担", "検知条件・承認段階・記録をナレッジにし、委託先との役割分担を書き換える"]
    ];
    const cw = 2.27, gap = 0.19;
    for (let i = 0; i < g.length; i++) {
      const x = M + i * (cw + gap);
      card(s, x, 1.7, cw, 4.5, C.background2, 0, "goal-" + i);
      await badge(s, g[i][0], x + (cw - 0.85) / 2, 2.0, 0.85, C.accent1, "goal-badge-" + i);
      text(s, "成果物 " + (i + 1), { x: x + 0.15, y: 3.0, w: cw - 0.3, h: 0.3, fontSize: 12, bold: true, color: C.accent1, align: "center", objectName: "goal-num-" + i });
      text(s, g[i][1], { x: x + 0.15, y: 3.32, w: cw - 0.3, h: 0.8, fontSize: 15, bold: true, color: C.text2, align: "center", objectName: "goal-name-" + i });
      text(s, g[i][2], { x: x + 0.18, y: 4.2, w: cw - 0.36, h: 1.85, fontSize: 13, color: C.text1, objectName: "goal-desc-" + i });
    }
    s.addNotes("デモの成否は、この5つが画面に残るかどうかで判断します。ケースAは、普段と違う場所からのサインインの後に外部転送ルールと大量ダウンロードがあった架空のアカウントです。");
  }

  /* ===== 12. AI機能 ===== */
  {
    const s = content("AI機能は、機能ごとに分けて評価します", "Assistant・UEBA・AI Hubは別のものです。まとめて「AIで速くなる」とは言いません", "デモ");
    const cols = [
      ["Splunk AI Assistant", "Splunkの機能", C.text2, fa.FaRobot, "自然言語からSPL案を作り、既存SPLを説明・修正する", "参考画面（準備した例）。実機ではそのままの出力を使う", "出力はAI Hubで社内基準D-02と照合し、テストログで確かめる"],
      ["UEBA", "ESの機能", C.text2, fa.FaUserSecret, "行動の異常（普段と違う場所・時間・量、初めての操作）を出す", "「普段と違う」を出す機能として扱う", "「本人の利用か」は、社内の人が本人と上長に確かめる"],
      ["AI Hub", "テックタッチ・構想", C.accent2, fa.FaBook, "社内のナレッジ（ログ辞書・検知基準・調査手順・対応権限表）と照合し、整理する", "本番前に確かめた例文", "検索結果の真偽は断定しない。\n判断は人が行う"]
    ];
    const cw = 3.95, gap = 0.12;
    for (let i = 0; i < cols.length; i++) {
      const x = M + i * (cw + gap), c = cols[i];
      card(s, x, 1.62, cw, 4.25, c[2], 92, "ai-" + i);
      await badge(s, c[3], x + 0.25, 1.82, 0.62, c[2], "ai-badge-" + i);
      text(s, c[0], { x: x + 1.0, y: 1.8, w: cw - 1.15, h: 0.38, fontSize: 16, bold: true, color: c[2], objectName: "ai-name-" + i });
      text(s, c[1], { x: x + 1.0, y: 2.18, w: cw - 1.15, h: 0.3, fontSize: 12, color: C.accent5, objectName: "ai-kind-" + i });
      const lab = ["すること", "デモでの扱い", "判断の置き方"];
      for (let k = 0; k < 3; k++) {
        const y = 2.65 + k * 1.05;
        text(s, lab[k], { x: x + 0.25, y, w: cw - 0.5, h: 0.28, fontSize: 12, bold: true, color: C.accent5, objectName: "ai-lab-" + i + "-" + k });
        text(s, c[4 + k], { x: x + 0.25, y: y + 0.28, w: cw - 0.5, h: 0.72, fontSize: 13, color: C.text1, objectName: "ai-val-" + i + "-" + k });
      }
    }
    card(s, M, 6.05, W - 2 * M, 0.6, C.accent4, 90, "ai-note-bg");
    text(s, "精度や削減率の数値は、お約束しません。効果は次のページの4つの指標で確かめます。Splunk AI Assistantは有償のSplunk Cloudの機能で、トライアル環境では使えません。", { x: M + 0.2, y: 6.05, w: W - 2 * M - 0.4, h: 0.6, fontSize: 13, color: C.text1, valign: "middle", objectName: "ai-note" });
    s.addNotes("AIの機能は、Assistant（SPLの生成・説明）、UEBA（異常検知）、AI Hub（社内ナレッジとの照合）に分けて扱います。Assistantの精度が上がったことを示す公開の根拠は見当たらないため、毎回、社内基準との照合とテストログでの検証を通します。");
  }

  /* ===== 13. 効果の確かめ方 ===== */
  pres.addSection({ title: "進め方" });
  {
    const s = content("効果の確かめ方", "一つの作業で測ります。現状を伺ってから、目標を決めます", "進め方");
    const m = [
      [fa.FaStopwatch, "把握から封じ込めまでの時間", "ノータブルの発生 → ③アカウント停止の実行"],
      [fa.FaSearchLocation, "範囲の確定までの時間", "ノータブルの発生 → 操作の範囲と他アカウントの確認が記録に書かれる"],
      [fa.FaTicketAlt, "委託先への依頼件数", "一次対応・ルール変更・範囲の確定で、委託先にチケットを出した件数"],
      [fa.FaTools, "社内で完結した検知ルールの変更件数", "相関検索の作成・変更のうち、社内で完結した件数"]
    ];
    for (let i = 0; i < m.length; i++) {
      const x = M + (i % 2) * 6.17, y = 1.7 + Math.floor(i / 2) * 2.15;
      card(s, x, y, 5.95, 1.95, C.background2, 0, "metric-" + i);
      await badge(s, m[i][0], x + 0.3, y + 0.35, 0.85, C.accent1, "metric-badge-" + i);
      text(s, m[i][1], { x: x + 1.45, y: y + 0.32, w: 4.3, h: 0.5, fontSize: 17, bold: true, color: C.text2, objectName: "metric-name-" + i });
      text(s, m[i][2], { x: x + 1.45, y: y + 0.88, w: 4.3, h: 0.9, fontSize: 14, color: C.text1, objectName: "metric-how-" + i });
    }
    text(s, "削減率や検知精度の数値は、事前にはお示ししません。", { x: M, y: 6.15, w: 10, h: 0.4, fontSize: 13, color: C.accent5, objectName: "metric-note" });
    s.addNotes("削減率の数字はお約束しません。一つの作業を選び、いまの時間と件数を伺ってから、目標を一緒に決めます。");
  }

  /* ===== 14. 事前に伺いたいこと ===== */
  {
    const s = content("事前に伺いたいこと", "デモの前提を御社の環境に合わせるために、先に確かめたい6項目です", "進め方");
    const head = (t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.text2 }, fontSize: 14, valign: "middle" } });
    const cell = (t, o = {}) => ({ text: t, options: Object.assign({ fontSize: 14, color: C.text1, valign: "middle" }, o) });
    const rows = [
      [head("#"), head("確かめたいこと"), head("理由"), head("主な伺い先（想定）")],
      [cell("1", { bold: true, align: "center" }), cell("Splunkの構成（ESの版、UEBAがES統合か旧UBAか、SOARの利用範囲）と、M365の監査ログの取り込み"), cell("画面と検知の前提。画面名はESの版で異なる場合がある"), cell("SOC、委託先")],
      [cell("2", { bold: true, align: "center" }), cell("SOCの体制（委託先と社内の役割分担、契約範囲）"), cell("社内で判断・修正してよい範囲が決まる"), cell("SOC責任者")],
      [cell("3", { bold: true, align: "center" }), cell("M365側の設定（外部自動転送の既定、条件付きアクセス、MFAの方式）"), cell("封じ込め④と改善の前提"), cell("情報システム部門")],
      [cell("4", { bold: true, align: "center" }), cell("SOC・CSIRT端末の条件（閉域、VDI、拡張機能の配布）"), cell("テックタッチを入れられるかの前提"), cell("情報システム部門")],
      [cell("5", { bold: true, align: "center" }), cell("相関検索の作成権限と、スケジュールの時刻（Splunk CloudはUTC）"), cell("相関検索を社内で作れるかの前提"), cell("ESの管理者")],
      [cell("6", { bold: true, align: "center" }), cell("AI Hubに渡す情報の範囲"), cell("調査記録には個人情報が含まれうる"), cell("情報セキュリティの責任者")]
    ];
    s.addTable(rows, { x: M, y: 1.6, w: W - 2 * M, colW: [0.55, 5.35, 3.6, 2.63], border: { type: "solid", pt: 0.75, color: "D5DCE4" }, fill: { color: C.background1 }, margin: [0.08, 0.12, 0.08, 0.12], rowH: [0.5, 0.95, 0.7, 0.7, 0.7, 0.85, 0.7], objectName: "ask-table" });
    s.addNotes("この6項目は、デモを御社の環境に合わせるための前提です。ESの版によって画面名や用語が異なる場合があるため、1番を最初に伺います。");
  }

  /* ===== 15. ご覧いただく前に ===== */
  {
    const s = content("デモをご覧いただく前に", "イメージデモの前提を、先にお伝えします", "進め方");
    const n = [
      [fa.FaTheaterMasks, "架空のシナリオです", "特定の企業や事案を題材にしたものではありません。人物・企業名・件数は架空で、接続元のIPなどは文書用の予約値です。"],
      [fa.FaDesktop, "画面はイメージです", "Splunk公式のUI部品で組んだ画面イメージで、ES・UEBA・SOARの実画面ではありません。画面名や項目名はESの版で異なる場合があり、御社の版で確かめます。"],
      [fa.FaRobot, "AIの回答は準備した例です", "Splunk AI Assistantは参考画面、AI Hubは構想と、本番前に確かめた例文です。"],
      [fa.FaRoute, "テックタッチのガイドは案です", "ガイド・ツールチップ・入力チェックは、御社の手順に合わせて作る前の案です。"],
      [fa.FaShieldAlt, "入口の防止は扱いません", "フィッシングを防ぐ話ではなく、速く気づき、社内で止め、範囲を確定し、記録する話です。"]
    ];
    for (let i = 0; i < n.length; i++) {
      const y = 1.6 + i * 1.0;
      await badge(s, n[i][0], M, y + 0.1, 0.62, i === 2 ? C.accent2 : C.accent1, "pre-badge-" + i);
      text(s, n[i][1], { x: M + 0.85, y: y + 0.02, w: 3.4, h: 0.8, fontSize: 16, bold: true, color: C.text2, valign: "middle", objectName: "pre-head-" + i });
      text(s, n[i][2], { x: 4.9, y: y + 0.02, w: 7.83, h: 0.8, fontSize: 13, color: C.text1, valign: "middle", objectName: "pre-body-" + i });
    }
    s.addNotes("デモの前提です。画面はイメージで、実画面ではありません。数字や人物はすべて架空です。");
  }

  /* ===== 16. 次の一歩 ===== */
  {
    const s = pres.addSlide({ masterName: "CLOSING_DARK", sectionTitle: "進め方" });
    s.addText("次の一歩", { placeholder: "title" });
    const st = [
      ["1", "事前に伺いたい6項目", "Splunkの構成、SOCの体制、M365の設定、端末の条件、権限、AI Hubに渡す範囲を伺います"],
      ["2", "デモ（9場面・36分）", "場面の終わりごとに、5つの問いに沿って伺います"],
      ["3", "最初に確かめる作業を決める", "近い問いを一つ選び、その作業で現状の時間と件数を測ります"]
    ];
    for (let i = 0; i < st.length; i++) {
      const x = M + i * 4.1;
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.9, w: 3.9, h: 3.6, rectRadius: 0.08, fill: { color: C.background1, transparency: 90 }, line: { color: C.background2, width: 1, transparency: 60 }, objectName: "next-" + i });
      numBadge(s, st[i][0], x + 0.3, 2.2, 0.75, C.accent1, "next-badge-" + i);
      text(s, st[i][1], { x: x + 0.3, y: 3.15, w: 3.3, h: 0.8, fontSize: 18, bold: true, color: C.background1, objectName: "next-head-" + i });
      text(s, st[i][2], { x: x + 0.3, y: 4.0, w: 3.3, h: 1.3, fontSize: 14, color: C.background2, objectName: "next-body-" + i });
    }
    text(s, "入っているES・UEBA・SOARを、社内の人が判断・承認・記録まで使い切る。その最初の一歩を、一緒に決めさせてください。", { x: M, y: 5.9, w: W - 2 * M, h: 0.7, fontSize: 16, bold: true, color: C.background1, valign: "middle", objectName: "closing-message" });
    s.addNotes("最後に、次の一歩です。事前の6項目を伺い、デモで5つの問いを一緒に確かめ、最初に測る作業を一つ決めます。");
  }

  await pres.writeFile({ fileName: OUT });
  if (APPLY_THEME) {
    const { applyTheme } = require(APPLY_THEME);
    await applyTheme(OUT, THEME);
  }
  await setJapaneseFont(OUT, THEME.bodyFontFace);
  console.log("ok", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
