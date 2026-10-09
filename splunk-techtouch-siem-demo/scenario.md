# Splunk Cloud × テックタッチ（DAP＋AI Hub）SIEM／SOC活用シナリオ・デモ台本

版：1.1（GPT版1.0を確認・加筆）｜基準日：2026年10月8日｜用途：社内でのシナリオ確定、デモ制作仕様、SEへの構築依頼
対象：Splunk Cloud Platform＋Splunk Security Essentials（SSE）でSIEM（SOC）を運用し、Enterprise Security（ES）を使っていないお客様

> この版で変えたこと（GPT版1.0との差分）は、末尾の「付録A 1.0からの変更点」にまとめています。
> 文書内の「確認必要」「抜粋」は、公開情報の本文を作業環境から開けず、検索結果の抜粋だけで確かめたことを示します。お客様向けの資料に使う前に、原文で確かめてください。

## 目次

| 章 | 内容 |
|---|---|
| 0 | 結論：この提案とデモで示すこと |
| 1 | 対象のお客様と、乗り換え防止の位置付け（要点だけ）。1.6にGPT版の課題認識の妥当性 |
| 2 | Splunk AI Assistant・AI Hub・テックタッチ（DAP）の役割分担 |
| 3 | デモ台本：37分・9場面（20分版の配分付き） |
| 4 | 画面・操作・合格判定のチェックリスト |
| 5 | 実行用SPL（Q0〜Q5、不十分な例）と検算結果 |
| 6 | AI Hubのナレッジとプロンプト（KB01〜KB05、P1〜P4） |
| 7 | 効果の確かめ方 |
| 8 | 実装の準備と責任分担 |
| 9 | 先に確かめること・リスク（追加） |
| 10 | 想定問答（追加） |
| 11 | 検証台帳 |
| 12 | 出典台帳 |
| 付録A | 1.0からの変更点 |
| 付録B | ESをお使いのお客様向けの差し替え |

---

## 0．結論：この提案とデモで示すこと

**提案の主旨**：Splunkへの既存投資を維持したまま、SOC担当者が「SPLを理解して検索する → 結果が業務に正しいか確かめる → ダッシュボードを作る → 検知し、一次調査する → 運用を改善する」までを、自社で実行できる範囲を広げます。

**組み合わせの設計**

| 担い手 | 担うこと |
|---|---|
| Splunk AI Assistant | 自然言語からSPL案を作り、既存SPLを説明・修正する（Splunkの機能） |
| テックタッチ AI Hub | お客様固有のSOC要件（ログ辞書・検知基準・承認済み検索・調査手順・過去事例）と照合し、確認事項・修正依頼・次の調査を整理する |
| テックタッチ（DAP） | Splunkの画面の上で、操作の順番・必須の確認・入力のルールを短いガイドで示し、業務の完了までつなぐ |

- AI HubはAI Assistantの代替ではありません。Assistantの前後に置き、分析目的の整理、業務要件との照合、判断材料の整理を担います。AI Hubを脇役にしないのは、Assistantの出力の正しさを確かめる工程が業務に残るためです。Splunk AI Assistantの精度が1年前より上がったことを示す公開の根拠は、今回の調査では見当たりません（公式の修正履歴と新機能の記載はあるが、精度の数値はない）。
- このデモで証明するのは「AIが文章やSPLを返したこと」ではなく、**SOC担当者が正しい分析・可視化・調査・改善を最後まで実施できること**です。
- Splunkでできること（SPLの生成と説明、検索、ダッシュボード、アラート、SSEの検知コンテンツ）は、Splunkの機能として先に見せます。テックタッチで二重に持ちません。

**デモのテーマ**：「AI Assistantを使っても現場で作り切れなかった認証監視ダッシュボードを、AI Hub＋テックタッチで完成させ、同じ情報からSOCの一次調査まで実行する」

---

## 1．対象のお客様と、乗り換え防止の位置付け（要点だけ）

### 1.1 対象のお客様像

- Splunk Cloudを導入し、VPN・認証基盤・クラウドなどのログを検索・可視化している。
- SSEの検知コンテンツを参照し、ES専用のインシデント運用画面（アナリストキュー、調査、対応計画）は使っていない。
- 監視と検知ルールの作成・調整は委託先（MSSP・SIer）や熟練者に寄っていて、SOCのL1担当者・CSIRTは日常監視はできるが、新しいSPLやダッシュボードの作成・修正は依頼して待つ運用になっている。
- SPLを作るAIを使えても、その結果が自社のログ・検知要件に正しいかを判断する工程が残る。
- 監視要件の変更、誤検知の調整、調査手順の更新に時間がかかり、SIEM基盤の再検討（Cortex XSIAM、CrowdStrike Falcon Next-Gen SIEMなど）の動機になりうる。

※「ESを使っていないお客様が7〜8割」は、営業の現場の見立てです。外部の統計としては書きません。

### 1.2 乗り換え防止の位置付け（この文書で扱う範囲）

乗り換えの理由のうち、テックタッチで対処できるのは「使いこなせない」ことだけです。費用や、EDRなどほかの製品と一つにまとめる方針が理由の場合は、この提案の対象外です（10章の想定問答を参照）。

公開情報の要点（いずれも検索結果の抜粋。原文は未確認）：

- 乗り換えの理由として最も多く挙がるのは費用（データ量に応じた課金）です。次に多いのが、SPLと画面の学習の難しさ、専門家への依存です（Gartner Peer Insights、PeerSpot、G2のレビュー。12章）。
- 費用を理由にSplunkを離れた国内企業が、検知の作り込みと保守の難しさから、Splunkに戻った例があります（Sansan Tech Blog、2020年と2024年。12章）。
- 金融・保険で「使いこなせずXSIAMやCrowdStrikeへ移った」という公開の事例は、今回の調査では見つかっていません。

### 1.3 利用者の声（デモの設計根拠に使うもの）

| ID | 出典・日付 | 確認できた内容（要旨） | シナリオ上の意味 | 確認の状態 |
|---|---|---|---|---|
| R01 | Reddit r/Splunk「Guidance on Splunk without ES」2026/8/26（GPT版の記載） | 担当のセキュリティ技術者の退職後、ログの取り込みと約100個のダッシュボードは残ったが、検知ルールの構築・運用を引き継げない。ESを追加する予算もない | 専門家にノウハウが偏ると、Splunkが残っていても自走しにくい | ❌ 作業環境からRedditに到達できず未確認。お客様向けに使う前に、URLを直接開いて確かめる |
| R02 | Reddit r/Splunk「Feeling overwhelmed learning Splunk?」2026/7/24（GPT版の記載） | 学習中の利用者が、rex・erexの意味と使い方を理解できず、学習に圧倒されている | SPLの学習負荷を、業務の中で下げる支援が要る | ❌ 同上 |
| R03 | Gartner Peer Insights、Splunk Cloud Platform、2026/1/16のレビュー（評価4.0、ITサービス企業） | カスタマイズ性が決め手で、独自のダッシュボードとレポートを作っている。短所は費用と学習の急さ | 機能不足ではなく、柔軟性を現場で使い切る力に焦点を置く | ✅ 抜粋で確認。GPT版の「2026/9/15の銀行業レビュー」は見当たらず、確認できた別のレビューに差し替えた |
| R03b | Gartner Peer Insights、Splunk Cloud、2026年8月のレビュー（評価5.0） | AIの機能（Splunk AI Assistant for SPL）を標準機能として評価。ライセンス費用には改善の余地 | AI Assistantは利用者に評価されている。その価値を残す | ✅ 抜粋で確認 |
| R04 | Ponemon Institute「The State of SecOps & the Deployment of AI in the SOC」（Crogl協賛、北米のIT・セキュリティ実務者649名。報道は2026年3月） | AIをSOCに入れる障壁は、既存業務への統合の難しさ50%、分散して正規化しにくいデータ49%。実務者の63%が、信頼のために予測可能なAIの挙動を求める | AIの回答だけでなく、業務への統合と確認のしやすさを評価軸にする。**ベンダー協賛の調査のため、お客様向け資料では参考扱い** | ⚠ 存在・協賛・人数・50%・49%・63%は抜粋で確認。GPT版の「統合63%／予測可能性47%」は誤り（63%は予測可能性。47%は見当たらない）。GPT版の「2026/9/14」は未確認 |
| R05 | テックタッチ「CO-DEVELOPERS DAY '26 開催レポート」2026/8/28 | 河合塾：30ステップを超える「一通り紹介」のガイドは再生されず失敗し、スキルを補う短い支援に切り替えた | 必要な画面・瞬間に短い支援を出す。**自社事例（設計の参考）** | ✅ ページ・日付・「30ステップ超」は抜粋で確認。「実作業の画面で」の文言は未確認 |
| R06 | 同上 | オープンハウス・アーキテクト：AI Hubで建設業界に革新を（講演題名）。原価データの要約と予算超過の警告は、同社のプレスリリースの記載 | AI Hubを業務の流れに組み込む参考例。**自社事例** | ⚠ 講演題名は確認。「リスクと次のアクションの提示」の文言は未確認 |
| R12 | PeerSpot、Splunk Cloud Platform、「Aakash」（金融サービス企業のソフトウェア開発者）のレビュー（日付は表示なし） | SPLの学習が急で、正確な書き方を覚える必要がある。ログ監視と原因の特定は速くなった | SPLの壁を、画面の上の支援で下げる | ✅ 抜粋で確認。GPT版の「Myra Padilla、通信、DevOps、AIの精度約80%」はこのIDの内容と一致せず、投稿者も見当たらない |
| R13 | PeerSpot Q&A、技術サービス企業のDevOpsエンジニア、2026年7月 | 評価8.5／10。使いやすさでSentinelよりSplunk Cloudを選ぶが、SPLの習得には時間がかかる | AIの既存価値を残し、業務適合・確認・実行を補う | ✅ 抜粋で確認。GPT版の「保険会社のシニアソフトウェアエンジニア、2026/9/16」は見当たらず差し替えた |
| R14 | Splunk Community「Splunk AI Assistant」（Knowledge Management。スレッドIDから2024年ごろ） | Assistantは依頼に対して「最良の推測」を一つ返し、SPLと説明は出るが実行結果は返さない | Assistantの出力を、業務で確かめる工程が残る（S3・S4の根拠） | ✅ 抜粋で確認 |

利用者の声から導く仮説：Splunkは柔軟である一方、現場の担当者が自社に必要な分析を設計・検証・保守するには、技能・手順・判断基準が要ります。生成AIがSPLを作っただけでは、その業務の最終成果物は完成しません。

### 1.4 課題の因果構造（仮説）

1. SOC責任者が、新しい監視・検知・調査・可視化を求める。
2. 担当者は、ログの場所、フィールドの定義、SPLの集計・結合・時系列の判定を十分に把握できない。
3. Splunk AI Assistantに頼んでも、自社要件の伝え方と、出力の業務上の確認が難しい場合がある。
4. ダッシュボードや検知条件の完成・変更が遅れ、熟練者・委託先への依存が残る。
5. 運用改善の頻度と速度が落ち、Splunk活用の停滞がSIEM再検討の理由の一つになる。

テックタッチの介入点は2〜4です。「要件の整理」「業務基準との照合」「実行の誘導」「ノウハウの継承」を、一続きで支えます。

### 1.5 担当範囲の切り分け

| お客様の困りごと | Splunk／AI Assistant | AI Hubが補うこと | テックタッチ（DAP）が補うこと |
|---|---|---|---|
| 何を検索するか分からない | 検索、SPLの作成を支援 | 社内のSOC手順から、目的・制約・依頼文を整理 | 該当の画面で、必要な入力へ誘導 |
| SPLの結果が業務に正しいか分からない | 検索を実行し、結果を返す | ログ辞書・検知基準・承認済みSPLと照合し、確認事項を提示 | チェック項目を順番に確認させる |
| ダッシュボードを作れない | 保存検索、Dashboard Studioで可視化 | パネルの仕様、表示の根拠、検証の観点を提案 | 設定・保存・共有の操作を案内 |
| アラートを調査できない | 必要なログの検索、追加の分析 | 一次調査手順・過去事例に沿った確認事項と仮説 | 調査手順、証跡の記録、引き継ぎを誘導 |
| 改善が属人化している | 検索・アラートを変更できる | 承認済み検索と変更理由をナレッジとして再利用 | 変更・テスト・承認の段階をガイド |

製品利用の前提：ESの検知結果（finding）、Mission Control、ES専用のAI Assistant in Securityは使いません。SSEは検知コンテンツと適用条件の参考として使い、アラートの動作主体はSplunk Cloudの保存検索（アラート）です。Splunkのセキュリティとo11y（Splunk Observability Cloud）は分けて扱い、この文書はセキュリティだけを対象にします。

### 1.6 GPT版の課題認識は妥当か（こちらの調査との照合）

GPT版1.0が前提にした課題「Splunkの運用が難しく、十分に使いこなせていないお客様がいる」を、こちらで集めた公開情報（海外のレビューサイト、Splunk Community、国内の報道・個人の発信。いずれも検索結果の抜粋）と照らした結果です。

| GPT版の主張 | こちらの調査で確認できたこと | 判定 |
|---|---|---|
| SPLの学習が難しく、担当者が新しい検索やダッシュボードを作れない | 複数のレビューで一致。Gartner Peer Insights「使いにくく、運用に乗せるまでの学習が急」（評価2.0／5、2024/9）、「SPLの研修に時間がかかり、予算・ROI・初期の定着に響く」、同2026/1/16「学習が急」、G2「学習曲線が急」、PeerSpot「SPLの学習が急」「習得に時間がかかる」（2026/7）、TrustRadius「初心者向けの補完が弱い」、Reddit（2026/7のスナップショット）「取り込みとSPLの技能がないチームにはSplunkは合わない」 | **妥当**。最も根拠が多い |
| 熟練者やSIベンダーに依存している | G2「最初の導入は複雑で、専門性・時間・資源がかなり要る」（外部に依頼、2026/2）、PeerSpot「年間約2万ドルを外部のインテグレーターに払っている」、TrustRadius「新しいログの取り込みで苦労し、外部の契約者に頼る」「取り込みには長年の経験が要る」。国内では、セキュリティ対策が外部委託中心39%（MM総研、2026/9・報道）、MDRへの外部委託が広い（ガートナー ジャパン、2025/5）、外部SOCの定期報告だけでは初動が遅れる（ITmedia、2023/7・寄稿） | **妥当**。国内では「委託先任せ」の形で現れる。GPT版はSIベンダー依存と書いているが、監視・検知そのものが委託先にある点を1.1に足した |
| SPLを作るAIを使えても、結果が自社の要件に正しいかを判断する工程が残る | Splunk Community「Assistantは最良の推測を一つ返す。SPLと説明は出るが、実行結果は返さない」（R14）。AI Assistantの1.x系のドキュメントは、index・sourcetype・フィールド名を利用者が与えるよう案内（抜粋）。GPT版が根拠にした「AIの精度約80%」のレビューは見当たらない | **妥当だが根拠は薄い**。製品の仕様（結果を返さない、構成を自動で把握しない）からの推論として書く。精度の数値は使わない。精度が1年前より上がったことを示す公開の根拠も見当たらないため、確認の工程（AI Hub）は中心に置いたままにする |
| アラートの調整や検知の保守に時間がかかる | Splunk Community「既定の検知は多すぎて全部止めた」「数千件の通知の大半が誤検知」、Gartner Peer Insights（2026/5、評価5／5）「調整に時間がかかる」。国内ではSansanがOSSのSIEMで相関検知の実装と長いクエリの保守に行き詰まり、Splunk ESに戻った（2024/12）。IPAのインタビュー「ログ設計・アラート対応・検知が効いているかの確認が課題」（2026/7） | **妥当**。ESを使わない構成では、検知の作成と保守を自分たちで持つ必要があり、負担はさらに大きい（Splunk Community「ESなしでSIEMを作ると保守の費用はESより高くなりうる」） |
| 使いこなせないことが、SIEM再検討（乗り換え）の理由の一つになる | 乗り換えの理由として最も多く、はっきり語られるのは費用。学習の難しさと専門家依存は「よくある不満」だが、それだけを理由に離れたという声は少ない（海外のレビュー。1.2） | **「理由の一つ」なら妥当。主因と書くのは言い過ぎ**。GPT版は費用に触れていないため、1.2に足した |
| 2026年7〜9月の利用者の声が、この課題を示している | GPT版が挙げた2026年7〜9月の投稿（R01・R02・R03・R12・R13）は、確認できないか、記載と一致しなかった（1.3）。同じ趣旨の声は、2024〜2026年の別の投稿で確認できた | **主張は妥当だが、出典が差し替え**。日付を新しく見せる必要はない |
| ESを使っていないお客様が7〜8割 | 公開情報では確認できない（営業の見立て） | **対外には使わない**（GPT版もそう書いている） |
| 課題は「機能不足」ではなく「実行力と業務適合の不足」 | Splunkの柔軟性・カスタマイズ性は評価が高い（Gartner Peer Insights 4.6／5、評価4以上が95%。批判的なレビューでもSPLの柔軟性は評価）。一方で乗り換え先の製品にも、取り込み・アラートの調整・画面の分かりにくさの不満がある（PeerSpot、Gartner Peer Insights。他社の評価はお客様の前では話さない） | **妥当**。ただし「使いこなせない」の中身は、SPLと検知の保守と、新しいログの取り込みの3つに分かれる。GPT版のデモは前の2つを扱い、取り込みは扱っていない（候補として残す） |

まとめ：GPT版の課題認識は、方向としては公開情報と合っています。直したのは、(1) 出典を確認できたものに差し替えたこと、(2) 乗り換えの主因は費用であり「使いこなせない」は理由の一つだと明記したこと、(3) 国内では「SIベンダー依存」より「監視・検知が委託先任せ」の形で現れることを足したこと、(4) AIの精度の数値を使わないことです。

---

## 2．Splunk AI Assistant・AI Hub・テックタッチ（DAP）を一体で使う設計

### 2.1 役割を固定する

| 役割 | 担うこと | 担わないこと |
|---|---|---|
| Splunk AI Assistant（SPL支援） | 自然言語の検索要件からSPL案を作る。既存SPLの説明・修正を助ける | 検索結果の業務上の正しさの判定（Splunkで確かめる） |
| テックタッチ AI Hub | SOC業務の依頼文を整える。企業固有のログ辞書、監視基準、承認済み検索、調査手順、既知事例を参照し、確認項目・不足条件・修正依頼文・次の調査を整理する | Splunkのデータの分析（Splunkの機能を使う）。侵害の断定 |
| テックタッチ（DAP） | Splunk Cloudの検索、保存、Dashboard Studio、SSEの参照、調査記録の画面で、短い操作ガイドと必須の確認を出す | 検知や原因の断定 |
| SOC担当者／管理者 | 検索結果と期待値の照合。検知条件や公開設定の本番変更の承認 | 生成AIの説明だけで正しさを確定すること |

### 2.2 AI機能の役割分担（機能別に分けて評価する）

| 機能 | 提供元・名称 | このシナリオでの扱い | 前提・確認の状態（検索結果の抜粋） |
|---|---|---|---|
| 質問への回答とSPLの生成・説明 | Splunk AI Assistant（旧 Splunk AI Assistant for SPL。最新2.3.3） | 場面S3・S7で使う | 有償のSplunk Cloudが前提で、トライアル環境では使えない。東京リージョン（AWS）で提供、日本語に対応との記載。Search & Reportingのサイドバーと、独立したアプリ画面の両方がある（抜粋）。利用状況はCloud Monitoring Consoleで見られるとの記載（R08。AI Assistantのライセンスが要るとの記載もあり、条件は確認必要）。ルックアップの列やインデックスの構成を自動で把握するという記載は見当たらないため、依頼文に列名と書式を書く（S2）。精度の改善を示す公開の根拠は見当たらない（2.3.2の修正一覧、2.3.3のAI Memoryなどの記載はあるが、精度の数値はない） |
| 承認した検索の自動実行 | Splunk AI Assistant の Agent Mode | 使わない | Model Runtime（第三者のLLMを含む）への同意が前提。2.2の対象地域に東京が入るとの記載 |
| 検知結果の要約・トリアージの提案・対応の実行 | ES の AI Assistant in Security、Triage agent、AI SOC Analyst | 使わない（ES前提のため） | 付録B |
| 原因分析（RCA） | — | 扱わない | 未確認 |
| 傾向・動向の分析 | — | 扱わない | 未確認 |
| 予測・予兆 | Splunk AI Toolkit（旧 MLTK） | 扱わない | 予測への使い方は未確認 |
| 社内資料に基づく整理 | テックタッチ AI Hub（オプション） | 場面S2・S3・S7・S8で使う | 2025年2月に正式提供。社内資料をナレッジベースに登録して回答に反映する仕組みは、AI Hub特約に記載（R07）。外部のAIサービスを利用 |
| ガイドの保守 | テックタッチ AIリカバリー | 口頭で触れる程度 | 2025年8月にβ版として発表。現在の提供状況は確認必要 |

### 2.3 AI Hubに登録する5種類のナレッジ

| ID | サンプルナレッジ（架空） | AI Hubにさせる仕事 |
|---|---|---|
| KB01 | SOC_LOG_DICTIONARY：index、sourcetype、src、user、action、privileged、時刻、MFAの定義 | 自社ログと生成SPLの前提を照合する |
| KB02 | SOC_DETECTION_STANDARD：閾値、連続性、時系列、除外基準、アラートの社内基準 | 監視基準とSPLの整合を点検する |
| KB03 | SOC_APPROVED_SPL：承認済み検索、用途、版、期待結果 | 再利用の対象と変更箇所を示す |
| KB04 | SOC_RUNBOOK_AUTH：L1の調査順序、追加の証跡、上位者への引き継ぎ | アラート後の調査を補助する |
| KB05 | SOC_CASEBOOK：過去の判断理由、誤検知の典型、改善履歴 | 次の調査と改善案を整理する |

中身のサンプルは `aihub/SOC_KNOWLEDGE_FOR_AIHUB.md` にあります。デモでは企業秘密や実顧客のログを使わず、架空のナレッジとテストログだけを使います。

### 2.4 技術的なつなぎ方（段階を分ける）

| 段階 | 方式 | 備考 |
|---|---|---|
| デモ確定方式 | 手動の受け渡し。AI Hubで依頼文を作る → 担当者がコピーしてSplunk AI Assistantへ入力 → 出力SPLをAI Hubに貼り、業務基準との対応を整理 → Splunkで実行・検証 | AI Hubの画面とSplunkの画面が別になる。デモでは「どちらの製品の画面か」を常に表示する |
| 実機への実装候補 | テックタッチをSplunk Webの対象画面に適用し、テキストの受け渡し、選択、ガイドの起動の可否を検証する | 9章の#1 |
| 将来の連携候補 | API、SSO／RBAC、監査ログ、データ転送の制御を確認したうえで、検索結果の安全な取り込みや業務連携を検討する | この文書では約束しない |

この順序で、「実装済みの標準機能」と「今回の連携設計」を混ぜずに進行します。

---

## 3．デモ台本：37分・9場面

### 3.1 ストーリーと成功条件

架空のお客様：A社のSOC。Splunk CloudでVPNログを監視している。委託先が作った検知はあるが、社内で直せない。SOC責任者が次の改善を依頼した。

> 「認証失敗が複数アカウントに広がった後、管理者ログインが成功するケースを見たい。ダッシュボードを作り、検知した後の一次調査まで標準化してください。」

- **Before**：担当者はSPLと集計の作り方に迷い、Assistantの出力の妥当性も判断できず、委託先に依頼して待つ。
- **After**：AI Hubで依頼内容を業務要件に展開 → AssistantでSPL案を作成 → AI Hubで業務要件との対応と修正指示を作成 → Splunkで確認 → テックタッチのガイドでダッシュボードを作成 → SSEを参照しアラートを設定 → 一次調査手順に沿って調査・記録 → 改善履歴をナレッジに登録。

**デモ終了時に画面に残す成果物**：①認証分析用SPL（Q1〜Q4）、②監視ダッシュボード、③検知条件と保存検索（設計）、④一次調査の根拠と記録、⑤変更・改善ナレッジ。

### 3.2 進行表（37分版と20分版）

| 場面 | 見せるもの | 主役 | 37分版 | 20分版 |
|---|---|---|---|---|
| S0 現場の問題 | 現状とゴール | 業務課題 | 2:00 | 1:00 |
| S1 Before | SPLを直せず、依頼が滞る状態 | SOC担当者 | 3:00 | 2:00 |
| S2 要件整理 | 日本語の依頼 → 社内要件に基づく詳細な依頼文 | AI Hub | 4:00 | 2:30 |
| S3 SPL生成・確認 | AssistantのSPL案 → AI Hubの業務照合 → 修正 | AI Assistant＋AI Hub | 5:00 | 3:00 |
| S4 データ検証 | 正解ログとの照合、ケースA/B/C/Dの区別 | Splunk＋AI Hub | 5:00 | 3:00 |
| S5 可視化 | SOC監視ダッシュボードの完成 | テックタッチ＋Splunk | 6:00 | 3:00 |
| S6 検知 | SSEの参照、監視条件、アラート設定 | SSE＋テックタッチ | 4:00 | 2:00 |
| S7 一次調査 | 調査の整理、追加確認、上位者への引き継ぎ | AI Assistant＋AI Hub＋テックタッチ | 5:00 | 2:30 |
| S8 報告・改善 | 記録とナレッジの保存、まとめ | AI Hub＋テックタッチ | 3:00 | 1:00 |
| 合計 | | | 37:00 | 20:00 |

20分版は、S4のQ1・Q2の説明を短くし、S5はパネルを2枚（Q1とQ3）だけ作ります。S6は設定画面を見せて口頭で補います。

画面の区別（常に表示）：

| 表示 | 意味 |
|---|---|
| 【Splunk】 | 実機のSplunk Cloudの画面（検索、ダッシュボード、アラート、SSE、AI Assistant） |
| 【テックタッチ】 | Splunkの画面の上のガイド、ツールチップ、入力チェック |
| 【AI Hub】 | テックタッチのAI Hubの画面。回答は本番前に確かめた例を使う |
| 【社内（架空）】 | 社内チャット、チケット管理、依頼票など。デモ用の架空画面 |

### 3.3 S0（00:00–02:00）：オープニング

- 画面：【社内】A社SOCの業務依頼のカードと、従来の委託先への依頼の流れ。
- 説明：「Splunkの機能を増やすデモではありません。既にSplunkに入っているログを、SOC担当者自身が必要な分析・監視・調査・改善に使えるようにするデモです。Splunk AI Assistantを活かし、AI Hubで社内の運用基準に結び付け、テックタッチで実行を支えます。」
- 見せる結果：課題は「機能不足」ではなく「実行力と業務適合の不足」であると示す。
- 伺いたいこと：「SPLやダッシュボードの変更を、いまは誰に頼み、どれくらい待っていますか」

### 3.4 S1（02:00–05:00）：Before — AIがあっても完成しない場面

- 画面：【社内】SOC責任者からの依頼文、【Splunk】古い検索、【社内】改修依頼のチケット。
- 説明：「ダッシュボードで認証失敗は見えています。しかし、同じIPから複数ユーザーに失敗した後、対象の管理者本人がログインに成功したかを正確に表すには、対象ユーザー数と時間の順序が必要です。担当者は、生成された検索が目的に合っているか確かめられず、委託先に依頼します。」
- 担当者の操作：既存のダッシュボードで「認証失敗数」だけを確認する。
- 比較用の不十分なSPL（意図的に条件を省いた教材。Assistantの実出力ではないと明示する）：

```spl
| inputlookup demo_auth_events.csv
| stats count(eval(action="failure")) AS failures count(eval(action="success" AND privileged="true")) AS admin_successes BY src
| where failures >= 10 AND admin_successes >= 1
```

- この検索の問題：成功が失敗より前でも、同一ユーザーでなくても、同じ接続元IPなら一致します。ケースCまで候補に入ります（検算済み。5章）。
- 訴求：構文が通ることと、SOCの検知要件に正しいことは別です。

### 3.5 S2（05:00–09:00）：AI Hubで「何を依頼するか」を具体化する

- 画面：【テックタッチ】Splunkの検索画面の上に出すガイド「SOC分析アシスト」→【AI Hub】。
- 担当者がAI Hubに入力：「VPNの認証失敗と管理者ログイン成功を関連付けて、監視ダッシュボードにしたい。SOC基準に沿って、Splunk AI Assistantへの依頼を整えてください。」
- AI Hubが参照するナレッジ：KB01ログ辞書、KB02検知基準、KB03承認済みSPL（プロンプトP1）。
- AI Hubの期待出力（デモ用の模範回答）：
  - 対象：VPN認証イベント。フィールドはevent_time、src、user、action、privileged。
  - 条件：15分間に同一IPから認証失敗10件以上、異なる失敗アカウント5以上。
  - 追加条件：同じIP・同じ管理者アカウントで、そのアカウントの失敗より後に成功がある。
  - 確認：時刻、重複、例外条件、MFAの証跡。
  - 分析の分け方：「IP別ランキング」「15分の閾値候補」「管理者の失敗後の成功」「時間推移」。
- AI Hubが作るAssistant向けの依頼文：

> 以下のCSVルックアップに対してSPLを作成してください。event_timeは %Y-%m-%d %H:%M:%S、srcが接続元IP、userがアカウント、actionはfailure／success、privilegedは文字列true／falseです。15分間に同一srcで失敗10件以上、かつ異なる失敗userが5以上あることに加え、同じsrc・同じ管理者userに対して、失敗の後で成功したイベントだけを抽出してください。成功が失敗より前のケースは除外してください。必要に応じてeventstats・sort・streamstatsなどを使い、処理を説明してください。

- 担当者の操作：テックタッチのガイドに従って依頼文をコピーし、【Splunk】Splunk AI Assistantの画面に貼る。
- 依頼文に列名と書式を書く理由：Splunk AI Assistantがルックアップの列やインデックスの構成を自動で把握するという公式の記載は見当たりません（1.x系のドキュメントは、index・sourcetype・フィールド名を利用者が与えるよう案内）。AI Hubがログ辞書（KB01）から列名を補うのは、この穴を埋めるためです。
- 訴求：「良いプロンプトを書ける人だけがAIを使える」状態を減らす。
- 合格判定：依頼文に「15分」「10件以上」「異なる5ユーザー」「同一管理者」「失敗後の成功」が入っている。

### 3.6 S3（09:00–14:00）：Assistantを使い、AI Hubが業務適合を確かめる

- 画面A：【Splunk】Splunk AI Assistantが生成したSPLと説明。
- 進行ルール：Assistantの出力はそのまま表示します。適切な検索が出た場合はそのまま評価します。条件が欠けていれば、その内容をAI Hubに渡して補います。特定の失敗をAssistantの実出力として演出しません。
- 画面B：【AI Hub】「SOC基準との照合」（プロンプトP2）。担当者の入力：「次のSPL案を、KB01〜KB03と照合してください。①参照するログ・フィールド、②異なるアカウント数、③同じ管理者本人の失敗後の成功、④除外条件、⑤時間範囲を表で評価し、不足箇所についてAssistantへの修正依頼文を作ってください。検索結果の真偽は断定せず、実データで確認する項目を示してください。」
- AI Hubの期待出力：

| 確認事項 | チェック内容 | 次の行動 |
|---|---|---|
| ログ辞書 | src、user、action、privilegedを使っているか | 実際の列名を確認 |
| ユーザー数 | 失敗10件だけでなく、異なる5アカウント以上か | dc(user)に相当する条件を確認 |
| 同一ユーザー | 管理者の失敗と成功が同一アカウントか | src、user単位の判定を確認 |
| 前後関係 | 管理者の成功が失敗より後か | 時刻順の判定（streamstatsなど）を確認 |
| 最終検証 | ケースA/B/C/Dの期待結果を満たすか | Splunkの実行結果と突き合わせる |

- 担当者の操作：AI Hubが示した修正依頼文をAssistantに戻し、再生成したSPLを【Splunk】検索画面で実行する。
- 訴求：Assistantの価値を残しながら、AI Hubが「生成結果を業務で使うまでの確認作業」を支える。
- 合格判定：AI HubがSPLの構文ではなく、SOCの業務条件に基づくチェックリストを出す。

### 3.7 S4（14:00–19:00）：正解ログに照らし、誤検知の候補を区別する

- 画面：【Splunk】Search & Reporting。`demo_auth_events.csv`（72件）をCSVルックアップとして読み込んである。
- データの内訳（`data/demo_auth_events.csv`）：

| ケース | 接続元IP | 失敗件数／異なる失敗ユーザー | 特権の成功 | 判定 |
|---|---|---|---|---|
| A | 198.51.100.24 | 36件／9人 | 同一管理者 admin_ops が失敗の後に成功（09:10:00、MFA approved） | 高優先度の調査候補 |
| B | 203.0.113.40 | 18件／1人（svc_batch） | なし | 多数アカウントへの試行ではない |
| C | 192.0.2.51 | 12件／6人 | 管理者 admin_fin の成功（09:00:05）は失敗より前 | 「失敗後の成功」ではない |
| D | 203.0.113.20 | 4件／3人 | なし | 閾値未満 |

- 使うSPL：5章のQ1〜Q4を順に実行（テックタッチのガイドが、保存済みサーチの場所と実行順を案内）。
- 必要な結果：Q1のIP別の失敗ランキングでA、B、C、Dが表示される。Q2の閾値候補でAとCが残る。Q3の「同一管理者で失敗後に成功」でAだけが残る。
- 説明：「この差が重要です。Cは、同一IPで失敗と管理者の成功の両方があっても、時刻が逆です。数だけの検索をダッシュボードに載せると、SOCは誤った印象を持ちます。AI Hubは自社の判定要件を確認し、最終的な正しさはテストケースとの照合で確かめます。」
- 訴求：AIの出力を、検証できる分析結果に変える。
- 合格判定：Q1がA36・B18・C12・D4。Q2がA・C。Q3がAのみ。

### 3.8 S5（19:00–25:00）：テックタッチのガイドで監視ダッシュボードを完成する

- 画面：【Splunk】Dashboard Studio。【テックタッチ】ガイド「SOC認証監視ダッシュボードを作る」を起動。
- テックタッチのステップ（短いガイドに分割。各ステップは1画面で完結）：
  1. Dashboardsから新規ダッシュボードを作る（名前：`A社_SOC認証監視_デモ`。入力チェック：命名規則「チーム_対象_用途」）。
  2. Q1（保存済みレポート）をデータソースにして、IP別の認証失敗を棒グラフにする。
  3. Q2を表で表示し、異なる失敗アカウント数を併記する。
  4. Q3を「失敗後の管理者成功」の表として表示する。
  5. Q4を時間推移のグラフにする。
  6. 検索期間・共有範囲（権限）を確認して保存する（入力チェック：共有範囲が「自分だけ」なら案内）。
- 完成画面：上段に認証失敗の合計70件と接続元IP 4件。中段左にIP別の失敗ランキング、右に閾値候補（A、C）。下段左に失敗後の管理者成功（Aのみ）、右に5分単位の認証推移。
- 説明：「今まで委託先に依頼していた、定型的な分析・可視化の変更を担当者自身が進めます。Splunkの検索・ダッシュボードを使いながら、AI Hubが判断材料を示し、テックタッチが完成までの手順を支えます。」
- 訴求：SPLの理解で終わらず、監視できる成果物を作る。
- 合格判定：A/B/Cの差を確認できる4パネル（20分版は2パネル）のダッシュボードが保存されている。
- 確認が必要なこと：Dashboard Studioで保存済みレポートをデータソースにする操作（検索画面の「名前を付けて保存 ＞ ダッシュボードパネル」で代える方法も含む）を、実機で確かめる（9章）。

### 3.9 S6（25:00–29:00）：SSEを参照し、検知へつなぐ

- 画面：【Splunk】Splunk Security EssentialsのSecurity Content、Splunk Cloudのアラートの保存画面（検索 → 名前を付けて保存 ＞ アラート）。
- 実演内容：
  1. SSEで認証関連の検知コンテンツ（例：「Detect Password Spray Attempts」。抜粋で題名を確認）を開き、必要なログ、誤検知になりやすい条件（Known False Positives）、対応のしかた（How to Respond）を確認する（Splunkの機能）。
  2. A社の検知基準（15分で失敗10件以上、異なる5ユーザー以上。KB02）を【テックタッチ】ツールチップで示す。
  3. Q2を参考に、本番用はインデックス化された認証イベントを検索する設計（Q5の骨格）に置き換えることを説明する。
  4. アラートの保存画面で、名前（入力チェック：命名規則）、実行の間隔（ツールチップ：15分ごと。リアルタイムを選ぶと選び直しを案内）、トリガー条件（結果が1件以上）、抑制（入力チェック：空なら案内。同じsrcで60分）、通知先（入力チェック：個人アドレスなら案内）、「トリガーされたアラートに追加」を設定する。
  5. アラートの後に一次調査手順（S7）へ進む導線を確認する。
- 注意：`inputlookup` の固定CSVをそのまま定期実行しても、継続的な本番監視にはなりません。デモでは、過去ログへの検索検証と、アラート設定の設計・画面操作を切り分けて説明します。
- 訴求：検知コンテンツを「入れて終わり」にせず、自社のログと運用条件に合わせる。委託先に頼まずにアラートを足せる。
- 合格判定：SSEをES専用機能と混同せず、実インデックス検索へ移行する条件を示せる。
- 確認が必要なこと：アラートの定期実行に要る権限（`schedule_search`。既定ではadminとpowerだけとの記載）。Splunk Cloudではスケジュールの時刻がUTCとの記載。「トリガーされたアラートに追加」を付けないとActivityの一覧に出ない、既定で24時間で消えるとの記載（9章）。

### 3.10 S7（29:00–34:00）：アラート後の一次調査を標準化する

- 画面：【Splunk】トリガーされたアラート（Activity）または通知メールからケースAの結果を開く → 追加の検索。【AI Hub】一次調査手順の参照（プロンプトP3）。【テックタッチ】調査のチェックリスト。
- AI Hubへの依頼：「ケースA：同一IPから9アカウントに36件の失敗があり、その後 admin_ops で成功。KB04の認証手順に従って、確認済み事実・追加の確認事項・エスカレーション基準を整理してください。侵害の成立は推定しないでください。」
- AI Hubの期待出力：
  - 確認済み事実：IP、件数、アカウント数、成功時刻、同一管理者での時系列、MFAの結果。
  - 追加の確認：接続元の正規性、VPN／MFAの情報、本人確認、ログイン後の重要操作、端末の関連証跡。
  - 判断の進め方：調査の優先度を上げ、SOC上位者へ証跡と未確認事項を引き継ぐ。
  - 追加SPLの依頼：接続元IPと admin_ops の操作履歴を、特定の時間範囲で確認する依頼文をAssistantに渡す。
- テックタッチのチェックリスト：①時刻 ②対象 ③MFA ④正規アクセス ⑤影響範囲 ⑥根拠の記録・引き継ぎ（入力チェック：未確認の項目が空なら案内）。
- 説明：「ログの検索はSplunk、検索案はAssistant、当社の調査基準と次の行動はAI Hub、手順の抜け漏れ防止はテックタッチです。これを一人のSOC担当者の業務としてつなぎます。」
- 合格判定：確認済み事実と未確認事項を区別し、上位者への引き継ぎを作れる。

### 3.11 S8（34:00–37:00）：記録・改善・エンディング

- 画面：【社内】一次調査の記録（チケット管理）、運用改善のチケット、【AI Hub】ナレッジへの反映候補（プロンプトP4）。
- 記録の完成例：

> 事象：2026年10月8日、接続元 198.51.100.24 から複数ユーザーへの認証失敗36件（9ユーザー）があり、対象に含まれる特権アカウント admin_ops で、その後の認証成功（09:10:00、MFA approved）を確認。
> 確認済み：件数、接続元、対象ユーザー、時刻の順序、MFAの結果。
> 追加確認：接続元の正規性、本人利用、成功後の操作。
> 対応：SOC上位者へ優先的な追加調査を依頼。
> 改善候補：失敗件数だけでなく、異なるアカウント数・同一ユーザー・前後関係を明示する検索（Q3）を承認済みテンプレートに追加。

- クロージング：「Splunkを別のSIEMに入れ替える前に、既存のSplunkを使いこなす力を高められないか。AI Assistantを残し、AI Hubで自社業務に適合させ、テックタッチで操作と調査を完了する。今回の提案は、SOC担当者が自分で改善できる業務の範囲を増やすことです。」
- 合格判定：完成物と、次にナレッジとして承認する変更内容を示せる。

---

## 4．画面・操作・合格判定のチェックリスト

### 4.1 デモ環境の構成

| 区分 | 必要なもの | 実装の状態 |
|---|---|---|
| Splunk | Splunk Cloudへのデモ用アクセス（検索、CSVルックアップの登録、Dashboard Studio、アラートの作成の権限） | お客様または社内の検証環境で準備。有償環境が前提（Splunk AI Assistantはトライアル環境では使えない） |
| SPL | `demo_auth_events.csv` とQ1〜Q4 | `data/`、`spl/` に同梱。期待値はPythonで検算済み（Splunk実機での実行は未確認） |
| Splunk AI Assistant | 自然言語からSPL案を作る画面 | 実機があれば実出力。なければ「準備した参考画面」と明示 |
| AI Hub | KB01〜KB05、P1〜P4（要件整理・SPL照合・調査・改善） | `aihub/` に模擬文言と入力例。実画面への適用は別途構築 |
| テックタッチ（DAP） | 検索、Dashboard Studio、アラート保存、調査の短いガイドと入力チェック | 実機への適用は別途構築。適用できない場合は画面の説明に切り替える |
| SSE | 認証関連の検知コンテンツと適用条件の画面 | 対象環境へ導入し、内容を確認（3.8.0以降） |
| 検証 | 正解のテストケースA/B/C/D | CSVと `verify/simulate_spl.py` で提供 |
| 画面モック | 9場面の流れを示す対話型モック | `mock/SOC_demo_clickthrough.html`（GPT版を1.1に合わせて修正。Splunk Webのデザインは踏襲していない） |
| イメージデモ | Splunk Webの画面イメージを踏襲した架空画面の上で、9場面＋振り返りをガイド付きで進めるHTML | `demo/index.html`（`demo/src/build.py` で作り直す。画面・回答はすべて架空・例文） |

### 4.2 場面別の合格判定

| 場面 | 合格基準 |
|---|---|
| S2 | AI Hubの依頼文に「15分」「10件以上」「異なる5ユーザー」「同一管理者」「失敗後の成功」が入る |
| S3 | AI Hubが、SPLの構文ではなくSOCの業務条件に基づくチェックリストを出す |
| S4 | Q1がA36・B18・C12・D4。Q2がA・C。Q3がAのみ |
| S5 | A/B/Cの差を確認できる4パネル（20分版は2パネル）のダッシュボードを保存できる |
| S6 | SSEをES専用機能と混同せず、実インデックス検索へ移行する条件を示せる。アラートの名前・間隔・抑制・通知先が社内基準どおりになる |
| S7 | 確認済み事実と未確認事項を区別し、上位者への引き継ぎを作れる |
| S8 | 完成物と、次にナレッジとして承認する変更内容を示せる |

---

## 5．実行用SPL（固定テストログ・演習用）と検算結果

前提：Splunk Cloudの Settings ＞ Lookups ＞ Lookup table files に `demo_auth_events.csv` をアップロードし、検索を実行するアプリから参照できるようにします（アップロードには `upload_lookup_files` の権限が要るとの記載。9章）。`event_time` は架空データの固定時刻で、本番ログの `_time` とは異なります。固定テストでは、タイムピッカーではなくSPLの中で時刻を扱います。

SPLはすべて `spl/` に同じ内容のファイルがあります。期待値は `verify/simulate_spl.py` で、同じ条件をPythonで計算して確認しました（Splunkでの実行結果ではありません。実機での確認は構築時にSEが行います）。

### Q0 データ件数の確認（`spl/Q0_count.spl`）

```spl
| inputlookup demo_auth_events.csv
| stats count AS total_events dc(src) AS distinct_srcs dc(user) AS distinct_users
```

期待：total_events=72、distinct_srcs=4、distinct_users=19。検算：一致。

### Q1 接続元IP別の認証失敗ランキング（`spl/Q1_failures_by_src.spl`）

```spl
| inputlookup demo_auth_events.csv
| where action="failure"
| stats count AS fail_count dc(user) AS failed_users BY src
| sort - fail_count
```

期待：198.51.100.24=36/9、203.0.113.40=18/1、192.0.2.51=12/6、203.0.113.20=4/3。検算：一致。

### Q2 多数アカウントへの失敗（閾値候補）（`spl/Q2_threshold_candidates.spl`）

```spl
| inputlookup demo_auth_events.csv
| eval epoch=strptime(event_time,"%Y-%m-%d %H:%M:%S")
| where epoch>=strptime("2026-10-08 09:00:00","%Y-%m-%d %H:%M:%S") AND epoch<strptime("2026-10-08 09:15:00","%Y-%m-%d %H:%M:%S")
| where action="failure"
| stats count AS fail_count dc(user) AS failed_users BY src
| where fail_count>=10 AND failed_users>=5
| sort - fail_count
```

期待：AとC。検算：一致。テストデータの観測窓は15分（09:00–09:15）で、ここではデモの検知対象範囲です。本番の「任意の15分」は、時間範囲と実行周期を別に設計します。

### Q3 同一管理者で「失敗後に成功」したイベント（`spl/Q3_admin_success_after_failures.spl`）

```spl
| inputlookup demo_auth_events.csv
| eval epoch=strptime(event_time,"%Y-%m-%d %H:%M:%S")
| where epoch>=strptime("2026-10-08 09:00:00","%Y-%m-%d %H:%M:%S") AND epoch<strptime("2026-10-08 09:15:00","%Y-%m-%d %H:%M:%S")
| eval fail_mark=if(action="failure",1,0), failed_user=if(action="failure",user,null())
| eventstats sum(fail_mark) AS src_fail_count dc(failed_user) AS src_failed_users BY src
| sort 0 src user epoch
| streamstats sum(fail_mark) AS prior_user_failures BY src user
| where action="success" AND privileged="true" AND prior_user_failures>=1 AND src_fail_count>=10 AND src_failed_users>=5
| table src user event_time src_fail_count src_failed_users mfa
```

期待：`198.51.100.24 / admin_ops / 2026-10-08 09:10:00 / 36 / 9 / approved` の1行だけ。Bはユーザー数不足、Cは管理者の成功が失敗より前、Dは件数不足。検算：一致。

判定のしくみ：`eventstats` で接続元ごとの失敗件数と失敗ユーザー数を全行に付け、`sort 0 src user epoch` で同じ接続元・同じユーザーの中を時刻順に並べ、`streamstats` でそのユーザーの「それまでの失敗の累計」を数えます。成功の行で累計が1以上なら、同じユーザーの失敗が成功より前にあったことになります。

### Q4 5分単位の認証イベントの推移（`spl/Q4_timechart_5m.spl`）

```spl
| inputlookup demo_auth_events.csv
| eval _time=strptime(event_time,"%Y-%m-%d %H:%M:%S")
| timechart span=5m count(eval(action="failure")) AS failures count(eval(action="success")) AS successes
```

期待：成功2件（ケースCの09:00:05、ケースAの09:10:00）と失敗70件の推移。検算：09:00台＝失敗25・成功1、09:05台＝失敗42、09:10台＝失敗3・成功1。

### Q5 本番検知に置き換える際の検索の骨格（`spl/Q5_production_skeleton.spl`。実行しない）

```spl
index=<認証ログのインデックス> sourcetype=<認証ログのsourcetype> earliest=-15m latest=now
| eval src=<正規化した接続元IP>, user=<正規化したユーザーID>, action=<success または failure への正規化>
| where action="failure"
| stats count AS fail_count dc(user) AS failed_users BY src
| where fail_count>=10 AND failed_users>=5
```

本番化で必須の作業：導入済みのログ辞書に合わせてプレースホルダーを置き換える。取り込み時刻とイベント時刻の差、同一ユーザーの失敗後の成功の相関（Q3の `eventstats`＋`streamstats` を `_time` で組み直す）、スケジュールの重複、除外条件、権限・レビュー手順を設計する。Q5は完成した本番検索ではなく、置き換え箇所を示した骨格です。

### 不十分な例（`spl/BEFORE_incomplete_example.spl`。教材）

3.4に掲載。検算：AとCが残る（Cが誤って候補に入る）。

---

## 6．AI Hubのナレッジとプロンプト

KB01〜KB05の中身のサンプルと、P1〜P4のプロンプト本文は `aihub/SOC_KNOWLEDGE_FOR_AIHUB.md` にあります。要点は次のとおりです。

| プロンプト | 入口 → 出口 | 出力の形 |
|---|---|---|
| P1 依頼文の整形 | 担当者の依頼 → Assistantへの依頼文 | 目的／対象ログ／条件／時系列／期待出力／確認事項。定義にない列を作らない |
| P2 SPLの業務照合 | Assistantの出力 → AI Hub → Assistantへの修正依頼 | A. 条件の対応表、B. 未表現の条件と誤一致のケース、C. 修正依頼文、D. 検証のチェックリスト |
| P3 一次調査の整理 | Splunkの検索結果 → AI Hub | 確認済み事実／未確認事項／追加検索の目的／エスカレーション候補。断定しない |
| P4 改善・再利用 | クローズ → ナレッジ | 変更申請案（変更目的／変更前／変更後／期待結果／反例／確認者／承認日） |

---

## 7．効果の確かめ方

削減率などの効果の数値は示しません。最初に支援する作業を一つ決め、導入の前後で次を測ります。数値の目標は、現状を伺ってから設定します。

| 指標 | Splunk単体 | Assistant＋AI Hub＋テックタッチ | 判定方法 |
|---|---|---|---|
| 非熟練者の業務完遂率（自力完了率） | 計測 | 計測 | 同じ業務・同じデータで成果物を採点。委託先に聞き返さずに終えた割合 |
| SPLの正しい判定 | 計測 | 計測 | A/B/C/Dの期待結果と比較 |
| ダッシュボードの完成時間（所要時間） | 計測 | 計測 | 要件の提示から保存の完了まで |
| 熟練者・委託先への確認回数（依頼件数） | 計測 | 計測 | 演習中の問い合わせ・依頼を記録 |
| 一次調査の確認漏れ | 計測 | 計測 | 一次調査手順の必須項目の充足率 |
| 再現性 | 計測 | 計測 | 同じ種類のアラートを、次の回も自力で確かめられるか |
| 利用の広がり | 計測 | 計測 | Splunkを使う人の数と頻度（Cloud Monitoring Consoleの利用状況）。AI Assistantの利用はCMCの専用ダッシュボードで見られるとの記載（R08） |

完成物の品質は、AIの利用回数ではなく業務の結果で判定します。

乗り換えを検討中のお客様の適合判断：SPL・可視化・手順・運用の内製化が主な課題なら、このPoCへ進みます。検索基盤の性能、ログ収集の構成、EDRとの統合、自動封じ込めが主因なら、製品基盤を含む別の検討と分けます。

---

## 8．実装の準備と責任分担

| 役割 | 担当内容 | 完成条件 |
|---|---|---|
| Splunk担当（SE） | Splunk Cloudの環境と権限、ルックアップの登録、検索、Dashboard Studio、アラート、SSEの確認 | Q0〜Q4の期待結果を実機で確認できる |
| テックタッチ（DAP）担当 | 4本の短いガイド（S2、S5、S6、S7）の画面への紐付け、段階表示、入力チェック、チェックリスト | 操作を迷わず進められる。Splunk Webの画面要素を安定して指せる |
| AI Hub担当 | KB01〜KB05の登録、P1〜P4、表示形式、参照範囲 | 条件漏れの指摘と修正依頼文が出る |
| SOC監修担当 | 検知条件、反例、一次調査、承認ルール | 業務要件との整合を承認する |
| デモ担当 | 時間管理、場面の進行、期待結果の表示、失敗時の代替導線 | 37分（または20分）で全場面を完走する |

デモの説明の区分：実機のSplunk画面で行う検索・可視化と、作成したAI Hub／テックタッチのガイドは、表示上で必ず区別します。機密ログをAIに渡す場合はデータ分類・権限・転送先を確認し、今回は架空データだけで進行します。

### 8.1 SEに用意していただくもの

Splunk

- [ ] 有償のSplunk Cloud検証環境（Splunk AI Assistantが使えること。トライアル環境は不可）
- [ ] `demo_auth_events.csv` のルックアップ登録（`upload_lookup_files` の権限）
- [ ] Q1〜Q4の保存済みレポート（名前は `SOC_認証_Q1_IP別失敗` などの社内規則どおり）
- [ ] SSE 3.8.0以降の導入と、認証関連の検知コンテンツの確認
- [ ] Splunk AI Assistantの質問と回答（本番の前に同じ依頼文で確かめる）
- [ ] 古いダッシュボード（S1のBefore用）と、Dashboard Studioの新規作成の権限
- [ ] Cloud Monitoring Consoleの利用状況の画面（S8で口頭。見られる範囲を確認）

テックタッチ

- [ ] Splunk Webを対象にした導入（ブラウザの拡張機能）
- [ ] ガイド4本（S2 要件整理の入口、S5 ダッシュボード作成、S6 アラート設定、S7 一次調査チェックリスト）
- [ ] ツールチップ（検知基準、実行間隔の目安、判定区分）
- [ ] 入力チェック（命名規則、共有範囲、抑制、通知先、未確認項目）と選び直しの案内
- [ ] AI Hub：KB01〜KB05の登録、P1〜P4のガイド設定、模範回答の確認

社内（架空）の画面

- [ ] 依頼票・社内チャット・チケット管理の画面（S0、S1、S8）

---

## 9．先に確かめること・リスク（追加）

構築の最初に#1〜#4を確かめ、できないものは画面の説明に切り替えます。#1と#2はこのシナリオ全体の前提です。

| # | 確かめること | 理由 | 確かめ方 | 担当 |
|---|---|---|---|---|
| 1 | テックタッチがSplunk Webの画面（検索、Dashboard Studio、アラートの保存画面、SSE）の要素を安定して指せるか | Splunk Webの画面の作りについて、抜粋の範囲では公式の記載が見当たらない。テックタッチ開発者ブログの抜粋には、ドメインをまたぐiframeの中でもガイドとツールチップは動くが一部の機能は未対応との記述がある | 検証環境で、S2・S5・S6・S7の全ステップに吹き出しを出す。Splunk Cloudの更新後にもう一度確かめる | SE |
| 2 | AI HubとSplunk AI Assistantの間の受け渡し（コピー）が、デモとして自然に見えるか | 2.4の「デモ確定方式」は手動コピー。画面が2つになる | リハーサルで通す。見づらければ、AI Hubの画面を先に見せてからSplunkへ切り替える | デモ担当 |
| 3 | CSIRT・SOCの端末に拡張機能を入れられるか | セキュリティ部門の端末は、閉じたネットワークやVDIの場合がある。閉じたネットワークではLGWANへの対応の発表がある（2025年3月・抜粋）。VDIの公式の記載は見当たらない | 端末の種類、ネットワークの条件、配布の手続きを伺う | 営業 |
| 4 | 検証環境の用意 | 有償のSplunk Cloudが要る。Splunk AI Assistantはトライアル環境では使えないとの記載 | Splunk社、委託先、パートナーの検証環境を借りられるか確認する | 営業・SE |
| 5 | Splunk AI Assistantの前提 | 東京リージョン（AWS）で提供、日本語に対応との記載。東京は「Global」の地域区分で、プロンプトが国外で処理されうるとの記載。Agent Modeは使わない | お客様の環境での有効化と、AIに渡す情報の範囲を伺う | 営業・SE |
| 6 | AI Hubに渡す情報の範囲 | 検索結果やログに個人情報・顧客情報が含まれうる。AI Hubは外部のAIサービスを利用。お客様自身のAI環境をつなぐことも特約で認められている（抜粋） | お客様の方針を伺う。デモは架空データだけ | 営業 |
| 7 | Dashboard Studioで保存済みレポートをデータソースにする操作 | S5の手順の前提。Dashboard Studioの「Call saved searches」（ds.savedSearch）と、検索画面の「名前を付けて保存 ＞ ダッシュボードパネル」の両方に公式の記載がある（抜粋） | 実機で操作を確かめ、デモで使う方を決める | SE |
| 8 | アラートの権限と設定 | 定期実行には `schedule_search` が要り、既定ではadminとpowerだけとの記載。Splunk Cloudではスケジュールの時刻がUTC。「トリガーされたアラートに追加」を付けないとActivityの一覧に出ず、既定で24時間で消えるとの記載 | デモ用ユーザーの権限と、S7で結果を開く導線を確かめる | SE |
| 9 | 入力チェックでSplunkの保存を止められるか | S5・S6の見せ場 | 検証環境で再現する。止められなければ「案内だけ」に変える | SE |
| 10 | SSEの表示 | 検知コンテンツの項目名（Known False Positives、How to Respond）と、画面の日本語表示（ドキュメントの日本語版はあるが、画面は未確認） | 検証環境で確かめる | SE |
| 11 | SSEのサポート状況 | 最新は3.8.3（2026年1月）。終了の告知は見当たらないが、サポート期間の起点は未確認 | Splunk社に確認する | 営業 |
| 12 | お客様の記録の画面 | S7・S8の記録は、Splunkの外（チケット管理など）に残す前提 | ServiceNowなど、何を使っているかを伺う | 営業 |
| 13 | 委託先との契約 | 委託先の手順書を社内のガイドやAI Hubの参照先に使ってよいか。社内でアラートを作ってよいか | お客様と委託先に伺う | 営業 |
| 14 | ガイドの保守 | Splunk Cloudは常に最新の版で、機能更新の時間枠は月に最大2回との記載（メンテナンス方針・抜粋） | ガイドごとに持ち主と見直し日を決める | 営業・SE |

---

## 10．想定問答（追加）

数値や提供体制は約束せず、確かめ方と進め方を答えます。

| 質問 | 答え方 |
|---|---|
| Splunk AI AssistantがあればAI Hubは要らないのでは | Assistantは、Splunkの機能として使います。AI Hubが担うのは、御社固有のログ辞書・検知基準・調査手順との照合と、確認事項の整理です。Assistantの回答が御社の要件に合っているかを確かめる工程を支えます。 |
| XSIAMやCrowdStrikeに移れば、使いこなせるのでは | 乗り換えても、社内の判断基準・手順・記録の形は、新しい画面に合わせて作り直すことになります。テックタッチは、いまのSplunkの上で、それを社内の画面に置きます。乗り換えの判断そのものは、御社の評価軸で行われるものです。 |
| 乗り換えの理由は費用です | 費用の課題は、テックタッチでは解決できません。社内でSplunkが使われていないことも理由の一つであれば、使う人の広がりを確かめるところ（S8）からお手伝いできます。 |
| ESは入れていません | このデモは、ESを使わない前提です。ESをお使いの場合は、付録Bのとおり画面を差し替えます。 |
| 委託先の仕事を取り上げる話ですか | いいえ。監視と検知は委託先に続けていただき、社内で確かめ、直し、記録できるようにする話です。 |
| SOCの端末は外部につながらない／VDIです | 拡張機能を入れられるか（端末の種類、ネットワークの条件、配布の手続き）を、御社の環境で最初に確かめます。 |
| AIにログを渡して大丈夫ですか | 渡す情報の範囲を、御社の方針で決めます。SplunkのAIとAI Hubのどちらにも、ログを渡すかどうかを先に決めます。AI Hubは外部のAIサービスを利用します。御社のAI環境をつなぐ形も、特約で認められています（詳細は確認のうえご案内します）。 |
| Splunkの画面がよく変わりますが | ガイドごとに持ち主と見直し日を決め、Splunk Cloudの更新に合わせて点検します。対象は、よく止まる作業に絞ります。 |
| 英語の画面のままでも使えますか | Splunk Webは日本語表示に対応しています。SSEなど英語で表示される画面では、項目名の社内の言い換えをツールチップで添えられるかを、検証環境で確かめます。 |
| 効果はどれくらいですか | 現時点で数値はお約束しません。一つの作業で、7章の指標を測って確かめます。 |
| テックタッチ自体のセキュリティは | ISO/IEC 27001とISO/IEC 27017の認証を取得しています。SAMLによるシングルサインオン、IPアドレスの制限、権限の設定にも対応しています。AI Hubが認証の対象範囲に入るかは、確認してご案内します。 |

---

## 11．検証台帳

凡例：✅＝出典を確認（抜粋）、⚠＝条件付き・一部未確認、❌＝確認できず、👤＝営業の見立て・設計上の判断、🧪＝こちらで検算

GPT版1.0の検証台帳は13項目すべてを「✅」としていましたが、確認した結果は次のとおりです。確認はすべて検索結果の抜粋で、ページの本文は作業環境から開けていません。

| 項目 | 判定 | 今回の扱い |
|---|---|---|
| CSVの件数・A〜Dの期待値（Q0〜Q4、不十分な例） | 🧪 | `verify/simulate_spl.py` で一致を確認。Splunk実機での実行は未確認 |
| Splunk Cloudの検索・ダッシュボード・アラートの存在と項目名 | ✅／⚠ | `count(eval())`、`eventstats`、`streamstats`、ルックアップ登録の権限、Dashboard Studioの保存済みサーチ、トリガー条件・メール・抑制は公式の抜粋で確認。「トリガーされたアラートに追加」、cron、`schedule_search` の文言はコミュニティの抜粋のみ。表示名は実機で確認 |
| Splunk AI Assistantの前提（有償、東京、日本語、サイドバーとアプリ、CMCの利用状況） | ✅ | 公式の抜粋で確認（9章#5、R08）。ルックアップや構成の自動把握は記載なし |
| SSEの機能（検知コンテンツの項目、Open in Search、Schedule Saved Search、ブックマーク） | ✅ | 公式の抜粋で確認。画面は実機で確認。認証系の題名は「Detect Password Spray Attempts」を確認 |
| SSEの版（3.8.3、2026/1/21、Splunk Cloud対応）（R11） | ✅ | 抜粋で確認。それ以降の版の有無は未確認 |
| CMCのAI Assistant利用状況（R08） | ⚠ | 内容は確認。10.6のURLと更新日は未確認 |
| Dashboard Studioの現行性（R09） | ⚠ | ページは確認（URLの形が少し違う）。更新日は未確認 |
| AI Assistantの修正履歴（R10） | ⚠ | SAIA-8397・8396・8389は2.3.2の修正一覧で確認。SAIA-9232は見当たらない。2.3.3の修正一覧ページは未確認。シナリオ本文では使わない |
| AI Hubのナレッジベースと特約（R07） | ⚠ | 特約のページは前回の調査で抜粋を確認（社内資料の加工、記録の保存、お客様のAI環境の接続）。改訂日「2026/8/10」と第4・5・7条の条番号は未確認 |
| テックタッチの自社事例（R05、R06） | ✅／⚠ | ページと日付、河合塾の「30ステップ超」は確認。文言の一部は未確認。設計の参考として使い、お客様向けの根拠には使わない |
| 利用者の声：R01、R02（Reddit） | ❌ | 作業環境から到達できず未確認。使う前にURLを直接開く |
| 利用者の声：R03、R12、R13 | ✅ | GPT版の記載は確認できず、確認できた別のレビューに差し替えた（1.3） |
| Ponemon／Crogl調査（R04） | ⚠ | 存在・人数・50%・49%・63%は確認。数値の対応と日付をGPT版から修正。ベンダー協賛のため参考扱い |
| SPL・ダッシュボードの委託先依存を中心課題にする | 👤 | お客様像とデモ設計上の判断 |
| AI HubがAssistantの業務適合の確認を補う | ⚠ | 実装仕様・模擬出力を完成させ、実機PoCで検証する設計 |
| Splunk画面とAI Hubの間の自動受け渡し | ⚠ | 手動コピー方式でデモ。自動連携は別途検証 |
| ESを使っていないお客様が7〜8割 | 👤 | 対象設定上の認識。対外の統計には使わない |

## 12．出典台帳

確認の状態は、11章と同じ凡例です。URLと該当箇所は、お客様向け資料に使う前に原文で確かめてください。

### 利用者の声・第三者調査

| ID | 出典 | 該当箇所 | URL | 確認 |
|---|---|---|---|---|
| R01 | Reddit r/Splunk「Guidance on Splunk without ES」2026/8/26（GPT版の記載） | 投稿本文（担当者の退職、core license、約100ダッシュボード、ES予算なし）、コメント（SSE） | https://www.reddit.com/r/Splunk/comments/1vymhq3/guidance_on_splunk_without_es/ | ❌ 到達できず未確認 |
| R02 | Reddit r/Splunk「Feeling overwhelmed learning Splunk?」2026/7/24（GPT版の記載） | 投稿本文（rex／erex） | https://www.reddit.com/r/Splunk/comments/1v5id26/feeling_overwhelmed_learning_splunk/ | ❌ 到達できず未確認 |
| R03 | Gartner Peer Insights、Splunk Cloud Platform Reviews and Ratings、2026/1/16のレビュー（評価4.0、ITサービス企業のIT担当） | レビュー本文（カスタマイズ性、独自のダッシュボード、費用と学習の急さ） | https://www.gartner.com/reviews/product/splunk-cloud-platform | ✅（抜粋） |
| R03b | Gartner Peer Insights、Splunk Cloud、2026年8月のレビュー（評価5.0） | レビュー本文（AIの機能、Splunk AI Assistant for SPL、ライセンス費用） | https://www.gartner.com/reviews/market/security-information-event-management/vendor/cisco-splunk/product/splunk-cloud | ✅（抜粋） |
| R04 | Ponemon Institute「The State of SecOps & the Deployment of AI in the SOC」（Crogl協賛、北米649名。報道は2026年3月18日〜） | 障壁（統合50%、正規化49%）、予測可能なAIの挙動を求める63% | https://ponemonsullivanreport.com/2026/09/the-state-of-secops-the-deployment-of-ai-in-the-soc/ （GPT版のURL。検索では出てこず未確認。報道例：https://cxtoday.com 2026/3/24） | ⚠（抜粋。URLと日付は未確認） |
| R12 | PeerSpot、Splunk Cloud Platform、「Aakash」（金融サービス企業のソフトウェア開発者）のレビュー | SPLの学習の急さ、書き方の正確さ | https://www.peerspot.com/landing/study-splunk-cloud-platform-review-11126746-by-aakash | ✅（抜粋）。GPT版のレビューIDはこの投稿のもの |
| R13 | PeerSpot Q&A「What advice do you have for others considering Splunk Cloud Platform?」、技術サービス企業のDevOpsエンジニア、2026年7月 | 回答本文（8.5／10、使いやすさ、SPLの習得） | https://peerspot.com/questions/what-advice-do-you-have-for-others-considering-splunk-cloud-platform | ✅（抜粋） |
| R14 | Splunk Community「Splunk AI Assistant」（Knowledge Management） | 本文（最良の推測を一つ返す、実行結果は返さない） | https://community.splunk.com/t5/Knowledge-Management/Splunk-AI-Assistant/td-p/681972 | ✅（抜粋） |
| R15 | Splunk Community「Splunk AI Assistant is only supported on Splunk Cloud」2026年5月、「Is Splunk AI Assistant for SPL rolling out to Splunk core…」2026年2月 | オンプレミスではクラウド接続サービス経由との回答 | https://community.splunk.com/t5/Splunk-Enterprise-Security/Splunk-AI-Assistant-is-only-supported-on-Splunk-Cloud/m-p/761143 ／ https://community.splunk.com/t5/Splunk-Enterprise/Is-Splunk-AI-Assistant-for-SPL-is-rolling-out-to-Splunk-core-or/td-p/758083 | ✅（抜粋）。付録Bの補足 |

### Splunk（公式）

| ID | 出典 | 該当箇所 | URL | 確認 |
|---|---|---|---|---|
| R08 | Splunk Cloud Platform 管理マニュアル 10.6「Monitor AI Assistant usage」 | Access the AI Assistant Usage dashboard／About AI Assistant usage data／Review AI Assistant usage dashboard panels | https://help.splunk.com/en/splunk-cloud-platform/administer/admin-manual/10.6/monitor-your-splunk-cloud-platform-deployment/use-the-license-usage-dashboards/monitor-ai-assistant-usage （10.2.2510／10.3.2512／10.5.2605の同じページを確認。10.6のURLは未確認） | ⚠（内容は抜粋で確認。URLと更新日は未確認） |
| R09 | Splunk Cloud Platform、Dashboard Studio 10.6「What's new in Dashboard Studio」 | Dashboard Studioの現行性の確認 | https://help.splunk.com/en/splunk-cloud-platform/create-dashboards-and-reports/dashboard-studio/10.6/whats-new-in-dashboard-studio （GPT版はスラッグが二重だった） | ⚠（ページは抜粋で確認。更新日は未確認） |
| R10 | Splunk AI Assistant 2.3.2 リリースノート「Fixed issues」 | SAIA-8397（Search & Reportingでのカスタムプロンプトの失敗）、SAIA-8396（断続的な503）、SAIA-8389（埋め込み時の空の応答）。いずれも2026/9/2に解決との記載 | https://help.splunk.com/en/splunk-cloud-platform/search/splunk-ai-assistant/2.3.2/release-notes/fixed-issues | ⚠（抜粋。GPT版の「2.3.3」のページとSAIA-9232は見当たらない。本文では使わない） |
| R11 | Splunkbase「Splunk Security Essentials」 | Summary／Compatibility（Splunk Cloud）／Built by Splunk LLC。ESの「Essentials」エディションとは別物 | https://splunkbase.splunk.com/app/3435 | ✅（3.8.3、2026/1/21、抜粋） |
| S01 | Splunk AI Assistantの導入（Splunk Cloud、2.2.0） | トライアル環境では使えない、東京リージョン | https://help.splunk.com/en/splunk-enterprise/search/splunk-ai-assistant/2.2.0/install-and-configure-splunk-ai-assistant/install-splunk-ai-assistant-for-splunk-cloud-customers | ✅（抜粋） |
| S02 | Splunk AI Assistantについて（対応言語） | 日本語を含む8言語 | https://help.splunk.com/en/splunk-cloud-platform/search/splunk-ai-assistant | ✅（抜粋） |
| S03 | Agent Mode（2.2.0）、Model Runtime（2.2.0） | 対象地域、東京は「Global」 | https://help.splunk.com/en/splunk-enterprise/search/splunk-ai-assistant/2.2.0/use-splunk-ai-assistant/agent-mode-in-splunk-ai-assistant ／ https://help.splunk.com/en/splunk-enterprise/search/splunk-ai-assistant/2.2.0/use-splunk-ai-assistant/model-runtime-in-splunk-ai-assistant | ✅（抜粋） |
| S04 | SSE「Review your content with the Security Content page」（3.8） | Open in Search、Schedule Saved Search | https://help.splunk.com/en/splunk-enterprise-security-8/security-essentials/use-splunk-security-essentials/3.8/use-content-in-splunk-security-essentials/review-your-content-with-the-security-content-page | ✅（抜粋） |
| S05 | SSE「Use the schemas in Splunk Security Essentials」（3.8） | Known False Positives、How to Respond などの項目 | https://help.splunk.com/en/splunk-enterprise-security-8/security-essentials/develop-custom-content/3.8/configure-content-using-the-showcaseinfo.json-schema/use-the-schemas-in-splunk-security-essentials | ✅（抜粋） |
| S06 | SSE「Edit permissions to provide write access」（3.8） | ブックマークの書き込み権限 | https://help.splunk.com/en/splunk-enterprise-security-8/security-essentials/install-and-configure/3.8/configure-splunk-security-essentials/edit-permissions-to-provide-write-access-to-splunk-security-essentials | ✅（抜粋） |
| S07 | 定期実行のアラートの作成（Splunk Enterprise 10.2のページ） | 保存画面の項目（名前、スケジュール、トリガー条件、抑制、アクション） | https://help.splunk.com/en/splunk-enterprise/alert-and-respond/alerting-manual/10.2/create-alerts/create-scheduled-alerts | ✅（抜粋） |
| S08 | 抑制（Throttle）、トリガー条件（Splunk Cloud） | 抑制の期間、フィールドごとの抑制 | https://help.splunk.com/en/splunk-cloud-platform/alert-and-respond/alerting-manual/9.2.2406/manage-alert-trigger-conditions-and-throttling/throttle-alerts | ✅（抜粋） |
| S09 | トリガーされたアラート（Splunk Cloud 10.1.2507） | 「トリガーされたアラートに追加」のあるアラートだけ表示、既定で24時間 | https://help.splunk.com/en/splunk-cloud-platform/alert-and-respond/alerting-manual/10.1.2507/view-and-update-alerts/triggered-alerts | ✅（抜粋） |
| S10 | アラートの権限、cronの時刻（Splunk Cloud 10.6） | `schedule_search`、UTC | https://docs.splunk.com/Documentation/SplunkCloud/latest/Alert/AlertPermissions ／ https://help.splunk.com/en/splunk-cloud-platform/alert-and-respond/alerting-manual/10.6/create-alerts/use-cron-expressions-for-alert-scheduling | ✅（抜粋） |
| S11 | CSVルックアップの定義（Splunk Cloud 9.2.2406） | `upload_lookup_files` の権限 | https://help.splunk.com/en/splunk-cloud-platform/manage-knowledge-objects/knowledge-management-manual/9.2.2406/use-lookups-in-splunk-web/define-a-csv-lookup-in-splunk-web | ✅（抜粋） |
| S12 | Cloud Monitoring Console（検索の利用状況、ユーザーの利用状況） | ユーザーごとの検索・ダッシュボードの利用 | https://help.splunk.com/en/splunk-cloud-platform/administer/admin-manual/10.3.2512/monitor-your-splunk-cloud-platform-deployment/use-the-search-dashboards/analyze-search-usage-statistics ／ https://help.splunk.com/en/splunk-cloud-platform/administer/admin-manual/9.3.2408/monitor-your-splunk-cloud-platform-deployment/use-the-usage-dashboards/view-user-activity | ✅（抜粋） |
| S13 | Splunk Webの表示言語 | ja_JP | https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/9.4/manage-users/configure-user-language-and-locale | ✅（抜粋） |
| S14 | Splunk Cloudのメンテナンス方針 | 常に最新の版、機能更新は月に最大2回 | https://www.splunk.com/en_us/legal/splunk-cloud-platform-maintenance-policy.html | ✅（抜粋） |
| S15 | ESのエディション（Essentials／Premier。SSEとは別物） | Overview of Splunk Enterprise Security Editions | https://help.splunk.com/en/splunk-enterprise-security-8/enterprise-security-editions | ✅（抜粋） |
| S16 | Splunk Community「build a siem without Enterprise security app」 | ESなしでSIEMを運用する場合の負担 | https://community.splunk.com/t5/Splunk-Enterprise-Security/biuld-a-siem-without-Enterprise-security-app/m-p/547650 | ✅（抜粋） |

### テックタッチ

| ID | 出典 | 該当箇所 | URL | 確認 |
|---|---|---|---|---|
| R05／R06 | テックタッチ「共に創り、共に学ぶ―テックタッチ初の大型ユーザーイベント『CO-DEVELOPERS DAY '26』開催レポート」2026/8/28（イベントは2026/7/8） | 事例①河合塾（30ステップ超のガイドが再生されず失敗）、事例⑤オープンハウス・アーキテクト（AI Hub） | https://techtouch.jp/media/20260828_co-developers-day2026 ／ プレスリリース https://techtouch.jp/news/20260828_codevelopersday26 | ✅／⚠（抜粋。文言の一部は未確認） |
| R07 | テックタッチ「テックタッチAI Hubに関する特約」 | 社内資料のナレッジベースへの登録と加工、プロンプトと回答の記録（利用者が選んだ場合だけ保存）、お客様のAI環境の接続 | https://techtouch.jp/special-terms_ai-hub/ | ⚠（ページと上記の内容は抜粋で確認。GPT版の改訂日「2026/8/10」と第4・5・7条の条番号は未確認） |
| T01 | AI Hub（正式提供）、製品ページ | 2025年2月13日。社内資料の検索、監査ログ | https://techtouch.jp/news/20250213dapai/ ／ https://techtouch.jp/ai_hub/ | ✅（抜粋） |
| T02 | 操作ナビ・ツールチップ・入力チェック・条件分岐 | 機能一覧 | https://techtouch.jp/solution/ex/ | ✅（抜粋） |
| T03 | テックタッチ アナリティクス（2022/9/28）、フローティングバナー（2025/6/13）、AIリカバリー（β版、2025/8） | — | https://prtimes.jp/main/html/rd/p/000000079.000048939.html ／ https://prtimes.jp/main/html/rd/p/000000301.000048939.html ／ https://prtimes.jp/main/html/rd/p/000000333.000048939.html | ✅（抜粋） |
| T04 | LGWANへの対応（2025/3/10）、開発者ブログ（iframeとShadow DOM） | — | https://techtouch.jp/news/20250310_lgwan/ ／ https://tech.techtouch.jp/entry/typescript-declaration-merging-benefits | ✅（抜粋） |
| T05 | ISO/IEC 27017の取得（2025/2/26）、情報セキュリティへの取り組み | — | https://techtouch.jp/news/20250226isoiec27017/ ／ https://techtouch.jp/information-security/ | ✅（抜粋） |

### 乗り換えの背景（1.2）

| 出典 | URL | 確認 |
|---|---|---|
| Gartner Peer Insights（Splunk Enterprise Security）のレビュー | https://www.gartner.com/reviews/product/splunk-enterprise-security | ✅（抜粋） |
| PeerSpot（Splunk ESの価格のページ）、G2のレビュー | https://www.itcentralstation.com/products/splunk-enterprise-security-pricing ／ https://www.g2.com/products/splunk-enterprise-security/reviews | ✅（抜粋） |
| Sansan Tech Blog（2020/11/30、2024/12/08） | https://buildersbox.corp-sansan.com/entry/2020/11/30/110000 ／ https://buildersbox.corp-sansan.com/entry/2024/12/08/000000 | ✅（抜粋） |

### 使わなかったもの

- 乗り換え先の各社の「Splunkからの移行」ページ、比較ページ、導入事例。マーケティング資料のためです。
- Splunk社の調査と比較ページ。同じ理由です。
- レビューサイトのAIによる要約。個々のレビューの文だけを使いました。

---

## 付録A．1.0からの変更点

| 箇所 | 変更 | 理由 |
|---|---|---|
| 1.1 | 「熟練者やSIベンダーに依存」を「委託先（MSSP・SIer）や熟練者に寄っている」に広げ、CSIRTを明記 | 営業の課題認識（監視・検知が委託先任せ）に合わせる |
| 1.2 | 乗り換え防止の位置付けを5行で追加 | 目的（Splunkをやめて他製品へ移る前に、使いこなしてもらう）を文書に書く。背景は要点だけ |
| 1.3 | R04を「ベンダー協賛の調査」、R05・R06を「自社事例」と明記 | 評価の根拠は公的機関・利用者の声を正とする。マーケティング資料は根拠にしない |
| 2.2 | AI機能の役割分担表を追加 | AI機能は機能別（Assistant、Agent Mode、ESのAI、RCA、傾向、予測）に分けて評価する |
| 3.2 | 20分版の時間配分を追加 | 15〜20分の枠にも使えるようにする |
| 3.2 | 画面の区別（Splunk／テックタッチ／AI Hub／社内）を追加 | どの製品の画面かを常に示す |
| 3.9 | アラートの設定項目に、抑制・通知先・「トリガーされたアラートに追加」と入力チェックを追加 | Splunk Cloudのアラートの保存画面の項目に合わせる |
| 3.10 | 「アラートカード」を「トリガーされたアラート（Activity）または通知メール」に変更 | ESを使わない構成に、その画面はない |
| 5 | SPLをファイルに分け、期待値をPythonで検算 | 1.0の添付CSV・SPLが手元になかったため再作成。検算は実機の実行ではないと明記 |
| 6 | KB01〜KB05の中身のサンプルを作成 | 1.0はIDと役割だけだった |
| 8.1 | SEに用意していただくもののチェックリストを追加 | 構築依頼として使えるようにする |
| 9 | 先に確かめること・リスクを追加 | テックタッチがSplunk Webで動くか、端末、AIに渡す情報、権限、UTCなど |
| 10 | 想定問答を追加 | 乗り換え・費用・ES・委託先・端末・AI・画面変更への答え方 |
| 11・12 | 出典を一つずつ確認し、確認の状態（✅⚠❌）を付けた | 推測を事実として書かない |
| 1.3・12 | R03・R12・R13を、確認できたレビューに差し替え。R04の数値の対応（63%は予測可能性）と日付を修正。R10を2.3.2の修正一覧に修正し、SAIA-9232を削除。R09のURLを修正。R14・R15を追加 | GPT版の記載が、公開情報の抜粋と一致しなかったため |
| 0・1.6・2.2 | AI Assistantの精度が1年前より上がったことを示す公開の根拠がない旨を明記。AI Hubを脇役にしない理由として書いた | 確認の工程が業務に残ることを、設計の前提にするため |
| mock／aihub | GPT版のモックとナレッジを取り込んだ。モックは、Assistantへの依頼文からテストデータの知識（「ケースC」）を外し、画面の区別、S5の入力チェック、S6のアラート項目、S7の入口を1.1に合わせた。ナレッジはMFAの値をGPT版（approved／failed／not_applicable）にそろえ、CSVも同じ値にした | シナリオ・素材・モックの間で食い違いをなくすため |
| 全体 | 個人名を付けた判断の表記を「営業の見立て」に、「DAP」を「テックタッチ（DAP）」に統一。文体を敬体に統一 | 社外に出る可能性がある文書のため |

## 付録B．ESをお使いのお客様向けの差し替え

| 場面 | Splunk Cloud＋SSE | ESの場合 |
|---|---|---|
| S1・S4 | 検索結果、ダッシュボード | 同じ（加えて検知結果＝findingの画面） |
| S6 | SSEの検知コンテンツ、アラートの保存画面 | ESの検知（detection）の編集画面。検知の版管理 |
| S7 | トリガーされたアラート、追加の検索 | アナリストキューの検知結果、調査（investigation）、対応計画（response plan）、判定（disposition）。ESのAI Assistant in Securityの要約（Splunk Cloudのみ、既定で無効、アカウントチーム経由で有効化との記載） |
| S8 | 社内のチケット管理 | ESの調査のメモと判定 |

ESの画面名（アナリストキュー、検知結果、中間検知）はES 8系の公式ドキュメントの抜粋に合わせています。実際の表示名は実機で確かめてください。
