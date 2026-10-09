// 場面の定義（S0〜S8＋振り返り）。データは data.js、ガイドの部品は engine.js／panel.js
import { CASES, REPORTS, REQUEST_IN, NAME_RULE, GOALS, REQ_WORDS, Q_ORDER, Q_LABEL, Q_EXPECT, CK, CK_FILL, REC, ckEmpty, recEmpty, HR_ASK, SCOPE_REQ, PLAYBOOK, APPROVAL_TICKET } from "./data.js";
import { clickIs, autoTip, fix, setInfo } from "./engine.js";
import { guideList, recList } from "./panel.js";

export const CH = {};
const NAV = (k) => "#nav-" + k;

/* ---------- S0：現場の問題（説明用） ---------- */
CH[1] = {
  role: "lead", time: "S0", timeSub: "00:00–02:00", av: "中", who: "中村（SOC責任者・架空）",
  title: "ES・UEBA・SOARは入っている。しかしノータブルの後、社内が動けない",
  text: "架空のA社（生命保険）のSOCは、Splunk Enterprise Security（ES）・UEBA・SOARを入れ、夜間の監視は委託先が担っています。先週、人事システムへの普段と違うアクセスのノータブルが出ましたが、委託先の回答待ちで一次対応が4時間止まりました。SOC責任者の中村さん（架空）は、「検知から封じ込め・範囲の確定・記録まで、日本の社内で回せるようにしてほしい」と依頼しました。このデモは、製品を足すデモではありません。入っているSplunkを、社内の人が判断・承認・記録まで使い切るデモです。",
  tags: ["S0", "SOC責任者の視点", "現状とゴール", "2:00"],
  ask: "ノータブルやアラートの後の一次対応は、いまは委託先（またはグローバルSOC）のチケットを待つ形になっていますか？",
  kind: "note", kicker: "説明（画面は社内ポータルのイメージ・架空）", guide: "現場の問題と、デモのゴール",
  init: function () { return { step: 0, app: "intra", view: "card", vals: {} }; },
  startIds: ["i-card", "g-start"], startLabel: "依頼カードを開く",
  intro: function () {
    return guideList("この場面で見せること", "社内ポータル（架空）の依頼カードから始めます。課題が「ツール不足」ではなく「ノータブルの後の判断・承認・記録が社内に無いこと」だと示します。",
      [["現場の問題と、デモのゴール", "3ステップ・目安2分", true]]);
  },
  steps: [
    { label: "依頼カードを読む", target: "#i-card", tip: "① SOC責任者からの依頼（架空）", sub: "ノータブルの後、委託先待ちで4時間止まった",
      now: "SOC責任者の依頼を読みます。「検知から封じ込め・範囲の確定・記録まで、社内で回せるようにしてください」。",
      why: "依頼の中身は、製品の追加ではありません。入っているES・UEBA・SOARを、社内の基準で判断・承認・記録できるようにすることです。",
      btn: "従来の流れを見る", handle: clickIs("i-flow"), after: function (c) { c.view = "flow"; } },
    { label: "従来の流れを確かめる", target: "#i-flow-chain", tip: "② ノータブル → 委託先チケット → 回答待ち", sub: "判断の基準も、封じ込めの承認も、社内に無い（架空）",
      now: "ノータブル → 委託先に問い合わせ → 回答待ち → 回答 → 承認者を探す → 封じ込め、の流れです。待ち時間は社内で把握できていません（架空）。",
      why: "ES・UEBA・SOARは「入れれば守れる」製品ではありません。アラートの後に、誰が・何分で・何を判断するかが社内に無いと、同じ構造が別のシステムで繰り返されます。",
      btn: "ゴールを見る", handle: clickIs("i-goal"), after: function (c) { c.view = "goal"; } },
    { label: "デモ終了時の成果物を確かめる", target: "#i-goal-list", tip: "③ 画面に残す5つの成果物", sub: "相関検索・チェックリスト・承認段階・範囲確定と記録・役割分担",
      now: "デモの終わりに、5つの成果物を画面に残します。", why: "成果物で判断していただくため、先に並べます。削減率や検知精度の数値はお約束しません。",
      btn: "S1へ（Before）" }
  ],
  doneHTML: function () {
    return '<p class="now-box">課題は「ツール不足」ではなく、ノータブルの後の「判断・承認・記録」が社内に無いことです。</p><div class="soft"><p><b>デモ終了時に残す成果物</b></p><ul class="sum-list plain">' +
      GOALS.map(function (g) { return "<li>" + g + "</li>"; }).join("") + "</ul></div>" + '<p class="refs">画面・人物・数値はすべて架空です。</p>';
  },
  nextLabel: "S1へ進む（Before）"
};

/* ---------- S1：Before — ノータブルは出たが、委託先待ちで止まる（説明用） ---------- */
CH[2] = {
  role: "soc", time: "S1", timeSub: "02:00–05:00", av: "山", who: "山田（SOC担当者・架空）",
  title: "Before：UEBAの異常は出ている。しかし判断の基準も封じ込めの承認も、社内に無い",
  text: "10月6日 02:20、UEBAが hr_ops03 の異常なデータ参照をノータブルにしました（架空）。夜間の委託先は「業務の一斉処理の可能性あり、A社の確認待ち」とチケットを起票し、朝まで止まりました。SOC担当者の山田さん（架空）は、件数だけの検索で確かめようとしますが、申請済みの一斉処理や保守作業が混ざり、どれが脅威かを判断できません。",
  tags: ["S1", "SOC担当者の視点", "仮説1　ノータブルの後の判断が社内に無い", "3:00"],
  ask: "UEBAやESのノータブルが出たとき、「正常な業務か」を誰がどう確かめていますか？",
  kind: "note", kicker: "説明（Before。テックタッチのガイドはまだ無い）", guide: "Before：ノータブル → 委託先待ち → 件数だけの検索",
  init: function () { return { step: 0, app: "ir", view: "list", q: null, ran: null, tab: "stats", vals: {} }; },
  startIds: ["ir-row-ueba", "g-start"], startLabel: "ノータブルを開く",
  intro: function () {
    return guideList("この場面で見せること", "ESのIncident Review（画面イメージ）で、UEBAのノータブルが4時間放置される流れと、件数だけの検索では正当な業務が混ざることを見せます。",
      [["Before：ノータブル → 委託先待ち → 件数だけの検索", "4ステップ・目安3分", true]]);
  },
  steps: [
    { label: "ノータブルを開く", target: "#ir-row-ueba", tip: "① UEBAのノータブル（架空）", sub: "02:20 発生、担当者は未割当のまま",
      now: "Incident Reviewで「UEBA: Anomalous data access by hr_ops03」を開きます。", why: "ノータブルは出ています。問題は、その後です。",
      btn: "詳細を開く", handle: clickIs("ir-row-ueba"), after: function (c) { c.view = "detail"; } },
    { label: "UEBAの異常の内訳を見る", target: "#ir-anom", tip: "② 普段と違う国・時間帯・参照量", sub: "異常スコア85。しかし「正常な業務か」は書いていない",
      now: "異常の内訳は、普段と違う国からのサインイン、普段と違う時間帯、参照量が平常の40倍超、です。",
      why: "UEBAは「普段と違う」を出します。「人事部の一斉処理か」「申請があるか」は、社内の人が確かめる仕事です。",
      btn: "委託先のチケットを見る", after: function (c) { c.app = "intra"; c.view = "ticket"; } },
    { label: "委託先のチケットを見る", target: "#i-ticket", tip: "③ 「A社の確認待ち」で4時間（架空）", sub: "封じ込めは何もされていない",
      now: "夜間の委託先は「業務の一斉処理の可能性あり。A社の確認待ち」とチケットを起票しました。06:30、まだ回答待ちです。",
      why: "委託先は悪くありません。「正常な業務か」を判断する基準と、止める承認が、社内に無いことが問題です。",
      btn: "件数だけの検索を見る", after: function (c) { c.app = "search"; c.q = "before"; } },
    { label: "件数だけの検索を実行する", target: "#sp-run", tip: "④ 件数だけの検索（教材）", sub: "申請済みの一斉処理と保守作業が混ざる",
      now: "参照・エクスポートの件数が1,000件以上のアカウントを数えるだけの検索を実行します。", why: "構文は通ります。しかし、申請済みの一斉処理（B）と委託先の保守（D）が混ざり、どれが脅威かを判断できません。",
      handle: clickIs("sp-run"), after: function (c) { c.ran = "before"; } }
  ],
  doneHTML: function () {
    return '<p class="now-box">A・B・Dの3件が残りました。件数だけでは、正当な業務（B：人事異動の一斉処理、D：申請済みの保守）と区別できません。</p>' +
      '<div class="soft"><p><b>Beforeで足りないもの</b></p><ul class="sum-list plain"><li>「普段と違う接続元の後」という前後関係</li><li>退職者データを含むかという区分</li><li>申請済みの業務を除外する例外</li><li>そして、判断・承認・記録を社内で回す手順</li></ul></div>' +
      '<p class="refs">この検索は教材です。Splunk AI Assistantの実際の出力ではありません。</p>';
  },
  nextLabel: "S2へ進む（要件整理）"
};

/* ---------- S2：AI Hubで「何を依頼するか」を具体化する ---------- */
CH[3] = {
  role: "soc", time: "S2", timeSub: "05:00–09:00", av: "山", who: "山田（SOC担当者・架空）",
  title: "日本語の依頼を、AI Hubが社内基準D-02（ログ辞書・検知基準・例外）に基づく依頼文にする",
  text: "山田さん（架空）は、ESの検索画面の上に出るテックタッチのガイド「SOC分析アシスト」からAI Hubを開き、やりたいことを日本語で書きます。AI Hubは、A社のログ辞書（KB01：人事システム監査ログ）・検知基準（KB02：D-02）・承認済み検索（KB03）を参照し、Splunk AI Assistantへの依頼文を作ります。「普段と違う接続元」「60分」「1,000件」「退職者を含む」「申請済みは除外」の5つが、依頼文に入ることが合格判定です。",
  tags: ["S2", "SOC担当者の視点", "仮説2　検知条件を社内で決められない", "4:00"],
  ask: "人事システムなど日本固有のシステムの検知条件を変えるとき、社内で完結していますか。委託先の見積もりと改修を待ちますか？",
  kind: "hub", kicker: "ガイド＋AI Hub（構想・例文）", guide: "SOC分析アシスト：依頼を社内基準に整える",
  init: function () { return { step: 0, app: "search", q: null, ran: null, tab: "stats", chip: true, hub: 0, copied: false, vals: { "hub-in": "" } }; },
  startIds: ["chip-soc", "g-start"], startLabel: "「SOC分析アシスト」を開く",
  onStart: function (c) { c.hub = 1; },
  intro: function () {
    return guideList("おすすめのガイド", "検索画面の上の「SOC分析アシスト」を押すと、AI Hub（構想・架空画面）が開きます。",
      [["SOC分析アシスト：依頼を社内基準に整える", "4ステップ・目安4分", true]]);
  },
  steps: [
    { label: "やりたいことを日本語で書く", target: "#hub-in-wrap", tip: "① 日本語で、やりたいことを書きます", sub: "SPLの用語は要りません",
      now: "AI Hubの入力欄に、やりたいことを日本語で書きます。「例文を入れる」で、台本の依頼文が入ります。",
      hub: "参照するナレッジ（P1）：KB01 ログ辞書（人事システム監査ログ）、KB02 検知基準（D-02）、KB03 承認済み検索。AI Hubは、この三つに照らして依頼を整理します。",
      btn: "例文を入れる",
      handle: function (c, ev) {
        if (ev.kind === "click" && ev.id === "hub-fill") { c.vals["hub-in"] = REQUEST_IN; return "done"; }
        if (ev.kind === "pick" && ev.id === "hub-in") return ev.value.trim() ? "done" : { wrong: "依頼が空です。やりたいことを日本語で書くか、「例文を入れる」を押します。" };
        return null;
      },
      auto: function (c) { c.vals["hub-in"] = REQUEST_IN; return "done"; },
      after: function (c) { c.hub = 2; } },
    { label: "AI Hubに送る", target: "#hub-send", tip: "② AI Hubに送ります", sub: "回答は、本番前に確かめた例文を使います",
      now: "「整理する」を押します。AI Hubが、対象・条件・例外・確認事項・分析の分け方を整理します。",
      hub: "AI Hubの回答は、デモでは本番前に確かめた例文です。実環境では、御社のナレッジに合わせて検証します。",
      handle: clickIs("hub-send"), after: function (c) { c.hub = 3; } },
    { label: "整理された要件を確かめる", target: "#hub-req", tip: "③ 依頼文に5つの言葉が入っているか", sub: "普段と違う接続元／60分／1,000件／退職者を含む／申請済みは除外",
      now: "Assistant向けの依頼文に、「普段と違う接続元」「60分以内」「1,000件以上」「退職者を含む」「申請番号があれば除外」が入っていることを確かめます（S2の合格判定）。",
      hub: "列名と書式を依頼文に書く理由：Splunk AI Assistantがルックアップの列構成を自動で把握するという公式の記載は見当たりません。AI HubがKB01から列名を補います。",
      btn: "確かめた" },
    { label: "依頼文をコピーする", target: "#hub-copy", tip: "④ コピーして、S3でAssistantに貼ります", sub: "AI Hub → Splunk AI Assistant は手動コピー（デモ確定方式）",
      now: "依頼文をコピーします。次の場面で、Splunk AI Assistantの入力欄に貼ります。",
      hub: "AI HubとAssistantの間の受け渡しは手動コピーです。画面が2つになるため、リハーサルで見やすさを確かめます。",
      handle: clickIs("hub-copy"), after: function (c) { c.copied = true; } }
  ],
  doneHTML: function () {
    return '<p class="now-box">依頼文をコピーしました。S3でSplunk AI Assistantに貼ります。</p>' +
      '<div class="soft"><p><b>S2の合格判定</b></p><ul class="sum-list plain">' + REQ_WORDS.map(function (w) { return "<li>" + w + "</li>"; }).join("") + "</ul></div>" +
      '<p class="refs">AI Hubの回答は本番前に確かめた例文です。実環境の項目名やデータ構造に合わせた検証が必要です。</p>';
  },
  nextLabel: "S3へ進む（相関検索案・照合）"
};

/* ---------- S3：Assistantの相関検索案を、AI HubがD-02で照合する ---------- */
CH[4] = {
  role: "soc", time: "S3", timeSub: "09:00–14:00", av: "山", who: "山田（SOC担当者・架空）",
  title: "AssistantのSPL案を、AI Hubが検知基準D-02（退職者区分・例外）で照合し、修正依頼を作る",
  text: "山田さん（架空）は、S2の依頼文をSplunk AI Assistantに貼り、SPL案を受け取ります。Assistantの出力はそのまま表示します（進行ルール）。AI Hubは、構文ではなく検知基準D-02の業務条件（普段と違う接続元・60分・退職者区分・申請済みの例外）で照合し、不足があればAssistantへの修正依頼文を作ります。再生成したSPLは、ESの検索画面で実行して確かめます。",
  tags: ["S3", "SOC担当者の視点", "仮説2　AIの出力の妥当性を判断できない", "5:00"],
  ask: "AIが作った検索を、御社の検知基準に照らして確かめる工程は、いまありますか？",
  kind: "hub", kicker: "AI Assistant（Splunkの機能）＋AI Hub（構想・例文）", guide: "AssistantのSPL案を、D-02で確かめる",
  init: function () { return { step: 0, app: "search", q: null, ran: null, tab: "stats", assist: true, stage: 0, hub: 0, fixPasted: false, vals: {} }; },
  startIds: ["g-start"],
  intro: function () {
    return guideList("おすすめのガイド", "Splunk AI Assistant（画面イメージ・架空）に依頼文を貼り、SPL案を受け取ります。AI HubがD-02の業務条件で照合します。",
      [["AssistantのSPL案を、D-02で確かめる", "5ステップ・目安5分", true]]);
  },
  free: function (c, ev) {
    if (ev.kind === "click" && ev.id === "as-insert" && c.hub < 3) {
      fix("【入力チェック（案）】照合の前に、検索へ入れようとしています。先にAI Hubで「退職者区分」「申請済みの例外」を確かめます（社内ルール・架空）。");
      return true;
    }
    return false;
  },
  steps: [
    { label: "依頼文をAssistantに貼る", target: "#as-input", tip: "① S2でコピーした依頼文を貼ります", sub: "Splunk AI Assistant（検索の横のパネル・画面イメージ）",
      now: "Splunk AI Assistantの入力欄に、S2の依頼文を貼ります。", hub: "依頼文には、列名・書式・普段と違う接続元・60分・1,000件・退職者・申請番号が入っています。",
      btn: "貼り付ける", handle: clickIs("as-paste"), after: function (c) { c.stage = 1; } },
    { label: "SPL案を生成する", target: "#as-send", tip: "② 送信して、SPL案を受け取ります", sub: "出力はそのまま表示（特定の失敗を演出しない）",
      now: "送信します。表示されるSPL案は、デモ用に準備した参考画面です。実機ではAssistantの出力をそのまま使います。",
      hub: "進行ルール：適切な検索が出た場合はそのまま評価します。条件が欠けていれば、その内容をAI Hubに渡して補います。",
      handle: clickIs("as-send"), after: function (c) { c.stage = 2; } },
    { label: "AI HubでD-02と照合する", target: "#hub-check", tip: "③ 「D-02との照合」を開きます", sub: "構文ではなく、検知基準の業務条件で確かめる（P2）",
      now: "「D-02との照合」を押します。AI Hubが、ログ辞書・普段と違う接続元・60分の窓・退職者区分・例外・最終検証の6項目で評価します。",
      hub: "担当者の入力（P2）：「次のSPL案を、KB01〜KB03と照合してください。①参照するログ・フィールド、②普段と違う接続元の判定、③60分の窓、④退職者区分、⑤申請済みの例外を表で評価し、不足箇所についてAssistantへの修正依頼文を作ってください。検索結果の真偽は断定せず、実データで確認する項目を示してください。」",
      handle: clickIs("hub-check"), after: function (c) { c.hub = 3; } },
    { label: "修正依頼を戻して再生成する", target: function (c) { return c.fixPasted ? "#as-send" : "#hub-copy-fix"; },
      tip: function (c) { return c.fixPasted ? "④ 送信して、再生成します" : "④ 修正依頼文をAssistantに戻します"; },
      sub: function (c) { return c.fixPasted ? "退職者区分と例外を足した案が返る想定" : "AI Hubが作った修正依頼文をコピーして貼ります"; },
      now: function (c) { return c.fixPasted ? "送信します。再生成されたSPLは、retired_records と isnull(request_id) で退職者区分と例外を扱います。" : "照合表の下の修正依頼文を、Assistantに戻します。"; },
      hub: "修正依頼文の要点：(1) scope=retired の件数を retired_records として出し、1件以上。(2) request_id が空なら null にし、null のものだけ残す（申請済みの一斉処理・保守作業を除外）。",
      btn: function (c) { return c.fixPasted ? "送信する" : "修正依頼文を貼る"; },
      handle: function (c, ev) {
        if (ev.kind !== "click") return null;
        if (ev.id === "hub-copy-fix" && !c.fixPasted) { c.fixPasted = true; c.stage = 3; return "ok"; }
        if (ev.id === "as-send" && c.fixPasted) return "done";
        return null;
      },
      auto: function (c) { if (!c.fixPasted) { c.fixPasted = true; c.stage = 3; return "ok"; } return "done"; },
      after: function (c) { c.stage = 4; } },
    { label: "検索に入れて実行する", target: function (c) { return c.q === "q3" ? "#sp-run" : "#as-insert2"; },
      tip: function (c) { return c.q === "q3" ? "⑤ 実行して、Aだけが残ることを確かめます" : "⑤ 再生成したSPLを検索に入れます"; },
      sub: function (c) { return c.q === "q3" ? "期待：hr_ops03 / 198.51.100.77 / 88,420件（退職者55,980）の1行" : "「検索に入れる」を押します"; },
      now: function (c) { return c.q === "q3" ? "検索を実行します。固定のテストログで、ケースAだけが残れば合格です。" : "再生成したSPLを「検索に入れる」で検索バーに入れます。"; },
      hub: "AI Hubは真偽を断定しません。最終的な正しさは、S4でテストケースA/B/C/Dと照合して確かめます。",
      btn: function (c) { return c.q === "q3" ? "実行する" : "検索に入れる"; },
      handle: function (c, ev) {
        if (ev.kind !== "click") return null;
        if (ev.id === "as-insert2" && c.q !== "q3") { c.q = "q3"; return "ok"; }
        if (ev.id === "sp-run" && c.q === "q3") return "done";
        return null;
      },
      auto: function (c) { if (c.q !== "q3") { c.q = "q3"; return "ok"; } return "done"; },
      after: function (c) { c.ran = "q3"; } }
  ],
  doneHTML: function () {
    return '<p class="now-box">再生成したSPLで、ケースAだけが残りました。</p>' +
      '<div class="soft"><p><b>S3の合格判定</b></p><p>AI Hubが、SPLの構文ではなく検知基準D-02の業務条件（退職者区分・例外）に基づくチェックリストを出す。</p></div>' +
      '<p class="refs">Assistantの回答は、デモ本番では準備した例ではなく実機の出力を使います。Assistantの精度が上がったことを示す公開の根拠は見当たらないため、毎回この照合を通します。</p>';
  },
  nextLabel: "S4へ進む（検証・相関検索の保存）"
};

/* ---------- S4：テストログで検証し、ESの相関検索として保存する ---------- */
function qStep(key, n) {
  var idx = Q_ORDER.indexOf(key);
  var why = { q1: "C・D・Aの3件が並びます。普段と違う接続元からのサインインは、Aだけではありません。",
    q2: "A・D・Cが残ります。Dは退職者2,000件ですが申請番号（MNT-2026-1004）があり、Cは12件です。Bは平常の接続元なので、ここに出ません。",
    q3: "Aだけが残ります。「退職者を含む」「申請なし」の条件が要ることを示す核心です。" }[key];
  var ph = function (c) { return c.q === key ? "run" : c.app === "cm" ? "open" : "nav"; };
  return {
    label: Q_LABEL[key] + "を実行する",
    target: function (c) { var p = ph(c); return p === "nav" ? NAV("cm") : p === "open" ? "#rep-" + key : "#sp-run"; },
    tip: function (c) { var p = ph(c); return p === "nav" ? n + " 「Content Management」を開きます" : p === "open" ? n + " 「" + REPORTS[idx][1] + "」を開きます" : n + " 実行します"; },
    sub: function (c) { var p = ph(c); return p === "nav" ? "承認済みの保存済み検索（KB03）は、ここにあります" : p === "open" ? "期待：" + Q_EXPECT[key] : "結果を期待値と見比べます"; },
    redo: "ガイドの順に開き直します",
    now: function (c) { var p = ph(c); return p === "nav" ? "上の「Content Management」から、保存済み検索の一覧を開きます。" : p === "open" ? "「" + REPORTS[idx][1] + "」を開きます。" : "検索を実行し、結果を期待値と見比べます。"; },
    why: why,
    btn: function (c) { var p = ph(c); return p === "nav" ? "Content Managementを開く" : p === "open" ? "この検索を開く" : "実行する"; },
    handle: function (c, ev) {
      if (ev.kind !== "click") return null;
      if (ev.id === "nav-cm") { c.app = "cm"; return "ok"; }
      if (ev.id === "nav-search") { c.app = "search"; return "ok"; }
      var m = /^rep-(q[1-4][ab]?)$/.exec(ev.id);
      if (m) {
        if (m[1] === key) { c.app = "search"; c.q = key; c.tab = "stats"; return "ok"; }
        return { wrong: "順番が違います。次は「" + Q_LABEL[key] + "」です。Q1→Q2→Q3の順に、期待値と見比べます（ガイドの順・架空）。" };
      }
      if (ev.id === "sp-run" && c.q === key) return "done";
      return null;
    },
    auto: function (c) {
      var p = ph(c);
      if (p === "nav") { c.app = "cm"; return "ok"; }
      if (p === "open") { c.app = "search"; c.q = key; c.tab = "stats"; return "ok"; }
      return "done";
    },
    after: function (c) { c.ran = key; c.done[key] = true; }
  };
}
CH[5] = {
  role: "soc", time: "S4", timeSub: "14:00–19:00", av: "山", who: "山田（SOC担当者・架空）",
  title: "テストログでA／B／C／Dを区別し、ESの相関検索として保存する（ノータブル・リスク・抑制）",
  text: "山田さん（架空）は、CSVルックアップとして読み込んだ固定のテストログ（46件・架空）に、承認済みの検索Q1〜Q3を順に実行します。Q1で3件、Q2で3件、Q3でAだけが残ります。次に、Content Managementから相関検索として保存します。テックタッチのガイドは、命名規則、実行間隔（15分・リアルタイム不可）、リスクスコア、ノータブルの緊急度、抑制を、入力チェック付きで案内します。委託先に頼まずに、検知ルールを社内で足せる姿です。",
  tags: ["S4", "SOC担当者の視点", "仮説2・3　検証の方法が無い／ルール変更が数週間待ち", "5:00"],
  ask: "検知条件を変えたとき、正解のテストケースで確かめる仕組みと、社内で相関検索を保存できる権限は、いまありますか？",
  kind: "tt", kicker: "操作ナビ＋入力チェック（案）", guide: "検証して、相関検索として保存する",
  init: function () { return { step: 0, app: "search", q: null, ran: null, tab: "stats", done: {}, menu: false, dialog: false, savedCS: false, vals: { "cs-name": "", "cs-sched": "", "cs-risk": "", "cs-urg": "", "cs-throttle": "" } }; },
  startIds: ["g-start"],
  intro: function () {
    return guideList("おすすめのガイド", "保存済み検索Q1〜Q3を順に実行して期待値と見比べ、Content Managementから相関検索として保存します。",
      [["検証して、相関検索として保存する", "6ステップ・目安5分", true]]);
  },
  steps: [qStep("q1", "①"), qStep("q2", "②"), qStep("q3", "③"),
    { label: "相関検索の作成を開く", target: function (c) { return c.app !== "cm" ? NAV("cm") : c.menu ? "#cm-corr" : "#cm-new"; },
      tip: function (c) { return c.app !== "cm" ? "④ 「Content Management」を開きます" : c.menu ? "④ 「相関検索」を選びます" : "④ 「新規コンテンツの作成」を開きます"; },
      sub: function (c) { return c.app !== "cm" ? "相関検索は Content Management から作ります（ESの機能）" : c.menu ? "Q3の検索が入った作成画面が開きます" : "Content Management ＞ 新規コンテンツの作成 ＞ 相関検索"; },
      now: function (c) { return c.app !== "cm" ? "「Content Management」を開きます。" : c.menu ? "「相関検索」を選びます。" : "「新規コンテンツの作成」を開きます。"; },
      why: "相関検索の作成・編集はESの機能です。委託先に依頼せずに社内で足せるかは、権限（ESの管理者ロール）の確認が要ります。",
      btn: function (c) { return c.app !== "cm" ? "Content Managementを開く" : c.menu ? "相関検索を選ぶ" : "メニューを開く"; },
      handle: function (c, ev) {
        if (ev.kind !== "click") return null;
        if (ev.id === "nav-cm" && c.app !== "cm") { c.app = "cm"; return "ok"; }
        if (ev.id === "cm-new" && !c.menu) { c.menu = true; return "ok"; }
        if (ev.id === "cm-corr" && c.menu) return "done";
        if (/^cm-(saved|lookup|playbook)$/.test(ev.id)) return { wrong: "このデモでは「相関検索」を選びます。保存済み検索やルックアップは、別のガイドで扱います（架空）。" };
        return null;
      },
      auto: function (c) { if (c.app !== "cm") { c.app = "cm"; return "ok"; } if (!c.menu) { c.menu = true; return "ok"; } return "done"; },
      after: function (c) { c.menu = false; c.dialog = true; } },
    { label: "名前と実行間隔を決める", target: function (c) { return !NAME_RULE.test(c.vals["cs-name"]) ? "#f-cs-name" : "#f-cs-sched"; },
      tip: function (c) { return !NAME_RULE.test(c.vals["cs-name"]) ? "⑤ 名前は「SOC_対象_用途」の形にします" : "⑤ 実行間隔は「15分ごと」にします"; },
      sub: function (c) { return !NAME_RULE.test(c.vals["cs-name"]) ? "例：SOC_人事_異常参照_D-02（入力チェック・案）" : "リアルタイムは使いません（社内基準・架空）"; },
      redo: "直します",
      now: function (c) { return !NAME_RULE.test(c.vals["cs-name"]) ? "名前を「SOC_人事_異常参照_D-02」の形で入力します。" : "実行間隔を「15分ごと（cron）」にします。"; },
      why: "名前の形をそろえると、委託先が作った相関検索と社内で作ったものを、一覧で見分けられます（社内ルール・架空）。Splunk Cloudのスケジュール時刻はUTCです。",
      btn: function (c) { return !NAME_RULE.test(c.vals["cs-name"]) ? "例の名前を入れる" : "15分ごとにする"; },
      handle: function (c, ev) {
        if (ev.kind !== "pick") return null;
        if (ev.id === "cs-name") return NAME_RULE.test(ev.value) ? "ok" : { wrong: "【入力チェック（案）】名前は「SOC_対象_用途」の形にします。例：SOC_人事_異常参照_D-02（社内ルール・架空）。" };
        if (ev.id === "cs-sched") {
          if (!ev.value) return null;
          if (ev.value === "rt") return { wrong: "【入力チェック（案）】リアルタイム検索は使いません。定期実行の「15分ごと」にします（Splunkも定期実行を勧めています。社内基準・架空）。" };
          if (ev.value !== "15m") return { wrong: "【入力チェック（案）】A社の基準は「15分ごと」です（社内基準・架空）。" };
          return NAME_RULE.test(c.vals["cs-name"]) ? "done" : "ok";
        }
        return null;
      },
      auto: function (c) { if (!NAME_RULE.test(c.vals["cs-name"])) { c.vals["cs-name"] = "SOC_人事_異常参照_D-02"; return "ok"; } c.vals["cs-sched"] = "15m"; return "done"; } },
    { label: "リスク・緊急度・抑制を決めて保存する", target: function (c) { return c.vals["cs-risk"] !== "80" ? "#f-cs-risk" : c.vals["cs-urg"] !== "high" ? "#f-cs-urg" : c.vals["cs-throttle"] !== "60user" ? "#f-cs-throttle" : "#cs-save"; },
      tip: function (c) { return c.vals["cs-risk"] !== "80" ? "⑥ リスクスコアは「80」（D-02）" : c.vals["cs-urg"] !== "high" ? "⑥ ノータブルの緊急度は「高」" : c.vals["cs-throttle"] !== "60user" ? "⑥ 抑制は「同じ user で60分」" : "⑥ 保存します"; },
      sub: function (c) { return c.vals["cs-risk"] !== "80" ? "リスクオブジェクトは user（RBA）" : c.vals["cs-urg"] !== "high" ? "退職者データを含むため「高」（社内基準・架空）" : c.vals["cs-throttle"] !== "60user" ? "空のままだと、同じアカウントでノータブルが続きます（入力チェック・案）" : "Incident Reviewにノータブルが出ます"; },
      redo: "選び直します",
      now: function (c) { return c.vals["cs-risk"] !== "80" ? "リスクスコアを「80」にします。" : c.vals["cs-urg"] !== "high" ? "ノータブルの緊急度を「高」にします。" : c.vals["cs-throttle"] !== "60user" ? "抑制を「同じ user で60分」にします。" : "「保存」を押します。"; },
      why: "リスクスコア・緊急度・抑制はESの機能です。テックタッチは、A社が何を選ぶか（社内基準・架空）だけを案内します。",
      btn: function (c) { return c.vals["cs-risk"] !== "80" ? "リスクを選ぶ" : c.vals["cs-urg"] !== "high" ? "緊急度を選ぶ" : c.vals["cs-throttle"] !== "60user" ? "抑制を選ぶ" : "保存する"; },
      handle: function (c, ev) {
        if (ev.kind === "pick" && ev.id === "cs-risk") {
          if (!ev.value) return null;
          return ev.value === "80" ? "ok" : { wrong: "【入力チェック（案）】検知基準D-02のリスクスコアは80です（社内基準・架空）。" };
        }
        if (ev.kind === "pick" && ev.id === "cs-urg") {
          if (!ev.value) return null;
          return ev.value === "high" ? "ok" : { wrong: "【入力チェック（案）】退職者データを含む参照は、緊急度「高」にします（社内基準・架空）。" };
        }
        if (ev.kind === "pick" && ev.id === "cs-throttle") {
          if (!ev.value) return null;
          return ev.value === "none" ? { wrong: "【入力チェック（案）】抑制が空です。同じ user で60分抑制します（社内基準・架空）。" } : "ok";
        }
        if (ev.kind === "click" && ev.id === "cs-save") {
          if (c.vals["cs-risk"] === "80" && c.vals["cs-urg"] === "high" && c.vals["cs-throttle"] === "60user") return "done";
          return { wrong: "【入力チェック（案）】リスクスコア・緊急度・抑制を先に確かめます。" };
        }
        return null;
      },
      auto: function (c) {
        if (c.vals["cs-risk"] !== "80") { c.vals["cs-risk"] = "80"; return "ok"; }
        if (c.vals["cs-urg"] !== "high") { c.vals["cs-urg"] = "high"; return "ok"; }
        if (c.vals["cs-throttle"] !== "60user") { c.vals["cs-throttle"] = "60user"; return "ok"; }
        return "done";
      },
      after: function (c) { c.dialog = false; c.savedCS = true; } }
  ],
  doneHTML: function () {
    return '<p class="now-box">相関検索「SOC_人事_異常参照_D-02」を保存しました。Q3でAだけが残ることを確かめた検索です。</p>' +
      '<div class="soft"><p><b>ケースの判定（架空）</b></p><ul class="rec-list">' + CASES.map(function (k) { return '<li><span class="t">' + k.id + "</span><span>" + k.note + " → " + k.verdict + "</span></li>"; }).join("") + "</ul></div>" +
      '<p class="refs">期待値はPythonで検算したものです。ES実機での相関検索の作成（画面・権限・項目名）は、構築時にSEが確かめます。固定CSVの定期実行は本番監視にならないため、本番はQ5の骨格で監査ログを検索します。</p>';
  },
  nextLabel: "S5へ進む（一次対応）"
};

/* ---------- S5：ノータブルの一次対応（Incident Review＋AI Hub＋人事部の業務確認） ---------- */
CH[6] = {
  role: "soc", time: "S5", timeSub: "19:00–24:00", av: "山", who: "山田（SOC担当者・架空）",
  title: "ノータブルを自分の担当にし、AI Hubの手順で事実と未確認を分け、人事部に業務を確かめる",
  text: "相関検索「SOC_人事_異常参照_D-02」がケースAで発火し、UEBAの異常と合わせてリスクスコア165のノータブルになりました（架空）。山田さん（架空）は、Incident Reviewでノータブルを自分の担当にし、AI Hub（P3）でA社の一次調査手順（KB04：人事システム）に沿って確認済み事実・未確認を分け、AI Hubが作った問い合わせ文で人事部に「申請済みの一斉処理か」を確かめます。テックタッチのチェックリストが抜け漏れを防ぎ、判定区分が決まるまで封じ込めに進めません。",
  tags: ["S5", "SOC担当者の視点", "仮説4　一次対応が委託先待ちで止まる", "5:00"],
  ask: "ノータブルの後、「正常な業務か」を人事部などの業務側に確かめる手順は、誰が、どの形で持っていますか？",
  kind: "hub", kicker: "チェックリスト＋AI Hub（構想・例文）", guide: "ノータブルの一次対応（KB04：人事システム）",
  init: function () { return { step: 0, app: "ir", view: "list", owner: false, hub: 0, asked: false, replied: false, escalated: false, vals: { ck1: "", ck2: "", ck3: "", ck4: "", ck5: "", ck6: "", ck7: "", disp: "" } }; },
  startIds: ["g-start"],
  intro: function () {
    return guideList("おすすめのガイド", "Incident Reviewでノータブルを開いて担当者を自分にし、AI Hubで整理し、人事部に業務を確かめ、チェックリストと判定区分を埋めて封じ込めへ進みます。",
      [["ノータブルの一次対応（KB04：人事システム）", "6ステップ・目安5分", true]]);
  },
  free: function (c, ev) {
    if (ev.kind === "click" && ev.id === "ck-escalate" && (ckEmpty(c) || !c.vals.disp)) {
      fix("【入力チェック（案）】チェックリストに空の項目があるか、判定区分が未選択です。未確認なら「未確認」を選びます。空のまま封じ込めに進めません（社内ルール・架空）。");
      return true;
    }
    return false;
  },
  steps: [
    { label: "ノータブルを開く", target: "#ir-row-d02", tip: "① D-02のノータブル（緊急度：高）", sub: "UEBAの異常85＋相関検索80＝リスクスコア165（架空）",
      now: "Incident Reviewで「SOC_人事_異常参照_D-02: hr_ops03」を開きます。", hub: "ノータブルは、S4で保存した相関検索から出たものです。UEBAの異常スコアとRBAで合算されています（画面イメージ・架空）。",
      handle: clickIs("ir-row-d02"), after: function (c) { c.view = "detail"; } },
    { label: "担当者を自分にする", target: "#ir-own", tip: "② 「担当者を自分にする」を押します", sub: "状態が「進行中」になり、誰が見ているかが残る",
      now: "「担当者を自分にする」を押します。状態を「進行中」にして、誰が対応しているかを残します。", hub: "委託先待ちで止まらない最初の一歩は、社内の誰かが担当者になることです（社内ルール・架空）。",
      handle: clickIs("ir-own"), after: function (c) { c.owner = true; } },
    { label: "AI Hubで一次調査の整理をする", target: "#hub-p3", tip: "③ 「一次調査の整理」を開きます", sub: "KB04（人事システム）の手順に沿って、事実と未確認を分ける（P3）",
      now: "「一次調査の整理」を押します。AI Hubが、確認済み事実・追加の確認・人事部への問い合わせ文・判断の進め方に分けます。",
      hub: "担当者の入力（P3）：「ケースA：hr_ops03 が普段と違う国・ASNからサインインし、60分以内に在籍・退職者を88,420件参照・エクスポート。KB04の人事システム手順に従って、確認済み事実・追加の確認事項・人事部への業務確認の文面・エスカレーション基準を整理してください。侵害の成立は推定しないでください。」",
      handle: clickIs("hub-p3"), after: function (c) { c.hub = 3; } },
    { label: "人事部に業務を確かめる", target: function (c) { return c.asked ? "#hr-reply" : "#hub-ask-hr"; },
      tip: function (c) { return c.asked ? "④ 人事部の回答を受け取ります" : "④ AI Hubの問い合わせ文を人事部に送ります"; },
      sub: function (c) { return c.asked ? "「該当する申請なし。本人は確認中」（架空）" : "申請済みの一斉処理・保守作業か。社内チャット（架空）"; },
      now: function (c) { return c.asked ? "人事部からの回答を受け取ります。該当する申請はなく、本人には確認中です。" : "AI Hubが作った問い合わせ文を、社内チャットで人事部に送ります。"; },
      hub: "問い合わせ文（例文）：「" + HR_ASK + "」",
      btn: function (c) { return c.asked ? "回答を受け取る" : "人事部に送る"; },
      handle: function (c, ev) {
        if (ev.kind !== "click") return null;
        if (ev.id === "hub-ask-hr" && !c.asked) { c.asked = true; return "ok"; }
        if (ev.id === "hr-reply" && c.asked) return "done";
        return null;
      },
      auto: function (c) { if (!c.asked) { c.asked = true; return "ok"; } return "done"; },
      after: function (c) { c.replied = true; } },
    { label: "チェックリストを埋める", target: function (c) { var e = ckEmpty(c); return e ? "#f-" + e : "#ck-list"; },
      tip: function (c) { var e = ckEmpty(c); return e ? "⑤ 空の項目を埋めます（確認済み／未確認）" : "⑤ 7項目が埋まりました"; },
      sub: "未確認の項目は「未確認」と残します。空のままにしません（入力チェック・案）",
      redo: "空の項目を埋めます",
      now: "7項目を「確認済み」か「未確認」で埋めます。「例を入れる」で、AI Hubの整理と人事部の回答に沿った例が入ります。",
      hub: "AI Hubの整理に沿うと、①〜⑤は確認済み、⑥本人確認・⑦影響範囲は未確認です。未確認を隠さないことが引き継ぎの要点です。",
      btn: "例を入れる",
      handle: function (c, ev) {
        if (ev.kind === "click" && ev.id === "ck-fill") { for (var k in CK_FILL) c.vals[k] = CK_FILL[k]; return "done"; }
        if (ev.kind === "pick" && /^ck[1-7]$/.test(ev.id)) return ckEmpty(c) ? "ok" : "done";
        return null;
      },
      auto: function (c) { for (var k in CK_FILL) c.vals[k] = CK_FILL[k]; return "done"; } },
    { label: "判定区分を決めて、封じ込めへ進む", target: function (c) { return c.vals.disp !== "tp" ? "#f-disp" : "#ck-escalate"; },
      tip: function (c) { return c.vals.disp !== "tp" ? "⑥ 判定区分を「要対応（暫定）」にします" : "⑥ 封じ込めへ進みます"; },
      sub: function (c) { return c.vals.disp !== "tp" ? "申請なし・退職者データを含む。本人確認が未了でも「暫定」で進める（社内基準・架空）" : "SOARのプレイブックへ（S6）"; },
      redo: "判定区分を選び直します",
      now: function (c) { return c.vals.disp !== "tp" ? "判定区分を「要対応（暫定）」にします。「?」で区分の定義を確かめられます。" : "「封じ込めへ進む」を押します。確認済み・未確認を分けたまま、SOARのプレイブックへ進みます。"; },
      hub: "判断の進め方（KB04）：人事部の回答が「申請なし」で、退職者データを含む場合は、本人確認を待たずに「要対応（暫定）」として封じ込め①②へ進む。侵害の成立は推定しない。",
      btn: function (c) { return c.vals.disp !== "tp" ? "要対応（暫定）にする" : "封じ込めへ進む"; },
      handle: function (c, ev) {
        if (ev.kind === "pick" && ev.id === "disp") {
          if (!ev.value) return null;
          if (ev.value === "tp") return "ok";
          if (ev.value === "legit") return { wrong: "【入力チェック（案）】「正当な利用」は、申請番号か本人の確認がそろったときだけ選べます。人事部の回答は「申請なし」です（社内基準・架空）。" };
          return { wrong: "【入力チェック（案）】「誤検知」は、検知条件を満たすが脅威でないと確かめたときに選びます。退職者データを含む大量エクスポートで申請なしのため、「要対応（暫定）」にします（社内基準・架空）。" };
        }
        if (ev.kind === "click" && ev.id === "ck-escalate" && c.vals.disp === "tp" && !ckEmpty(c)) return "done";
        return null;
      },
      auto: function (c) { if (c.vals.disp !== "tp") { c.vals.disp = "tp"; return "ok"; } return "done"; },
      after: function (c) { c.escalated = true; } }
  ],
  doneHTML: function () {
    return '<p class="now-box">ノータブルを自分の担当にし、人事部の回答（申請なし）を得て、「要対応（暫定）」で封じ込めへ進みます。</p>' + recList([
      ["19:05", "ノータブルを開き、担当者を自分に（状態：進行中）"], ["19:10", "AI Hub（P3）で整理。人事部へ問い合わせ → 回答「申請なし、本人は確認中」"], ["19:20", "チェックリスト7項目（⑥本人確認・⑦影響範囲は未確認）、判定「要対応（暫定）」"]
    ], "時刻・記録は架空です。侵害の成立は推定しません。");
  },
  nextLabel: "S6へ進む（封じ込め）"
};

/* ---------- S6：封じ込め（SOARプレイブック＋承認段階） ---------- */
CH[7] = {
  role: "soc", time: "S6", timeSub: "24:00–28:00", av: "山", who: "山田（SOC担当者・架空）",
  title: "SOARのプレイブックを、社内の承認段階（KB06）どおりに動かす",
  text: "山田さん（架空）は、SOARのプレイブック「HR_異常参照_封じ込め」を実行します（画面イメージ・架空）。AI Hub（P5）がKB06（対応権限表）と照合し、対象アカウントが例外（役員・人事部管理者）でないこと、①セッション失効・②パスワードリセットはSOC担当者の判断で即時、③アカウント停止はSOC責任者の承認、④外部接続遮断はCSIRT責任者の承認、を示します。テックタッチは実行範囲と承認チケット番号を入力チェックで守ります。SOARがあっても「誰の承認で何を止めるか」が決まっていなければ動きません。その部分を社内に置きます。",
  tags: ["S6", "SOC担当者の視点", "仮説5　承認が取れず、閲覧が続く", "4:00"],
  ask: "SOARのプレイブックが「いつ・何を・誰の承認で」動くかを、日本の担当者が説明できますか？",
  kind: "hub", kicker: "AI Hub（KB06 対応権限表）＋入力チェック（案）", guide: "封じ込め：承認段階どおりにプレイブックを実行する",
  init: function () { return { step: 0, app: "soar", hub: 0, ran: false, approved: false, vals: { "pb-scope": "", "pb-ticket": "" } }; },
  startIds: ["g-start"],
  intro: function () {
    return guideList("おすすめのガイド", "AI HubでKB06（承認段階と例外）を照合し、実行範囲と承認チケットを入力してプレイブックを実行し、③の承認を受けます。",
      [["封じ込め：承認段階どおりにプレイブックを実行する", "5ステップ・目安4分", true]]);
  },
  free: function (c, ev) {
    if (ev.kind === "click" && ev.id === "pb-run" && (c.vals["pb-scope"] !== "123" || !c.vals["pb-ticket"].trim())) {
      fix("【入力チェック（案）】実行範囲が「①〜③」で、③の承認チケット番号が入っているときだけ実行できます（KB06・架空）。");
      return true;
    }
    return false;
  },
  steps: [
    { label: "AI HubでKB06（承認段階・例外）を照合する", target: "#hub-p5", tip: "① 「承認段階の照合」を開きます", sub: "対象 hr_ops03 は例外リストにない。①②即時、③SOC責任者、④CSIRT",
      now: "「承認段階の照合」を押します。AI Hubが、対象アカウントと例外リスト、各アクションの承認者を表にします。",
      hub: "担当者の入力（P5）：「対象アカウント hr_ops03、接続元 198.51.100.77、退職者データを含む86,420件のエクスポート。KB06の対応権限表に照らし、例外アカウントかどうか、プレイブックの各アクションの承認者と、いま実行してよい範囲を示してください。」",
      handle: clickIs("hub-p5"), after: function (c) { c.hub = 3; } },
    { label: "実行範囲を決める", target: "#f-pb-scope", tip: "② 実行範囲は「①〜③（アカウント停止まで）」", sub: "④はCSIRT責任者の判断。いまは判断材料を渡す段階（社内基準・架空）",
      redo: "実行範囲を選び直します",
      now: "実行範囲を「①〜③（アカウント停止まで）」にします。", hub: "KB06：退職者データを含むエクスポートが確認されている場合、③アカウント停止まで進める。④人事システムの外部接続遮断はCSIRT責任者が判断する。",
      btn: "①〜③にする",
      handle: function (c, ev) {
        if (ev.kind !== "pick" || ev.id !== "pb-scope" || !ev.value) return null;
        if (ev.value === "123") return "done";
        if (ev.value === "12") return { wrong: "【入力チェック（案）】退職者データを含むエクスポートが確認されています。KB06では③アカウント停止まで進めます（SOC責任者の承認）。" };
        return { wrong: "【入力チェック（案）】④人事システムの外部接続遮断は、CSIRT責任者の承認が要ります。いまは判断材料（範囲の確定・S7）を渡す段階です（KB06・架空）。" };
      },
      auto: function (c) { c.vals["pb-scope"] = "123"; return "done"; } },
    { label: "承認チケット番号を入れる", target: "#f-pb-ticket", tip: "③ SOC責任者の承認チケット番号を入れます", sub: "例：" + APPROVAL_TICKET + "。空のままでは実行できません（入力チェック・案）",
      redo: "承認チケット番号を入れます",
      now: "③アカウント停止の承認チケット番号を入れます。「例を入れる」で台本の番号が入ります。", hub: "承認の記録をプレイブックの入力に残すと、「誰の承認で止めたか」が後から読めます（社内ルール・架空）。",
      btn: "例を入れる",
      handle: function (c, ev) {
        if (ev.kind === "click" && ev.id === "pb-ticket-fill") { c.vals["pb-ticket"] = APPROVAL_TICKET; return "done"; }
        if (ev.kind === "pick" && ev.id === "pb-ticket") return ev.value.trim() ? "done" : { wrong: "【入力チェック（案）】承認チケット番号が空です。" };
        return null;
      },
      auto: function (c) { c.vals["pb-ticket"] = APPROVAL_TICKET; return "done"; } },
    { label: "プレイブックを実行する", target: "#pb-run", tip: "④ 実行します", sub: "①②は即時に成功、③は承認待ちになります",
      now: "「実行」を押します。①セッション失効と②パスワードリセットは即時に実行され、③アカウント停止は承認待ちになります。",
      hub: "SOARの実行はSplunkの機能です。テックタッチは、入力（範囲・承認番号）が社内基準に合っているかだけを確かめます。",
      handle: clickIs("pb-run"), after: function (c) { c.ran = true; } },
    { label: "SOC責任者の承認を受ける", target: "#pb-approve", tip: "⑤ SOC責任者が承認します（デモでは同じ画面で）", sub: "③アカウント停止が実行される",
      now: "SOC責任者が承認します。デモでは同じ画面のボタンで代用します。③アカウント停止が実行され、閲覧が止まります。",
      hub: "Beforeでは、ここで承認者を探して止まっていました。承認段階が決まっていれば、承認待ちの時間は測れます。",
      handle: clickIs("pb-approve"), after: function (c) { c.approved = true; } }
  ],
  doneHTML: function () {
    return '<p class="now-box">①セッション失効・②パスワードリセット（即時）、③アカウント停止（SOC責任者承認）を実行しました。④はCSIRT責任者の判断です。</p>' +
      '<div class="soft"><p><b>承認段階（KB06・架空）</b></p><ul class="rec-list">' + PLAYBOOK.steps.map(function (s) { return '<li><span class="t">' + s[0] + "</span><span>" + s[1] + "：" + s[2] + "</span></li>"; }).join("") + "</ul></div>" +
      '<p class="refs">SOARの画面は公式UI部品で組んだ画面イメージです。プレイブックの実行や承認の実装は、SOAR実機で確かめます。</p>';
  },
  nextLabel: "S7へ進む（範囲の確定・記録）"
};

/* ---------- S7：範囲の確定と記録（通知・報告の判断材料） ---------- */
CH[8] = {
  role: "soc", time: "S7", timeSub: "28:00–33:00", av: "山", who: "山田（SOC担当者・架空）",
  title: "閲覧されたレコードと項目を確定し、顧客系を確かめ、記録を4項目で残す",
  text: "山田さん（架空）は、AI Hub（P6）が作った範囲確定の依頼文をSplunk AI Assistantに渡し、エクスポートされたレコードをデータセット別に件数と項目で確定します（Q4a）。同じアカウント・接続元で顧客系システムの監査ログにアクセスが無いことも確かめます（Q4b：0件）。AI Hub（P7）がKB07（通知・報告の判断材料）に沿って記録の形を示し、テックタッチの入力チェックで空欄のまま保存できないようにします。通知と報告の要否は法務とCSIRTが判断します。SOCは、その判断材料を速くそろえます。",
  tags: ["S7", "SOC担当者の視点", "仮説6　範囲の確定が委託先の分析待ち", "5:00"],
  ask: "「誰が・いつ・どの範囲を閲覧したか」を、いまは誰が、どれくらいで確定できますか？",
  kind: "hub", kicker: "AI Assistant＋AI Hub（KB07）＋入力チェック（案）", guide: "範囲の確定と、記録（通知・報告の判断材料）",
  init: function () { return { step: 0, app: "search", q: null, ran: null, tab: "stats", assist: true, stage: 0, hub: 0, done: {}, recorded: false, vals: { r1: "", r2: "", r3: "", r4: "" } }; },
  startIds: ["g-start"],
  intro: function () {
    return guideList("おすすめのガイド", "AI Hubの依頼文でAssistantに範囲確定の検索を作らせ、Q4a・Q4bを実行し、KB07の形で記録を残します。",
      [["範囲の確定と、記録（通知・報告の判断材料）", "5ステップ・目安5分", true]]);
  },
  free: function (c, ev) {
    if (ev.kind === "click" && ev.id === "rec-save" && recEmpty(c)) {
      fix("【入力チェック（案）】空の項目があります。未確認の事項は「未確認」に書き、4項目を埋めてから保存します（社内ルール・架空）。");
      return true;
    }
    return false;
  },
  steps: [
    { label: "AI Hubで範囲確定の依頼文を作る", target: function (c) { return c.hub < 3 ? "#hub-p6" : "#hub-copy-scope"; },
      tip: function (c) { return c.hub < 3 ? "① 「範囲確定の検索案」を開きます" : "① 依頼文をAssistantに渡します"; },
      sub: function (c) { return c.hub < 3 ? "KB03の承認済み検索を、今回の対象（アカウント・接続元）に当てはめる（P6）" : "AI Hub → Assistant は手動コピー"; },
      now: function (c) { return c.hub < 3 ? "「範囲確定の検索案」を押します。AI Hubが、対象アカウント・接続元に合わせた依頼文を作ります。" : "依頼文をSplunk AI Assistantに渡します。"; },
      hub: "担当者の入力（P6）：「hr_ops03 と 198.51.100.77 について、閲覧・エクスポートされたレコードをデータセット別に件数・項目・時刻で確定し、顧客系システムに同じアカウント・接続元のアクセスがあるかを確かめる検索の依頼文を、KB03に沿って作ってください。」",
      btn: function (c) { return c.hub < 3 ? "検索案を開く" : "Assistantに渡す"; },
      handle: function (c, ev) {
        if (ev.kind !== "click") return null;
        if (ev.id === "hub-p6" && c.hub < 3) { c.hub = 3; return "ok"; }
        if (ev.id === "hub-copy-scope" && c.hub >= 3) return "done";
        return null;
      },
      auto: function (c) { if (c.hub < 3) { c.hub = 3; return "ok"; } return "done"; },
      after: function (c) { c.stage = 2; } },
    { label: "Q4a（データセット別の件数・項目）を実行する", target: function (c) { return c.q === "q4a" ? "#sp-run" : "#as-insert-q4a"; },
      tip: function (c) { return c.q === "q4a" ? "② 実行します" : "② Q4aを検索に入れます"; },
      sub: function (c) { return c.q === "q4a" ? "期待：在籍31,240件、退職者55,180件、合計86,420件、7項目" : "Assistantの1つ目の検索案"; },
      now: function (c) { return c.q === "q4a" ? "実行します。エクスポートされたレコードを、データセット別の件数と項目で確定します。" : "1つ目の検索案を「検索に入れる」で入れます。"; },
      hub: "AI Hubは件数を断定しません。確定はSplunkの実行結果で行い、記録に写します。",
      btn: function (c) { return c.q === "q4a" ? "実行する" : "検索に入れる"; },
      handle: function (c, ev) {
        if (ev.kind !== "click") return null;
        if (ev.id === "as-insert-q4a" && c.q !== "q4a") { c.q = "q4a"; return "ok"; }
        if (ev.id === "sp-run" && c.q === "q4a") return "done";
        return null;
      },
      auto: function (c) { if (c.q !== "q4a") { c.q = "q4a"; return "ok"; } return "done"; },
      after: function (c) { c.ran = "q4a"; c.done.q4a = true; } },
    { label: "Q4b（顧客系システムの確認）を実行する", target: function (c) { return c.q === "q4b" ? "#sp-run" : "#as-insert-q4b"; },
      tip: function (c) { return c.q === "q4b" ? "③ 実行します" : "③ Q4bを検索に入れます"; },
      sub: function (c) { return c.q === "q4b" ? "期待：0件（この範囲では顧客系へのアクセスなし）" : "Assistantの2つ目の検索案"; },
      now: function (c) { return c.q === "q4b" ? "実行します。同じアカウント・接続元で、顧客系システムの監査ログにアクセスが無いことを確かめます。" : "2つ目の検索案を「検索に入れる」で入れます。"; },
      hub: "0件は「この範囲では確認されない」です。他の経路や他のアカウントは未確認として記録します。言い切らないことが、公表の正確さにつながります。",
      btn: function (c) { return c.q === "q4b" ? "実行する" : "検索に入れる"; },
      handle: function (c, ev) {
        if (ev.kind !== "click") return null;
        if (ev.id === "as-insert-q4b" && c.q !== "q4b") { c.q = "q4b"; return "ok"; }
        if (ev.id === "sp-run" && c.q === "q4b") return "done";
        return null;
      },
      auto: function (c) { if (c.q !== "q4b") { c.q = "q4b"; return "ok"; } return "done"; },
      after: function (c) { c.ran = "q4b"; c.done.q4b = true; } },
    { label: "AI HubでKB07（通知・報告の判断材料）を開く", target: function (c) { return c.hub < 4 ? "#hub-p7" : "#rec-open"; },
      tip: function (c) { return c.hub < 4 ? "④ 「通知・報告の判断材料」を開きます" : "④ 記録を開きます"; },
      sub: function (c) { return c.hub < 4 ? "対象者数・項目・顧客情報・二次被害・封じ込めの状態（P7）" : "チケット管理（架空）の記録フォーム"; },
      now: function (c) { return c.hub < 4 ? "「通知・報告の判断材料」を押します。AI Hubが、KB07の形で記録に書くことを並べます。" : "「記録を開く」を押します。"; },
      hub: "担当者の入力（P7）：「Q4a・Q4bの結果と一次対応の記録から、KB07の通知・報告の判断材料（対象者数・項目・顧客情報への影響・二次被害・封じ込め）を、確認済みと未確認に分けて整理してください。報告の要否は判断しないでください。」",
      btn: function (c) { return c.hub < 4 ? "判断材料を開く" : "記録を開く"; },
      handle: function (c, ev) {
        if (ev.kind !== "click") return null;
        if (ev.id === "hub-p7" && c.hub < 4) { c.hub = 4; return "ok"; }
        if (ev.id === "rec-open" && c.hub >= 4) return "done";
        return null;
      },
      auto: function (c) { if (c.hub < 4) { c.hub = 4; return "ok"; } return "done"; },
      after: function (c) { c.app = "intra"; c.view = "record"; } },
    { label: "記録を4項目で残す", target: function (c) { var e = recEmpty(c); return e ? "#f-" + e : "#rec-save"; },
      tip: function (c) { var e = recEmpty(c); return e ? "⑤ 「" + REC.filter(function (r) { return r[0] === e; })[0][1] + "」を書きます" : "⑤ 保存します"; },
      sub: "事象・確認済み・未確認・対応。空のままでは保存できません（入力チェック・案）",
      redo: "空の項目を埋めます",
      now: function (c) { return recEmpty(c) ? "事象・確認済み・未確認・対応の4項目を書きます。「例文を入れる」で、台本の記録が入ります。" : "「保存」を押します。"; },
      hub: "記録の形はKB07（社内・架空）です。確認済みと未確認を分けて書くと、法務・CSIRTが通知と報告の要否を速く判断できます。",
      btn: function (c) { return recEmpty(c) ? "例文を入れる" : "保存する"; },
      handle: function (c, ev) {
        if (ev.kind === "click" && ev.id === "rec-fill") { REC.forEach(function (r) { c.vals[r[0]] = r[2]; }); return "ok"; }
        if (ev.kind === "pick" && /^r[1-4]$/.test(ev.id)) return "ok";
        if (ev.kind === "click" && ev.id === "rec-save" && !recEmpty(c)) return "done";
        return null;
      },
      auto: function (c) { if (recEmpty(c)) { REC.forEach(function (r) { c.vals[r[0]] = r[2]; }); return "ok"; } return "done"; },
      after: function (c) { c.recorded = true; } }
  ],
  doneHTML: function () {
    return '<p class="now-box">範囲を確定し（在籍31,240・退職者55,180・計86,420件・7項目、顧客系0件）、記録を4項目で残しました。</p>' + recList([
      ["28:05", "AI Hub（P6）→ Assistant → Q4a：データセット別の件数・項目"], ["28:15", "Q4b：顧客系システム 0件（この範囲では）"], ["28:25", "AI Hub（P7）→ 記録（事象・確認済み・未確認・対応）を保存"]
    ], "時刻・記録は架空です。通知・報告の要否は法務・CSIRTが判断します。");
  },
  nextLabel: "S8へ進む（改善）"
};

/* ---------- S8：改善（ナレッジと役割分担） ---------- */
CH[9] = {
  role: "soc", time: "S8", timeSub: "33:00–36:00", av: "山", who: "山田（SOC担当者・架空）",
  title: "検知条件・承認段階・記録をナレッジにし、委託先との役割分担を書き換える",
  text: "山田さん（架空）は、AI Hub（P4）で今回の変更をナレッジに反映する候補（D-02をKB03へ、事例をKB05へ、承認段階の見直し、退職者データの保持・参照権限の見直し要望）を作ります。AI Hub（P8）は、委託先との役割分担（夜間監視と高度な分析は委託先、判断・承認・記録・ルール変更は社内）の書き換え案を作ります。改善チケットを起票して締めます。委託先を外す話ではなく、事案の時に日本の社内が判断し・動き・記録できる範囲を広げる話です。",
  tags: ["S8", "SOC担当者の視点", "仮説7　改善が残らず、次のシステムで繰り返す", "3:00"],
  ask: "過去の事案の調査記録と判断理由は、社内が読める場所にありますか。委託先のチケットにしかありませんか？",
  kind: "hub", kicker: "AI Hub（構想・例文）", guide: "ナレッジ化と、役割分担の書き換え",
  init: function () { return { step: 0, app: "intra", view: "improve0", hub: 0, ticket: false, vals: {} }; },
  startIds: ["g-start"],
  intro: function () {
    return guideList("おすすめのガイド", "AI Hubでナレッジ反映候補と役割分担の書き換え案を作り、改善チケットを起票します。",
      [["ナレッジ化と、役割分担の書き換え", "3ステップ・目安3分", true]]);
  },
  steps: [
    { label: "AI Hubでナレッジ反映候補を作る", target: "#hub-p4", tip: "① 「ナレッジへの反映候補」を開きます", sub: "D-02をKB03へ、事例をKB05へ、承認段階と保持期間の見直し（P4）",
      now: "「ナレッジへの反映候補」を押します。AI Hubが、変更申請の案を作ります。",
      hub: "担当者の入力（P4）：「今回の検知条件D-02、一次対応、封じ込めの承認段階、範囲確定の記録を、KB03（承認済み検索）・KB05（事例）・KB06（対応権限表）に反映する変更申請の案を作ってください。SIEMの外の改善（退職者データの保持期間・参照権限）は要望として分けてください。承認者と見直し日を含めてください。」",
      handle: clickIs("hub-p4"), after: function (c) { c.hub = 3; } },
    { label: "AI Hubで役割分担の書き換え案を作る", target: "#hub-p8", tip: "② 「委託先との役割分担」を開きます", sub: "夜間監視・高度分析＝委託先、判断・承認・記録・ルール変更＝社内（P8）",
      now: "「委託先との役割分担」を押します。AI Hubが、KB08（役割分担表）の書き換え案を作ります。",
      hub: "担当者の入力（P8）：「今回の事案で、委託先待ちになった工程（一次対応・封じ込めの承認・範囲の確定）を、社内が担う形にKB08の役割分担表を書き換える案を作ってください。委託先に残す工程（夜間監視・高度な分析・フォレンジック）も示してください。」",
      handle: clickIs("hub-p8"), after: function (c) { c.hub = 4; } },
    { label: "改善チケットを起票する", target: "#imp-ticket", tip: "③ 改善チケットを起票します", sub: "承認者：SOC責任者。見直し日を決める（架空）",
      now: "「改善チケットを起票」を押します。D-02のナレッジ登録と役割分担の書き換えを、承認に回します。",
      hub: "改善候補：D-02をKB03へ、事例A（2026-10-06）をKB05へ、KB06の③の承認SLA（30分）を追加、KB08の役割分担を書き換え。退職者データの保持期間・参照権限の見直しは人事部・情報システム部への要望。",
      handle: clickIs("imp-ticket"), after: function (c) { c.ticket = true; c.view = "improve"; } }
  ],
  doneHTML: function () {
    return '<p class="now-box">ナレッジと役割分担を書き換え、5つの成果物がそろいました。</p>' +
      '<div class="soft"><p><b>クロージング</b></p><p>委託先を外す話ではありません。ES・UEBA・SOARはそのまま、事案の時に日本の社内が判断し・動き・記録できる範囲を広げる話です。AI Assistantで検索を作り、AI Hubで社内の基準・手順・権限と照合し、テックタッチで操作と入力を完了します。</p></div>' +
      '<p class="refs">画面・人物・数値はすべて架空です。</p>';
  },
  nextLabel: "振り返りへ"
};

/* ---------- 振り返り ---------- */
CH[10] = { title: "振り返り", time: "まとめ", timeSub: "36:00", text: "", tags: [], ask: "", kind: "note", kicker: "", guide: "", steps: [], init: function () { return { step: 0, vals: {} }; } };
