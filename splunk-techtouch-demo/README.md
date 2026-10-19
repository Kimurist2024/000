# Splunk × テックタッチ 構想デモ動画

参考動画「Dynatrace × テックタッチ」と同じ形式の構想デモです。架空の監視画面にテックタッチのガイド（案）と AI Hub（構想）を重ねて表示します。

- 出力：`splunk-techtouch-demo.mp4`（1920×1080・30fps・無音・約4分47秒）
- 監視画面は Splunk の画面イメージを踏襲した架空画面です。ITSI と IT Essentials Work はデモ環境に未導入のため、実画面は使っていません。

## 構成

| 章 | 時刻 | 画面 | テックタッチの支援 |
|---|---|---|---|
| 第1章 問い合わせ・状況確認 | 10:16 | Service Analyzer（Tile view）| ガイド6ステップ、サービスの選び直しの案内、健全性スコアのツールチップ |
| 第2章 一次確認・連絡 | 10:18 | Episode Review → Entity Overview | ポップアップで開始、Acknowledge、順番の案内（Impact が先）、優先度基準のツールチップ、連絡内容の例 |
| 第3章 ログを調べる | 10:30 | Search & Reporting（Reports → Open in Search）| ガイド7ステップ、AI Hub欄の例文（ひな型の意図・SPLの説明・結果の見方） |
| 振り返り | — | まとめ | 手当てした場面の回数、確かめ方、伺いたいこと |

## 再生成

```bash
npm install
node snap.js demo.html shots steps   # 各ステップの静止画を確認（shots/ を先に作成）
node record.js demo.html splunk-techtouch-demo.mp4 30
```

台本は `demo.html` の `/* storyboard */` 部分（`S(秒数, {...})`）を編集します。
