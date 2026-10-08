#!/usr/bin/env python3
"""demo_auth_events.csv に対して、シナリオのQ0〜Q4と「不十分な例」の判定を再現する。
Splunkでの実行結果ではなく、同じ条件をPythonで計算した結果です（データとSPLの期待値が一致するかの確認用）。"""
import csv, sys, collections, datetime as dt
path = sys.argv[1] if len(sys.argv) > 1 else "data/demo_auth_events.csv"
rows = list(csv.DictReader(open(path, encoding="utf-8")))
for r in rows:
    r["epoch"] = dt.datetime.strptime(r["event_time"], "%Y-%m-%d %H:%M:%S")
ok = True
def check(name, cond, detail=""):
    global ok
    print(("OK   " if cond else "NG   ") + name + ("  " + detail if detail else ""))
    ok = ok and cond

# Q0
total = len(rows); srcs = {r["src"] for r in rows}; users = {r["user"] for r in rows}
print("Q0", total, len(srcs), len(users))
check("Q0 total_events=72", total == 72); check("Q0 distinct_srcs=4", len(srcs) == 4)

# Q1: failures by src
fails = [r for r in rows if r["action"] == "failure"]
q1 = {}
for r in fails:
    q1.setdefault(r["src"], [0, set()]); q1[r["src"]][0] += 1; q1[r["src"]][1].add(r["user"])
q1 = {s: (c, len(u)) for s, (c, u) in q1.items()}
print("Q1", sorted(q1.items(), key=lambda x: -x[1][0]))
check("Q1 A=36/9", q1.get("198.51.100.24") == (36, 9)); check("Q1 B=18/1", q1.get("203.0.113.40") == (18, 1))
check("Q1 C=12/6", q1.get("192.0.2.51") == (12, 6)); check("Q1 D=4/3", q1.get("203.0.113.20") == (4, 3))

# window 09:00-09:15
w0 = dt.datetime(2026,10,8,9,0,0); w1 = dt.datetime(2026,10,8,9,15,0)
win = [r for r in rows if w0 <= r["epoch"] < w1]
check("window holds all 72 events", len(win) == 72)
# Q2
q2 = {s: v for s, v in q1.items() if v[0] >= 10 and v[1] >= 5}
print("Q2", q2); check("Q2 = {A, C}", set(q2) == {"198.51.100.24", "192.0.2.51"})

# Q3: eventstats by src, sort src user epoch, streamstats by src user (cumulative failures incl. current), filter
src_fail = collections.Counter(); src_users = collections.defaultdict(set)
for r in win:
    if r["action"] == "failure": src_fail[r["src"]] += 1; src_users[r["src"]].add(r["user"])
out = []
for r in sorted(win, key=lambda r: (r["src"], r["user"], r["epoch"])):
    pass
prior = collections.Counter()
for r in sorted(win, key=lambda r: (r["src"], r["user"], r["epoch"])):
    key = (r["src"], r["user"])
    prior[key] += 1 if r["action"] == "failure" else 0
    if r["action"] == "success" and r["privileged"] == "true" and prior[key] >= 1 and src_fail[r["src"]] >= 10 and len(src_users[r["src"]]) >= 5:
        out.append((r["src"], r["user"], r["event_time"], src_fail[r["src"]], len(src_users[r["src"]]), r["mfa"]))
print("Q3", out)
check("Q3 = one row, A/admin_ops/09:10:00/36/9/approved", out == [("198.51.100.24", "admin_ops", "2026-10-08 09:10:00", 36, 9, "approved")])

# Q4: 5-minute buckets
b = collections.defaultdict(lambda: [0, 0])
for r in rows:
    k = r["epoch"].replace(minute=(r["epoch"].minute // 5) * 5, second=0)
    b[k.strftime("%H:%M")][0 if r["action"] == "failure" else 1] += 1
print("Q4", dict(sorted(b.items())))
check("Q4 totals 70 failures / 2 successes", sum(v[0] for v in b.values()) == 70 and sum(v[1] for v in b.values()) == 2)

# BEFORE (incomplete): failures>=10 and any privileged success per src, regardless of order/user
bf = collections.defaultdict(lambda: [0, 0])
for r in rows:
    if r["action"] == "failure": bf[r["src"]][0] += 1
    if r["action"] == "success" and r["privileged"] == "true": bf[r["src"]][1] += 1
before = {s for s, (f, a) in bf.items() if f >= 10 and a >= 1}
print("BEFORE", before); check("BEFORE = {A, C} (C wrongly included)", before == {"198.51.100.24", "192.0.2.51"})
print("\nALL OK" if ok else "\nSOME CHECKS FAILED"); sys.exit(0 if ok else 1)
