
  /* ==================== 画面（Splunk Web の画面イメージ・架空） ==================== */
  var RESULTS = {
    before: { cols: ["src", "failures", "admin_successes"], rows: [["A", "198.51.100.24", 36, 1], ["C", "192.0.2.51", 12, 1]], note: "Cが混ざる：成功が失敗より前でも、同じ接続元IPなら一致する" },
    q0: { cols: ["total_events", "distinct_srcs", "distinct_users"], rows: [["", 72, 4, 19]] },
    q1: { cols: ["src", "fail_count", "failed_users"], rows: CASES.map(function (k) { return [k.id, k.src, k.fails, k.users]; }) },
    q2: { cols: ["src", "fail_count", "failed_users"], rows: [["A", "198.51.100.24", 36, 9], ["C", "192.0.2.51", 12, 6]] },
    q3: { cols: ["src", "user", "event_time", "src_fail_count", "src_failed_users", "mfa"], rows: [["A", "198.51.100.24", "admin_ops", "2026-10-08 09:10:00", 36, 9, "approved"]] },
    q4: { cols: ["_time", "failures", "successes"], rows: Q4_ROWS.map(function (r) { return ["", r[0], r[1], r[2]]; }) }
  };
  var RUN_TITLE = { before: "不十分な例（教材）", q0: "Q0 データ件数の確認", q1: REPORTS[0][1], q2: REPORTS[1][1], q3: REPORTS[2][1], q4: REPORTS[3][1] };

  function resultTable(key) {
    var r = RESULTS[key];
    return '<div class="table-wrap"><table class="dtable sp-res"><thead><tr><th class="idx">#</th>' + r.cols.map(function (c) { return "<th>" + c + "</th>"; }).join("") + "</tr></thead><tbody>" +
      r.rows.map(function (row, i) {
        return "<tr" + (row[0] === "A" ? ' class="hit"' : "") + '><td class="idx">' + (i + 1) + "</td>" + row.slice(1).map(function (v, j) { return "<td" + (j === 0 ? ' id="res-row-' + (row[0] || i) + '"' : "") + ">" + esc(v) + "</td>"; }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }
  function resultsHTML(c) {
    if (!c.ran) return '<div class="empty">' + svg("search") + "<p>検索を実行すると、ここに結果が出ます。</p>" + fine("固定のテストログ（CSVルックアップ・72件・架空）に対する検索です。") + "</div>";
    var r = RESULTS[c.ran], n = r.rows.length, tab = c.tab || "stats";
    var tabs = '<div class="dt-tabs" aria-hidden="true"><button type="button">イベント</button><button type="button">パターン</button><button type="button"' + (tab === "stats" ? ' class="active"' : "") + '>統計情報 (' + n + ')</button><button type="button"' + (tab === "viz" ? ' class="active"' : "") + '>視覚エフェクト</button></div>';
    var body = tab === "viz" && c.ran === "q4" ? '<div class="surface"><div class="chart-legend"><span><i class="sw-line"></i>failures</span><span><i class="sw-ok"></i>successes</span></div><div class="chart-wrap">' + lineChart5m() + "</div></div>" : resultTable(c.ran);
    var cnt = c.ran === "q4" ? "3 行（5分単位）" : n + " 件の結果";
    return '<p class="sp-summary"><span class="ok">✓</span> ' + cnt + '　<span class="dt-fine">2026/10/08 09:00:00 〜 09:15:00（固定のテストログ・架空）</span></p>' + tabs + body +
      (r.note ? '<p class="dt-callout">' + r.note + "</p>" : "");
  }
  function saveAsMenu(c) {
    if (!c.menu) return "";
    return '<div class="sp-menu" role="menu"><button type="button" data-id="sa-report">レポート</button><button type="button" data-id="sa-panel">ダッシュボードパネル</button><button type="button" id="sa-alert" data-id="sa-alert">アラート</button><button type="button" data-id="sa-event">イベントタイプ</button></div>';
  }
  function searchBox(c) {
    var spl = c.q ? SPL[c.q] : "";
    return '<div class="title-row"><span class="dt-h">' + (c.q && RUN_TITLE[c.q] && c.q !== "before" ? esc(RUN_TITLE[c.q]) : "新規検索") + "</span>" +
      '<span class="row-actions">' + (c.chip ? '<button type="button" class="tt-chip" id="chip-soc" data-id="chip-soc">' + svg("spark") + "SOC分析アシスト（テックタッチ）</button>" : "") +
      '<span class="tip-anchor"><button type="button" class="dt-emph" id="sp-saveas" data-id="sp-saveas">名前を付けて保存 ▾</button>' + saveAsMenu(c) + "</span></span></div>" +
      '<div class="sp-bar"><pre class="spl-box' + (spl ? "" : " ph") + '">' + (spl ? esc(spl) : "検索文字列を入力…") + '</pre><span class="sp-time">全時間 ▾</span>' +
      '<button type="button" class="sp-go" id="sp-run" data-id="sp-run" aria-label="検索を実行">' + svg("search") + "</button></div>";
  }
  function bubbleU(t) { return '<div class="bubble">' + esc(t) + "</div>"; }
  function answerA(spl, bullets, btnId, btnLabel) {
    return '<div class="as-ans"><p class="ai-label">Splunk AI Assistant（参考画面・架空の表示）</p>' + code(spl) + '<ul>' + bullets.map(function (b) { return "<li>" + b + "</li>"; }).join("") + "</ul>" +
      '<div class="row-actions"><button type="button" class="dt-accent" id="' + btnId + '" data-id="' + btnId + '">検索に入れる</button><button type="button" class="dt-emph">コピー</button></div></div>';
  }
  function assistHTML(c) {
    var st = c.stage || 0, h = '<aside class="assist" aria-label="Splunk AI Assistant（画面イメージ・架空）"><div class="assist-head">' + svg("spark") + "Splunk AI Assistant</div>" +
      fine("画面イメージ（架空）。有償のSplunk Cloudの機能で、トライアル環境では使えません。回答はデモ用に準備した参考画面です。");
    if (st >= 2) h += bubbleU(REQUEST_OUT) + answerA(SPL.ai1, ["src ごとに失敗数、失敗した異なる user 数、特権アカウントの成功数を集計し、閾値で絞ります。", "（この案には、同一ユーザーの判定・前後関係・15分の時間範囲が入っていません。AI Hubで照合します）"], "as-insert", "検索に入れる");
    if (st >= 2 && c.hub < 3) h += '<button type="button" class="hub-chip" id="hub-check" data-id="hub-check">' + svg("shield") + "SOC基準との照合（AI Hub）</button>";
    if (st >= 4) h += bubbleU(FIX_REQUEST) + answerA(SPL.q3, ["eventstats で src ごとの失敗数と異なる失敗 user 数を付け、sort と streamstats で同じ src・user の「それ以前の失敗」を数えます。", "特権アカウントの成功で、それ以前の失敗が1件以上、かつ src の閾値を満たす行だけを残します。"], "as-insert2", "検索に入れる");
    if (c.extra) h += bubbleU(EXTRA_REQ) + '<p class="ai-label">（回答の表示は省略。実機では追加検索の案が返ります・架空）</p>';
    var ta = st === 1 ? REQUEST_OUT : st === 3 ? FIX_REQUEST : "";
    if (!c.extra) h += '<div class="as-in" id="as-input"><textarea readonly rows="4" placeholder="質問や依頼を入力…" aria-label="Assistantへの入力">' + esc(ta) + "</textarea>" +
      '<div class="row-actions">' + (st === 0 ? '<button type="button" class="dt-emph" id="as-paste" data-id="as-paste">' + svg("copy") + "貼り付け（S2の依頼文）</button>" : "") +
      '<button type="button" class="dt-accent" id="as-send" data-id="as-send"' + (st === 1 || st === 3 ? "" : " disabled") + ">送信</button></div></div>";
    return h + "</aside>";
  }
  function hubWin(c) {
    if (!c.hub) return "";
    var h = '<section class="hub-win" aria-label="AI Hub（構想・架空画面）"><div class="hub-head"><span class="ov-pill hubpill">AI Hub</span><b>SOC分析アシスト</b><span class="dt-fine">テックタッチのAI Hubの画面イメージ（構想・架空）。回答は本番前に確かめた例文</span></div>' +
      '<p class="kb-row">参照ナレッジ：<span class="kb">KB01 ログ辞書</span><span class="kb">KB02 検知基準</span><span class="kb">KB03 承認済み検索</span><span class="dt-fine">（プロンプトP1）</span></p>' +
      '<div class="tip-anchor block" id="hub-in-wrap"><textarea data-id="hub-in" id="hub-in" rows="3" placeholder="やりたいことを日本語で書いてください" aria-label="AI Hubへの依頼">' + esc(c.vals["hub-in"] || "") + "</textarea></div>" +
      '<div class="row-actions"><button type="button" class="dt-emph" id="hub-fill" data-id="hub-fill">例文を入れる</button><button type="button" class="dt-accent hub-btn" id="hub-send" data-id="hub-send"' + (c.vals["hub-in"] ? "" : " disabled") + ">整理する</button></div>";
    if (c.hub >= 3) {
      h += '<div class="hub-ans"><p class="lab">AI Hubの整理（例文）</p><dl class="kv"><dt>対象</dt><dd>VPN認証イベント。フィールドは event_time、src、user、action、privileged（KB01）</dd>' +
        "<dt>条件</dt><dd>15分間に同一IPから認証失敗10件以上、異なる失敗アカウント5以上（KB02 D-01）</dd>" +
        "<dt>追加条件</dt><dd>同じIP・同じ管理者アカウントで、そのアカウントの失敗より後に成功がある</dd>" +
        "<dt>確認</dt><dd>時刻、重複、例外条件、MFAの証跡</dd>" +
        "<dt>分析の分け方</dt><dd>「IP別ランキング」「15分の閾値候補」「管理者の失敗後の成功」「時間推移」（KB03 Q1〜Q4）</dd></dl>" +
        '<p class="lab">Splunk AI Assistant向けの依頼文</p><div class="tip-anchor block" id="hub-req"><pre class="code req">' + esc(REQUEST_OUT) + "</pre></div>" +
        '<div class="row-actions"><button type="button" class="dt-accent hub-btn" id="hub-copy" data-id="hub-copy"' + (c.copied ? " disabled" : "") + ">" + svg("copy") + (c.copied ? "コピーしました" : "依頼文をコピー") + "</button></div></div>";
    }
    return h + "</section>";
  }
  function hubCheckCard(c) {
    if (c.hub < 3) return "";
    return '<section class="hub-win" aria-label="AI Hub：SOC基準との照合（構想・架空画面）"><div class="hub-head"><span class="ov-pill hubpill">AI Hub</span><b>SOC基準との照合（P2）</b><span class="dt-fine">構文ではなく、SOCの業務条件で評価（例文）</span></div>' +
      '<div class="table-wrap"><table class="dtable hub-tbl"><thead><tr><th>確認事項</th><th>チェック内容</th><th>判定</th><th>次の行動</th></tr></thead><tbody>' +
      CHECK_ROWS.map(function (r) { return "<tr><td><b>" + r[0] + "</b></td><td>" + r[1] + '</td><td>' + (r[3] === true ? '<span class="st on">入っている</span>' : r[3] === false ? '<span class="st ng">不足</span>' : '<span class="st">S4で確認</span>') + "</td><td>" + r[2] + "</td></tr>"; }).join("") + "</tbody></table></div>" +
      '<p class="lab">Assistantへの修正依頼文</p><pre class="code req">' + esc(FIX_REQUEST) + "</pre>" +
      '<div class="row-actions"><button type="button" class="dt-accent hub-btn" id="hub-copy-fix" data-id="hub-copy-fix"' + (c.fixPasted ? " disabled" : "") + ">" + svg("copy") + (c.fixPasted ? "Assistantに貼りました" : "修正依頼文をコピーしてAssistantに貼る") + "</button></div>" +
      '<p class="dt-fine">AI Hubは検索結果の真偽を断定しません。最終検証はS4でテストケースA/B/C/Dと突き合わせます。</p></section>';
  }
  function pageSearch(c) {
    var main = '<div class="sp-search">' + searchBox(c) + resultsHTML(c) + "</div>";
    var h = S.ch === 3 ? hubWin(c) : "";
    if (c.assist) return h + '<div class="sp-split">' + main + assistHTML(c) + "</div>" + (S.ch === 4 ? hubCheckCard(c) : "");
    return h + main;
  }
  function pageReports() {
    return '<div class="title-row"><span class="dt-h">レポート</span><span class="dt-fine">保存済みレポート（架空）。Q1〜Q4はSOCの承認済み検索（KB03）</span></div>' +
      '<div class="table-wrap"><table class="dtable"><thead><tr><th>タイトル</th><th>説明</th><th>所有者</th><th>アプリ</th><th>共有</th><th>版</th></tr></thead><tbody>' +
      REPORTS.map(function (r) { return '<tr><td><button type="button" class="row-link" id="rep-' + r[0] + '" data-id="rep-' + r[0] + '">' + r[1] + "</button></td><td>" + r[2] + "</td><td>山田</td><td>search</td><td>アプリ</td><td>" + r[3] + "</td></tr>"; }).join("") +
      '<tr><td><span class="dt-fine">VPN認証_失敗数_委託先（表示省略）</span></td><td class="dt-fine">委託先作成の集計</td><td>委託先</td><td>search</td><td>アプリ</td><td>—</td></tr></tbody></table></div>';
  }

  /* ---------- ダッシュボード（一覧・旧・Dashboard Studio） ---------- */
  function pageDashboards(c) {
    if (c.view === "old") {
      return '<p class="crumbs">ダッシュボード ＞ VPN認証_失敗数（委託先作成）</p><div class="title-row"><span class="dt-h">VPN認証_失敗数（委託先作成・架空）</span><span class="dt-fine">過去15分　最終更新 09:15</span></div>' +
        '<div class="canvas"><div class="panel" id="d-old-panel"><p class="panel-title">認証失敗数（件）</p><p class="single bad">70</p><p class="dt-fine">接続元IP別・異なるアカウント数・失敗と成功の順序は表示していない</p></div>' +
        '<div class="panel"><p class="panel-title">認証失敗数の推移（5分）</p><div class="chart-wrap">' + lineChart5m() + "</div></div></div>";
    }
    if (c.view === "edit") return studio(c);
    var rows = [['<button type="button" class="row-link" data-id="dash-old">VPN認証_失敗数（委託先作成）</button>', "委託先", "アプリ", "2026-09-30"]];
    if (c.saved) rows.unshift(["<b>" + esc(c.vals["db-name"]) + "</b>", "山田", "アプリ（SOCチーム）", "2026-10-08"]);
    return '<div class="title-row"><span class="dt-h">ダッシュボード</span><button type="button" class="dt-accent" id="db-new" data-id="db-new">新規ダッシュボードを作成</button></div>' +
      '<div class="table-wrap"><table class="dtable"><thead><tr><th>タイトル</th><th>所有者</th><th>共有</th><th>更新</th></tr></thead><tbody>' +
      rows.map(function (r) { return "<tr>" + r.map(function (v) { return "<td>" + v + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
  }
  function panelHTML_db(p) {
    var idx = Q_ORDER.indexOf(p.ds), title = REPORTS[idx][1];
    var body = p.viz === "bar" ? '<div class="chart-wrap">' + barChartSrc(CASES) + "</div>" : p.viz === "line" ? '<div class="chart-wrap">' + lineChart5m() + "</div>" : resultTable(p.ds);
    return '<div class="panel' + (p.viz === "line" || p.viz === "bar" ? " wide" : "") + '"><p class="panel-title">' + esc(title) + '　<span class="dt-fine">' + VIZ_LABEL[p.viz] + "・データソース：保存済みレポート</span></p>" + body + "</div>";
  }
  function studio(c) {
    var dsOpts = [["", "選択…"]].concat(REPORTS.map(function (r) { return [r[0], r[1]]; }));
    var vizOpts = [["", "選択…"], ["bar", "棒グラフ"], ["table", "表"], ["line", "折れ線グラフ"], ["single", "単一値"]];
    return '<p class="crumbs">ダッシュボード ＞ ' + esc(c.vals["db-name"]) + '　<span class="dt-fine">Dashboard Studio（画面イメージ・架空）</span></p>' +
      '<div class="title-row"><span class="dt-h">' + esc(c.vals["db-name"]) + '</span><span class="row-actions">' +
      '<span class="dt-field tip-anchor" id="f-db-share"><label for="db-share">共有</label>' + sel("db-share", "db-share", [["", "選択…"], ["me", "自分だけ（非公開）"], ["team", "SOCチーム（アプリ）"], ["all", "すべてのアプリ"]], c.vals["db-share"]) + "</span>" +
      '<button type="button" class="dt-accent" id="db-save" data-id="db-save"' + (c.saved ? " disabled" : "") + ">" + (c.saved ? "保存済み" : "保存") + "</button></span></div>" +
      '<div class="studio"><div class="canvas">' +
      '<div class="panel"><p class="panel-title">認証失敗（過去15分）　<span class="dt-fine">単一値・Q0</span></p><p class="single bad">70</p></div>' +
      '<div class="panel"><p class="panel-title">接続元IP（過去15分）　<span class="dt-fine">単一値・Q0</span></p><p class="single">4</p></div>' +
      c.panels.map(panelHTML_db).join("") +
      (c.panels.length ? "" : '<div class="panel wide empty-panel">右の「可視化を追加」で、Q1〜Q4のパネルを置きます。</div>') + "</div>" +
      '<div class="add-form"><p class="section-label">可視化を追加</p>' +
      '<span class="dt-field block tip-anchor" id="f-ds"><label for="ds">データソース（保存済みレポート）</label>' + sel("ds", "ds", dsOpts, c.vals["ds"]) + "</span>" +
      '<span class="dt-field block tip-anchor" id="f-viz"><label for="viz">可視化</label>' + sel("viz", "viz", vizOpts, c.vals["viz"]) + "</span>" +
      '<button type="button" class="dt-accent" id="db-add" data-id="db-add">追加</button>' +
      fine("検索期間：過去15分（デモは固定ログ）。保存済みレポートをデータソースにする操作（ds.savedSearch）は実機で確かめます。") + "</div></div>";
  }
  function dbNewDialog(c) {
    return '<div class="tt-modal sp-modal" role="dialog" aria-labelledby="dlg-title"><div class="tt-modal-card sp-dialog-card">' +
      '<p class="dlg-head" id="dlg-title">新規ダッシュボードを作成</p>' +
      '<div class="dlg-row"><span class="k">ダッシュボードのタイトル</span><span class="dt-field tip-anchor" id="f-db-name">' + txt("db-name", "db-name", c.vals["db-name"], "チーム_対象_用途") + "</span></div>" +
      '<div class="dlg-row"><span class="k">説明</span><span class="locked">SOC認証監視（Q1〜Q4）</span></div>' +
      '<div class="dlg-row"><span class="k">権限</span><span class="locked">非公開（作成後に共有範囲を設定）</span></div>' +
      '<div class="dlg-row"><span class="k">作成方法</span><span class="locked">● Dashboard Studio　○ Classic Dashboards</span></div>' +
      '<div class="actions"><button type="button" class="btn btn-ghost" data-id="db-cancel">キャンセル</button><button type="button" class="btn btn-primary sp-btn" id="db-create" data-id="db-create">作成</button></div></div></div>';
  }
  CH[6].modal = function (c) { return c.view === "new" ? dbNewDialog(c) : ""; };

  /* ---------- SSE（Security Essentials）とアラートの保存画面 ---------- */
  function pageSSE(c) {
    if (c.view === "list") {
      return '<div class="title-row"><span class="dt-h">Security Content</span><span class="dt-fine">Splunk Security Essentials（画面イメージ・架空）。検索：認証</span></div>' +
        '<div class="sse-list">' +
        '<button type="button" class="sse-row" id="sse-item-ps" data-id="sse-item-ps"><b>Detect Password Spray Attempts</b><span>多数のアカウントに対する認証の試行を検知するコンテンツ（要約・架空）</span></button>' +
        '<button type="button" class="sse-row dim" data-id="sse-item-other1"><b>（他のコンテンツ名は省略・架空）</b><span>認証関連</span></button>' +
        '<button type="button" class="sse-row dim" data-id="sse-item-other2"><b>（他のコンテンツ名は省略・架空）</b><span>認証関連</span></button></div>' +
        fine("SSEはSplunk Cloud Platformで使える無料のアプリで、ESの専用機能ではありません。項目名と日本語表示は実機で確かめます（9章 #10）。");
    }
    return '<p class="crumbs">Security Content ＞ Detect Password Spray Attempts</p><div class="title-row"><span class="dt-h">Detect Password Spray Attempts</span><span class="row-actions"><span class="dt-emph">Open in Search</span><span class="dt-emph">Schedule Saved Search</span></span></div>' +
      '<div class="sse-sec"><p class="dt-h3">Description（要約・架空）</p><p>同じ接続元から多数のアカウントに対して、少数のパスワードで認証を試みる行動を検知します。</p></div>' +
      '<div class="sse-sec"><p class="dt-h3">Data Sources（必要なログ）</p><p>認証ログ（VPN、IdP など）。A社では VPN 認証イベントを使います。</p></div>' +
      '<div class="sse-sec tip-anchor block" id="sse-kfp"><button type="button" class="sec-btn" data-id="sse-kfp"><p class="dt-h3">Known False Positives（誤検知になりやすい条件）</p><p>パスワードを忘れた利用者の再試行、共有端末からの多数の利用者の認証、自動化された正規の処理など（要約・架空）。</p>' +
      '<p class="dt-h3">How to Respond（対応のしかた）</p><p>接続元の正規性、対象アカウントの本人確認、成功後の操作の確認（要約・架空）。</p></button></div>' +
      '<div class="tt-note"><span class="lab">テックタッチ（案）</span>' + tipWrap("tw-std", "A社の検知基準 D-01（KB02）", "std", "A社の検知基準を表示") + "</div>" +
      '<div class="tt-note" id="sse-q5"><span class="lab">テックタッチ（案）：本番用の検索の骨格（Q5）</span><p>固定CSVの inputlookup をそのまま定期実行しても、継続的な本番監視にはなりません。本番用はインデックス化された認証イベントを検索します。</p>' + code(SPL_Q5) + "</div>";
  }
  function alertDialog(c) {
    var v = c.vals;
    return '<div class="tt-modal sp-modal" role="dialog" aria-labelledby="al-title"><div class="tt-modal-card sp-dialog-card">' +
      '<p class="dlg-head" id="al-title">名前を付けて保存 ＞ アラート</p>' +
      '<div class="dlg-row"><span class="k">タイトル</span><span class="dt-field tip-anchor" id="f-al-name">' + txt("al-name", "al-name", v["al-name"], "SOC_対象_用途") + "</span></div>" +
      '<div class="dlg-row"><span class="k">説明</span><span class="locked">同一管理者で、失敗の後に成功（Q3）</span></div>' +
      '<div class="dlg-row"><span class="k">権限</span><span class="locked">○ 非公開　● アプリで共有</span></div>' +
      '<div class="dlg-row"><span class="k">アラートタイプ</span><span class="dt-field tip-anchor" id="f-al-sched">' + sel("al-sched", "al-sched", [["", "選択…"], ["15m", "スケジュール：15分ごと（cron）"], ["1h", "スケジュール：1時間ごと"], ["rt", "リアルタイム"]], v["al-sched"]) + "</span></div>" +
      '<div class="dlg-row"><span class="k">時間範囲</span><span class="locked">過去15分（Splunk Cloudのスケジュール時刻はUTC）</span></div>' +
      '<div class="dlg-row"><span class="k">トリガー条件</span><span class="locked">結果の数 が 0 より大きい　／　トリガー：1回</span></div>' +
      '<div class="dlg-row"><span class="k">抑制</span><span class="dt-field tip-anchor" id="f-al-throttle">' + sel("al-throttle", "al-throttle", [["", "選択…"], ["none", "抑制しない"], ["60src", "同じ src で60分"]], v["al-throttle"]) + "</span></div>" +
      '<div class="dlg-row"><span class="k">通知先（メール）</span><span class="dt-field tip-anchor" id="f-al-to">' + sel("al-to", "al-to", [["", "選択…"], ["me", "自分のメール"], ["soc", "SOCチーム（共有アドレス）"]], v["al-to"]) + "</span></div>" +
      '<div class="dlg-row"><span class="k">トリガーされたアラートに追加</span><span class="dt-field tip-anchor" id="f-al-add">' + sel("al-add", "al-add", [["", "選択…"], ["yes", "追加する（重要度：中）"], ["no", "追加しない"]], v["al-add"]) + "</span></div>" +
      '<div class="actions"><button type="button" class="btn btn-ghost" data-id="al-cancel">キャンセル</button><button type="button" class="btn btn-primary sp-btn" id="al-save" data-id="al-save">保存</button></div></div></div>';
  }
  CH[7].modal = function (c) { return c.dialog ? alertDialog(c) : ""; };

  /* ---------- アクティビティ：トリガーされたアラート（S7） ---------- */
  function hubP3(c) {
    if (c.hub < 3) return "";
    return '<section class="hub-win" aria-label="AI Hub：一次調査の整理（構想・架空画面）"><div class="hub-head"><span class="ov-pill hubpill">AI Hub</span><b>一次調査の整理（P3・KB04）</b><span class="dt-fine">例文。侵害の成立は推定しない</span></div>' +
      '<dl class="kv"><dt>確認済み事実</dt><dd>接続元 198.51.100.24、失敗36件、9アカウント、admin_ops の成功 09:10:00、同一管理者で失敗→成功の時系列、MFA approved</dd>' +
      "<dt>追加の確認</dt><dd>接続元の正規性、VPN／MFAの情報、本人確認、ログイン後の重要操作、端末の関連証跡</dd>" +
      "<dt>判断の進め方</dt><dd>調査の優先度を上げ、SOC上位者へ証跡と未確認事項を引き継ぐ</dd>" +
      "<dt>追加SPLの依頼</dt><dd>接続元IPと admin_ops の操作履歴を、特定の時間範囲で確認する依頼文をAssistantに渡す</dd></dl>" +
      '<div class="row-actions"><button type="button" class="dt-accent hub-btn" id="hub-copy-spl" data-id="hub-copy-spl"' + (c.extra ? " disabled" : "") + ">" + svg("copy") + (c.extra ? "Assistantに渡しました" : "追加検索の依頼文をAssistantに渡す") + "</button></div></section>";
  }
  function checklist(c) {
    var opts = [["", "選択…"], ["done", "確認済み"], ["todo", "未確認"]];
    return '<div class="tt-note" id="ck-list"><span class="lab">テックタッチ 調査のチェックリスト（案）</span><div class="ck-grid">' +
      CK.map(function (k) { return '<div class="ck-row"><span>' + k[1] + '</span><span class="dt-field tip-anchor" id="f-' + k[0] + '">' + sel(k[0], k[0], opts, c.vals[k[0]]) + "</span></div>"; }).join("") + "</div>" +
      '<div class="row-actions"><button type="button" class="dt-emph" id="ck-fill" data-id="ck-fill">例を入れる</button><button type="button" class="dt-accent" id="ck-handoff" data-id="ck-handoff"' + (c.handed ? " disabled" : "") + ">" + (c.handed ? "引き継ぎ済み" : "上位者へ引き継ぐ") + "</button></div></div>";
  }
  function pageActivity(c) {
    if (c.view === "list") {
      return '<p class="crumbs">アクティビティ ＞ トリガーされたアラート</p><div class="title-row"><span class="dt-h">トリガーされたアラート</span><span class="dt-fine">既定で24時間で消えます（架空の一覧）</span></div>' +
        '<div class="table-wrap"><table class="dtable"><thead><tr><th>時刻</th><th>発火元</th><th>アプリ</th><th>タイプ</th><th>重要度</th><th>モード</th><th>操作</th></tr></thead><tbody>' +
        '<tr><td>2026-10-08 09:15:00</td><td>SOC_認証_失敗後の特権成功</td><td>search</td><td>保存済み検索</td><td>中</td><td>1回</td><td><button type="button" class="row-link" id="act-row-a" data-id="act-row-a">結果を表示</button></td></tr></tbody></table></div>';
    }
    var done = c.handed ? '<p class="done-msg">上位者へ引き継ぎました（確認済み事実と未確認事項を分けたまま）。記録はS8で残します。</p>' : "";
    var main = '<p class="crumbs">アクティビティ ＞ トリガーされたアラート ＞ SOC_認証_失敗後の特権成功</p><div class="title-row"><span class="dt-h">SOC_認証_失敗後の特権成功　<span class="status active">1 件</span></span>' +
      (c.hub < 3 ? '<button type="button" class="hub-chip" id="hub-p3" data-id="hub-p3">' + svg("shield") + "一次調査の整理（AI Hub）</button>" : "") + "</div>" + resultTable("q3") + hubP3(c) + checklist(c) + done;
    return c.extra ? '<div class="sp-split"><div class="sp-search">' + main + "</div>" + assistHTML(c) + "</div>" : main;
  }

  /* ---------- 社内ポータル（架空）：S0・S1・S8 ---------- */
  function intraChat(who, av, text) {
    return '<div class="chat"><span class="av">' + av + '</span><div><p class="who"><b>' + who + '</b>社内チャット（架空）</p><p class="say">' + text + '</p></div><span class="src">09:00</span></div>';
  }
  function pageIntra(c) {
    var v = c.view;
    if (v === "card") {
      return '<div class="i-card" id="i-card" data-id="i-card"><p class="lab">業務依頼カード　SOC-1040（架空）</p><p><b>依頼者：</b>SOC責任者 中村（架空）　<b>期限：</b>今月中</p>' +
        '<blockquote class="i-quote">認証失敗が複数アカウントに広がった後、管理者ログインが成功するケースを見たい。ダッシュボードを作り、検知した後の一次調査まで標準化してください。</blockquote>' +
        '<p class="dt-fine">現状：Splunk CloudでVPNログを監視。委託先が作った検知はあるが、社内で直せない。</p></div>' +
        '<div class="row-actions"><button type="button" class="dt-emph" id="i-flow" data-id="i-flow">従来の流れを見る</button><button type="button" class="dt-emph" data-id="i-goal">ゴールを見る</button></div>';
    }
    if (v === "flow") {
      return '<div class="i-card"><p class="lab">従来の流れ（架空）</p><div class="i-chain" id="i-flow-chain"><span class="n">SOC担当者が依頼票を書く</span><span class="a">→</span><span class="n">委託先が見積</span><span class="a">→</span><span class="n wait">待ち</span><span class="a">→</span><span class="n">委託先が改修</span><span class="a">→</span><span class="n wait">待ち</span><span class="a">→</span><span class="n">担当者が確認</span></div>' +
        '<p class="dt-fine">待ち時間は社内で把握していません。SPLの修正もダッシュボードの変更も、この流れです。</p></div>' +
        '<div class="row-actions"><button type="button" class="dt-emph" id="i-goal" data-id="i-goal">ゴールを見る</button></div>';
    }
    if (v === "goal") {
      return '<div class="i-card"><p class="lab">デモ終了時に画面に残す成果物</p><ol class="i-goals" id="i-goal-list">' + GOALS.map(function (g) { return "<li>" + g.slice(1) + "</li>"; }).join("") + "</ol>" +
        '<p class="dt-fine">Splunkの機能を増やすのではなく、既にあるログを、SOC担当者自身が分析・監視・調査・改善に使えるようにします。</p></div>';
    }
    if (v === "request") {
      return '<div class="tip-anchor block" id="i-req" data-id="i-req">' + intraChat("中村（SOC責任者・架空）", "中", "認証失敗が複数アカウントに広がった後、管理者ログインが成功するケースを見たい。ダッシュボードを作り、検知した後の一次調査まで標準化してください。") + "</div>" +
        '<div class="row-actions"><button type="button" class="dt-accent" id="i-open-splunk" data-id="i-open-splunk">既存のダッシュボードを開く（Splunk）</button></div>';
    }
    if (v === "ticket") {
      return '<div class="i-card" id="i-ticket"><p class="lab">改修依頼チケット　SOC-1042（架空）</p><p><b>宛先：</b>委託先　<b>状態：</b><span class="status active">委託先の回答待ち</span></p>' +
        "<p><b>依頼内容：</b>同一IPから複数ユーザーに認証失敗した後、対象の管理者本人がログインに成功したケースを抽出する検索と、ダッシュボードの変更。</p>" +
        '<p class="dt-fine">作成 2026-10-08　回答予定：未定。この間、SOCの監視は変わりません。</p></div>';
    }
    if (v === "improve") {
      return '<div class="i-card"><p class="lab">改善チケット　SOC-1043（架空）</p><p><b>件名：</b>承認済み検索テンプレートにQ3（失敗後の特権成功）を追加　<b>承認者：</b>SOC責任者　<b>見直し日：</b>2026-11-08</p>' +
        "<p>内容：失敗件数だけでなく、異なるアカウント数・同一ユーザー・前後関係を明示する検索（Q3）を承認済みテンプレート（KB03）に追加。事例C-2026-10（ケースA）をKB05に登録。</p></div>" +
        '<div class="i-card"><p class="lab">今日の成果物</p><ol class="i-goals">' + GOALS.map(function (g) { return "<li>" + g.slice(1) + "</li>"; }).join("") + "</ol></div>";
    }
    // record（S8）
    var form = '<div class="i-card" id="rec-form"><p class="lab">一次調査の記録　SOC-1042-R（チケット管理・架空）</p>' +
      REC.map(function (r) { return '<div class="dlg-row"><span class="k">' + r[1] + '</span><span class="dt-field tip-anchor" id="f-' + r[0] + '">' + txt(r[0], r[0], c.vals[r[0]], r[1] + "を書く", c.recorded) + "</span></div>"; }).join("") +
      '<div class="row-actions"><button type="button" class="dt-emph" id="rec-fill" data-id="rec-fill"' + (c.recorded ? " disabled" : "") + '>例文を入れる</button><button type="button" class="dt-accent" id="rec-save" data-id="rec-save"' + (c.recorded ? " disabled" : "") + ">" + (c.recorded ? "保存済み" : "保存") + "</button></div></div>";
    var hub = c.recorded && c.hub < 3 ? '<button type="button" class="hub-chip" id="hub-p4" data-id="hub-p4">' + svg("shield") + "ナレッジへの反映候補（AI Hub）</button>" : "";
    var card = c.hub >= 3 ? '<section class="hub-win" aria-label="AI Hub：ナレッジへの反映候補（構想・架空画面）"><div class="hub-head"><span class="ov-pill hubpill">AI Hub</span><b>ナレッジへの反映候補（P4）</b><span class="dt-fine">例文</span></div>' +
      '<dl class="kv"><dt>変更申請</dt><dd>KB03 承認済み検索に「Q3 失敗後の特権成功」を v1.1 として追加（現在：承認待ち）</dd><dt>事例</dt><dd>KB05 にケースA（2026-10-08）を登録。確認済み・未確認を分けて記載</dd><dt>承認者</dt><dd>SOC責任者　見直し日：2026-11-08</dd></dl>' +
      '<div class="row-actions"><button type="button" class="dt-accent hub-btn" id="imp-ticket" data-id="imp-ticket">改善チケットを起票</button></div></section>' : "";
    return form + hub + card;
  }

  /* ---------- 枠（上部バー・アプリバー） ---------- */
  var APP_NAME = { search: "Search & Reporting", reports: "Search & Reporting", dashboards: "Search & Reporting", activity: "Search & Reporting", sse: "Security Essentials" };
  function spTop(c) {
    var d = D();
    if (c.app === "intra") return '<div class="sp-top intra"><span class="logo">A社 社内ポータル（架空）</span><span class="menus"><span>チケット</span><span>チャット</span><span>ナレッジ</span><span class="user">' + d.who + " ▾</span></span></div>";
    return '<div class="sp-top"><span class="logo">Splunk Cloud Platform（画面イメージ・架空）</span><span class="menus"><span>メッセージ ▾</span><span>設定 ▾</span><span>アクティビティ ▾</span><span>ヘルプ ▾</span><span class="user">' + d.who + " ▾</span></span></div>";
  }
  function appBar(c) {
    if (c.app === "intra") return "";
    var nav;
    if (c.app === "sse") nav = [["", "ホーム"], ["", "Security Content", true]];
    else nav = [["nav-search", "検索", c.app === "search"], ["", "分析"], ["", "データセット"], ["nav-reports", "レポート", c.app === "reports"], ["", "アラート"], ["nav-dashboards", "ダッシュボード", c.app === "dashboards"]];
    return '<div class="appheader"><div class="ah-left"><span class="app-name">' + APP_NAME[c.app] + '</span><div class="ah-nav">' + nav.map(function (n) {
      return n[0] ? '<button type="button" data-id="' + n[0] + '"' + (n[2] ? ' class="active"' : "") + ">" + n[1] + "</button>" : "<span" + (n[2] ? ' class="active"' : "") + ">" + n[1] + "</span>";
    }).join("") + "</div></div></div>";
  }
  function pageHTML(c) {
    switch (c.app) {
      case "intra": return pageIntra(c);
      case "search": return pageSearch(c);
      case "reports": return pageReports(c);
      case "dashboards": return pageDashboards(c);
      case "sse": return pageSSE(c);
      case "activity": return pageActivity(c);
    }
    return "";
  }
  function winTitle(c) {
    return c.app === "intra" ? "社内ポータル（架空）　チケット管理・チャットのイメージ" : "Splunk Cloud Platform の画面イメージを踏襲（架空）";
  }
