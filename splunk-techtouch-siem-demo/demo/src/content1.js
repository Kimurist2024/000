
  /* ==================== 場面の定義（S0〜S8＋振り返り） ==================== */
  var SUMMARY = 10;
  var CH = {};
  var NAV = '.ah-nav [data-id="nav-';
  var GOALS = ["①認証分析用SPL（Q1〜Q4）", "②監視ダッシュボード", "③検知条件と保存検索（設計）", "④一次調査の根拠と記録", "⑤変更・改善ナレッジ"];
  var REQ_WORDS = ["15分", "10件以上", "異なる失敗user", "同じsrc・同じ管理者user", "失敗の後で成功"];

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
