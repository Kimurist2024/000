// 場面1：全体像の図（監視 → ServiceNow ⇄ Splunk、テックタッチの層、役割）
import React from "react";

function Box({ id, cls, title, sub, items }) {
  return (
    <div id={id} className={"ov-box " + (cls || "")}>
      <b>{title}</b>
      {sub && <small>{sub}</small>}
      {items && <ul>{items.map((t, i) => <li key={i}>{t}</li>)}</ul>}
    </div>
  );
}
export function Overview() {
  return (
    <div className="ov-page">
      <div className="ov-grid">
        <Box id="ov-mon" cls="mon" title="監視" sub="Zabbix・JP1（このデモでは図だけ）" items={["異常を検知", "ServiceNowに自動起票", "ジョブの異常を通知"]} />
        <div className="ov-arrow" aria-hidden="true">→</div>
        <Box id="ov-snow" cls="sn" title="ServiceNow" sub="起点・記録の正" items={["インシデントの受け取り・速報", "作業メモ（切り分け結果）", "割り当てグループ（有識者へ）", "定期作業のタスク"]} />
        <div className="ov-arrow both" aria-hidden="true">⇄</div>
        <Box id="ov-splunk" cls="sp" title="Splunk Cloud" sub="影響と事実の確認" items={["ITSI：エピソード・Service Analyzer・Deep Dive", "サーチとレポート：保存済みサーチ・月次レポート"]} />
      </div>
      <div id="ov-tt" className="ov-tt">
        <b>テックタッチ（それぞれの画面の上に、社内の手順と決まりを置く）</b>
        <span>ガイド（見る順番・操作の順番）</span><span>テンプレートの挿入</span><span>入力チェック</span><span>基準の表示（？）</span><span>注意書き（赤い枠）</span><span>自動入力</span><span>辿れなかった箇所を運用設計に返す</span>
      </div>
      <div className="ov-roles">
        <div><b>夜間当番（基盤運用）</b><span>受け取り・速報・一次切り分け・引き継ぎ</span></div>
        <div><b>基盤有識者・アプリ保守</b><span>原因の特定・復旧の判断・ベンダーへの依頼</span></div>
        <div><b>インシデントコマンダー当番</b><span>業務部門への連絡・全体の判断</span></div>
        <div><b>運用基盤チーム</b><span>保存済みサーチ・レポートの管理、定期作業</span></div>
      </div>
      <div id="ov-parts" className="ov-parts">
        <div><span className="ov-tag">前半</span><b>夜間の一次切り分け</b><span>10月21日（水）22:41〜　夜間当番　ServiceNow → ITSI → サーチ → ServiceNow</span></div>
        <div><span className="ov-tag">後半</span><b>月1回の稼働統計</b><span>11月4日（水）9:32〜　運用基盤チーム　ServiceNow → レポート → ServiceNow</span></div>
      </div>
      <p className="ov-fine">A社の構成・役割・手順はすべて架空です。</p>
    </div>
  );
}
