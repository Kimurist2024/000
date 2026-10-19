# Splunk × テックタッチ 構想デモ動画

参考動画「Dynatrace × テックタッチ」と同じ形式の構想デモです。架空の監視画面にテックタッチのガイド（案）と AI Hub（構想）を重ねて表示します。

- 出力：`splunk-techtouch-demo.mp4`（1920×1080・30fps・無音・約5分16秒）
- 第1・2章（ITSI・IT Essentials Work）は、Splunk の画面イメージを踏襲した架空画面です（デモ環境に未導入のため）。
- 第3章の検索画面は、Splunk Cloud（デモ環境）の実際の表示（左メニュー、日本語の表記、架空のサンプルログ823件の値）に合わせた画面イメージです。
- 第3章の最後の「実機で確かめたこと」は、Splunk Cloud（デモ環境）とテックタッチ（実機）の実画面です（`real/proof/`。メールアドレスと編集者名はぼかし済み）。

## 構成

| 章 | 時刻 | 画面 | テックタッチの支援 |
|---|---|---|---|
| 第1章 問い合わせ・状況確認 | 10:16 | Service Analyzer（Tile view）| ガイド6ステップ、サービスの選び直しの案内、健全性スコアのツールチップ |
| 第2章 一次確認・連絡 | 10:18 | Episode Review → Entity Overview | ポップアップで開始、Acknowledge、順番の案内（Impact が先）、優先度基準のツールチップ、連絡内容の例 |
| 第3章 ログを調べる | 10:30 | Search & Reporting（レポート → サーチで開く）| ガイド7ステップ、AI Hub欄の例文（ひな型の意図・SPLの説明・結果の見方） |
| 実機で確かめたこと | — | Splunk Cloud・テックタッチの実画面 | 実データの結果、吹き出しの作成、ガイドの公開設定 |
| 振り返り | — | まとめ | 手当てした場面の回数、確かめ方、伺いたいこと |

## 再生成

```bash
npm install
node snap.js demo.html shots steps   # 各ステップの静止画を確認（shots/ を先に作成）
node record.js demo.html splunk-techtouch-demo.mp4 30
```

台本は `demo.html` の `/* storyboard */` 部分（`S(秒数, {...})`）を編集します。

## 実画面版（第3章）

第3章だけを、Splunk Cloud の実画面と実機のテックタッチで撮り直せます。第1・2章（ITSI・IT Essentials Work）はデモ環境にないため、架空画面のままです。

1. `real/CLAUDE_FOR_CHROME.md` の「貼り付ける指示」を、Splunk Cloud のタブの Claude for Chrome に貼る（サンプルログの投入、ひな型レポートの保存、テックタッチのガイド作成、撮影する場面の表示まで）。
2. 撮影した `r01.png`〜`r09.png` を `real/shots/` に置く。
3. `demo.html` の `REAL_BOXES` に、カーソルを当てる要素の位置（画像上のピクセル）を入れる。
4. `node record.js "demo.html?real" splunk-techtouch-demo-real.mp4 30` で書き出す。

サンプルログは `makeresults` と `collect` で作る架空データです。生成の条件は Python で再現して、10:00 から DB_CONN_TIMEOUT、10:05 から POOL_EXHAUSTED が増えることを確認しています（Splunk 実機での実行結果ではありません）。
