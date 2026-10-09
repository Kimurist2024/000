// ガイドエンジン：状態、操作、テックタッチのパネル、振り返り、吹き出し（Splunkの画面は stage.jsx が React で描く）
import { SUMMARY, JOURNEY, ROLE_LABEL } from "./data.js";
import { CH } from "./content.js";
import { $, $$, val } from "./panel.js";
import { mountStage, renderStage } from "./stage.jsx";

/* ==================== 状態 ==================== */
export let S = { ch: 1, c: {}, tip: null, warn: null, info: null, stats: { steps: 0, fixes: 0, notes: 0 } };
let hist = [];
let pendingTop = false;
function snap() { hist.push(JSON.stringify(S)); if (hist.length > 300) hist.shift(); }
function undo() { if (!hist.length) return; S = JSON.parse(hist.pop()); render(); }
export function C() { return S.c[S.ch]; }
export function D() { return CH[S.ch]; }
function cur() { const c = C(), d = D(); return d.steps && c.step >= 1 ? d.steps[c.step - 1] : null; }
export function fix(msg) { S.warn = msg; S.stats.fixes++; }
export function note() { S.stats.notes++; }
export function setInfo(msg) { S.info = msg; }

/* ガイドの判定の部品（場面定義から使う） */
export function clickIs(id) { return (c, ev) => (ev.kind === "click" && ev.id === id ? "done" : null); }
export function pickIs(id, want, wrong) {
  return (c, ev) => {
    if (ev.kind !== "pick" || ev.id !== id || !ev.value) return null;
    if (ev.value === want) return "done";
    return { wrong: typeof wrong === "function" ? wrong(ev.value) : wrong };
  };
}
export function autoPick(id, want) { return (c) => { c.vals[id] = want; return "done"; }; }
export function autoTip(key) { return () => { S.tip = key; note(); return "done"; }; }

function goChapter(n, quiet) {
  if (!CH[n]) return;
  S.ch = n;
  S.c[n] = CH[n].init ? CH[n].init() : { step: 0, vals: {} };
  S.tip = null; S.warn = null; S.info = null;
  hist = []; pendingTop = true;
  if (!quiet) render();
}
function start() {
  const d = D(), c = C();
  if (d.onStart) d.onStart(c);
  c.step = 1; c.started = true;
}
function finish() {
  const d = D(), c = C(), st = cur();
  if (st.after) st.after(c);
  c.step++;
  if (d.kind !== "note") S.stats.steps++;
  let nx = cur();
  while (nx && nx.skip && nx.skip(c)) { c.step++; if (d.kind !== "note") S.stats.steps++; nx = cur(); }
}
function resolve(r) {
  if (r === "done") finish();
  else if (r && r.wrong) fix(r.wrong);
}
function emit(ev) {
  const d = D(), c = C();
  if (!c || !d.steps) return;
  if (ev.kind === "pick") c.vals[ev.id] = ev.value;
  if (ev.kind === "tip") { S.tip = S.tip === ev.id ? null : ev.id; if (!S.tip) return; note(); }
  if (d.free && d.free(c, ev)) return;
  if (c.step === 0) {
    if (ev.kind === "click" && d.startIds && d.startIds.indexOf(ev.id) >= 0) start();
    return;
  }
  const st = cur();
  if (!st) return;
  const r = st.handle ? st.handle(c, ev) : null;
  if (r) resolve(r);
  else if (ev.kind === "click") S.info = "このデモでは、ガイドの順に進めます。次は「" + st.label + "」です。";
}
function primary() {
  const d = D(), c = C();
  if (S.ch === SUMMARY) return { label: "最初の場面へ", run: () => goChapter(1, true) };
  if (c.step === 0) return { label: d.startLabel || "ガイドを開始", run: start };
  if (c.step > d.steps.length) return { label: d.nextLabel, run: () => goChapter(S.ch + 1, true) };
  const st = cur();
  return { label: val(st.btn, c) || "次へ", run: () => resolve(st.auto ? st.auto(c) : "done") };
}
export function act(name, arg, value) {
  if (name === "back") { undo(); return; }
  if (name === "chapter") { goChapter(+arg); return; }
  snap();
  S.warn = null; S.info = null;
  if (name !== "tip") S.tip = null;
  if (name === "next") primary().run();
  else if (name === "click") emit({ kind: "click", id: arg });
  else if (name === "pick") emit({ kind: "pick", id: arg, value });
  else if (name === "tip") emit({ kind: "tip", id: arg });
  render();
}
// 画面側の都合で状態だけ直す（メニューを閉じる等。ガイドの判定は通さない）
export function patch(fn) { fn(C()); render(); }

/* ==================== テックタッチのパネル ==================== */
const PILL = { tt: "テックタッチ", hub: "テックタッチ＋AI Hub", note: "説明用" };
function stepsList(steps, now) {
  return '<ol class="steps compact">' + steps.map((g, i) => { const n = i + 1; return '<li class="' + (n < now ? "done" : n === now ? "now" : "") + '">' + g.label + "</li>"; }).join("") + "</ol>";
}
function msgs() {
  return (S.warn ? '<p class="alert" role="alert">' + S.warn + "</p>" : "") + (S.info ? '<p class="info" role="status">' + S.info + "</p>" : "");
}
function actions() {
  return '<div class="actions"><button type="button" class="btn btn-ghost" data-act="back"' + (hist.length ? "" : " disabled") + ">戻る</button>" +
    '<button type="button" class="btn btn-primary" data-act="next" id="panel-next">' + primary().label + "</button></div>";
}
function panelHTML() {
  const d = D(), c = C(), kind = d.kind || "tt";
  const head = '<div class="ov-head"><span class="ov-pill">' + PILL[kind] + '</span><span class="ov-kicker">' + d.kicker + "</span></div>";
  if (c.step === 0) return head + d.intro(c) + msgs() + actions();
  if (c.step > d.steps.length) return head + '<h3 class="ov-title">' + d.guide + "</h3>" + stepsList(d.steps, c.step) + d.doneHTML(c) + actions();
  const st = cur();
  let h = head + '<h3 class="ov-title">' + d.guide + "</h3>" + stepsList(d.steps, c.step);
  if (kind === "hub") {
    h += '<div class="part tt"><p class="part-head"><span>テックタッチ 操作ガイド</span><span class="num">' + c.step + " / " + d.steps.length + "</span></p><p>" + val(st.now, c) + "</p></div>" + msgs();
    const hub = val(st.hub, c);
    if (hub) h += '<div class="part hub"><p class="part-head"><span>AI Hub（例文）</span></p><p>' + hub + "</p></div>";
    return h + '<p class="refs">AI Hubの回答は本番前に確かめた例文です。実環境の項目名やデータ構造に合わせた検証が必要です。</p>' + actions();
  }
  return h + '<p class="now-box">' + val(st.now, c) + "</p>" + msgs() + (st.why ? '<p class="soft">' + val(st.why, c) + "</p>" : "") + actions();
}

/* ==================== 振り返り ==================== */
function summaryHTML() {
  const any = S.stats.steps > 0;
  const stat = (v, label) => '<div class="stat"><b>' + (any ? v : "—") + "</b><span>" + label + "</span></div>";
  const tl = (t, title, desc) => '<li><span class="t">' + t + '</span><span class="rail" aria-hidden="true"></span><div class="body"><b>' + title + "</b><span>" + desc + "</span></div></li>";
  const asks = (ns) => '<ul class="sum-list">' + ns.map((n) => "<li>" + CH[n].ask + "</li>").join("") + "</ul>";
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
    '<p class="sum-note">画面・人物・数値はすべて架空です。画面の部品はSplunk公式のUIツールキット（Apache-2.0）を使っていますが、実機の画面ではありません。Splunk Cloudの実画面での動作確認は、構築の最初に行います。</p></section></div>';
}

/* ==================== 吹き出し（画面の上に重ねる層） ==================== */
function guideTarget() {
  const st = cur(), c = C();
  if (S.ch === SUMMARY || !st) return null;
  const s = val(st.target, c);
  if (!s) return null;
  const warn = !!S.warn;
  return { sel: s, tip: warn && st.redo ? val(st.redo, c) : val(st.tip, c), sub: warn ? "" : val(st.sub, c), warn };
}
let guide = null; // { sel, tip, sub, warn }
export function placeGuide() {
  const layer = $("#tt-layer"), ring = $("#tt-ring"), b = $("#tt-balloon");
  const el = guide && $(guide.sel);
  if (!el) { layer.hidden = true; return; }
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) { layer.hidden = true; return; }
  layer.hidden = false;
  const noteKind = D().kind === "note", pad = 4;
  ring.className = "tt-ring" + (guide.warn ? " warn" : noteKind ? " note" : "");
  ring.style.cssText = "left:" + (r.left - pad) + "px;top:" + (r.top - pad) + "px;width:" + (r.width + pad * 2) + "px;height:" + (r.height + pad * 2) + "px";
  b.className = "balloon" + (guide.warn ? " warn" : noteKind ? " note" : "");
  b.textContent = guide.tip;
  if (guide.sub) { const sm = document.createElement("small"); sm.textContent = guide.sub; b.appendChild(sm); }
  // 横は対象の左端に合わせ、右はパネルの手前（または画面の端）まで
  const panel = $("#panel"), pr = panel && !panel.hidden ? panel.getBoundingClientRect() : null;
  const vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
  const limR = pr && pr.left > 400 ? pr.left - 8 : vw - 8;
  b.style.maxWidth = Math.min(380, limR - 16) + "px";
  b.style.left = "0px"; b.style.top = "0px";
  const bw = b.offsetWidth, bh = b.offsetHeight;
  let left = Math.max(8, Math.min(r.left, limR - bw));
  let top = r.bottom + pad + 10, below = true;
  if (top + bh > vh - 8 && r.top - pad - 10 - bh > 8) { top = r.top - pad - 10 - bh; below = false; }
  b.classList.toggle("up", !below);
  b.style.left = left + "px"; b.style.top = top + "px";
  b.style.setProperty("--ax", Math.max(14, Math.min(bw - 24, r.left + Math.min(r.width / 2, 40) - left)) + "px");
}

/* ==================== 描画 ==================== */
function renderJourney() {
  $("#journey").innerHTML = JOURNEY.map((j) => {
    const st = j[0] < S.ch ? "done" : j[0] === S.ch ? "now" : "todo";
    return '<button type="button" class="jn ' + st + '" data-act="chapter" data-arg="' + j[0] + '"' + (st === "now" ? ' aria-current="step"' : "") + ">" +
      '<span class="no">' + (st === "done" ? "✓" : j[0]) + '</span><span class="jl">' + j[1] + '</span><span class="jt">' +
      (j[3] ? '<span class="rc ' + j[3] + '">' + ROLE_LABEL[j[3]] + "</span>" : "") + j[2] + "</span></button>";
  }).join("");
}
function renderStory() {
  const d = D();
  const role = d.role ? '<span class="rc ' + d.role + '">' + ROLE_LABEL[d.role] + "の視点</span>" : "";
  $("#story").innerHTML = '<p class="story-time">' + d.time + "<small>" + d.timeSub + "</small></p><h1>" + role + d.title + '</h1><p class="story-text">' + d.text + "</p>" +
    '<p class="story-tags">' + d.tags.filter((t) => !/の視点$/.test(t)).map((t) => "<span>" + t + "</span>").join("") + "</p>";
}
export function render() {
  const active = document.activeElement, focusId = active && active.id;
  renderJourney();
  renderStory();
  const d = D(), c = C(), summary = S.ch === SUMMARY;
  $("#window").hidden = summary;
  $("#summary").hidden = !summary;
  $("#ask").hidden = summary;
  $("#ask-text").textContent = d.ask;
  $$("#notes [data-for]").forEach((ul) => { ul.hidden = ul.getAttribute("data-for") !== String(S.ch); });
  if (summary) { $("#summary").innerHTML = summaryHTML(); guide = null; }
  else {
    $("#win-title").textContent = c.app === "intra" ? "社内ポータル（架空）　チケット管理・チャットのイメージ" : "Splunk Cloud Platform の画面イメージ（Splunk公式UI部品・架空のデータ）";
    const dt = $("#dt"); dt.classList.toggle("intra", c.app === "intra");
    const panel = $("#panel");
    panel.className = "overlay" + (d.kind === "hub" ? " hub" : d.kind === "note" ? " note" : "");
    panel.innerHTML = panelHTML();
    renderStage({ ch: S.ch, c, kind: d.kind, tip: S.tip, who: d.who, av: d.av });
    guide = guideTarget();
  }
  placeGuide();
  if (focusId) { const f = document.getElementById(focusId); if (f && f !== document.activeElement) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } } }
  if (pendingTop) { window.scrollTo(0, 0); pendingTop = false; }
  try { history.replaceState(null, "", "#s" + S.ch); } catch (e) { /* 表示には影響なし */ }
}

/* ==================== 入力 ==================== */
function toggleNotes() {
  const n = $("#notes"), btn = $("#notes-btn");
  n.hidden = !n.hidden;
  btn.setAttribute("aria-pressed", String(!n.hidden));
}
export function init() {
  mountStage($("#sp-root"));
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-act]");
    if (a) { if (!a.disabled) act(a.getAttribute("data-act"), a.getAttribute("data-arg")); return; }
    const q = e.target.closest("[data-tip]");
    if (q) { act("tip", q.getAttribute("data-tip")); return; }
    const el = e.target.closest("[data-id]");
    if (!el || el.disabled || el.getAttribute("aria-disabled") === "true" || ["SELECT", "INPUT", "TEXTAREA"].includes(el.tagName)) return;
    act("click", el.getAttribute("data-id"));
  });
  document.addEventListener("change", (e) => {
    const el = e.target.closest("select[data-id], input[data-id], textarea[data-id]");
    if (!el) return;
    act("pick", el.getAttribute("data-id"), el.value);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target && e.target.matches && e.target.matches("input[data-id]")) { e.preventDefault(); e.target.blur(); }
  });
  $("#notes-btn").addEventListener("click", toggleNotes);
  $("#reset-btn").addEventListener("click", () => goChapter(S.ch));
  const THEME_KEY = "sp-tt-siem-demo-theme";
  const themes = ["", "light", "dark"], labels = { "": "自動", light: "ライト", dark: "ダーク" };
  let theme = "";
  const applyTheme = (t, persist) => {
    theme = t;
    if (t) document.documentElement.setAttribute("data-theme", t); else if (persist) document.documentElement.removeAttribute("data-theme");
    $("#theme-btn").textContent = "表示：" + labels[t];
    if (persist) { try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* 保存できなくても表示は切り替わる */ } }
    render();
  };
  try { const saved = localStorage.getItem(THEME_KEY); if (saved === "light" || saved === "dark") applyTheme(saved, false); } catch (e) { /* 既定のまま */ }
  $("#theme-btn").addEventListener("click", () => applyTheme(themes[(themes.indexOf(theme) + 1) % themes.length], true));
  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const tag = (e.target && e.target.tagName || "").toLowerCase();
    if (tag === "select" || tag === "input" || tag === "textarea") return;
    if (e.key === "ArrowRight") { act("next"); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { act("back"); e.preventDefault(); }
    else if (e.key >= "1" && e.key <= "9") goChapter(+e.key);
    else if (e.key === "0") goChapter(SUMMARY);
    else if (e.key === "n" || e.key === "N") toggleNotes();
    else if (e.key === "r" || e.key === "R") goChapter(S.ch);
  });
  let timer = null;
  const later = () => { clearTimeout(timer); timer = setTimeout(placeGuide, 60); };
  window.addEventListener("resize", () => { clearTimeout(timer); timer = setTimeout(render, 150); });
  window.addEventListener("scroll", placeGuide, { passive: true });
  new ResizeObserver(later).observe($("#sp-root"));
  new MutationObserver(later).observe($("#sp-root"), { childList: true, subtree: true, attributes: true });
  const m = /^#s([1-9]|10)$/.exec(location.hash || "");
  goChapter(m ? +m[1] : 1);
}
export function currentTheme() { return document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); }
