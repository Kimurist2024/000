  document.documentElement.lang = "ja";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function val(v, c) { return typeof v === "function" ? v(c) : v; }

  /* ---------- アイコン（汎用の図形。製品のアイコンではありません） ---------- */
  var ICON = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    spark: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    play: '<path d="M7 5v14l11-7z"/>',
    save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 12h6M9 16h6"/>',
    check: '<path d="m5 12 4 4L19 6"/>'
  };
  function svg(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[name] + "</svg>";
  }

  /* ---------- データ（すべて架空。data/demo_auth_events.csv と同じ値） ---------- */
  var CASES = [
    { id: "A", src: "198.51.100.24", fails: 36, users: 9, admin: "admin_ops", adminAt: "2026-10-08 09:10:00", note: "同一管理者 admin_ops が失敗の後に成功", verdict: "高優先度の調査候補" },
    { id: "B", src: "203.0.113.40", fails: 18, users: 1, admin: "", note: "svc_batch 1アカウントに集中", verdict: "多数アカウントへの試行ではない" },
    { id: "C", src: "192.0.2.51", fails: 12, users: 6, admin: "admin_fin", adminAt: "2026-10-08 09:00:05", note: "管理者 admin_fin の成功は失敗より前", verdict: "「失敗後の成功」ではない" },
    { id: "D", src: "203.0.113.20", fails: 4, users: 3, admin: "", note: "閾値未満", verdict: "記録のみ" }
  ];
  var Q4_ROWS = [["2026-10-08 09:00", 25, 1], ["2026-10-08 09:05", 42, 0], ["2026-10-08 09:10", 3, 1]];
  var SPL = {
    before: '| inputlookup demo_auth_events.csv\n| stats count(eval(action="failure")) AS failures count(eval(action="success" AND privileged="true")) AS admin_successes BY src\n| where failures >= 10 AND admin_successes >= 1',
    q0: '| inputlookup demo_auth_events.csv\n| stats count AS total_events dc(src) AS distinct_srcs dc(user) AS distinct_users',
    q1: '| inputlookup demo_auth_events.csv\n| where action="failure"\n| stats count AS fail_count dc(user) AS failed_users BY src\n| sort - fail_count',
    q2: '| inputlookup demo_auth_events.csv\n| eval epoch=strptime(event_time,"%Y-%m-%d %H:%M:%S")\n| where epoch>=strptime("2026-10-08 09:00:00","%Y-%m-%d %H:%M:%S") AND epoch<strptime("2026-10-08 09:15:00","%Y-%m-%d %H:%M:%S")\n| where action="failure"\n| stats count AS fail_count dc(user) AS failed_users BY src\n| where fail_count>=10 AND failed_users>=5\n| sort - fail_count',
    q3: '| inputlookup demo_auth_events.csv\n| eval epoch=strptime(event_time,"%Y-%m-%d %H:%M:%S")\n| where epoch>=strptime("2026-10-08 09:00:00","%Y-%m-%d %H:%M:%S") AND epoch<strptime("2026-10-08 09:15:00","%Y-%m-%d %H:%M:%S")\n| eval fail_mark=if(action="failure",1,0), failed_user=if(action="failure",user,null())\n| eventstats sum(fail_mark) AS src_fail_count dc(failed_user) AS src_failed_users BY src\n| sort 0 src user epoch\n| streamstats sum(fail_mark) AS prior_user_failures BY src user\n| where action="success" AND privileged="true" AND prior_user_failures>=1 AND src_fail_count>=10 AND src_failed_users>=5\n| table src user event_time src_fail_count src_failed_users mfa',
    q4: '| inputlookup demo_auth_events.csv\n| eval _time=strptime(event_time,"%Y-%m-%d %H:%M:%S")\n| timechart span=5m count(eval(action="failure")) AS failures count(eval(action="success")) AS successes',
    ai1: '| inputlookup demo_auth_events.csv\n| stats count(eval(action="failure")) AS fail_count dc(eval(if(action="failure",user,null()))) AS failed_users count(eval(action="success" AND privileged="true")) AS admin_success BY src\n| where fail_count>=10 AND failed_users>=5 AND admin_success>=1'
  };
  var REPORTS = [
    ["q1", "SOC_認証_Q1_IP別失敗ランキング", "接続元IP別の認証失敗件数と、失敗した異なるユーザー数", "v1.0"],
    ["q2", "SOC_認証_Q2_閾値候補", "15分で失敗10件以上・異なる5ユーザー以上の接続元", "v1.0"],
    ["q3", "SOC_認証_Q3_失敗後の特権成功", "同じ接続元・同じ特権アカウントで、失敗の後に成功", "v1.1（承認待ち）"],
    ["q4", "SOC_認証_Q4_5分推移", "5分単位の失敗・成功の推移", "v1.0"]
  ];
  var REQUEST_IN = "VPNの認証失敗と管理者ログイン成功を関連付けて、監視ダッシュボードにしたい。SOC基準に沿って、Splunk AI Assistantへの依頼を整えてください。";
  var REQUEST_OUT = "以下のCSVルックアップに対してSPLを作成してください。event_timeは %Y-%m-%d %H:%M:%S、srcが接続元IP、userがアカウント、actionはfailure／success、privilegedは文字列true／falseです。15分間に同一srcで失敗10件以上、かつ異なる失敗userが5以上あることに加え、同じsrc・同じ管理者userに対して、失敗の後で成功したイベントだけを抽出してください。成功が失敗より前のケースは除外してください。必要に応じてeventstats・sort・streamstatsなどを使い、処理を説明してください。";
  var FIX_REQUEST = "先ほどのSPLに、次の2つの条件を追加してください。(1) 成功した管理者アカウント本人に、同じ接続元からの失敗があること（src と user の単位で判定）。(2) その失敗が成功より前に起きていること（時刻順。eventstats・sort・streamstats を使ってよい）。あわせて、対象を 2026-10-08 09:00〜09:15 の15分間に限定してください。";
  var NAME_RULE = /^[^_\s]+_[^_\s]+_[^_\s]+$/;

  /* ---------- グラフ（SVG。すべて架空の数値） ---------- */
  function barChartSrc(rows) {
    var w = 560, h = 190, pad = 36, bw = 64, gap = 60, max = 40;
    var s = '<svg class="chart" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="接続元IP別の認証失敗件数（架空）">';
    [0, 10, 20, 30, 40].forEach(function (v) { var y = h - 30 - (v / max) * (h - 60); s += '<line class="c-grid" x1="' + pad + '" x2="' + (w - 10) + '" y1="' + y + '" y2="' + y + '"/><text class="c-txt" x="' + (pad - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + v + "</text>"; });
    rows.forEach(function (r, i) {
      var x = pad + 20 + i * (bw + gap), bh = (r.fails / max) * (h - 60), y = h - 30 - bh;
      s += '<rect class="c-bar' + (r.id === "A" ? " hot" : "") + '" x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="3"/>' +
        '<text class="c-txt" x="' + (x + bw / 2) + '" y="' + (h - 12) + '" text-anchor="middle">' + r.src + "</text>" +
        '<text class="c-txt" x="' + (x + bw / 2) + '" y="' + (y - 5) + '" text-anchor="middle">' + r.fails + "</text>";
    });
    return s + "</svg>";
  }
  function lineChart5m() {
    var w = 560, h = 190, pad = 36, max = 50, xs = [pad + 40, w / 2, w - 60];
    var y = function (v) { return h - 30 - (v / max) * (h - 60); };
    var s = '<svg class="chart" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="5分単位の認証失敗・成功の推移（架空）">';
    [0, 10, 20, 30, 40, 50].forEach(function (v) { s += '<line class="c-grid" x1="' + pad + '" x2="' + (w - 10) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="c-txt" x="' + (pad - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + "</text>"; });
    var f = Q4_ROWS.map(function (r, i) { return xs[i] + "," + y(r[1]); }).join(" ");
    var g = Q4_ROWS.map(function (r, i) { return xs[i] + "," + y(r[2]); }).join(" ");
    s += '<polyline class="c-line" points="' + f + '"/><polyline class="c-line ok" points="' + g + '"/>';
    Q4_ROWS.forEach(function (r, i) {
      s += '<circle class="c-dot" cx="' + xs[i] + '" cy="' + y(r[1]) + '" r="4"/><circle class="c-dot ok" cx="' + xs[i] + '" cy="' + y(r[2]) + '" r="4"/>' +
        '<text class="c-txt" x="' + xs[i] + '" y="' + (h - 12) + '" text-anchor="middle">' + r[0].slice(11) + "</text>";
    });
    return s + "</svg>";
  }

  /* ---------- 画面の部品 ---------- */
  function sel(id, key, opts, cur, disabled) {
    return '<select id="' + id + '" data-id="' + key + '"' + (disabled ? " disabled" : "") + ">" + opts.map(function (o) {
      var v = typeof o === "string" ? o : o[0], t = typeof o === "string" ? o : o[1];
      return '<option value="' + esc(v) + '"' + (v === cur ? " selected" : "") + ">" + esc(t) + "</option>";
    }).join("") + "</select>";
  }
  function txt(id, key, cur, ph, disabled) {
    return '<input type="text" id="' + id + '" data-id="' + key + '" value="' + esc(cur || "") + '" placeholder="' + esc(ph || "") + '"' + (disabled ? " disabled" : "") + ">";
  }
  function qBtn(key, label) {
    return '<button type="button" class="tt-q" data-tip="' + key + '" aria-expanded="' + (S.tip === key) + '" aria-label="' + label + '">?</button>';
  }
  var TIPS = {
    std: ["A社の検知基準 D-01（社内・架空）", "15分間に同一の接続元から失敗10件以上、かつ失敗した異なるアカウントが5以上。加えて、同じ特権アカウントで失敗の後に成功があれば「高優先度の調査候補」。侵害の成立は推定しません。"],
    sched: ["アラートの実行間隔（社内基準・架空）", "定期実行の15分ごとにします。リアルタイム検索は使いません（Splunkも定期実行を勧めています）。Splunk Cloudではスケジュールの時刻がUTCになる点に注意します。"],
    disp: ["判定区分の定義（社内・架空）", "誤検知＝検知条件は満たすが脅威ではない／正当な利用＝本人の操作と確認できた／要対応＝インシデントとして対応する。本人確認が済むまでは「候補」のままにします。"],
    kpi: ["ダッシュボードの数値の読み方（社内・架空）", "認証失敗は件数だけでなく、失敗した異なるアカウント数と、同じ特権アカウントの失敗後の成功を見ます。件数だけで判断しません。"]
  };
  function tipHTML(key) {
    if (S.tip !== key) return "";
    return '<span class="tt-tip" role="tooltip"><span class="lab">テックタッチ ツールチップ（案）：' + TIPS[key][0] + "</span>" + TIPS[key][1] + "</span>";
  }
  function tipWrap(id, label, key, aria) {
    return '<span class="tip-wrap" id="' + id + '">' + label + qBtn(key, aria) + tipHTML(key) + "</span>";
  }
  function guideList(title, text, items) {
    return '<h3 class="ov-title">' + title + '</h3><p class="ov-text">' + text + '</p><ul class="glist">' + items.map(function (g) {
      return g[2] ? '<li><button type="button" class="gitem" data-id="g-start" id="g-start"><span class="gname">' + g[0] + '</span><span class="gmeta">' + g[1] + "</span></button></li>"
        : '<li><div class="gitem"><span class="gname">' + g[0] + '</span><span class="gmeta">' + g[1] + "</span></div></li>";
    }).join("") + "</ul>";
  }
  function recList(rows, note) {
    return '<div class="soft"><p><b>記録（例）</b></p><ul class="rec-list">' + rows.map(function (r) {
      return '<li><span class="t">' + r[0] + "</span><span>" + r[1] + "</span></li>";
    }).join("") + "</ul></div>" + '<p class="refs">' + (note || "時刻・記録はすべて架空です。") + "</p>";
  }
  function clickIs(id) { return function (c, ev) { return ev.kind === "click" && ev.id === id ? "done" : null; }; }
  function pickIs(id, want, wrong) {
    return function (c, ev) {
      if (ev.kind !== "pick" || ev.id !== id || !ev.value) return null;
      if (ev.value === want) return "done";
      return { wrong: typeof wrong === "function" ? wrong(ev.value) : wrong };
    };
  }
  function autoPick(id, want) { return function (c) { c.vals[id] = want; return "done"; }; }
  function autoTip(key) { return function () { S.tip = key; note(); return "done"; }; }
  function fine(t) { return '<p class="dt-fine">' + t + "</p>"; }
  function code(s) { return '<pre class="code">' + esc(s) + "</pre>"; }
  function screenTag(kind) {
    var L = { splunk: "Splunk", tt: "テックタッチ", hub: "AI Hub", intra: "社内（架空）" };
    return '<span class="sc sc-' + kind + '">' + L[kind] + "</span>";
  }
