// デモのデータ（すべて架空。data/demo_m365_audit.csv ほかと同じ値）
export const CASES = [
  { id: "A", user: "s.tanaka", src: "198.51.100.77",
    note: "深夜、普段と違う国・ASNからサインイン（MFA済みのセッション）。60分以内に外部への転送ルールを作り、1,200件をダウンロードし、社内380名へリンク付きメールを送信。申請なし", verdict: "ノータブル（要対応の候補）" },
  { id: "B", user: "it_admin01", src: "192.0.2.30",
    note: "IT管理者のサイト移行（申請 CHG-2026-1001）で4,800件をダウンロード。接続元は平常。件数だけを見ると混ざる", verdict: "検知しない（平常の接続元・申請済み）" },
  { id: "C", user: "m.suzuki", src: "203.0.113.55",
    note: "出張先からのサインイン。ダウンロードは12件、転送ルールなし", verdict: "閾値未満。記録のみ" },
  { id: "D", user: "ext_mig02", src: "203.0.113.9",
    note: "委託先の移行作業（申請 CHG-2026-1004）。移行ツールへの転送ルールを作り、2,000件をダウンロード", verdict: "例外（申請済み）。ただし作業後の転送ルールの削除を確認" }
];
const Q2_BODY = '| inputlookup demo_m365_audit.csv\n| eval epoch=strptime(event_time,"%Y-%m-%d %H:%M:%S"), request_id=if(request_id="",null(),request_id)\n| lookup demo_m365_baseline.csv user OUTPUT usual_geo usual_asn\n| sort 0 user epoch\n| eval odd_signin=if(action="signin" AND (geo!=usual_geo OR asn!=usual_asn), epoch, null())\n| streamstats latest(odd_signin) AS last_odd BY user\n| where action IN ("inbox_rule","download","send_mail") AND isnotnull(last_odd) AND epoch-last_odd<=3600\n| stats sum(eval(if(action="download",record_count,0))) AS downloads count(eval(action="inbox_rule" AND scope="external")) AS external_rules sum(eval(if(action="send_mail",record_count,0))) AS sent_mails values(request_id) AS request_id min(event_time) AS first_access max(event_time) AS last_access BY user src';
export const SPL = {
  before: '| inputlookup demo_m365_audit.csv\n| where action="download"\n| stats sum(record_count) AS downloads BY user\n| where downloads>=500\n| sort - downloads',
  q0: '| inputlookup demo_m365_audit.csv\n| stats count AS total_events dc(user) AS distinct_users dc(src) AS distinct_srcs',
  q1: '| inputlookup demo_m365_audit.csv\n| where action="signin"\n| lookup demo_m365_baseline.csv user OUTPUT usual_geo usual_asn\n| where geo!=usual_geo OR asn!=usual_asn\n| table event_time user src geo asn mfa\n| sort event_time',
  q2: Q2_BODY + "\n| sort - downloads",
  q3: Q2_BODY + "\n| where downloads>=500 AND external_rules>=1 AND isnull(request_id)",
  q4a: '| inputlookup demo_m365_audit.csv\n| where user="s.tanaka" AND src="198.51.100.77" AND action IN ("inbox_rule","download","send_mail")\n| stats sum(record_count) AS records values(target) AS target values(detail) AS detail min(event_time) AS first_time BY action\n| sort first_time',
  q4b: '| inputlookup demo_m365_audit.csv\n| where src="198.51.100.77" AND user!="s.tanaka"\n| table event_time user src action',
  ai1: '| inputlookup demo_m365_audit.csv\n| eval epoch=strptime(event_time,"%Y-%m-%d %H:%M:%S")\n| lookup demo_m365_baseline.csv user OUTPUT usual_geo usual_asn\n| sort 0 user epoch\n| eval odd_signin=if(action="signin" AND (geo!=usual_geo OR asn!=usual_asn), epoch, null())\n| streamstats latest(odd_signin) AS last_odd BY user\n| where action="download" AND isnotnull(last_odd) AND epoch-last_odd<=3600\n| stats sum(record_count) AS downloads BY user src\n| where downloads>=500'
};
export const SPL_Q5 = "（本番用の骨格。実行しない）\nindex=<M365監査ログのインデックス> sourcetype=<M365監査ログのsourcetype> earliest=-24h\n| lookup <利用者平常値のルックアップ> user OUTPUT usual_geo usual_asn\n| sort 0 user _time\n| eval odd_signin=if(action=\"signin\" AND (geo!=usual_geo OR asn!=usual_asn), _time, null())\n| streamstats latest(odd_signin) AS last_odd BY user\n| where action IN (\"inbox_rule\",\"download\",\"send_mail\") AND isnotnull(last_odd) AND _time-last_odd<=3600\n| stats sum(eval(if(action=\"download\",record_count,0))) AS downloads count(eval(action=\"inbox_rule\" AND scope=\"external\")) AS external_rules values(request_id) AS request_id BY user src\n| where downloads>=500 AND external_rules>=1 AND isnull(request_id)";
export const REPORTS = [
  ["q1", "SOC_M365_Q1_普段と違う接続元のサインイン", "利用者の平常値（国・ASN）と違うサインイン", "v1.0"],
  ["q2", "SOC_M365_Q2_サインイン後60分の操作集計", "普段と違うサインインの後60分以内の操作（ダウンロード・外部転送ルール・送信・申請番号）", "v1.0"],
  ["q3", "SOC_M365_Q3_D-02候補", "外部転送ルールあり・500件以上のダウンロード・申請なし（検知基準 D-02）", "v1.1（承認待ち）"],
  ["q4a", "SOC_M365_Q4a_範囲の確定", "対象アカウント・接続元の操作を、種類別に件数・対象・詳細で確定", "v1.0"],
  ["q4b", "SOC_M365_Q4b_同じ接続元の他アカウント", "同じ接続元から、他のアカウントへのサインインがあるか", "v1.0"]
];
export const REQUEST_IN = "M365に、普段と違う場所からサインインした後、外部への転送ルールの作成とファイルの大量ダウンロードがあったら、ESのノータブルにしたい。社内基準D-02に沿って、Splunk AI Assistantへの依頼を整えてください。";
export const REQUEST_OUT = "以下の2つのCSVルックアップに対してSPLを作成してください。demo_m365_audit.csv：event_time は %Y-%m-%d %H:%M:%S、user がアカウント、src が接続元IP、geo が国、asn がASN、action は signin／inbox_rule／download／send_mail／signout、record_count が件数、scope は external（社外）／internal（社内）、request_id は申請番号（空なら申請なし）。demo_m365_baseline.csv：user ごとの usual_geo、usual_asn。条件：(1) signin の geo または asn が平常値と違うものを「普段と違うサインイン」とする。(2) その後60分以内の同じ user の inbox_rule／download／send_mail を user と src で集計し、download の record_count の合計（downloads）、scope=external の inbox_rule の件数（external_rules）、send_mail の record_count の合計（sent_mails）、request_id の値、最初と最後の時刻を出す。(3) downloads が500件以上、external_rules が1件以上、request_id が空のものだけを残す。";
export const FIX_REQUEST = "先ほどのSPLに、次の2つを追加してください。(1) action が inbox_rule かつ scope が external の件数を external_rules として出し、1件以上であることを条件にする。(2) request_id が空のものを null にしたうえで values(request_id) を出し、null のものだけを残す（申請済みの移行・保守作業を除外）。あわせて send_mail の件数を sent_mails、min(event_time)・max(event_time) を first_access・last_access として出してください。";
export const SCOPE_REQ = "アカウント s.tanaka と接続元 198.51.100.77 について、(1) demo_m365_audit.csv の inbox_rule・download・send_mail を action 別に、record_count の合計・target・detail・最初の時刻で集計してください。(2) 同じ接続元から、s.tanaka 以外のアカウントへのサインインや操作があるかを table で出してください。";
export const HR_ASK = "【本人・上長への確認（AI Hubの例文）】10月6日 02:14 に、s.tanaka さんのアカウントで国外（国外1）からのサインインがあり、外部への転送ルールの作成、営業部サイトから1,200件のダウンロード、社内380名へのメール送信が行われています。出張や海外からの利用の予定はありますか。本人には、メールではなく電話で確認してください（メールボックスが乗っ取られている可能性があるため）。";
export const HR_REPLY = "出張の予定はありません。本人に電話で確認したところ、深夜は利用していないとのことです。昨日、取引先を名乗るメールのリンクからサインインしたそうです。";
export const NAME_RULE = /^[^_\s]+(_[^_\s]+){2,}$/;
export const TIPS = {
  std: ["A社の検知基準 D-02（社内・架空）", "普段と違う接続元（国・ASN）からのサインインの後60分以内に、同じアカウントが外部への転送ルールを作成し、ファイルを500件以上ダウンロードした。申請番号のある移行・保守作業は除外。リスクスコア80、ノータブルの緊急度は「高」。"],
  auth: ["封じ込めの承認段階 KB06（社内・架空）", "①セッション失効と②転送ルールの無効化・パスワードリセット・MFA再登録は、SOC担当者の判断で即時。③アカウント停止はSOC責任者の承認。④テナント全体の外部自動転送の禁止はCSIRT責任者の承認（情報システム部門と協議）。例外アカウント（役員・管理者）は③以降を必ず責任者に確認。"],
  disp: ["判定区分の定義（社内・架空）", "誤検知＝条件は満たすが脅威ではない／正当な利用＝本人の利用と確認できた（申請番号あり、または本人・上長が利用を確認）／要対応＝インシデントとして対応する。本人・上長が利用を否定した場合は「要対応」。"],
  report: ["通知・報告の判断材料 KB07（社内・架空）", "ダウンロードの件数と機密区分、外部に転送されたメール、社内外への送信、他アカウントへの広がり、封じ込めの状態を、確認済みと未確認に分けて記録する。監督官庁への報告と公表の要否は、法務とCSIRTがこの記録をもとに判断する（SOCは判断しない）。"]
};
export const GOALS = ["①社内基準D-02の相関検索（ESのノータブルとリスク）", "②一次対応チェックリストと、本人・上長への確認", "③封じ込めの承認段階（SOARプレイブックの入力）", "④範囲の確定（転送ルール・ダウンロード・社内送信・他アカウント）と記録", "⑤ナレッジと、委託先との役割分担"];
export const REQ_WORDS = ["普段と違う接続元（国・ASN）", "60分以内", "外部への転送ルール（scope=external）", "ダウンロード500件以上", "申請番号（request_id）があれば除外"];
export const CHECK_ROWS = [
  ["ログ辞書", "user、src、geo、asn、action、record_count、scope、request_id を使っているか", "実際の列名を確認", true],
  ["普段と違う接続元", "usual_geo／usual_asn との比較があるか", "平常値ルックアップを確認", true],
  ["60分の窓", "サインイン後60分以内の操作に限っているか", "streamstats の条件を確認", true],
  ["外部転送ルール", "scope=external の inbox_rule を数え、1件以上を条件にしているか", "count(eval(…)) に相当する条件を確認", false],
  ["例外（申請番号）", "request_id がある移行・保守作業を除外しているか", "isnull(request_id) に相当する条件を確認", false],
  ["最終検証", "ケースA/B/C/Dの期待結果を満たすか", "Splunkの実行結果と突き合わせる（S4）", null]
];
export const Q_ORDER = ["q1", "q2", "q3"];
export const Q_LABEL = { q1: "Q1 普段と違う接続元のサインイン", q2: "Q2 サインイン後60分の操作集計", q3: "Q3 D-02候補（転送ルール・閾値・例外）", q4a: "Q4a 範囲の確定", q4b: "Q4b 同じ接続元の他アカウント" };
export const Q_EXPECT = { q1: "3行（C 10/3、D 10/4、A 10/6）", q2: "D 2,000件（転送ルール1・申請あり）、A 1,200件（転送ルール1・送信380）、C 12件", q3: "Aだけが残る" };
export const CK = [["ck1", "① 時刻（サインイン〜最後の操作）"], ["ck2", "② 対象アカウント・接続元（国・ASN）"], ["ck3", "③ MFAの結果"], ["ck4", "④ 操作の範囲（転送ルール・ダウンロード・送信）"], ["ck5", "⑤ 本人・上長への確認（出張・利用の有無）"], ["ck6", "⑥ 入口の裏付け（フィッシングメールの特定）"], ["ck7", "⑦ 影響範囲（他アカウント・社外への送信）"]];
export const CK_FILL = { ck1: "done", ck2: "done", ck3: "done", ck4: "done", ck5: "done", ck6: "todo", ck7: "todo" };
export const REC = [
  ["r1", "事象", "2026年10月6日 02:14、アカウント s.tanaka が普段と違う国・ASN（198.51.100.77）からM365にサインイン（MFA済みのセッション）。02:18に外部への転送ルールを作成、02:25に営業部サイトから1,200件をダウンロード、02:41に社内380名へリンク付きメールを送信。"],
  ["r2", "確認済み", "時刻、対象アカウント・接続元、MFAの結果、操作の範囲（転送ルール・ダウンロード・送信）、本人・上長の回答（出張なし・深夜の利用なし）、同じ接続元から他アカウントへのサインインなし（Q4b）。封じ込め①〜③を実施。"],
  ["r3", "未確認", "ルール作成以降に外部へ転送されたメールの件数、ダウンロードしたファイルの中身（個人情報を含むか）、社内380名のうちリンクを開いた人、フィッシングメールの特定。"],
  ["r4", "対応", "セッション失効・転送ルールの無効化・パスワードリセット（即時）、アカウント停止（SOC責任者承認 APV-2026-1006-01）。社内380名への注意喚起を依頼。CSIRTへ記録を引き継ぎ。通知・報告の要否は法務・CSIRTの判断。"]
];
export function ckEmpty(c) { for (let i = 0; i < CK.length; i++) if (!c.vals[CK[i][0]]) return CK[i][0]; return null; }
export function recEmpty(c) { for (let i = 0; i < REC.length; i++) if (!(c.vals[REC[i][0]] || "").trim()) return REC[i][0]; return null; }
export const RESULTS = {
  before: { cols: ["user", "downloads"], rows: [["B", "it_admin01", "4,840"], ["D", "ext_mig02", "2,005"], ["A", "s.tanaka", "1,250"]], note: "BとDが混ざる：Bは申請済みのサイト移行、Dは申請済みの委託先の移行作業。件数だけでは、正当な業務と区別できない" },
  q0: { cols: ["total_events", "distinct_users", "distinct_srcs"], rows: [["", 39, 7, 10]] },
  q1: { cols: ["event_time", "user", "src", "geo", "asn", "mfa"], rows: [["C", "2026-10-03 11:05:12", "m.suzuki", "203.0.113.55", "国外2", "AS64501", "approved"], ["D", "2026-10-04 22:01:05", "ext_mig02", "203.0.113.9", "国外2", "AS64502", "approved"], ["A", "2026-10-06 02:14:10", "s.tanaka", "198.51.100.77", "国外1", "AS64500", "approved"]] },
  q2: { cols: ["user", "src", "downloads", "external_rules", "sent_mails", "request_id", "first_access", "last_access"], rows: [["D", "ext_mig02", "203.0.113.9", "2,000", 1, 0, "CHG-2026-1004", "2026-10-04 22:05:30", "2026-10-04 22:10:30"], ["A", "s.tanaka", "198.51.100.77", "1,200", 1, 380, "", "2026-10-06 02:18:05", "2026-10-06 02:41:12"], ["C", "m.suzuki", "203.0.113.55", "12", 0, 0, "", "2026-10-03 11:10:40", "2026-10-03 11:10:40"]] },
  q3: { cols: ["user", "src", "downloads", "external_rules", "sent_mails", "request_id", "first_access", "last_access"], rows: [["A", "s.tanaka", "198.51.100.77", "1,200", 1, 380, "", "2026-10-06 02:18:05", "2026-10-06 02:41:12"]] },
  ai1: { cols: ["user", "src", "downloads"], rows: [["D", "ext_mig02", "203.0.113.9", "2,000"], ["A", "s.tanaka", "198.51.100.77", "1,200"]], note: "Dが混ざる：申請済みの移行作業を除外していない。外部への転送ルールも見ていない" },
  q4a: { cols: ["action", "records", "target", "detail", "first_time"], rows: [["rule", "inbox_rule", "1", "mailbox", "外部ドメインへ転送・既読にして削除", "2026-10-06 02:18:05"], ["dl", "download", "1,200", "sharepoint:営業部", "社外秘 840／一般 360", "2026-10-06 02:25:40"], ["send", "send_mail", "380", "mailbox", "件名：請求書の確認のお願い（リンク付き）", "2026-10-06 02:41:12"]] },
  q4b: { cols: ["event_time", "user", "src", "action"], rows: [], note: "0件：同じ接続元から、他のアカウントへのサインインや操作はありません（この範囲では）。リンクを開いた社員のアカウントは未確認として記録します" }
};
export const RUN_TITLE = { before: "不十分な例（教材）：件数だけ", q0: "Q0 データ件数の確認", q1: REPORTS[0][1], q2: REPORTS[1][1], q3: REPORTS[2][1], ai1: "Assistant案（1回目）", q4a: REPORTS[3][1], q4b: REPORTS[4][1] };
export const SUMMARY = 10;
export const ROLE_LABEL = { soc: "SOC担当者", lead: "SOC責任者", csirt: "CSIRT責任者" };
export const JOURNEY = [
  [1, "現場の問題", "S0 2:00", "lead"], [2, "Before", "S1 3:00", "soc"], [3, "要件整理", "S2 4:00", "soc"], [4, "相関検索・照合", "S3 5:00", "soc"],
  [5, "検証・保存", "S4 5:00", "soc"], [6, "一次対応", "S5 5:00", "soc"], [7, "封じ込め", "S6 4:00", "soc"], [8, "範囲確定・記録", "S7 5:00", "soc"], [9, "改善", "S8 3:00", "soc"], [10, "振り返り", "まとめ", ""]
];
/* ES・UEBA・SOAR の画面イメージ用（架空） */
export const NOTABLES = {
  ueba: { id: "n-ueba", time: "2026-10-06 02:20:31", domain: "Identity", title: "UEBA: Anomalous sign-in and mailbox rule by s.tanaka", urgency: "中", status: "新規", owner: "未割当", risk: 85 },
  d02: { id: "n-d02", time: "2026-10-06 02:45:02", domain: "Identity", title: "SOC_M365_乗っ取り_D-02: s.tanaka from 198.51.100.77", urgency: "高", status: "新規", owner: "未割当", risk: 165 }
};
export const ANOMALIES = [["02:14:10", "普段と違う国からのサインイン（30日の平常値：国内のみ）", 30], ["02:14:10", "普段と違う時間帯（平常：9〜18時）", 15], ["02:18:05", "外部への転送ルールの作成（このアカウントでは初めて）", 20], ["02:25:40", "ダウンロード量が平常の60倍超（平常：1日約20件）", 20]];
export const RISK_EVENTS = [["02:20:31", "UEBA 異常スコア（上の4件の合計）", 85], ["02:45:02", "相関検索 SOC_M365_乗っ取り_D-02（15分ごと）", 80]];
export const PLAYBOOK = { name: "M365_乗っ取り_封じ込め v1.2", steps: [["①", "サインインセッションの失効（Entra ID）", "SOC担当者の判断で即時", "soc"], ["②", "転送ルールの無効化、パスワードリセット、MFA再登録", "SOC担当者の判断で即時", "soc"], ["③", "アカウントの一時停止（Entra ID）", "SOC責任者の承認", "lead"], ["④", "テナント全体の外部自動転送の禁止", "CSIRT責任者の承認", "csirt"]] };
export const APPROVAL_TICKET = "APV-2026-1006-01";
export const EXCEPT_ACCOUNTS = ["it_admin01", "exec_*"];
