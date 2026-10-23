// デモのデータ。企業・人物・サービス・ホスト・チケット番号・時刻・数値はすべて架空。
// 画面の文言（ラベル）は L にまとめ、実画面で確かめた表記に合わせて差し替える。

/* ---------- 画面の文言 ---------- */
export const L = {
  snow: {
    // 日本語の表記：ServiceNow を日本語で使っている画面の写真（UI16）と、ServiceNow の日本語の公式ドキュメントで確かめたもの。確かめられないものは README の一覧に「推定」と記す
    all: "すべて", fav: "お気に入り", hist: "履歴", ws: "ワークスペース",
    search: "検索", follow: "フォロー", update: "更新", resolve: "解決", del: "削除", discuss: "ディスカッション", responses: "応答",
    incident: "インシデント", incidents: "インシデント", task: "タスク", tasks: "タスク",
    number: "番号", caller: "問い合わせユーザー", category: "カテゴリ", subcategory: "サブカテゴリ", service: "サービス", offering: "サービスオファリング", ci: "影響を受けた構成アイテム",
    short: "概要説明", desc: "説明", opened: "オープン日時", channel: "受付手段", state: "ステータス", impact: "影響", urgency: "緊急度", priority: "優先度",
    group: "アサイン先グループ", assignee: "アサイン先", due: "期限", watch: "ウォッチリスト", wnList: "作業メモリスト",
    comments: "追加コメント (顧客に表示)", worknotes: "作業メモ", post: "投稿", activities: "アクティビティ",
    notes: "メモ", related: "関連レコード", resolution: "解決情報", relatedSearch: "関連する検索結果",
    fieldChanges: "フィールド変更", attachment: "添付ファイル", openedBy: "オープン者", was: "←",
    actionsOnRows: "選択した行に対するアクション...", newBtn: "新規", active: "アクティブ", empty: "(空)", none: "-- なし --",
    states: ["新規", "処理中", "保留中", "解決済み", "クローズ済み", "キャンセル"],
    tstates: ["オープン", "作業中", "クローズ (完了)", "クローズ (未完了)", "クローズ (スキップ)"],
    attach: "添付ファイルを追加"
  },
  itsi: {
    // ITSI 5.0（2026年6月提供）の画面写真（英語表示）に合わせる。ITSI の画面が日本語になるかは未確認
    app: "IT Service Intelligence",
    nav: ["Service Analyzer", "Entity Overview", "Alerts and Episodes", "Glass Tables", "Deep Dives", "Dashboards", "Configuration", "Search"],
    ack: "Acknowledge", actions: "Actions",
    tabs: ["Overview", "Events Timeline", "Similar Episodes", "Dashboard", "Activity", "Instructions", "Common Fields"],
    statuses: ["New", "In Progress", "Pending", "Resolved", "Closed"],
    tile: "Tile", tree: "Tree", deep: "Open all in Deep Dive"
  },
  sp: {
    // 確認：日本語の公式ドキュメント・日本語画面の記事で確かめた表記。推定：出典が見つからず、実画面で要確認（README に一覧）
    app: "サーチとレポート",
    nav: ["サーチ", "Analytics", "データセット", "レポート", "アラート", "ダッシュボード"],
    tabs: ["イベント", "パターン", "統計情報", "視覚エフェクト"],
    saveAs: "名前を付けて保存", close: "閉じる", smart: "スマートモード",
    tableView: "テーブルビューの作成",             // 推定
    export: "エクスポート", exportTitle: "結果のエクスポート", format: "形式", fname: "ファイル名", count: "結果数", unlimited: "無制限", limited: "制限あり", cancel: "キャンセル", // 推定（Export は英語の項目名のみ確認）
    edit: "編集", more: "その他のアクション", openInSearch: "サーチで開く", // 推定（サーチで開く は準確認）
    reportCols: ["タイトル", "アクション", "次回のスケジュール時刻", "所有者", "App", "共有"], // 推定
    reportsIntro: "レポートは単一のサーチに基づいており、視覚エフェクト、統計情報、イベントを含めることができます。名前をクリックするとレポートが表示されます。" // 推定
  }
};

/* ---------- 人・グループ（架空） ---------- */
export const PEOPLE = { night: "山本 健", kiban: "小林 真", ic: "インシデントコマンダー当番" };
export const GROUPS = [
  ["night", "運用当番"],
  ["infra", "基盤有識者（NW・連携）"],
  ["app", "アプリ保守"],
  ["ic", "インシデントコマンダー当番"]
];
export const GROUP_RULES = [
  ["ネットワーク・連携（MQ）が先に崩れている", "基盤有識者（NW・連携）"],
  ["アプリのエラーだけが出ている（基盤は正常）", "アプリ保守"],
  ["どちらとも判断できない／業務への影響が広い", "インシデントコマンダー当番"]
];

/* ---------- ServiceNow（架空のレコード） ---------- */
export const INC = {
  number: "INC0012847",
  opened: "2026-10-21 22:41:09",
  caller: "監視連携",
  category: "ソフトウェア",
  service: "契約照会オンライン",
  ci: "契約照会オンライン（サービス）",
  channel: "監視",
  impact: "2 - 中", urgency: "1 - 高", priority: "2 - 高",
  short: "契約照会オンライン：応答遅延の監視アラート（自動起票）",
  desc: "ITSIエピソード：契約照会オンライン：応答遅延（複数KPI）\n検知 22:33／KPI：オンライン滞留件数 Critical、応答時間（p95） High\n監視から自動起票（A社の構成・架空）"
};
export const INC_LIST = [
  ["INC0012847", "2026-10-21 22:41:09", INC.short, "2 - 高", "新規", "運用当番", ""],
  ["INC0012839", "2026-10-21 22:05:37", "帳票出力：夜間処理の件数の遅れ", "4 - 低", "処理中", "運用当番", "佐藤 由紀"],
  ["INC0012826", "2026-10-21 20:12:50", "代理店ポータル：ログイン画面の表示遅延", "3 - 中", "解決済み", "運用当番", PEOPLE.night],
  ["INC0012818", "2026-10-21 18:47:03", "ジョブ管理：月次バッチの開始遅れ（再実行で解消）", "4 - 低", "解決済み", "運用当番", "佐藤 由紀"]
];
export const TASK = {
  number: "TASK0004211",
  short: "月次稼働統計の作成（2026年10月分）",
  due: "2026-11-05 17:00:00",
  group: "運用基盤チーム",
  desc: "毎月第2営業日までに、前月の稼働統計（全サービス）をSplunkのレポートから出力し、このタスクに添付する。\n報告先：システム運用会議（架空）"
};
export const TASK_LIST = [
  ["TASK0004211", "2026-11-01 00:00:05", TASK.short, "4 - 低", "オープン", "運用基盤チーム", PEOPLE.kiban, "2026-11-05 17:00:00"],
  ["TASK0004198", "2026-10-28 09:10:44", "証明書の更新計画（認証基盤）", "3 - 中", "作業中", "運用基盤チーム", PEOPLE.kiban, "2026-11-20 17:00:00"],
  ["TASK0004176", "2026-10-15 13:02:19", "ジョブ管理：休日カレンダーの登録（2027年）", "4 - 低", "オープン", "運用基盤チーム", "", "2026-11-30 17:00:00"]
];

/* 作業メモのひな型（テックタッチの「テンプレートの挿入」で入る文） */
export const TPL = {
  sokuho: "【速報】22:45 受領（夜間当番：" + PEOPLE.night + "）\n影響：確認中（ITSIで確認します）\n対応：ITSIのエピソードと保存済みサーチで切り分け中\n次回の連絡：23:15",
  kiriwake: "【切り分け結果】22:58\n確認した画面：ITSI（エピソード・Service Analyzer・Deep Dive）、保存済みサーチ「切り分け_契約照会_基盤」\n事実（時刻の早い順）：\n　22:30:58 DC間リンクの再送の増加（nw-core-02）512件\n　22:31:02 MQ接続の切断 MQRC 2009（mq-gw-01）37件\n　22:31:04 連携応答待ちのタイムアウト（ap-online-03）1,284件\n影響：契約照会オンライン、代理店ポータル（ITSIのService Analyzer）\n未確認のこと：",
  kiriwakeFill: "ネットワーク機器側のログ、MQ側のキューの滞留、バッチへの影響（いずれも当番の権限では見られません）",
  kiriwakeTail: "\n依頼したいこと：原因の特定と復旧の判断",
  monthly: "【月次稼働統計】11/04 09:48\n対象期間：2026/10/01〜2026/10/31（前月）\nレポート：稼働統計_月次_全システム\n行数：10（サービス数と一致）\n添付：稼働統計_月次_202610.csv"
};

/* ---------- Splunk ITSI（架空のサービス・エピソード） ---------- */
// 重大度の色は ITSI の既定の配色に合わせる（実画面で要確認）
// 重大度の色：ITSI の既定の配色（公式ドキュメント）。ライト表示の画面写真で High・Critical・Normal の値が一致することを確認
export const SEV = {
  critical: ["Critical", "#b50101"], high: ["High", "#f26a35"], medium: ["Medium", "#fcb64e"],
  low: ["Low", "#ffe98c"], normal: ["Normal", "#99d18b"], info: ["Info", "#aed3e5"]
};
export const SERVICES = [
  ["online", "契約照会オンライン", 31, "critical"],
  ["portal", "代理店ポータル", 58, "high"],
  ["mq", "連携基盤（MQ）", 22, "critical"],
  ["nw", "ネットワーク（DC間）", 45, "high"],
  ["ap", "AP基盤", 72, "medium"],
  ["db", "DB基盤", 94, "normal"],
  ["auth", "認証基盤", 98, "normal"],
  ["pay", "支払バッチ", 100, "normal"],
  ["job", "ジョブ管理", 97, "normal"],
  ["form", "帳票出力", 88, "low"]
];
export const TREE = { root: "online", children: ["ap", "db", "mq", "nw"], also: "portal" };
export const KPIS = {
  online: [["オンライン滞留件数", "1,842 件", "critical"], ["応答時間（p95）", "8.4 秒", "high"], ["取引エラー率", "3.1 %", "medium"], ["同時接続数", "2,310", "normal"]],
  mq: [["MQ連携エラー率", "12.7 %", "critical"], ["キュー滞留（ONL.TO.CORE）", "9,420", "high"]],
  nw: [["パケット損失率（DC間）", "2.4 %", "high"], ["再送数（DC間）", "512 /分", "high"]]
};
export const EPISODES = [
  ["ep1", "critical", "契約照会オンライン：応答遅延（複数KPI）", "New", "unassigned", "10/21/26 22:33:12", 47, "INC0012847"],
  ["ep2", "high", "代理店ポータル：エラー率の上昇", "New", "unassigned", "10/21/26 22:35:40", 12, ""],
  ["ep3", "medium", "AP基盤：ap-online-03 CPU使用率", "New", "unassigned", "10/21/26 22:34:10", 6, ""],
  ["ep4", "low", "帳票出力：夜間処理の件数の遅れ", "In Progress", "sato.y", "10/21/26 21:58:02", 3, "INC0012839"],
  ["ep5", "info", "認証基盤：証明書の有効期限（30日前）", "Pending", "kobayashi.m", "10/21/26 09:00:00", 1, ""]
];
export const IMPACT = [
  ["online", "契約照会オンライン", "critical", "業務"],
  ["portal", "代理店ポータル", "high", "業務（契約照会オンラインに依存）"],
  ["mq", "連携基盤（MQ）", "critical", "連携"],
  ["nw", "ネットワーク（DC間）", "high", "基盤"],
  ["ap", "AP基盤", "medium", "基盤"]
];
// Deep Dive のレーン（22:00〜23:00、1分ごと）。22:31ごろにそろって悪化する
function series(base, peak, noise, startAt, seed) {
  const out = [];
  let s = seed;
  for (let i = 0; i <= 60; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280 - 0.5;
    const v = i < startAt ? base + r * noise : peak + r * noise * 2 - Math.max(0, (startAt + 6 - i)) * (peak - base) / 7;
    out.push(Math.max(0, v));
  }
  return out;
}
export const LANES = [
  ["オンライン滞留件数（契約照会オンライン）", "critical", series(120, 1800, 60, 31, 7), [600, 1200]],
  ["応答時間 p95 秒（契約照会オンライン）", "high", series(0.9, 8.2, 0.3, 31, 11), [3, 10]],
  ["MQ連携エラー率 %（連携基盤）", "critical", series(0.2, 12.5, 0.2, 31, 5), [2, 8]],
  ["パケット損失率 %（ネットワーク DC間）", "high", series(0.05, 2.4, 0.06, 31, 3), [1, 3]]
];

/* ---------- サーチとレポート（架空のログ・レポート） ---------- */
export const SAVED = {
  title: "切り分け_契約照会_基盤",
  owner: "unyo_kiban",
  spl: "index=itops_ap OR index=itops_mq OR index=itops_nw (host=ap-online-* OR host=mq-gw-* OR host=nw-core-* OR host=portal-web-*) (level=ERROR OR level=WARN)\n| stats count AS 件数 min(_time) AS 最初 BY host, source, message\n| sort 最初\n| eval 最初=strftime(最初, \"%H:%M:%S\")\n| table 最初 host source message 件数"
};
// 時間範囲のプリセット。「過去 24 時間」「過去 7 日間」「全時間」は日本語の公式ドキュメントで確認。ほかは同じ書き方（数字の前後に半角スペース）での推定
export const RANGES = {
  today: ["今日", ""],
  prevmonth: ["前月", "2026/10/01 0:00:00.000 〜 2026/11/01 0:00:00.000"],
  "15m": ["過去 15 分間", "2026/10/21 22:35:12.000 〜 2026/10/21 22:50:12.000"],
  "60m": ["過去 60 分間", "2026/10/21 21:50:00.000 〜 2026/10/21 22:50:12.000"],
  "4h": ["過去 4 時間", ""],
  "24h": ["過去 24 時間", "2026/10/20 22:00:00.000 〜 2026/10/21 22:50:12.000"],
  "7d": ["過去 7 日間", ""],
  "30d": ["過去 30 日間", "2026/10/05 0:00:00.000 〜 2026/11/04 9:41:00.000"],
  all: ["全時間", ""]
};
export const RESULTS = [
  ["22:30:58", "nw-core-02", "syslog", "DC間リンク 再送の増加（閾値超過）", "512"],
  ["22:31:02", "mq-gw-01", "mq.log", "MQRC 2009（接続の切断）チャネル ONL.TO.CORE", "37"],
  ["22:31:04", "ap-online-03", "app.log", "連携応答待ちのタイムアウト（30秒超過）", "1,284"],
  ["22:31:05", "ap-online-01", "app.log", "連携応答待ちのタイムアウト（30秒超過）", "1,190"],
  ["22:32:40", "portal-web-02", "access.log", "HTTP 504（ゲートウェイのタイムアウト）", "655"],
  ["22:34:10", "ap-online-03", "os.log", "CPU使用率 92%（閾値 90%）", "6"]
];
export const REPORTS = [
  ["rp-main", "稼働統計_月次_全システム", "2026年4月改訂：代理店ポータルを追加", "なし", "unyo_kiban", "search", "アプリ"],
  ["rp-old", "稼働統計_月次_全システム_旧", "2026年3月まで（代理店ポータルを含まない）", "なし", "unyo_kiban", "search", "アプリ"],
  ["rp-k", "切り分け_契約照会_基盤", "夜間当番の切り分け用", "なし", "unyo_kiban", "search", "アプリ"],
  ["rp-w", "週次_エラー件数_代理店ポータル", "", "毎週月曜 08:00", "unyo_kiban", "search", "アプリ"]
];
// 10月は31日＝44,640分。稼働率＝(44,640－停止分)÷44,640 を小数2桁で切り捨て
export const MONTHLY = [
  ["契約照会オンライン", "99.91", "1", "38", "412"],
  ["代理店ポータル", "99.93", "1", "31", "388"],
  ["連携基盤（MQ）", "99.92", "1", "35", "—"],
  ["ネットワーク（DC間）", "99.93", "1", "27", "—"],
  ["AP基盤", "100.00", "0", "0", "—"],
  ["DB基盤", "100.00", "0", "0", "—"],
  ["認証基盤", "100.00", "0", "0", "—"],
  ["支払バッチ", "99.97", "1", "9", "—"],
  ["ジョブ管理", "100.00", "0", "0", "—"],
  ["帳票出力", "99.96", "1", "14", "—"]
];
export const MONTHLY_SPL = "| savedsearch 稼働統計_月次_全システム";
export const FNAME = "稼働統計_月次_202610";
