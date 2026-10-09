
  /* ---------- S3：Assistantを使い、AI Hubが業務適合を確かめる ---------- */
  var CHECK_ROWS = [
    ["ログ辞書", "src、user、action、privileged を使っているか", "実際の列名を確認", true],
    ["ユーザー数", "失敗10件だけでなく、異なる5アカウント以上か", "dc(user) に相当する条件を確認", true],
    ["同一ユーザー", "管理者の失敗と成功が同一アカウントか", "src、user 単位の判定を確認", false],
    ["前後関係", "管理者の成功が失敗より後か", "時刻順の判定（streamstats など）を確認", false],
    ["最終検証", "ケースA/B/C/Dの期待結果を満たすか", "Splunkの実行結果と突き合わせる（S4）", null]
  ];
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
  var Q_ORDER = ["q1", "q2", "q3", "q4"];
  var Q_LABEL = { q1: "Q1 IP別の失敗ランキング", q2: "Q2 閾値候補", q3: "Q3 失敗後の特権成功", q4: "Q4 5分推移" };
  var Q_EXPECT = { q1: "A=36件/9人、B=18件/1人、C=12件/6人、D=4件/3人", q2: "AとCが残る（15分・10件以上・異なる5ユーザー以上）", q3: "Aだけが残る（同一管理者・失敗後の成功）", q4: "09:00 失敗25・成功1／09:05 失敗42・成功0／09:10 失敗3・成功1" };
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
      target: function (c) { var p = ph(c); return p === "nav" ? NAV + 'reports"]' : p === "open" ? "#rep-" + key : "#sp-run"; },
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
  var VIZ_LABEL = { bar: "棒グラフ", table: "表", line: "折れ線グラフ", single: "単一値" };
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
