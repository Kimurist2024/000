# Splunk Cloud × テックタッチ（DAP＋AI Hub）SIEM／SOC活用デモ：シナリオと素材

Splunk Cloud Platform＋Splunk Security Essentials（SSE）でSIEM（SOC）を運用し、Enterprise Security（ES）を使っていないお客様向けのデモシナリオと、デモを作るための素材です。
目的は、Splunkを使いこなせないことを理由に他のSIEMへの乗り換えを考えているお客様に、入れたSplunkを社内で使いこなす姿を見せることです。

- `scenario.md`：シナリオ本体（結論、対象、役割分担、37分・9場面の台本と20分版、SPL、AI Hubのナレッジ、効果の確かめ方、先に確かめること、想定問答、検証台帳、出典台帳）
- `data/demo_auth_events.csv`：架空の認証ログ72件（ケースA〜D）
- `spl/`：Q0〜Q5と、教材用の「不十分な例」
- `aihub/SOC_KNOWLEDGE_FOR_AIHUB.md`：AI Hubに登録する架空のナレッジKB01〜KB05と、プロンプトP1〜P4
- `verify/simulate_spl.py`：CSVに対してQ0〜Q4と「不十分な例」の判定をPythonで再現し、期待値と一致するかを確かめるスクリプト

## 使う順番

1. `data/demo_auth_events.csv` を、Splunk Cloudの Settings ＞ Lookups ＞ Lookup table files に登録する（`upload_lookup_files` の権限が要る環境で行う）。
2. `spl/Q0_count.spl` で、総件数72、接続元IP 4件を確認する。
3. `spl/Q1_failures_by_src.spl` で、A=36/9、B=18/1、C=12/6、D=4/3を確認する。
4. `spl/Q2_threshold_candidates.spl` で、AとCが残ることを確認する。
5. `spl/BEFORE_incomplete_example.spl` で、AとCが候補に入ってしまうことを説明する。これは意図的に条件を省いた教材で、Splunk AI Assistantの実際の出力ではない。
6. `spl/Q3_admin_success_after_failures.spl` で、Aだけが残ることを確認する。「同一管理者」「失敗後の成功」の条件が要ることを示す核心。
7. `spl/Q4_timechart_5m.spl` で、時間推移を描く。
8. `aihub/SOC_KNOWLEDGE_FOR_AIHUB.md` のKB01〜KB05を、AI Hubのデモ用ナレッジとして登録し、P1〜P4をガイドに設定する。
9. `spl/Q5_production_skeleton.spl` は、実ログに置き換えるときの設計の骨格。プレースホルダーを置き換えるまで実行しない。

## 検算

```
python3 verify/simulate_spl.py data/demo_auth_events.csv
```

Q0〜Q4と「不十分な例」の期待値が、CSVと一致することを確認します。これはSplunkでの実行ではなく、同じ条件をPythonで計算したものです。Splunk Cloudの実機での実行は、構築時にSEが行います。

## 画面モック

画面の流れを示すHTMLのイメージデモは、このフォルダにはまだ含まれていません（`dynatrace-techtouch-full-demo` と同じ作りで作る予定）。

## セキュリティ

- ログ内の接続元IPは、文書・例示用に予約されたアドレス（RFC 5737）です。ユーザー名・企業名は架空です。
- AI HubとSplunkの検索結果の連携は、実装時に権限、データ分類、転送経路を検証してください。デモでは架空データだけを使います。
- お客様の環境・データは使いません。

## 版

- 1.0（2026-10-08）：GPTで作成した初版。
- 1.1（2026-10-08）：出典を一つずつ確認し、確認できなかったものを差し替え。CSV・SPL・ナレッジを再作成し、期待値を検算。先に確かめること、想定問答、AI機能の役割分担、20分版を追加。変更点は `scenario.md` の付録A。
