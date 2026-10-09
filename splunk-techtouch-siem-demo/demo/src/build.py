#!/usr/bin/env python3
"""Splunk公式UI部品版のイメージデモを1ファイルのHTMLに組み立てる。
使い方: cd demo/src && npm install && python3 build.py   → ../index.html を書き出す
公開してはいけない文言は DEMO_FORBID（カンマ区切り）で確かめる。"""
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = HERE
DIST = os.path.join(HERE, "dist")
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(HERE), "index.html")
os.makedirs(DIST, exist_ok=True)
subprocess.run(["npx", "esbuild", os.path.join(SRC, "main.jsx"), "--bundle", "--minify", "--loader:.js=jsx", "--jsx=automatic",
                "--define:process.env.NODE_ENV=\"production\"", "--outfile=" + os.path.join(DIST, "app.js"), "--log-level=warning"], cwd=HERE, check=True)
rd = lambda p: open(p, encoding="utf-8").read()
js = rd(os.path.join(DIST, "app.js")).replace("</script", "<\\/script")
css = rd(os.path.join(DIST, "app.css"))
html = ("<!DOCTYPE html>\n<html lang=\"ja\">\n<head>\n<meta charset=\"utf-8\">\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n"
        "<title>Splunk Cloud×テックタッチ SIEM/SOC活用デモ（イメージ）</title>\n<style>\n" + css + "\n</style>\n</head>\n<body>\n" +
        rd(os.path.join(SRC, "body.html")).strip("\n") + "\n\n<script>\n" + js + "\n</script>\n</body>\n</html>\n")
for bad in [b for b in os.environ.get("DEMO_FORBID", "").split(",") if b]:
    assert bad not in html, bad
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write(html)
print("ok", len(html.encode("utf-8")), "->", OUT)
