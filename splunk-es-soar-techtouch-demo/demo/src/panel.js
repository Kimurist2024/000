// テックタッチのパネル（右側）の部品。HTML文字列で組む（テックタッチ側のUIなので Splunk の部品は使わない）
export const $ = (s, r) => (r || document).querySelector(s);
export const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
export function esc(t) { return String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
export function val(v, c) { return typeof v === "function" ? v(c) : v; }
export function guideList(title, text, items) {
  return '<h3 class="ov-title">' + title + '</h3><p class="ov-text">' + text + '</p><ul class="glist">' + items.map((g) =>
    g[2] ? '<li><button type="button" class="gitem" data-id="g-start" id="g-start"><span class="gname">' + g[0] + '</span><span class="gmeta">' + g[1] + "</span></button></li>"
      : '<li><div class="gitem"><span class="gname">' + g[0] + '</span><span class="gmeta">' + g[1] + "</span></div></li>").join("") + "</ul>";
}
export function recList(rows, note) {
  return '<div class="soft"><p><b>記録（例）</b></p><ul class="rec-list">' + rows.map((r) => '<li><span class="t">' + r[0] + "</span><span>" + r[1] + "</span></li>").join("") + "</ul></div>" +
    '<p class="refs">' + (note || "時刻・記録はすべて架空です。") + "</p>";
}
