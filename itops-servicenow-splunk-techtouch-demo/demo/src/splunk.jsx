// Splunk Cloud（ITSI と サーチとレポート）の画面イメージ。Splunk 公式の UI ツールキット（@splunk/react-ui・@splunk/react-time-range・@splunk/react-search、Apache-2.0）で組む。
// 見た目の手本：Splunk 公式の公開リポジトリにある ITSI 5.0 の画面写真（2026年9月、Modern navigation・ダーク）と、サーチ画面の画面写真（ダーク）。
// Splunk Cloud Platform 10.4.2604 以降は Modern navigation（上のヘッダー＋左の縦のメニュー）で、元の表示には戻せない（Splunk のリリースノート）。
// 実画面の写しではない。データはすべて架空。
import React from "react";
import Magnifier from "@splunk/react-icons/Magnifier";
import TimeRangeDialog from "@splunk/react-time-range/Dialog";
import { Input as SearchInput } from "@splunk/react-search";
import { act } from "./engine.js";
import { L, SEV, SERVICES, KPIS, EPISODES, LANES, SAVED, RANGES, RESULTS, REPORTS, MONTHLY, FNAME, PEOPLE } from "./data.js";
import { TTNote, TTLink } from "./tt.jsx";

const I = L.itsi, P = L.sp;
const sevColor = (s) => SEV[s][1];

/* ---------- アイコン（線画。Modern navigation の画面写真の形に合わせる） ---------- */
function Ic({ d, s = 20, w = 1.8 }) { return <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><path d={d} fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" /></svg>; }
const D = {
  menu: "M4 6h16M4 12h16M4 18h16",
  home: "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
  tree: "M12 4v5M12 9a2 2 0 1 0 0-.1M6 20a2 2 0 1 0 0-.1M18 20a2 2 0 1 0 0-.1M12 11v3M6 18v-2h12v2",
  chart: "M4 19l5-6 4 3 7-9M4 4v16h16",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0",
  layout: "M4 5h16v14H4zM4 9h16M10 9v10",
  lines: "M5 7h14M8 12h11M5 17h9",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4.3-4.3",
  pulse: "M3 12h4l3-7 4 14 3-7h4",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.6 2.6 0 1 1 3.4 2.5c-.6.3-.9.8-.9 1.5M12 17h.01",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  check: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6",
  dataset: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  report: "M6 3h9l4 4v14H6zM9 13h6M9 17h6M9 9h3",
  alert: "M12 4l9 16H3zM12 10v4M12 17h.01",
  dash: "M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z",
  analytics: "M5 19V10M10 19V5M15 19v-7M20 19V8",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  expand: "M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7",
  ext: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"
};

/* ---------- Modern navigation：ヘッダーと左のメニュー ---------- */
function Header({ user }) {
  return (
    <div className="mn-header">
      <span className="mn-logo" aria-label="splunk>Cloud"><b>splunk</b><i>&gt;</i><em>Cloud</em></span>
      <span className="mn-right">
        <span className="mn-ok"><Ic d={D.check} s={22} /></span>
        <span className="mn-ic"><Ic d={D.search} s={22} /></span>
        <span className="mn-ic"><Ic d={D.pulse} s={22} /></span>
        <span className="mn-ic"><Ic d={D.gear} s={22} /></span>
        <span className="mn-ic bell"><Ic d={D.bell} s={22} /><span className="mn-badge">2</span></span>
        <span className="mn-ic"><Ic d={D.help} s={22} /></span>
        <span className="mn-sep" />
        <span className="mn-user"><Ic d={D.user} s={20} />{user}<span className="cr">▾</span></span>
        <span className="mn-waffle" aria-hidden="true">{Array.from({ length: 9 }).map((_, i) => <i key={i} />)}</span>
      </span>
    </div>
  );
}
function Rail({ app, items, active }) {
  return (
    <nav className="mn-rail" aria-label="ナビゲーション">
      <span className="mn-rail-i"><Ic d={D.menu} s={20} /></span>
      <span className={"mn-appbadge " + app}>{app === "itsi" ? "ITSI" : "S&R"}</span>
      {items.map(([key, icon, label]) => (
        <button type="button" key={key} id={"nav-" + key} data-id={"nav-" + key} className={"mn-rail-i" + (active === key ? " on" : "")} aria-label={label} title={label}>
          <Ic d={D[icon]} s={21} /><span className="mn-tip">{label}</span>
        </button>
      ))}
    </nav>
  );
}
function Shell({ app, items, active, user, children }) {
  return (
    <div className={"spk-app mn " + app}>
      <Header user={user} />
      <div className="mn-body"><Rail app={app} items={items} active={active} /><div className="mn-page">{children}</div></div>
    </div>
  );
}
const ITSI_NAV = [["home", "home", "Home"], ["sa", "tree", I.nav[0]], ["entity", "chart", I.nav[1]], ["episodes", "bell", I.nav[2]], ["glass", "layout", I.nav[3]], ["deep", "lines", I.nav[4]], ["dash", "grid", I.nav[5]], ["config", "gear", I.nav[6]], ["search", "search", I.nav[7]]];
const SR_NAV = [["s-search", "search", P.nav[0]], ["s-analytics", "analytics", P.nav[1]], ["s-datasets", "dataset", P.nav[2]], ["s-reports", "report", P.nav[3]], ["s-alerts", "alert", P.nav[4]], ["s-dash", "dash", P.nav[5]]];

/* ---------- 共通の部品 ---------- */
function Btn({ children, id, menu, disabled, cls }) {
  return <button type="button" className={"spk-btn" + (cls ? " " + cls : "")} id={id} data-id={id} disabled={disabled}>{children}{menu && <span className="cr">▾</span>}</button>;
}
function TitleRow({ title, left, right }) {
  return <div className="spk-titlerow"><span className="spk-tl">{left}<h2 className="spk-h2">{title}</h2>{title && <span className="spk-pencil" aria-hidden="true">✎</span>}</span><span className="spk-right">{right}</span></div>;
}
function Spark({ up, w = 150, h = 26, color = "#fff" }) {
  const pts = up ? "0,20 20,18 30,21 40,17 50,20 60,16 70,19 80,15 90,18 100,6 110,9 120,4 130,8 140,5 " + (w - 2) + ",6" : "0,22 " + (w * 0.62) + ",22 " + (w * 0.66) + ",8 " + (w - 2) + ",8";
  return <svg className="spark" width={w} height={h} viewBox={"0 0 " + w + " " + h} aria-hidden="true"><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" /><circle cx={w - 3} cy={up ? 6 : 8} r="2.2" fill={color} /></svg>;
}
const ExtIc = () => <span className="ext"><Ic d={D.ext} s={13} w={2} /></span>;

/* ---------- ITSI：Episode Review（Alerts and Episodes） ---------- */
function EpisodeTable({ c }) {
  return (
    <div className="ep-table" id="ep-table">
      <table className="itsi-table">
        <thead><tr><th className="cb"><span className="cbx" /></th><th>Title</th><th>Time</th><th>Owner</th><th>Severity</th><th>Status</th><th>All Tickets</th></tr></thead>
        <tbody>{EPISODES.map((r) => {
          const isMain = r[0] === "ep1";
          return (
            <tr key={r[0]} id={"ep-row-" + r[0]} data-id={isMain ? "ep-open" : "ep-other"}>
              <td className="cb"><span className="ep-stripe" style={{ background: sevColor(r[1]) }} /><span className="cbx" /></td>
              <td className="ttl"><span className="lnk">{r[2]}</span></td><td className="nw">{r[5]}</td>
              <td>{r[4] === "unassigned" ? "Unassigned" : r[4]}</td>
              <td className="nw"><span className="sev-sq" style={{ background: sevColor(r[1]) }} />{SEV[r[1]][0]}</td>
              <td>{r[3]}</td><td>{r[7] ? <span className="lnk">{r[7]}</span> : ""}</td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  );
}
function Timeline() {
  // Sort for: Root cause analysis（最初に起きたアラートが上）
  const rows = [["nw-core-02：DC間リンク 再送の増加", "high", [8, 14, 22, 30, 41]], ["mq-gw-01：MQRC 2009 接続の切断", "critical", [10, 17, 25, 38]], ["ap-online-03：連携応答待ちのタイムアウト", "critical", [11, 19, 27, 36, 47, 58]], ["portal-web-02：HTTP 504 の増加", "high", [24, 33, 49, 62]], ["ap-online-03：CPU使用率 92%", "medium", [44, 70]]];
  return (
    <div className="ep-pane" id="ep-timeline">
      <div className="ep-ctrls"><span>Sort for</span><Btn menu>Root cause analysis</Btn><span>View by</span><Btn menu>Events</Btn><Btn menu>Add filter</Btn></div>
      <div className="ep-chips"><span className="chip dk">All Events: 47</span><span className="chip pk">Critical events: 31</span><span className="chip pk">Critical CIs: 2</span><span className="chip dk">Flapping alerts detection: 0</span></div>
      <div className="ep-card" id="ep-tl-card">
        <div className="ep-card-h"><b>Events</b><span className="kebab">⋮</span></div>
        <div className="ep-tl"><span className="ep-tl-h">Events</span>
          {rows.map((r) => <div className="ep-tl-row" key={r[0]}><span className="lnk">{r[0]}</span><span className="ep-tl-track">{r[2].map((x, i) => <i key={i} style={{ left: x + "%", background: sevColor(r[1]) }}>{i === 0 && r[1] !== "medium" ? "" : ""}</i>)}</span></div>)}
          <div className="ep-tl-axis"><span>Wed, Oct 21<br />2026</span><span>10:32 PM</span><span>10:36 PM</span><span>10:40 PM</span><span>10:44 PM</span><span>10:48 PM</span></div>
        </div>
        <p className="ep-legend">Legend: <span><i style={{ background: sevColor("medium") }} />Medium</span><span><i style={{ background: sevColor("high") }} />High</span><span><i style={{ background: sevColor("critical") }} />Critical</span></p>
      </div>
    </div>
  );
}
function EpisodeDetail({ c }) {
  const ep = EPISODES[0];
  const status = c.vals.epstatus || I.statuses[0];
  return (
    <section className="ep-detail" id="ep-detail" aria-label="Episode details">
      <div className="ep-dbar">
        <span className="spk-tl"><Btn>» Show list</Btn><span id="ep-ack" className="ep-ackwrap"><button type="button" className="spk-btn ack" data-id="ep-ack" disabled={!!c.acked}>{c.acked ? "Assign to me" : I.ack}</button></span></span>
        <span className="spk-right">
          <Btn menu>{c.acked ? PEOPLE.night : "Unassigned"}</Btn>
          <Btn menu><span className="sev-sq" style={{ background: sevColor("critical") }} />Critical</Btn>
          <span className="spk-dd" id="f-epstatus">
            <button type="button" className="spk-btn" data-open="epstatus">{status}<span className="cr">▾</span></button>
            {c.open === "epstatus" && <span className="spk-menu" role="menu">{I.statuses.map((s) => <button type="button" role="menuitem" key={s} className={s === status ? "sel" : ""} data-pick={"epstatus|" + s}>{s}</button>)}</span>}
          </span>
          <Btn menu>{I.actions}</Btn>
          <span className="ep-x" aria-hidden="true">✕</span>
        </span>
      </div>
      <div className="ep-dhead">
        <h3>{ep[2]}</h3>
        <p>10/21/2026 10:31:20 PM - 10/21/2026 10:46:58 PM</p>
        <p>オンライン滞留件数 Critical、応答時間（p95） High。関連するアラート 47 件。</p>
        <p>Notable Event Count: {ep[6]}　Aggregation Policy: <span className="lnk u">契約照会オンライン（KPI集約）</span> <ExtIc />　|　<span className="lnk u">Explain Correlations</span>　|　Apps: <span className="lnk u">基盤監視 ({ep[6]})</span></p>
      </div>
      <div className="ep-tabs" role="tablist">{I.tabs.map((t) => <button type="button" role="tab" key={t} id={"ep-tab-" + t.replace(/ /g, "_")} aria-selected={t === "Events Timeline"} className={t === "Events Timeline" ? "on" : ""}>{t}</button>)}<span className="addtab">＋ Add Tab</span></div>
      <Timeline />
    </section>
  );
}
function EpisodeReview({ c }) {
  return (
    <div className="ep-page">
      <TitleRow title="Episode Review" left={<span className="sq-btn"><Ic d={D.list} s={16} /></span>} right={<><Btn>Share</Btn><Btn>⚙ Settings</Btn><Btn>Save new...</Btn><Btn>Save</Btn><Btn cls="sq"><Ic d={D.expand} s={14} /></Btn></>} />
      <div className="spk-filter"><span className="ep-n">{EPISODES.length} episodes</span><span className="spk-input grow"><Magnifier />Search</span><Btn menu>Last 24 hours</Btn><Btn menu>Display time as: Latest Event</Btn><Btn menu>Add filter</Btn></div>
      <div className="spk-divider" />
      {c.ep ? <EpisodeDetail c={c} /> : <EpisodeTable c={c} />}
    </div>
  );
}

/* ---------- ITSI：Service Analyzer ---------- */
function SaFilters({ tree }) {
  return (
    <div className="sa-filters">
      <span className="flab">Filter services</span><span className="spk-input sm">{tree ? <span className="chip-x">契約照会オンライン ✕</span> : <span className="ph">Select services to monitor</span>}</span>
      {!tree && <><span className="flab">Filter KPIs</span><span className="spk-input sm"><span className="ph">Select KPIs to monitor</span></span></>}
      <span className="flab">Filter by tags</span><span className="spk-input sm"><span className="ph">Select tags</span></span>
      <Btn menu>Created By: All</Btn>
      {tree ? <><Btn menu><span className="sq0" />Minimum Severity: None</Btn><Btn menu>Maximum Depth: All</Btn></> : <><label className="chk"><span className="cbx" /><span className="flab">Show disabled services</span></label><label className="chk"><span className="cbx on">✓</span><span className="flab">Show service dependencies</span></label></>}
    </div>
  );
}
function ViewToggle({ c }) {
  return (
    <span className="sa-view">
      <span className="sa-view-r1"><Btn menu>KPI Value: Aggregate</Btn>{c.sa !== "tree" && <Btn menu>Tile Size: Large</Btn>}</span>
      <span className="sa-view-r2"><span className="vlab">View</span><span className="sa-toggle"><button type="button" id="sa-tree" data-id="sa-tree" className={c.sa === "tree" ? "on" : ""}><Ic d={D.tree} s={14} w={2} />{I.tree}</button><button type="button" className={c.sa !== "tree" ? "on" : ""}><Ic d={D.grid} s={13} w={2} />{I.tile}</button></span></span>
    </span>
  );
}
function CountBar({ list, total }) {
  const order = ["critical", "high", "medium", "low", "normal"];
  const cnt = order.map((s) => [s, list.filter((x) => x === s).length]).filter((x) => x[1]);
  return (<><div className="cnt-row">{cnt.map(([s, n]) => <span key={s}><i style={{ background: sevColor(s) }} />{n}</span>)}<span className="tot">{total} Total</span></div>
    <div className="cnt-bar">{cnt.map(([s, n]) => <i key={s} style={{ background: sevColor(s), width: (n / list.length * 100) + "%" }} />)}</div></>);
}
const KPI_TILES = [["オンライン滞留件数", "契約照会オンライン", "1,842", "critical"], ["MQ連携エラー率", "連携基盤（MQ）", "12.7", "critical"], ["応答時間（p95）", "契約照会オンライン", "8.4", "high"], ["パケット損失率", "ネットワーク（DC間）", "2.4", "high"], ["再送数", "ネットワーク（DC間）", "512", "high"], ["エラー率", "代理店ポータル", "6.2", "high"], ["CPU使用率", "AP基盤", "92", "medium"], ["処理件数の遅れ", "帳票出力", "3", "low"], ["DB応答時間", "DB基盤", "12", "normal"], ["認証成功率", "認証基盤", "99.9", "normal"], ["ジョブ遅延件数", "ジョブ管理", "0", "normal"], ["支払処理件数", "支払バッチ", "1,204", "normal"]];
function Tiles() {
  const fg = (s) => (s === "low" ? "#1f2329" : "#fff");
  return (
    <div className="sa-tiles" id="sa-tiles">
      <p className="sa-sec">Top 50 Services <Ic d={D.gear} s={14} w={2.4} /></p>
      <CountBar list={SERVICES.map((s) => s[3])} total={SERVICES.length} />
      <div className="kt-grid">{SERVICES.map(([id, name, score, s]) => <div key={id} className="kt" id={"sa-tile-" + id} style={{ background: sevColor(s), color: fg(s) }}><span className="nm">{name}</span><b>{s !== "normal" && <span className="kt-i">ⓘ</span>}{score}</b><Spark up={s !== "normal"} color={fg(s)} /></div>)}</div>
      <p className="sa-sec">Top 50 KPIs <Ic d={D.gear} s={14} w={2.4} /></p>
      <CountBar list={KPI_TILES.map((k) => k[3])} total={KPI_TILES.length} />
      <div className="kt-grid">{KPI_TILES.map((k) => <div key={k[0] + k[1]} className="kt kpi" style={{ background: sevColor(k[3]), color: fg(k[3]) }}><span className="nm">{k[0]}</span><small>{k[1]}</small><b>{k[3] !== "normal" && <span className="kt-i">ⓘ</span>}{k[2]}</b><Spark up color={fg(k[3])} /></div>)}</div>
    </div>
  );
}
function TreeView({ c }) {
  const svc = (id) => SERVICES.find((s) => s[0] === id);
  const pos = { portal: [330, 60], online: [330, 200], ap: [160, 350], db: [270, 350], mq: [390, 350], nw: [510, 350] };
  const Node = ({ id }) => { const s = svc(id), [x, y] = pos[id]; const sel = c.node === id; return (
    <g className={"sa-node" + (sel ? " sel" : "")} id={"node-" + id} data-id={"node-" + id} transform={"translate(" + x + " " + y + ")"}>
      {sel && <circle r="17" fill="none" stroke={sevColor(s[3])} strokeWidth="2.5" />}
      <circle r="12" fill={sevColor(s[3])} />
      <text x="17" y="5" transform="rotate(24)">{s[1]}</text>
    </g>
  ); };
  const edge = (a, b) => { const [x1, y1] = pos[a], [x2, y2] = pos[b]; return <path key={a + b} d={"M" + x1 + " " + (y1 - 14) + " C " + x1 + " " + (y1 - 70) + ", " + x2 + " " + (y2 + 60) + ", " + x2 + " " + (y2 + 16)} fill="none" stroke="#4f545a" strokeWidth="1.6" markerEnd="url(#arw)" />; };
  return (
    <div className="sa-tree-wrap">
      <div className="sa-tree-area" id="sa-tree-area">
        <span className="spk-input goto"><span className="ph">Go to service</span></span>
        <svg className="sa-svg" viewBox="0 0 700 470" aria-label="service tree">
          <defs><marker id="arw" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 z" fill="#4f545a" /></marker></defs>
          {edge("online", "portal")}{["ap", "db", "mq", "nw"].map((k) => edge(k, "online"))}
          {["portal", "online", "ap", "db", "mq", "nw"].map((k) => <Node key={k} id={k} />)}
        </svg>
        <span className="sa-zoom" aria-hidden="true"><i>⌖</i><i>＋</i><i>－</i></span>
      </div>
      {c.node && (
        <aside className="sa-side" id="sa-side">
          <div className="sa-side-head" style={{ background: sevColor("critical") }}><span className="t"><b>契約照会オンライン</b><span className="k">⋮ ▾</span></span><span className="x" aria-hidden="true">✕</span><span className="sa-side-val"><Spark w={150} /><b>31</b></span></div>
          <div className="ep-tabs sm"><button type="button" className="on">KPIs &amp; Episodes</button><button type="button">Service impact analysis</button></div>
          <p className="sa-kcount"><b>4 KPIs</b><button type="button" className="lnk btnlink" id="sa-deepdive" data-id="sa-deepdive">{I.deep} <ExtIc /></button></p>
          <table className="itsi-table sm"><thead><tr><th>Severity ⌄</th><th>KPI Name ⇅</th><th>Value ⇅</th></tr></thead>
            <tbody>{KPIS.online.map((k) => <tr key={k[0]}><td className="sv"><span className="stripe" style={{ background: sevColor(k[2]) }} /><span className="lnk">{SEV[k[2]][0]}</span></td><td><span className="lnk">{k[0]}</span></td><td className="nw"><Spark up={k[2] !== "normal"} w={64} h={16} color="#5fbe81" /> <span className="lnk">{k[1]}</span></td></tr>)}</tbody></table>
          <div className="ep-tabs sm"><button type="button" className="on">Episode Review (1)</button><button type="button">Drift Review (0)</button></div>
          <p className="sa-kcount">ⓘ <b>1 Critical and High Episodes</b><span className="lnk">View All <ExtIc /></span></p>
          <p className="sa-ep"><span className="stripe" style={{ background: sevColor("critical") }} />{EPISODES[0][2]}</p>
        </aside>
      )}
      {(c.notes || []).includes("nodecide") && !c.closed.nodecide && <TTNote k="nodecide" cls="pt-none" style={{ left: 24, bottom: 24 }} text="赤が同時に並んでも、原因の断定はしません。断定は有識者が行います。" small="（A社の決まり・架空）" />}
    </div>
  );
}
function ServiceAnalyzer({ c }) {
  return (
    <div className="sa-page">
      <TitleRow title={I.nav[0]} right={<><Btn menu>Auto Refresh: No refresh (Global default)</Btn><Btn menu>Last 60 minutes</Btn><Btn>Save as...</Btn><Btn>Save</Btn><Btn cls="sq"><Ic d={D.expand} s={14} /></Btn></>} />
      <div className="sa-filterrow"><SaFilters tree={c.sa === "tree"} /><ViewToggle c={c} /></div>
      <div className="spk-divider" />
      {c.sa === "tree" ? <TreeView c={c} /> : <Tiles />}
    </div>
  );
}

/* ---------- ITSI：Deep Dive（画面写真なし。公式ドキュメントの説明〈レーン・しきい値の帯・Add Lane〉から組んだ推定） ---------- */
function Lane({ name, s, data, th }) {
  const W = 1000, H = 64, max = Math.max(...data, th[1]) * 1.1;
  const pts = data.map((v, i) => (i / (data.length - 1)) * W + "," + (H - (v / max) * H)).join(" ");
  const y1 = H - (th[0] / max) * H, y2 = H - (th[1] / max) * H;
  return (
    <div className="dd-lane">
      <div className="dd-lname"><span className="dd-sev" style={{ background: sevColor(s) }} /><span className="t">{name}</span><Ic d={D.gear} s={14} w={2} /></div>
      <svg className="dd-chart" viewBox={"0 0 " + W + " " + H} preserveAspectRatio="none" aria-hidden="true">
        <rect x="0" y="0" width={W} height={Math.max(0, y2)} fill={sevColor("critical")} opacity="0.25" />
        <rect x="0" y={y2} width={W} height={Math.max(0, y1 - y2)} fill={sevColor("high")} opacity="0.2" />
        <rect x="0" y={y1} width={W} height={H - y1} fill={sevColor("normal")} opacity="0.16" />
        <polyline points={pts} fill="none" stroke="#e8edf2" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
function DeepDive() {
  return (
    <div className="dd-page">
      <TitleRow title="契約照会オンライン" right={<><Btn menu>10/21/2026 10:00 PM - 11:00 PM</Btn><Btn menu>Add Lane</Btn><Btn menu>Bulk Actions</Btn><Btn>Save as...</Btn><Btn cls="sq"><Ic d={D.expand} s={14} /></Btn></>} />
      <div className="dd-tools"><span className="dd-note">KPI lanes: 4（Service Analyzer の Open all in Deep Dive から）</span><span className="spk-right"><TTLink id="tt-link-search" label="切り分けのサーチを開く（運用基盤チーム）" /></span></div>
      <div className="dd-axis"><span /><span>10:00 PM</span><span>10:15 PM</span><span>10:30 PM</span><span>10:45 PM</span><span>11:00 PM</span></div>
      <div className="dd-lanes" id="dd-lanes">{LANES.map((l) => <Lane key={l[0]} name={l[0]} s={l[1]} data={l[2]} th={l[3]} />)}<span className="dd-cursor" style={{ left: "calc(280px + (100% - 280px) * 31 / 60)" }}><b>10:31 PM</b></span></div>
    </div>
  );
}

export function ItsiApp({ c }) {
  const active = c.view === "episodes" ? "episodes" : c.view === "deepdive" ? "deep" : "sa";
  return (
    <Shell app="itsi" items={ITSI_NAV} active={active} user={PEOPLE.night}>
      {c.view === "episodes" && <EpisodeReview c={c} />}
      {c.view === "sa" && <ServiceAnalyzer c={c} />}
      {c.view === "deepdive" && <DeepDive />}
    </Shell>
  );
}

/* ---------- 時間範囲（公式の Dialog 部品を、デモ側で開閉する） ---------- */
const PRESET_KEYS = { today: ["@d", "now"], prevmonth: ["-1mon@mon", "@mon"], "15m": ["-15m", "now"], "60m": ["-60m@m", "now"], "4h": ["-4h@m", "now"], "24h": ["-24h@h", "now"], "7d": ["-7d@h", "now"], "30d": ["-30d@d", "now"], all: ["0", ""] };
const PRESETS = Object.keys(PRESET_KEYS).map((k) => ({ label: RANGES[k][0], earliest: PRESET_KEYS[k][0], latest: PRESET_KEYS[k][1] }));
const keyOf = (e, l) => Object.keys(PRESET_KEYS).find((k) => PRESET_KEYS[k][0] === e && (PRESET_KEYS[k][1] || "") === (l || ""));
function TimePicker({ c }) {
  const k = c.vals.range;
  return (
    <span className="sp-tp-wrap">
      <button type="button" className="spk-btn tp" id="sp-tp" data-open="tp">{RANGES[k][0]}<span className="cr">▾</span></button>
      {c.open === "tp" && (
        <div className="sp-tp-menu" id="tp-menu">
          <TimeRangeDialog presets={PRESETS} earliest={PRESET_KEYS[k][0]} latest={PRESET_KEYS[k][1]} formInputTypes={[]} advancedInputTypes={[]} realTimeDisabled
            onChange={(e, { earliest, latest }) => { const key = keyOf(earliest, latest); if (key) act("pick", "range", key); }} />
        </div>
      )}
    </span>
  );
}
function JobBar({ count, range, exportId }) {
  return (
    <div className="sr-status">
      <span className="sr-sum"><span className="ok">✓</span><b>{count}</b>{range && <span>（{range}）</span>}</span>
      <span className="spk-btn">イベントサンプリングなし<span className="cr">▾</span></span>
      <span className="spk-right">
        <span className="spk-btn">ジョブ<span className="cr">▾</span></span><span className="jb-ic">❚❚</span><span className="jb-ic">■</span>
        <span className="spk-btn ic">↷</span><span className="spk-btn ic">⎙</span>
        {exportId ? <button type="button" className="spk-btn ic" id={exportId} data-id={exportId} aria-label={P.export}>⤓</button> : <span className="spk-btn ic" id="sp-export-nt">⤓</span>}
        <span className="spk-btn">{P.smart}<span className="cr">▾</span></span>
      </span>
    </div>
  );
}
function StatTable({ cols, rows, rightFrom }) {
  return (
    <table className="sr-table">
      <thead><tr>{cols.map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} id={"res-row-" + i}>{r.map((v, j) => <td key={j} className={j >= rightFrom ? "num" : ""}>{v}</td>)}</tr>)}</tbody>
    </table>
  );
}

/* ---------- サーチ ---------- */
function SearchPage({ c }) {
  return (
    <div className="sr-page">
      <TitleRow title={SAVED.title} right={<><Btn menu>{P.saveAs}</Btn><Btn>{P.tableView}</Btn><Btn>{P.close}</Btn></>} />
      <div className="sr-bar">
        <div className="sr-input" id="sp-spl"><SearchInput value={SAVED.spl} showLineNumbers onChange={() => {}} minLines={5} maxLines={8} /></div>
        <TimePicker c={c} />
        <button type="button" className="sr-go" id="sp-run" data-id="sp-run" aria-label="サーチ"><Magnifier /></button>
      </div>
      {!c.ran ? <div className="sr-empty" /> : (
        <div className="sr-results" id="sp-results">
          <JobBar count="2,529 件のイベント" range={RANGES[c.vals.range][1]} />
          <div className="sr-tabs">{P.tabs.map((t, i) => <span key={t} className={i === 2 ? "on" : ""}>{t}{i === 0 ? " (2,529)" : i === 2 ? " (" + RESULTS.length + ")" : ""}</span>)}</div>
          <StatTable cols={["最初", "host", "source", "message", "件数"]} rows={RESULTS} rightFrom={4} />
          {(c.notes || []).includes("noexport") && !c.closed.noexport && <TTNote k="noexport" cls="pt-none" style={{ right: 0, top: 40 }} text="結果のエクスポート（⤓）は、夜間当番には許可されていません。時刻と件数を書き写します。" small="（A社の決まり・架空）" />}
          <div className="sr-foot"><TTLink id="tt-link-snow" label="ServiceNowに戻って引き継ぐ（INC0012847）" /></div>
        </div>
      )}
    </div>
  );
}

/* ---------- レポート ---------- */
function ReportsList() {
  return (
    <div className="rp-page">
      <TitleRow title={P.nav[3]} />
      <p className="spk-desc">{P.reportsIntro}</p>
      <div className="rp-filter"><span className="rp-n">{REPORTS.length} 件のレポート</span><span className="seg"><span className="on">すべて</span><span>自分のもの</span><span>この App 内</span></span><span className="spk-input sm"><span className="ph">フィルター</span><Magnifier /></span></div>
      <div id="rp-table">
        <table className="sr-table rp">
          <thead><tr><th className="i">i</th>{P.reportCols.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{REPORTS.map((r) => (
            <tr key={r[0]} id={"rp-row-" + r[0]}>
              <td className="i">›</td>
              <td><button type="button" className="lnk btnlink" data-id={r[0]} id={r[0]}>{r[1]}</button></td>
              <td className="acts"><span className="lnk">{P.openInSearch}</span><span className="lnk">{P.edit} ▾</span></td>
              <td>{r[3]}</td><td>{r[4]}</td><td>{r[5]}</td><td>{r[6]}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
function ExportDialog({ c }) {
  return (
    <div className="spk-scrim">
      <div className="spk-modal" role="dialog" aria-label={P.exportTitle}>
        <div className="spk-mhead"><b>{P.exportTitle}</b><span className="x" aria-hidden="true">✕</span></div>
        <div className="spk-mbody">
          <div className="frow"><label>{P.format}</label><span className="spk-btn sel">CSV<span className="cr">▾</span></span></div>
          <div className="frow"><label>{P.fname}</label><span className="fname-row"><span id="f-fname" className="spk-input txt">{c.vals.fname || ""}</span><button type="button" className="tt-ins" id="tt-fname" data-id="tt-fname">ファイル名を自動入力</button></span></div>
          <div className="frow"><label>{P.count}</label><span className="seg"><span className="on">{P.unlimited}</span><span>{P.limited}</span></span></div>
        </div>
        <div className="spk-mfoot"><span className="spk-btn">{P.cancel}</span><button type="button" className="spk-btn primary" id="ex-go" data-id="ex-go">{P.export}</button></div>
      </div>
    </div>
  );
}
function ReportView({ c }) {
  const k = c.vals.range;
  const rows = k === "prevmonth" ? MONTHLY : MONTHLY.map((r) => [r[0], r[1] === "100.00" ? "100.00" : (Math.min(100, +r[1] + 0.01)).toFixed(2), r[2], r[3], r[4]]);
  return (
    <div className="rp-page">
      <TitleRow title="稼働統計_月次_全システム" right={<><Btn menu>{P.edit}</Btn><Btn menu>{P.more}</Btn><Btn>{P.openInSearch}</Btn></>} />
      <p className="spk-desc">2026年4月改訂：代理店ポータルを追加（架空）</p>
      <div className="rp-bar"><TimePicker c={c} /></div>
      <div className="sr-results" id="sp-results">
        <JobBar count={rows.length + " 件の結果"} range={RANGES[k][1]} exportId="sp-export" />
        <StatTable cols={["サービス", "稼働率（%）", "停止回数", "停止時間（分）", "平均応答時間（ms）"]} rows={rows} rightFrom={1} />
        {c.downloaded && <div className="sr-foot"><span className="dl-chip">⤓ {FNAME}.csv をダウンロードしました</span><TTLink id="tt-link-task" label="ServiceNowのタスクに戻る（TASK0004211）" /></div>}
      </div>
      {c.dlg && <ExportDialog c={c} />}
    </div>
  );
}

export function SearchApp({ c }) {
  const active = c.view === "search" ? "s-search" : "s-reports";
  return (
    <Shell app="sr" items={SR_NAV} active={active} user={c.view === "search" ? PEOPLE.night : PEOPLE.kiban}>
      {c.view === "search" && <SearchPage c={c} />}
      {c.view === "reports" && <ReportsList />}
      {c.view === "report" && <ReportView c={c} />}
    </Shell>
  );
}
