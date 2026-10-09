#!/usr/bin/env python3
"""Splunk版イメージデモの index.html を組み立てる。base.css・extra.css は Dynatrace 版デモの部品の流用。
使い方: python3 demo/src/build.py  → demo/index.html を書き出す。"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "index.html")
rd = lambda d, n: open(os.path.join(d, n), encoding="utf-8").read()
css = rd(HERE, "base.css").rstrip("\n") + "\n" + rd(HERE, "extra.css").rstrip("\n") + "\n" + rd(HERE, "sp.css")
import re
css = re.sub(r"^/\*.*?\*/\n", "/*\n  Splunk Cloud × テックタッチ SIEM/SOC活用デモ（イメージ）。レイアウト：デモの流れ（9場面＋振り返り）→ 場面説明 → ブラウザ枠の中に\n  「Splunk Webの画面イメージを踏襲した架空画面」（上部バー・アプリバー・本文）→ 重なるテックタッチ（青）／AI Hub（紫）のオーバーレイ → 伺いたいこと。\n  基本の部品は Dynatrace 版デモ（dynatrace-techtouch-full-demo）から流用。--dt-* の変数名はその名残で、色は Splunk Web 風の架空の配色に上書きしている。\n*/\n", css, count=1, flags=re.S)
css = css.replace("Dynatraceの画面イメージ（架空）", "画面イメージ（架空）").replace("ノートブック・Dynatrace Assist", "AI Assistant（流用）").replace("（Dynatraceの機能・イメージ）", "（流用）")
js = "(function () {\n" + "".join(rd(HERE, n) for n in ("helpers.js", "content1.js", "content2.js", "content3.js", "pages.js", "engine.js")) + "\n})();"
html = ("<!DOCTYPE html>\n<html lang=\"ja\">\n<head>\n<meta charset=\"utf-8\">\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n"
        "<title>Splunk Cloud×テックタッチ SIEM/SOC活用デモ（イメージ）</title>\n<style>\n" + css +
        "</style>\n</head>\n<body>\n" + rd(HERE, "body.html").strip("\n") +
        "\n\n<script>\n" + js.strip("\n") + "\n</script>\n</body>\n</html>\n")
# 公開リポジトリに出してはいけない文言（顧客名・個人名など）は、環境変数 DEMO_FORBID にカンマ区切りで渡して確かめる
for bad in [b for b in os.environ.get("DEMO_FORBID", "").split(",") if b]:
    assert bad not in html, bad
assert html.count("Dynatrace") == 1, "Dynatrace の文言が残っている（流用の注記だけを許す）"
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write(html)
print("ok", len(html.encode("utf-8")))
