# Splunk ES＋UEBA＋SOAR × テックタッチ（DAP＋AI Hub）人事システム事案対応デモ：シナリオと素材

架空のA社（生命保険）のSOCが、人事システムへの第三者アクセス（仮説：正規の認証情報の悪用）を、入っているSplunk（Enterprise Security・UEBA・SOAR）と、Splunk AI Assistant・テックタッチ（DAP＋AI Hub）で、検知から一次対応・封じ込め・範囲の確定・記録・改善まで社内で回すシナリオとイメージデモです。

- 実在の企業・事案・数値を再現したものではありません。画面・人物・企業名・手順・数値はすべて架空です。
- 製品を足す提案ではなく、入っているES・UEBA・SOARを社内の人が判断・承認・記録まで使い切る提案です。委託先を外す話ではありません。
- 既存の「Splunk Cloud＋SSE版」（`../splunk-techtouch-siem-demo/`）のS2〜S4・S7〜S8の型を流用し、画面をES・UEBA・SOARに差し替えています。

## 使う順番

1. `scenario.md` の0章（結論）と1章（事案の型と仮説）を読む。
2. 4章（デモ台本）と `demo/index.html` を並べて、場面ごとの見せ場と合格判定を確かめる。
3. 6章のSPLと検算（`verify/simulate_spl.py`）で、期待値が一致することを確かめる。
4. 9章（先に確かめること）を、お客様との最初の面談の前に埋める。
5. 10章（言ってはいけないこと）を、話し手全員で共有する。

## イメージデモ

`demo/index.html` をブラウザで開くだけで動きます（1ファイル、外部通信なし）。S0〜S8の9場面と振り返り。画面の部品はSplunk公式のUIツールキット（npm `@splunk/react-ui`・`@splunk/visualizations` ほか、Apache-2.0）で組んでいますが、ES（Incident Review、Content Management）・UEBA・SOARの実画面を写したものではなく、公開されている画面構成を手本にした「風」の再現です。

- キー操作：→ 次へ／← 戻る／1〜9 場面の切り替え／0 振り返り／N 進行メモ（発表者用）／R この場面を最初から。
- 右側のパネルがテックタッチのガイド（案）、紫の枠がAI Hub（構想・例文）、右の縦長パネルがSplunk AI Assistant（参考画面）です。
- 作り直し方：`cd demo/src && npm install && python3 build.py`（Node 18以上、Python 3）。動作確認：`node test_demo.js`（PlaywrightとChromiumが要る。`PLAYWRIGHT_MODULE` でモジュールの場所を指定できる）。
- 公開してはいけない文言は、環境変数 `DEMO_FORBID`（カンマ区切り）で `build.py` が検査します。一覧はリポジトリに置きません。

## 検算

```
python3 -I verify/make_data.py      # data/ のCSVを決め打ちで再生成（架空）
python3 -I verify/simulate_spl.py   # Q0〜Q4b と不十分な例の期待値をPythonで計算（ALL OK が出る）
```

Splunk実機での実行結果ではありません。実機での確認（CSVルックアップの空値の扱い、相関検索の作成画面、SOARのプレイブック）は構築時にSEが行います。

## セキュリティ

- ログ内の接続元IPは文書用の予約アドレス（RFC 5737）、ASNは文書用の番号（RFC 5398）です。アカウント名・企業名・申請番号・チケット番号は架空です。
- お客様の環境・データ・事案は使いません。お客様固有の内容はこのリポジトリに置きません。
- AI Hubは外部のAIサービスを利用します。調査記録には従業員の個人情報が含まれうるため、渡す情報の範囲はお客様の方針で先に決めます。デモは架空データだけです。

## 版

- 1.0（2026年10月9日）：初版。仮説に基づく架空の事案の型（人事システムへの第三者アクセス）で、ES・UEBA・SOAR版のシナリオ、固定テストログ、SPLと検算、AI Hubのナレッジ（KB01〜KB08、P1〜P8）、Splunk公式UI部品版のイメージデモを作成。
