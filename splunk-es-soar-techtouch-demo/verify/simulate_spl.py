#!/usr/bin/env python3
"""demo_hr_audit.csv ほかに対して、シナリオのQ0〜Q4と「不十分な例」の判定を再現する。
Splunkでの実行結果ではなく、同じ条件をPythonで計算した結果です（データとSPLの期待値が一致するかの確認用）。"""
import csv, sys, os, collections, datetime as dt
base = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
rd = lambda n: list(csv.DictReader(open(os.path.join(base, n), encoding="utf-8")))
rows, basel, cust = rd("demo_hr_audit.csv"), rd("demo_hr_baseline.csv"), rd("demo_cust_audit.csv")
B = {b["user"]: b for b in basel}
for r in rows:
    r["epoch"] = dt.datetime.strptime(r["event_time"], "%Y-%m-%d %H:%M:%S"); r["n"] = int(r["record_count"] or 0)
ok = True
def check(name, cond, detail=""):
    global ok
    print(("OK   " if cond else "NG   ") + name + ("  " + detail if detail else "")); ok = ok and cond
# Q0
print("Q0", len(rows), len({r["user"] for r in rows}), len({r["src"] for r in rows}))
check("Q0 total_events=46", len(rows) == 46); check("Q0 distinct_users=7", len({r["user"] for r in rows}) == 7); check("Q0 distinct_srcs=10", len({r["src"] for r in rows}) == 10)
# Q1
odd = lambda r: r["action"] == "signin" and (r["geo"] != B[r["user"]]["usual_geo"] or r["asn"] != B[r["user"]]["usual_asn"])
q1 = sorted([(r["event_time"], r["user"], r["src"]) for r in rows if odd(r)])
print("Q1", q1)
check("Q1 = 3 rows (C, D, A)", q1 == [("2026-10-03 11:05:12", "hr_ops11", "203.0.113.55"), ("2026-10-04 22:01:05", "vendor_mnt02", "203.0.113.9"), ("2026-10-06 02:14:10", "hr_ops03", "198.51.100.77")])
# Q2
last = {}; q2 = collections.OrderedDict()
for r in sorted(rows, key=lambda r: (r["user"], r["epoch"])):
    if odd(r): last[r["user"]] = r["epoch"]
    if r["action"] in ("view", "export") and r["user"] in last and (r["epoch"] - last[r["user"]]).total_seconds() <= 3600:
        k = (r["user"], r["src"]); a = q2.setdefault(k, {"records": 0, "retired": 0, "req": set(), "first": r["event_time"], "last": r["event_time"]})
        a["records"] += r["n"]; a["retired"] += r["n"] if r["scope"] == "retired" else 0
        if r["request_id"]: a["req"].add(r["request_id"])
        a["first"] = min(a["first"], r["event_time"]); a["last"] = max(a["last"], r["event_time"])
for k, a in q2.items(): print("Q2", k, a)
check("Q2 A=88420/55980 no req", q2[("hr_ops03", "198.51.100.77")]["records"] == 88420 and q2[("hr_ops03", "198.51.100.77")]["retired"] == 55980 and not q2[("hr_ops03", "198.51.100.77")]["req"])
check("Q2 C=12/0", q2[("hr_ops11", "203.0.113.55")]["records"] == 12 and q2[("hr_ops11", "203.0.113.55")]["retired"] == 0)
check("Q2 D=2000/2000 req MNT-2026-1004", q2[("vendor_mnt02", "203.0.113.9")]["records"] == 2000 and q2[("vendor_mnt02", "203.0.113.9")]["req"] == {"MNT-2026-1004"})
check("Q2 has 3 rows", len(q2) == 3)
# Q3
q3 = [k for k, a in q2.items() if a["records"] >= 1000 and a["retired"] > 0 and not a["req"]]
print("Q3", q3); check("Q3 = A only", q3 == [("hr_ops03", "198.51.100.77")])
# Q4a
q4 = collections.OrderedDict()
for r in rows:
    if r["user"] == "hr_ops03" and r["src"] == "198.51.100.77" and r["action"] == "export":
        a = q4.setdefault(r["dataset"], {"records": 0, "fields": set()}); a["records"] += r["n"]; a["fields"].add(r["fields"])
print("Q4a", dict(q4), "total", sum(a["records"] for a in q4.values()))
check("Q4a employee=31240 retiree=55180 total=86420", q4["employee_master"]["records"] == 31240 and q4["retiree_master"]["records"] == 55180 and sum(a["records"] for a in q4.values()) == 86420)
check("Q4a fields = 7 items", all(a["fields"] == {"emp_no,name,address,phone,dept,title,manager"} for a in q4.values()))
# Q4b
q4b = [c for c in cust if c["user"] == "hr_ops03" or c["src"] == "198.51.100.77"]
print("Q4b", q4b); check("Q4b = 0 rows", q4b == [])
# BEFORE
bef = collections.Counter()
for r in rows:
    if r["action"] in ("view", "export"): bef[r["user"]] += r["n"]
bef = {u: n for u, n in bef.items() if n >= 1000}
print("BEFORE", bef); check("BEFORE = {A, B, D}", set(bef) == {"hr_ops03", "hr_admin01", "vendor_mnt02"})
check("BEFORE A=88542 B=48960 D=2005", bef["hr_ops03"] == 88542 and bef["hr_admin01"] == 48960 and bef["vendor_mnt02"] == 2005)
print("ALL OK" if ok else "SOME NG"); sys.exit(0 if ok else 1)
