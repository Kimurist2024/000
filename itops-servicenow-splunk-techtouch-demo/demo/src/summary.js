// 振り返り（場面10）。HTML文字列で組む。
import { CH } from "./content.js";

export function summaryHTML(stats) {
  const any = stats.steps > 0;
  const stat = (v, label) => '<div class="stat"><b>' + (any ? v : "—") + "</b><span>" + label + "</span></div>";
  const tl = (t, tool, title, desc) => '<li><span class="t">' + t + '</span><span class="tool-chip ' + tool[0] + '">' + tool[1] + '</span><div class="body"><b>' + title + "</b><span>" + desc + "</span></div></li>";
  const SN = ["sn", "ServiceNow"], IT = ["sp", "ITSI"], SR = ["sp", "サーチとレポート"];
  const asks = (ns) => '<ul class="sum-list">' + ns.map((n) => "<li>" + CH[n].ask + "</li>").join("") + "</ul>";
  const row = (tool, items) => "<tr><th>" + tool + "</th><td><ul>" + items.map((i) => "<li>" + i + "</li>").join("") + "</ul></td></tr>";
  return '<div class="sum-grid">' +
    '<section class="sum-card wide"><h2>今日の流れ（架空）</h2><div class="lanes">' +
    '<div class="lane"><h3>前半：夜間の一次切り分け（10月21日 22:41〜22:58・夜間当番）</h3><ol class="tl">' +
    tl("22:41", SN, "受け取り・速報", "ステータスを処理中に。作業メモのチェック忘れを止め、速報はテンプレートで") +
    tl("22:47", IT, "エピソードの受け取り", "Acknowledgeで受け取りを記録。ITSIでは閉じない（記録の正はServiceNow）。Events Timelineで順番を見る") +
    tl("22:49", IT, "見る順番", "業務 → 基盤 → 連携。赤が同時に並んでも原因を断定しない") +
    tl("22:50", SR, "裏付け", "サーチ文は変えず、時間範囲だけを選ぶ。事実を時刻の早い順に読む") +
    tl("22:58", SN, "引き継ぎ", "決まった形で作業メモ。未確認のことの書き漏れを止める。渡す先を基準で選ぶ") +
    '</ol></div><div class="lane"><h3>後半：月1回の稼働統計（11月4日 9:32〜9:50・運用基盤チーム）</h3><ol class="tl">' +
    tl("9:32", SN, "タスクの開始", "月1回の作業でも、手順を覚えていなくても始められる") +
    tl("9:41", SR, "レポートの出力", "旧版のレポートと「過去30日間」の取り違えを止める。ファイル名は自動入力") +
    tl("9:48", SN, "添付・クローズ", "期間・レポート名・行数を記録し、「クローズ（完了）」で閉じる") +
    '</ol><p class="sum-note">前半の障害（10月21日の約38分）は、後半の稼働統計の数字に表れています。</p></div></div></section>' +

    '<section class="sum-card wide"><h2>ツールごとに、画面の上に置いたもの</h2><table class="sum-table"><tbody>' +
    row("ServiceNow", ["テンプレートの挿入（速報・切り分け結果・月次）", "入力チェック（ステータス・作業メモのチェック・未確認のこと・クローズの種類）", "アサイン先グループの選び方（？で基準を表示）", "自動入力（ウォッチリスト・作業メモリスト・アサイン先）", "注意書き（顧客に見える欄・連絡の経路・ベンダーへの依頼）"]) +
    row("Splunk ITSI", ["見る順番（業務 → 基盤 → 連携）", "閉じる場所の決まり（状態の選び直しを止める）", "原因を断定しない、という決まり（注意書き）", "保存済みサーチへのリンク"]) +
    row("サーチとレポート", ["時間範囲の選び方（広すぎ・狭すぎを理由つきで止める）", "正しいレポートの選び方（旧版を止める）", "ファイル名の自動入力", "エクスポートしてよい人の決まり（注意書き）"]) +
    row("Zabbix・JP1（このデモでは図だけ）", ["Web画面であれば同じ仕組みで載る想定。製品と画面の種類によるため要検証"]) +
    "</tbody></table></section>" +

    '<section class="sum-card"><h2>三者にとっての意味</h2><dl class="kv3">' +
    "<dt>現場（夜間当番・運用基盤チーム）</dt><dd>手順書を探さずに、画面の上で次の一手がわかる。月1回の作業でも迷わない。</dd>" +
    "<dt>運用設計・構築の担当（社内・ベンダー）</dt><dd>作った画面と手順の意図が、そのまま現場に届く。辿れなかった箇所がわかり、手順と画面の直しに返せる。</dd>" +
    "<dt>情報システム部門の管理者</dt><dd>ツールを替えずに、社内の決まり（閉じる場所・渡す先・連絡の経路）を、どの画面でも同じ形で守れる。</dd></dl></section>" +

    '<section class="sum-card"><h2>このデモで、テックタッチが手当てした場面</h2><div class="stats">' +
    stat(stats.steps, "ガイドで進めたステップ") + stat(stats.fixes, "選び直し・入力の案内") + stat(stats.notes, "基準・注意書きの表示") + "</div>" +
    '<p class="sum-note">' + (any ? "このデモを操作した回数です。効果の数値ではありません。" : "場面を順に進めると、操作した回数を数えます。効果の数値ではありません。") + "</p>" +
    '<h2 class="mt">確かめ方（案）</h2><ul class="sum-list"><li>起票から有識者への割り当てまでの時間</li><li>再割り当ての件数（渡す先の取り違え）</li><li>作業メモの書き漏れ（未確認のこと・次回の連絡）</li><li>月次作業の手戻り（旧版・期間の取り違え）</li></ul>' +
    '<p class="sum-note">数値はお約束しません。現状を伺ってから、一つの作業で測って確かめます。</p></section>' +

    '<section class="sum-card wide"><h2>本日伺いたいこと</h2><div class="lanes"><div class="lane"><h3>夜間の一次切り分け</h3>' + asks([1, 2, 3, 4, 5, 6]) +
    '</div><div class="lane"><h3>定期の作業</h3>' + asks([7, 8, 9]) + "</div></div></section>" +

    '<section class="sum-card wide"><h2>最初の一歩</h2><p class="flow3"><span>先に確かめる（端末と拡張機能の配布・画面の種類・ドメインをまたぐ動き）</span><span class="arrow">→</span><span>一つの作業（一次切り分けか月次作業）を実画面で確かめる</span><span class="arrow">→</span><span>変化を測る</span></p>' +
    '<p class="sum-note">企業・人物・サービス・数値はすべて架空です。ServiceNowとSplunkの画面は画面イメージで、実画面の写しではありません。実画面での動作確認は、最初に行います。</p></section></div>';
}
