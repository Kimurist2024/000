#!/usr/bin/env python3
"""架空A社の人事システム監査ログ（demo_hr_audit.csv）、利用者の平常値（demo_hr_baseline.csv）、
顧客系システムの監査ログ（demo_cust_audit.csv）を決め打ちで書き出す。すべて架空。IPはRFC 5737、ASNはRFC 5398の文書用番号。"""
import csv, os, sys
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
os.makedirs(out, exist_ok=True)
F = "emp_no,name,address,phone,dept,title,manager"
JP, AS_JP = "国内", "AS64496"
rows = []
def ev(t, user, src, geo, asn, action, mfa="not_applicable", dataset="", n="", scope="", fields="", req=""):
    rows.append([t, user, src, geo, asn, action, mfa, dataset, n, scope, fields, req])
def day(user, src, d, t_in, views):
    ev(f"{d} {t_in}", user, src, JP, AS_JP, "signin", "approved")
    for (tt, n) in views: ev(f"{d} {tt}", user, src, JP, AS_JP, "view", "not_applicable", "employee_master", n, "current")
# 平常の利用（国内・少量）
day("hr_ops03", "192.0.2.21", "2026-10-01", "09:02:11", [("09:10:40", 24), ("09:41:05", 18)])
day("hr_ops03", "192.0.2.21", "2026-10-02", "09:05:30", [("09:22:10", 31)])
day("hr_ops03", "192.0.2.21", "2026-10-05", "09:01:02", [("09:35:44", 27)])
day("hr_ops05", "192.0.2.22", "2026-10-01", "08:58:20", [("09:15:00", 40), ("13:05:10", 12)])
day("hr_ops05", "192.0.2.22", "2026-10-02", "08:57:49", [("10:02:33", 55)])
day("hr_ops05", "192.0.2.22", "2026-10-06", "08:59:10", [("09:20:00", 33)])
day("hr_ops08", "192.0.2.23", "2026-10-02", "09:12:00", [("09:30:12", 9), ("15:40:00", 21)])
day("hr_ops08", "192.0.2.23", "2026-10-05", "09:08:45", [("11:11:11", 14)])
day("payroll02", "192.0.2.24", "2026-10-01", "09:00:00", [("09:05:00", 120)])
day("payroll02", "192.0.2.24", "2026-10-05", "09:03:00", [("09:40:00", 130)])
day("hr_ops11", "192.0.2.25", "2026-10-01", "09:04:00", [("09:50:00", 17)])
day("hr_admin01", "192.0.2.30", "2026-10-02", "09:20:00", [("09:25:00", 60)])
day("vendor_mnt02", "192.0.2.40", "2026-10-02", "13:00:00", [("13:20:00", 5)])
# ケースB：人事異動の一斉処理（申請済み・国内・平常の接続元）→ 件数だけ見ると混ざる
ev("2026-10-01 09:31:00", "hr_admin01", "192.0.2.30", JP, AS_JP, "signin", "approved")
ev("2026-10-01 09:45:20", "hr_admin01", "192.0.2.30", JP, AS_JP, "export", "not_applicable", "employee_master", 48900, "current", F, "HR-2026-1001")
ev("2026-10-01 10:20:00", "hr_admin01", "192.0.2.30", JP, AS_JP, "signout")
# ケースC：出張先（普段と違う接続元）からのサインイン、参照は12件
ev("2026-10-03 11:05:12", "hr_ops11", "203.0.113.55", "国外2", "AS64501", "signin", "approved")
ev("2026-10-03 11:10:40", "hr_ops11", "203.0.113.55", "国外2", "AS64501", "view", "not_applicable", "employee_master", 12, "current")
ev("2026-10-03 11:30:00", "hr_ops11", "203.0.113.55", "国外2", "AS64501", "signout")
# ケースD：委託先の保守（申請済み）。普段と違う拠点から退職者データ2,000件をエクスポート
ev("2026-10-04 22:01:05", "vendor_mnt02", "203.0.113.9", "国外2", "AS64502", "signin", "approved")
ev("2026-10-04 22:10:30", "vendor_mnt02", "203.0.113.9", "国外2", "AS64502", "export", "not_applicable", "retiree_master", 2000, "retired", F, "MNT-2026-1004")
ev("2026-10-04 22:40:00", "vendor_mnt02", "203.0.113.9", "国外2", "AS64502", "signout")
# ケースA：深夜、普段と違う国・ASNからのサインイン（MFAは通過）→ 在籍・退職者の大量エクスポート
ev("2026-10-06 02:14:10", "hr_ops03", "198.51.100.77", "国外1", "AS64500", "signin", "approved")
ev("2026-10-06 02:18:05", "hr_ops03", "198.51.100.77", "国外1", "AS64500", "view", "not_applicable", "employee_master", 1200, "current")
ev("2026-10-06 02:23:40", "hr_ops03", "198.51.100.77", "国外1", "AS64500", "export", "not_applicable", "employee_master", 31240, "current", F)
ev("2026-10-06 02:31:12", "hr_ops03", "198.51.100.77", "国外1", "AS64500", "view", "not_applicable", "retiree_master", 800, "retired")
ev("2026-10-06 02:37:55", "hr_ops03", "198.51.100.77", "国外1", "AS64500", "export", "not_applicable", "retiree_master", 55180, "retired", F)
ev("2026-10-06 02:51:03", "hr_ops03", "198.51.100.77", "国外1", "AS64500", "signout")
# 同日朝、本人は平常どおり国内から利用（アカウントの乗っ取りを疑う材料。断定はしない）
day("hr_ops03", "192.0.2.21", "2026-10-06", "09:03:15", [("09:12:50", 22)])
rows.sort(key=lambda r: r[0])
with open(os.path.join(out, "demo_hr_audit.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["event_time", "user", "src", "geo", "asn", "action", "mfa", "dataset", "record_count", "scope", "fields", "request_id"]); w.writerows(rows)
with open(os.path.join(out, "demo_hr_baseline.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["user", "usual_geo", "usual_asn", "role", "dept"])
    w.writerows([["hr_ops03", JP, AS_JP, "一般（参照・エクスポート）", "人事部"], ["hr_ops05", JP, AS_JP, "一般（参照）", "人事部"], ["hr_ops08", JP, AS_JP, "一般（参照）", "人事部"],
                 ["hr_ops11", JP, AS_JP, "一般（参照）", "人事部"], ["hr_admin01", JP, AS_JP, "管理者", "人事部"], ["payroll02", JP, AS_JP, "一般（参照）", "給与"], ["vendor_mnt02", JP, AS_JP, "委託先保守", "委託先"]])
with open(os.path.join(out, "demo_cust_audit.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["event_time", "user", "src", "system", "action", "record_count"])
    w.writerows([["2026-10-06 01:40:00", "cs_agent01", "192.0.2.61", "customer_portal", "view", 3], ["2026-10-06 02:20:00", "cs_agent07", "192.0.2.62", "customer_portal", "view", 1],
                 ["2026-10-06 08:55:00", "cs_agent01", "192.0.2.61", "customer_portal", "view", 8], ["2026-10-06 09:30:00", "cs_batch", "192.0.2.70", "customer_portal", "export", 15000]])
print("rows", len(rows))
