// 事前説明資料（PowerPoint）を作る。架空のシナリオ・イメージデモの説明で、お客様固有の内容は入れない。
// 使い方（このフォルダで）:
//   npm install pptxgenjs@3.12.0
//   node build_deck.js            → M365乗っ取り対応デモ_事前説明.pptx（16枚）
//   node build_deck.js --short    → M365乗っ取り対応デモ_事前説明_短縮版.pptx（4枚。デモの直前に使う）
// 体裁はテックタッチの資料に合わせる：青 055BB8／0876E8、淡い青の要点帯 EEF7FD、文字 1F2A37、枠線 D6DDE5、
// 強調の橙 C86A00、書体 Yu Gothic、角の無い四角、左上の小見出し・題名・要点帯・青い見出し帯の付いた枠。
const path = require("path");
const pptxgen = require("pptxgenjs");

const SHORT = process.argv.includes("--short");
const OUT = process.env.OUT || path.join(__dirname, SHORT ? "M365乗っ取り対応デモ_事前説明_短縮版.pptx" : "M365乗っ取り対応デモ_事前説明.pptx");
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
const HUB = "4A90E2";     // AI Hub が中心の場面の見出し（淡い青）
const WARM = "FFF3E3";    // 仮説・注意の地
const GRAYHEAD = "8A96A6"; // 範囲外の見出し

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = "M365アカウント乗っ取り対応デモ 事前説明" + (SHORT ? "（短縮版）" : "");
pres.subject = "Splunk ES＋UEBA＋SOAR × テックタッチ（DAP＋AI Hub）イメージデモの事前説明";
pres.author = "テックタッチ";
pres.company = "テックタッチ株式会社";
const C = pres.SchemeColor;
const W = 13.333, M = 0.5, CW = W - 2 * M;
const TAG = "架空のシナリオ・イメージデモ";

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
function foot(s, t) { text(s, t, { x: M, y: 6.92, w: CW - 0.8, h: 0.42, fontSize: 11, color: C.accent5, valign: "middle", objectName: "footnote" }); }
function tableStyle(colW, rowH) {
  return { x: M, w: CW, colW, rowH, border: { type: "solid", pt: 0.75, color: THEME.colors.accent6 }, margin: [0.07, 0.1, 0.07, 0.1], fontFace: THEME.bodyFontFace };
}
const th = (t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.accent1 }, fontSize: 12, valign: "middle" } });
const td = (t, o = {}) => ({ text: t, options: Object.assign({ fontSize: 12, color: C.text1, valign: "middle" }, o) });

// 書き出した後の仕上げ。
// ・日本語の文字に使う書体（テーマの ea と Jpan）を、見出し・本文とも同じ書体にそろえる
// ・図形の番号（p:cNvPr の id）をスライドごとに振り直す。pptxgenjs はページ番号の欄に固定で 25 を振るため、
//   図形の多いスライドで番号が重なり、PowerPoint が修復を求める
// ・フォルダの項目を書き込まない
async function finalizePptx(file, face) {
  const fs = require("fs");
  const JSZip = require(require.resolve("jszip", { paths: [require.resolve("pptxgenjs")] }));
  const zip = await JSZip.loadAsync(fs.readFileSync(file), { createFolders: false });
  for (const name of Object.keys(zip.files)) {
    if (zip.files[name].dir) continue;
    if (/^ppt\/theme\/theme\d+\.xml$/.test(name)) {
      let xml = await zip.file(name).async("string");
      xml = xml.replace(/<a:ea typeface="[^"]*"\/>/g, '<a:ea typeface="' + face + '"/>')
        .replace(/<a:font script="Jpan" typeface="[^"]*"\/>/g, '<a:font script="Jpan" typeface="' + face + '"/>');
      zip.file(name, xml, { createFolders: false });
    } else if (/^ppt\/(slides|slideLayouts|slideMasters)\/[^/]+\.xml$/.test(name)) {
      let n = 0;
      const xml = (await zip.file(name).async("string")).replace(/<p:cNvPr id="\d+"/g, () => '<p:cNvPr id="' + (++n) + '"');
      zip.file(name, xml, { createFolders: false });
    }
  }
  for (const name of Object.keys(zip.files)) if (zip.files[name].dir) delete zip.files[name];
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

async function buildFull() {
  /* ===== 1. 表紙 ===== */
  pres.addSection({ title: "はじめに" });
  {
    const s = pres.addSlide({ masterName: "TITLE", sectionTitle: "はじめに" });
    s.addText("M365アカウント\n乗っ取り対応デモ\n事前説明", { placeholder: "title" });
    s.addText("Splunk ES＋UEBA＋SOAR ×\nテックタッチ（DAP＋AI Hub）", { placeholder: "body" });
    text(s, "入っているSplunkを、社内の人が\n判断・承認・記録まで使い切る", { x: 5.75, y: 2.45, w: 7.1, h: 1.05, fontSize: 22, bold: true, color: C.accent1, objectName: "headline" });
    text(s, bullets(["架空のA社を舞台にした、一般的なSOC事案の型（M365アカウントの乗っ取り）", "デモは9場面（36分）＋振り返り（1分）。画面はイメージです"]), { x: 5.75, y: 3.75, w: 7.1, h: 0.9, fontSize: 15, objectName: "headline-points" });
    text(s, "テックタッチ株式会社\n2026年10月\n架空のシナリオ・イメージデモです。特定の企業や事案を題材にしたものではありません。", { x: 5.75, y: 5.5, w: 7.1, h: 0.9, fontSize: 12, color: C.accent5, objectName: "meta" });
    s.addNotes("本日は、デモの前に、シナリオの前提と見どころをご説明します。架空のA社を舞台にした、一般的なSOC事案の型のシナリオです。特定の企業や事案を題材にしたものではありません。");
  }

  /* ===== 2. サマリ ===== */
  {
    const s = content("サマリ", "製品を足すのではなく、入っているSplunkを社内で使い切る", "ES・UEBA・SOARは入っている。止まっているのは「ノータブルの後の判断・承認・記録」。そこを社内の手順にし、検知から記録・改善まで社内で回す", "はじめに");
    const cards = [
      ["①　ノータブルの後を、社内で進める", ["「本人の利用か」を、本人と上長に確かめる手順を社内に置く", "チェックリストが埋まるまで、封じ込めに進まない"]],
      ["②　承認段階を決めて、SOARを動かす", ["①②は担当者が即時、③はSOC責任者、④はCSIRT責任者", "承認番号を、プレイブックの入力に残す"]],
      ["③　範囲・記録・改善を、社内に残す", ["乗っ取られた間の操作と、他アカウントへの広がりを確定する", "検知条件・承認段階・記録をナレッジにする"]]
    ];
    const cw = (CW - 2 * 0.2) / 3;
    cards.forEach((c, i) => {
      const x = M + i * (cw + 0.2);
      card(s, x, 2.25, cw, 2.05, c[0], "point-" + i);
      text(s, bullets(c[1]), { x: x + 0.12, y: 2.75, w: cw - 0.24, h: 1.45, fontSize: 13, objectName: "point-body-" + i });
    });
    const tiles = [["デモ", "9場面", "36分＋振り返り1分"], ["画面に残す成果物", "5つ", "相関検索から役割分担まで"], ["事前の問い", "5つ", "場面の終わりに伺う"], ["事前に伺いたいこと", "6項目", "御社の環境に合わせる"], ["効果の数値", "約束しない", "4つの指標で測る"]];
    const tw = (CW - 4 * 0.2) / 5;
    tiles.forEach((t, i) => {
      const x = M + i * (tw + 0.2), hi = i === 1;
      sq(s, x, 4.6, tw, 1.3, hi ? C.accent1 : C.background2, hi ? null : C.accent6, "tile-" + i);
      text(s, t[0], { x: x + 0.12, y: 4.7, w: tw - 0.24, h: 0.3, fontSize: 12, color: hi ? C.background1 : C.accent5, objectName: "tile-cap-" + i });
      text(s, t[1], { x: x + 0.12, y: 5.0, w: tw - 0.24, h: 0.5, fontSize: 24, bold: true, color: hi ? C.background1 : C.text1, objectName: "tile-big-" + i });
      text(s, t[2], { x: x + 0.12, y: 5.53, w: tw - 0.24, h: 0.3, fontSize: 11, color: hi ? C.background1 : C.accent5, objectName: "tile-sub-" + i });
    });
    text(s, "委託先の夜間監視・高度な分析・フォレンジックは、これまでどおりです。社内が判断し、動き、記録できる範囲を広げる話です。", { x: M, y: 6.15, w: CW, h: 0.4, fontSize: 13, bold: true, color: C.accent4, valign: "middle", objectName: "partner" });
    foot(s, "画面・人物・企業名・手順・数値はすべて架空です。");
    s.addNotes("製品を足す提案ではありません。入っているES・UEBA・SOARを、社内の人が判断・承認・記録まで使い切る提案です。委託先の仕事を取り上げる話でもありません。夜間監視や高度な分析は委託先に続けていただき、一次対応の判断、封じ込めの承認、範囲の確定、記録、ルール変更を社内で持てるようにする話です。");
  }

  /* ===== 3. 題材 ===== */
  pres.addSection({ title: "シナリオ" });
  {
    const s = content("シナリオ｜題材", "題材：M365アカウントの乗っ取り（一般的な事案の型）", "入口のフィッシングを防ぐ話ではない。速く気づき、社内で止め、範囲を確定し、記録する、までがデモの範囲", "シナリオ");
    const steps = [
      ["① フィッシング", "取引先を装ったメールのリンク"],
      ["② セッション奪取", "AiTM型の想定。MFA済みのセッションを盗まれる"],
      ["③ 不審なサインイン", "深夜、普段と違う国・ASNから"],
      ["④ 外部転送ルール", "受信トレイのルールで、外部へ転送"],
      ["⑤ 大量ダウンロード", "SharePointから1,200件"],
      ["⑥ 社内へ拡散", "社内380名へ、リンク付きのメール"]
    ];
    const gap = 0.26, sw = (CW - 5 * gap) / 6;
    steps.forEach((st, i) => {
      const x = M + i * (sw + gap), out = i < 2;
      card(s, x, 2.25, sw, 1.4, st[0], "step-" + i, out ? GRAYHEAD : C.accent2);
      text(s, st[1], { x: x + 0.1, y: 2.73, w: sw - 0.2, h: 0.85, fontSize: 12, objectName: "step-body-" + i });
      if (i < steps.length - 1) s.addShape(pres.shapes.CHEVRON, { x: x + sw + 0.07, y: 2.8, w: 0.12, h: 0.3, fill: { color: C.accent6 }, line: { type: "none" }, objectName: "step-arrow-" + i });
    });
    sq(s, M, 3.8, 2 * sw + gap, 0.45, C.background2, null, "scope-out");
    text(s, "範囲外（入口の防止はSIEM・DAPの外）", { x: M, y: 3.8, w: 2 * sw + gap, h: 0.45, fontSize: 12, color: C.accent5, align: "center", valign: "middle", objectName: "scope-out-text" });
    sq(s, M + 2 * (sw + gap), 3.8, 4 * sw + 3 * gap, 0.45, C.accent1, null, "scope-in");
    text(s, "デモの範囲：速く気づき、社内で止め、範囲を確定し、記録する", { x: M + 2 * (sw + gap), y: 3.8, w: 4 * sw + 3 * gap, h: 0.45, fontSize: 13, bold: true, color: C.background1, align: "center", valign: "middle", objectName: "scope-in-text" });
    sq(s, M, 4.55, CW, 1.45, WARM, null, "hypo");
    text(s, "デモが置く仮説（確認必要）", { x: M + 0.2, y: 4.68, w: 5, h: 0.32, fontSize: 13, bold: true, color: C.accent4, objectName: "hypo-head" });
    text(s, bullets(["UEBAのノータブルは出たが、「本人の利用か」を確かめる手順と担当が社内に無く、委託先の問い合わせ待ちで一次対応が4時間止まる", "誰の承認でアカウントを止めるか、テナント全体の設定を変えるかが決まっておらず、乗っ取りが続く"]), { x: M + 0.2, y: 5.05, w: CW - 0.4, h: 0.9, fontSize: 13, objectName: "hypo-body" });
    foot(s, "件数・時刻はデモ用の架空の値です。");
    s.addNotes("Microsoft 365のアカウントの乗っ取りは、多くの組織で起きる一般的な事案の型です。入口のフィッシングを防ぐ話はしません。速く気づき、社内で止め、範囲を確定し、記録する、までがこのシナリオの範囲です。仮説は確かめるべき前提として置いています。");
  }

  /* ===== 4. 構造 ===== */
  {
    const s = content("シナリオ｜構造", "ツールはそろっているのに、守り切れない構造", "監視を委託先に任せるほど、自社に固有の判断（その人は出張中か、誰が止めてよいか）は、社内が持っていないと回らない", "シナリオ");
    const z = { fill: { color: THEME.colors.lt2 } };
    const rows = [
      [th("製品"), th("製品がすること"), th("社内が決め続けること"), th("社内に決める人がいないと起きること")],
      [td("ES（SIEM）", { bold: true }), td("ログの相関、ノータブル、調査画面"), td("M365の監査ログを入れるか、閾値と例外（移行作業・出張）、誰がノータブルを見るか"), td("ルールの変更が数週間待ち。ノータブルの後の判断が社内に残らない")],
      [td("UEBA", Object.assign({ bold: true }, z)), td("利用者・端末の行動の異常", z), td("「異常」と「本人の利用」の境目（出張・在宅・新しい端末）、本人確認の手順", z), td("異常のスコアが出ても、誰が本人に確かめるかが決まらず、放置される", z)],
      [td("SOAR", { bold: true }), td("プレイブックによる自動対応"), td("どこまで自動で動かすか、誰の承認で止めるか、例外（役員・管理者）"), td("承認待ちでプレイブックが止まる。または止めてはいけないものを止める")]
    ];
    s.addTable(rows, Object.assign({ y: 2.25, objectName: "structure-table" }, tableStyle([1.6, 2.75, 4.15, 3.83], [0.45, 1.0, 1.0, 1.0])));
    text(s, "ES・UEBA・SOARは「入れれば守れる」製品ではなく、それぞれに、社内の人が継続して決め・直し・動かす仕事が付いています。", { x: M, y: 5.85, w: CW, h: 0.6, fontSize: 13, bold: true, color: C.accent4, valign: "middle", objectName: "structure-note" });
    s.addNotes("委託先が悪いという話ではありません。自社に固有の判断を、社内に置くという話です。");
  }

  /* ===== 5. 5つの問い ===== */
  {
    const s = content("シナリオ｜問い", "事前に考えていただきたい5つの問い", "すぐに答えにくい問いが、デモで一緒に確かめたいところ。場面の終わりごとに、この問いに沿って伺います", "シナリオ");
    const qs = [
      "ノータブルやアラートの後の一次対応は、委託先のチケットを待つ形になっていますか",
      "M365など自社のクラウドサービスの検知ルールや閾値を変えるとき、社内で完結せず、見積もりと改修を待ちますか",
      "SOARのプレイブックが「いつ・何を・誰の承認で」動くかを、社内の担当者が説明できますか",
      "過去の事案の調査記録と判断理由は、社内が読める場所にありますか。委託先のチケットにしかありませんか",
      "直近の事案の発見は、自社の検知でしたか。外部（クラウド事業者・委託先・通報）でしたか"
    ];
    qs.forEach((q, i) => {
      const y = 2.25 + i * 0.84;
      sq(s, M, y, 0.72, 0.72, C.accent1, null, "q-num-bg-" + i);
      text(s, "Q" + (i + 1), { x: M, y, w: 0.72, h: 0.72, fontSize: 15, bold: true, color: C.background1, align: "center", valign: "middle", objectName: "q-num-" + i });
      sq(s, M + 0.72, y, CW - 0.72, 0.72, C.background1, C.accent6, "q-row-" + i);
      text(s, q, { x: M + 0.92, y, w: CW - 1.1, h: 0.72, fontSize: 14, valign: "middle", objectName: "q-text-" + i });
    });
    foot(s, "答えが委託先寄りになるほど、論点は「ツールの機能」ではなく「運用の実行力」になります。");
    s.addNotes("当日は、場面の終わりごとに「伺いたいこと」を一つずつお出しします。事前にこの5つを見ていただくと、どの場面を厚く見るかを決めやすくなります。");
  }

  /* ===== 6. 役割 ===== */
  {
    const s = content("シナリオ｜役割", "誰が何を担うか", "製品・テックタッチ・人の役割を固定してから、デモを組んでいます", "シナリオ");
    const cols = [
      ["Splunk（入っている製品）", C.text1, [
        ["Splunk ES", "ログの相関、ノータブル、Incident Review、相関検索、リスクベースアラート"],
        ["UEBA（ESの機能）", "行動の異常（普段と違う場所・時間・量、初めての操作）"],
        ["Splunk SOAR", "プレイブックによる自動対応（セッション失効、ルール無効化、アカウント停止）"],
        ["Splunk AI Assistant", "自然言語からSPL案を作り、既存のSPLを説明・修正する"]]],
      ["テックタッチ", C.accent1, [
        ["AI Hub（構想）", "社内の基準・手順・権限と照合し、確認事項・確認文・記録の形・次の行動を整理する"],
        ["DAP（ガイド・入力チェック）", "ES・SOARの画面の上で、操作の順番・必須の確認・入力のルール・承認段階を示す"]]],
      ["人", C.accent5, [
        ["委託先（MSSP）", "夜間監視・高度な分析・フォレンジック（これまでどおり）"],
        ["社内（SOC・CSIRT）", "判断・承認・記録・ルール変更を持つ"]]]
    ];
    const cw = [4.45, 3.9, 3.58];
    let x = M;
    cols.forEach((col, c) => {
      card(s, x, 2.25, cw[c], 4.45, col[0], "role-" + c, col[1]);
      const ih = (4.45 - 0.38) / col[2].length;
      col[2].forEach((it, i) => {
        const y = 2.63 + i * ih;
        if (i > 0) s.addShape(pres.shapes.LINE, { x: x + 0.12, y, w: cw[c] - 0.24, h: 0, line: { color: C.accent6, width: 0.75 }, objectName: "role-sep-" + c + "-" + i });
        text(s, it[0], { x: x + 0.15, y: y + 0.12, w: cw[c] - 0.3, h: 0.3, fontSize: 13, bold: true, color: it[0].startsWith("AI Hub") || it[0].startsWith("DAP") ? C.accent1 : C.text1, objectName: "role-name-" + c + "-" + i });
        text(s, it[1], { x: x + 0.15, y: y + 0.45, w: cw[c] - 0.3, h: ih - 0.55, fontSize: 12, objectName: "role-desc-" + c + "-" + i });
      });
      x += cw[c] + 0.2;
    });
    s.addNotes("ログの相関と調査画面はES、行動の異常はUEBA、自動対応はSOAR、検索案はSplunk AI Assistant。社内の基準・手順・権限との照合はAI Hub、手順の抜け漏れ防止と入力チェックはテックタッチのガイドです。委託先は夜間の監視と高度な分析を続け、社内は判断・承認・記録・改善を持ちます。");
  }

  /* ===== 7. Before / After ===== */
  {
    const s = content("シナリオ｜Before → After", "工程ごとの Before → After", "委託先任せで止まっていたところを、社内の基準と承認で進める", "シナリオ");
    const before = { fill: { color: THEME.colors.lt2 } }, after = { fill: { color: THEME.colors.accent3 } };
    const r = (a, b, c) => [td(a, { bold: true }), td(b, before), td(c, after)];
    const rows = [
      [th("工程"), th("Before（委託先任せ）"), th("After（社内が回す）")],
      r("検知", "閾値が業務に合わず、ルールの変更は委託先の改修待ち", "社内基準D-02（普段と違う接続元の後の、外部転送ルールと大量ダウンロード）で、相関検索を社内で作る"),
      r("一次対応", "委託先に連絡し、回答を待つ", "チェックリストを埋めてから封じ込めへ。本人と上長に確かめる"),
      r("封じ込め", "停止の承認が取れず、乗っ取りが続く", "①②は担当者が即時、③はSOC責任者、④はCSIRT責任者の判断"),
      r("範囲の確定・記録", "「いつ・何が・どこまで」が委託先の分析待ち", "操作を種類別に確定し、他アカウントも確かめて、4項目で記録する"),
      r("改善", "一件ごとに終わり、次も同じ時間がかかる", "検知条件・承認段階・記録をナレッジにし、委託先との役割分担を書き換える")
    ];
    s.addTable(rows, Object.assign({ y: 2.25, objectName: "ba-table" }, tableStyle([2.0, 4.2, 6.13], [0.45, 0.78, 0.7, 0.7, 0.7, 0.7])));
    foot(s, "①〜④の承認段階は、デモ用の架空の例です。実際の承認者は、御社の対応権限表に合わせます。");
    s.addNotes("工程ごとに、これまで止まっていたところと、デモで見せる姿を並べています。");
  }

  /* ===== 8. デモの流れ ===== */
  pres.addSection({ title: "デモ" });
  {
    const s = content("デモ｜流れ", "デモの流れ：9場面（36分）＋振り返り（1分）", "SOC担当者の山田さん（架空）が、検知の社内化から記録・改善までを一人で進める。各場面の終わりに「伺いたいこと」を出します", "デモ");
    const sc = [
      ["S0　現場の問題", "2分", "依頼カードと、画面に残す5つの成果物"],
      ["S1　Before", "3分", "ノータブルが4時間未割当。件数だけの検索では区別できない"],
      ["S2　要件整理", "4分", "日本語の依頼を、AI Hubが社内基準で依頼文にする"],
      ["S3　相関検索案・照合", "5分", "Assistantの案を、AI Hubが検知基準D-02と照合する"],
      ["S4　検証・保存", "5分", "テストログで検証し、相関検索として保存する"],
      ["S5　一次対応", "5分", "担当者を自分に。本人と上長に確かめ、チェックリストを埋める"],
      ["S6　封じ込め", "4分", "SOARのプレイブックを、承認段階どおりに実行する"],
      ["S7　範囲の確定・記録", "5分", "操作と他アカウントを確定し、4項目で記録する"],
      ["S8　改善", "3分", "ナレッジへの反映と、委託先との役割分担の書き換え"]
    ];
    const cw = (CW - 2 * 0.2) / 3, ch = 1.38;
    sc.forEach((c, i) => {
      const x = M + (i % 3) * (cw + 0.2), y = 2.25 + Math.floor(i / 3) * (ch + 0.14);
      const hub = /^S[238]/.test(c[0]);
      card(s, x, y, cw, ch, c[0], "scene-" + i, hub ? HUB : C.accent2);
      text(s, c[1], { x: x + cw - 0.9, y, w: 0.8, h: 0.38, fontSize: 12, bold: true, color: C.background1, align: "right", valign: "middle", objectName: "scene-time-" + i });
      text(s, c[2], { x: x + 0.12, y: y + 0.5, w: cw - 0.24, h: ch - 0.6, fontSize: 13, objectName: "scene-desc-" + i });
    });
    foot(s, "見出しが淡い青の場面（S2・S3・S8）は、AI Hubが中心の場面です。");
    s.addNotes("場面ごとの見せ場です。時間が限られる場合は、S1・S5・S6を中心に短くできます。");
  }

  /* ===== 9. 画面イメージ ===== */
  {
    const s = content("デモ｜画面", "デモの画面（イメージ）", "Splunk公式のUI部品で組んだ画面イメージです。ES・SOARの実画面ではありません。画面名や項目名はESの版で異なる場合があります", "デモ");
    const shots = [
      ["screen_ir.jpg", "S1　Incident Review", "UEBAのノータブルが、担当者未割当のまま"],
      ["screen_cs.jpg", "S4　相関検索の作成", "命名規則・実行間隔・リスク・緊急度・抑制を入力チェック（案）"],
      ["screen_soar.jpg", "S6　SOARのプレイブック", "承認段階どおりに①〜③を実行。③はSOC責任者の承認待ち"]
    ];
    const iw = (CW - 2 * 0.2) / 3, ih = iw * 9 / 16;
    shots.forEach((sh, i) => {
      const x = M + i * (iw + 0.2), y = 2.25;
      s.addImage({ path: IMG(sh[0]), x, y, w: iw, h: ih, sizing: { type: "cover", w: iw, h: ih }, objectName: "shot-" + i });
      sq(s, x, y, iw, ih, null, C.accent6, "shot-frame-" + i);
      text(s, sh[1], { x, y: y + ih + 0.12, w: iw, h: 0.32, fontSize: 13, bold: true, color: C.accent1, objectName: "shot-title-" + i });
      text(s, sh[2], { x, y: y + ih + 0.46, w: iw, h: 0.6, fontSize: 12, objectName: "shot-desc-" + i });
    });
    sq(s, M, 5.6, CW, 0.95, C.background1, C.accent6, "screen-note");
    text(s, bullets(["社内ポータル（チケット管理・チャット）は、Splunkとは別のシステムとして描いています。チケットの「Splunk ESで開く」から、Splunkに移ります", "画面の上の青い吹き出しがテックタッチのガイド（案）、紫の枠がAI Hub（構想・例文）です"]), { x: M + 0.15, y: 5.66, w: CW - 0.3, h: 0.85, fontSize: 12, valign: "middle", objectName: "screen-note-text" });
    s.addNotes("画面はSplunk公式のUIツールキットで組んだイメージで、ESやSOARの実画面ではありません。本番のデモでは、御社の版の実画面で確かめます。");
  }

  /* ===== 10. 封じ込め ===== */
  {
    const s = content("デモ｜見せ場", "封じ込めを、社内の承認段階どおりに動かす", "SOARがあっても「誰の承認で何を止めるか」が決まっていなければ動かない。承認段階を、プレイブックの入力に組み込む", "デモ");
    const lv = [
      ["①", "セッションの失効（Entra ID）", "SOC担当者の判断で即時", C.accent2],
      ["②", "転送ルールの無効化・パスワードリセット・MFA再登録", "SOC担当者の判断で即時", C.accent2],
      ["③", "アカウントの一時停止（Entra ID）", "SOC責任者の承認（承認番号を入力）", C.accent1],
      ["④", "テナント全体の外部自動転送の禁止", "CSIRT責任者の判断（デモでは判断材料を渡すまで）", C.accent4]
    ];
    lv.forEach((l, i) => {
      const y = 2.25 + i * 1.02, ind = i * 0.3, w = 7.4 - ind;
      sq(s, M + ind, y, 0.8, 0.86, l[3], null, "level-num-bg-" + i);
      text(s, l[0], { x: M + ind, y, w: 0.8, h: 0.86, fontSize: 20, bold: true, color: C.background1, align: "center", valign: "middle", objectName: "level-num-" + i });
      sq(s, M + ind + 0.8, y, w - 0.8, 0.86, C.background1, C.accent6, "level-" + i);
      text(s, l[1], { x: M + ind + 0.98, y: y + 0.1, w: w - 1.1, h: 0.36, fontSize: 13, bold: true, objectName: "level-name-" + i });
      text(s, l[2], { x: M + ind + 0.98, y: y + 0.48, w: w - 1.1, h: 0.3, fontSize: 12, color: C.accent5, objectName: "level-who-" + i });
    });
    card(s, 8.25, 2.25, W - M - 8.25, 3.94, "テックタッチの入力チェック（案）", "check");
    text(s, bullets(["実行範囲で「①〜②」「①〜④」を選ぶと、承認段階に合わせて案内する", "③の承認チケット番号が空のままでは、実行できない", "AI Hubが対応権限表（KB06）と照合し、例外アカウントかを示す"], { paraSpaceAfter: 8 }), { x: 8.4, y: 2.8, w: W - M - 8.55, h: 3.2, fontSize: 13, objectName: "check-list" });
    foot(s, "承認段階はデモ用の架空の例です。御社の対応権限表に合わせて作ります。");
    s.addNotes("デモでは、①②は即時に成功し、③はSOC責任者の承認待ちで止まり、承認後に実行されます。④はテナント全体の業務に影響するため、CSIRT責任者に判断材料を渡す段階で止めます。");
  }

  /* ===== 11. 5つの成果物 ===== */
  {
    const s = content("デモ｜成果物", "デモの終わりに、画面に残す5つの成果物", "「ツールが動いた」ではなく、社内に残るものでデモの成否を判断する", "デモ");
    const g = [
      ["社内基準D-02の\n相関検索", "ノータブルとリスクスコア。テストログで、ケースAだけが残ることを確かめる"],
      ["一次対応の\nチェックリスト", "本人・上長への確認を含む7項目。埋まるまで封じ込めに進めない"],
      ["封じ込めの\n承認段階", "SOARプレイブックの入力に、実行範囲と承認番号を残す"],
      ["範囲の確定と\n記録", "転送ルール・ダウンロード・社内送信・他アカウントを確定し、4項目で記録する"],
      ["ナレッジと\n役割分担", "検知条件・承認段階・記録をナレッジにし、委託先との役割分担を書き換える"]
    ];
    const cw = (CW - 4 * 0.2) / 5;
    g.forEach((it, i) => {
      const x = M + i * (cw + 0.2);
      card(s, x, 2.25, cw, 3.3, "成果物　" + "①②③④⑤"[i], "goal-" + i);
      text(s, it[0], { x: x + 0.12, y: 2.78, w: cw - 0.24, h: 0.75, fontSize: 15, bold: true, color: C.accent1, objectName: "goal-name-" + i });
      text(s, it[1], { x: x + 0.12, y: 3.65, w: cw - 0.24, h: 1.8, fontSize: 13, objectName: "goal-desc-" + i });
    });
    text(s, "デモの成果物は架空の例です。本番では、御社の手順・承認者・記録の形に合わせて作ります。", { x: M, y: 5.8, w: CW, h: 0.45, fontSize: 13, bold: true, color: C.accent4, valign: "middle", objectName: "goal-note" });
    foot(s, "ケースAは、普段と違う場所からのサインインの後に、外部転送ルールと大量ダウンロードがあった架空のアカウントです。");
    s.addNotes("デモの成否は、この5つが画面に残るかどうかで判断します。");
  }

  /* ===== 12. AI機能 ===== */
  {
    const s = content("デモ｜AI機能", "AI機能は、機能ごとに分けて評価する", "Assistant・UEBA・AI Hubは別のもの。まとめて「AIで速くなる」とは言わない", "デモ");
    const z = { fill: { color: THEME.colors.lt2 } };
    const rows = [
      [th("機能"), th("提供"), th("すること"), th("デモでの扱い"), th("判断の置き方")],
      [td("Splunk AI Assistant", { bold: true }), td("Splunkの機能"), td("自然言語からSPL案を作り、既存のSPLを説明・修正する"), td("参考画面（準備した例）。実機ではそのままの出力を使う"), td("出力はAI Hubで社内基準D-02と照合し、テストログで確かめる")],
      [td("UEBA", Object.assign({ bold: true }, z)), td("ESの機能", z), td("行動の異常（普段と違う場所・時間・量、初めての操作）を出す", z), td("「普段と違う」を出す機能として扱う", z), td("「本人の利用か」は、社内の人が本人と上長に確かめる", z)],
      [td("AI Hub", { bold: true, color: C.accent1 }), td("テックタッチ（構想）"), td("社内のナレッジ（ログ辞書・検知基準・調査手順・対応権限表）と照合し、整理する"), td("本番前に確かめた例文"), td("検索結果の真偽は断定しない。判断は人が行う")]
    ];
    s.addTable(rows, Object.assign({ y: 2.25, objectName: "ai-table" }, tableStyle([2.15, 1.7, 3.1, 2.55, 2.83], [0.45, 1.0, 1.0, 1.0])));
    text(s, "精度や削減率の数値は、お約束しません。効果は4つの指標で確かめます（次のページ）。", { x: M, y: 6.0, w: CW, h: 0.45, fontSize: 13, bold: true, color: C.accent4, valign: "middle", objectName: "ai-note" });
    foot(s, "Splunk AI Assistantは有償のSplunk Cloudの機能で、トライアル環境では使えません。");
    s.addNotes("AIの機能は、Assistant（SPLの生成・説明）、UEBA（異常検知）、AI Hub（社内ナレッジとの照合）に分けて扱います。Assistantの精度が上がったことを示す公開の根拠は見当たらないため、毎回、社内基準との照合とテストログでの検証を通します。");
  }

  /* ===== 13. 効果の確かめ方 ===== */
  pres.addSection({ title: "進め方" });
  {
    const s = content("進め方｜効果", "効果の確かめ方", "一つの作業で測る。現状を伺ってから、目標を決める", "進め方");
    const m = [
      ["把握から封じ込めまでの時間", "ノータブルの発生\n→ ③アカウント停止の実行"],
      ["範囲の確定までの時間", "ノータブルの発生\n→ 操作の範囲と他アカウントの確認が記録に書かれる"],
      ["委託先への依頼件数", "一次対応・ルール変更・範囲の確定で、委託先にチケットを出した件数"],
      ["社内で完結した検知ルールの変更件数", "相関検索の作成・変更のうち、社内で完結した件数"]
    ];
    const cw = (CW - 3 * 0.2) / 4;
    m.forEach((it, i) => {
      const x = M + i * (cw + 0.2), hi = i === 0;
      sq(s, x, 2.25, cw, 3.55, hi ? C.accent1 : C.background2, hi ? null : C.accent6, "metric-" + i);
      text(s, "指標 " + (i + 1), { x: x + 0.15, y: 2.4, w: cw - 0.3, h: 0.3, fontSize: 12, color: hi ? C.background1 : C.accent5, objectName: "metric-num-" + i });
      text(s, it[0], { x: x + 0.15, y: 2.75, w: cw - 0.3, h: 0.95, fontSize: 17, bold: true, color: hi ? C.background1 : C.text1, objectName: "metric-name-" + i });
      text(s, "測り方", { x: x + 0.15, y: 3.9, w: cw - 0.3, h: 0.28, fontSize: 11, bold: true, color: hi ? C.background1 : C.accent5, objectName: "metric-howlab-" + i });
      text(s, it[1], { x: x + 0.15, y: 4.2, w: cw - 0.3, h: 1.45, fontSize: 13, color: hi ? C.background1 : C.text1, objectName: "metric-how-" + i });
    });
    text(s, "削減率や検知精度の数値は、事前にはお示ししません。", { x: M, y: 6.05, w: CW, h: 0.45, fontSize: 13, bold: true, color: C.accent4, valign: "middle", objectName: "metric-note" });
    s.addNotes("削減率の数字はお約束しません。一つの作業を選び、いまの時間と件数を伺ってから、目標を一緒に決めます。");
  }

  /* ===== 14. 事前に伺いたいこと ===== */
  {
    const s = content("進め方｜事前の確認", "事前に伺いたいこと", "デモの前提を御社の環境に合わせるために、先に確かめたい6項目", "進め方");
    const z = { fill: { color: THEME.colors.lt2 } };
    const data = [
      ["1", "Splunkの構成（ESの版、UEBAがES統合か旧UBAか、SOARの利用範囲）と、M365の監査ログの取り込み", "画面と検知の前提。画面名はESの版で異なる場合がある", "SOC、委託先"],
      ["2", "SOCの体制（委託先と社内の役割分担、契約範囲）", "社内で判断・修正してよい範囲が決まる", "SOC責任者"],
      ["3", "M365側の設定（外部自動転送の既定、条件付きアクセス、MFAの方式）", "封じ込め④と改善の前提", "情報システム部門"],
      ["4", "SOC・CSIRT端末の条件（閉域、VDI、拡張機能の配布）", "テックタッチを入れられるかの前提", "情報システム部門"],
      ["5", "相関検索の作成権限と、スケジュールの時刻（Splunk CloudはUTC）", "相関検索を社内で作れるかの前提", "ESの管理者"],
      ["6", "AI Hubに渡す情報の範囲", "調査記録には個人情報が含まれうる", "情報セキュリティの責任者"]
    ];
    const rows = [[th("#"), th("確かめたいこと"), th("理由"), th("主な伺い先（想定）")]].concat(data.map((d, i) => {
      const o = i % 2 ? z : {};
      return [td(d[0], Object.assign({ bold: true, align: "center" }, o)), td(d[1], o), td(d[2], o), td(d[3], o)];
    }));
    s.addTable(rows, Object.assign({ y: 2.25, objectName: "ask-table" }, tableStyle([0.5, 5.5, 3.8, 2.53], [0.45, 0.8, 0.62, 0.62, 0.62, 0.62, 0.62])));
    foot(s, "「主な伺い先」は想定です。御社の体制に合わせて伺います。");
    s.addNotes("この6項目は、デモを御社の環境に合わせるための前提です。ESの版によって画面名や用語が異なる場合があるため、1番を最初に伺います。");
  }

  /* ===== 15. ご覧いただく前に ===== */
  {
    const s = content("進め方｜前提", "デモをご覧いただく前に", "イメージデモの前提を、先にお伝えします", "進め方");
    const n = [
      ["架空のシナリオです", "特定の企業や事案を題材にしたものではありません。人物・企業名・件数は架空で、接続元のIPなどは文書用の予約値です。"],
      ["画面はイメージです", "Splunk公式のUI部品で組んだ画面イメージで、ES・UEBA・SOARの実画面ではありません。画面名や項目名はESの版で異なる場合があり、御社の版で確かめます。"],
      ["AIの回答は準備した例です", "Splunk AI Assistantは参考画面、AI Hubは構想と、本番前に確かめた例文です。"],
      ["テックタッチのガイドは案です", "ガイド・ツールチップ・入力チェックは、御社の手順に合わせて作る前の案です。"],
      ["入口の防止は扱いません", "フィッシングを防ぐ話ではなく、速く気づき、社内で止め、範囲を確定し、記録する話です。"]
    ];
    const rows = n.map((it) => [td(it[0], { bold: true, color: C.accent1, fill: { color: THEME.colors.accent3 }, fontSize: 13 }), td(it[1], { fontSize: 13 })]);
    s.addTable(rows, Object.assign({ y: 2.25, objectName: "pre-table" }, tableStyle([3.4, 8.93], [0.82, 0.82, 0.82, 0.82, 0.82])));
    s.addNotes("デモの前提です。画面はイメージで、実画面ではありません。数字や人物はすべて架空です。");
  }

  /* ===== 16. 次の一歩 ===== */
  {
    const s = content("進め方｜次の一歩", "次の一歩", "入っているES・UEBA・SOARを、社内の人が判断・承認・記録まで使い切る。その最初の一歩を、一緒に決めさせてください", "進め方");
    const st = [
      ["①　事前に伺いたい6項目", ["Splunkの構成、SOCの体制、M365の設定、端末の条件、権限、AI Hubに渡す範囲を伺います"]],
      ["②　デモ（9場面・36分）", ["場面の終わりごとに、5つの問いに沿って伺います", "画面はイメージ、数値は架空です"]],
      ["③　最初に確かめる作業を決める", ["近い問いを一つ選びます", "その作業で、現状の時間と件数を測ります"]]
    ];
    const gap = 0.45, cw = (CW - 2 * gap) / 3;
    st.forEach((c, i) => {
      const x = M + i * (cw + gap);
      card(s, x, 2.25, cw, 2.6, c[0], "next-" + i, i === 2 ? C.accent1 : C.accent2);
      text(s, bullets(c[1], { paraSpaceAfter: 8 }), { x: x + 0.15, y: 2.8, w: cw - 0.3, h: 1.9, fontSize: 14, objectName: "next-body-" + i });
      if (i < st.length - 1) s.addShape(pres.shapes.CHEVRON, { x: x + cw + 0.14, y: 3.35, w: 0.17, h: 0.4, fill: { color: C.accent6 }, line: { type: "none" }, objectName: "next-arrow-" + i });
    });
    foot(s, "架空のシナリオ・イメージデモです。特定の企業や事案を題材にしたものではありません。");
    s.addNotes("最後に、次の一歩です。事前の6項目を伺い、デモで5つの問いを一緒に確かめ、最初に測る作業を一つ決めます。");
  }

}

/* ==================== 短縮版（4枚）：デモの直前の説明 ==================== */
async function buildShort() {
  /* ----- 1. 表紙 ----- */
  {
    const s = pres.addSlide({ masterName: "TITLE" });
    s.addText("M365アカウント\n乗っ取り対応デモ\nのご説明", { placeholder: "title" });
    s.addText("Splunk ES＋UEBA＋SOAR ×\nテックタッチ（DAP＋AI Hub）", { placeholder: "body" });
    text(s, "入っているSplunkを、社内の人が\n判断・承認・記録まで使い切る", { x: 5.75, y: 2.45, w: 7.1, h: 1.05, fontSize: 22, bold: true, color: C.accent1, objectName: "headline" });
    text(s, bullets(["架空のA社を舞台にした、一般的なSOC事案の型（M365アカウントの乗っ取り）", "デモは9場面（36分）＋振り返り（1分）"]), { x: 5.75, y: 3.75, w: 7.1, h: 0.9, fontSize: 15, objectName: "headline-points" });
    text(s, "テックタッチ株式会社\n2026年10月\n架空のシナリオ・イメージデモです。特定の企業や事案を題材にしたものではありません。", { x: 5.75, y: 5.5, w: 7.1, h: 0.9, fontSize: 12, color: C.accent5, objectName: "meta" });
    s.addNotes("デモの前に、3枚で前提をご説明します。架空のA社を舞台にした、一般的なSOC事案の型のシナリオです。");
  }

  /* ----- 2. お見せすること ----- */
  {
    const s = content("デモの前に", "このデモでお見せすること", "製品を足す話ではない。入っているES・UEBA・SOARを、社内の人がノータブルの後の判断・承認・記録まで使い切る姿を見せる");
    const steps = [["① フィッシング", "取引先を装ったリンク"], ["② セッション奪取", "AiTM型の想定"], ["③ 不審なサインイン", "深夜・国外・ASN"], ["④ 外部転送ルール", "受信トレイのルール"], ["⑤ 大量ダウンロード", "SharePointから1,200件"], ["⑥ 社内へ拡散", "380名へリンク付きメール"]];
    const gap = 0.26, sw = (CW - 5 * gap) / 6;
    text(s, "題材：M365アカウントの乗っ取り（架空のA社）", { x: M, y: 2.12, w: CW, h: 0.3, fontSize: 13, bold: true, objectName: "theme-head" });
    steps.forEach((st, i) => {
      const x = M + i * (sw + gap);
      card(s, x, 2.48, sw, 0.9, st[0], "step-" + i, i < 2 ? GRAYHEAD : C.accent2);
      text(s, st[1], { x: x + 0.1, y: 2.9, w: sw - 0.2, h: 0.42, fontSize: 12, valign: "middle", objectName: "step-body-" + i });
      if (i < steps.length - 1) s.addShape(pres.shapes.CHEVRON, { x: x + sw + 0.07, y: 2.78, w: 0.12, h: 0.3, fill: { color: C.accent6 }, line: { type: "none" }, objectName: "step-arrow-" + i });
    });
    sq(s, M, 3.48, 2 * sw + gap, 0.4, C.background2, null, "scope-out");
    text(s, "範囲外（入口の防止）", { x: M, y: 3.48, w: 2 * sw + gap, h: 0.4, fontSize: 12, color: C.accent5, align: "center", valign: "middle", objectName: "scope-out-text" });
    sq(s, M + 2 * (sw + gap), 3.48, 4 * sw + 3 * gap, 0.4, C.accent1, null, "scope-in");
    text(s, "デモの範囲：速く気づき、社内で止め、範囲を確定し、記録する", { x: M + 2 * (sw + gap), y: 3.48, w: 4 * sw + 3 * gap, h: 0.4, fontSize: 13, bold: true, color: C.background1, align: "center", valign: "middle", objectName: "scope-in-text" });
    const cards = [
      ["①　ノータブルの後を、社内で進める", "「本人の利用か」を本人と上長に確かめ、チェックリストが埋まるまで封じ込めに進まない"],
      ["②　承認段階を決めて、SOARを動かす", "①②は担当者が即時、③はSOC責任者、④はCSIRT責任者。承認番号をプレイブックに残す"],
      ["③　範囲・記録・改善を、社内に残す", "乗っ取られた間の操作と他アカウントを確定し、検知条件・承認段階・記録をナレッジにする"]
    ];
    const cw = (CW - 2 * 0.2) / 3;
    cards.forEach((c, i) => {
      const x = M + i * (cw + 0.2);
      card(s, x, 4.12, cw, 1.75, c[0], "point-" + i);
      text(s, c[1], { x: x + 0.12, y: 4.6, w: cw - 0.24, h: 1.15, fontSize: 13, objectName: "point-body-" + i });
    });
    text(s, "デモが置く仮説（確認必要）：ノータブルは出たが、本人確認の手順と承認者が社内に無く、委託先待ちで一次対応が4時間止まる", { x: M, y: 6.0, w: CW, h: 0.45, fontSize: 13, bold: true, color: C.accent4, valign: "middle", objectName: "hypo" });
    foot(s, "委託先の夜間監視・高度な分析・フォレンジックは、これまでどおりです。件数・時刻はデモ用の架空の値です。");
    s.addNotes("製品を足す提案ではありません。入っているES・UEBA・SOARを、社内の人が判断・承認・記録まで使い切る提案です。入口のフィッシングを防ぐ話はしません。委託先の仕事を取り上げる話でもありません。");
  }

  /* ----- 3. 流れと見どころ ----- */
  {
    const s = content("デモの前に", "デモの流れと見どころ", "SOC担当者の山田さん（架空）が、9場面で検知から記録・改善までを一人で進める。見せ場はS5の一次対応とS6の封じ込め");
    const sc = [
      ["S0　現場の問題", "2分", "依頼カードと5つの成果物"], ["S1　Before", "3分", "ノータブルが4時間未割当"], ["S2　要件整理", "4分", "日本語の依頼をAI Hubが整理"],
      ["S3　相関検索案・照合", "5分", "Assistantの案をD-02と照合"], ["S4　検証・保存", "5分", "テストログで検証して保存"], ["S5　一次対応", "5分", "本人・上長に確認し、チェックリスト"],
      ["S6　封じ込め", "4分", "承認段階どおりにSOARを実行"], ["S7　範囲の確定・記録", "5分", "操作と他アカウントを確定し記録"], ["S8　改善", "3分", "ナレッジと役割分担を更新"]
    ];
    const lw = 8.05, cw = (lw - 2 * 0.15) / 3, ch = 1.38;
    sc.forEach((c, i) => {
      const x = M + (i % 3) * (cw + 0.15), y = 2.25 + Math.floor(i / 3) * (ch + 0.14);
      const key = /^S[56]/.test(c[0]), hub = /^S[238]/.test(c[0]);
      card(s, x, y, cw, ch, c[0], "scene-" + i, key ? C.accent1 : hub ? HUB : C.accent2);
      text(s, c[1], { x: x + cw - 0.75, y, w: 0.65, h: 0.38, fontSize: 12, bold: true, color: C.background1, align: "right", valign: "middle", objectName: "scene-time-" + i });
      text(s, c[2], { x: x + 0.12, y: y + 0.48, w: cw - 0.24, h: 0.55, fontSize: 12, objectName: "scene-desc-" + i });
      if (key) text(s, "見せ場", { x: x + 0.12, y: y + ch - 0.36, w: cw - 0.24, h: 0.28, fontSize: 11, bold: true, color: C.accent4, objectName: "scene-key-" + i });
    });
    const rx = M + lw + 0.25, rw = W - M - rx;
    card(s, rx, 2.25, rw, 4.42, "画面に残す5つの成果物", "goals", C.accent1);
    const goals = ["社内基準D-02の相関検索", "一次対応のチェックリスト", "封じ込めの承認段階", "範囲の確定と記録", "ナレッジと役割分担"];
    goals.forEach((g, i) => {
      const y = 2.72 + i * 0.66;
      sq(s, rx + 0.18, y, 0.5, 0.5, C.accent3, null, "goal-num-bg-" + i);
      text(s, "①②③④⑤"[i], { x: rx + 0.18, y, w: 0.5, h: 0.5, fontSize: 15, bold: true, color: C.accent1, align: "center", valign: "middle", objectName: "goal-num-" + i });
      text(s, g, { x: rx + 0.82, y, w: rw - 1.0, h: 0.5, fontSize: 14, bold: true, valign: "middle", objectName: "goal-name-" + i });
    });
    text(s, "デモの成否は、この5つが画面に残るかで判断します。", { x: rx + 0.18, y: 6.08, w: rw - 0.36, h: 0.45, fontSize: 12, color: C.accent5, objectName: "goals-note" });
    foot(s, "見出しが淡い青の場面（S2・S3・S8）はAI Hubが中心、濃い青の場面（S5・S6）が見せ場です。");
    s.addNotes("各場面の終わりに「伺いたいこと」を一つ出します。時間が限られる場合は、S1・S5・S6を中心に短くできます。");
  }

  /* ----- 4. ご覧いただく前に ----- */
  {
    const s = content("デモの前に", "ご覧いただく前に", "画面・人物・数値はすべて架空です。デモの中で、右の問いを御社に当てはめてご覧ください");
    const lw = 5.9, rx = M + lw + 0.25, rw = W - M - rx;
    card(s, M, 2.25, lw, 4.42, "デモの前提", "premise");
    const pre = [
      ["架空のシナリオ", "特定の企業や事案を題材にしていません"],
      ["画面はイメージ", "ES・SOARの実画面ではありません。画面名は版で異なる場合あり"],
      ["AIの回答は準備した例", "Assistantは参考画面、AI Hubは構想と例文です"],
      ["ガイドは案", "ガイド・入力チェックは、御社の手順に合わせて作ります"],
      ["数値の約束はしない", "効果は、封じ込めまでの時間などの4つの指標で確かめます"]
    ];
    pre.forEach((p, i) => {
      const y = 2.72 + i * 0.78;
      if (i > 0) s.addShape(pres.shapes.LINE, { x: M + 0.15, y: y - 0.08, w: lw - 0.3, h: 0, line: { color: C.accent6, width: 0.75 }, objectName: "premise-sep-" + i });
      text(s, p[0], { x: M + 0.18, y, w: lw - 0.36, h: 0.3, fontSize: 13, bold: true, color: C.accent1, objectName: "premise-head-" + i });
      text(s, p[1], { x: M + 0.18, y: y + 0.3, w: lw - 0.36, h: 0.36, fontSize: 12, objectName: "premise-body-" + i });
    });
    card(s, rx, 2.25, rw, 4.42, "デモの中で考えていただきたい問い", "questions", C.accent1);
    const qs = [
      "ノータブルの後の一次対応は、委託先のチケットを待つ形ですか",
      "検知ルールや閾値を変えるとき、委託先の見積もりと改修を待ちますか",
      "SOARが「いつ・何を・誰の承認で」動くかを、社内で説明できますか",
      "過去の事案の調査記録と判断理由は、社内が読める場所にありますか",
      "直近の事案の発見は、自社の検知でしたか、外部からでしたか"
    ];
    qs.forEach((q, i) => {
      const y = 2.75 + i * 0.78;
      sq(s, rx + 0.18, y + 0.04, 0.6, 0.55, C.accent1, null, "q-num-bg-" + i);
      text(s, "Q" + (i + 1), { x: rx + 0.18, y: y + 0.04, w: 0.6, h: 0.55, fontSize: 13, bold: true, color: C.background1, align: "center", valign: "middle", objectName: "q-num-" + i });
      text(s, q, { x: rx + 0.92, y: y + 0.04, w: rw - 1.1, h: 0.55, fontSize: 13, valign: "middle", objectName: "q-text-" + i });
    });
    foot(s, "答えにくい問いが、デモで一緒に確かめたいところです。場面の終わりごとに伺います。");
    s.addNotes("デモの前提です。画面はイメージで、実画面ではありません。数字や人物はすべて架空です。デモの中で、この5つの問いを御社に当てはめてご覧ください。");
  }
}

(async () => {
  if (SHORT) await buildShort(); else await buildFull();
  await pres.writeFile({ fileName: OUT });
  if (APPLY_THEME) {
    const { applyTheme } = require(APPLY_THEME);
    await applyTheme(OUT, THEME);
  }
  await finalizePptx(OUT, THEME.bodyFontFace);
  console.log("ok", OUT);
})().catch((e) => { console.error(e); process.exit(1); });
