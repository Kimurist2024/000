// Splunk ES・SOAR の画面イメージを、Splunk 公式の UI ツールキット（@splunk/react-ui ほか、Apache-2.0）で組む。データはすべて架空。
// ES（Incident Review、Content Management）と SOAR の実画面を写したものではなく、公開されている画面構成を手本にした「風」の再現です。
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
import Chip from "@splunk/react-ui/Chip";
import Magnifier from "@splunk/react-icons/Magnifier";
import Cross from "@splunk/react-icons/Cross";
import RobotFaceSparkle from "@splunk/react-icons/RobotFaceSparkle";
import Shield from "@splunk/react-icons/Shield";
import StarSparklesDouble from "@splunk/react-icons/StarSparklesDouble";
import SingleValue from "@splunk/visualizations/SingleValue";
import Column from "@splunk/visualizations/Column";
import { act, patch } from "./engine.js";
import { SPL, SPL_Q5, REPORTS, REQUEST_OUT, FIX_REQUEST, SCOPE_REQ, HR_ASK, HR_REPLY, TIPS, GOALS, CHECK_ROWS, CK, REC, RESULTS, RUN_TITLE, NOTABLES, ANOMALIES, RISK_EVENTS, PLAYBOOK, APPROVAL_TICKET, EXCEPT_ACCOUNTS } from "./data.js";

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
  risk: ds(["risk_score"], [[165]]),
  anom: ds(["anomaly", "score"], [ANOMALIES.map((a) => a[1].split("（")[0]), ANOMALIES.map((a) => a[2])])
};
function ResultTable({ run }) {
  const r = RESULTS[run];
  if (!r.rows.length) return <div className="sp-empty small"><p>結果が見つかりません（0 件）。</p>{r.note && <Message appearance="fill" type="info">{r.note}</Message>}</div>;
  return (
    <>
      <Table stripeRows>
        <Table.Head><Table.HeadCell width={40}>#</Table.HeadCell>{r.cols.map((c) => <Table.HeadCell key={c}>{c}</Table.HeadCell>)}</Table.Head>
        <Table.Body>
          {r.rows.map((row, i) => (
            <Table.Row key={i}><Table.Cell>{i + 1}</Table.Cell>{row.slice(1).map((v, j) => <Table.Cell key={j}>{j === 0 ? <span id={"res-row-" + (row[0] || i)} className="res-key">{v}</span> : v}</Table.Cell>)}</Table.Row>
          ))}
        </Table.Body>
      </Table>
      {r.note && <Message appearance="fill" type="info">{r.note}</Message>}
    </>
  );
}

/* ---------- Splunk Web の枠（上部バー・ESのアプリバー） ---------- */
function SplunkBar({ who }) {
  return (
    <div className="sp-bar">
      <span className="sp-logo">Splunk Cloud Platform<small>画面イメージ・架空</small></span>
      <span className="sp-menus"><span>メッセージ ▾</span><span>設定 ▾</span><span>アクティビティ ▾</span><span>ヘルプ ▾</span><span>検索</span><span className="user">{who} ▾</span></span>
    </div>
  );
}
function AppBar({ app }) {
  const items = [["", "Security Posture", false], ["ir", "Incident Review", app === "ir"], ["", "Investigations", false], ["", "Analytics ▾", false], ["search", "Search ▾", app === "search"], ["cm", "Content Management", app === "cm"]];
  return (
    <div className="app-bar">
      <span className="app-name">Enterprise Security</span>
      <nav className="app-nav">{items.map((it, i) => it[0]
        ? <button type="button" key={i} id={"nav-" + it[0]} data-id={"nav-" + it[0]} className={it[2] ? "active" : ""}>{it[1]}</button>
        : <span key={i} className={it[2] ? "active" : ""}>{it[1]}</span>)}</nav>
    </div>
  );
}

/* ---------- 検索（ESの Search） ---------- */
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
  if (!c.ran) return <div className="sp-empty"><Magnifier /><p>検索を実行すると、ここに結果が出ます。</p><small>固定のテストログ（CSVルックアップ・46件・架空）に対する検索です。</small></div>;
  const r = RESULTS[c.ran], n = r.rows.length;
  return (
    <div className="sp-results">
      <p className="sp-summary"><span className="ok">✓</span> {n + " 件の結果"}　<small>2026/10/01 〜 2026/10/06（固定のテストログ・架空）</small></p>
      <TabLayout activePanelId="stats">
        <TabLayout.Panel label="イベント" panelId="events"><p className="sp-note">固定CSVのルックアップのため、イベント表示は省略します（架空）。</p></TabLayout.Panel>
        <TabLayout.Panel label="パターン" panelId="patterns"><p className="sp-note">省略（架空）。</p></TabLayout.Panel>
        <TabLayout.Panel label={"統計情報 (" + n + ")"} panelId="stats"><ResultTable run={c.ran} /></TabLayout.Panel>
        <TabLayout.Panel label="視覚エフェクト" panelId="viz"><p className="sp-note">この結果は表で確認します（架空）。</p></TabLayout.Panel>
      </TabLayout>
    </div>
  );
}
function SearchPage({ c, ch }) {
  const title = c.q ? RUN_TITLE[c.q] : "新規検索";
  const main = (
    <div className="sp-search">
      <div className="sp-head"><Heading level={2}>{title}</Heading>
        <span className="row-actions">
          {c.chip && <button type="button" className="tt-chip" id="chip-soc" data-id="chip-soc"><StarSparklesDouble />SOC分析アシスト（テックタッチ）</button>}
          {ch === 8 && c.hub < 3 && <button type="button" className="hub-chip" id="hub-p6" data-id="hub-p6"><Shield />範囲確定の検索案（AI Hub）</button>}
          <Button label="名前を付けて保存" isMenu appearance="secondary" />
        </span>
      </div>
      <SearchBar c={c} />
      <Results c={c} />
      {ch === 8 && c.done && c.done.q4b && c.hub < 4 && <button type="button" className="hub-chip" id="hub-p7" data-id="hub-p7"><Shield />通知・報告の判断材料（AI Hub・KB07）</button>}
      {ch === 8 && <HubP7 c={c} />}
    </div>
  );
  return (
    <>
      {ch === 3 && <HubWin c={c} />}
      {ch === 8 && <HubP6 c={c} />}
      {c.assist ? <div className="sp-split">{main}<Assistant c={c} ch={ch} /></div> : main}
      {ch === 4 && <HubCheck c={c} />}
    </>
  );
}

/* ---------- Splunk AI Assistant（画面イメージ・架空） ---------- */
function Bubble({ t }) { return <div className="bubble">{t}</div>; }
function Answer({ spl, bullets, btnId, btnLabel }) {
  return (
    <div className="as-ans">
      <p className="ai-label">Splunk AI Assistant（参考画面・架空の表示）</p>
      <pre className="code">{spl}</pre>
      <ul>{bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
      <div className="row-actions"><Button id={btnId} appearance="secondary" label={btnLabel || "検索に入れる"} onClick={click(btnId)} /><Button appearance="secondary" label="コピー" /></div>
    </div>
  );
}
function Assistant({ c, ch }) {
  const st = c.stage || 0;
  if (ch === 8) {
    return (
      <aside className="assist" aria-label="Splunk AI Assistant（画面イメージ・架空）">
        <div className="assist-head"><RobotFaceSparkle />Splunk AI Assistant</div>
        <p className="dt-fine">画面イメージ（架空）。有償のSplunk Cloudの機能で、トライアル環境では使えません。回答はデモ用に準備した参考画面です。</p>
        {st >= 2 && <><Bubble t={SCOPE_REQ} />
          <Answer spl={SPL.q4a} btnId="as-insert-q4a" btnLabel="検索に入れる（Q4a）" bullets={["export を dataset 別に集計し、件数・項目・最初と最後の時刻を出します。addcoltotals で合計行を付けます。"]} />
          <Answer spl={SPL.q4b} btnId="as-insert-q4b" btnLabel="検索に入れる（Q4b）" bullets={["顧客系システムの監査ログで、同じ user または src のアクセスを一覧にします。0件なら「この範囲では確認されない」です。"]} /></>}
        {st < 2 && <div className="as-in" id="as-input"><div className="as-ta ph">AI Hubの依頼文を貼ると、ここに検索案が返ります…</div></div>}
      </aside>
    );
  }
  const ta = st === 1 ? REQUEST_OUT : st === 3 ? FIX_REQUEST : "";
  return (
    <aside className="assist" aria-label="Splunk AI Assistant（画面イメージ・架空）">
      <div className="assist-head"><RobotFaceSparkle />Splunk AI Assistant</div>
      <p className="dt-fine">画面イメージ（架空）。有償のSplunk Cloudの機能で、トライアル環境では使えません。回答はデモ用に準備した参考画面です。</p>
      {st >= 2 && <><Bubble t={REQUEST_OUT} /><Answer spl={SPL.ai1} btnId="as-insert" bullets={["平常値ルックアップと比べて普段と違うサインインを求め、その後60分以内の view／export を user・src で集計し、1,000件以上で絞ります。", "（この案には、退職者区分 scope=retired の条件と、申請番号 request_id による除外が入っていません。AI Hubで照合します）"]} /></>}
      {st >= 2 && c.hub < 3 && <button type="button" className="hub-chip" id="hub-check" data-id="hub-check"><Shield />D-02との照合（AI Hub）</button>}
      {st >= 4 && <><Bubble t={FIX_REQUEST} /><Answer spl={SPL.q3} btnId="as-insert2" bullets={["request_id が空なら null にし、stats で retired_records と values(request_id)、first_access・last_access を出します。", "records が1,000件以上、retired_records が1件以上、request_id が null の行だけを残します。"]} /></>}
      <div className="as-in" id="as-input">
        <div className={"as-ta" + (ta ? "" : " ph")}>{ta || "質問や依頼を入力…"}</div>
        <div className="row-actions">
          {st === 0 && <Button id="as-paste" appearance="secondary" label="貼り付け（S2の依頼文）" onClick={click("as-paste")} />}
          <Button id="as-send" appearance="primary" label="送信" disabled={!(st === 1 || st === 3)} onClick={click("as-send")} />
        </div>
      </div>
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
      <p className="kb-row">参照ナレッジ：<span className="kb">KB01 ログ辞書（人事システム）</span><span className="kb">KB02 検知基準 D-02</span><span className="kb">KB03 承認済み検索</span><span className="dt-fine">（プロンプトP1）</span></p>
      <div className="tip-anchor block" id="hub-in-wrap"><textarea key={"hub-in-" + (c.vals["hub-in"] || "")} data-id="hub-in" id="hub-in" rows={3} defaultValue={c.vals["hub-in"] || ""} placeholder="やりたいことを日本語で書いてください" aria-label="AI Hubへの依頼" /></div>
      <div className="row-actions"><button type="button" className="dt-emph" id="hub-fill" data-id="hub-fill">例文を入れる</button><button type="button" className="dt-accent hub-btn" id="hub-send" data-id="hub-send" disabled={!c.vals["hub-in"]}>整理する</button></div>
      {c.hub >= 3 && (
        <div className="hub-ans">
          <p className="lab">AI Hubの整理（例文）</p>
          <dl className="kv"><dt>対象</dt><dd>人事システム監査ログ。フィールドは event_time、user、src、geo、asn、action、record_count、scope、request_id。平常値は demo_hr_baseline.csv（KB01）</dd>
            <dt>条件</dt><dd>普段と違う接続元（国・ASN）からのサインインの後60分以内に、同じアカウントが1,000件以上を参照・エクスポートし、退職者（scope=retired）を含む（KB02 D-02）</dd>
            <dt>例外</dt><dd>申請番号（request_id）のある一斉処理・保守作業は除外。ただし退職者データの持ち出しは別途記録</dd>
            <dt>確認</dt><dd>時刻の前後関係、MFAの結果、重複、申請の有無</dd>
            <dt>分析の分け方</dt><dd>「普段と違うサインイン」「60分の参照集計」「閾値・退職者・例外」「範囲の確定」（KB03 Q1〜Q4）</dd></dl>
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
    <section className="hub-win" aria-label="AI Hub：D-02との照合（構想・架空画面）">
      <HubHead title="D-02との照合（P2）" sub="構文ではなく、検知基準の業務条件で評価（例文）" />
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
      <HubHead title="一次調査の整理（P3・KB04：人事システム）" sub="例文。侵害の成立は推定しない" />
      <dl className="kv"><dt>確認済み事実</dt><dd>hr_ops03、接続元 198.51.100.77（国外1／AS64500、平常は国内）、02:14 サインイン（MFA approved）、02:18〜02:37 に在籍・退職者を88,420件参照・エクスポート、申請番号なし、UEBA異常85＋D-02 80</dd>
        <dt>追加の確認</dt><dd>人事部の業務確認（申請済みの一斉処理・保守か）、本人確認（本人の操作か）、顧客系・他システムへのアクセス、認証情報の入手経路</dd>
        <dt>人事部への問い合わせ</dt><dd>下の文面を社内チャットで送る。回答を得るまで判定は「要対応（暫定）」</dd>
        <dt>判断の進め方</dt><dd>申請なしで退職者データを含む場合、本人確認を待たずに封じ込め①②へ進み、③はSOC責任者の承認を取る（KB06）</dd></dl>
      <pre className="code req">{HR_ASK}</pre>
      <div className="row-actions"><button type="button" className="dt-accent hub-btn" id="hub-ask-hr" data-id="hub-ask-hr" disabled={c.asked}>{c.asked ? "人事部に送りました" : "問い合わせ文を人事部に送る（社内チャット）"}</button></div>
      {c.asked && (
        <div className="chat hr-chat"><span className="av">田</span><div><p className="who"><b>田中（人事部・架空）</b>社内チャット（架空）</p><p className="say">{c.replied ? HR_REPLY : "（回答待ち…）"}</p></div>
          {!c.replied && <button type="button" className="dt-emph" id="hr-reply" data-id="hr-reply">回答を受け取る（デモ）</button>}</div>
      )}
    </section>
  );
}
function HubP5({ c }) {
  if (c.hub < 3) return null;
  return (
    <section className="hub-win" aria-label="AI Hub：承認段階の照合（構想・架空画面）">
      <HubHead title="承認段階の照合（P5・KB06 対応権限表）" sub="例文" />
      <dl className="kv"><dt>対象アカウント</dt><dd>hr_ops03（人事部 一般）。例外リスト（{EXCEPT_ACCOUNTS.join("、")}）に該当しない</dd>
        <dt>いま実行してよい範囲</dt><dd>①セッション失効・②パスワードリセットは即時。③アカウント停止はSOC責任者の承認チケットを添えて実行。④外部接続遮断はCSIRT責任者の判断（範囲の確定を渡す）</dd></dl>
      <table className="hub-tbl"><thead><tr><th>アクション</th><th>承認者</th><th>今回</th></tr></thead>
        <tbody>{PLAYBOOK.steps.map((s) => <tr key={s[0]}><td><b>{s[0]} {s[1]}</b></td><td>{s[2]}</td><td>{s[3] === "soc" ? <span className="st on">実行</span> : s[3] === "lead" ? <span className="st">承認を取って実行</span> : <span className="st ng">判断材料を渡す</span>}</td></tr>)}</tbody></table>
    </section>
  );
}
function HubP6({ c }) {
  if (c.hub < 3) return null;
  return (
    <section className="hub-win" aria-label="AI Hub：範囲確定の検索案（構想・架空画面）">
      <HubHead title="範囲確定の検索案（P6・KB03）" sub="例文。対象アカウント・接続元を当てはめた依頼文" />
      <pre className="code req">{SCOPE_REQ}</pre>
      <div className="row-actions"><button type="button" className="dt-accent hub-btn" id="hub-copy-scope" data-id="hub-copy-scope" disabled={c.stage >= 2}>{c.stage >= 2 ? "Assistantに渡しました" : "依頼文をAssistantに渡す"}</button></div>
    </section>
  );
}
function HubP7({ c }) {
  if (c.hub < 4) return null;
  return (
    <section className="hub-win" aria-label="AI Hub：通知・報告の判断材料（構想・架空画面）">
      <HubHead title="通知・報告の判断材料（P7・KB07）" sub="例文。報告の要否は判断しない" />
      <table className="hub-tbl"><thead><tr><th>項目</th><th>確認済み</th><th>未確認</th></tr></thead>
        <tbody>
          <tr><td><b>対象者数・区分</b></td><td>エクスポート 86,420件（在籍31,240・退職者55,180）</td><td>重複・退職年の分布</td></tr>
          <tr><td><b>項目</b></td><td>従業員番号・氏名・住所・電話番号・所属・職位・上司氏名（7項目）</td><td>—</td></tr>
          <tr><td><b>顧客情報</b></td><td>顧客系システムに同じアカウント・接続元のアクセスなし（Q4b）</td><td>他の経路・他アカウント</td></tr>
          <tr><td><b>二次被害</b></td><td>—</td><td>外部への流出の有無、悪用の兆候</td></tr>
          <tr><td><b>封じ込め</b></td><td>①②即時、③承認済み（{APPROVAL_TICKET}）</td><td>④はCSIRT判断</td></tr>
        </tbody></table>
      <div className="row-actions"><button type="button" className="dt-accent hub-btn" id="rec-open" data-id="rec-open">記録を開く（チケット管理・架空）</button></div>
      <p className="dt-fine">監督官庁への報告と公表の要否は、法務とCSIRTがこの記録をもとに判断します。SOCは判断しません。</p>
    </section>
  );
}

/* ---------- Content Management（保存済み検索と相関検索の作成） ---------- */
function CMPage({ c }) {
  return (
    <div className="sp-page-body">
      <div className="sp-head"><Heading level={2}>Content Management</Heading>
        <Dropdown toggle={<Button id="cm-new" label="新規コンテンツの作成" isMenu appearance="primary" />} open={!!c.menu} retainFocus={false}
          onRequestOpen={() => act("click", "cm-new")} onRequestClose={() => patch((x) => { x.menu = false; })}>
          <Menu>
            <Menu.Item id="cm-corr" onClick={click("cm-corr")}>相関検索</Menu.Item>
            <Menu.Item onClick={click("cm-saved")}>保存済み検索</Menu.Item>
            <Menu.Item onClick={click("cm-lookup")}>ルックアップ</Menu.Item>
            <Menu.Item onClick={click("cm-playbook")}>プレイブック（SOAR）</Menu.Item>
          </Menu>
        </Dropdown>
      </div>
      <p className="dt-fine">ES の Content Management の画面イメージ（架空）。Q1〜Q4はSOCの承認済み検索（KB03）</p>
      <Table stripeRows>
        <Table.Head><Table.HeadCell>名前</Table.HeadCell><Table.HeadCell>種類</Table.HeadCell><Table.HeadCell>説明</Table.HeadCell><Table.HeadCell>所有者</Table.HeadCell><Table.HeadCell>版</Table.HeadCell></Table.Head>
        <Table.Body>
          {c.savedCS && <Table.Row key="cs"><Table.Cell><b>{c.vals["cs-name"]}</b></Table.Cell><Table.Cell>相関検索</Table.Cell><Table.Cell>D-02。15分ごと、リスク80、緊急度 高、抑制 user 60分</Table.Cell><Table.Cell>山田</Table.Cell><Table.Cell>v1.0</Table.Cell></Table.Row>}
          {REPORTS.map((r) => <Table.Row key={r[0]}><Table.Cell><Link id={"rep-" + r[0]} onClick={click("rep-" + r[0])}>{r[1]}</Link></Table.Cell><Table.Cell>保存済み検索</Table.Cell><Table.Cell>{r[2]}</Table.Cell><Table.Cell>山田</Table.Cell><Table.Cell>{r[3]}</Table.Cell></Table.Row>)}
          <Table.Row key="x"><Table.Cell><span className="dt-fine">UEBA_Anomalous_Data_Access（委託先・表示省略）</span></Table.Cell><Table.Cell>相関検索</Table.Cell><Table.Cell>委託先作成。社内で変更できない（架空）</Table.Cell><Table.Cell>委託先</Table.Cell><Table.Cell>—</Table.Cell></Table.Row>
        </Table.Body>
      </Table>
      {c.dialog && <CorrDialog c={c} />}
    </div>
  );
}
function Dialog({ title, children, footer }) {
  return (
    <div className="sp-scrim"><div className="sp-dialog" role="dialog" aria-label={title}>
      <div className="sp-dialog-head"><Heading level={3}>{title}</Heading><Button appearance="subtle" icon={<Cross />} aria-label="閉じる" /></div>
      <div className="sp-dialog-body">{children}</div>
      <div className="sp-dialog-foot">{footer}</div>
    </div></div>
  );
}
function CorrDialog({ c }) {
  const v = c.vals;
  return (
    <Dialog title="相関検索の作成（Content Management）" footer={<><Button appearance="secondary" label="キャンセル" onClick={() => patch((x) => { x.dialog = false; })} /><Button id="cs-save" appearance="primary" label="保存" onClick={click("cs-save")} /></>}>
      <ControlGroup label="検索名" labelPosition="left" labelWidth={170}><span className="f-wrap" id="f-cs-name"><TextField id="cs-name" value={v["cs-name"]} placeholder="SOC_対象_用途" /></span></ControlGroup>
      <ControlGroup label="アプリ" labelPosition="left" labelWidth={170}><Text value="SplunkEnterpriseSecuritySuite" disabled canClear={false} /></ControlGroup>
      <ControlGroup label="説明" labelPosition="left" labelWidth={170}><Text value="検知基準 D-02：普段と違う接続元の後の、退職者を含む大量参照（Q3）" disabled canClear={false} /></ControlGroup>
      <ControlGroup label="検索" labelPosition="left" labelWidth={170}><pre className="code small">{SPL.q3}</pre></ControlGroup>
      <ControlGroup label="実行間隔（cron）" labelPosition="left" labelWidth={170}><Pick id="cs-sched" value={v["cs-sched"]} options={[["15m", "15分ごと（*/15 * * * *）"], ["1h", "1時間ごと"], ["rt", "リアルタイム"]]} /></ControlGroup>
      <ControlGroup label="時間範囲" labelPosition="left" labelWidth={170}><Text value="過去24時間（Splunk Cloudのスケジュール時刻はUTC）" disabled canClear={false} /></ControlGroup>
      <ControlGroup label="トリガー条件" labelPosition="left" labelWidth={170}><Text value="結果の数 が 0 より大きい" disabled canClear={false} /></ControlGroup>
      <ControlGroup label="リスク分析（RBA）" labelPosition="left" labelWidth={170}><span className="row-actions"><Pick id="cs-risk" value={v["cs-risk"]} options={[["20", "リスクスコア 20"], ["50", "リスクスコア 50"], ["80", "リスクスコア 80"]]} /><span className="dt-fine">リスクオブジェクト：user</span></span></ControlGroup>
      <ControlGroup label="ノータブル" labelPosition="left" labelWidth={170}><span className="row-actions"><Pick id="cs-urg" value={v["cs-urg"]} options={[["low", "緊急度：低"], ["medium", "緊急度：中"], ["high", "緊急度：高"]]} /><span className="dt-fine">タイトル：SOC_人事_異常参照_D-02: $user$ from $src$</span></span></ControlGroup>
      <ControlGroup label="抑制（スロットル）" labelPosition="left" labelWidth={170}><Pick id="cs-throttle" value={v["cs-throttle"]} options={[["none", "抑制しない"], ["60user", "同じ user で60分"]]} /></ControlGroup>
      <p className="dt-fine">ESの相関検索の作成画面を手本にした画面イメージ（架空）。項目名と配置は実機で確かめます。</p>
    </Dialog>
  );
}

/* ---------- Incident Review（ノータブル） ---------- */
function Urgency({ u }) { return <span className={"urg " + (u === "高" ? "high" : u === "中" ? "mid" : "low")}>{u}</span>; }
function NotableRow({ n, onOpen, owner, status }) {
  return (
    <Table.Row key={n.id}>
      <Table.Cell>{n.time}</Table.Cell><Table.Cell>{n.domain}</Table.Cell>
      <Table.Cell><Link id={"ir-row-" + n.id.slice(2)} onClick={onOpen}>{n.title}</Link></Table.Cell>
      <Table.Cell><Urgency u={n.urgency} /></Table.Cell><Table.Cell>{status || n.status}</Table.Cell><Table.Cell>{owner || n.owner}</Table.Cell><Table.Cell>{n.risk}</Table.Cell>
    </Table.Row>
  );
}
function IRPage({ c, ch, tip }) {
  const before = ch === 2;
  if (c.view === "list") {
    return (
      <div className="sp-page-body">
        <div className="sp-head"><Heading level={2}>Incident Review</Heading><span className="dt-fine">ESの画面イメージ（架空）。{before ? "2026-10-06 06:30 時点" : "2026-10-06 時点"}</span></div>
        <div className="ir-filter"><Chip>状態：すべて</Chip><Chip>緊急度：すべて</Chip><Chip>担当者：すべて</Chip><Chip>過去24時間</Chip></div>
        <Table stripeRows>
          <Table.Head><Table.HeadCell>時刻</Table.HeadCell><Table.HeadCell>セキュリティドメイン</Table.HeadCell><Table.HeadCell>タイトル</Table.HeadCell><Table.HeadCell>緊急度</Table.HeadCell><Table.HeadCell>状態</Table.HeadCell><Table.HeadCell>担当者</Table.HeadCell><Table.HeadCell>リスクスコア</Table.HeadCell></Table.Head>
          <Table.Body>
            {!before && <NotableRow n={NOTABLES.d02} onOpen={click("ir-row-d02")} owner={c.owner ? "山田" : undefined} status={c.owner ? "進行中" : undefined} />}
            <NotableRow n={NOTABLES.ueba} onOpen={click("ir-row-ueba")} />
          </Table.Body>
        </Table>
        {before && <p className="dt-fine">02:20 に発生したノータブルが、06:30 まで未割当のままです（架空）。</p>}
      </div>
    );
  }
  const n = before ? NOTABLES.ueba : NOTABLES.d02;
  return (
    <div className="sp-page-body">
      <Breadcrumbs><Breadcrumbs.Item label="Incident Review" onClick={go((x) => { x.view = "list"; })} /><Breadcrumbs.Item label={n.title} isCurrent /></Breadcrumbs>
      <div className="sp-head"><span className="sp-title-row"><Heading level={2}>{n.title}</Heading><Urgency u={n.urgency} /></span>
        <span className="row-actions">
          {!before && <Button id="ir-own" appearance={c.owner ? "secondary" : "primary"} label={c.owner ? "担当者：山田（進行中）" : "担当者を自分にする"} disabled={c.owner} onClick={click("ir-own")} />}
          {!before && c.owner && c.hub < 3 && <button type="button" className="hub-chip" id="hub-p3" data-id="hub-p3"><Shield />一次調査の整理（AI Hub）</button>}
          {before && <Button appearance="secondary" label="担当者：未割当" disabled />}
        </span>
      </div>
      <div className="ir-grid">
        <Card style={{ width: "100%" }}><Card.Header title="ノータブルの概要" /><Card.Body>
          <dl className="kv"><dt>発生</dt><dd>{n.time}</dd><dt>状態</dt><dd>{!before && c.owner ? "進行中" : n.status}</dd><dt>リスクオブジェクト</dt><dd>user: hr_ops03</dd><dt>接続元</dt><dd>198.51.100.77（国外1／AS64500）</dd>
            {!before && <><dt>相関検索</dt><dd>SOC_人事_異常参照_D-02（15分ごと）</dd><dt>結果</dt><dd>records 88,420／retired_records 55,980／request_id なし（02:18〜02:37）</dd></>}</dl>
        </Card.Body></Card>
        <Card style={{ width: "100%" }}><Card.Header title="リスクスコア（RBA）" subtitle={before ? "UEBAの異常のみ" : "UEBA 85 ＋ 相関検索 80"} /><Card.Body>
          <div className="viz-single" style={{ height: 250 }}><SingleValue dataSources={before ? ds(["risk_score"], [[85]]) : DS.risk} options={{ majorColor: "#dc4e41", showSparklineAreaGraph: false }} /></div>
        </Card.Body></Card>
        <Card style={{ width: "100%" }} id="ir-anom"><Card.Header title="UEBAの異常（内訳）" subtitle="ESに統合されたUEBAの画面イメージ（架空）" /><Card.Body>
          <table className="hub-tbl"><thead><tr><th>時刻</th><th>異常</th><th>スコア</th></tr></thead><tbody>{ANOMALIES.map((a) => <tr key={a[1]}><td>{a[0]}</td><td>{a[1]}</td><td>{a[2]}</td></tr>)}</tbody></table>
          {!before && <table className="hub-tbl"><thead><tr><th>時刻</th><th>リスクイベント</th><th>スコア</th></tr></thead><tbody>{RISK_EVENTS.map((a) => <tr key={a[1]}><td>{a[0]}</td><td>{a[1]}</td><td>{a[2]}</td></tr>)}</tbody></table>}
          <div style={{ height: 200 }}><Column dataSources={DS.anom} options={{ legendDisplay: "off", xAxisTitleText: "anomaly", yAxisTitleText: "score" }} /></div>
        </Card.Body></Card>
      </div>
      {before && <Card style={{ width: "100%" }}><Card.Header title="コメント（架空）" /><Card.Body><p className="dt-fine">02:35 委託先（夜間SOC）：業務の一斉処理の可能性あり。A社の確認待ち。チケット SOC-2061 を起票。</p><p className="dt-fine">06:30 （コメントなし。担当者未割当のまま）</p></Card.Body></Card>}
      {!before && <HubP3 c={c} />}
      {!before && c.replied && <Checklist c={c} tip={tip} />}
      {!before && c.escalated && <Message appearance="fill" type="success">判定「要対応（暫定）」で封じ込めへ進みます（確認済み・未確認を分けたまま）。記録はS7で残します。</Message>}
    </div>
  );
}
function Checklist({ c, tip }) {
  return (
    <div className="tt-note" id="ck-list"><span className="lab">テックタッチ 一次対応のチェックリスト（案・KB04）</span>
      <div className="ck-grid">{CK.map((k) => (
        <div className="ck-row" key={k[0]}><span>{k[1]}</span>
          <span className="dt-field tip-anchor" id={"f-" + k[0]}><select key={k[0] + (c.vals[k[0]] || "")} data-id={k[0]} id={k[0]} defaultValue={c.vals[k[0]] || ""}><option value="">選択…</option><option value="done">確認済み</option><option value="todo">未確認</option></select></span>
        </div>))}
        <div className="ck-row disp"><TipWrap id="tw-disp" label="判定区分" tipKey="disp" tip={tip} />
          <span className="dt-field tip-anchor" id="f-disp"><select key={"disp" + (c.vals.disp || "")} data-id="disp" id="disp" defaultValue={c.vals.disp || ""}><option value="">選択…</option><option value="fp">誤検知</option><option value="legit">正当な利用</option><option value="tp">要対応（暫定）</option></select></span></div>
      </div>
      <div className="row-actions"><button type="button" className="dt-emph" id="ck-fill" data-id="ck-fill">例を入れる</button><button type="button" className="dt-accent" id="ck-escalate" data-id="ck-escalate" disabled={c.escalated}>{c.escalated ? "封じ込めへ進みました" : "封じ込めへ進む（SOAR）"}</button></div>
    </div>
  );
}

/* ---------- SOAR（プレイブックの実行・画面イメージ） ---------- */
function SOARPage({ c, tip }) {
  const v = c.vals, scope = v["pb-scope"];
  const stateOf = (i) => {
    if (!c.ran) return ["—", ""];
    if (i < 2) return ["成功", "ok"];
    if (i === 2) return c.approved ? ["成功（承認 " + APPROVAL_TICKET + "）", "ok"] : ["承認待ち（SOC責任者）", "wait"];
    return ["対象外（CSIRT責任者の判断）", ""];
  };
  return (
    <div className="sp-page-body soar-page">
      <Breadcrumbs><Breadcrumbs.Item label="Playbooks" /><Breadcrumbs.Item label={PLAYBOOK.name} isCurrent /></Breadcrumbs>
      <div className="sp-head"><span className="sp-title-row"><Heading level={2}>{PLAYBOOK.name}</Heading><Chip>コンテナ #2061：hr_ops03</Chip></span>
        {c.hub < 3 && <button type="button" className="hub-chip" id="hub-p5" data-id="hub-p5"><Shield />承認段階の照合（AI Hub・KB06）</button>}
      </div>
      <HubP5 c={c} />
      <div className="ir-grid two">
        <Card style={{ width: "100%" }}><Card.Header title="入力" subtitle="テックタッチの入力チェック付き（案）" /><Card.Body>
          <ControlGroup label="対象アカウント" labelPosition="left" labelWidth={150}><Text value="hr_ops03" disabled canClear={false} /></ControlGroup>
          <ControlGroup label="接続元" labelPosition="left" labelWidth={150}><Text value="198.51.100.77" disabled canClear={false} /></ControlGroup>
          <ControlGroup label="実行範囲" labelPosition="left" labelWidth={150}><Pick id="pb-scope" value={scope} options={[["12", "①〜②（即時のみ）"], ["123", "①〜③（アカウント停止まで）"], ["1234", "①〜④（外部接続遮断まで）"]]} /></ControlGroup>
          <ControlGroup label="③の承認チケット" labelPosition="left" labelWidth={150}><span className="row-actions"><span className="f-wrap" id="f-pb-ticket"><TextField id="pb-ticket" value={v["pb-ticket"]} placeholder="APV-…" /></span><button type="button" className="dt-emph" id="pb-ticket-fill" data-id="pb-ticket-fill">例を入れる</button></span></ControlGroup>
          <div className="tt-note"><TipWrap id="tw-auth" label="承認段階 KB06" tipKey="auth" tip={tip} /></div>
          <div className="row-actions"><Button id="pb-run" appearance="primary" label={c.ran ? "実行済み" : "実行"} disabled={c.ran} onClick={click("pb-run")} /></div>
        </Card.Body></Card>
        <Card style={{ width: "100%" }}><Card.Header title="アクションの状態" subtitle="プレイブックの実行結果（架空）" /><Card.Body>
          <table className="hub-tbl"><thead><tr><th>アクション</th><th>承認者</th><th>状態</th></tr></thead>
            <tbody>{PLAYBOOK.steps.map((s, i) => { const st = stateOf(i); return <tr key={s[0]}><td><b>{s[0]} {s[1]}</b></td><td>{s[2]}</td><td><span className={"st " + st[1]}>{st[0]}</span></td></tr>; })}</tbody></table>
          {c.ran && !c.approved && <div className="row-actions"><Button id="pb-approve" appearance="primary" label="SOC責任者が承認する（デモ）" onClick={click("pb-approve")} /></div>}
          {c.approved && <Message appearance="fill" type="success">③アカウント停止を実行しました。閲覧は止まっています。④はCSIRT責任者へ範囲の確定（S7）を渡して判断を仰ぎます。</Message>}
        </Card.Body></Card>
      </div>
      <p className="dt-fine">Splunk SOAR の画面を手本にした画面イメージ（架空）。公式UI部品で組んでおり、SOARの実画面ではありません。</p>
    </div>
  );
}

/* ---------- 社内ポータル（架空）：S0・S1・S7・S8 ---------- */
function IntraPage({ c }) {
  const v = c.view;
  if (v === "card") return (
    <>
      <div className="i-card" id="i-card" data-id="i-card"><p className="lab">業務依頼カード　SOC-2070（架空）</p><p><b>依頼者：</b>SOC責任者 中村（架空）　<b>期限：</b>今月中</p>
        <blockquote className="i-quote">先週、人事システムへの普段と違うアクセスのノータブルが出たが、委託先の回答待ちで一次対応が4時間止まった。ES・UEBA・SOARは入っている。検知から封じ込め・範囲の確定・記録まで、日本の社内で回せるようにしてほしい。</blockquote>
        <p className="dt-fine">現状：ES＋UEBA＋SOARを導入。夜間監視は委託先。検知ルールの変更は委託先の見積もりと改修を待つ。封じ込めの承認者が決まっていない。</p></div>
      <div className="row-actions"><button type="button" className="dt-emph" id="i-flow" data-id="i-flow">従来の流れを見る</button><button type="button" className="dt-emph" data-id="i-goal">ゴールを見る</button></div>
    </>
  );
  if (v === "flow") return (
    <>
      <div className="i-card"><p className="lab">従来の流れ（架空）</p><div className="i-chain" id="i-flow-chain"><span className="n">ノータブル</span><span className="a">→</span><span className="n">委託先が問い合わせ</span><span className="a">→</span><span className="n wait">A社の確認待ち</span><span className="a">→</span><span className="n">回答</span><span className="a">→</span><span className="n wait">承認者を探す</span><span className="a">→</span><span className="n">封じ込め</span></div>
        <p className="dt-fine">「正常な業務か」を確かめる基準と、「誰の承認で止めるか」が社内に無く、待ち時間は把握していません。</p></div>
      <div className="row-actions"><button type="button" className="dt-emph" id="i-goal" data-id="i-goal">ゴールを見る</button></div>
    </>
  );
  if (v === "goal") return (
    <div className="i-card"><p className="lab">デモ終了時に画面に残す成果物</p><ol className="i-goals" id="i-goal-list">{GOALS.map((g) => <li key={g}>{g.slice(1)}</li>)}</ol>
      <p className="dt-fine">製品を足すのではなく、入っているES・UEBA・SOARを、社内の人が判断・承認・記録まで使い切るようにします。</p></div>
  );
  if (v === "ticket") return (
    <div className="i-card" id="i-ticket"><p className="lab">委託先チケット　SOC-2061（架空）</p><p><b>起票：</b>委託先（夜間SOC）02:35　<b>状態：</b><span className="status active">A社の確認待ち（06:30 時点、4時間経過）</span></p>
      <p><b>内容：</b>UEBAのノータブル（hr_ops03 の異常なデータ参照）。人事部の一斉処理の可能性があるため、A社にて業務確認をお願いします。封じ込めは未実施。</p>
      <p className="dt-fine">委託先の判断は妥当です。「正常な業務か」の基準と「止める承認」が社内に無いため、ここで止まります。</p></div>
  );
  if (v === "improve0") return (
    <>
      <div className="i-card"><p className="lab">改善（架空）</p><p>今回の事案で社内に残ったもの：検知条件D-02、一次対応のチェックリストと人事部確認、封じ込めの承認段階、範囲確定の検索と記録。これをナレッジと役割分担に反映します。</p></div>
      {c.hub < 3 && <button type="button" className="hub-chip" id="hub-p4" data-id="hub-p4"><Shield />ナレッジへの反映候補（AI Hub）</button>}
      {c.hub >= 3 && (
        <section className="hub-win" aria-label="AI Hub：ナレッジへの反映候補（構想・架空画面）">
          <HubHead title="ナレッジへの反映候補（P4）" sub="例文" />
          <dl className="kv"><dt>KB03 承認済み検索</dt><dd>「SOC_人事_異常参照_D-02」を v1.0 として登録（現在：承認待ち）。Q4a・Q4b を範囲確定の標準検索に追加</dd>
            <dt>KB05 事例</dt><dd>事例A（2026-10-06）を登録。確認済み・未確認を分けて記載</dd>
            <dt>KB06 対応権限表</dt><dd>③アカウント停止の承認SLA（30分）を追加。承認者不在時の代理を明記</dd>
            <dt>SIEMの外（要望）</dt><dd>退職者データの保持期間と参照権限の見直しを、人事部・情報システム部へ要望として起票</dd>
            <dt>承認者</dt><dd>SOC責任者　見直し日：2026-11-06</dd></dl>
        </section>
      )}
      {c.hub >= 3 && c.hub < 4 && <button type="button" className="hub-chip" id="hub-p8" data-id="hub-p8"><Shield />委託先との役割分担（AI Hub・KB08）</button>}
      {c.hub >= 4 && (
        <section className="hub-win" aria-label="AI Hub：委託先との役割分担（構想・架空画面）">
          <HubHead title="委託先との役割分担の書き換え案（P8・KB08）" sub="例文。委託先を外す話ではない" />
          <table className="hub-tbl"><thead><tr><th>工程</th><th>これまで</th><th>これから</th></tr></thead>
            <tbody>
              <tr><td><b>夜間監視・高度な分析・フォレンジック</b></td><td>委託先</td><td>委託先（変更なし）</td></tr>
              <tr><td><b>ノータブルの一次対応・業務確認</b></td><td>委託先 → A社に問い合わせ</td><td>A社SOC担当者（KB04、チェックリスト）</td></tr>
              <tr><td><b>封じ込めの判断・承認</b></td><td>決まっていない</td><td>①②SOC担当者、③SOC責任者、④CSIRT責任者（KB06）</td></tr>
              <tr><td><b>検知ルールの変更</b></td><td>委託先の見積もり・改修</td><td>A社SOCが作り、委託先がレビュー（KB02・KB03）</td></tr>
              <tr><td><b>範囲の確定・記録</b></td><td>委託先の分析待ち</td><td>A社SOCが標準検索で確定し、記録（KB07）</td></tr>
            </tbody></table>
          <div className="row-actions"><button type="button" className="dt-accent hub-btn" id="imp-ticket" data-id="imp-ticket">改善チケットを起票</button></div>
        </section>
      )}
    </>
  );
  if (v === "improve") return (
    <>
      <div className="i-card"><p className="lab">改善チケット　SOC-2072（架空）</p><p><b>件名：</b>D-02のナレッジ登録、承認SLAの追加、役割分担表（KB08）の書き換え　<b>承認者：</b>SOC責任者　<b>見直し日：</b>2026-11-06</p>
        <p>内容：KB03に「SOC_人事_異常参照_D-02」とQ4a・Q4bを追加。KB05に事例A。KB06に③の承認SLA（30分）。KB08の一次対応・封じ込め・ルール変更・範囲確定を社内担当に変更。退職者データの保持期間・参照権限の見直しを人事部・情報システム部へ要望。</p></div>
      <div className="i-card"><p className="lab">今日の成果物</p><ol className="i-goals">{GOALS.map((g) => <li key={g}>{g.slice(1)}</li>)}</ol></div>
    </>
  );
  // record（S7）
  return (
    <>
      <div className="i-card" id="rec-form"><p className="lab">事案の記録　SOC-2061-R（チケット管理・架空）　KB07の形</p>
        {REC.map((r) => <div className="dlg-row" key={r[0]}><span className="k">{r[1]}</span><span className="dt-field tip-anchor" id={"f-" + r[0]}><input type="text" key={r[0] + (c.vals[r[0]] || "")} data-id={r[0]} id={r[0]} defaultValue={c.vals[r[0]] || ""} placeholder={r[1] + "を書く"} disabled={c.recorded} /></span></div>)}
        <div className="row-actions"><button type="button" className="dt-emph" id="rec-fill" data-id="rec-fill" disabled={c.recorded}>例文を入れる</button><button type="button" className="dt-accent" id="rec-save" data-id="rec-save" disabled={c.recorded}>{c.recorded ? "保存済み" : "保存"}</button></div></div>
      {c.recorded && <Message appearance="fill" type="success">記録を保存しました。法務・CSIRTは、この記録をもとに通知と報告の要否を判断します（架空）。</Message>}
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
  if (c.app === "soar") {
    return (
      <SplunkThemeProvider family="enterprise" colorScheme={theme} density="comfortable">
        <div className="dt-app">
          <div className="sp-bar soar"><span className="sp-logo">Splunk SOAR<small>画面イメージ・架空</small></span><span className="sp-menus"><span>Home</span><span>Sources</span><span>Playbooks</span><span>Apps</span><span className="user">{who} ▾</span></span></div>
          <div className="dt-page"><SOARPage c={c} tip={tip} /></div>
        </div>
      </SplunkThemeProvider>
    );
  }
  let page = null;
  if (c.app === "search") page = <SearchPage c={c} ch={ch} />;
  else if (c.app === "cm") page = <CMPage c={c} />;
  else if (c.app === "ir") page = <IRPage c={c} ch={ch} tip={tip} />;
  return (
    <SplunkThemeProvider family="enterprise" colorScheme={theme} density="comfortable">
      <div className={"dt-app" + (c.dialog ? " has-dialog" : "")}>
        <SplunkBar who={who} />
        <AppBar app={c.app} />
        <div className="dt-page">{page}</div>
      </div>
    </SplunkThemeProvider>
  );
}
