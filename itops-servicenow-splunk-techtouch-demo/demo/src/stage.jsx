// 画面の切り替え（全体像／ServiceNow／Splunk ITSI／サーチとレポート）と、ブラウザ枠（タブ・アドレス）。
import React from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { SplunkThemeProvider } from "@splunk/themes";
import { setSharedTranslator } from "@splunk/ui-utils/i18n";
import { Overview } from "./overview.jsx";
import { SnowApp } from "./snow.jsx";
import { ItsiApp, SearchApp } from "./splunk.jsx";
import { TPL, INC, TASK, SAVED } from "./data.js";
import { JA } from "./ja.js";

// Splunk 公式の部品は Splunk Web の翻訳（window.gettext）で日本語になる。ここでは画面に出る語だけを対応表で訳す
setSharedTranslator((m) => (JA[m] !== undefined ? JA[m] : m));

let root = null;
export function mountStage(el) { root = createRoot(el); }

const TEXTS = { sokuho: TPL.sokuho, kiriwake: TPL.kiriwake + TPL.kiriwakeFill + TPL.kiriwakeTail, monthly: TPL.monthly };

function Stage({ ch, c }) {
  if (c.app === "overview") return <Overview />;
  if (c.app === "snow") return <SnowApp c={c} ch={ch} texts={TEXTS} />;
  return (
    <SplunkThemeProvider family="enterprise" colorScheme="dark" density="comfortable">
      {c.app === "itsi" ? <ItsiApp c={c} /> : <SearchApp c={c} />}
    </SplunkThemeProvider>
  );
}

/* ブラウザ枠：タブとアドレス（ドメインは文書用の予約名 .example で、架空） */
const SN_HOST = "itsm.a-corp.example", SP_HOST = "a-corp.splunkcloud.example";
function tabsFor(ch, c) {
  const sn = c.view === "inc-list" ? ["インシデント | ServiceNow", "/now/nav/ui/classic/params/target/incident_list.do"]
    : c.view === "task-list" ? ["タスク | ServiceNow", "/now/nav/ui/classic/params/target/task_list.do"]
    : c.view === "task-form" || ch >= 7 ? [TASK.number + " | タスク | ServiceNow", "/now/nav/ui/classic/params/target/task.do%3Fsys_id%3D7c1e…"]
    : [INC.number + " | インシデント | ServiceNow", "/now/nav/ui/classic/params/target/incident.do%3Fsys_id%3D9a4f…"];
  const spv = c.app === "snow" ? (ch >= 7 ? "report" : "search") : c.view;
  const sp = spv === "episodes" ? ["Episode Review | Splunk", "/ja-JP/app/itsi/itsi_event_management"]
    : spv === "sa" ? ["Service Analyzer | Splunk", "/ja-JP/app/itsi/homeview"]
    : spv === "deepdive" ? ["Deep Dive | Splunk", "/ja-JP/app/itsi/deep_dive"]
    : spv === "search" ? [SAVED.title + " | Splunk", "/ja-JP/app/search/search?s=%2FservicesNS%2Funyo_kiban%2Fsearch%2Fsaved%2Fsearches%2F…"]
    : spv === "reports" ? ["レポート | Splunk", "/ja-JP/app/search/reports"]
    : ["稼働統計_月次_全システム | Splunk", "/ja-JP/app/search/report?s=%2FservicesNS%2Funyo_kiban%2Fsearch%2Fsaved%2Fsearches%2F…"];
  const spOpen = (ch >= 3 && ch <= 6) || ch >= 8;
  const tabs = [{ k: "sn", t: sn[0], on: c.app === "snow", host: SN_HOST, path: sn[1] }];
  if (spOpen || c.app === "itsi" || c.app === "search") tabs.push({ k: "sp", t: sp[0], on: c.app === "itsi" || c.app === "search", host: SP_HOST, path: sp[1] });
  return tabs;
}
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
function winBarHTML(ch, c) {
  if (c.app === "overview") return '<div class="win-tabs"><span class="win-tab on"><span class="tx">全体像（説明用）</span></span></div>';
  const tabs = tabsFor(ch, c), on = tabs.find((t) => t.on) || tabs[0];
  return '<div class="win-tabs">' + tabs.map((t) => '<span class="win-tab' + (t.on ? " on" : "") + '"><span class="fav ' + t.k + '">' + (t.k === "sn" ? "n" : "&gt;") + '</span><span class="tx">' + esc(t.t) + '</span><span class="x">×</span></span>').join("") + '<span class="win-plus">＋</span></div>' +
    '<div class="win-addr"><span class="win-nav" aria-hidden="true"><span>←</span><span>→</span><span>↻</span></span><span class="win-url" aria-label="アドレス（架空）"><svg aria-hidden="true" width="11" height="12" viewBox="0 0 11 12"><rect x="1" y="5" width="9" height="7" rx="1.5" fill="currentColor"/><path d="M3 5V3.5a2.5 2.5 0 0 1 5 0V5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg><span class="host">' + on.host + '</span><span class="path">' + esc(on.path) + '</span></span><span class="win-ext" title="テックタッチ（拡張機能）"><i></i></span></div>';
}

export function renderStage(snap) {
  document.getElementById("win-bar").innerHTML = winBarHTML(snap.ch, snap.c);
  flushSync(() => root.render(<Stage {...snap} />));
}
