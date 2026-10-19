#!/usr/bin/env python3
"""架空のA社の Microsoft 365 監査ログ（demo_m365_audit.csv）と、利用者の平常値（demo_m365_baseline.csv）を決め打ちで書き出す。
すべて架空。IPは文書用の予約アドレス（RFC 5737）、ASNは文書用の番号（RFC 5398）。"""
import csv, os, sys
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
os.makedirs(out, exist_ok=True)
JP, AS_JP = "国内", "AS64496"
rows = []
def ev(t, user, src, geo, asn, workload, action, mfa="", target="", n="", scope="", detail="", req=""):
    rows.append([t, user, src, geo, asn, workload, action, mfa, target, n, scope, detail, req])
def signin(t, user, src, geo=JP, asn=AS_JP):
    ev(t, user, src, geo, asn, "EntraID", "signin", "approved")
def dl(t, user, src, n, target="onedrive", geo=JP, asn=AS_JP, detail="", req=""):
    ev(t, user, src, geo, asn, "SharePoint", "download", "", target, n, "internal", detail, req)
def send(t, user, src, n, geo=JP, asn=AS_JP, detail=""):
    ev(t, user, src, geo, asn, "Exchange", "send_mail", "", "mailbox", n, "internal", detail)
# 平常の利用（国内・少量）
signin("2026-10-01 09:02:11", "r.ito", "192.0.2.21"); dl("2026-10-01 09:20:40", "r.ito", "192.0.2.21", 8); send("2026-10-01 10:05:00", "r.ito", "192.0.2.21", 12)
signin("2026-10-02 09:05:30", "r.ito", "192.0.2.21"); dl("2026-10-02 09:40:10", "r.ito", "192.0.2.21", 15)
signin("2026-10-01 08:58:20", "y.kato", "192.0.2.22"); dl("2026-10-01 09:15:00", "y.kato", "192.0.2.22", 25)
signin("2026-10-06 08:59:10", "y.kato", "192.0.2.22"); dl("2026-10-06 09:20:00", "y.kato", "192.0.2.22", 30)
signin("2026-10-02 09:12:00", "h.mori", "192.0.2.23"); send("2026-10-02 09:30:12", "h.mori", "192.0.2.23", 20)
signin("2026-10-01 09:04:00", "s.tanaka", "192.0.2.25"); dl("2026-10-01 09:50:00", "s.tanaka", "192.0.2.25", 18, "sharepoint:営業部"); send("2026-10-01 11:00:00", "s.tanaka", "192.0.2.25", 9)
signin("2026-10-02 09:01:00", "s.tanaka", "192.0.2.25"); dl("2026-10-02 10:10:00", "s.tanaka", "192.0.2.25", 22, "sharepoint:営業部")
signin("2026-10-01 09:10:00", "m.suzuki", "192.0.2.26"); dl("2026-10-01 09:30:00", "m.suzuki", "192.0.2.26", 14)
signin("2026-10-02 09:20:00", "it_admin01", "192.0.2.30"); dl("2026-10-02 09:25:00", "it_admin01", "192.0.2.30", 40, "sharepoint:全社共有")
signin("2026-10-02 13:00:00", "ext_mig02", "192.0.2.40"); dl("2026-10-02 13:20:00", "ext_mig02", "192.0.2.40", 5, "sharepoint:アーカイブ")
# ケースB：IT管理者の移行作業（申請済み・平常の接続元）→ 件数だけ見ると混ざる
signin("2026-10-01 09:31:00", "it_admin01", "192.0.2.30")
dl("2026-10-01 09:45:20", "it_admin01", "192.0.2.30", 4800, "sharepoint:全社共有", detail="サイト移行", req="CHG-2026-1001")
ev("2026-10-01 10:20:00", "it_admin01", "192.0.2.30", JP, AS_JP, "EntraID", "signout")
# ケースC：出張先（普段と違う接続元）からのサインイン。ダウンロードは12件、転送ルールなし
signin("2026-10-03 11:05:12", "m.suzuki", "203.0.113.55", "国外2", "AS64501")
dl("2026-10-03 11:10:40", "m.suzuki", "203.0.113.55", 12, geo="国外2", asn="AS64501")
ev("2026-10-03 11:30:00", "m.suzuki", "203.0.113.55", "国外2", "AS64501", "EntraID", "signout")
# ケースD：委託先の移行作業（申請済み）。普段と違う拠点から、移行ツールへの転送ルールを作り2,000件をダウンロード
signin("2026-10-04 22:01:05", "ext_mig02", "203.0.113.9", "国外2", "AS64502")
ev("2026-10-04 22:05:30", "ext_mig02", "203.0.113.9", "国外2", "AS64502", "Exchange", "inbox_rule", "", "mailbox", 1, "external", "移行ツールへの転送", "CHG-2026-1004")
dl("2026-10-04 22:10:30", "ext_mig02", "203.0.113.9", 2000, "sharepoint:アーカイブ", "国外2", "AS64502", "移行作業", "CHG-2026-1004")
ev("2026-10-04 22:40:00", "ext_mig02", "203.0.113.9", "国外2", "AS64502", "EntraID", "signout")
# ケースA：深夜、普段と違う国・ASNからサインイン（MFA済みのセッション）→ 外部への転送ルール → 大量ダウンロード → 社内へのリンク付きメール
signin("2026-10-06 02:14:10", "s.tanaka", "198.51.100.77", "国外1", "AS64500")
ev("2026-10-06 02:18:05", "s.tanaka", "198.51.100.77", "国外1", "AS64500", "Exchange", "inbox_rule", "", "mailbox", 1, "external", "外部ドメインへ転送・既読にして削除")
dl("2026-10-06 02:25:40", "s.tanaka", "198.51.100.77", 1200, "sharepoint:営業部", "国外1", "AS64500", "社外秘 840／一般 360")
send("2026-10-06 02:41:12", "s.tanaka", "198.51.100.77", 380, "国外1", "AS64500", "件名：請求書の確認のお願い（リンク付き）")
ev("2026-10-06 02:51:03", "s.tanaka", "198.51.100.77", "国外1", "AS64500", "EntraID", "signout")
# 同日朝、本人は平常どおり国内から利用（乗っ取りを疑う材料。断定はしない）
signin("2026-10-06 09:03:15", "s.tanaka", "192.0.2.25"); dl("2026-10-06 09:12:50", "s.tanaka", "192.0.2.25", 10, "sharepoint:営業部")
rows.sort(key=lambda r: r[0])
with open(os.path.join(out, "demo_m365_audit.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["event_time", "user", "src", "geo", "asn", "workload", "action", "mfa", "target", "record_count", "scope", "detail", "request_id"])
    w.writerows(rows)
with open(os.path.join(out, "demo_m365_baseline.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["user", "usual_geo", "usual_asn", "role", "dept"])
    w.writerows([["r.ito", JP, AS_JP, "一般", "経理部"], ["y.kato", JP, AS_JP, "一般", "総務部"], ["h.mori", JP, AS_JP, "一般", "企画部"],
                 ["s.tanaka", JP, AS_JP, "一般", "営業部"], ["m.suzuki", JP, AS_JP, "一般", "営業部"], ["it_admin01", JP, AS_JP, "管理者", "情報システム部"],
                 ["ext_mig02", JP, AS_JP, "委託先（移行作業）", "委託先"]])
print("rows", len(rows))
