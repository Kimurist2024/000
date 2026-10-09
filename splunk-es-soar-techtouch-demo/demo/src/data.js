// デモのデータ（すべて架空。data/demo_hr_audit.csv ほかと同じ値。社名・実在の事案の数値は使わない）
export const CASES = [
  { id: "A", user: "hr_ops03", src: "198.51.100.77", geo: "国外1 / AS64500", when: "2026-10-06 02:14:10", records: 88420, retired: 55980, req: "（なし）",
    note: "深夜、普段と違う国・ASNからサインイン（MFAは通過）。60分以内に在籍・退職者を88,420件参照・エクスポート。申請なし", verdict: "ノータブル（要対応の候補）" },
  { id: "B", user: "hr_admin01", src: "192.0.2.30", geo: "国内 / AS64496", when: "2026-10-01 09:31:00", records: 48900, retired: 0, req: "HR-2026-1001",
    note: "人事異動の一斉処理（申請済み）。接続元は平常。件数だけを見ると混ざる", verdict: "検知しない（平常の接続元・申請済み）" },
  { id: "C", user: "hr_ops11", src: "203.0.113.55", geo: "国外2 / AS64501", when: "2026-10-03 11:05:12", records: 12, retired: 0, req: "（なし）",
    note: "出張先からのサインイン。参照は12件", verdict: "閾値未満。記録のみ" },
  { id: "D", user: "vendor_mnt02", src: "203.0.113.9", geo: "国外2 / AS64502", when: "2026-10-04 22:01:05", records: 2000, retired: 2000, req: "MNT-2026-1004",
    note: "委託先の保守（申請済み）。退職者2,000件をエクスポート", verdict: "例外（申請済み）。ただし退職者データの持ち出しは別途記録" }
];
const Q2_BODY = '| inputlookup demo_hr_audit.csv\n| eval epoch=strptime(event_time,"%Y-%m-%d %H:%M:%S"), request_id=if(request_id="",null(),request_id)\n| lookup demo_hr_baseline.csv user OUTPUT usual_geo usual_asn\n| sort 0 user epoch\n| eval odd_signin=if(action="signin" AND (geo!=usual_geo OR asn!=usual_asn), epoch, null())\n| streamstats latest(odd_signin) AS last_odd BY user\n| where action IN ("view","export") AND isnotnull(last_odd) AND epoch-last_odd<=3600\n| stats sum(record_count) AS records sum(eval(if(scope="retired",record_count,0))) AS retired_records values(request_id) AS request_id min(event_time) AS first_access max(event_time) AS last_access BY user src';
export const SPL = {
  before: '| inputlookup demo_hr_audit.csv\n| where action IN ("view","export")\n| stats sum(record_count) AS records BY user\n| where records>=1000\n| sort - records',
  q0: '| inputlookup demo_hr_audit.csv\n| stats count AS total_events dc(user) AS distinct_users dc(src) AS distinct_srcs',
  q1: '| inputlookup demo_hr_audit.csv\n| where action="signin"\n| lookup demo_hr_baseline.csv user OUTPUT usual_geo usual_asn\n| where geo!=usual_geo OR asn!=usual_asn\n| table event_time user src geo asn mfa\n| sort event_time',
  q2: Q2_BODY + "\n| sort - records",
  q3: Q2_BODY + "\n| where records>=1000 AND retired_records>0 AND isnull(request_id)",
  q4a: '| inputlookup demo_hr_audit.csv\n| where user="hr_ops03" AND src="198.51.100.77" AND action="export"\n| stats sum(record_count) AS records values(fields) AS fields min(event_time) AS first_export max(event_time) AS last_export BY dataset\n| addcoltotals labelfield=dataset label="合計" records',
  q4b: '| inputlookup demo_cust_audit.csv\n| where user="hr_ops03" OR src="198.51.100.77"\n| table event_time user src system action record_count',
  ai1: '| inputlookup demo_hr_audit.csv\n| eval epoch=strptime(event_time,"%Y-%m-%d %H:%M:%S")\n| lookup demo_hr_baseline.csv user OUTPUT usual_geo usual_asn\n| sort 0 user epoch\n| eval odd_signin=if(action="signin" AND (geo!=usual_geo OR asn!=usual_asn), epoch, null())\n| streamstats latest(odd_signin) AS last_odd BY user\n| where action IN ("view","export") AND isnotnull(last_odd) AND epoch-last_odd<=3600\n| stats sum(record_count) AS records BY user src\n| where records>=1000'
};
export const SPL_Q5 = "（本番用の骨格。実行しない）\nindex=<人事システム監査ログのインデックス> sourcetype=<人事システムのsourcetype> earliest=-24h\n| lookup <利用者平常値のルックアップ> user OUTPUT usual_geo usual_asn\n| sort 0 user _time\n| eval odd_signin=if(action=\"signin\" AND (geo!=usual_geo OR asn!=usual_asn), _time, null())\n| streamstats latest(odd_signin) AS last_odd BY user\n| where action IN (\"view\",\"export\") AND isnotnull(last_odd) AND _time-last_odd<=3600\n| stats sum(record_count) AS records sum(eval(if(scope=\"retired\",record_count,0))) AS retired_records values(request_id) AS request_id BY user src\n| where records>=1000 AND retired_records>0 AND isnull(request_id)";
export const REPORTS = [
  ["q1", "SOC_人事_Q1_普段と違う接続元のサインイン", "利用者の平常値（国・ASN）と違うサインイン", "v1.0"],
  ["q2", "SOC_人事_Q2_サインイン後60分の参照集計", "普段と違うサインインの後60分以内の参照・エクスポート（件数・退職者・申請番号）", "v1.0"],
  ["q3", "SOC_人事_Q3_D-02候補", "1,000件以上・退職者を含む・申請なし（検知基準 D-02）", "v1.1（承認待ち）"],
  ["q4a", "SOC_人事_Q4a_範囲の確定", "対象アカウント・接続元のエクスポートを、データセット別に件数と項目で確定", "v1.0"],
  ["q4b", "SOC_人事_Q4b_顧客系システムの確認", "同じアカウント・接続元で、顧客系システムの監査ログにアクセスがあるか", "v1.0"]
];
export const REQUEST_IN = "人事システムに、普段と違う場所からサインインした後、退職者を含む大量の参照やエクスポートがあったら、ESのノータブルにしたい。社内基準D-02に沿って、Splunk AI Assistantへの依頼を整えてください。";
export const REQUEST_OUT = "以下の2つのCSVルックアップに対してSPLを作成してください。demo_hr_audit.csv：event_time は %Y-%m-%d %H:%M:%S、user がアカウント、src が接続元IP、geo が国、asn がASN、action は signin／view／export／signout、record_count が件数、scope は current（在籍）／retired（退職者）、request_id は申請番号（空なら申請なし）。demo_hr_baseline.csv：user ごとの usual_geo、usual_asn。条件：(1) signin の geo または asn が平常値と違うものを「普段と違うサインイン」とする。(2) その後60分以内の同じ user の view／export を user と src で集計し、record_count の合計（records）、scope=retired の合計（retired_records）、request_id の値、最初と最後の時刻を出す。(3) records が1,000件以上、retired_records が1件以上、request_id が空のものだけを残す。";
export const FIX_REQUEST = "先ほどのSPLに、次の2つを追加してください。(1) scope が retired の record_count の合計を retired_records として出し、1件以上であることを条件にする。(2) request_id が空のものを null にしたうえで values(request_id) を出し、null のものだけを残す（申請済みの一斉処理・保守作業を除外）。あわせて min(event_time)・max(event_time) を first_access・last_access として出してください。";
export const SCOPE_REQ = "アカウント hr_ops03 と接続元 198.51.100.77 について、(1) demo_hr_audit.csv の export を dataset 別に record_count の合計と fields、最初と最後の時刻で集計し、合計行を付けてください。(2) demo_cust_audit.csv で、同じ user または src のアクセスがあるかを table で出してください。";
export const HR_ASK = "【人事部への確認（AI Hubの例文）】10月6日 02:14〜02:51 に、アカウント hr_ops03 で在籍・退職者データのエクスポート（計86,420件）が行われています。この時間帯に申請済みの一斉処理・保守作業はありますか。該当する申請番号があれば教えてください。本人への確認もお願いします。";
export const HR_REPLY = "該当する申請はありません。10月1日付の人事異動の一斉処理（HR-2026-1001）は10月1日に完了しています。hr_ops03 の本人には現在確認中です（本日 09:03 に国内から通常どおりサインインしています）。";
export const NAME_RULE = /^[^_\s]+(_[^_\s]+){2,}$/;
export const TIPS = {
  std: ["A社の検知基準 D-02（社内・架空）", "普段と違う接続元（国・ASN）からのサインインの後60分以内に、同じアカウントが人事システムで1,000件以上を参照・エクスポートし、退職者データを含む。申請番号のある一斉処理・保守作業は除外。リスクスコア80、ノータブルの緊急度は「高」。"],
  auth: ["封じ込めの承認段階 KB06（社内・架空）", "①セッション失効と②パスワードリセット・MFA再登録は、SOC担当者の判断で即時。③アカウント停止はSOC責任者の承認。④人事システムの外部接続遮断はCSIRT責任者の承認。例外アカウント（役員・人事部管理者）は③以降を必ず責任者に確認。"],
  disp: ["判定区分の定義（社内・架空）", "誤検知＝条件は満たすが脅威ではない／正当な利用＝本人の業務と確認できた（申請番号あり）／要対応＝インシデントとして対応する。本人確認と人事部の業務確認がそろうまでは「要対応（暫定）」。"],
  report: ["通知・報告の判断材料 KB07（社内・架空）", "対象者数・項目・顧客情報への影響・二次被害の有無・封じ込めの状態を、確認済みと未確認に分けて記録する。監督官庁への報告と公表の要否は、法務とCSIRTがこの記録をもとに判断する（SOCは判断しない）。"]
};
export const GOALS = ["①社内基準D-02の相関検索（ESのノータブルとリスク）", "②一次対応チェックリストと、人事部への業務確認", "③封じ込めの承認段階（SOARプレイブックの入力）", "④範囲の確定（件数・項目・顧客系の確認）と記録", "⑤ナレッジと、委託先との役割分担"];
export const REQ_WORDS = ["普段と違う接続元（国・ASN）", "60分以内", "1,000件以上", "退職者（scope=retired）を含む", "申請番号（request_id）があれば除外"];
export const CHECK_ROWS = [
  ["ログ辞書", "user、src、geo、asn、action、record_count、scope、request_id を使っているか", "実際の列名を確認", true],
  ["普段と違う接続元", "usual_geo／usual_asn との比較があるか", "平常値ルックアップを確認", true],
  ["60分の窓", "サインイン後60分以内の参照・エクスポートに限っているか", "streamstats の条件を確認", true],
  ["退職者区分", "scope=retired の件数を数え、1件以上を条件にしているか", "sum(eval(…)) に相当する条件を確認", false],
  ["例外（申請番号）", "request_id がある一斉処理・保守作業を除外しているか", "isnull(request_id) に相当する条件を確認", false],
  ["最終検証", "ケースA/B/C/Dの期待結果を満たすか", "Splunkの実行結果と突き合わせる（S4）", null]
];
export const Q_ORDER = ["q1", "q2", "q3"];
export const Q_LABEL = { q1: "Q1 普段と違う接続元のサインイン", q2: "Q2 サインイン後60分の参照集計", q3: "Q3 D-02候補（閾値・退職者・例外）", q4a: "Q4a 範囲の確定", q4b: "Q4b 顧客系システムの確認" };
export const Q_EXPECT = { q1: "3行（C 10/3、D 10/4、A 10/6）", q2: "A 88,420件（退職者55,980）、C 12件、D 2,000件（申請あり）", q3: "Aだけが残る" };
export const CK = [["ck1", "① 時刻（サインイン〜最後のエクスポート）"], ["ck2", "② 対象アカウント・接続元（国・ASN）"], ["ck3", "③ MFAの結果"], ["ck4", "④ 参照範囲（件数・退職者区分）"], ["ck5", "⑤ 人事部の業務確認（申請の有無）"], ["ck6", "⑥ 本人確認（本人の操作か）"], ["ck7", "⑦ 影響範囲（顧客情報・他システム）"]];
export const CK_FILL = { ck1: "done", ck2: "done", ck3: "done", ck4: "done", ck5: "done", ck6: "todo", ck7: "todo" };
export const REC = [
  ["r1", "事象", "2026年10月6日 02:14、アカウント hr_ops03 が普段と違う国・ASN（198.51.100.77）から人事システムにサインイン（MFA通過）。02:23と02:37に在籍31,240件・退職者55,180件（計86,420件、7項目）をエクスポート。"],
  ["r2", "確認済み", "時刻、対象アカウント・接続元、MFAの結果、参照範囲（件数・項目・退職者区分）、人事部の業務確認（該当する申請なし）、顧客系システムに同じアカウント・接続元のアクセスなし（Q4b）。封じ込め①〜③を実施。"],
  ["r3", "未確認", "本人の操作か（本人は同日09:03に国内から平常どおり利用）、認証情報の入手経路、他システム・他アカウントへの横展開、二次被害。"],
  ["r4", "対応", "セッション失効・パスワードリセット（即時）、アカウント停止（SOC責任者承認 APV-2026-1006-01）。CSIRTへ範囲確定の記録を引き継ぎ。通知・報告の要否は法務・CSIRTの判断。"]
];
export function ckEmpty(c) { for (let i = 0; i < CK.length; i++) if (!c.vals[CK[i][0]]) return CK[i][0]; return null; }
export function recEmpty(c) { for (let i = 0; i < REC.length; i++) if (!(c.vals[REC[i][0]] || "").trim()) return REC[i][0]; return null; }
const F7 = "emp_no,name,address,phone,dept,title,manager";
export const RESULTS = {
  before: { cols: ["user", "records"], rows: [["A", "hr_ops03", "88,542"], ["B", "hr_admin01", "48,960"], ["D", "vendor_mnt02", "2,005"]], note: "BとDが混ざる：Bは申請済みの一斉処理、Dは申請済みの保守。件数だけでは、正当な業務と区別できない" },
  q0: { cols: ["total_events", "distinct_users", "distinct_srcs"], rows: [["", 46, 7, 10]] },
  q1: { cols: ["event_time", "user", "src", "geo", "asn", "mfa"], rows: [["C", "2026-10-03 11:05:12", "hr_ops11", "203.0.113.55", "国外2", "AS64501", "approved"], ["D", "2026-10-04 22:01:05", "vendor_mnt02", "203.0.113.9", "国外2", "AS64502", "approved"], ["A", "2026-10-06 02:14:10", "hr_ops03", "198.51.100.77", "国外1", "AS64500", "approved"]] },
  q2: { cols: ["user", "src", "records", "retired_records", "request_id", "first_access", "last_access"], rows: [["A", "hr_ops03", "198.51.100.77", "88,420", "55,980", "", "2026-10-06 02:18:05", "2026-10-06 02:37:55"], ["D", "vendor_mnt02", "203.0.113.9", "2,000", "2,000", "MNT-2026-1004", "2026-10-04 22:10:30", "2026-10-04 22:10:30"], ["C", "hr_ops11", "203.0.113.55", "12", "0", "", "2026-10-03 11:10:40", "2026-10-03 11:10:40"]] },
  q3: { cols: ["user", "src", "records", "retired_records", "request_id", "first_access", "last_access"], rows: [["A", "hr_ops03", "198.51.100.77", "88,420", "55,980", "", "2026-10-06 02:18:05", "2026-10-06 02:37:55"]] },
  ai1: { cols: ["user", "src", "records"], rows: [["A", "hr_ops03", "198.51.100.77", "88,420"], ["D", "vendor_mnt02", "203.0.113.9", "2,000"]], note: "Dが混ざる：申請済みの保守作業を除外していない。退職者の区分も見ていない" },
  q4a: { cols: ["dataset", "records", "fields", "first_export", "last_export"], rows: [["emp", "employee_master", "31,240", F7, "2026-10-06 02:23:40", "2026-10-06 02:23:40"], ["ret", "retiree_master", "55,180", F7, "2026-10-06 02:37:55", "2026-10-06 02:37:55"], ["total", "合計", "86,420", "", "", ""]] },
  q4b: { cols: ["event_time", "user", "src", "system", "action", "record_count"], rows: [], note: "0件：顧客系システムの監査ログに、同じアカウント・接続元のアクセスはありません（この範囲では）。他の経路は未確認として記録します" }
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
  ueba: { id: "n-ueba", time: "2026-10-06 02:20:31", domain: "Access", title: "UEBA: Anomalous data access by hr_ops03", urgency: "中", status: "新規", owner: "未割当", risk: 85 },
  d02: { id: "n-d02", time: "2026-10-06 02:45:02", domain: "Access", title: "SOC_人事_異常参照_D-02: hr_ops03 from 198.51.100.77", urgency: "高", status: "新規", owner: "未割当", risk: 165 }
};
export const ANOMALIES = [["02:14:10", "普段と違う国からのサインイン（30日の平常値：国内のみ）", 30], ["02:14:10", "普段と違う時間帯（平常：9〜18時）", 15], ["02:18〜02:37", "データ参照量が平常の40倍超（平常：1日約30件）", 40]];
export const RISK_EVENTS = [["02:20:31", "UEBA 異常スコア（上の3件の合計）", 85], ["02:45:02", "相関検索 SOC_人事_異常参照_D-02（15分ごと）", 80]];
export const PLAYBOOK = { name: "HR_異常参照_封じ込め v1.2", steps: [["①", "セッション失効（人事システム）", "SOC担当者の判断で即時", "soc"], ["②", "パスワードリセットとMFA再登録", "SOC担当者の判断で即時", "soc"], ["③", "アカウント停止（人事システム・IdP）", "SOC責任者の承認", "lead"], ["④", "人事システムの外部接続遮断", "CSIRT責任者の承認", "csirt"]] };
export const APPROVAL_TICKET = "APV-2026-1006-01";
export const EXCEPT_ACCOUNTS = ["hr_admin01", "exec_*"];
