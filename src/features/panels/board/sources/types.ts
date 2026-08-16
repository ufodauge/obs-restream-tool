/**
 * BoardPanel が実際に描画する「マス 1 つぶん」の中間表現。
 *
 * oot-bingo-lists（同期・バンドル済み）と mm-bingo（非同期・実行時に
 * 動的 import）は生データの形がまったく違う（squares[].goal.name vs
 * text.ja/text.en、id の有無など）ため、BoardPanel 自体はソースの違いを
 * 意識せずに済むよう、両方をこの形に正規化してから渡す（Phase 6）。
 */
export type BoardTask = {
  key: string;
  label: string;
};
