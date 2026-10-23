// ServiceNow（Next Experience の Polaris テーマ：統合ナビゲーション＋クラシックのリスト・フォーム）の画面イメージ。
// 見た目の手本：ServiceNow 公式ドキュメントの画面写真（インシデントのリスト・フォーム・メモ・アクティビティ）。日本語の表記は L.snow。
// 実画面の写しではない。データはすべて架空。
import React from "react";
import { L, INC, INC_LIST, TASK, TASK_LIST, GROUPS, GROUP_RULES, PEOPLE, FNAME } from "./data.js";
import { TTNote } from "./tt.jsx";

const S = L.snow;

/* ---------- アイコン ---------- */
function Ic({ d, size = 18, w = 1.8 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d={d} fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
const IC = {
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4.3-4.3",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.6 2.6 0 1 1 3.4 2.5c-.6.3-.9.8-.9 1.5M12 17h.01",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z",
  chat: "M4 5h11v8H8l-4 3zM9 16h7l4 3V9h-3",
  window: "M3 5h18v14H3zM3 9h18M14 13l5 5M14 13v4M14 13h4",
  back: "M15 5l-7 7 7 7",
  menu: "M4 7h16M4 12h16M4 17h16",
  clip: "M20 11.5 12.3 19.2a5 5 0 0 1-7.1-7.1l8-8a3.4 3.4 0 0 1 4.8 4.8l-8 8a1.7 1.7 0 0 1-2.4-2.4l7.3-7.3",
  pulse: "M3 12h4l3-7 4 14 3-7h4",
  sliders: "M4 7h10M18 7h2M4 12h4M12 12h8M4 17h12M20 17h0M14 5v4M8 10v4M16 15v4",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  up: "M12 19V5M6 11l6-6 6 6",
  down: "M12 5v14M6 13l6 6 6-6",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
  addusr: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M17 8v6M14 11h6",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z",
  filter: "M4 5h16l-6 8v6l-4 2v-8z",
  copy: "M8 8h11v13H8zM5 16V3h11",
  tree: "M6 4h4v4H6zM14 16h4v4h-4zM14 9h4v4h-4zM8 8v10h6M8 11h6",
  resp: "M5 4h14v4H5zM5 10h14v4H5zM8 16h8l-4 4z"
};

/* 選択欄（choice）：開くと一覧が出る。参照欄（reference）：入力すると候補が出る */
function Choice({ id, value, options, c }) {
  const open = c.open === id;
  return (
    <span className={"sn-choice" + (open ? " open" : "")} id={"f-" + id}>
      <button type="button" className="sn-select" data-open={id} aria-haspopup="listbox" aria-expanded={open}>{value || S.none}<span className="caret" aria-hidden="true" /></button>
      {open && <span className="sn-options" role="listbox">{options.map((o) => <button type="button" role="option" key={o} aria-selected={o === value} className={o === value ? "sel" : ""} data-pick={id + "|" + o}>{o}</button>)}</span>}
    </span>
  );
}
function RefPick({ id, value, options, c }) {
  const open = c.open === id;
  return (
    <span className={"sn-ref" + (open ? " open" : "")} id={"f-" + id}>
      <button type="button" className="sn-input refbtn" data-open={id}>{value}</button>
      <span className="sn-sqbtn" aria-hidden="true"><Ic d={IC.search} size={16} /></span>
      {open && <span className="sn-options typeahead" role="listbox">{options.map((o) => <button type="button" role="option" key={o} data-pick={id + "|" + o}><b>{o}</b><small>グループ</small></button>)}</span>}
    </span>
  );
}
function Field({ label, req, children, wide, id, link }) {
  return (
    <div className={"sn-field" + (wide ? " wide" : "")} id={id}>
      <label className={"sn-label" + (link ? " link" : "")}>{req && <span className="req" aria-hidden="true">✳</span>}{label}</label>
      <div className="sn-ctl">{children}</div>
    </div>
  );
}
const Ro = ({ v, gray }) => <span className={"sn-input" + (gray ? " gray" : "")}>{v}</span>;
const Sel = ({ v }) => <span className="sn-select ro">{v}<span className="caret" aria-hidden="true" /></span>;
function Ref({ v, info, ph }) {
  return <span className="sn-refrow"><span className="sn-ref"><span className={"sn-input" + (v ? "" : " ph")}>{v || ph || ""}</span><span className="sn-sqbtn" aria-hidden="true"><Ic d={IC.search} size={16} /></span></span>{info && <span className="sn-sqbtn solo" aria-hidden="true"><Ic d={IC.info} size={16} /></span>}</span>;
}

/* ---------- 統合ナビゲーション ---------- */
function Header({ c, ch, title }) {
  const ttLabel = ch >= 7 ? "定期作業の手順" : "切り分けの手順";
  const showTT = c.view === "inc-form" || c.view === "task-form";
  const user = ch >= 7 ? PEOPLE.kiban : PEOPLE.night;
  return (
    <div className="sn-header">
      <span className="sn-logo" aria-label="servicenow">servicen<span className="o">o</span>w</span>
      <nav className="sn-menus"><span>{S.all}</span><span>{S.fav}</span><span>{S.hist}</span><span>{S.ws}</span><span className="kebab">⋮</span></nav>
      <span className="sn-pill"><span className="t">{title}</span><span className="st"><Ic d={IC.star} size={15} /></span></span>
      <span className="sn-right">
        {showTT && <button type="button" className="tt-hdr" id="tt-hdr" data-id="tt-hdr"><span className="lens"><Ic d={IC.search} size={14} w={2.4} /></span>{ttLabel}</button>}
        <span className="sn-gsearch"><span className="q"><Ic d={IC.search} size={16} />{S.search}</span><span className="dd" aria-hidden="true">▾</span></span>
        <span className="sn-ic"><Ic d={IC.globe} /></span><span className="sn-ic"><Ic d={IC.chat} /></span><span className="sn-ic"><Ic d={IC.window} /></span><span className="sn-ic"><Ic d={IC.help} /></span>
        <span className="sn-ic bell"><Ic d={IC.bell} /><span className="badge">1</span></span>
        <span className="sn-avatar" aria-label={user}>{user.slice(0, 1)}</span>
      </span>
      {c.pop && showTT && <LinkPop ch={ch} />}
    </div>
  );
}
function LinkPop({ ch }) {
  const links = ch >= 7
    ? [["tt-link-report", "① 稼働統計のレポートを開く"], ["", "② 添付とクローズ"], ["", "③ 報告先の一覧"]]
    : [["tt-link-itsi", "① ITSIでエピソードを見る"], ["", "② 保存済みサーチで裏付ける"], ["", "③ 有識者に引き継ぐ"]];
  return (
    <div className="tt-linkpop" id="tt-linkpop" style={{ right: 330, top: 54 }}>
      <span className="x" aria-hidden="true">×</span>
      <p>{ch >= 7 ? "定期作業の手順です。該当するものを選んでください。" : "このインシデントの切り分けの手順です。上から順に進めてください。"}</p>
      <div className="links">{links.map(([id, t]) => id
        ? <button type="button" key={t} className="tt-link" id={id} data-id={id}>{t}<span className="tw-tip">ガイドが再生されます</span></button>
        : <span key={t} className="tt-link off">{t}</span>)}</div>
    </div>
  );
}

/* ---------- リスト ---------- */
function ListView({ kind }) {
  const isInc = kind === "inc";
  const rows = isInc ? INC_LIST : TASK_LIST;
  const cols = isInc ? [S.number, S.opened, S.short, S.priority, S.state, S.group, S.assignee] : [S.number, S.opened, S.short, S.priority, S.state, S.group, S.assignee, S.due];
  return (
    <div className="sn-list">
      <div className="sn-listhead">
        <span className="sn-ic"><Ic d={IC.menu} /></span><span className="sn-ic"><Ic d={IC.filter} size={17} /></span><span className="sn-ic"><Ic d={IC.chat} size={17} /></span>
        <b className="sn-listtitle">{isInc ? S.incidents : S.tasks}</b>
        <span className="sn-select sm">{S.number}<span className="caret" aria-hidden="true" /></span>
        <span className="sn-input sm search">{S.search}</span>
        <span className="sn-lr"><span className="sn-ic accent"><Ic d={IC.pulse} /></span><span className="sn-ic accent"><Ic d={IC.gear} size={17} /></span><span className="sn-select sm wide">{S.actionsOnRows}<span className="caret" aria-hidden="true" /></span><span className="sn-btn new">{S.newBtn}</span></span>
      </div>
      <div className="sn-crumbs">{S.all} &gt; {S.group} = {isInc ? "運用当番" : "運用基盤チーム"} &gt; {S.active} = true</div>
      <table className="sn-table">
        <thead><tr><th className="cb"><span className="sn-cb" /></th><th className="cb"><Ic d={IC.search} size={14} /></th>{cols.map((h, i) => <th key={h}>{h}{i === 0 && <span className="sort"> ▾</span>}</th>)}</tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r[0]} id={"sn-row-" + r[0]}>
            <td className="cb" /><td className="cb" />
            <td><button type="button" className="sn-num lnk" data-id={r[0] === "INC0012847" ? "sn-open-inc" : r[0] === "TASK0004211" ? "sn-open-task" : "sn-other"}>{r[0]}</button></td>
            {r.slice(1).map((v, i) => <td key={i}>{i === 2 && v.startsWith("1") && <span className="dot" aria-hidden="true" />}{i === 4 || i === 5 ? (v ? <span className="lnk">{v}</span> : S.empty) : v}</td>)}
          </tr>
        ))}</tbody>
      </table>
      <div className="sn-pager"><span>◂◂</span><span>◂</span><span className="pg">1</span><span>から {rows.length} / {rows.length}</span><span>▸</span><span>▸▸</span></div>
    </div>
  );
}

/* ---------- フォーム ---------- */
function FormHead({ title, num, kind }) {
  return (
    <div className="sn-formhead">
      <span className="sn-backbtn"><Ic d={IC.back} /></span>
      <span className="sn-ic"><Ic d={IC.menu} /></span>
      <span className="sn-ftitle"><b>{title}</b><b>{num}</b></span>
      <span className="sn-fbtns">
        <span className="sn-ic"><Ic d={IC.clip} /></span><span className="sn-ic"><Ic d={IC.pulse} /></span><span className="sn-ic"><Ic d={IC.sliders} /></span><span className="sn-ic"><Ic d={IC.more} /></span>
        {kind === "inc" && <span className="sn-btn">{S.discuss}</span>}
        <span className="sn-btn">{S.follow}</span>
        <button type="button" className="sn-btn" id="sn-update" data-id="sn-update">{S.update}</button>
        {kind === "inc" && <span className="sn-btn">{S.resolve}</span>}
        <span className="sn-btn">{S.del}</span>
        {kind === "inc" && <span className="sn-btn">{S.responses}</span>}
        <span className="sn-ic dim"><Ic d={IC.up} /></span><span className="sn-ic"><Ic d={IC.down} /></span>
      </span>
    </div>
  );
}
function Journal({ c }) {
  const notes = c.notes || [];
  const wn = !!c.vals.wn;
  const label = wn ? S.worknotes : S.comments;
  return (
    <div className="sn-journal">
      <div className="sn-jrow two">
        <div className="sn-field"><label className="sn-label">{S.watch}</label><div className="sn-ctl"><span className="sn-sqbtn solo"><Ic d={IC.lock} size={16} /></span><span className="sn-sqbtn solo"><Ic d={IC.addusr} size={16} /></span>{c.vals.watch && <span className="sn-chip">{c.vals.watch}</span>}</div></div>
        <div className="sn-field"><label className="sn-label">{S.wnList}</label><div className="sn-ctl"><span className="sn-sqbtn solo"><Ic d={IC.lock} size={16} /></span><span className="sn-sqbtn solo"><Ic d={IC.addusr} size={16} /></span>{c.vals.wnList && <span className="sn-chip">{c.vals.wnList}</span>}</div></div>
      </div>
      <div className="sn-field wide jr" id="f-worknotes">
        <label className="sn-label">{label}<button type="button" className="tt-ins" id="tt-tpl" data-id="tt-tpl">テンプレートの挿入</button></label>
        <div className="sn-ctl"><div className={"sn-ta" + (wn ? " wn" : "") + (c.vals.worknotes ? "" : " ph")}>{c.vals.worknotes || label}</div><span className="sn-sqbtn solo tall" aria-hidden="true"><Ic d={IC.resp} size={16} /></span></div>
        {notes.includes("comments") && !c.closed.comments && <TTNote k="comments" cls="pt-down" style={{ left: 380, top: -70 }} text="「作業メモ」にチェックが無いと、顧客に表示されるコメントになります。" small="社内向けの記録は、チェックを入れてから書きます。" />}
      </div>
      <div className="sn-postrow">
        <button type="button" className="sn-chk" id="sn-wn" data-id="sn-wn"><span className={"sn-cb" + (wn ? " on" : "")}>{wn ? "✓" : ""}</span>{S.worknotes}</button>
        <button type="button" className="sn-btn post" id="sn-post" data-id="sn-post">{S.post}</button>
      </div>
    </div>
  );
}
const ENTRIES = {
  monitor: ["監視連携", "2026-10-21 22:41:09", "fc", [[S.state, "新規"], [S.priority, "2 - 高"], [S.group, "運用当番"], [S.openedBy, "監視連携"]]],
  state1: [PEOPLE.night, "2026-10-21 22:44:02", "fc", [[S.state, S.states[1] + "  " + S.was + "  " + S.states[0]]]],
  sokuho: [PEOPLE.night, "2026-10-21 22:45:31", "wn", "sokuho"],
  kiriwake: [PEOPLE.night, "2026-10-21 22:58:04", "wn", "kiriwake"],
  task0: ["システム", "2026-11-01 00:00:05", "fc", [[S.state, S.tstates[0]], [S.group, "運用基盤チーム"]]],
  tstate1: [PEOPLE.kiban, "2026-11-04 09:33:40", "fc", [[S.state, S.tstates[1] + "  " + S.was + "  " + S.tstates[0]]]],
  monthly: [PEOPLE.kiban, "2026-11-04 09:48:22", "wn", "monthly"],
  attach: [PEOPLE.kiban, "2026-11-04 09:47:10", "att", FNAME + ".csv（1.2 KB）"]
};
function Activity({ c, kind, texts }) {
  const list = (c.posted || []).slice().reverse();
  const items = kind === "task" ? [...list, ...(c.attached ? ["attach"] : []), "task0"] : [...list, ...(c.st1 ? ["state1"] : []), "monitor"];
  return (
    <div className="sn-activity">
      <label className="sn-label">{S.activities}：{items.length}</label>
      <div className="sn-acts">
        {items.map((k, i) => { const e = ENTRIES[k]; const tag = e[2] === "wn" ? S.worknotes : e[2] === "att" ? S.attachment : S.fieldChanges; return (
          <div className={"sn-entry " + e[2]} key={k + i}>
            <div className="sn-emeta"><span className="sn-avatar sm">{e[0].slice(0, 1)}</span><span className="nm">{e[0]}</span><span className="sn-etag">{tag}　•　{e[1]}</span></div>
            {e[2] === "fc" ? <dl className="sn-echg">{e[3].map(([a, b]) => <React.Fragment key={a}><dt>{a}</dt><dd>{b}</dd></React.Fragment>)}</dl>
              : e[2] === "att" ? <p className="sn-etext att"><Ic d={IC.clip} size={14} />{e[3]}</p>
              : <pre className="sn-etext">{texts[e[3]]}</pre>}
          </div>
        ); })}
      </div>
      <span className="sn-sqbtn solo" aria-hidden="true"><Ic d={IC.filter} size={16} /></span>
    </div>
  );
}

function IncForm({ c, ch, texts }) {
  const notes = c.notes || [];
  const groupOpts = GROUPS.map((g) => g[1]);
  return (
    <div className="sn-form">
      <FormHead title={S.incident} num={INC.number} kind="inc" />
      {c.saved && <div className="sn-msg ok">{S.incident} {INC.number} を更新しました</div>}
      {(c.notes || []).includes("contact") && !c.closed.contact && <TTNote k="contact" cls="pt-none" style={{ right: 12, top: 120, width: 190 }} text="業務部門への連絡は、インシデントコマンダー経由です。当番からは直接連絡しません。" />}
      {(c.notes || []).includes("vendor") && !c.closed.vendor && <TTNote k="vendor" cls="pt-none" style={{ right: 12, top: 250, width: 190 }} text="ベンダーへの調査依頼は、有識者が判断します。" small="（A社の決まり・架空）" />}
      <div className="sn-fbody">
        <div className="sn-cols">
          <div className="sn-col">
            <Field label={S.number}><Ro v={INC.number} /></Field>
            <Field label={S.caller} req><Ref v={INC.caller} info /></Field>
            <Field label={S.category}><Sel v={INC.category} /></Field>
            <Field label={S.subcategory}><Sel v={S.none} /></Field>
            <Field label={S.service}><Ref v={INC.service} /></Field>
            <Field label={S.offering}><Ref v="" /></Field>
            <Field label={S.ci}><Ref v={INC.ci} /></Field>
          </div>
          <div className="sn-col">
            <Field label={S.channel}><Sel v={INC.channel} /></Field>
            <Field label={S.state} id="row-state"><Choice id="state" value={c.vals.state} options={S.states} c={c} /></Field>
            <Field label={S.impact}><Sel v={INC.impact} /></Field>
            <Field label={S.urgency}><Sel v={INC.urgency} /></Field>
            <Field label={S.priority} link><Ro v={INC.priority} gray /></Field>
            <Field label={S.group} id="row-group">
              <span className="sn-refrow"><RefPick id="group" value={c.vals.group || "運用当番"} options={groupOpts} c={c} /><button type="button" className="tt-q" id="tt-q-group" data-id="tt-q-group" aria-label="アサイン先グループの選び方">?</button><span className="sn-sqbtn solo" aria-hidden="true"><Ic d={IC.info} size={16} /></span></span>
              {c.crit && <div className="tt-crit" style={{ right: "calc(100% - 140px)", top: -6 }}><div className="hd">アサイン先グループの選び方です<span aria-hidden="true">×</span></div><table><tbody>{GROUP_RULES.map((r) => <tr key={r[1]}><td>{r[0]}</td><td>{r[1]}</td></tr>)}</tbody></table></div>}
            </Field>
            <Field label={S.assignee}><span className="sn-autorow"><Ref v={c.vals.assignee === undefined ? "" : c.vals.assignee} info />{ch === 6 && <button type="button" className="tt-ins" id="tt-auto" data-id="tt-auto">通知先と担当を自動入力</button>}</span></Field>
          </div>
        </div>
        <Field label={S.short} req wide><span className="sn-refrow full"><span className="sn-input wide">{INC.short}</span><span className="sn-sqbtn solo" aria-hidden="true"><Ic d={IC.bulb} size={16} /></span></span></Field>
        <Field label={S.desc} wide><div className="sn-ta ro desc">{INC.desc}</div></Field>
        <div className="sn-rsr"><span className="sn-btn">{S.relatedSearch} ›</span></div>
      </div>
      <div className="sn-section">
        <div className="sn-tabs"><span className="on">{S.notes}</span><span>{S.related}</span><span>{S.resolution}</span></div>
        <div className="sn-tabpanel">
          <Journal c={c} />
          <Activity c={c} kind="inc" texts={texts} />
        </div>
      </div>
    </div>
  );
}
function TaskForm({ c, ch, texts }) {
  const notes = c.notes || [];
  return (
    <div className="sn-form">
      <FormHead title={S.task} num={TASK.number} kind="task" />
      {c.saved && <div className="sn-msg ok">{S.task} {TASK.number} を更新しました</div>}
      <div className="sn-fbody">
        <div className="sn-cols">
          <div className="sn-col">
            <Field label={S.number}><Ro v={TASK.number} /></Field>
            <Field label={S.group}><Ref v={TASK.group} info /></Field>
            <Field label={S.assignee}><Ref v={PEOPLE.kiban} info /></Field>
          </div>
          <div className="sn-col">
            <Field label={S.state} id="row-tstate"><Choice id="tstate" value={c.vals.tstate} options={S.tstates} c={c} /></Field>
            <Field label={S.priority}><Sel v="4 - 低" /></Field>
            <Field label={S.due}><Ro v={TASK.due} /></Field>
          </div>
        </div>
        <Field label={S.short} req wide><span className="sn-input wide">{TASK.short}</span></Field>
        <Field label={S.desc} wide id="f-desc"><div className="sn-ta ro desc">{TASK.desc}</div>
          {notes.includes("oldreport") && !c.closed.oldreport && <TTNote k="oldreport" cls="pt-left" style={{ left: "calc(100% - 340px)", top: 10 }} text="レポートは「稼働統計_月次_全システム」を使います。" small="2026年4月に代理店ポータルを追加しました（架空）。" />}
        </Field>
        <div className="sn-attachrow" id="sn-attach-row">
          <button type="button" className="sn-attachbtn" id="sn-attach" data-id="sn-attach"><Ic d={IC.clip} size={15} />{S.attach}</button>
          {c.attached && <span className="sn-file"><Ic d={IC.clip} size={13} />{FNAME}.csv<small>1.2 KB</small></span>}
          {notes.includes("rows") && !c.closed.rows && <TTNote k="rows" cls="pt-left" style={{ left: 470, top: -10 }} text="行数がサービス数（10）と合わないときは、クローズせず運用基盤リーダーに連絡します。" small="（A社の決まり・架空）" />}
        </div>
      </div>
      <div className="sn-section">
        <div className="sn-tabs"><span className="on">{S.notes}</span><span>{S.related}</span></div>
        <div className="sn-tabpanel"><Journal c={c} /><Activity c={c} kind="task" texts={texts} /></div>
      </div>
    </div>
  );
}

export function SnowApp({ c, ch, texts }) {
  const title = c.view === "inc-list" ? S.incidents : c.view === "inc-form" ? S.incident + " - " + INC.number : c.view === "task-list" ? S.tasks : S.task + " - " + TASK.number;
  return (
    <div className="sn-app">
      <Header c={c} ch={ch} title={title} />
      <div className="sn-main">
        {c.view === "inc-list" && <ListView kind="inc" />}
        {c.view === "task-list" && <ListView kind="task" />}
        {c.view === "inc-form" && <IncForm c={c} ch={ch} texts={texts} />}
        {c.view === "task-form" && <TaskForm c={c} ch={ch} texts={texts} />}
      </div>
    </div>
  );
}
