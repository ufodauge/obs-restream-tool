export type UnitSize = 1 | 2;

export interface PixelRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GridSpec {
  cols: number;
  rows: number;
}

/**
 * grid 上の 1 セル (row, col) から size x size 分の矩形を、gap（セル間の
 * 隙間、px）込みで計算する。
 *
 * gap は CSS Grid の `gap` プロパティと同じ意味を持たせてある: セルと
 * セルの「境界」にだけ挿入され、area の外周（グリッド全体の端）には
 * 挿入されない。size 2 のようにセルを跨ぐ要素は、跨いだ内部の境界では
 * インセットしない — ちょうど CSS Grid で grid-column: span 2 の要素が
 * 中間の gap を吸収するのと同じ考え方（要素の外側の境界でだけ gap/2 ずつ
 * 詰める。内側の境界で 2 重にインセットすると、size 2 の要素が
 * gap 分だけ余計に小さくなってしまう）。
 *
 * packGrid（詰め込み結果）と obsSetup.ts（seed 用の仮配置・ブラウザソースの
 * 初期解像度）の両方から同じジオメトリを使うための共有ヘルパー。
 */
export const cellRect = (
  row: number,
  col: number,
  size: UnitSize,
  grid: GridSpec,
  area: PixelRect,
  gap: number,
): PixelRect => {
  const cellWidth = area.width / grid.cols;
  const cellHeight = area.height / grid.rows;

  const left = area.x + col * cellWidth + (col === 0 ? 0 : gap / 2);
  const top = area.y + row * cellHeight + (row === 0 ? 0 : gap / 2);
  const right =
    area.x +
    (col + size) * cellWidth -
    (col + size === grid.cols ? 0 : gap / 2);
  const bottom =
    area.y +
    (row + size) * cellHeight -
    (row + size === grid.rows ? 0 : gap / 2);

  return { x: left, y: top, width: right - left, height: bottom - top };
};

/**
 * cols x rows の単位グリッドに、サイズ 1 (1x1) / 2 (2x2) の要素を
 * 行優先・空き最初優先（CSS Grid の grid-flow-row-dense に近い挙動）で詰め込む。
 *
 * 大きい要素から先に渡すとパッキング効率が良くなる（呼び出し側で size 降順に
 * ソートしておくことを想定 — panels.ts の selectEnabledPanelsWithSlotIndex が
 * 既にその順序）。
 *
 * area に収まりきらなかった要素には undefined を返す。呼び出し側で
 * 「対応する OBS ソースを非表示にする」といったハンドリングをする。
 *
 * gap（省略時 0 = 従来どおり隙間なし）は cellRect に丸投げする。CSS では
 * 実現できないことに注意: 各動画スロットは OBS 側の独立した Browser Source
 * であり、slot.html 内の CSS margin/padding では他のソースとの間隔を
 * 動かせない（ソース自身の矩形の中身が縮むだけ）。そのため gap は
 * ここで矩形そのものをインセットする形で反映する。
 */
export const packGrid = (
  sizes: readonly UnitSize[],
  grid: GridSpec,
  area: PixelRect,
  gap = 0,
): (PixelRect | undefined)[] => {
  const occupied: boolean[][] = Array.from({ length: grid.rows }, () =>
    Array<boolean>(grid.cols).fill(false),
  );

  const canPlace = (row: number, col: number, size: UnitSize): boolean => {
    if (col + size > grid.cols || row + size > grid.rows) {
      return false;
    }

    for (let r = row; r < row + size; r++) {
      for (let c = col; c < col + size; c++) {
        if (occupied[r][c]) {
          return false;
        }
      }
    }

    return true;
  };

  const place = (row: number, col: number, size: UnitSize): void => {
    for (let r = row; r < row + size; r++) {
      for (let c = col; c < col + size; c++) {
        occupied[r][c] = true;
      }
    }
  };

  return sizes.map((size) => {
    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        if (canPlace(row, col, size)) {
          place(row, col, size);
          return cellRect(row, col, size, grid, area, gap);
        }
      }
    }

    return undefined;
  });
};
