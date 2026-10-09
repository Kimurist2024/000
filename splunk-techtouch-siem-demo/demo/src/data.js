// デモのデータ（すべて架空。data/demo_auth_events.csv と同じ値）
export const CASES = [
  { id: "A", src: "198.51.100.24", fails: 36, users: 9, admin: "admin_ops", adminAt: "2026-10-08 09:10:00", note: "同一管理者 admin_ops が失敗の後に成功", verdict: "高優先度の調査候補" },
  { id: "B", src: "203.0.113.40", fails: 18, users: 1, admin: "", note: "svc_batch 1アカウントに集中", verdict: "多数アカウントへの試行ではない" },
  { id: "C", src: "192.0.2.51", fails: 12, users: 6, admin: "admin_fin", adminAt: "2026-10-08 09:00:05", note: "管理者 admin_fin の成功は失敗より前", verdict: "「失敗後の成功」ではない" },
  { id: "D", src: "203.0.113.20", fails: 4, users: 3, admin: "", note: "閾値未満", verdict: "記録のみ" }
];
export const Q4_ROWS = [["2026-10-08 09:00", 25, 1], ["2026-10-08 09:05", 42, 0], ["2026-10-08 09:10", 3, 1]];
export const SPL = {
  before: '| inputlookup demo_auth_events.csv\n| stats count(eval(action="failure")) AS failures count(eval(action="success" AND privileged="true")) AS admin_successes BY src\n| where failures >= 10 AND admin_successes >= 1',
  q0: '| inputlookup demo_auth_events.csv\n| stats count AS total_events dc(src) AS distinct_srcs dc(user) AS distinct_users',
  q1: '| inputlookup demo_auth_events.csv\n| where action="failure"\n| stats count AS fail_count dc(user) AS failed_users BY src\n| sort - fail_count',
  q2: '| inputlookup demo_auth_events.csv\n| eval epoch=strptime(event_time,"%Y-%m-%d %H:%M:%S")\n| where epoch>=strptime("2026-10-08 09:00:00","%Y-%m-%d %H:%M:%S") AND epoch<strptime("2026-10-08 09:15:00","%Y-%m-%d %H:%M:%S")\n| where action="failure"\n| stats count AS fail_count dc(user) AS failed_users BY src\n| where fail_count>=10 AND failed_users>=5\n| sort - fail_count',
  q3: '| inputlookup demo_auth_events.csv\n| eval epoch=strptime(event_time,"%Y-%m-%d %H:%M:%S")\n| where epoch>=strptime("2026-10-08 09:00:00","%Y-%m-%d %H:%M:%S") AND epoch<strptime("2026-10-08 09:15:00","%Y-%m-%d %H:%M:%S")\n| eval fail_mark=if(action="failure",1,0), failed_user=if(action="failure",user,null())\n| eventstats sum(fail_mark) AS src_fail_count dc(failed_user) AS src_failed_users BY src\n| sort 0 src user epoch\n| streamstats sum(fail_mark) AS prior_user_failures BY src user\n| where action="success" AND privileged="true" AND prior_user_failures>=1 AND src_fail_count>=10 AND src_failed_users>=5\n| table src user event_time src_fail_count src_failed_users mfa',
  q4: '| inputlookup demo_auth_events.csv\n| eval _time=strptime(event_time,"%Y-%m-%d %H:%M:%S")\n| timechart span=5m count(eval(action="failure")) AS failures count(eval(action="success")) AS successes',
  ai1: '| inputlookup demo_auth_events.csv\n| stats count(eval(action="failure")) AS fail_count dc(eval(if(action="failure",user,null()))) AS failed_users count(eval(action="success" AND privileged="true")) AS admin_success BY src\n| where fail_count>=10 AND failed_users>=5 AND admin_success>=1'
};
export const SPL_Q5 = '（本番用の骨格。実行しない）\nindex=<認証ログのインデックス> sourcetype=<VPN認証のsourcetype> earliest=-15m\n| eval src=<接続元IPのフィールド>, user=<アカウントのフィールド>, action=<結果のフィールド>, privileged=<特権判定>\n| … Q3と同じ eventstats／sort／streamstats の判定 …';
export const REPORTS = [
  ["q1", "SOC_認証_Q1_IP別失敗ランキング", "接続元IP別の認証失敗件数と、失敗した異なるユーザー数", "v1.0"],
  ["q2", "SOC_認証_Q2_閾値候補", "15分で失敗10件以上・異なる5ユーザー以上の接続元", "v1.0"],
  ["q3", "SOC_認証_Q3_失敗後の特権成功", "同じ接続元・同じ特権アカウントで、失敗の後に成功", "v1.1（承認待ち）"],
  ["q4", "SOC_認証_Q4_5分推移", "5分単位の失敗・成功の推移", "v1.0"]
];
export const REQUEST_IN = "VPNの認証失敗と管理者ログイン成功を関連付けて、監視ダッシュボードにしたい。SOC基準に沿って、Splunk AI Assistantへの依頼を整えてください。";
export const REQUEST_OUT = "以下のCSVルックアップに対してSPLを作成してください。event_timeは %Y-%m-%d %H:%M:%S、srcが接続元IP、userがアカウント、actionはfailure／success、privilegedは文字列true／falseです。15分間に同一srcで失敗10件以上、かつ異なる失敗userが5以上あることに加え、同じsrc・同じ管理者userに対して、失敗の後で成功したイベントだけを抽出してください。成功が失敗より前のケースは除外してください。必要に応じてeventstats・sort・streamstatsなどを使い、処理を説明してください。";
export const FIX_REQUEST = "先ほどのSPLに、次の2つの条件を追加してください。(1) 成功した管理者アカウント本人に、同じ接続元からの失敗があること（src と user の単位で判定）。(2) その失敗が成功より前に起きていること（時刻順。eventstats・sort・streamstats を使ってよい）。あわせて、対象を 2026-10-08 09:00〜09:15 の15分間に限定してください。";
export const EXTRA_REQ = "接続元 198.51.100.24 と、アカウント admin_ops について、2026-10-08 09:10:00 以降の操作履歴（VPNセッション、アクセス先、権限変更）を、時間順に一覧する検索を作ってください。対象のインデックスとsourcetypeは <社内の名称> です。";
export const NAME_RULE = /^[^_\s]+_[^_\s]+_[^_\s]+$/;
export const TIPS = {
  std: ["A社の検知基準 D-01（社内・架空）", "15分間に同一の接続元から失敗10件以上、かつ失敗した異なるアカウントが5以上。加えて、同じ特権アカウントで失敗の後に成功があれば「高優先度の調査候補」。侵害の成立は推定しません。"],
  sched: ["アラートの実行間隔（社内基準・架空）", "定期実行の15分ごとにします。リアルタイム検索は使いません（Splunkも定期実行を勧めています）。Splunk Cloudではスケジュールの時刻がUTCになる点に注意します。"],
  disp: ["判定区分の定義（社内・架空）", "誤検知＝検知条件は満たすが脅威ではない／正当な利用＝本人の操作と確認できた／要対応＝インシデントとして対応する。本人確認が済むまでは「候補」のままにします。"],
  kpi: ["ダッシュボードの数値の読み方（社内・架空）", "認証失敗は件数だけでなく、失敗した異なるアカウント数と、同じ特権アカウントの失敗後の成功を見ます。件数だけで判断しません。"]
};
export const GOALS = ["①認証分析用SPL（Q1〜Q4）", "②監視ダッシュボード", "③検知条件と保存検索（設計）", "④一次調査の根拠と記録", "⑤変更・改善ナレッジ"];
export const REQ_WORDS = ["15分", "10件以上", "異なる失敗user", "同じsrc・同じ管理者user", "失敗の後で成功"];
export const CHECK_ROWS = [
  ["ログ辞書", "src、user、action、privileged を使っているか", "実際の列名を確認", true],
  ["ユーザー数", "失敗10件だけでなく、異なる5アカウント以上か", "dc(user) に相当する条件を確認", true],
  ["同一ユーザー", "管理者の失敗と成功が同一アカウントか", "src、user 単位の判定を確認", false],
  ["前後関係", "管理者の成功が失敗より後か", "時刻順の判定（streamstats など）を確認", false],
  ["最終検証", "ケースA/B/C/Dの期待結果を満たすか", "Splunkの実行結果と突き合わせる（S4）", null]
];
export const Q_ORDER = ["q1", "q2", "q3", "q4"];
export const Q_LABEL = { q1: "Q1 IP別の失敗ランキング", q2: "Q2 閾値候補", q3: "Q3 失敗後の特権成功", q4: "Q4 5分推移" };
export const Q_EXPECT = { q1: "A=36件/9人、B=18件/1人、C=12件/6人、D=4件/3人", q2: "AとCが残る（15分・10件以上・異なる5ユーザー以上）", q3: "Aだけが残る（同一管理者・失敗後の成功）", q4: "09:00 失敗25・成功1／09:05 失敗42・成功0／09:10 失敗3・成功1" };
export const VIZ_LABEL = { bar: "棒グラフ", table: "表", line: "折れ線グラフ", single: "単一値" };
export const CK = [["ck1", "① 時刻（検知条件・対象時刻）"], ["ck2", "② 対象（アカウント・接続元）"], ["ck3", "③ MFAの結果"], ["ck4", "④ 正規アクセスか（本人確認）"], ["ck5", "⑤ 影響範囲（成功後の操作）"], ["ck6", "⑥ 根拠の記録・引き継ぎ"]];
export const CK_FILL = { ck1: "done", ck2: "done", ck3: "done", ck4: "todo", ck5: "todo", ck6: "done" };
export const REC = [["r1", "事象", "2026年10月8日、接続元 198.51.100.24 から複数ユーザーへの認証失敗36件（9ユーザー）。対象に含まれる特権アカウント admin_ops で、その後の認証成功（09:10:00、MFA approved）を確認。"],
  ["r2", "確認済み", "件数、接続元、対象ユーザー、時刻の順序、MFAの結果。"],
  ["r3", "追加確認", "接続元の正規性、本人利用、成功後の操作。"],
  ["r4", "対応", "SOC上位者へ優先的な追加調査を依頼。"]];
export function ckEmpty(c) { for (let i = 0; i < CK.length; i++) if (!c.vals[CK[i][0]]) return CK[i][0]; return null; }
export function recEmpty(c) { for (let i = 0; i < REC.length; i++) if (!(c.vals[REC[i][0]] || "").trim()) return REC[i][0]; return null; }
export const RESULTS = {
  before: { cols: ["src", "failures", "admin_successes"], rows: [["A", "198.51.100.24", 36, 1], ["C", "192.0.2.51", 12, 1]], note: "Cが混ざる：成功が失敗より前でも、同じ接続元IPなら一致する" },
  q0: { cols: ["total_events", "distinct_srcs", "distinct_users"], rows: [["", 72, 4, 19]] },
  q1: { cols: ["src", "fail_count", "failed_users"], rows: CASES.map((k) => [k.id, k.src, k.fails, k.users]) },
  q2: { cols: ["src", "fail_count", "failed_users"], rows: [["A", "198.51.100.24", 36, 9], ["C", "192.0.2.51", 12, 6]] },
  q3: { cols: ["src", "user", "event_time", "src_fail_count", "src_failed_users", "mfa"], rows: [["A", "198.51.100.24", "admin_ops", "2026-10-08 09:10:00", 36, 9, "approved"]] },
  q4: { cols: ["_time", "failures", "successes"], rows: Q4_ROWS.map((r) => ["", r[0], r[1], r[2]]) }
};
export const RUN_TITLE = { before: "不十分な例（教材）", q0: "Q0 データ件数の確認", q1: REPORTS[0][1], q2: REPORTS[1][1], q3: REPORTS[2][1], q4: REPORTS[3][1] };
export const SUMMARY = 10;
export const ROLE_LABEL = { soc: "SOC担当者", lead: "SOC責任者" };
export const JOURNEY = [
  [1, "現場の問題", "S0 2:00", "lead"], [2, "Before", "S1 3:00", "soc"], [3, "要件整理", "S2 4:00", "soc"], [4, "SPL生成・確認", "S3 5:00", "soc"],
  [5, "データ検証", "S4 5:00", "soc"], [6, "可視化", "S5 6:00", "soc"], [7, "検知", "S6 4:00", "soc"], [8, "一次調査", "S7 5:00", "soc"], [9, "記録・改善", "S8 3:00", "soc"], [10, "振り返り", "まとめ", ""]
];
