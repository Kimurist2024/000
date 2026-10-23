#!/usr/bin/env python3
"""ServiceNow×Splunk（ITSI・サーチとレポート）×テックタッチのイメージデモを1ファイルのHTMLに組み立てる。
使い方: cd demo/src && npm install && python3 build.py   → ../index.html を書き出す
公開してはいけない文言は DEMO_FORBID（カンマ区切り）で確かめる。英数字だけの語は単語の区切りで、それ以外は部分一致で調べる。"""
import os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(HERE, "dist")
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(HERE), "index.html")
os.makedirs(DIST, exist_ok=True)
subprocess.run(["npx", "esbuild", os.path.join(HERE, "main.jsx"), "--bundle", "--minify", "--loader:.js=jsx", "--jsx=automatic",
                "--define:process.env.NODE_ENV=\"production\"", "--outfile=" + os.path.join(DIST, "app.js"), "--log-level=warning"], cwd=HERE, check=True)
rd = lambda p: open(p, encoding="utf-8").read()
js = rd(os.path.join(DIST, "app.js")).replace("</script", "<\\/script")
css = rd(os.path.join(DIST, "app.css"))
html = ("<!DOCTYPE html>\n<html lang=\"ja\">\n<head>\n<meta charset=\"utf-8\">\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n"
        "<title>IT運用×テックタッチ ServiceNow・Splunkデモ（イメージ）</title>\n<style>\n" + css + "\n</style>\n</head>\n<body>\n" +
        rd(os.path.join(HERE, "body.html")).strip("\n") + "\n\n<script>\n" + js + "\n</script>\n</body>\n</html>\n")
# 同梱したJavaScriptでは日本語が \uXXXX の形に変換されるため、元の文字に戻してから調べる
plain = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), html)
for bad in [b for b in os.environ.get("DEMO_FORBID", "").split(",") if b]:
    if re.fullmatch(r"[A-Za-z0-9.&_-]+", bad):
        assert not re.search(r"(?<![A-Za-z0-9])" + re.escape(bad) + r"(?![A-Za-z0-9])", plain), bad
    else:
        assert bad not in plain, bad
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write(html)
print("ok", len(html.encode("utf-8")), "->", OUT)
