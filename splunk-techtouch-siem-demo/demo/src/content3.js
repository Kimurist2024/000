
  /* ---------- S6：SSEを参照し、検知へつなぐ ---------- */
  var SPL_Q5 = '（本番用の骨格。実行しない）\nindex=<認証ログのインデックス> sourcetype=<VPN認証のsourcetype> earliest=-15m\n| eval src=<接続元IPのフィールド>, user=<アカウントのフィールド>, action=<結果のフィールド>, privileged=<特権判定>\n| … Q3と同じ eventstats／sort／streamstats の判定 …';
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
      if (ev.kind === "click" && /^sse-item-other/.test(ev.id)) { S.info = "このデモでは「Detect Password Spray Attempts」を開きます。他のコンテンツ名は省略しています（架空）。"; return true; }
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
  var CK = [["ck1", "① 時刻（検知条件・対象時刻）"], ["ck2", "② 対象（アカウント・接続元）"], ["ck3", "③ MFAの結果"], ["ck4", "④ 正規アクセスか（本人確認）"], ["ck5", "⑤ 影響範囲（成功後の操作）"], ["ck6", "⑥ 根拠の記録・引き継ぎ"]];
  var CK_FILL = { ck1: "done", ck2: "done", ck3: "done", ck4: "todo", ck5: "todo", ck6: "done" };
  var EXTRA_REQ = "接続元 198.51.100.24 と、アカウント admin_ops について、2026-10-08 09:10:00 以降の操作履歴（VPNセッション、アクセス先、権限変更）を、時間順に一覧する検索を作ってください。対象のインデックスとsourcetypeは <社内の名称> です。";
  function ckEmpty(c) { for (var i = 0; i < CK.length; i++) if (!c.vals[CK[i][0]]) return CK[i][0]; return null; }
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
  var REC = [["r1", "事象", "2026年10月8日、接続元 198.51.100.24 から複数ユーザーへの認証失敗36件（9ユーザー）。対象に含まれる特権アカウント admin_ops で、その後の認証成功（09:10:00、MFA approved）を確認。"],
    ["r2", "確認済み", "件数、接続元、対象ユーザー、時刻の順序、MFAの結果。"],
    ["r3", "追加確認", "接続元の正規性、本人利用、成功後の操作。"],
    ["r4", "対応", "SOC上位者へ優先的な追加調査を依頼。"]];
  function recEmpty(c) { for (var i = 0; i < REC.length; i++) if (!(c.vals[REC[i][0]] || "").trim()) return REC[i][0]; return null; }
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

  var JOURNEY = [
    [1, "現場の問題", "S0 2:00", "lead"], [2, "Before", "S1 3:00", "soc"], [3, "要件整理", "S2 4:00", "soc"], [4, "SPL生成・確認", "S3 5:00", "soc"],
    [5, "データ検証", "S4 5:00", "soc"], [6, "可視化", "S5 6:00", "soc"], [7, "検知", "S6 4:00", "soc"], [8, "一次調査", "S7 5:00", "soc"], [9, "記録・改善", "S8 3:00", "soc"], [10, "振り返り", "まとめ", ""]
  ];
  var ROLE_LABEL = { soc: "SOC担当者", lead: "SOC責任者" };
