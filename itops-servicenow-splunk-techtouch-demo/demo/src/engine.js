// ガイドエンジン：状態、操作、テックタッチの重ね表示（吹き出し・再生中の表示・終了の通知・自動処理中）、進行バー、振り返り。
// 画面（ServiceNow・Splunk）は stage.jsx が React で描く。テックタッチの表示は製品の見た目に合わせ、画面の枠の中に重ねる。
import { CH, SUMMARY, JOURNEY, ROLE } from "./content.js";
import { mountStage, renderStage } from "./stage.jsx";
import { summaryHTML } from "./summary.js";

export const $ = (s, r) => (r || document).querySelector(s);
export const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
export const val = (v, c) => (typeof v === "function" ? v(c) : v);
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

/* ==================== 状態 ==================== */
export let S = { ch: 1, c: {}, warn: null, info: null, busy: false, stats: { steps: 0, fixes: 0, notes: 0 } };
let hist = [];
let pendingTop = false;
function snap() { hist.push(JSON.stringify(S)); if (hist.length > 300) hist.shift(); }
function undo() { if (!hist.length || S.busy) return; S = JSON.parse(hist.pop()); render(); }
export const C = () => S.c[S.ch];
export const D = () => CH[S.ch];
function cur() { const c = C(), d = D(); return d.steps && c.step >= 1 ? d.steps[c.step - 1] : null; }
export function note() { S.stats.notes++; }

function goChapter(n, opts) {
  if (!CH[n]) return;
  S.ch = n;
  S.c[n] = CH[n].init ? CH[n].init() : { step: 0, vals: {} };
  S.c[n].link = !!(opts && opts.link);
  S.warn = null; S.info = null; S.busy = false;
  if (!(opts && opts.keepHist)) hist = [];
  pendingTop = true;
  if (!(opts && opts.quiet)) render();
}
function start() {
  const d = D(), c = C();
  if (d.onStart) d.onStart(c);
  c.step = 1;
  skipAhead(c);
}
function skipAhead(c) {
  let nx = cur();
  while (nx && nx.skip && nx.skip(c)) { c.step++; S.stats.steps++; nx = cur(); }
}
function finish() {
  const c = C(), st = cur();
  if (st.after) st.after(c);
  c.step++;
  if (D().kind !== "note") S.stats.steps++;
  if (st.go) { goChapter(st.go, { link: true, quiet: true, keepHist: true }); return; }
  skipAhead(c);
}
function resolve(r) {
  if (!r) return;
  if (r === "done") { finish(); return; }
  if (r.wrong) { S.warn = r.wrong; S.stats.fixes++; return; }
  if (r.busy) {
    // テックタッチの自動処理（自動入力など）。「自動処理中です」を見せてから反映する
    const c = C(), ch = S.ch;
    S.busy = true;
    render();
    setTimeout(() => {
      if (S.ch !== ch) return;
      if (r.apply) r.apply(c);
      S.busy = false;
      finish();
      render();
    }, r.busy);
  }
}
function emit(ev) {
  const d = D(), c = C();
  if (!c) return;
  if (ev.kind === "pick") { c.vals[ev.id] = ev.value; c.open = null; }
  if (ev.kind === "open") { c.open = c.open === ev.id ? null : ev.id; }
  if (d.free && d.free(c, ev)) return;
  if (!d.steps) return;
  if (c.step === 0) {
    if (ev.kind === "click" && ev.id === "g-start") start();
    return;
  }
  const st = cur();
  if (!st) return;
  const r = st.handle ? st.handle(c, ev) : null;
  if (r) resolve(r);
  else if (ev.kind === "click" && !st.explain) S.info = "このデモでは、ガイドの順に進めます。いまのステップは「" + st.label + "」です。";
}
function primary() {
  const d = D(), c = C();
  if (S.ch === SUMMARY) return { label: "最初の場面へ", run: () => goChapter(1, { quiet: true }) };
  if (c.step === 0) return { label: d.startLabel || "ガイドを再生する", run: start };
  if (c.step > d.steps.length) return { label: d.nextLabel || "次の場面へ", run: () => goChapter(S.ch + 1, { quiet: true }) };
  const st = cur();
  return { label: st.explain ? "次へ" : "このステップを進める", run: () => resolve(st.auto ? st.auto(C()) : "done") };
}
export function act(name, arg, value) {
  if (S.busy) return;
  if (name === "back") { undo(); return; }
  if (name === "chapter") { goChapter(+arg); return; }
  snap();
  S.warn = null; S.info = null;
  if (name === "next") primary().run();
  else if (name === "fix") { const st = cur(); const fx = st && (typeof st.fix === "function" ? st.fix(C()) : st.fix); if (fx) { fx.run(C()); S.info = null; } }
  else if (name === "stop") S.info = "デモでは、ガイドを停止せずに進めます。";
  else if (name === "click") emit({ kind: "click", id: arg });
  else if (name === "pick") emit({ kind: "pick", id: arg, value });
  else if (name === "open") emit({ kind: "open", id: arg });
  render();
}
// 画面側の都合で状態だけ直す（注記を閉じる等。ガイドの判定は通さない）
export function patch(fn) { if (S.busy) return; fn(C()); render(); }

/* ==================== テックタッチの重ね表示 ==================== */
function crumbs(n) {
  let h = "";
  for (let i = 1; i < n; i++) h += '<span class="tb-prev">' + i + '</span><span class="tb-sep">&gt;</span>';
  return h + '<span class="tb-now">STEP ' + n + "</span>";
}
function balloonHTML() {
  const d = D(), c = C(), st = cur();
  if (!st) return "";
  const noteKind = d.kind === "note";
  const fx = typeof st.fix === "function" ? st.fix(c) : st.fix;
  if (S.warn) {
    return '<div class="tb-head"><span class="tb-warnlab">入力内容を確認してください</span><button type="button" class="tb-x" data-act="stop" aria-label="閉じる">×</button></div>' +
      '<p class="tb-text">' + S.warn + "</p>" +
      (fx ? '<div class="tb-foot"><span></span><button type="button" class="tb-next" data-act="fix" id="tb-fix">' + esc(fx.label) + "</button></div>" : "");
  }
  const sub = val(st.sub, c);
  return '<div class="tb-head"><span class="tb-crumb">' + (noteKind ? '<span class="tb-now">説明 ' + c.step + " / " + d.steps.length + "</span>" : crumbs(c.step)) + "</span>" +
    '<button type="button" class="tb-x" data-act="stop" aria-label="閉じる">×</button></div>' +
    '<p class="tb-title">' + esc(st.label) + "</p>" +
    '<p class="tb-text">' + val(st.tip, c) + "</p>" + (sub ? '<p class="tb-sub">' + sub + "</p>" : "") +
    '<div class="tb-foot">' + (noteKind ? "<span></span>" : '<button type="button" class="tb-stop" data-act="stop"><span class="tb-stop-ic" aria-hidden="true"></span>ガイドを停止</button>') +
    (st.explain ? '<button type="button" class="tb-next" data-act="next" id="tb-next">次へ</button>' : "") + "</div>" +
    '<span class="tb-grip" aria-hidden="true"></span>';
}
function widgetHTML() {
  const d = D(), c = C();
  if (!d.guide) return "";
  let h = "";
  const running = c.step >= 1 && c.step <= d.steps.length;
  if (c.step === 0) {
    // ガイドの入口：リンクから開いたページでは続きのガイド、それ以外はガイド一覧
    const list = (d.guides || [d.guide]).map((g) => g === d.guide
      ? '<li><button type="button" class="tw-item on" data-id="g-start" id="g-start"><span class="tw-play" aria-hidden="true"></span>' + esc(g) + '<span class="tw-tip">ガイドが再生されます</span></button></li>'
      : '<li><span class="tw-item">' + '<span class="tw-play off" aria-hidden="true"></span>' + esc(g) + "</span></li>").join("");
    h += '<div class="tw-pop" id="tw-pop"><div class="tw-pop-head"><b>' + (c.link ? "続きのガイドがあります" : "このページのガイド") + '</b><span class="tb-x" aria-hidden="true">×</span></div>' +
      '<p class="tw-pop-text">' + (c.link ? "前の画面のガイドから開きました。続きを再生します。" : "該当するものを選んでください。") + "</p><ul>" + list + "</ul></div>";
  }
  if (running) {
    h += '<div class="tw-pill" id="tw-pill"><span class="tw-grip" aria-hidden="true"></span><span class="tw-name">' + esc(d.guide) + ' を再生中</span>' +
      '<span class="tw-btn" aria-hidden="true"><i class="ic-stop"></i></span><span class="tw-btn" aria-hidden="true"><i class="ic-list"></i></span></div>';
  } else {
    h += '<div class="tw-fab" aria-hidden="true"><i class="ic-list"></i></div>';
  }
  if (c.step > d.steps.length && d.toast !== false && !c.toastClosed) {
    h += '<div class="tw-toast" role="status" id="tw-toast">ガイドが終了しました<button type="button" class="tw-toast-x" data-act="toastx" aria-label="閉じる">×</button></div>';
  }
  if (S.busy) h += '<div class="tw-busy" role="status"><span class="tw-dots" aria-hidden="true"><i></i><i></i></span><b>自動処理中です<br>操作せずにお待ちください</b></div>';
  return h;
}
function guideTarget() {
  const st = cur(), c = C();
  if (S.ch === SUMMARY || !st || S.busy) return null;
  const sel = val(S.warn && st.warnTarget ? st.warnTarget : st.target, c);
  return sel ? { sel, warn: !!S.warn, explain: !!st.explain } : null;
}
let guide = null, lastKey = "";
const vp = () => $("#viewport");
// 指す先が表示領域の外にあるときは、指す先まで自動でスクロールする（製品のガイドと同じ動き）
function scrollToGuide() {
  const key = S.ch + ":" + (C() ? C().step : 0) + ":" + (guide ? guide.sel : "") + ":" + !!S.warn;
  if (key === lastKey) return;
  lastKey = key;
  const el = guide && $(guide.sel), v = vp();
  if (!el || !v || window.__noAutoScroll) return;
  const r = el.getBoundingClientRect(), vr = v.getBoundingClientRect();
  if (r.top < vr.top + 110 || r.bottom > vr.bottom - 150) v.scrollTop = Math.max(0, v.scrollTop + r.top - vr.top - Math.max(110, (v.clientHeight - r.height) / 2 - 60));
}
export function placeGuide() {
  const v = vp(), inner = $("#vp-inner"), ring = $("#tt-ring"), b = $("#tt-balloon");
  if (!v || !ring) return;
  v.parentNode.style.setProperty("--vp-h", v.clientHeight + "px");
  const el = guide && $(guide.sel);
  let r = el && el.getBoundingClientRect();
  if (!el || !r || (r.width === 0 && r.height === 0)) { ring.hidden = true; b.hidden = true; return; }
  // 開いている一覧（選択肢・候補）があれば、その範囲も含めて囲み、吹き出しが一覧に重ならないようにする
  $$(".sn-options, .spk-menu", el).forEach((m) => {
    const q = m.getBoundingClientRect();
    r = { left: Math.min(r.left, q.left), top: Math.min(r.top, q.top), right: Math.max(r.right, q.right), bottom: Math.max(r.bottom, q.bottom) };
    r.width = r.right - r.left; r.height = r.bottom - r.top;
  });
  const ir = inner.getBoundingClientRect(), vr = v.getBoundingClientRect();
  const pad = 4, x = r.left - ir.left, y = r.top - ir.top;
  ring.hidden = false; b.hidden = false;
  ring.className = "tt-ring" + (guide.warn ? " warn" : "") + (D().kind === "note" ? " note" : "");
  ring.style.cssText = "left:" + (x - pad) + "px;top:" + (y - pad) + "px;width:" + (r.width + pad * 2) + "px;height:" + (r.height + pad * 2) + "px";
  b.className = "tt-balloon" + (guide.warn ? " warn" : "") + (D().kind === "note" ? " note" : "");
  b.innerHTML = balloonHTML();
  // 置ける範囲：横は表示領域の幅、縦はいま見えている範囲（内側の座標）
  const W = v.clientWidth, top0 = vr.top - ir.top + 8, bottom0 = vr.top - ir.top + v.clientHeight - 8;
  b.style.left = "0px"; b.style.top = "0px";
  const bw = b.offsetWidth, bh = b.offsetHeight;
  let left = Math.max(8, Math.min(x + r.width / 2 - bw / 2, W - bw - 8));
  let top = y + r.height + pad + 12, side = "below";
  if (top + bh > bottom0) {
    if (y - pad - 12 - bh > top0 + 40) { top = y - pad - 12 - bh; side = "above"; }
    else if (x + r.width + pad + 16 + bw < W - 8) { left = x + r.width + pad + 16; top = Math.max(top0 + 50, Math.min(y, bottom0 - bh)); side = "right"; }
    else if (x - pad - 16 - bw > 8) { left = x - pad - 16 - bw; top = Math.max(top0 + 50, Math.min(y, bottom0 - bh)); side = "left"; }
    else { top = Math.max(top0 + 50, bottom0 - bh - 70); }
  }
  b.dataset.side = side;
  b.style.left = left + "px"; b.style.top = top + "px";
  if (side === "below" || side === "above") b.style.setProperty("--ax", Math.max(16, Math.min(bw - 16, x + r.width / 2 - left)) + "px");
  else b.style.setProperty("--ay", Math.max(16, Math.min(bh - 16, y + Math.min(r.height / 2, 24) - top)) + "px");
}

/* ==================== 描画 ==================== */
function renderJourney() {
  $("#journey").innerHTML = JOURNEY.map((j) => {
    const st = j[0] < S.ch ? "done" : j[0] === S.ch ? "now" : "todo";
    return '<button type="button" class="jn ' + st + (j[4] ? " gap" : "") + '" data-act="chapter" data-arg="' + j[0] + '"' + (st === "now" ? ' aria-current="step"' : "") + ">" +
      '<span class="no">' + (st === "done" ? "✓" : j[1]) + '</span><span class="jl">' + j[2] + '</span><span class="jt">' + j[3] + "</span></button>";
  }).join("");
}
function renderStory() {
  const d = D();
  const role = d.role ? '<span class="rc ' + d.role + '">' + ROLE[d.role] + "</span>" : "";
  $("#story").innerHTML = '<p class="story-time">' + d.time + "<small>" + d.timeSub + "</small></p><div class=\"story-main\"><h1>" + role + d.title + '</h1><p class="story-text">' + d.text + "</p></div>";
}
function renderCtrl() {
  const d = D(), c = C();
  const steps = (d.steps || []).map((g, i) => { const n = i + 1; return '<li class="' + (n < c.step ? "done" : n === c.step ? "now" : "") + '">' + (n < c.step ? "✓ " : n + ". ") + esc(g.label) + "</li>"; }).join("");
  $("#ctrl").innerHTML = '<div class="ctrl-steps"><span class="ctrl-lab">' + (d.guide ? "ガイド「" + esc(d.guide) + "」" : "説明") + '</span><ol>' + steps + "</ol>" +
    (S.info ? '<p class="ctrl-info" role="status">' + S.info + "</p>" : "") + "</div>" +
    '<div class="ctrl-btns"><button type="button" class="btn ghost" data-act="back"' + (hist.length ? "" : " disabled") + '>戻る</button><button type="button" class="btn primary" data-act="next" id="ctrl-next">' + primary().label + "</button></div>";
}
export function render() {
  const active = document.activeElement, focusId = active && active.id;
  renderJourney();
  renderStory();
  const d = D(), c = C(), summary = S.ch === SUMMARY;
  $("#window").hidden = summary;
  $("#ctrl").hidden = summary;
  $("#summary").hidden = !summary;
  $("#ask").hidden = summary || !d.ask;
  $("#ask-text").textContent = d.ask || "";
  $$("#notes [data-for]").forEach((ul) => { ul.hidden = ul.getAttribute("data-for") !== String(S.ch); });
  if (summary) { $("#summary").innerHTML = summaryHTML(S.stats); guide = null; }
  else {
    renderStage({ ch: S.ch, c, step: c.step, done: c.step > (d.steps ? d.steps.length : 0), stepId: cur() && cur().id, warn: S.warn });
    $("#tt-widget").innerHTML = widgetHTML();
    $("#screen").classList.toggle("dim", !!guideTarget() && D().kind !== "note");
    renderCtrl();
    guide = guideTarget();
  }
  if (!pendingTop) scrollToGuide();
  placeGuide();
  if (focusId) { const f = document.getElementById(focusId); if (f && f !== document.activeElement) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } } }
  if (pendingTop) { const v = vp(); if (v) v.scrollTop = 0; pendingTop = false; }
  try { history.replaceState(null, "", "#s" + S.ch); } catch (e) { /* 表示には影響なし */ }
}

/* ==================== 入力 ==================== */
function toggleNotes() {
  const n = $("#notes"), btn = $("#notes-btn");
  n.hidden = !n.hidden;
  btn.setAttribute("aria-pressed", String(!n.hidden));
}
export function init() {
  mountStage($("#app-root"));
  // 自動テストと動画の撮影で、いまの場面とステップを読むため
  window.__demo = { state: () => ({ ch: S.ch, step: C() ? C().step : 0, steps: D().steps ? D().steps.length : 0, warn: S.warn, busy: S.busy, info: S.info }) };
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-act]");
    if (a) {
      if (a.disabled) return;
      const nm = a.getAttribute("data-act");
      if (nm === "toastx") { patch((c) => { c.toastClosed = true; }); return; }
      act(nm, a.getAttribute("data-arg"));
      return;
    }
    const pk = e.target.closest("[data-pick]");
    if (pk) { const [id, v] = pk.getAttribute("data-pick").split("|"); act("pick", id, v); return; }
    const op = e.target.closest("[data-open]");
    if (op) { act("open", op.getAttribute("data-open")); return; }
    const x = e.target.closest("[data-close-note]");
    if (x) { const k = x.getAttribute("data-close-note"); patch((c) => { c.closed = Object.assign({}, c.closed, { [k]: true }); }); return; }
    const el = e.target.closest("[data-id]");
    if (!el || el.disabled || el.getAttribute("aria-disabled") === "true" || ["SELECT", "INPUT", "TEXTAREA"].includes(el.tagName)) return;
    act("click", el.getAttribute("data-id"));
  });
  $("#notes-btn").addEventListener("click", toggleNotes);
  $("#reset-btn").addEventListener("click", () => goChapter(S.ch));
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
  const later = () => { clearTimeout(timer); timer = setTimeout(placeGuide, 40); };
  window.addEventListener("resize", () => { clearTimeout(timer); timer = setTimeout(render, 150); });
  new ResizeObserver(later).observe($("#app-root"));
  new MutationObserver(later).observe($("#app-root"), { childList: true, subtree: true, attributes: true, characterData: true });
  vp().addEventListener("scroll", () => { clearTimeout(timer); timer = setTimeout(placeGuide, 30); }, { passive: true });
  const m = /^#s(10|[1-9])$/.exec(location.hash || "");
  goChapter(m ? +m[1] : 1);
}
