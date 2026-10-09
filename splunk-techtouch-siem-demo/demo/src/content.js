// 場面の定義（S0〜S8＋振り返り）。データは data.js、ガイドの部品は engine.js／panel.js
import { CASES, REPORTS, REQUEST_IN, NAME_RULE, GOALS, REQ_WORDS, CHECK_ROWS, Q_ORDER, Q_LABEL, Q_EXPECT, VIZ_LABEL, CK, CK_FILL, EXTRA_REQ, REC, ckEmpty, recEmpty } from "./data.js";
import { clickIs, pickIs, autoTip, fix, setInfo } from "./engine.js";
import { guideList, recList } from "./panel.js";

/* ==================== 場面の定義（S0〜S8＋振り返り） ==================== */
export const CH = {};
const NAV = (k) => "#nav-" + k;

/* ---------- S0：現場の問題（説明用） ---------- */
CH[1] = {
  role: "lead", time: "S0", timeSub: "00:00–02:00", av: "中", who: "中村（SOC責任者・架空）",
  title: "機能が足りないのではなく、入れたSplunkを社内で使い切れていない",
  text: "架空のA社SOCは、Splunk CloudでVPNログを監視しています。委託先が作った検知はありますが、社内で直せません。SOC責任者の中村さん（架空）が、次の改善を依頼しました。このデモは、Splunkの機能を増やすデモではありません。既にSplunkに入っているログを、SOC担当者自身が分析・監視・調査・改善に使えるようにするデモです。",
  tags: ["S0", "SOC責任者の視点", "現状とゴール", "37分版 2:00／20分版 1:00"],
  ask: "SPLやダッシュボードの変更を、いまは誰に頼み、どれくらい待っていますか？",
  kind: "note", kicker: "説明（画面は社内ポータルのイメージ・架空）", guide: "現場の問題と、デモのゴール",
  init: function () { return { step: 0, app: "intra", view: "card", vals: {} }; },
  startIds: ["i-card", "g-start"], startLabel: "依頼カードを開く",
  intro: function () {
    return guideList("この場面で見せること", "社内ポータル（架空）の依頼カードから始めます。課題が「機能不足」ではなく「実行力と業務適合の不足」であることを示します。",
      [["現場の問題と、デモのゴール", "3ステップ・目安2分", true]]);
  },
  steps: [
    { label: "依頼カードを読む", target: "#i-card", tip: "① SOC責任者からの依頼（架空）", sub: "認証失敗の広がりの後の、管理者ログイン成功を見たい",
      now: "SOC責任者の依頼を読みます。「ダッシュボードを作り、検知した後の一次調査まで標準化してください」。",
      why: "依頼の中身は、Splunkの新機能ではありません。既にあるログを、社内の基準で分析・監視・調査できるようにすることです。",
      btn: "従来の流れを見る", handle: clickIs("i-flow"), after: function (c) { c.view = "flow"; } },
    { label: "従来の流れを確かめる", target: "#i-flow-chain", tip: "② いまは委託先に依頼して待つ", sub: "SPLの修正もダッシュボードの変更も、社内では直せない（架空）",
      now: "担当者 → 委託先 → 見積・改修 → 確認、の流れです。待ち時間は社内で把握できていません（架空）。",
      why: "Splunk AI Assistantを活かし、AI Hubで社内の運用基準に結び付け、テックタッチで実行を支えると、この流れのどこが変わるかを、S1以降で見ます。",
      btn: "ゴールを見る", handle: clickIs("i-goal"), after: function (c) { c.view = "goal"; } },
    { label: "デモ終了時の成果物を確かめる", target: "#i-goal-list", tip: "③ 画面に残す5つの成果物", sub: "SPL・ダッシュボード・検知設計・調査記録・ナレッジ",
      now: "デモの終わりに、5つの成果物を画面に残します。", why: "成果物で判断していただくため、先に並べます。数値の効果はお約束しません。",
      btn: "S1へ（Before）" }
  ],
  doneHTML: function () {
    return '<p class="now-box">課題は「機能不足」ではなく「実行力と業務適合の不足」です。</p><div class="soft"><p><b>デモ終了時に残す成果物</b></p><ul class="sum-list plain">' +
      GOALS.map(function (g) { return "<li>" + g + "</li>"; }).join("") + "</ul></div>" + '<p class="refs">画面・人物・数値はすべて架空です。</p>';
  },
  nextLabel: "S1へ進む（Before）"
};

/* ---------- S1：Before — AIがあっても完成しない（説明用） ---------- */
CH[2] = {
  role: "soc", time: "S1", timeSub: "02:00–05:00", av: "山", who: "山田（SOC担当者・架空）",
  title: "Before：件数は見えている。しかし「同一管理者」「失敗の後」を正しく表せない",
  text: "SOC担当者の山田さん（架空）は、既存のダッシュボードで認証失敗の件数は見えています。しかし、同じIPから複数ユーザーに失敗した後、対象の管理者本人がログインに成功したかを正確に表すには、対象ユーザー数と時間の順序が必要です。生成された検索が目的に合っているか確かめられず、委託先に依頼します。",
  tags: ["S1", "SOC担当者の視点", "仮説1　SPLと集計の作り方に迷う", "37分版 3:00／20分版 2:00"],
  ask: "生成した検索やAIの出力が「正しいか」を、いまはどなたが、どう確かめていますか？",
  kind: "note", kicker: "説明（Before。テックタッチのガイドはまだ無い）", guide: "Before：依頼 → 既存の画面 → 不十分な検索 → 委託先へ",
  init: function () { return { step: 0, app: "intra", view: "request", q: null, ran: null, tab: "stats", vals: {} }; },
  startIds: ["i-req", "g-start"], startLabel: "依頼文を読む",
  intro: function () {
    return guideList("この場面で見せること", "AIで検索を生成しても、SOCの検知要件に正しいかは別です。不十分な検索でケースCまで候補に入ることを、固定のテストログで見せます。",
      [["Before：依頼 → 既存の画面 → 不十分な検索 → 委託先へ", "5ステップ・目安3分", true]]);
  },
  steps: [
    { label: "依頼文を読む", target: "#i-req", tip: "① 社内チャットの依頼文（架空）", sub: "「複数アカウントへの失敗の後、管理者ログインが成功したケース」",
      now: "依頼の要点は三つです。異なるアカウントへの失敗、同じ管理者本人、失敗の後の成功。", why: "この三つを検索で表せるかが、Beforeの分かれ目です。",
      btn: "既存のダッシュボードを開く", handle: clickIs("i-open-splunk"), after: function (c) { c.app = "dashboards"; c.view = "old"; } },
    { label: "既存のダッシュボードを見る", target: "#d-old-panel", tip: "② 認証失敗の「件数」は見えています", sub: "異なるアカウント数と、失敗と成功の順序は見えない",
      now: "委託先が作ったダッシュボード（架空）には、認証失敗の件数だけがあります。", why: "件数だけでは、同じ管理者本人の「失敗の後の成功」を区別できません。",
      btn: "検索を開く", after: function (c) { c.app = "search"; c.q = "before"; } },
    { label: "不十分な検索を実行する", target: "#sp-run", tip: "③ 条件を省いた検索を実行します（教材）", sub: "Assistantの実出力ではなく、意図的に条件を省いた例",
      now: "接続元IPごとに「失敗の件数」と「特権アカウントの成功の件数」を数えて絞るだけの検索です。", why: "構文は通ります。しかし、成功が失敗より前でも、同一ユーザーでなくても、同じIPなら一致します。",
      handle: clickIs("sp-run"), after: function (c) { c.ran = "before"; } },
    { label: "結果にケースCが混ざることを確かめる", target: "#res-row-C", tip: "④ C（192.0.2.51）は管理者の成功が失敗より前", sub: "「失敗後の成功」ではないのに候補に入る（検算済み）",
      now: "AとCの2件が残りました。Cは管理者 admin_fin の成功（09:00:05）が失敗より前で、「失敗後の成功」ではありません。",
      why: "数だけの検索をダッシュボードに載せると、SOCは誤った印象を持ちます。担当者は、これが正しいかを確かめられず、委託先に依頼します。",
      btn: "委託先に依頼する", after: function (c) { c.app = "intra"; c.view = "ticket"; } },
    { label: "改修依頼チケットを見る", target: "#i-ticket", tip: "⑤ 委託先の回答待ち（架空）", sub: "ここで止まるのが、いまのA社のBefore",
      now: "改修依頼を出し、回答を待ちます。SOCの監視は、その間は変わりません。", why: "次のS2から、同じ依頼を、AI Hub・Splunk AI Assistant・テックタッチでSOC担当者自身が進めます。",
      btn: "Beforeを終える" }
  ],
  doneHTML: function () {
    return '<p class="now-box">構文が通ることと、SOCの検知要件に正しいことは別です。</p>' +
      '<div class="soft"><p><b>不十分な検索の問題</b></p><ul class="sum-list plain"><li>異なる失敗アカウント数を見ていない</li><li>管理者の失敗と成功が同一アカウントかを見ていない</li><li>成功が失敗より後かを見ていない</li></ul></div>' +
      '<p class="refs">この検索は教材です。Splunk AI Assistantの実際の出力ではありません。</p>';
  },
  nextLabel: "S2へ進む（要件整理）"
};

/* ---------- S2：AI Hubで「何を依頼するか」を具体化する ---------- */
CH[3] = {
  role: "soc", time: "S2", timeSub: "05:00–09:00", av: "山", who: "山田（SOC担当者・架空）",
  title: "日本語の依頼を、AI Hubが社内要件（ログ辞書・検知基準）に基づく依頼文にする",
  text: "山田さん（架空）は、Splunkの検索画面の上に出るテックタッチのガイド「SOC分析アシスト」からAI Hubを開き、やりたいことを日本語で書きます。AI Hubは、A社のログ辞書（KB01）・検知基準（KB02）・承認済み検索（KB03）を参照し、Splunk AI Assistantへの依頼文を作ります。良いプロンプトを書ける人だけがAIを使える、という状態を減らします。",
  tags: ["S2", "SOC担当者の視点", "仮説2　AIへの依頼を社内要件に合わせられない", "37分版 4:00／20分版 2:30"],
  ask: "Splunk AI Assistantに何をどう頼むか、御社ではどなたが決めていますか？",
  kind: "hub", kicker: "ガイド＋AI Hub（構想・例文）", guide: "SOC分析アシスト：依頼を社内要件に整える",
  init: function () { return { step: 0, app: "search", q: null, ran: null, tab: "stats", chip: true, hub: 0, copied: false, vals: { "hub-in": "" } }; },
  startIds: ["chip-soc", "g-start"], startLabel: "「SOC分析アシスト」を開く",
  onStart: function (c) { c.hub = 1; },
  intro: function () {
    return guideList("おすすめのガイド", "検索画面の上の「SOC分析アシスト」を押すと、AI Hub（構想・架空画面）が開きます。",
      [["SOC分析アシスト：依頼を社内要件に整える", "4ステップ・目安4分", true]]);
  },
  steps: [
    { label: "やりたいことを日本語で書く", target: "#hub-in-wrap", tip: "① 日本語で、やりたいことを書きます", sub: "SPLの用語は要りません",
      now: "AI Hubの入力欄に、やりたいことを日本語で書きます。「例文を入れる」で、台本の依頼文が入ります。",
      hub: "参照するナレッジ（P1）：KB01 ログ辞書、KB02 検知基準、KB03 承認済み検索。AI Hubは、この三つに照らして依頼を整理します。",
      btn: "例文を入れる",
      handle: function (c, ev) {
        if (ev.kind === "click" && ev.id === "hub-fill") { c.vals["hub-in"] = REQUEST_IN; return "done"; }
        if (ev.kind === "pick" && ev.id === "hub-in") return ev.value.trim() ? "done" : { wrong: "依頼が空です。やりたいことを日本語で書くか、「例文を入れる」を押します。" };
        return null;
      },
      auto: function (c) { c.vals["hub-in"] = REQUEST_IN; return "done"; },
      after: function (c) { c.hub = 2; } },
    { label: "AI Hubに送る", target: "#hub-send", tip: "② AI Hubに送ります", sub: "回答は、本番前に確かめた例文を使います",
      now: "「整理する」を押します。AI Hubが、対象・条件・追加条件・確認事項・分析の分け方を整理します。",
      hub: "AI Hubの回答は、デモでは本番前に確かめた例文です。実環境では、御社のナレッジに合わせて検証します。",
      handle: clickIs("hub-send"), after: function (c) { c.hub = 3; } },
    { label: "整理された要件を確かめる", target: "#hub-req", tip: "③ 依頼文に5つの言葉が入っているか", sub: "15分／10件以上／異なる5ユーザー／同一管理者／失敗後の成功",
      now: "Assistant向けの依頼文に、「15分」「10件以上」「異なる失敗user」「同じsrc・同じ管理者user」「失敗の後で成功」が入っていることを確かめます（S2の合格判定）。",
      hub: "列名と書式を依頼文に書く理由：Splunk AI Assistantがルックアップの列構成を自動で把握するという公式の記載は見当たりません。AI HubがKB01から列名を補います。",
      btn: "確かめた" },
    { label: "依頼文をコピーする", target: "#hub-copy", tip: "④ コピーして、S3でAssistantに貼ります", sub: "AI Hub → Splunk AI Assistant は手動コピー（デモ確定方式）",
      now: "依頼文をコピーします。次の場面で、Splunk AI Assistantの入力欄に貼ります。",
      hub: "AI HubとAssistantの間の受け渡しは手動コピーです（2.4）。画面が2つになるため、リハーサルで見やすさを確かめます（9章 #2）。",
      handle: clickIs("hub-copy"), after: function (c) { c.copied = true; } }
  ],
  doneHTML: function () {
    return '<p class="now-box">依頼文をコピーしました。S3でSplunk AI Assistantに貼ります。</p>' +
      '<div class="soft"><p><b>S2の合格判定</b></p><ul class="sum-list plain">' + REQ_WORDS.map(function (w) { return "<li>" + w + "</li>"; }).join("") + "</ul></div>" +
      '<p class="refs">AI Hubの回答は本番前に確かめた例文です。実環境の項目名やデータ構造に合わせた検証が必要です。</p>';
  },
  nextLabel: "S3へ進む（SPL生成・確認）"
};

/* ---------- S3：Assistantを使い、AI Hubが業務適合を確かめる ---------- */
CH[4] = {
  role: "soc", time: "S3", timeSub: "09:00–14:00", av: "山", who: "山田（SOC担当者・架空）",
  title: "AssistantのSPL案を、AI HubがSOCの業務条件で照合し、修正依頼を作る",
  text: "山田さん（架空）は、S2の依頼文をSplunk AI Assistantに貼り、SPL案を受け取ります。Assistantの出力はそのまま表示します（進行ルール）。AI Hubは、構文ではなくSOCの業務条件（異なるアカウント数・同一ユーザー・前後関係・時間範囲）で照合し、不足があればAssistantへの修正依頼文を作ります。再生成したSPLは、Splunkの検索画面で実行して確かめます。",
  tags: ["S3", "SOC担当者の視点", "仮説2　AIの出力の妥当性を判断できない", "37分版 5:00／20分版 3:00"],
  ask: "AIが作った検索を、御社の検知要件に照らして確かめる工程は、いまありますか？",
  kind: "hub", kicker: "AI Assistant（Splunkの機能）＋AI Hub（構想・例文）", guide: "AssistantのSPL案を、SOC基準で確かめる",
  init: function () { return { step: 0, app: "search", q: null, ran: null, tab: "stats", assist: true, stage: 0, hub: 0, fixPasted: false, vals: {} }; },
  startIds: ["g-start"],
  intro: function () {
    return guideList("おすすめのガイド", "Splunk AI Assistant（画面イメージ・架空）に依頼文を貼り、SPL案を受け取ります。AI Hubが業務条件で照合します。",
      [["AssistantのSPL案を、SOC基準で確かめる", "5ステップ・目安5分", true]]);
  },
  free: function (c, ev) {
    if (ev.kind === "click" && ev.id === "as-insert" && c.hub < 3) {
      fix("【入力チェック（案）】照合の前に、検索へ入れようとしています。先にAI Hubで「同一ユーザー」「前後関係」「時間範囲」を確かめます（社内ルール・架空）。");
      return true;
    }
    return false;
  },
  steps: [
    { label: "依頼文をAssistantに貼る", target: "#as-input", tip: "① S2でコピーした依頼文を貼ります", sub: "Splunk AI Assistant（S&Rの横のパネル・画面イメージ）",
      now: "Splunk AI Assistantの入力欄に、S2の依頼文を貼ります。", hub: "依頼文には、列名・書式・15分・10件以上・異なる5ユーザー・同一管理者・失敗後の成功が入っています。",
      btn: "貼り付ける", handle: clickIs("as-paste"), after: function (c) { c.stage = 1; } },
    { label: "SPL案を生成する", target: "#as-send", tip: "② 送信して、SPL案を受け取ります", sub: "出力はそのまま表示（特定の失敗を演出しない）",
      now: "送信します。表示されるSPL案は、デモ用に準備した参考画面です。実機ではAssistantの出力をそのまま使います。",
      hub: "進行ルール：適切な検索が出た場合はそのまま評価します。条件が欠けていれば、その内容をAI Hubに渡して補います。",
      handle: clickIs("as-send"), after: function (c) { c.stage = 2; } },
    { label: "AI Hubで業務条件と照合する", target: "#hub-check", tip: "③ 「SOC基準との照合」を開きます", sub: "構文ではなく、SOCの業務条件で確かめる（P2）",
      now: "「SOC基準との照合」を押します。AI Hubが、ログ辞書・ユーザー数・同一ユーザー・前後関係・最終検証の5項目で評価します。",
      hub: "担当者の入力（P2）：「次のSPL案を、KB01〜KB03と照合してください。①参照するログ・フィールド、②異なるアカウント数、③同じ管理者本人の失敗後の成功、④除外条件、⑤時間範囲を表で評価し、不足箇所についてAssistantへの修正依頼文を作ってください。検索結果の真偽は断定せず、実データで確認する項目を示してください。」",
      handle: clickIs("hub-check"), after: function (c) { c.hub = 3; } },
    { label: "修正依頼を戻して再生成する", target: function (c) { return c.fixPasted ? "#as-send" : "#hub-copy-fix"; },
      tip: function (c) { return c.fixPasted ? "④ 送信して、再生成します" : "④ 修正依頼文をAssistantに戻します"; },
      sub: function (c) { return c.fixPasted ? "同一ユーザー・前後関係・時間範囲を足した案が返る想定" : "AI Hubが作った修正依頼文をコピーして貼ります"; },
      now: function (c) { return c.fixPasted ? "送信します。再生成されたSPLは、eventstats・sort・streamstats で同一ユーザー・前後関係を扱います。" : "照合表の下の修正依頼文を、Assistantに戻します。"; },
      hub: "修正依頼文の要点：(1) 成功した管理者本人に同じ接続元からの失敗があること（src と user の単位）。(2) その失敗が成功より前であること（時刻順）。(3) 対象を 09:00〜09:15 の15分間に限定。",
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
      sub: function (c) { return c.q === "q3" ? "期待：198.51.100.24 / admin_ops / 09:10:00 の1行" : "「検索に入れる」を押します"; },
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
      '<div class="soft"><p><b>S3の合格判定</b></p><p>AI Hubが、SPLの構文ではなくSOCの業務条件に基づくチェックリストを出す。</p></div>' +
      '<p class="refs">Assistantの回答は、デモ本番では準備した例ではなく実機の出力を使います。Assistantの精度が1年前より上がったことを示す公開の根拠は見当たりません（結論0）。</p>';
  },
  nextLabel: "S4へ進む（データ検証）"
};

/* ---------- S4：正解ログに照らし、誤検知の候補を区別する ---------- */
function qStep(key, n) {
  var idx = Q_ORDER.indexOf(key);
  var why = { q1: "A〜Dの4件が並びます。件数だけでなく「異なる失敗ユーザー数」を見ます。Bは18件でも1アカウントです。",
    q2: "AとCが残ります。Cは12件・6人で閾値を満たしますが、管理者の成功は失敗より前です。",
    q3: "Aだけが残ります。「同一管理者」「失敗の後の成功」の条件が要ることを示す核心です。",
    q4: "5分単位の推移です。09:05に失敗が集中し、09:10に成功が1件（admin_ops）あります。" }[key];
  // 段階：nav（レポート一覧を開く）→ open（レポートを開く）→ run（実行）
  var ph = function (c) { return c.q === key ? "run" : c.app === "reports" ? "open" : "nav"; };
  return {
    label: Q_LABEL[key] + "を実行する",
    target: function (c) { var p = ph(c); return p === "nav" ? NAV("reports") : p === "open" ? "#rep-" + key : "#sp-run"; },
    tip: function (c) { var p = ph(c); return p === "nav" ? n + " 「レポート」を開きます" : p === "open" ? n + " 「" + REPORTS[idx][1] + "」を開きます" : n + " 実行します"; },
    sub: function (c) { var p = ph(c); return p === "nav" ? "保存済みレポート（Q1〜Q4）は、ここにあります" : p === "open" ? "期待：" + Q_EXPECT[key] : "結果を期待値と見比べます"; },
    redo: "ガイドの順に開き直します",
    now: function (c) { var p = ph(c); return p === "nav" ? "上の「レポート」から、保存済みレポートの一覧を開きます。" : p === "open" ? "「" + REPORTS[idx][1] + "」を開きます。" : "検索を実行し、結果を期待値と見比べます。"; },
    why: why,
    btn: function (c) { var p = ph(c); return p === "nav" ? "レポートを開く" : p === "open" ? "このレポートを開く" : "実行する"; },
    handle: function (c, ev) {
      if (ev.kind !== "click") return null;
      if (ev.id === "nav-reports") { c.app = "reports"; return "ok"; }
      if (ev.id === "nav-search") { c.app = "search"; return "ok"; }
      var m = /^rep-(q[1-4])$/.exec(ev.id);
      if (m) {
        if (m[1] === key) { c.app = "search"; c.q = key; c.tab = key === "q4" ? "viz" : "stats"; return "ok"; }
        return { wrong: "順番が違います。次は「" + Q_LABEL[key] + "」です。Q1→Q2→Q3→Q4の順に、期待値と見比べます（ガイドの順・架空）。" };
      }
      if (ev.id === "sp-run" && c.q === key) return "done";
      return null;
    },
    auto: function (c) {
      var p = ph(c);
      if (p === "nav") { c.app = "reports"; return "ok"; }
      if (p === "open") { c.app = "search"; c.q = key; c.tab = key === "q4" ? "viz" : "stats"; return "ok"; }
      return "done";
    },
    after: function (c) { c.ran = key; c.done[key] = true; }
  };
}
CH[5] = {
  role: "soc", time: "S4", timeSub: "14:00–19:00", av: "山", who: "山田（SOC担当者・架空）",
  title: "固定のテストログに照らし、ケースA／B／C／Dを区別する",
  text: "山田さん（架空）は、CSVルックアップとして読み込んだ固定のテストログ（72件・架空）に、承認済みの検索Q1〜Q4を順に実行します。Q1でA〜Dが並び、Q2でAとCが残り、Q3でAだけが残ります。この差を見せることで、AIの出力を「検証できる分析結果」に変えます。テックタッチのガイドは、保存済みレポートの場所と実行の順番を案内します。",
  tags: ["S4", "SOC担当者の視点", "仮説2　検証の方法が無い", "37分版 5:00／20分版 3:00"],
  ask: "検知条件を変えたとき、正解のテストケースで確かめる仕組みは、いまありますか？",
  kind: "tt", kicker: "操作ナビ（案）", guide: "正解ログに照らして、ケースA〜Dを区別する",
  init: function () { return { step: 0, app: "search", q: null, ran: null, tab: "stats", done: {}, vals: {} }; },
  startIds: ["g-start"],
  intro: function () {
    return guideList("おすすめのガイド", "保存済みレポートQ1〜Q4を順に実行し、期待値（5章の検算結果）と見比べます。",
      [["正解ログに照らして、ケースA〜Dを区別する", "4ステップ・目安5分", true]]);
  },
  steps: [qStep("q1", "①"), qStep("q2", "②"), qStep("q3", "③"), qStep("q4", "④")],
  doneHTML: function () {
    return '<p class="now-box">Q1がA36・B18・C12・D4。Q2がA・C。Q3がAのみ。S4の合格判定を満たしました。</p>' +
      '<div class="soft"><p><b>ケースの判定（架空）</b></p><ul class="rec-list">' + CASES.map(function (k) { return '<li><span class="t">' + k.id + "</span><span>" + k.note + " → " + k.verdict + "</span></li>"; }).join("") + "</ul></div>" +
      '<p class="refs">期待値はPythonで検算したものです。Splunk実機での実行は構築時にSEが確かめます（8.1）。</p>';
  },
  nextLabel: "S5へ進む（可視化）"
};

/* ---------- S5：テックタッチのガイドで監視ダッシュボードを完成する ---------- */
function panelStep(key, viz, n, why) {
  var idx = Q_ORDER.indexOf(key);
  return {
    label: Q_LABEL[key] + "を" + VIZ_LABEL[viz] + "で追加する",
    target: function (c) { return c.vals["ds"] !== key ? "#f-ds" : c.vals["viz"] !== viz ? "#f-viz" : "#db-add"; },
    tip: function (c) { return c.vals["ds"] !== key ? n + " データソースに「" + REPORTS[idx][1] + "」を選びます" : c.vals["viz"] !== viz ? n + " 可視化を「" + VIZ_LABEL[viz] + "」にします" : n + " 「追加」を押します"; },
    sub: function (c) { return c.vals["ds"] !== key ? "保存済みレポートをデータソースにします（ds.savedSearch。実機で要確認）" : c.vals["viz"] !== viz ? why : "パネルがキャンバスに置かれます"; },
    redo: "選び直します",
    now: function (c) { return c.vals["ds"] !== key ? "データソースに「" + REPORTS[idx][1] + "」を選びます。" : c.vals["viz"] !== viz ? "可視化を「" + VIZ_LABEL[viz] + "」にします。" : "「追加」を押します。"; },
    why: why,
    btn: function (c) { return c.vals["ds"] !== key ? "データソースを選ぶ" : c.vals["viz"] !== viz ? "可視化を選ぶ" : "追加する"; },
    handle: function (c, ev) {
      if (ev.kind === "pick" && ev.id === "ds") {
        if (ev.value === key) return "ok";
        if (!ev.value) return null;
        return { wrong: "順番が違います。次は「" + REPORTS[idx][1] + "」です（ガイドの順・架空）。" };
      }
      if (ev.kind === "pick" && ev.id === "viz") {
        if (!ev.value) return null;
        if (ev.value === viz) return "ok";
        return { wrong: "【入力チェック（案）】" + Q_LABEL[key] + "は「" + VIZ_LABEL[viz] + "」にします。" + why };
      }
      if (ev.kind === "click" && ev.id === "db-add") {
        if (c.vals["ds"] === key && c.vals["viz"] === viz) return "done";
        return { wrong: "データソースと可視化を先に選びます。" };
      }
      return null;
    },
    auto: function (c) {
      if (c.vals["ds"] !== key) { c.vals["ds"] = key; return "ok"; }
      if (c.vals["viz"] !== viz) { c.vals["viz"] = viz; return "ok"; }
      return "done";
    },
    after: function (c) { c.panels.push({ ds: key, viz: viz }); c.vals["ds"] = ""; c.vals["viz"] = ""; }
  };
}
CH[6] = {
  role: "soc", time: "S5", timeSub: "19:00–25:00", av: "山", who: "山田（SOC担当者・架空）",
  title: "テックタッチのガイドで、SOC認証監視ダッシュボードを完成させる",
  text: "山田さん（架空）は、Dashboard Studio（画面イメージ・架空）で監視ダッシュボードを作ります。テックタッチのガイドは、命名規則の入力チェック、保存済みレポートをデータソースにする手順、可視化の種類、共有範囲の入力チェックを、1画面ずつ案内します。今まで委託先に依頼していた定型的な可視化の変更を、担当者自身が進めます。",
  tags: ["S5", "SOC担当者の視点", "仮説3　作成・修正で止まる", "37分版 6:00／20分版 3:00（Q1とQ3の2枚）"],
  ask: "ダッシュボードの作成・変更は、いま誰が、どの基準で行っていますか？",
  kind: "tt", kicker: "操作ナビ＋入力チェック（案）", guide: "SOC認証監視ダッシュボードを作る",
  init: function () { return { step: 0, app: "dashboards", view: "list", panels: [], saved: false, vals: { "db-name": "", "db-share": "", ds: "", viz: "" } }; },
  startIds: ["g-start"],
  intro: function () {
    return guideList("おすすめのガイド", "新規ダッシュボードを作り、Q1〜Q4のパネルを置き、共有範囲を確かめて保存します。20分版はQ1とQ3の2枚だけにします。",
      [["SOC認証監視ダッシュボードを作る", "6ステップ・目安6分", true]]);
  },
  steps: [
    { label: "新規ダッシュボードを作る（命名規則）", target: function (c) { return c.view === "list" ? "#db-new" : !NAME_RULE.test(c.vals["db-name"]) ? "#f-db-name" : "#db-create"; },
      tip: function (c) { return c.view === "list" ? "① 「新規ダッシュボードを作成」を押します" : !NAME_RULE.test(c.vals["db-name"]) ? "① 名前は「チーム_対象_用途」の形にします" : "① 「作成」を押します"; },
      sub: function (c) { return c.view === "list" ? "Dashboard Studioで作ります" : !NAME_RULE.test(c.vals["db-name"]) ? "例：A社_SOC認証監視_デモ（入力チェック・案）" : "Dashboard Studioの編集画面が開きます"; },
      redo: "名前を直します",
      now: function (c) { return c.view === "list" ? "「新規ダッシュボードを作成」を押します。" : !NAME_RULE.test(c.vals["db-name"]) ? "名前を「A社_SOC認証監視_デモ」の形（チーム_対象_用途）で入力します。" : "「作成」を押します。"; },
      why: "名前の形をそろえると、委託先が作ったものと社内で作ったものを、一覧で見分けられます（社内ルール・架空）。",
      btn: function (c) { return c.view === "list" ? "新規作成を開く" : !NAME_RULE.test(c.vals["db-name"]) ? "例の名前を入れる" : "作成する"; },
      handle: function (c, ev) {
        if (ev.kind === "click" && ev.id === "db-new" && c.view === "list") { c.view = "new"; return "ok"; }
        if (ev.kind === "pick" && ev.id === "db-name") {
          if (NAME_RULE.test(ev.value)) return "ok";
          return { wrong: "【入力チェック（案）】名前は「チーム_対象_用途」の形にします。例：A社_SOC認証監視_デモ（社内ルール・架空）。" };
        }
        if (ev.kind === "click" && ev.id === "db-create" && c.view === "new") {
          if (NAME_RULE.test(c.vals["db-name"])) return "done";
          return { wrong: "【入力チェック（案）】名前が命名規則に合っていません。「チーム_対象_用途」の形にします。" };
        }
        return null;
      },
      auto: function (c) {
        if (c.view === "list") { c.view = "new"; return "ok"; }
        if (!NAME_RULE.test(c.vals["db-name"])) { c.vals["db-name"] = "A社_SOC認証監視_デモ"; return "ok"; }
        return "done";
      },
      after: function (c) { c.view = "edit"; } },
    panelStep("q1", "bar", "②", "IP別の件数を比べるので、棒グラフにします。"),
    panelStep("q2", "table", "③", "異なる失敗アカウント数を件数と並べて読むので、表にします。"),
    panelStep("q3", "table", "④", "対象のIP・アカウント・時刻・MFAを読むので、表にします。"),
    panelStep("q4", "line", "⑤", "5分単位の推移を見るので、折れ線グラフにします。"),
    { label: "共有範囲を確かめて保存する", target: function (c) { return c.vals["db-share"] !== "team" ? "#f-db-share" : "#db-save"; },
      tip: function (c) { return c.vals["db-share"] !== "team" ? "⑥ 共有範囲を「SOCチーム（アプリ）」にします" : "⑥ 保存します"; },
      sub: function (c) { return c.vals["db-share"] !== "team" ? "「自分だけ」のままだと、チームの監視に使えません（入力チェック・案）" : "検索期間は「過去15分」のまま（デモはCSVの固定ログ）"; },
      redo: "共有範囲を選び直します",
      now: function (c) { return c.vals["db-share"] !== "team" ? "共有範囲を「SOCチーム（アプリ）」にします。" : "「保存」を押します。"; },
      why: "権限・共有範囲は、Splunkの機能です。テックタッチは「このチームでは何を選ぶか」だけを案内します。",
      btn: function (c) { return c.vals["db-share"] !== "team" ? "共有範囲を選ぶ" : "保存する"; },
      handle: function (c, ev) {
        if (ev.kind === "pick" && ev.id === "db-share") {
          if (ev.value === "team") return "ok";
          if (ev.value === "me") return { wrong: "【入力チェック（案）】共有範囲が「自分だけ」です。SOCチームの監視に使うため「SOCチーム（アプリ）」にします（社内ルール・架空）。" };
          if (ev.value === "all") return { wrong: "【入力チェック（案）】「すべてのアプリ」は、他部門にも見えます。「SOCチーム（アプリ）」にします（社内ルール・架空）。" };
          return null;
        }
        if (ev.kind === "click" && ev.id === "db-save") {
          if (c.vals["db-share"] === "team") return "done";
          return { wrong: "【入力チェック（案）】共有範囲を先に確かめます。" };
        }
        return null;
      },
      auto: function (c) { if (c.vals["db-share"] !== "team") { c.vals["db-share"] = "team"; return "ok"; } return "done"; },
      after: function (c) { c.saved = true; } }
  ],
  doneHTML: function () {
    return '<p class="now-box">ダッシュボードを保存しました。A/B/Cの差を確認できる4パネルです。</p>' + recList([
      ["19:02", "新規作成（名前：A社_SOC認証監視_デモ。命名規則の入力チェック）"], ["19:10", "Q1棒・Q2表・Q3表・Q4折れ線の4パネル"], ["19:14", "共有範囲「SOCチーム」で保存"]
    ], "時刻・記録は架空です。保存済みレポートをデータソースにする操作は、実機で確かめます（9章 #7）。");
  },
  nextLabel: "S6へ進む（検知）"
};

/* ---------- S6：SSEを参照し、検知へつなぐ ---------- */
CH[7] = {
  role: "soc", time: "S6", timeSub: "25:00–29:00", av: "山", who: "山田（SOC担当者・架空）",
  title: "SSEの検知コンテンツを参照し、A社の基準どおりのアラートにする",
  text: "山田さん（架空）は、Splunk Security Essentials（SSE）のSecurity Contentで認証関連の検知コンテンツを開き、必要なログ・誤検知になりやすい条件・対応のしかたを確かめます（Splunkの機能）。A社の検知基準（KB02）はテックタッチのツールチップで示します。アラートの保存画面では、名前・実行の間隔・抑制・通知先・「トリガーされたアラートに追加」を、入力チェック付きで設定します。委託先に頼まずにアラートを足せる姿です。",
  tags: ["S6", "SOC担当者の視点", "仮説3　検知のチューニングで止まる", "37分版 4:00／20分版 2:00"],
  ask: "検知コンテンツを入れた後、自社のログと運用条件に合わせて直す作業は、いま誰が担っていますか？",
  kind: "tt", kicker: "ツールチップ＋入力チェック（案）", guide: "SSEを参照して、社内基準どおりのアラートを作る",
  init: function () { return { step: 0, app: "sse", view: "list", q: null, ran: null, tab: "stats", menu: false, dialog: false, savedAlert: false, vals: { "al-name": "", "al-sched": "", "al-throttle": "", "al-to": "", "al-add": "" } }; },
  startIds: ["g-start"],
  intro: function () {
    return guideList("おすすめのガイド", "SSEの検知コンテンツを参照し、A社の基準をツールチップで確かめ、アラートの保存画面を社内基準どおりに埋めます。",
      [["SSEを参照して、社内基準どおりのアラートを作る", "7ステップ・目安4分", true]]);
  },
  free: function (c, ev) {
    if (ev.kind === "click" && /^sse-item-other/.test(ev.id)) { setInfo("このデモでは「Detect Password Spray Attempts」を開きます。他のコンテンツ名は省略しています（架空）。"); return true; }
    return false;
  },
  steps: [
    { label: "SSEで検知コンテンツを開く", target: function (c) { return c.view === "list" ? "#sse-item-ps" : "#sse-kfp"; },
      tip: function (c) { return c.view === "list" ? "① 「Detect Password Spray Attempts」を開きます" : "① Known False Positives と How to Respond を読みます"; },
      sub: function (c) { return c.view === "list" ? "SSEのSecurity Content（Splunkの機能）" : "必要なログ、誤検知になりやすい条件、対応のしかた"; },
      now: function (c) { return c.view === "list" ? "Security Contentの一覧から「Detect Password Spray Attempts」を開きます。" : "必要なログ、Known False Positives（誤検知になりやすい条件）、How to Respond（対応のしかた）を読みます。"; },
      why: "SSEはSplunk Cloud Platformで使える無料のアプリで、ESの専用機能ではありません。検知コンテンツを「入れて終わり」にせず、自社のログと条件に合わせます。",
      btn: function (c) { return c.view === "list" ? "コンテンツを開く" : "読んだ"; },
      handle: function (c, ev) {
        if (ev.kind !== "click") return null;
        if (ev.id === "sse-item-ps" && c.view === "list") { c.view = "detail"; return "ok"; }
        if (ev.id === "sse-kfp" && c.view === "detail") return "done";
        return null;
      },
      auto: function (c) { if (c.view === "list") { c.view = "detail"; return "ok"; } return "done"; } },
    { label: "A社の検知基準をツールチップで確かめる", target: "#tw-std", tip: "② 「?」でA社の基準（KB02）を表示します", sub: "15分・失敗10件以上・異なる5アカウント以上（架空）",
      now: "「?」を押して、A社の検知基準 D-01（架空）を表示します。", why: "SSEの一般的な条件と、A社の基準は別です。基準は画面の上で、同じ言葉で確かめます。",
      btn: "基準を表示する",
      handle: function (c, ev) { return ev.kind === "tip" && ev.id === "std" ? "done" : null; },
      auto: autoTip("std") },
    { label: "本番用の検索の設計を確かめる", target: "#sse-q5", tip: "③ 本番用は、インデックス化された認証イベントを検索します", sub: "固定CSVの定期実行は、継続的な監視にはなりません",
      now: "Q2を参考に、本番用はインデックス化された認証イベントを検索する設計（Q5の骨格）に置き換えることを確かめます。",
      why: "デモでは、過去ログへの検索検証（S4）と、アラート設定の設計・画面操作（この場面）を切り分けて説明します。",
      btn: "検索を開く", after: function (c) { c.app = "search"; c.q = "q2"; c.ran = "q2"; } },
    { label: "名前を付けて保存 ＞ アラート", target: function (c) { return c.menu ? "#sa-alert" : "#sp-saveas"; },
      tip: function (c) { return c.menu ? "④ 「アラート」を選びます" : "④ 「名前を付けて保存」を開きます"; },
      sub: function (c) { return c.menu ? "アラートの保存画面が開きます" : "検索 → 名前を付けて保存 ＞ アラート"; },
      now: function (c) { return c.menu ? "「アラート」を選びます。" : "検索結果の右上の「名前を付けて保存」を開きます。"; },
      why: "アラートの保存は、Splunkの機能です。定期実行には schedule_search の権限が要ります（既定ではadminとpower。9章 #8）。",
      btn: function (c) { return c.menu ? "アラートを選ぶ" : "メニューを開く"; },
      handle: function (c, ev) {
        if (ev.kind !== "click") return null;
        if (ev.id === "sp-saveas" && !c.menu) { c.menu = true; return "ok"; }
        if (ev.id === "sa-alert" && c.menu) return "done";
        if (/^sa-/.test(ev.id)) return { wrong: "このデモでは「アラート」を選びます。レポートやダッシュボードパネルは、別のガイドで扱います（架空）。" };
        return null;
      },
      auto: function (c) { if (!c.menu) { c.menu = true; return "ok"; } return "done"; },
      after: function (c) { c.menu = false; c.dialog = true; } },
    { label: "名前と実行の間隔を決める", target: function (c) { return !NAME_RULE.test(c.vals["al-name"]) ? "#f-al-name" : "#f-al-sched"; },
      tip: function (c) { return !NAME_RULE.test(c.vals["al-name"]) ? "⑤ 名前は「SOC_対象_用途」の形にします" : "⑤ 実行の間隔は「15分ごと」にします"; },
      sub: function (c) { return !NAME_RULE.test(c.vals["al-name"]) ? "例：SOC_認証_失敗後の特権成功（入力チェック・案）" : "リアルタイムは使いません（社内基準・架空）"; },
      redo: "直します",
      now: function (c) { return !NAME_RULE.test(c.vals["al-name"]) ? "名前を「SOC_認証_失敗後の特権成功」の形で入力します。" : "アラートタイプを「スケジュール（15分ごと）」にします。"; },
      why: "Splunk Cloudでは、スケジュールの時刻がUTCになります（9章 #8）。",
      btn: function (c) { return !NAME_RULE.test(c.vals["al-name"]) ? "例の名前を入れる" : "15分ごとにする"; },
      handle: function (c, ev) {
        if (ev.kind !== "pick") return null;
        if (ev.id === "al-name") return NAME_RULE.test(ev.value) ? "ok" : { wrong: "【入力チェック（案）】名前は「SOC_対象_用途」の形にします。例：SOC_認証_失敗後の特権成功（社内ルール・架空）。" };
        if (ev.id === "al-sched") {
          if (!ev.value) return null;
          if (ev.value === "rt") return { wrong: "【入力チェック（案）】リアルタイム検索は使いません。定期実行の「15分ごと」にします（Splunkも定期実行を勧めています。社内基準・架空）。" };
          if (ev.value !== "15m") return { wrong: "【入力チェック（案）】A社の基準は「15分ごと」です（社内基準・架空）。" };
          return NAME_RULE.test(c.vals["al-name"]) ? "done" : "ok";
        }
        return null;
      },
      auto: function (c) { if (!NAME_RULE.test(c.vals["al-name"])) { c.vals["al-name"] = "SOC_認証_失敗後の特権成功"; return "ok"; } c.vals["al-sched"] = "15m"; return "done"; } },
    { label: "抑制と通知先を決める", target: function (c) { return c.vals["al-throttle"] !== "60src" ? "#f-al-throttle" : "#f-al-to"; },
      tip: function (c) { return c.vals["al-throttle"] !== "60src" ? "⑥ 抑制を「同じsrcで60分」にします" : "⑥ 通知先はSOCチームの共有アドレスにします"; },
      sub: function (c) { return c.vals["al-throttle"] !== "60src" ? "空のままだと、同じ接続元で通知が続きます（入力チェック・案）" : "個人のアドレスだと、不在のときに見落とします（入力チェック・案）"; },
      redo: "選び直します",
      now: function (c) { return c.vals["al-throttle"] !== "60src" ? "抑制を「同じ src で60分」にします。" : "通知先を「SOCチーム（共有アドレス）」にします。"; },
      why: "抑制と通知は、Splunkの機能です。テックタッチは、A社が何を選ぶか（社内基準・架空）だけを案内します。",
      btn: function (c) { return c.vals["al-throttle"] !== "60src" ? "抑制を選ぶ" : "通知先を選ぶ"; },
      handle: function (c, ev) {
        if (ev.kind !== "pick") return null;
        if (ev.id === "al-throttle") {
          if (!ev.value) return null;
          if (ev.value === "none") return { wrong: "【入力チェック（案）】抑制が空です。同じ src で60分抑制します（社内基準・架空）。" };
          return "ok";
        }
        if (ev.id === "al-to") {
          if (!ev.value) return null;
          if (ev.value === "me") return { wrong: "【入力チェック（案）】個人のアドレスは、担当者が不在のときに見落とします。SOCチームの共有アドレスにします（社内基準・架空）。" };
          return c.vals["al-throttle"] === "60src" ? "done" : "ok";
        }
        return null;
      },
      auto: function (c) { if (c.vals["al-throttle"] !== "60src") { c.vals["al-throttle"] = "60src"; return "ok"; } c.vals["al-to"] = "soc"; return "done"; } },
    { label: "トリガーされたアラートに追加して保存する", target: function (c) { return c.vals["al-add"] !== "yes" ? "#f-al-add" : "#al-save"; },
      tip: function (c) { return c.vals["al-add"] !== "yes" ? "⑦ 「トリガーされたアラートに追加」を付けます" : "⑦ 保存します"; },
      sub: function (c) { return c.vals["al-add"] !== "yes" ? "付けないとActivityの一覧に出ません（既定で24時間で消える）" : "S7でこの一覧から結果を開きます"; },
      redo: "直します",
      now: function (c) { return c.vals["al-add"] !== "yes" ? "「トリガーされたアラートに追加」を「追加する」にします。" : "「保存」を押します。"; },
      why: "付けないと、S7の「トリガーされたアラート」の一覧に出ません（公式の記載。9章 #8）。",
      btn: function (c) { return c.vals["al-add"] !== "yes" ? "追加するにする" : "保存する"; },
      handle: function (c, ev) {
        if (ev.kind === "pick" && ev.id === "al-add") {
          if (!ev.value) return null;
          return ev.value === "yes" ? "ok" : { wrong: "【入力チェック（案）】「追加しない」だと、トリガーされたアラートの一覧に出ません。「追加する」にします（社内基準・架空）。" };
        }
        if (ev.kind === "click" && ev.id === "al-save") {
          if (c.vals["al-add"] === "yes") return "done";
          return { wrong: "【入力チェック（案）】「トリガーされたアラートに追加」を先に付けます。" };
        }
        return null;
      },
      auto: function (c) { if (c.vals["al-add"] !== "yes") { c.vals["al-add"] = "yes"; return "ok"; } return "done"; },
      after: function (c) { c.dialog = false; c.savedAlert = true; } }
  ],
  doneHTML: function () {
    return '<p class="now-box">アラート「SOC_認証_失敗後の特権成功」を保存しました。</p>' +
      '<div class="soft"><p><b>設定（社内基準・架空）</b></p><ul class="sum-list plain"><li>15分ごと（cron）。リアルタイムは使わない</li><li>トリガー条件：結果が1件以上</li><li>抑制：同じ src で60分</li><li>通知先：SOCチームの共有アドレス</li><li>トリガーされたアラートに追加</li></ul></div>' +
      '<p class="refs">注意：固定CSVの inputlookup をそのまま定期実行しても、継続的な本番監視にはなりません。本番はQ5の骨格でインデックス化された認証イベントを検索します。</p>';
  },
  nextLabel: "S7へ進む（一次調査）"
};

/* ---------- S7：アラート後の一次調査を標準化する ---------- */
CH[8] = {
  role: "soc", time: "S7", timeSub: "29:00–34:00", av: "山", who: "山田（SOC担当者・架空）",
  title: "アラートの結果を、社内の一次調査手順で整理し、上位者へ引き継ぐ",
  text: "アラート「SOC_認証_失敗後の特権成功」がケースAで発火しました（架空）。山田さん（架空）は、トリガーされたアラートから結果を開き、AI Hub（P3）でA社の一次調査手順（KB04）に沿って確認済み事実・追加の確認事項・エスカレーション基準を整理します。テックタッチのチェックリストが抜け漏れを防ぎ、未確認の項目が空なら案内します。ログの検索はSplunk、検索案はAssistant、調査基準と次の行動はAI Hub、手順の抜け漏れ防止はテックタッチです。",
  tags: ["S7", "SOC担当者の視点", "仮説4　調査が属人化する", "37分版 5:00／20分版 2:30"],
  ask: "アラートの後の一次調査は、いま手順書どおりに進んでいますか。上位者への引き継ぎは、どの形で残っていますか？",
  kind: "hub", kicker: "チェックリスト＋AI Hub（構想・例文）", guide: "認証アラートの一次調査（KB04）",
  init: function () { return { step: 0, app: "activity", view: "list", hub: 0, extra: false, handed: false, vals: { ck1: "", ck2: "", ck3: "", ck4: "", ck5: "", ck6: "" } }; },
  startIds: ["g-start"],
  intro: function () {
    return guideList("おすすめのガイド", "トリガーされたアラートから結果を開き、AI Hubで整理し、チェックリストを埋めて、上位者へ引き継ぎます。",
      [["認証アラートの一次調査（KB04）", "5ステップ・目安5分", true]]);
  },
  free: function (c, ev) {
    if (ev.kind === "click" && ev.id === "ck-handoff" && ckEmpty(c)) {
      fix("【入力チェック（案）】チェックリストに空の項目があります。未確認なら「未確認」を選びます。空のまま引き継げません（社内ルール・架空）。");
      return true;
    }
    return false;
  },
  steps: [
    { label: "トリガーされたアラートを開く", target: "#act-row-a", tip: "① アクティビティ ＞ トリガーされたアラート", sub: "「結果を表示」でケースAの1行を開きます",
      now: "トリガーされたアラートの一覧から、「SOC_認証_失敗後の特権成功」の「結果を表示」を開きます。",
      hub: "一覧に出るのは、S6で「トリガーされたアラートに追加」を付けたからです。通知メールから開く導線も、実機で確かめます。",
      handle: clickIs("act-row-a"), after: function (c) { c.view = "result"; } },
    { label: "AI Hubで一次調査の整理をする", target: "#hub-p3", tip: "② 「一次調査の整理」を開きます", sub: "KB04の手順に沿って、事実と未確認を分ける（P3）",
      now: "「一次調査の整理」を押します。AI Hubが、確認済み事実・追加の確認・判断の進め方・追加SPLの依頼に分けます。",
      hub: "担当者の入力（P3）：「ケースA：同一IPから9アカウントに36件の失敗があり、その後 admin_ops で成功。KB04の認証手順に従って、確認済み事実・追加の確認事項・エスカレーション基準を整理してください。侵害の成立は推定しないでください。」",
      handle: clickIs("hub-p3"), after: function (c) { c.hub = 3; } },
    { label: "チェックリストを埋める", target: function (c) { var e = ckEmpty(c); return e ? "#f-" + e : "#ck-list"; },
      tip: function (c) { var e = ckEmpty(c); return e ? "③ 空の項目を埋めます（確認済み／未確認）" : "③ 6項目が埋まりました"; },
      sub: "未確認の項目は「未確認」と残します。空のままにしません（入力チェック・案）",
      redo: "空の項目を埋めます",
      now: "6項目を「確認済み」か「未確認」で埋めます。「例を入れる」で、AI Hubの整理に沿った例が入ります。",
      hub: "AI Hubの整理に沿うと、①②③⑥は確認済み、④正規アクセス・⑤影響範囲は未確認です。未確認を隠さないことが引き継ぎの要点です。",
      btn: "例を入れる",
      handle: function (c, ev) {
        if (ev.kind === "click" && ev.id === "ck-fill") { for (var k in CK_FILL) c.vals[k] = CK_FILL[k]; return "done"; }
        if (ev.kind === "pick" && /^ck[1-6]$/.test(ev.id)) return ckEmpty(c) ? "ok" : "done";
        return null;
      },
      auto: function (c) { for (var k in CK_FILL) c.vals[k] = CK_FILL[k]; return "done"; } },
    { label: "追加検索をAssistantに依頼する", target: "#hub-copy-spl", tip: "④ 追加SPLの依頼文をAssistantに渡します", sub: "接続元IPと admin_ops の操作履歴を、時間範囲を限って確認",
      now: "AI Hubが作った追加検索の依頼文を、Splunk AI Assistantに渡します。",
      hub: "追加SPLの依頼文：「" + EXTRA_REQ + "」",
      handle: clickIs("hub-copy-spl"), after: function (c) { c.extra = true; } },
    { label: "上位者へ引き継ぐ", target: "#ck-handoff", tip: "⑤ 証跡と未確認事項を添えて引き継ぎます", sub: "確認済みと未確認を分けたまま渡す",
      now: "「上位者へ引き継ぐ」を押します。確認済み事実と未確認事項を分けたまま、SOC上位者へ渡します。",
      hub: "判断の進め方：調査の優先度を上げ、SOC上位者へ証跡と未確認事項を引き継ぐ。侵害の成立は推定しません。",
      handle: clickIs("ck-handoff"), after: function (c) { c.handed = true; } }
  ],
  doneHTML: function () {
    return '<p class="now-box">確認済み事実と未確認事項を分けて、上位者へ引き継ぎました。</p>' + recList([
      ["29:05", "結果を開く：198.51.100.24 / admin_ops / 09:10:00（MFA approved）"], ["29:10", "AI Hub（P3）で整理。④正規アクセス・⑤影響範囲は未確認"], ["29:20", "追加検索を依頼し、上位者へ引き継ぎ"]
    ], "時刻・記録は架空です。侵害の成立は推定しません。");
  },
  nextLabel: "S8へ進む（記録・改善）"
};

/* ---------- S8：記録・改善・エンディング ---------- */
CH[9] = {
  role: "soc", time: "S8", timeSub: "34:00–37:00", av: "山", who: "山田（SOC担当者・架空）",
  title: "記録を残し、改善をナレッジにする。Splunkを入れ替える前に、使いこなす力を高める",
  text: "山田さん（架空）は、一次調査の記録を社内のチケット管理（架空）に4項目で残します。AI Hub（P4）が、今回の変更をナレッジへ反映する候補（Q3を承認済みテンプレートに追加）を作り、改善チケットを起票します。委託先に依頼して待っていた改善が、SOC担当者の手で回り始める姿で締めます。",
  tags: ["S8", "SOC担当者の視点", "仮説5　改善が残らない", "37分版 3:00／20分版 1:00"],
  ask: "検知条件や手順を直したとき、その履歴はいまどこに残っていますか。次の担当者は、それを読めますか？",
  kind: "hub", kicker: "入力チェック＋AI Hub（構想・例文）", guide: "一次調査の記録と、改善のナレッジ化",
  init: function () { return { step: 0, app: "intra", view: "record", recorded: false, hub: 0, ticket: false, vals: { r1: "", r2: "", r3: "", r4: "" } }; },
  startIds: ["g-start"],
  intro: function () {
    return guideList("おすすめのガイド", "記録を4項目で残し、AI Hubで改善候補を作り、改善チケットを起票します。",
      [["一次調査の記録と、改善のナレッジ化", "4ステップ・目安3分", true]]);
  },
  steps: [
    { label: "記録を4項目で残す", target: function (c) { var e = recEmpty(c); return e ? "#f-" + e : "#rec-form"; },
      tip: function (c) { var e = recEmpty(c); return e ? "① 「" + REC.filter(function (r) { return r[0] === e; })[0][1] + "」を書きます" : "① 4項目が埋まりました"; },
      sub: "事象・確認済み・追加確認・対応。空のままでは保存できません（入力チェック・案）",
      redo: "空の項目を埋めます",
      now: "事象・確認済み・追加確認・対応の4項目を書きます。「例文を入れる」で、台本の記録が入ります。",
      hub: "記録の形は社内の基準（架空）です。確認済みと追加確認を分けて書くと、次の担当者が読み直せます。",
      btn: "例文を入れる",
      handle: function (c, ev) {
        if (ev.kind === "click" && ev.id === "rec-fill") { REC.forEach(function (r) { c.vals[r[0]] = r[2]; }); return "done"; }
        if (ev.kind === "pick" && /^r[1-4]$/.test(ev.id)) return recEmpty(c) ? "ok" : "done";
        if (ev.kind === "click" && ev.id === "rec-save") return { wrong: "【入力チェック（案）】空の項目があります。4項目を埋めてから保存します（社内ルール・架空）。" };
        return null;
      },
      auto: function (c) { REC.forEach(function (r) { c.vals[r[0]] = r[2]; }); return "done"; } },
    { label: "記録を保存する", target: "#rec-save", tip: "② 保存します", sub: "チケット管理（架空）に残ります",
      now: "「保存」を押します。", hub: "記録はSplunkの外（チケット管理など）に残す前提です。何を使っているかを伺います（9章 #12）。",
      handle: clickIs("rec-save"), after: function (c) { c.recorded = true; } },
    { label: "AI Hubで改善候補を作る", target: "#hub-p4", tip: "③ 「ナレッジへの反映候補」を開きます", sub: "今回の変更を、承認済みテンプレートに足す（P4）",
      now: "「ナレッジへの反映候補」を押します。AI Hubが、変更申請の案を作ります。",
      hub: "担当者の入力（P4）：「今回の一次調査と、Q3の検索を、KB03（承認済み検索）とKB05（事例）に反映する変更申請の案を作ってください。承認者と見直し日を含めてください。」",
      handle: clickIs("hub-p4"), after: function (c) { c.hub = 3; } },
    { label: "改善チケットを起票する", target: "#imp-ticket", tip: "④ 改善チケットを起票します", sub: "承認者：SOC責任者。見直し日を決める（架空）",
      now: "「改善チケットを起票」を押します。Q3を承認済みテンプレートに追加する変更を、承認に回します。",
      hub: "改善候補：失敗件数だけでなく、異なるアカウント数・同一ユーザー・前後関係を明示する検索（Q3）を承認済みテンプレートに追加。",
      handle: clickIs("imp-ticket"), after: function (c) { c.ticket = true; c.view = "improve"; } }
  ],
  doneHTML: function () {
    return '<p class="now-box">記録を残し、改善をナレッジにしました。5つの成果物がそろいました。</p>' +
      '<div class="soft"><p><b>クロージング</b></p><p>Splunkを別のSIEMに入れ替える前に、既存のSplunkを使いこなす力を高められないか。AI Assistantを残し、AI Hubで自社業務に適合させ、テックタッチで操作と調査を完了する。SOC担当者が自分で改善できる業務の範囲を増やす提案です。</p></div>' +
      '<p class="refs">画面・人物・数値はすべて架空です。</p>';
  },
  nextLabel: "振り返りへ"
};

/* ---------- 振り返り ---------- */
CH[10] = { title: "振り返り", time: "まとめ", timeSub: "37:00", text: "", tags: [], ask: "", kind: "note", kicker: "", guide: "", steps: [], init: function () { return { step: 0, vals: {} }; } };

