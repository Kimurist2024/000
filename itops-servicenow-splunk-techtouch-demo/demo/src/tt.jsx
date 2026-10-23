// テックタッチが画面の中に置く要素（React の画面の一部として描くもの）。
import React from "react";

// 注意書き（赤い枠）。× で閉じられる
export function TTNote({ k, text, small, cls, style }) {
  return (
    <div className={"tt-note " + (cls || "pt-down")} id={"tt-note-" + k} style={style} role="note">
      {text}{small && <small>{small}</small>}
      <button type="button" className="x" data-close-note={k} aria-label="閉じる">×</button>
    </div>
  );
}
// テックタッチが画面に置くリンク（別のツールを開き、続きのガイドを再生する）
export function TTLink({ id, label }) {
  return <button type="button" className="tt-chiplink" id={id} data-id={id}>{label}</button>;
}
