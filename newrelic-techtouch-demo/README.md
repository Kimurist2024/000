# New Relic×テックタッチ 構想デモ

`dynatrace-techtouch-demo` と**同じシナリオ**（ある運用担当者（架空）の一日：デモ①②③を1本の業務の流れにつないだもの）を、監視画面だけ**New Relicの画面イメージ**に置き換えた、その場で操作できるHTMLデモです。

- 流れ：問い合わせを受ける → 担当サービスの状況を確認（デモ①）→ 障害の一次確認と連絡（デモ②）→ 再発に備えてダッシュボードを作る（デモ③）→ 振り返り
- 画面・サービス名・手順・数値はすべて架空です。実際の製品画面や連携動作を示すものではありません（画面上にも常時表示）。
- 監視画面はNew Relicの画面イメージ（上のグローバルヘッダー、左のナビゲーション、エンティティ画面のタブ、配色）を踏襲した架空画面です。テックタッチ（青）とAI Hub（紫）は、その上に重なるオーバーレイとして表示します。
- 監視画面の項目名は英語表記です（New Relicの日本語ドキュメントでも画面上の名前は英語で書かれているため。製品の日本語表示の有無は確認していません）。テックタッチのガイドは日本語です。
- `index.html` 1ファイルで動きます。外部への通信はありません。

## 使い方

1. `index.html` をブラウザ（Chrome／Edge推奨）で開く
2. 右のテックタッチのパネルのボタン（「ガイドを開始」「次へ」「Logs を開く」など）で1ステップずつ進む。左の画面を直接操作しても進みます
3. 上部の「業務の流れ」で章を切り替えられます。章の終わりごとに止めて「伺いたいこと」を質問できます

| 操作 | キー |
|---|---|
| 次へ／戻る | → ／ ← |
| 章の切り替え | 1〜4（4は振り返り） |
| 進行メモ（発表者用、既定は非表示） | N |
| この章を最初から | R |

- 表示色は「表示：自動／ライト／ダーク」で切り替えられます（選択はブラウザに保存されます）。
- URL末尾に `#c1`〜`#c4` を付けると、その章から開きます。

## 章の構成（Dynatrace版との違い）

章・ステップ数・伺いたいこと・架空の数値（420 ms → 980 ms など）は Dynatrace版と同じです。画面の操作だけが次のように変わります。

| 章 | Dynatrace版 | New Relic版 |
|---|---|---|
| 第1章 デモ① | Dockの「サービス」→ サービス・時間枠・比較期間を選ぶ →「適用」 | 左のナビゲーションの「APM & services」→ 一覧から対象サービスを開く →「Time range」「Compare with」を選ぶ →「Apply」→ Golden metrics（Response time・Throughput・Error rate）→ 関連するIssueを開く |
| 第2章 デモ② | 問題 P-0412：概要 → 影響範囲 → ログ → 連絡 | Issue「High response time」：Overview → Impact → Logs（Time range は「5 minutes before issue」）→ 社内手順で連絡 |
| 第3章 デモ③ | ダッシュボード →「ひな型から作成」→ 専門家に確認を依頼 → 保存して共有。DQLは Dynatrace Assist | Dashboards →「Create from template」→ Entity・Time range を変更 →「Preview」→「Request review」→「Save & share」。NRQLは New Relic AI（自然言語からNRQLへの変換） |
| 振り返り | 同じ | 同じ |

## 動画版

`video/newrelic-techtouch-demo.mp4`（3分36秒、1920×1080、H.264、音声なし）。構成・字幕の書き方は Dynatrace版と同じです。

```sh
cd video
npm install                      # 撮影用フォント（Noto Sans JP、Roboto）
NODE_PATH="$(npm root -g)" FFMPEG=/path/to/ffmpeg node record.js
```

## スライド（デモ①〜③）用の画面

会議資料のデモ①〜③（p.11〜13）に貼る画面は、`slides/capture.js` でこのデモから撮影します。スライドの画像枠（11.4in × 4.293in）と同じ縦横比のPNGを `slides/shots/` に書き出します。

| スライド | 撮影する場面 |
|---|---|
| デモ① | APM & services のサービス画面。Apply の後、ガイドが「⑥ 上がっている値を確認します」を案内（Golden metrics：420 ms → 980 ms） |
| デモ② | Issue「High response time」の Logs タブ。ガイドがステップ3と「Time range を『5 minutes before issue』にします」を案内 |
| デモ③ | Dashboards の Create from template。ガイドが「⑤ Time range を Last 24 hours に変えます」を案内し、AI Hub（例文）が変える理由を説明 |

```sh
cd slides
NODE_PATH="$(npm root -g)" node capture.js   # 先に ../video で npm install（フォント）
```

- 会議資料（.pptx）そのものは、このリポジトリには置いていません。

## 画面デザインの根拠（New Relicの画面イメージ）

| 項目 | 根拠 |
|---|---|
| 配色（ライト／ダーク） | New Relicのドキュメントサイト用テーマ `@newrelic/gatsby-theme-newrelic` 9.18.1（Apache-2.0、npm）の `src/components/GlobalStyles/colors.js` と、`@newrelic/nr1-community` 1.2.0（Apache-2.0）の色。例：背景 `#f9fafa`、本文 `#293338`、プライマリ `#0c74df`、重大 `#bf0015`。淡い青など一部は間を補った値で、**製品画面そのものの定義値ではありません** |
| 左のナビゲーション（All capabilities、ピン留め、Query your data など） | [New navigation UI transition guide](https://docs.newrelic.com/docs/new-relic-solutions/new-relic-one/new-navigation-transition-guide/) |
| APMのサマリー（Response time・Throughput・Error rate） | [Troubleshoot with the APM summary page](https://docs.newrelic.com/docs/apm/agents/manage-apm-agents/agent-data/triage-run-diagnostics/) |
| Issueの Overview タブ（What's impacted? など） | [Response intelligence with New Relic AI](https://docs.newrelic.com/docs/alerts/incident-management/response-intelligence-ai/) |
| New Relic AI（自然言語からNRQLへの変換） | [New Relic ブログ（nrai-natural-language-to-nrql）](https://newrelic.com/blog/news/nrai-natural-language-to-nrql) |

- 上の公式ページは、この作業環境から newrelic.com に接続できなかったため、**検索結果の要約で確認**したものです。ページ全文は確認できていません。
- New Relicのロゴ、アイコン画像、専用フォント（Söhne）は使っていません（フォントは利用者の環境にあれば使い、なければ Inter／Segoe UI 等で表示）。アイコンは汎用の図形です。

## 本番前に確認が必要なこと

- **New Relicの「What to check?」との重なり（重要）**：公式ドキュメント（Response intelligence with New Relic AI）の検索結果の要約では、Issueの Overview タブに「What's impacted?」「What happened previously?」「What to check?」の3つのウィジェットがあり、「What to check?」は初動対応者に対応の手順を示すもの、と説明されています。デモ②（社内手順どおりの一次確認）と役割が重なる可能性があります。整理メモの「重複する部分は監視製品側の機能を優先する」に従い、社内手順を登録できるか・利用条件・どこまで示せるかを確認してから、テックタッチの役割（社内の連絡手順や順番の案内など）を決める必要があります。
- **画面の項目名・構成**：次は架空、または公式の実画面と照合していない表記です。
  - Issueの詳細画面のタブ構成（Overview／Impact／Logs／Activity）、「Analysis summary」「End-user impact」の表示
  - 「Compare with」「5 minutes before issue」「Since issue opened」などの期間の表記
  - 「Create from template」「Choose a template」「Request review」「Save & share」などダッシュボードの操作
  - グローバルヘッダー（アカウント選択・検索）やナビゲーションの項目の並び
- **New Relicの日本語表示**：製品画面の日本語表示の有無・表記は確認していません。日本語で表示される場合は、項目名とガイドの文面を合わせて直す必要があります。
- **テックタッチの製品機能で再現できるか**：Dynatrace版と同じく、画面に応じたガイド一覧、Issue画面を開いたときのポップアップ、「?」のツールチップ、選び直し・順番の案内、ガイドの画面から離れたときの案内は、構想の表現です。
- **このデモ用に新しく書いた架空の内容**：Dynatrace版と同じもの（人物像、社内の目安 500 ms、優先度の基準、ログの文面、連絡内容、記録、専門家の文面、ダッシュボード名、AI Hub欄）に加えて、Throughput（400 rpm／413 rpm）、Error rate（0.20 %／0.77 %）、Issue名「High response time」、エンティティ一覧の種別表記。
- **New Relic AIの扱い**：「自然言語からNRQLへの変換」は公式ブログで確認した機能です。お客様の契約・設定で利用できるかは確認が必要です。
- 監視画面は公開情報をもとに作っています。実際のNew Relicアカウントの画面とは照合していません。
