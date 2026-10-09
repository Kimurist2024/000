// Splunk Web の画面を、Splunk 公式の UI ツールキット（@splunk/react-ui ほか、Apache-2.0）で組む。データはすべて架空。
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { SplunkThemeProvider } from "@splunk/themes";
import Button from "@splunk/react-ui/Button";
import Table from "@splunk/react-ui/Table";
import TabLayout from "@splunk/react-ui/TabLayout";
import Select from "@splunk/react-ui/Select";
import Text from "@splunk/react-ui/Text";
import Menu from "@splunk/react-ui/Menu";
import Dropdown from "@splunk/react-ui/Dropdown";
import Message from "@splunk/react-ui/Message";
import Heading from "@splunk/react-ui/Heading";
import Paragraph from "@splunk/react-ui/Paragraph";
import ControlGroup from "@splunk/react-ui/ControlGroup";
import Card from "@splunk/react-ui/Card";
import Link from "@splunk/react-ui/Link";
import Breadcrumbs from "@splunk/react-ui/Breadcrumbs";
import RadioList from "@splunk/react-ui/RadioList";
import Switch from "@splunk/react-ui/Switch";
import Chip from "@splunk/react-ui/Chip";
import Magnifier from "@splunk/react-icons/Magnifier";
import Cross from "@splunk/react-icons/Cross";
import RobotFaceSparkle from "@splunk/react-icons/RobotFaceSparkle";
import Shield from "@splunk/react-icons/Shield";
import StarSparklesDouble from "@splunk/react-icons/StarSparklesDouble";
import SingleValue from "@splunk/visualizations/SingleValue";
import Column from "@splunk/visualizations/Column";
import Line from "@splunk/visualizations/Line";
import VizTable from "@splunk/visualizations/Table";
import { act, patch } from "./engine.js";
import { CASES, Q4_ROWS, SPL, SPL_Q5, REPORTS, REQUEST_OUT, FIX_REQUEST, EXTRA_REQ, TIPS, GOALS, CHECK_ROWS, Q_ORDER, VIZ_LABEL, CK, REC, RESULTS, RUN_TITLE } from "./data.js";

let root = null;
export function mountStage(el) { root = createRoot(el); }
export function renderStage(snap) { flushSync(() => root.render(<Stage {...snap} />)); }

/* ---------- 小さな部品 ---------- */
const click = (id) => (e) => { if (e && e.preventDefault) e.preventDefault(); act("click", id); };
const go = (fn) => (e) => { if (e && e.preventDefault) e.preventDefault(); patch(fn); };
function TipWrap({ id, label, tipKey, tip }) {
  return (
    <span className="tip-wrap" id={id}>{label}
      <button type="button" className="tt-q" data-tip={tipKey} aria-expanded={tip === tipKey} aria-label={"社内の基準を表示"}>?</button>
      {tip === tipKey && <span className="tt-tip" role="tooltip"><span className="lab">テックタッチ ツールチップ（案）：{TIPS[tipKey][0]}</span>{TIPS[tipKey][1]}</span>}
    </span>
  );
}
// 文字入力：入力中は手元で持ち、確定（フォーカスを外す／Enter）でガイドに渡す
function TextField({ id, value, placeholder, disabled }) {
  const [v, setV] = useState(value || "");
  useEffect(() => { setV(value || ""); }, [value]);
  const commit = () => { if (v !== (value || "")) act("pick", id, v); };
  return <Text value={v} placeholder={placeholder} disabled={disabled} canClear={false} onChange={(e, { value: nv }) => setV(nv)} onBlur={commit} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }} />;
}
function Pick({ id, value, options, placeholder, disabled }) {
  return (
    <span className="f-wrap" id={"f-" + id}>
      <Select value={value || ""} placeholder={placeholder || "選択…"} disabled={disabled} onChange={(e, { value: nv }) => act("pick", id, nv)}>
        {options.map((o) => <Select.Option key={o[0]} label={o[1]} value={o[0]} />)}
      </Select>
    </span>
  );
}
const ds = (fields, columns) => ({ primary: { requestParams: { count: 100 }, data: { fields: fields.map((n) => ({ name: n })), columns }, meta: { totalCount: columns[0].length } } });
const DS = {
  single70: ds(["failures"], [[70]]), single4: ds(["distinct_srcs"], [[4]]),
  q1: ds(["src", "fail_count"], [CASES.map((k) => k.src), CASES.map((k) => k.fails)]),
  q2: ds(["src", "fail_count", "failed_users"], [["198.51.100.24", "192.0.2.51"], [36, 12], [9, 6]]),
  q3: ds(["src", "user", "event_time", "mfa"], [["198.51.100.24"], ["admin_ops"], ["2026-10-08 09:10:00"], ["approved"]]),
  q4: ds(["_time", "failures", "successes"], [Q4_ROWS.map((r) => r[0].replace(" ", "T") + ":00"), Q4_ROWS.map((r) => r[1]), Q4_ROWS.map((r) => r[2])])
};
function Viz({ kind, h }) {
  const style = { height: h || 200, width: "100%" };
  if (kind === "single70") return <div className="viz-single" style={style}><SingleValue dataSources={DS.single70} options={{ majorColor: "#f8be34", showSparklineAreaGraph: false }} /></div>;
  if (kind === "single4") return <div className="viz-single" style={style}><SingleValue dataSources={DS.single4} /></div>;
  if (kind === "bar") return <div style={style}><Column dataSources={DS.q1} options={{ legendDisplay: "off", xAxisTitleText: "src", yAxisTitleText: "fail_count" }} /></div>;
  if (kind === "line") return <div style={style}><Line dataSources={DS.q4} options={{ legendDisplay: "right" }} /></div>;
  if (kind === "table-q2") return <div style={style}><VizTable dataSources={DS.q2} /></div>;
  if (kind === "table-q3") return <div style={style}><VizTable dataSources={DS.q3} /></div>;
  return null;
}
function ResultTable({ run }) {
  const r = RESULTS[run];
  return (
    <Table stripeRows>
      <Table.Head><Table.HeadCell width={40}>#</Table.HeadCell>{r.cols.map((c) => <Table.HeadCell key={c}>{c}</Table.HeadCell>)}</Table.Head>
      <Table.Body>
        {r.rows.map((row, i) => (
          <Table.Row key={i}><Table.Cell>{i + 1}</Table.Cell>{row.slice(1).map((v, j) => <Table.Cell key={j}>{j === 0 ? <span id={"res-row-" + (row[0] || i)} className="res-key">{v}</span> : v}</Table.Cell>)}</Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
}

/* ---------- Splunk Web の枠（上部バー・アプリバー） ---------- */
function SplunkBar({ who }) {
  return (
    <div className="sp-bar">
      <span className="sp-logo">Splunk Cloud Platform<small>画面イメージ・架空</small></span>
      <span className="sp-menus"><span>メッセージ ▾</span><span>設定 ▾</span><span>アクティビティ ▾</span><span>ヘルプ ▾</span><span>検索</span><span className="user">{who} ▾</span></span>
    </div>
  );
}
function AppBar({ app }) {
  const sse = app === "sse";
  const items = sse ? [["", "ホーム", false], ["", "Security Content", true]]
    : [["search", "検索", app === "search"], ["", "分析", false], ["", "データセット", false], ["reports", "レポート", app === "reports"], ["", "アラート", false], ["dashboards", "ダッシュボード", app === "dashboards"]];
  return (
    <div className="app-bar">
      <span className="app-name">{sse ? "Security Essentials" : "Search & Reporting"}</span>
      <nav className="app-nav">{items.map((it, i) => it[0]
        ? <button type="button" key={i} id={"nav-" + it[0]} data-id={"nav-" + it[0]} className={it[2] ? "active" : ""}>{it[1]}</button>
        : <span key={i} className={it[2] ? "active" : ""}>{it[1]}</span>)}</nav>
    </div>
  );
}

/* ---------- 検索（Search & Reporting） ---------- */
function SaveAs({ c }) {
  return (
    <Dropdown toggle={<Button id="sp-saveas" label="名前を付けて保存" isMenu appearance="secondary" />} open={!!c.menu} retainFocus={false}
      onRequestOpen={() => act("click", "sp-saveas")} onRequestClose={() => patch((x) => { x.menu = false; })}>
      <Menu>
        <Menu.Item onClick={click("sa-report")}>レポート</Menu.Item>
        <Menu.Item onClick={click("sa-panel")}>ダッシュボードパネル</Menu.Item>
        <Menu.Item id="sa-alert" onClick={click("sa-alert")}>アラート</Menu.Item>
        <Menu.Item onClick={click("sa-event")}>イベントタイプ</Menu.Item>
      </Menu>
    </Dropdown>
  );
}
function SearchBar({ c }) {
  const spl = c.q ? SPL[c.q] : "";
  return (
    <div className="sp-searchbar">
      <pre className={"spl-box" + (spl ? "" : " ph")}>{spl || "検索文字列を入力…"}</pre>
      <span className="sp-time"><Button label="全時間" isMenu appearance="secondary" /></span>
      <span className="sp-go"><Button id="sp-run" appearance="primary" icon={<Magnifier />} aria-label="検索を実行" onClick={click("sp-run")} /></span>
    </div>
  );
}
function Results({ c }) {
  if (!c.ran) return <div className="sp-empty"><Magnifier /><p>検索を実行すると、ここに結果が出ます。</p><small>固定のテストログ（CSVルックアップ・72件・架空）に対する検索です。</small></div>;
  const r = RESULTS[c.ran], n = r.rows.length, viz = c.tab === "viz" && c.ran === "q4";
  return (
    <div className="sp-results">
      <p className="sp-summary"><span className="ok">✓</span> {c.ran === "q4" ? "3 行（5分単位）" : n + " 件の結果"}　<small>2026/10/08 09:00:00 〜 09:15:00（固定のテストログ・架空）</small></p>
      <TabLayout activePanelId={viz ? "viz" : "stats"} onChange={(e, { activePanelId }) => patch((x) => { x.tab = activePanelId === "viz" ? "viz" : "stats"; })}>
        <TabLayout.Panel label="イベント" panelId="events"><p className="sp-note">固定CSVのルックアップのため、イベント表示は省略します（架空）。</p></TabLayout.Panel>
        <TabLayout.Panel label="パターン" panelId="patterns"><p className="sp-note">省略（架空）。</p></TabLayout.Panel>
        <TabLayout.Panel label={"統計情報 (" + n + ")"} panelId="stats"><ResultTable run={c.ran} />{r.note && <Message appearance="fill" type="info">{r.note}</Message>}</TabLayout.Panel>
        <TabLayout.Panel label="視覚エフェクト" panelId="viz">{c.ran === "q4" ? <Viz kind="line" h={240} /> : <p className="sp-note">この結果は表で確認します（架空）。</p>}</TabLayout.Panel>
      </TabLayout>
    </div>
  );
}
function SearchPage({ c, ch, tip }) {
  const title = c.q && c.q !== "before" ? RUN_TITLE[c.q] : "新規検索";
  const main = (
    <div className="sp-search">
      <div className="sp-head"><Heading level={2}>{title}</Heading>
        <span className="row-actions">
          {c.chip && <button type="button" className="tt-chip" id="chip-soc" data-id="chip-soc"><StarSparklesDouble />SOC分析アシスト（テックタッチ）</button>}
          <SaveAs c={c} />
        </span>
      </div>
      <SearchBar c={c} />
      <Results c={c} />
    </div>
  );
  return (
    <>
      {ch === 3 && <HubWin c={c} />}
      {c.assist ? <div className="sp-split">{main}<Assistant c={c} /></div> : main}
      {ch === 4 && <HubCheck c={c} />}
      {c.dialog && <AlertDialog c={c} tip={tip} />}
    </>
  );
}

/* ---------- Splunk AI Assistant（画面イメージ・架空） ---------- */
function Bubble({ t }) { return <div className="bubble">{t}</div>; }
function Answer({ spl, bullets, btnId }) {
  return (
    <div className="as-ans">
      <p className="ai-label">Splunk AI Assistant（参考画面・架空の表示）</p>
      <pre className="code">{spl}</pre>
      <ul>{bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
      <div className="row-actions"><Button id={btnId} appearance="secondary" label="検索に入れる" onClick={click(btnId)} /><Button appearance="secondary" label="コピー" /></div>
    </div>
  );
}
function Assistant({ c }) {
  const st = c.stage || 0;
  const ta = st === 1 ? REQUEST_OUT : st === 3 ? FIX_REQUEST : "";
  return (
    <aside className="assist" aria-label="Splunk AI Assistant（画面イメージ・架空）">
      <div className="assist-head"><RobotFaceSparkle />Splunk AI Assistant</div>
      <p className="dt-fine">画面イメージ（架空）。有償のSplunk Cloudの機能で、トライアル環境では使えません。回答はデモ用に準備した参考画面です。</p>
      {st >= 2 && <><Bubble t={REQUEST_OUT} /><Answer spl={SPL.ai1} btnId="as-insert" bullets={["src ごとに失敗数、失敗した異なる user 数、特権アカウントの成功数を集計し、閾値で絞ります。", "（この案には、同一ユーザーの判定・前後関係・15分の時間範囲が入っていません。AI Hubで照合します）"]} /></>}
      {st >= 2 && c.hub < 3 && <button type="button" className="hub-chip" id="hub-check" data-id="hub-check"><Shield />SOC基準との照合（AI Hub）</button>}
      {st >= 4 && <><Bubble t={FIX_REQUEST} /><Answer spl={SPL.q3} btnId="as-insert2" bullets={["eventstats で src ごとの失敗数と異なる失敗 user 数を付け、sort と streamstats で同じ src・user の「それ以前の失敗」を数えます。", "特権アカウントの成功で、それ以前の失敗が1件以上、かつ src の閾値を満たす行だけを残します。"]} /></>}
      {c.extra && <><Bubble t={EXTRA_REQ} /><p className="ai-label">（回答の表示は省略。実機では追加検索の案が返ります・架空）</p></>}
      {!c.extra && (
        <div className="as-in" id="as-input">
          <div className={"as-ta" + (ta ? "" : " ph")}>{ta || "質問や依頼を入力…"}</div>
          <div className="row-actions">
            {st === 0 && <Button id="as-paste" appearance="secondary" label="貼り付け（S2の依頼文）" onClick={click("as-paste")} />}
            <Button id="as-send" appearance="primary" label="送信" disabled={!(st === 1 || st === 3)} onClick={click("as-send")} />
          </div>
        </div>
      )}
    </aside>
  );
}

/* ---------- AI Hub（テックタッチ・構想・架空画面） ---------- */
function HubHead({ title, sub }) { return <div className="hub-head"><span className="ov-pill hubpill">AI Hub</span><b>{title}</b><span className="dt-fine">{sub}</span></div>; }
function HubWin({ c }) {
  if (!c.hub) return null;
  return (
    <section className="hub-win" aria-label="AI Hub（構想・架空画面）">
      <HubHead title="SOC分析アシスト" sub="テックタッチのAI Hubの画面イメージ（構想・架空）。回答は本番前に確かめた例文" />
      <p className="kb-row">参照ナレッジ：<span className="kb">KB01 ログ辞書</span><span className="kb">KB02 検知基準</span><span className="kb">KB03 承認済み検索</span><span className="dt-fine">（プロンプトP1）</span></p>
      <div className="tip-anchor block" id="hub-in-wrap"><textarea key={"hub-in-" + (c.vals["hub-in"] || "")} data-id="hub-in" id="hub-in" rows={3} defaultValue={c.vals["hub-in"] || ""} placeholder="やりたいことを日本語で書いてください" aria-label="AI Hubへの依頼" /></div>
      <div className="row-actions"><button type="button" className="dt-emph" id="hub-fill" data-id="hub-fill">例文を入れる</button><button type="button" className="dt-accent hub-btn" id="hub-send" data-id="hub-send" disabled={!c.vals["hub-in"]}>整理する</button></div>
      {c.hub >= 3 && (
        <div className="hub-ans">
          <p className="lab">AI Hubの整理（例文）</p>
          <dl className="kv"><dt>対象</dt><dd>VPN認証イベント。フィールドは event_time、src、user、action、privileged（KB01）</dd>
            <dt>条件</dt><dd>15分間に同一IPから認証失敗10件以上、異なる失敗アカウント5以上（KB02 D-01）</dd>
            <dt>追加条件</dt><dd>同じIP・同じ管理者アカウントで、そのアカウントの失敗より後に成功がある</dd>
            <dt>確認</dt><dd>時刻、重複、例外条件、MFAの証跡</dd>
            <dt>分析の分け方</dt><dd>「IP別ランキング」「15分の閾値候補」「管理者の失敗後の成功」「時間推移」（KB03 Q1〜Q4）</dd></dl>
          <p className="lab">Splunk AI Assistant向けの依頼文</p>
          <div className="tip-anchor block" id="hub-req"><pre className="code req">{REQUEST_OUT}</pre></div>
          <div className="row-actions"><button type="button" className="dt-accent hub-btn" id="hub-copy" data-id="hub-copy" disabled={c.copied}>{c.copied ? "コピーしました" : "依頼文をコピー"}</button></div>
        </div>
      )}
    </section>
  );
}
function HubCheck({ c }) {
  if (c.hub < 3) return null;
  return (
    <section className="hub-win" aria-label="AI Hub：SOC基準との照合（構想・架空画面）">
      <HubHead title="SOC基準との照合（P2）" sub="構文ではなく、SOCの業務条件で評価（例文）" />
      <table className="hub-tbl"><thead><tr><th>確認事項</th><th>チェック内容</th><th>判定</th><th>次の行動</th></tr></thead>
        <tbody>{CHECK_ROWS.map((r) => <tr key={r[0]}><td><b>{r[0]}</b></td><td>{r[1]}</td><td>{r[3] === true ? <span className="st on">入っている</span> : r[3] === false ? <span className="st ng">不足</span> : <span className="st">S4で確認</span>}</td><td>{r[2]}</td></tr>)}</tbody></table>
      <p className="lab">Assistantへの修正依頼文</p><pre className="code req">{FIX_REQUEST}</pre>
      <div className="row-actions"><button type="button" className="dt-accent hub-btn" id="hub-copy-fix" data-id="hub-copy-fix" disabled={c.fixPasted}>{c.fixPasted ? "Assistantに貼りました" : "修正依頼文をコピーしてAssistantに貼る"}</button></div>
      <p className="dt-fine">AI Hubは検索結果の真偽を断定しません。最終検証はS4でテストケースA/B/C/Dと突き合わせます。</p>
    </section>
  );
}
function HubP3({ c }) {
  if (c.hub < 3) return null;
  return (
    <section className="hub-win" aria-label="AI Hub：一次調査の整理（構想・架空画面）">
      <HubHead title="一次調査の整理（P3・KB04）" sub="例文。侵害の成立は推定しない" />
      <dl className="kv"><dt>確認済み事実</dt><dd>接続元 198.51.100.24、失敗36件、9アカウント、admin_ops の成功 09:10:00、同一管理者で失敗→成功の時系列、MFA approved</dd>
        <dt>追加の確認</dt><dd>接続元の正規性、VPN／MFAの情報、本人確認、ログイン後の重要操作、端末の関連証跡</dd>
        <dt>判断の進め方</dt><dd>調査の優先度を上げ、SOC上位者へ証跡と未確認事項を引き継ぐ</dd>
        <dt>追加SPLの依頼</dt><dd>接続元IPと admin_ops の操作履歴を、特定の時間範囲で確認する依頼文をAssistantに渡す</dd></dl>
      <div className="row-actions"><button type="button" className="dt-accent hub-btn" id="hub-copy-spl" data-id="hub-copy-spl" disabled={c.extra}>{c.extra ? "Assistantに渡しました" : "追加検索の依頼文をAssistantに渡す"}</button></div>
    </section>
  );
}

/* ---------- レポート ---------- */
function ReportsPage() {
  return (
    <div className="sp-page-body">
      <div className="sp-head"><Heading level={2}>レポート</Heading><span className="dt-fine">保存済みレポート（架空）。Q1〜Q4はSOCの承認済み検索（KB03）</span></div>
      <Table stripeRows>
        <Table.Head><Table.HeadCell>タイトル</Table.HeadCell><Table.HeadCell>説明</Table.HeadCell><Table.HeadCell>所有者</Table.HeadCell><Table.HeadCell>アプリ</Table.HeadCell><Table.HeadCell>共有</Table.HeadCell><Table.HeadCell>版</Table.HeadCell></Table.Head>
        <Table.Body>
          {REPORTS.map((r) => <Table.Row key={r[0]}><Table.Cell><Link id={"rep-" + r[0]} onClick={click("rep-" + r[0])}>{r[1]}</Link></Table.Cell><Table.Cell>{r[2]}</Table.Cell><Table.Cell>山田</Table.Cell><Table.Cell>search</Table.Cell><Table.Cell>アプリ</Table.Cell><Table.Cell>{r[3]}</Table.Cell></Table.Row>)}
          <Table.Row key="x"><Table.Cell><span className="dt-fine">VPN認証_失敗数_委託先（表示省略）</span></Table.Cell><Table.Cell>委託先作成の集計</Table.Cell><Table.Cell>委託先</Table.Cell><Table.Cell>search</Table.Cell><Table.Cell>アプリ</Table.Cell><Table.Cell>—</Table.Cell></Table.Row>
        </Table.Body>
      </Table>
    </div>
  );
}

/* ---------- ダッシュボード（一覧・旧・Dashboard Studio） ---------- */
function Panel({ title, sub, wide, id, children }) {
  return (
    <div className={"sp-panel" + (wide ? " wide" : "")} id={id}>
      <Card style={{ width: "100%" }}><Card.Header title={title} subtitle={sub} /><Card.Body>{children}</Card.Body></Card>
    </div>
  );
}
function DashboardsPage({ c }) {
  if (c.view === "old") {
    return (
      <div className="sp-page-body">
        <Breadcrumbs><Breadcrumbs.Item label="ダッシュボード" onClick={click("nav-dashboards")} /><Breadcrumbs.Item label="VPN認証_失敗数（委託先作成）" isCurrent /></Breadcrumbs>
        <div className="sp-head"><Heading level={2}>VPN認証_失敗数（委託先作成・架空）</Heading><span className="dt-fine">過去15分　最終更新 09:15</span></div>
        <div className="canvas">
          <Panel id="d-old-panel" title="認証失敗数（件）" sub="接続元IP別・異なるアカウント数・失敗と成功の順序は表示していない"><Viz kind="single70" h={120} /></Panel>
          <Panel title="認証失敗数の推移（5分）"><Viz kind="line" h={200} /></Panel>
        </div>
      </div>
    );
  }
  if (c.view === "edit" || c.view === "new") return <Studio c={c} />;
  return (
    <div className="sp-page-body">
      <div className="sp-head"><Heading level={2}>ダッシュボード</Heading><Button id="db-new" appearance="primary" label="新規ダッシュボードを作成" onClick={click("db-new")} /></div>
      <Table stripeRows>
        <Table.Head><Table.HeadCell>タイトル</Table.HeadCell><Table.HeadCell>所有者</Table.HeadCell><Table.HeadCell>共有</Table.HeadCell><Table.HeadCell>更新</Table.HeadCell></Table.Head>
        <Table.Body>
          {c.saved && <Table.Row key="new"><Table.Cell><b>{c.vals["db-name"]}</b></Table.Cell><Table.Cell>山田</Table.Cell><Table.Cell>アプリ（SOCチーム）</Table.Cell><Table.Cell>2026-10-08</Table.Cell></Table.Row>}
          <Table.Row key="old"><Table.Cell><Link onClick={click("dash-old")}>VPN認証_失敗数（委託先作成）</Link></Table.Cell><Table.Cell>委託先</Table.Cell><Table.Cell>アプリ</Table.Cell><Table.Cell>2026-09-30</Table.Cell></Table.Row>
        </Table.Body>
      </Table>
      {c.view === "new" && <NewDashboardDialog c={c} />}
    </div>
  );
}
function Studio({ c }) {
  if (c.view === "new") return <><DashboardsList c={c} /><NewDashboardDialog c={c} /></>;
  const dsOpts = REPORTS.map((r) => [r[0], r[1]]);
  const vizOpts = [["bar", "棒グラフ"], ["table", "表"], ["line", "折れ線グラフ"], ["single", "単一値"]];
  const panels = c.panels.map((p, i) => {
    const idx = Q_ORDER.indexOf(p.ds), title = REPORTS[idx][1];
    const kind = p.viz === "bar" ? "bar" : p.viz === "line" ? "line" : "table-" + p.ds;
    return <Panel key={i} wide={p.viz !== "table"} title={title} sub={VIZ_LABEL[p.viz] + "・データソース：保存済みレポート"}><Viz kind={kind} h={p.viz === "table" ? 150 : 220} /></Panel>;
  });
  return (
    <div className="sp-page-body">
      <Breadcrumbs><Breadcrumbs.Item label="ダッシュボード" onClick={click("nav-dashboards")} /><Breadcrumbs.Item label={c.vals["db-name"]} isCurrent /></Breadcrumbs>
      <div className="sp-head"><Heading level={2}>{c.vals["db-name"]}<small className="dt-fine">　Dashboard Studio（画面イメージ・架空）</small></Heading>
        <span className="row-actions">
          <span className="f-label">共有</span><Pick id="db-share" value={c.vals["db-share"]} options={[["me", "自分だけ（非公開）"], ["team", "SOCチーム（アプリ）"], ["all", "すべてのアプリ"]]} />
          <Button id="db-save" appearance="primary" label={c.saved ? "保存済み" : "保存"} disabled={c.saved} onClick={click("db-save")} />
        </span>
      </div>
      <div className="studio">
        <div className="canvas">
          <Panel title="認証失敗（過去15分）" sub="単一値・Q0"><Viz kind="single70" h={120} /></Panel>
          <Panel title="接続元IP（過去15分）" sub="単一値・Q0"><Viz kind="single4" h={120} /></Panel>
          {panels}
          {!c.panels.length && <div className="sp-panel wide empty-panel">右の「可視化を追加」で、Q1〜Q4のパネルを置きます。</div>}
        </div>
        <div className="add-form">
          <Heading level={4}>可視化を追加</Heading>
          <ControlGroup label="データソース（保存済みレポート）" labelPosition="top"><Pick id="ds" value={c.vals["ds"]} options={dsOpts} /></ControlGroup>
          <ControlGroup label="可視化" labelPosition="top"><Pick id="viz" value={c.vals["viz"]} options={vizOpts} /></ControlGroup>
          <Button id="db-add" appearance="secondary" label="追加" onClick={click("db-add")} />
          <p className="dt-fine">検索期間：過去15分（デモは固定ログ）。保存済みレポートをデータソースにする操作（ds.savedSearch）は実機で確かめます。</p>
        </div>
      </div>
    </div>
  );
}
function DashboardsList({ c }) { return <DashboardsPage c={{ ...c, view: "list" }} />; }

/* ---------- ダイアログ（Splunk風。画面の中に重ねる） ---------- */
function Dialog({ title, children, footer }) {
  return (
    <div className="sp-scrim"><div className="sp-dialog" role="dialog" aria-label={title}>
      <div className="sp-dialog-head"><Heading level={3}>{title}</Heading><Button appearance="subtle" icon={<Cross />} aria-label="閉じる" /></div>
      <div className="sp-dialog-body">{children}</div>
      <div className="sp-dialog-foot">{footer}</div>
    </div></div>
  );
}
function NewDashboardDialog({ c }) {
  return (
    <Dialog title="新規ダッシュボードを作成" footer={<><Button appearance="secondary" label="キャンセル" onClick={() => patch((x) => { x.view = "list"; })} /><Button id="db-create" appearance="primary" label="作成" onClick={click("db-create")} /></>}>
      <ControlGroup label="ダッシュボードのタイトル" labelPosition="left" labelWidth={170}><span className="f-wrap" id="f-db-name"><TextField id="db-name" value={c.vals["db-name"]} placeholder="チーム_対象_用途" /></span></ControlGroup>
      <ControlGroup label="説明" labelPosition="left" labelWidth={170}><Text value="SOC認証監視（Q1〜Q4）" disabled canClear={false} /></ControlGroup>
      <ControlGroup label="権限" labelPosition="left" labelWidth={170}><RadioList value="private" direction="horizontal"><RadioList.Option value="private">非公開</RadioList.Option><RadioList.Option value="app">アプリで共有</RadioList.Option></RadioList></ControlGroup>
      <ControlGroup label="作成方法" labelPosition="left" labelWidth={170}><RadioList value="studio" direction="horizontal"><RadioList.Option value="studio">Dashboard Studio</RadioList.Option><RadioList.Option value="classic">Classic Dashboards</RadioList.Option></RadioList></ControlGroup>
    </Dialog>
  );
}
function AlertDialog({ c }) {
  const v = c.vals;
  return (
    <Dialog title="名前を付けて保存 > アラート" footer={<><Button appearance="secondary" label="キャンセル" onClick={() => patch((x) => { x.dialog = false; })} /><Button id="al-save" appearance="primary" label="保存" onClick={click("al-save")} /></>}>
      <ControlGroup label="タイトル" labelPosition="left" labelWidth={170}><span className="f-wrap" id="f-al-name"><TextField id="al-name" value={v["al-name"]} placeholder="SOC_対象_用途" /></span></ControlGroup>
      <ControlGroup label="説明" labelPosition="left" labelWidth={170}><Text value="同一管理者で、失敗の後に成功（Q3）" disabled canClear={false} /></ControlGroup>
      <ControlGroup label="権限" labelPosition="left" labelWidth={170}><RadioList value="app" direction="horizontal"><RadioList.Option value="private">非公開</RadioList.Option><RadioList.Option value="app">アプリで共有</RadioList.Option></RadioList></ControlGroup>
      <ControlGroup label="アラートタイプ" labelPosition="left" labelWidth={170}><Pick id="al-sched" value={v["al-sched"]} options={[["15m", "スケジュール：15分ごと（cron）"], ["1h", "スケジュール：1時間ごと"], ["rt", "リアルタイム"]]} /></ControlGroup>
      <ControlGroup label="時間範囲" labelPosition="left" labelWidth={170}><Text value="過去15分（Splunk Cloudのスケジュール時刻はUTC）" disabled canClear={false} /></ControlGroup>
      <ControlGroup label="トリガー条件" labelPosition="left" labelWidth={170}><Text value="結果の数 が 0 より大きい ／ トリガー：1回" disabled canClear={false} /></ControlGroup>
      <ControlGroup label="抑制" labelPosition="left" labelWidth={170}><Pick id="al-throttle" value={v["al-throttle"]} options={[["none", "抑制しない"], ["60src", "同じ src で60分"]]} /></ControlGroup>
      <ControlGroup label="通知先（メール）" labelPosition="left" labelWidth={170}><Pick id="al-to" value={v["al-to"]} options={[["me", "自分のメール"], ["soc", "SOCチーム（共有アドレス）"]]} /></ControlGroup>
      <ControlGroup label="トリガーされたアラートに追加" labelPosition="left" labelWidth={170}><span className="f-wrap" id="f-al-add"><Switch appearance="checkbox" selected={v["al-add"] === "yes"} onClick={() => act("pick", "al-add", v["al-add"] === "yes" ? "no" : "yes")}>追加する（重要度：中）</Switch></span></ControlGroup>
    </Dialog>
  );
}

/* ---------- Security Essentials ---------- */
function SSEPage({ c, tip }) {
  if (c.view === "list") {
    return (
      <div className="sp-page-body">
        <div className="sp-head"><Heading level={2}>Security Content</Heading><span className="dt-fine">Splunk Security Essentials（画面イメージ・架空）</span></div>
        <div className="sse-filter"><Text value="認証" canClear={false} startAdornment={<span className="sse-ic"><Magnifier /></span>} /></div>
        <div className="sse-list">
          <div id="sse-item-ps" data-id="sse-item-ps" className="sse-row"><Card style={{ width: "100%" }}><Card.Header title="Detect Password Spray Attempts" subtitle="Access ／ 認証" /><Card.Body>多数のアカウントに対する認証の試行を検知するコンテンツ（要約・架空）</Card.Body></Card></div>
          <div data-id="sse-item-other1" className="sse-row dim"><Card style={{ width: "100%" }}><Card.Header title="（他のコンテンツ名は省略・架空）" subtitle="認証関連" /></Card></div>
          <div data-id="sse-item-other2" className="sse-row dim"><Card style={{ width: "100%" }}><Card.Header title="（他のコンテンツ名は省略・架空）" subtitle="認証関連" /></Card></div>
        </div>
        <p className="dt-fine">SSEはSplunk Cloud Platformで使える無料のアプリで、ESの専用機能ではありません。項目名と日本語表示は実機で確かめます（9章 #10）。</p>
      </div>
    );
  }
  return (
    <div className="sp-page-body">
      <Breadcrumbs><Breadcrumbs.Item label="Security Content" onClick={go((x) => { x.view = "list"; })} /><Breadcrumbs.Item label="Detect Password Spray Attempts" isCurrent /></Breadcrumbs>
      <div className="sp-head"><Heading level={2}>Detect Password Spray Attempts</Heading><span className="row-actions"><Button appearance="secondary" label="Open in Search" /><Button appearance="secondary" label="Schedule Saved Search" /></span></div>
      <section className="sse-sec"><Heading level={4}>Description（要約・架空）</Heading><Paragraph>同じ接続元から多数のアカウントに対して、少数のパスワードで認証を試みる行動を検知します。</Paragraph></section>
      <section className="sse-sec"><Heading level={4}>Data Sources（必要なログ）</Heading><Paragraph>認証ログ（VPN、IdP など）。A社では VPN 認証イベントを使います。</Paragraph></section>
      <section className="sse-sec clickable" id="sse-kfp" data-id="sse-kfp">
        <Heading level={4}>Known False Positives（誤検知になりやすい条件）</Heading><Paragraph>パスワードを忘れた利用者の再試行、共有端末からの多数の利用者の認証、自動化された正規の処理など（要約・架空）。</Paragraph>
        <Heading level={4}>How to Respond（対応のしかた）</Heading><Paragraph>接続元の正規性、対象アカウントの本人確認、成功後の操作の確認（要約・架空）。</Paragraph>
      </section>
      <div className="tt-note"><span className="lab">テックタッチ（案）</span><TipWrap id="tw-std" label="A社の検知基準 D-01（KB02）" tipKey="std" tip={tip} /></div>
      <div className="tt-note" id="sse-q5"><span className="lab">テックタッチ（案）：本番用の検索の骨格（Q5）</span><p>固定CSVの inputlookup をそのまま定期実行しても、継続的な本番監視にはなりません。本番用はインデックス化された認証イベントを検索します。</p><pre className="code">{SPL_Q5}</pre></div>
    </div>
  );
}

/* ---------- アクティビティ：トリガーされたアラート ---------- */
function Checklist({ c }) {
  return (
    <div className="tt-note" id="ck-list"><span className="lab">テックタッチ 調査のチェックリスト（案）</span>
      <div className="ck-grid">{CK.map((k) => (
        <div className="ck-row" key={k[0]}><span>{k[1]}</span>
          <span className="dt-field tip-anchor" id={"f-" + k[0]}><select key={k[0] + (c.vals[k[0]] || "")} data-id={k[0]} id={k[0]} defaultValue={c.vals[k[0]] || ""}><option value="">選択…</option><option value="done">確認済み</option><option value="todo">未確認</option></select></span>
        </div>))}</div>
      <div className="row-actions"><button type="button" className="dt-emph" id="ck-fill" data-id="ck-fill">例を入れる</button><button type="button" className="dt-accent" id="ck-handoff" data-id="ck-handoff" disabled={c.handed}>{c.handed ? "引き継ぎ済み" : "上位者へ引き継ぐ"}</button></div>
    </div>
  );
}
function ActivityPage({ c }) {
  if (c.view === "list") {
    return (
      <div className="sp-page-body">
        <Breadcrumbs><Breadcrumbs.Item label="アクティビティ" /><Breadcrumbs.Item label="トリガーされたアラート" isCurrent /></Breadcrumbs>
        <div className="sp-head"><Heading level={2}>トリガーされたアラート</Heading><span className="dt-fine">既定で24時間で消えます（架空の一覧）</span></div>
        <Table stripeRows>
          <Table.Head><Table.HeadCell>時刻</Table.HeadCell><Table.HeadCell>発火元</Table.HeadCell><Table.HeadCell>アプリ</Table.HeadCell><Table.HeadCell>タイプ</Table.HeadCell><Table.HeadCell>重要度</Table.HeadCell><Table.HeadCell>モード</Table.HeadCell><Table.HeadCell>操作</Table.HeadCell></Table.Head>
          <Table.Body><Table.Row key="a"><Table.Cell>2026-10-08 09:15:00</Table.Cell><Table.Cell>SOC_認証_失敗後の特権成功</Table.Cell><Table.Cell>search</Table.Cell><Table.Cell>保存済み検索</Table.Cell><Table.Cell>中</Table.Cell><Table.Cell>1回</Table.Cell><Table.Cell><Link id="act-row-a" onClick={click("act-row-a")}>結果を表示</Link></Table.Cell></Table.Row></Table.Body>
        </Table>
      </div>
    );
  }
  const main = (
    <div className="sp-search">
      <Breadcrumbs><Breadcrumbs.Item label="アクティビティ" /><Breadcrumbs.Item label="トリガーされたアラート" onClick={go((x) => { x.view = "list"; })} /><Breadcrumbs.Item label="SOC_認証_失敗後の特権成功" isCurrent /></Breadcrumbs>
      <div className="sp-head"><span className="sp-title-row"><Heading level={2}>SOC_認証_失敗後の特権成功</Heading><Chip>1 件</Chip></span>
        {c.hub < 3 && <button type="button" className="hub-chip" id="hub-p3" data-id="hub-p3"><Shield />一次調査の整理（AI Hub）</button>}
      </div>
      <ResultTable run="q3" />
      <HubP3 c={c} />
      <Checklist c={c} />
      {c.handed && <Message appearance="fill" type="success">上位者へ引き継ぎました（確認済み事実と未確認事項を分けたまま）。記録はS8で残します。</Message>}
    </div>
  );
  return c.extra ? <div className="sp-split">{main}<Assistant c={c} /></div> : main;
}

/* ---------- 社内ポータル（架空）：S0・S1・S8 ---------- */
function IntraPage({ c }) {
  const v = c.view;
  if (v === "card") return (
    <>
      <div className="i-card" id="i-card" data-id="i-card"><p className="lab">業務依頼カード　SOC-1040（架空）</p><p><b>依頼者：</b>SOC責任者 中村（架空）　<b>期限：</b>今月中</p>
        <blockquote className="i-quote">認証失敗が複数アカウントに広がった後、管理者ログインが成功するケースを見たい。ダッシュボードを作り、検知した後の一次調査まで標準化してください。</blockquote>
        <p className="dt-fine">現状：Splunk CloudでVPNログを監視。委託先が作った検知はあるが、社内で直せない。</p></div>
      <div className="row-actions"><button type="button" className="dt-emph" id="i-flow" data-id="i-flow">従来の流れを見る</button><button type="button" className="dt-emph" data-id="i-goal">ゴールを見る</button></div>
    </>
  );
  if (v === "flow") return (
    <>
      <div className="i-card"><p className="lab">従来の流れ（架空）</p><div className="i-chain" id="i-flow-chain"><span className="n">SOC担当者が依頼票を書く</span><span className="a">→</span><span className="n">委託先が見積</span><span className="a">→</span><span className="n wait">待ち</span><span className="a">→</span><span className="n">委託先が改修</span><span className="a">→</span><span className="n wait">待ち</span><span className="a">→</span><span className="n">担当者が確認</span></div>
        <p className="dt-fine">待ち時間は社内で把握していません。SPLの修正もダッシュボードの変更も、この流れです。</p></div>
      <div className="row-actions"><button type="button" className="dt-emph" id="i-goal" data-id="i-goal">ゴールを見る</button></div>
    </>
  );
  if (v === "goal") return (
    <div className="i-card"><p className="lab">デモ終了時に画面に残す成果物</p><ol className="i-goals" id="i-goal-list">{GOALS.map((g) => <li key={g}>{g.slice(1)}</li>)}</ol>
      <p className="dt-fine">Splunkの機能を増やすのではなく、既にあるログを、SOC担当者自身が分析・監視・調査・改善に使えるようにします。</p></div>
  );
  if (v === "request") return (
    <>
      <div className="tip-anchor block" id="i-req" data-id="i-req"><div className="chat"><span className="av">中</span><div><p className="who"><b>中村（SOC責任者・架空）</b>社内チャット（架空）</p><p className="say">認証失敗が複数アカウントに広がった後、管理者ログインが成功するケースを見たい。ダッシュボードを作り、検知した後の一次調査まで標準化してください。</p></div><span className="src">09:00</span></div></div>
      <div className="row-actions"><button type="button" className="dt-accent" id="i-open-splunk" data-id="i-open-splunk">既存のダッシュボードを開く（Splunk）</button></div>
    </>
  );
  if (v === "ticket") return (
    <div className="i-card" id="i-ticket"><p className="lab">改修依頼チケット　SOC-1042（架空）</p><p><b>宛先：</b>委託先　<b>状態：</b><span className="status active">委託先の回答待ち</span></p>
      <p><b>依頼内容：</b>同一IPから複数ユーザーに認証失敗した後、対象の管理者本人がログインに成功したケースを抽出する検索と、ダッシュボードの変更。</p>
      <p className="dt-fine">作成 2026-10-08　回答予定：未定。この間、SOCの監視は変わりません。</p></div>
  );
  if (v === "improve") return (
    <>
      <div className="i-card"><p className="lab">改善チケット　SOC-1043（架空）</p><p><b>件名：</b>承認済み検索テンプレートにQ3（失敗後の特権成功）を追加　<b>承認者：</b>SOC責任者　<b>見直し日：</b>2026-11-08</p>
        <p>内容：失敗件数だけでなく、異なるアカウント数・同一ユーザー・前後関係を明示する検索（Q3）を承認済みテンプレート（KB03）に追加。事例C-2026-10（ケースA）をKB05に登録。</p></div>
      <div className="i-card"><p className="lab">今日の成果物</p><ol className="i-goals">{GOALS.map((g) => <li key={g}>{g.slice(1)}</li>)}</ol></div>
    </>
  );
  // record（S8）
  return (
    <>
      <div className="i-card" id="rec-form"><p className="lab">一次調査の記録　SOC-1042-R（チケット管理・架空）</p>
        {REC.map((r) => <div className="dlg-row" key={r[0]}><span className="k">{r[1]}</span><span className="dt-field tip-anchor" id={"f-" + r[0]}><input type="text" key={r[0] + (c.vals[r[0]] || "")} data-id={r[0]} id={r[0]} defaultValue={c.vals[r[0]] || ""} placeholder={r[1] + "を書く"} disabled={c.recorded} /></span></div>)}
        <div className="row-actions"><button type="button" className="dt-emph" id="rec-fill" data-id="rec-fill" disabled={c.recorded}>例文を入れる</button><button type="button" className="dt-accent" id="rec-save" data-id="rec-save" disabled={c.recorded}>{c.recorded ? "保存済み" : "保存"}</button></div></div>
      {c.recorded && c.hub < 3 && <button type="button" className="hub-chip" id="hub-p4" data-id="hub-p4"><Shield />ナレッジへの反映候補（AI Hub）</button>}
      {c.hub >= 3 && (
        <section className="hub-win" aria-label="AI Hub：ナレッジへの反映候補（構想・架空画面）">
          <HubHead title="ナレッジへの反映候補（P4）" sub="例文" />
          <dl className="kv"><dt>変更申請</dt><dd>KB03 承認済み検索に「Q3 失敗後の特権成功」を v1.1 として追加（現在：承認待ち）</dd><dt>事例</dt><dd>KB05 にケースA（2026-10-08）を登録。確認済み・未確認を分けて記載</dd><dt>承認者</dt><dd>SOC責任者　見直し日：2026-11-08</dd></dl>
          <div className="row-actions"><button type="button" className="dt-accent hub-btn" id="imp-ticket" data-id="imp-ticket">改善チケットを起票</button></div>
        </section>
      )}
    </>
  );
}

/* ---------- 全体 ---------- */
function Stage({ ch, c, tip, who }) {
  const theme = "light";
  if (c.app === "intra") {
    return (
      <SplunkThemeProvider family="enterprise" colorScheme={theme} density="comfortable">
        <div className="dt-app intra-app">
          <div className="sp-bar intra"><span className="sp-logo">A社 社内ポータル<small>架空</small></span><span className="sp-menus"><span>チケット</span><span>チャット</span><span>ナレッジ</span><span className="user">{who} ▾</span></span></div>
          <div className="dt-page intra-page"><IntraPage c={c} /></div>
        </div>
      </SplunkThemeProvider>
    );
  }
  let page = null;
  if (c.app === "search") page = <SearchPage c={c} ch={ch} tip={tip} />;
  else if (c.app === "reports") page = <ReportsPage />;
  else if (c.app === "dashboards") page = <DashboardsPage c={c} />;
  else if (c.app === "sse") page = <SSEPage c={c} tip={tip} />;
  else if (c.app === "activity") page = <ActivityPage c={c} />;
  return (
    <SplunkThemeProvider family="enterprise" colorScheme={theme} density="comfortable">
      <div className={"dt-app" + (c.dialog || c.view === "new" ? " has-dialog" : "")}>
        <SplunkBar who={who} />
        <AppBar app={c.app} />
        <div className="dt-page">{page}</div>
      </div>
    </SplunkThemeProvider>
  );
}
