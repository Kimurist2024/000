// 場面の定義：物語（時刻・役割・説明）と、テックタッチのガイドのステップ。
// ステップ：label（ステップ名）、target（指す要素）、tip（吹き出しの本文）、sub（補足）、explain（「次へ」で進む説明のステップ）、
//          handle（画面の操作を判定して "done" か { wrong } か { busy, apply } を返す）、auto（進行バーの「進める」で行う操作）、after（完了時の処理）、
//          go（完了したら開く場面。リンクで別のツールを開く）、fix（入力チェックの「直す」ボタン）。
import { L, TPL, PEOPLE, FNAME } from "./data.js";

export const SUMMARY = 10;
export const ROLE = { night: "夜間当番（基盤運用）の視点", kiban: "運用基盤チームの視点" };
// [場面番号, 表示, 名前, 補足, 区切り]
export const JOURNEY = [
  [1, "0", "全体像", "ツールと役割"],
  [2, "1", "受け取り・速報", "ServiceNow", true],
  [3, "2", "エピソード", "ITSI"],
  [4, "3", "見る順番", "ITSI"],
  [5, "4", "裏付け", "サーチ"],
  [6, "5", "引き継ぎ", "ServiceNow"],
  [7, "6", "月次タスク", "ServiceNow", true],
  [8, "7", "レポート出力", "レポート"],
  [9, "8", "添付・クローズ", "ServiceNow"],
  [10, "✓", "振り返り", "まとめ", true]
];

const clickIs = (id) => (c, ev) => (ev.kind === "click" && ev.id === id ? "done" : null);
const openIs = (id) => (c, ev) => (ev.kind === "open" && ev.id === id && c.open === id ? "done" : null);
function pickIs(id, want, wrongs) {
  return (c, ev) => {
    if (ev.kind !== "pick" || ev.id !== id) return null;
    if (ev.value === want) return "done";
    return { wrong: (wrongs && wrongs[ev.value]) || "選び直してください。" };
  };
}
const base = (o) => Object.assign({ step: 0, vals: {}, open: null, closed: {} }, o);
// ServiceNow の画面：作業メモのチェックは、ガイドの順番に関係なく切り替えられる（判定は各ステップで行う）
const snowFree = (c, ev) => { if (ev.kind === "click" && ev.id === "sn-wn") c.vals.wn = !c.vals.wn; return false; };
// 投稿の前の入力チェック（作業メモのチェック → 書き漏れ）
const WN_WRONG = "「作業メモ」にチェックが入っていません。このまま投稿すると、顧客に表示されるコメントになります。";
const wnFix = { label: "作業メモにチェックを入れる", run: (c) => { c.vals.wn = true; } };
const SN_GUIDES_NIGHT = ["01. 夜間一次対応：受け取りと速報", "05. 有識者への引き継ぎ", "09. 復旧の連絡と解決"];
const SN_GUIDES_TASK = ["11. 月次稼働統計の作成", "12. 証明書の更新計画", "13. 休日カレンダーの登録"];

export const CH = {
  /* ==================== 0. 全体像 ==================== */
  1: {
    kind: "note", time: "全体像", timeSub: "A社（架空）",
    title: "監視から記録まで、ツールは4つ。手順は、ツールの外にある",
    text: "監視はZabbix・JP1、起票と記録はServiceNow、影響と事実の確認はSplunk（ITSIとサーチとレポート）。夜間当番と運用基盤チームは、ツールをまたいで社内の手順を回しています。",
    startLabel: "全体像の説明を始める", nextLabel: "前半へ（夜間の一次切り分け）",
    init: () => base({ app: "overview" }),
    steps: [
      { label: "監視", explain: true, target: "#ov-mon", tip: "監視（Zabbix・JP1）が異常を見つけると、ServiceNowにインシデントが起票されます。Splunk ITSIもKPIの悪化をエピソードとしてまとめます（A社の構成・架空）。" },
      { label: "起点と記録", explain: true, target: "#ov-snow", tip: "起点はServiceNowです。夜間当番はここで受け取り、ここで有識者に渡します。記録の正もServiceNowです。" },
      { label: "確認", explain: true, target: "#ov-splunk", tip: "影響と事実はSplunkで確かめます。ITSIの画面と保存済みサーチは、構築ベンダーと運用基盤チームが用意したものです。" },
      { label: "テックタッチ", explain: true, target: "#ov-tt", tip: "テックタッチは、ツールをまたぐ社内の手順を、それぞれの画面の上に置きます。ツールは替えません。" },
      { label: "今日の2本", explain: true, target: "#ov-parts", tip: "前半は夜間の一次切り分け（10月21日 22:41〜）。後半は月に1回の稼働統計（11月4日 9:32〜）。どちらも同じ仕組みです。" }
    ],
    ask: "障害の連絡を受けてから有識者に渡すまで、いまは何の画面を、どの順番で見ていますか？"
  },

  /* ==================== 前半 1. ServiceNow：受け取りと速報 ==================== */
  2: {
    role: "night", time: "22:41", timeSub: "10月21日（水）夜間",
    title: "ServiceNowでインシデントを受け取り、速報を書く",
    text: "監視から自動起票されたインシデントが、夜間当番のグループに入りました。当番の山本さんは、受け取りの記録と速報を済ませてから、Splunkで影響を確かめます。",
    guide: SN_GUIDES_NIGHT[0], guides: SN_GUIDES_NIGHT, free: snowFree,
    init: () => base({ app: "snow", view: "inc-list", vals: { state: L.snow.states[0] } }),
    steps: [
      { label: "インシデントを開く", target: "#sn-row-INC0012847 .sn-num", tip: "監視から自動起票されたインシデントです。番号を押して開きます。", handle: clickIs("sn-open-inc"), after: (c) => { c.view = "inc-form"; } },
      { label: L.snow.state + "を「" + L.snow.states[1] + "」にする", target: "#f-state", tip: "受け取ったら、" + L.snow.state + "を「" + L.snow.states[1] + "」にします。ほかの当番が同じチケットに重ねて手を付けないための合図です。",
        sub: "「" + L.snow.states[2] + "」や「" + L.snow.states[3] + "」を選ぶと、ガイドが止めます。",
        handle: pickIs("state", L.snow.states[1], { [L.snow.states[2]]: "「" + L.snow.states[2] + "」にすると、SLAの時間が止まります。夜間の一次対応中は「" + L.snow.states[1] + "」です（A社の決まり・架空）。", [L.snow.states[3]]: "まだ影響も原因も確かめていません。「" + L.snow.states[1] + "」にします。", [L.snow.states[0]]: "受け取ったら「" + L.snow.states[1] + "」にします。", [L.snow.states[4]]: "「" + L.snow.states[1] + "」にします。", [L.snow.states[5]]: "「" + L.snow.states[1] + "」にします。" }),
        auto: (c) => { c.vals.state = L.snow.states[1]; return "done"; }, after: (c) => { c.notes = ["comments"]; } },
      { label: "「" + L.snow.worknotes + "」にチェックを入れる", target: "#sn-wn", tip: "速報は社内向けの記録です。先に「" + L.snow.worknotes + "」にチェックを入れます。", sub: "赤い枠は、テックタッチが画面に置いた注意書きです。",
        handle: (c, ev) => (ev.kind === "click" && ev.id === "sn-wn" && c.vals.wn ? "done" : null), auto: (c) => { c.vals.wn = true; return "done"; } },
      { label: "速報のひな型を入れる", target: "#tt-tpl", tip: "速報の書き方は、テンプレートで決めています。「テンプレートの挿入」を押します。", handle: clickIs("tt-tpl"), after: (c) => { c.vals.worknotes = TPL.sokuho; } },
      { label: "作業メモを投稿する", target: "#sn-post", warnTarget: "#f-worknotes", tip: "受領時刻と次回の連絡時刻（23:15）が入りました。内容を確かめて「" + L.snow.post + "」を押します。",
        handle: (c, ev) => { if (ev.kind !== "click" || ev.id !== "sn-post") return null; if (!c.vals.wn) return { wrong: WN_WRONG }; return "done"; },
        fix: wnFix, auto: (c) => { c.vals.wn = true; return "done"; },
        after: (c) => { c.posted = ["sokuho"]; c.st1 = true; c.vals.worknotes = ""; c.notes = []; } },
      { label: "切り分けの手順を開く", target: "#tt-hdr", tip: "次はSplunkで影響を確かめます。画面の上の「切り分けの手順」を押します。", sub: "この入口は、テックタッチが画面に置いたものです。", handle: clickIs("tt-hdr"), after: (c) => { c.pop = true; } },
      { label: "ITSIでエピソードを見る", target: "#tt-link-itsi", tip: "「① ITSIでエピソードを見る」を押すと、Splunkが開き、続きのガイドが再生されます。", handle: clickIs("tt-link-itsi"), go: 3 }
    ],
    ask: "夜間にインシデントを受け取ったとき、最初に書く内容と書き方は、当番の間でそろっていますか？"
  },

  /* ==================== 前半 2. ITSI：エピソードの受け取り ==================== */
  3: {
    role: "night", time: "22:47", timeSub: "10月21日（水）夜間",
    title: "ITSIでエピソードを受け取る。閉じるのはServiceNow側",
    text: "ServiceNowの番号が付いたエピソードを開き、受け取ったことを記録して、アラートが出た順番を確かめます。ITSIの画面は構築ベンダーが用意したものです。",
    guide: "02. ITSI：エピソードの受け取り",
    init: () => base({ app: "itsi", view: "episodes", vals: { epstatus: L.itsi.statuses[0] } }),
    steps: [
      { label: "エピソードを開く", target: "#ep-row-ep1", tip: "「All Tickets」にServiceNowの番号（INC0012847）が入っている行を開きます。", handle: clickIs("ep-open"), after: (c) => { c.ep = "ep1"; } },
      { label: "受け取りを記録する", target: "#ep-ack", tip: "「" + L.itsi.ack + "」を押して、受け取ったことを記録します。",
        sub: "状態の欄で「" + L.itsi.statuses[3] + "」や「" + L.itsi.statuses[4] + "」を選ぶと、ガイドが止めます。",
        handle: (c, ev) => {
          if (ev.kind === "click" && ev.id === "ep-ack") return "done";
          if (ev.kind === "pick" && ev.id === "epstatus" && (ev.value === L.itsi.statuses[3] || ev.value === L.itsi.statuses[4])) {
            c.vals.epstatus = L.itsi.statuses[0];
            return { wrong: "エピソードはITSIでは閉じません。記録の正はServiceNowです。閉じるのは、ServiceNowのインシデントを解決してからです（A社の決まり・架空）。" };
          }
          return null;
        },
        after: (c) => { c.vals.epstatus = L.itsi.statuses[1]; c.acked = true; } },
      { label: "アラートが出た順番を見る", explain: true, target: "#ep-tl-card", tip: "「Events Timeline」は、根本原因の分析の順（Sort for: Root cause analysis）に並んでいます。いちばん上はDC間ネットワークの再送の増加です。", sub: "ここで原因は決めません。この順番を、Service Analyzerとサーチで確かめます。" },
      { label: "Service Analyzerを開く", target: "#nav-sa", tip: "依存関係を見るため、左のメニューから「" + L.itsi.nav[0] + "」を開きます。", handle: clickIs("nav-sa"), go: 4 }
    ],
    ask: "ITSIのエピソードを、誰が、どの時点で受け取り、どこで閉じる決まりになっていますか？"
  },

  /* ==================== 前半 3. ITSI：見る順番 ==================== */
  4: {
    role: "night", time: "22:49", timeSub: "10月21日（水）夜間",
    title: "Service AnalyzerとDeep Diveを、決めた順番で見る",
    text: "赤とオレンジが同時に並ぶと、どこから見るかが人によって変わります。業務 → 基盤 → 連携の順番を、画面の上で固定します。",
    guide: "03. ITSI：見る順番（業務→基盤→連携）",
    init: () => base({ app: "itsi", view: "sa", sa: "tile" }),
    steps: [
      { label: "見る順番", explain: true, target: "#sa-tiles", tip: "赤とオレンジが並んでいます。見る順番は、業務（契約照会オンライン）→ 基盤（AP・DB・ネットワーク）→ 連携（MQ）です（A社の切り分け手順・架空）。" },
      { label: "ツリー表示に切り替える", target: "#sa-tree", tip: "依存関係を見るため、「" + L.itsi.tree + "」に切り替えます。", handle: clickIs("sa-tree"), after: (c) => { c.sa = "tree"; } },
      { label: "業務のサービスを選ぶ", target: "#node-online", tip: "いちばん上の「契約照会オンライン」を選びます。", handle: clickIs("node-online"), after: (c) => { c.node = "online"; c.notes = ["nodecide"]; } },
      { label: "ぶら下がっている基盤を見る", explain: true, target: "#sa-tree-area", tip: "AP基盤・DB基盤・連携基盤（MQ）・ネットワーク（DC間）がぶら下がっています。赤が同時に並んでも、ここで原因を決めません。", sub: "右の赤い枠は、テックタッチが画面に置いた注意書きです。" },
      { label: "Deep Diveを開く", target: "#sa-deepdive", tip: "KPIの動きを時刻でそろえて見るため、「" + L.itsi.deep + "」を押します。", handle: clickIs("sa-deepdive"), after: (c) => { c.view = "deepdive"; c.notes = []; } },
      { label: "時刻をそろえて見る", explain: true, target: "#dd-lanes", tip: "4つのKPIが22:31ごろにそろって悪化しています。どれが先かは、この1分の粒度では決められません。ログで裏付けます。" },
      { label: "切り分けのサーチを開く", target: "#tt-link-search", tip: "テックタッチが置いたリンクから、運用基盤チームの保存済みサーチを開きます。", handle: clickIs("tt-link-search"), go: 5 }
    ],
    ask: "ITSIで赤が同時にいくつも出たとき、どこから見るかは、手順として決まっていますか？"
  },

  /* ==================== 前半 4. サーチ：裏付け ==================== */
  5: {
    role: "night", time: "22:50", timeSub: "10月21日（水）夜間",
    title: "保存済みサーチで、時刻の早い順に事実を並べる",
    text: "サーチ文（SPL）は書き換えません。変えるのは時間範囲だけです。範囲が広すぎると結果が遅くなり、狭すぎると始まりが抜けます。",
    guide: "04. 切り分けサーチ：時間範囲と読み方",
    init: () => base({ app: "search", view: "search", vals: { range: "24h" } }),
    steps: [
      { label: "サーチ文は変えない", explain: true, target: "#sp-spl", tip: "運用基盤チームが用意した保存済みサーチです。サーチ文は書き換えません。変えるのは時間範囲だけです。" },
      { label: "時間範囲を開く", target: "#sp-tp", tip: "いまは「過去 24 時間」になっています。時間範囲を開きます。", handle: openIs("tp"), auto: (c) => { c.open = "tp"; return "done"; } },
      { label: "「過去 60 分間」を選ぶ", target: "#tp-menu", warnTarget: "#tp-menu", tip: "いまは22:50です。始まり（22:31ごろ）を含む「過去 60 分間」を選びます。",
        handle: pickIs("range", "60m", { "24h": "24時間は範囲が広く、結果が出るまで時間がかかり、ほかの利用者のサーチにも影響します。始まり（22:31ごろ）を含む「過去 60 分間」を選びます。", "15m": "過去 15 分間（22:35以降）では、始まり（22:31ごろ）が入りません。「過去 60 分間」を選びます。", "4h": "「過去 4 時間」は広すぎます。始まり（22:31ごろ）を含む「過去 60 分間」を選びます。", "7d": "「過去 7 日間」は広すぎます。「過去 60 分間」を選びます。", today: "「今日」は0時からで広すぎます。「過去 60 分間」を選びます。", all: "「全時間」は、ほかの利用者のサーチにも影響します。「過去 60 分間」を選びます。" }),
        auto: (c) => { c.vals.range = "60m"; c.open = null; return "done"; } },
      { label: "サーチを実行する", target: "#sp-run", tip: "虫めがねのボタンでサーチを実行します。", handle: clickIs("sp-run"), after: (c) => { c.ran = true; c.notes = ["noexport"]; } },
      { label: "事実を時刻の順に読む", explain: true, target: "#sp-results", tip: "最初はDC間ネットワークの再送の増加（22:30:58）、次にMQの接続の切断（22:31:02）、その後に取引のタイムアウトです。", sub: "これは事実の並びです。原因の断定は有識者が行います。" },
      { label: "ServiceNowに戻って引き継ぐ", target: "#tt-link-snow", tip: "事実がそろいました。ServiceNowのインシデントに戻り、有識者に引き継ぎます。", handle: clickIs("tt-link-snow"), go: 6 }
    ],
    ask: "夜間当番が使ってよいサーチと、変えてよい条件（時間範囲など）は、決まっていますか？"
  },

  /* ==================== 前半 5. ServiceNow：引き継ぎ ==================== */
  6: {
    role: "night", time: "22:58", timeSub: "10月21日（水）夜間",
    title: "ServiceNowに事実を書き、基準どおりのグループに渡す",
    text: "確かめた画面・事実・影響・未確認のことを、決まった形で作業メモに残し、アサイン先グループを基準で選びます。業務部門への連絡とベンダーへの依頼は、当番からはしません。",
    guide: SN_GUIDES_NIGHT[1], guides: SN_GUIDES_NIGHT, free: snowFree,
    init: () => base({ app: "snow", view: "inc-form", posted: ["sokuho"], st1: true, vals: { state: L.snow.states[1], group: "運用当番", assignee: PEOPLE.night } }),
    steps: [
      { label: "切り分け結果のひな型を入れる", target: "#tt-tpl", tip: "「テンプレートの挿入」で、切り分け結果の書き方を入れます。Splunkで確かめた時刻と件数は、ひな型に沿って書きます。", handle: clickIs("tt-tpl"), after: (c) => { c.vals.worknotes = TPL.kiriwake + TPL.kiriwakeTail; } },
      { label: "作業メモを投稿する", target: "#sn-post", warnTarget: "#f-worknotes", tip: "内容を確かめて「" + L.snow.post + "」を押します。",
        handle: (c, ev) => {
          if (ev.kind !== "click" || ev.id !== "sn-post") return null;
          if (!c.vals.wn) return { wrong: WN_WRONG };
          if (!c.filled) return { wrong: "「未確認のこと」が空です。確かめていないことを書くと、有識者が同じ確認を繰り返さずに済みます。" };
          return "done";
        },
        fix: (c) => (!c.vals.wn ? wnFix : { label: "記入例を入れる", run: (cc) => { cc.filled = true; cc.vals.worknotes = TPL.kiriwake + TPL.kiriwakeFill + TPL.kiriwakeTail; } }),
        auto: (c) => { c.vals.wn = true; c.filled = true; return "done"; },
        after: (c) => { c.posted = ["sokuho", "kiriwake"]; c.vals.worknotes = ""; } },
      { label: L.snow.group + "の選び方を見る", target: "#tt-q-group", tip: "どのグループに渡すかは、基準で決めます。「？」を押します。", handle: clickIs("tt-q-group"), after: (c) => { c.crit = true; } },
      { label: L.snow.group + "を選ぶ", target: "#f-group", tip: "最初に崩れたのはDC間ネットワークと連携（MQ）です。基準に沿って選びます。",
        handle: pickIs("group", "基盤有識者（NW・連携）", { "アプリ保守": "最初に起きたのはDC間ネットワークの再送の増加です。アプリ保守に渡すと、夜間に再割り当てが起きます。「基盤有識者（NW・連携）」を選びます。", "インシデントコマンダー当番": "事実の並びから、ネットワーク・連携の事象と判断できます。インシデントコマンダー当番に渡すのは、判断できないときです。", "運用当番": "当番のグループのままでは、有識者に通知が届きません。「基盤有識者（NW・連携）」を選びます。" }),
        auto: (c) => { c.vals.group = "基盤有識者（NW・連携）"; c.open = null; return "done"; },
        after: (c) => { c.crit = false; } },
      { label: "通知先と担当を自動入力する", target: "#tt-auto", tip: L.snow.watch + "（インシデントコマンダー当番）と" + L.snow.assignee + "の欄は、テックタッチが決まりどおりに入れます。", handle: (c, ev) => (ev.kind === "click" && ev.id === "tt-auto" ? { busy: 1600, apply: (cc) => { cc.vals.assignee = ""; cc.vals.watch = PEOPLE.ic; cc.vals.wnList = "基盤有識者（NW・連携）"; cc.notes = ["contact", "vendor"]; } } : null),
        auto: () => ({ busy: 1600, apply: (cc) => { cc.vals.assignee = ""; cc.vals.watch = PEOPLE.ic; cc.vals.wnList = "基盤有識者（NW・連携）"; cc.notes = ["contact", "vendor"]; } }) },
      { label: "更新する", target: "#sn-update", tip: "赤い枠の注意書きを確かめてから、「" + L.snow.update + "」を押します。", handle: clickIs("sn-update"), after: (c) => { c.saved = true; } }
    ],
    nextLabel: "後半へ（月1回の稼働統計）",
    ask: "有識者に渡すときの書き方と、渡す先の選び方は、当番によって違っていませんか？"
  },

  /* ==================== 後半 6. ServiceNow：月次タスク ==================== */
  7: {
    role: "kiban", time: "9:32", timeSub: "11月4日（水）",
    title: "月に1回のタスクを、手順を覚えていなくても始められる",
    text: "運用基盤チームの小林さんに、月次稼働統計のタスクが来ました。月に1回なので、手順はうろ覚えです。前回の担当者は別の人でした。",
    guide: SN_GUIDES_TASK[0], guides: SN_GUIDES_TASK, free: snowFree,
    init: () => base({ app: "snow", view: "task-list", vals: { tstate: L.snow.tstates[0] } }),
    steps: [
      { label: "タスクを開く", target: "#sn-row-TASK0004211 .sn-num", tip: "「月次稼働統計の作成（2026年10月分）」を開きます。", handle: clickIs("sn-open-task"), after: (c) => { c.view = "task-form"; c.notes = ["oldreport"]; } },
      { label: "状態を「" + L.snow.tstates[1] + "」にする", target: "#f-tstate", tip: "始めるときに、状態を「" + L.snow.tstates[1] + "」にします。",
        handle: pickIs("tstate", L.snow.tstates[1], { [L.snow.tstates[2]]: "まだ出力していません。「" + L.snow.tstates[1] + "」にします。", [L.snow.tstates[3]]: "まだ出力していません。「" + L.snow.tstates[1] + "」にします。", [L.snow.tstates[4]]: "毎月の報告に使うため、飛ばせません。「" + L.snow.tstates[1] + "」にします。" }),
        auto: (c) => { c.vals.tstate = L.snow.tstates[1]; return "done"; } },
      { label: "定期作業の手順を開く", target: "#tt-hdr", tip: "画面の上の「定期作業の手順」を押します。", handle: clickIs("tt-hdr"), after: (c) => { c.pop = true; } },
      { label: "Splunkのレポートを開く", target: "#tt-link-report", tip: "「① 稼働統計のレポートを開く」を押すと、Splunkのレポートの一覧が開き、続きのガイドが再生されます。", handle: clickIs("tt-link-report"), go: 8 }
    ],
    ask: "月に1回や年に1回の作業の手順は、どこにあり、最後に更新したのはいつですか？"
  },

  /* ==================== 後半 7. レポート：出力 ==================== */
  8: {
    role: "kiban", time: "9:41", timeSub: "11月4日（水）",
    title: "正しいレポートを、正しい期間で、決まった名前で出す",
    text: "似た名前のレポートが2つあり、期間の選び方も2通りあります。どちらを選んでも数字は出るため、間違いに気づきにくい作業です。",
    guide: "12. 月次稼働統計：レポートの出力",
    init: () => base({ app: "search", view: "reports", vals: { range: "30d" } }),
    steps: [
      { label: "正しいレポートを開く", target: "#rp-table", tip: "名前の似たレポートが2つあります。「稼働統計_月次_全システム」を開きます。",
        handle: (c, ev) => (ev.kind === "click" && ev.id === "rp-main" ? "done" : ev.kind === "click" && ev.id === "rp-old" ? { wrong: "「_旧」は、2026年3月までの定義です。代理店ポータルが入っていません。「稼働統計_月次_全システム」を開きます。" } : null),
        auto: () => "done", after: (c) => { c.view = "report"; } },
      { label: "時間範囲を開く", target: "#sp-tp", tip: "いまは「過去 30 日間」になっています。時間範囲を開きます。", handle: openIs("tp"), auto: (c) => { c.open = "tp"; return "done"; } },
      { label: "「前月」を選ぶ", target: "#tp-menu", warnTarget: "#tp-menu", tip: "10月分を出すので「前月」を選びます。",
        handle: pickIs("range", "prevmonth", { "30d": "「過去 30 日間」は今日（11月4日）から数えるため、10月1日〜4日が抜け、11月1日〜4日が入ります。「前月」を選びます。", "7d": "「前月」を選びます。", "24h": "「前月」を選びます。", today: "「前月」を選びます。", all: "「全時間」は、ほかの利用者のサーチにも影響します。「前月」を選びます。", "60m": "「前月」を選びます。", "15m": "「前月」を選びます。", "4h": "「前月」を選びます。" }),
        auto: (c) => { c.vals.range = "prevmonth"; c.open = null; return "done"; } },
      { label: "行数を確かめる", explain: true, target: "#sp-results", tip: "10サービスの稼働率が出ました。行数がサービス数（10）と一致しているかを確かめます。" },
      { label: "エクスポートを開く", target: "#sp-export", tip: "結果をファイルに出すため、エクスポートのボタンを押します。", handle: clickIs("sp-export"), after: (c) => { c.dlg = true; } },
      { label: "ファイル名を自動入力する", target: "#tt-fname", tip: "ファイル名は決まった形（稼働統計_月次_年月）です。テックタッチが入れます。",
        handle: (c, ev) => (ev.kind === "click" && ev.id === "tt-fname" ? { busy: 1400, apply: (cc) => { cc.vals.fname = FNAME; } } : null),
        auto: () => ({ busy: 1400, apply: (cc) => { cc.vals.fname = FNAME; } }) },
      { label: "エクスポートする", target: "#ex-go", tip: "形式がCSVであることを確かめて、「" + L.sp.export + "」を押します。", handle: clickIs("ex-go"), after: (c) => { c.dlg = false; c.downloaded = true; } },
      { label: "ServiceNowのタスクに戻る", target: "#tt-link-task", tip: "ファイルができました。ServiceNowのタスクに戻って添付します。", handle: clickIs("tt-link-task"), go: 9 }
    ],
    ask: "定期のレポートで、古い版や期間の取り違えに気づくのは、いまは誰で、いつですか？"
  },

  /* ==================== 後半 8. ServiceNow：添付・クローズ ==================== */
  9: {
    role: "kiban", time: "9:48", timeSub: "11月4日（水）",
    title: "添付して、記録して、正しい状態で閉じる",
    text: "出力したファイルをタスクに添付し、対象期間と行数を作業メモに残してから、タスクを閉じます。",
    guide: "13. 月次稼働統計：添付とクローズ", free: snowFree,
    init: () => base({ app: "snow", view: "task-form", vals: { tstate: L.snow.tstates[1] } }),
    steps: [
      { label: "ファイルを添付する", target: "#sn-attach", tip: "ダウンロードした「" + FNAME + ".csv」を添付します。", handle: clickIs("sn-attach"), after: (c) => { c.attached = true; c.notes = ["rows"]; } },
      { label: "作業メモのひな型を入れる", target: "#tt-tpl", tip: "「テンプレートの挿入」で、対象期間・レポート名・行数の書き方を入れます。", handle: clickIs("tt-tpl"), after: (c) => { c.vals.worknotes = TPL.monthly; } },
      { label: "作業メモを投稿する", target: "#sn-post", warnTarget: "#f-worknotes", tip: "行数が10（サービス数と一致）であることを確かめて「" + L.snow.post + "」を押します。",
        handle: (c, ev) => { if (ev.kind !== "click" || ev.id !== "sn-post") return null; if (!c.vals.wn) return { wrong: WN_WRONG }; return "done"; },
        fix: wnFix, auto: (c) => { c.vals.wn = true; return "done"; },
        after: (c) => { c.posted = ["monthly"]; c.vals.worknotes = ""; } },
      { label: "状態を「" + L.snow.tstates[2] + "」にする", target: "#f-tstate", tip: "出力と添付が終わったので、「" + L.snow.tstates[2] + "」にします。",
        handle: pickIs("tstate", L.snow.tstates[2], { [L.snow.tstates[3]]: "出力も添付も終わっています。「" + L.snow.tstates[2] + "」です。", [L.snow.tstates[4]]: "出力も添付も終わっています。「" + L.snow.tstates[2] + "」です。", [L.snow.tstates[0]]: "「" + L.snow.tstates[2] + "」にします。", [L.snow.tstates[1]]: "「" + L.snow.tstates[2] + "」にします。" }),
        auto: (c) => { c.vals.tstate = L.snow.tstates[2]; return "done"; } },
      { label: "更新する", target: "#sn-update", tip: "「" + L.snow.update + "」を押して、タスクを閉じます。", handle: clickIs("sn-update"), after: (c) => { c.saved = true; } }
    ],
    nextLabel: "振り返りへ",
    ask: "月次の作業が終わったとき、何をもって「正しく終わった」と確かめていますか？"
  },

  /* ==================== 振り返り ==================== */
  10: { time: "振り返り", timeSub: "", title: "ServiceNowを起点に、ツールをまたぐ社内の手順を画面の上に置く", text: "ツールは替えず、手順と決まりを、それぞれの画面の上に置きました。辿れなかった箇所は、運用設計の側に返せます。", init: () => base({}) }
};
