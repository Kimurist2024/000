
  /* ==================== 状態と操作 ==================== */
  var S = { ch: 1, c: {}, tip: null, warn: null, info: null, stats: { steps: 0, fixes: 0, notes: 0 } };
  var hist = [];
  var pendingTop = false;
  function snap() { hist.push(JSON.stringify(S)); if (hist.length > 300) hist.shift(); }
  function undo() { if (!hist.length) return; S = JSON.parse(hist.pop()); render(); }
  function C() { return S.c[S.ch]; }
  function D() { return CH[S.ch]; }
  function cur() { var c = C(), d = D(); return d.steps && c.step >= 1 ? d.steps[c.step - 1] : null; }
  function fix(msg) { S.warn = msg; S.stats.fixes++; }
  function note() { S.stats.notes++; }

  function goChapter(n, quiet) {
    if (!CH[n]) return;
    S.ch = n;
    S.c[n] = CH[n].init ? CH[n].init() : { step: 0, vals: {} };
    S.tip = null; S.warn = null; S.info = null;
    hist = []; pendingTop = true;
    if (!quiet) render();
  }
  function start() {
    var d = D(), c = C();
    if (d.onStart) d.onStart(c);
    c.step = 1; c.started = true;
  }
  function finish() {
    var d = D(), c = C(), st = cur();
    if (st.after) st.after(c);
    c.step++;
    if (d.kind !== "note") S.stats.steps++;
    var nx = cur();
    while (nx && nx.skip && nx.skip(c)) {
      c.step++;
      if (d.kind !== "note") S.stats.steps++;
      nx = cur();
    }
  }
  function resolve(r) {
    if (r === "done") finish();
    else if (r && r.wrong) fix(r.wrong);
  }
  function emit(ev) {
    var d = D(), c = C();
    if (!c || !d.steps) return;
    if (ev.kind === "pick") c.vals[ev.id] = ev.value;
    if (ev.kind === "tip") { S.tip = S.tip === ev.id ? null : ev.id; if (!S.tip) return; note(); }
    if (d.free && d.free(c, ev)) return;
    if (c.step === 0) {
      if (ev.kind === "click" && d.startIds && d.startIds.indexOf(ev.id) >= 0) start();
      return;
    }
    var st = cur();
    if (!st) return;
    var r = st.handle ? st.handle(c, ev) : null;
    if (r) resolve(r);
    else if (ev.kind === "click") S.info = "このデモでは、ガイドの順に進めます。次は「" + st.label + "」です。";
  }
  function primary() {
    var d = D(), c = C();
    if (S.ch === SUMMARY) return { label: "最初の場面へ", run: function () { goChapter(1, true); } };
    if (c.step === 0) return { label: d.startLabel || "ガイドを開始", run: start };
    if (c.step > d.steps.length) return { label: d.nextLabel, run: function () { goChapter(S.ch + 1, true); } };
    var st = cur();
    return { label: val(st.btn, c) || "次へ", run: function () { resolve(st.auto ? st.auto(c) : "done"); } };
  }
  function act(name, arg, value) {
    if (name === "back") { undo(); return; }
    if (name === "chapter") { goChapter(+arg); return; }
    snap();
    S.warn = null; S.info = null;
    if (name !== "tip") S.tip = null;
    if (name === "next") primary().run();
    else if (name === "click") emit({ kind: "click", id: arg });
    else if (name === "pick") emit({ kind: "pick", id: arg, value: value });
    else if (name === "tip") emit({ kind: "tip", id: arg });
    render();
  }

  /* ---------- テックタッチのパネル ---------- */
  var PILL = { tt: "テックタッチ", hub: "テックタッチ＋AI Hub", note: "説明用" };
  function stepsList(steps, now) {
    return '<ol class="steps compact">' + steps.map(function (g, i) {
      var n = i + 1;
      return '<li class="' + (n < now ? "done" : n === now ? "now" : "") + '">' + g.label + "</li>";
    }).join("") + "</ol>";
  }
  function msgs() {
    return (S.warn ? '<p class="alert" role="alert">' + S.warn + "</p>" : "") + (S.info ? '<p class="info" role="status">' + S.info + "</p>" : "");
  }
  function actions() {
    return '<div class="actions"><button type="button" class="btn btn-ghost" data-act="back"' + (hist.length ? "" : " disabled") + ">戻る</button>" +
      '<button type="button" class="btn btn-primary" data-act="next" id="panel-next">' + primary().label + "</button></div>";
  }
  function panelHTML() {
    var d = D(), c = C(), kind = d.kind || "tt";
    var head = '<div class="ov-head"><span class="ov-pill">' + PILL[kind] + '</span><span class="ov-kicker">' + d.kicker + "</span></div>";
    if (c.step === 0) return head + d.intro(c) + msgs() + actions();
    if (c.step > d.steps.length) return head + '<h3 class="ov-title">' + d.guide + "</h3>" + stepsList(d.steps, c.step) + d.doneHTML(c) + actions();
    var st = cur(), h = head + '<h3 class="ov-title">' + d.guide + "</h3>" + stepsList(d.steps, c.step);
    if (kind === "hub") {
      h += '<div class="part tt"><p class="part-head"><span>テックタッチ 操作ガイド</span><span class="num">' + c.step + " / " + d.steps.length + "</span></p><p>" + val(st.now, c) + "</p></div>" + msgs();
      var hub = val(st.hub, c);
      if (hub) h += '<div class="part hub"><p class="part-head"><span>AI Hub（例文）</span></p><p>' + hub + "</p></div>";
      return h + '<p class="refs">AI Hubの回答は本番前に確かめた例文です。実環境の項目名やデータ構造に合わせた検証が必要です。</p>' + actions();
    }
    return h + '<p class="now-box">' + val(st.now, c) + "</p>" + msgs() + (st.why ? '<p class="soft">' + val(st.why, c) + "</p>" : "") + actions();
  }

  /* ---------- 振り返り ---------- */
  function summaryHTML() {
    var any = S.stats.steps > 0;
    var stat = function (v, label) { return '<div class="stat"><b>' + (any ? v : "—") + "</b><span>" + label + "</span></div>"; };
    var tl = function (t, title, desc) { return '<li><span class="t">' + t + '</span><span class="rail" aria-hidden="true"></span><div class="body"><b>' + title + "</b><span>" + desc + "</span></div></li>"; };
    var asks = function (ns) { return '<ul class="sum-list">' + ns.map(function (n) { return "<li>" + CH[n].ask + "</li>"; }).join("") + "</ul>"; };
    return '<div class="summary">' +
      '<section class="sum-card wide"><h2>今日の流れ（架空）：SOC担当者が、依頼から改善までを自分で進める</h2><div class="lanes">' +
      '<div class="lane"><h3>前半：依頼 → 検索の完成（Splunk AI Assistant＋AI Hub）</h3><ol class="tl">' +
      tl("S0", "現場の問題", "機能不足ではなく、実行力と業務適合の不足。成果物を5つ決める") +
      tl("S1", "Before", "件数は見えるが、同一管理者・失敗後の成功を表せず、委託先に依頼して待つ") +
      tl("S2", "要件整理", "AI Hubが、日本語の依頼をログ辞書・検知基準に基づく依頼文にする") +
      tl("S3", "SPL生成・確認", "AssistantのSPL案を、AI Hubが業務条件で照合し、修正依頼を作る") +
      tl("S4", "データ検証", "固定ログでQ1〜Q4を実行。Q3でAだけが残る") +
      '</ol></div><div class="lane"><h3>後半：監視 → 検知 → 調査 → 改善（テックタッチ＋AI Hub）</h3><ol class="tl">' +
      tl("S5", "可視化", "命名規則・共有範囲の入力チェック付きで、4パネルのダッシュボードを保存") +
      tl("S6", "検知", "SSEを参照し、A社の基準どおりのアラート（15分ごと・抑制・通知先）") +
      tl("S7", "一次調査", "AI Hub（KB04）で事実と未確認を分け、チェックリストで引き継ぐ") +
      tl("S8", "記録・改善", "記録を4項目で残し、Q3を承認済みテンプレートに足す改善チケット") +
      '</ol><p class="sum-note">役割の固定：ログの検索はSplunk、検索案はAssistant、社内の基準と次の行動はAI Hub、手順の抜け漏れ防止と入力チェックはテックタッチ。</p></div></div></section>' +
      '<section class="sum-card"><h2>このデモで、テックタッチが手当てした場面</h2><div class="stats">' +
      stat(S.stats.steps, "ガイドで進めたステップ") + stat(S.stats.fixes, "選び直し・順番・入力の案内") + stat(S.stats.notes, "定義・基準・社内手順の表示") + "</div>" +
      '<p class="sum-note">' + (any ? "このデモを操作した回数です。効果の数値ではありません。" : "場面を順に進めると、操作した回数を数えます。効果の数値ではありません。") + "</p></section>" +
      '<section class="sum-card"><h2>確かめ方（案・7章）</h2><ul class="sum-list"><li>自力完了率：委託先に依頼せずに、SPLの修正・ダッシュボード・アラートを終えられた割合</li><li>所要時間：依頼から監視に載るまで</li><li>依頼件数：委託先への改修依頼の件数</li><li>検証：検知条件を変えたとき、テストケースA〜Dで確かめたか</li></ul>' +
      '<p class="sum-note">数値の目標は、現状を伺ってから設定します。Splunk AI Assistantの精度が上がったことを示す公開の根拠は見当たらないため、Assistantの出力は毎回、業務条件で確かめます。</p></section>' +
      '<section class="sum-card wide"><h2>本日伺いたいこと</h2><div class="lanes"><div class="lane"><h3>検索・検証について</h3>' + asks([1, 2, 3, 4, 5]) +
      '</div><div class="lane"><h3>監視・検知・調査・改善について</h3>' + asks([6, 7, 8, 9]) + "</div></div></section>" +
      '<section class="sum-card wide"><h2>最初の一歩</h2><p class="flow3"><span>先に確かめる（9章 #1〜#4）</span><span class="arrow">→</span><span>一つの作業で実画面を確かめる</span><span class="arrow">→</span><span>変化を測る</span></p>' +
      '<p class="sum-note">画面・人物・数値はすべて架空です。Splunk Cloudの実画面での動作確認（テックタッチが画面の要素を安定して指せるか、AI HubとAssistantの受け渡し、端末への拡張機能の配布、検証環境）は、構築の最初に行います。</p></section></div>';
  }

  /* ---------- 吹き出し ---------- */
  function point(target, text, warn, sub) {
    var noteKind = D().kind === "note";
    target.classList.add("is-target");
    if (noteKind) target.classList.add("note-target");
    var side = target.getAttribute("data-tip-side");
    var b = document.createElement("div");
    b.className = "balloon" + (warn ? " warn" : "") + (noteKind && !warn ? " note" : "") + (side === "right" ? " r" : side === "s" ? " s" : "");
    b.textContent = text;
    if (sub) { var sm = document.createElement("small"); sm.textContent = sub; b.appendChild(sm); }
    target.appendChild(b);
    keepInside(b, side === "right" ? "r" : side === "s" ? "s" : "l");
  }
  function rightLimit(el) {
    var lim = document.documentElement.clientWidth - 8, pg = el.closest(".dt-page");
    if (pg) { var pr = pg.getBoundingClientRect(); lim = Math.min(lim, pr.right - parseFloat(getComputedStyle(pg).paddingRight) + 8); }
    return lim;
  }
  function keepInside(el, mode) {
    var vw = document.documentElement.clientWidth, pad = 8, r = el.getBoundingClientRect(), lim = rightLimit(el);
    if (mode === "s") {
      if (r.right > lim) { el.classList.remove("s"); keepInside(el, "l"); }
      return;
    }
    if (mode === "l" && r.right > lim) {
      var shift = Math.min(r.right - lim, Math.max(0, r.left - pad));
      el.style.left = (parseFloat(getComputedStyle(el).left) - shift) + "px";
      el.style.setProperty("--ax", Math.min(20 + shift, r.width - 24) + "px");
    } else if (mode === "r" && r.left < pad) {
      var back = Math.min(pad - r.left, Math.max(0, vw - pad - r.right));
      el.style.right = (parseFloat(getComputedStyle(el).right) - back) + "px";
      el.style.setProperty("--axr", Math.min(20 + back, r.width - 24) + "px");
    }
  }
  function guideTarget() {
    var st = cur(), c = C();
    if (S.ch === SUMMARY || !st) return null;
    var s = val(st.target, c);
    if (!s) return null;
    var warn = !!S.warn;
    return { sel: s, tip: warn && st.redo ? val(st.redo, c) : val(st.tip, c), sub: warn ? "" : val(st.sub, c), warn: warn };
  }

  /* ---------- 描画 ---------- */
  function renderJourney() {
    $("#journey").innerHTML = JOURNEY.map(function (j) {
      var st = j[0] < S.ch ? "done" : j[0] === S.ch ? "now" : "todo";
      return '<button type="button" class="jn ' + st + '" data-act="chapter" data-arg="' + j[0] + '"' + (st === "now" ? ' aria-current="step"' : "") + ">" +
        '<span class="no">' + (st === "done" ? "✓" : j[0]) + '</span><span class="jl">' + j[1] + '</span><span class="jt">' +
        (j[3] ? '<span class="rc ' + j[3] + '">' + ROLE_LABEL[j[3]] + "</span>" : "") + j[2] + "</span></button>";
    }).join("");
  }
  function renderStory() {
    var d = D();
    var role = d.role ? '<span class="rc ' + d.role + '">' + ROLE_LABEL[d.role] + "の視点</span>" : "";
    $("#story").innerHTML = '<p class="story-time">' + d.time + "<small>" + d.timeSub + "</small></p><h1>" + role + d.title + '</h1><p class="story-text">' + d.text + "</p>" +
      '<p class="story-tags">' + d.tags.filter(function (t) { return !/の視点$/.test(t); }).map(function (t) { return "<span>" + t + "</span>"; }).join("") + "</p>";
  }
  function renderStage() {
    var st = $("#stage"), d = D(), c = C();
    if (S.ch === SUMMARY) { st.innerHTML = summaryHTML(); return; }
    st.innerHTML = '<div class="window"><div class="win-bar"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><span>' + winTitle(c) + "</span></div>" +
      '<div class="dt has-overlay' + (c.app === "intra" ? " intra" : "") + '">' +
      '<div class="dt-app">' + spTop(c) + appBar(c) + '<div class="dt-page">' + pageHTML(c) + "</div></div>" +
      '<aside class="overlay' + (d.kind === "hub" ? " hub" : d.kind === "note" ? " note" : "") + '" aria-label="テックタッチのガイド">' + panelHTML() + "</aside>" +
      (d.modal ? d.modal(c) : "") + "</div></div>";
  }
  function render() {
    var active = document.activeElement, focusId = active && active.id;
    renderJourney();
    renderStory();
    renderStage();
    $("#ask").hidden = S.ch === SUMMARY;
    $("#ask-text").textContent = D().ask;
    $$("#notes [data-for]").forEach(function (ul) { ul.hidden = ul.getAttribute("data-for") !== String(S.ch); });
    var t = guideTarget(), el = t && $(t.sel);
    if (el) point(el, t.tip, t.warn, t.sub);
    $$(".tt-tip").forEach(function (tt) { keepInside(tt, "l"); });
    if (focusId) { var f = document.getElementById(focusId); if (f && f !== document.activeElement) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } } }
    if (pendingTop) { window.scrollTo(0, 0); pendingTop = false; }
    try { history.replaceState(null, "", "#s" + S.ch); } catch (e) { /* 表示には影響なし */ }
  }

  /* ---------- 入力 ---------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-act]");
    if (a) { if (!a.disabled) act(a.getAttribute("data-act"), a.getAttribute("data-arg")); return; }
    var q = e.target.closest("[data-tip]");
    if (q) { act("tip", q.getAttribute("data-tip")); return; }
    var el = e.target.closest("[data-id]");
    if (!el || el.disabled || el.tagName === "SELECT" || el.tagName === "INPUT" || el.tagName === "TEXTAREA") return;
    act("click", el.getAttribute("data-id"));
  });
  document.addEventListener("change", function (e) {
    var el = e.target.closest("select[data-id], input[data-id], textarea[data-id]");
    if (!el) return;
    act("pick", el.getAttribute("data-id"), el.value);
  });
  // 文字入力は Enter でも確定する
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && e.target && e.target.matches && e.target.matches("input[data-id]")) { e.preventDefault(); e.target.blur(); }
  });
  function toggleNotes() {
    var n = $("#notes"), btn = $("#notes-btn");
    n.hidden = !n.hidden;
    btn.setAttribute("aria-pressed", String(!n.hidden));
  }
  $("#notes-btn").addEventListener("click", toggleNotes);
  $("#reset-btn").addEventListener("click", function () { goChapter(S.ch); });

  var THEME_KEY = "sp-tt-siem-demo-theme";
  var themes = ["", "light", "dark"], labels = { "": "自動", light: "ライト", dark: "ダーク" };
  var theme = "";
  function applyTheme(t, persist) {
    theme = t;
    if (t) document.documentElement.setAttribute("data-theme", t);
    else if (persist) document.documentElement.removeAttribute("data-theme");
    $("#theme-btn").textContent = "表示：" + labels[t];
    if (persist) { try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* 保存できなくても表示は切り替わる */ } }
  }
  try { var saved = localStorage.getItem(THEME_KEY); if (saved === "light" || saved === "dark") applyTheme(saved, false); } catch (e) { /* 既定のまま */ }
  $("#theme-btn").addEventListener("click", function () { applyTheme(themes[(themes.indexOf(theme) + 1) % themes.length], true); });

  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var tag = (e.target && e.target.tagName || "").toLowerCase();
    if (tag === "select" || tag === "input" || tag === "textarea") return;
    if (e.key === "ArrowRight") { act("next"); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { act("back"); e.preventDefault(); }
    else if (e.key >= "1" && e.key <= "9") goChapter(+e.key);
    else if (e.key === "0") goChapter(SUMMARY);
    else if (e.key === "n" || e.key === "N") toggleNotes();
    else if (e.key === "r" || e.key === "R") goChapter(S.ch);
  });

  var resizeTimer = null;
  window.addEventListener("resize", function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(render, 150); });

  var m = /^#s([1-9]|10)$/.exec(location.hash || "");
  goChapter(m ? +m[1] : 1);
