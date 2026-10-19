#!/usr/bin/env python3
"""demo_m365_audit.csv ほかに対して、シナリオのQ0〜Q4bと「不十分な例」の判定を再現する。
Splunkでの実行結果ではなく、同じ条件をPythonで計算した結果です（データとSPLの期待値が一致するかの確認用）。"""
import csv, sys, os, collections, datetime as dt
base = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
rd = lambda n: list(csv.DictReader(open(os.path.join(base, n), encoding="utf-8")))
rows, basel = rd("demo_m365_audit.csv"), rd("demo_m365_baseline.csv")
B = {b["user"]: b for b in basel}
for r in rows:
    r["epoch"] = dt.datetime.strptime(r["event_time"], "%Y-%m-%d %H:%M:%S"); r["n"] = int(r["record_count"] or 0)
ok = True
def check(name, cond, detail=""):
    global ok
    print(("OK   " if cond else "NG   ") + name + ("  " + detail if detail else "")); ok = ok and cond
users = {r["user"] for r in rows}; srcs = {r["src"] for r in rows}
print("Q0", len(rows), len(users), len(srcs))
check("Q0 total_events=39", len(rows) == 39); check("Q0 distinct_users=7", len(users) == 7); check("Q0 distinct_srcs=10", len(srcs) == 10)
odd = lambda r: r["action"] == "signin" and (r["geo"] != B[r["user"]]["usual_geo"] or r["asn"] != B[r["user"]]["usual_asn"])
q1 = sorted([(r["event_time"], r["user"], r["src"]) for r in rows if odd(r)])
print("Q1", q1)
check("Q1 = 3 rows (C, D, A)", q1 == [("2026-10-03 11:05:12", "m.suzuki", "203.0.113.55"), ("2026-10-04 22:01:05", "ext_mig02", "203.0.113.9"), ("2026-10-06 02:14:10", "s.tanaka", "198.51.100.77")])
last = {}; q2 = collections.OrderedDict()
for r in sorted(rows, key=lambda r: (r["user"], r["epoch"])):
    if odd(r): last[r["user"]] = r["epoch"]
    if r["action"] in ("inbox_rule", "download", "send_mail") and r["user"] in last and (r["epoch"] - last[r["user"]]).total_seconds() <= 3600:
        k = (r["user"], r["src"]); a = q2.setdefault(k, {"downloads": 0, "rules": 0, "sent": 0, "req": set(), "first": r["event_time"], "last": r["event_time"]})
        a["downloads"] += r["n"] if r["action"] == "download" else 0
        a["rules"] += 1 if (r["action"] == "inbox_rule" and r["scope"] == "external") else 0
        a["sent"] += r["n"] if r["action"] == "send_mail" else 0
        if r["request_id"]: a["req"].add(r["request_id"])
        a["first"] = min(a["first"], r["event_time"]); a["last"] = max(a["last"], r["event_time"])
for k, a in q2.items(): print("Q2", k, a)
A, C, D = q2[("s.tanaka", "198.51.100.77")], q2[("m.suzuki", "203.0.113.55")], q2[("ext_mig02", "203.0.113.9")]
check("Q2 A=1200/1/380 no req", (A["downloads"], A["rules"], A["sent"], A["req"]) == (1200, 1, 380, set()))
check("Q2 A first/last", (A["first"], A["last"]) == ("2026-10-06 02:18:05", "2026-10-06 02:41:12"))
check("Q2 C=12/0/0", (C["downloads"], C["rules"], C["sent"]) == (12, 0, 0))
check("Q2 D=2000/1/0 req CHG-2026-1004", (D["downloads"], D["rules"], D["sent"], D["req"]) == (2000, 1, 0, {"CHG-2026-1004"}))
check("Q2 has 3 rows", len(q2) == 3)
q3 = [k for k, a in q2.items() if a["downloads"] >= 500 and a["rules"] >= 1 and not a["req"]]
print("Q3", q3); check("Q3 = A only", q3 == [("s.tanaka", "198.51.100.77")])
ai1 = [k for k, a in q2.items() if a["downloads"] >= 500]
print("AI1", ai1); check("Assistant 1st draft = A and D", sorted(ai1) == sorted([("s.tanaka", "198.51.100.77"), ("ext_mig02", "203.0.113.9")]))
q4 = collections.OrderedDict()
for r in sorted(rows, key=lambda r: r["epoch"]):
    if r["user"] == "s.tanaka" and r["src"] == "198.51.100.77" and r["action"] in ("inbox_rule", "download", "send_mail"):
        q4[r["action"]] = (r["n"], r["target"], r["detail"], r["event_time"])
print("Q4a", dict(q4))
check("Q4a rule/download/send", [(k, v[0]) for k, v in q4.items()] == [("inbox_rule", 1), ("download", 1200), ("send_mail", 380)])
q4b = [r for r in rows if r["src"] == "198.51.100.77" and r["user"] != "s.tanaka"]
print("Q4b", q4b); check("Q4b = 0 rows", q4b == [])
bef = collections.Counter()
for r in rows:
    if r["action"] == "download": bef[r["user"]] += r["n"]
bef = {u: n for u, n in bef.items() if n >= 500}
print("BEFORE", bef)
check("BEFORE = {A 1250, B 4840, D 2005}", bef == {"s.tanaka": 1250, "it_admin01": 4840, "ext_mig02": 2005})
print("ALL OK" if ok else "SOME NG"); sys.exit(0 if ok else 1)
