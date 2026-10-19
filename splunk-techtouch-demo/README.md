# Splunk × テックタッチ 構想デモ動画

参考動画「Dynatrace × テックタッチ」と同じ形式の構想デモです。架空の監視画面にテックタッチのガイド（案）と AI Hub（構想）を重ねて表示します。

- 出力：`splunk-techtouch-demo.mp4`（1920×1080・30fps・無音）
- 第1・2章（ITSI・IT Essentials Work）は、Splunk の画面イメージを踏襲した架空画面です（デモ環境に未導入のため）。
- 第3章は、Splunk Cloud（デモ環境）の上で、公開したテックタッチのガイド「ログをひな型から調べる」を再生した実画面です（`real/shots/r01〜r10`）。AI Hub は構想の画面イメージ（デモ環境には未導入）で、実画面とは分けて右側に表示します。
- 「ガイドの作り方（実機）」で、ガイドエディターと管理画面（公開）を見せます。管理画面のメールアドレスと編集者名はぼかし済みです。
- ログは `makeresults` と `collect` で作った架空データ（今日の 09:30〜10:30、823件）です。

## 構成

| 章 | 時刻 | 画面 | テックタッチの支援 |
|---|---|---|---|
| 第1章 問い合わせ・状況確認 | 10:16 | Service Analyzer（Tile view）| ガイド6ステップ、サービスの選び直しの案内、健全性スコアのツールチップ |
| 第2章 一次確認・連絡 | 10:18 | Episode Review → Entity Overview | ポップアップで開始、Acknowledge、順番の案内（Impact が先）、優先度基準のツールチップ、AI Hub（構想）が一次連絡文を下書き |
| 第3章 ログを調べる | 10:30 | Splunk Cloud 実画面（レポート → サーチで開く）| テックタッチ（実機）のガイド7ステップ、AI Hub（構想）がSPLの説明・結果の読み方（社内基準との照合）・確認依頼文の下書き |
| ガイドの作り方（実機） | — | ガイドエディター・管理画面 | 実画面の上で吹き出しをつなげ、管理画面で公開 |
| 振り返り | — | まとめ | 手当てした場面の回数、確かめ方、伺いたいこと |

## 再生成

```bash
npm install
node snap.js demo.html shots steps   # 各ステップの静止画を確認（shots/ を先に作成）
node record.js demo.html splunk-techtouch-demo.mp4 30
```

台本は `demo.html` の `/* storyboard */` 部分（`S(秒数, {...})`）を編集します。

## 実画面（第3章）の撮り直し

1. `real/CLAUDE_FOR_CHROME.md` の指示を、Splunk Cloud のタブの Claude for Chrome に貼る（サンプルログの投入、ひな型レポートの保存、ガイドの作成・公開、再生画面での撮影まで）。
2. 撮影した画像を `real/shots/r01.jpg`〜`r10.jpg` に置く（r10 は管理画面。個人情報をぼかしてから置く）。
3. 強調枠を付ける位置は `demo.html` の `REAL_BOXES`（画像上のピクセル）で指定する。
4. `node record.js demo.html splunk-techtouch-demo.mp4 30` で書き出す。第3章を架空画面に戻す場合は `demo.html?mock`。

サンプルログの生成条件は Python で再現して検算し、Splunk Cloud（デモ環境）でも同じ傾向（10:00 から DB_CONN_TIMEOUT、10:05 から POOL_EXHAUSTED が増加、計823件）を確認しています。
