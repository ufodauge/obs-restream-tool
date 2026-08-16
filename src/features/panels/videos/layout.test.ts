import { describe, expect, it } from "vitest";

import { packGrid, type PixelRect } from "./layout";

const rectsOverlap = (a: PixelRect, b: PixelRect): boolean =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

const definedRects = (rects: readonly (PixelRect | undefined)[]): PixelRect[] =>
  rects.filter((rect): rect is PixelRect => rect !== undefined);

const assertNoOverlaps = (rects: readonly PixelRect[]): void => {
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      expect(
        rectsOverlap(rects[i], rects[j]),
        `rect ${i} ${JSON.stringify(rects[i])} overlaps rect ${j} ${JSON.stringify(rects[j])}`,
      ).toBe(false);
    }
  }
};

describe("packGrid", () => {
  it("packs mixed size-1/size-2 items row-major, size-descending, dense-first", () => {
    // 呼び出し側（obsConnection.ts / selectEnabledPanelsWithSlotIndex）の
    // 前提どおり size 降順で渡す。
    const rects = packGrid(
      [2, 1, 1, 1, 1],
      { cols: 3, rows: 3 },
      { x: 0, y: 0, width: 300, height: 300 },
    );

    expect(rects).toEqual([
      { x: 0, y: 0, width: 200, height: 200 },
      { x: 200, y: 0, width: 100, height: 100 },
      { x: 200, y: 100, width: 100, height: 100 },
      { x: 0, y: 200, width: 100, height: 100 },
      { x: 100, y: 200, width: 100, height: 100 },
    ]);
    assertNoOverlaps(definedRects(rects));
  });

  it("returns undefined for items that don't fit in the grid", () => {
    const rects = packGrid(
      [1, 1],
      { cols: 1, rows: 1 },
      { x: 0, y: 0, width: 50, height: 50 },
    );

    expect(rects[0]).toEqual({ x: 0, y: 0, width: 50, height: 50 });
    expect(rects[1]).toBeUndefined();
  });

  it("returns undefined for a size-2 item that can't fit even when smaller items after it still find room", () => {
    // 3 cols x 2 rows: 最初の 2x2 で (0,0)-(1,1) を占有すると、2 つ目の
    // 2x2 はどこにも置けない（残り列が 1 列分しかない）が、続く size 1 は
    // まだ空いている (0,2) に置ける。
    const rects = packGrid(
      [2, 2, 1],
      { cols: 3, rows: 2 },
      { x: 0, y: 0, width: 300, height: 200 },
    );

    expect(rects[0]).toEqual({ x: 0, y: 0, width: 200, height: 200 });
    expect(rects[1]).toBeUndefined();
    expect(rects[2]).toEqual({ x: 200, y: 0, width: 100, height: 100 });
    assertNoOverlaps(definedRects(rects));
  });

  it("never produces overlapping rects across a variety of grid/size combinations", () => {
    // assertNoOverlaps 内で expect() を呼んでいるが、vitest(expect-expect) は
    // ヘルパー関数越しの assertion までは静的に追えないため明示しておく。
    expect.hasAssertions();

    const cases: { sizes: (1 | 2)[]; cols: number; rows: number }[] = [
      { sizes: [2, 2, 2, 2], cols: 4, rows: 4 },
      { sizes: [1, 1, 1, 1, 1, 1, 1, 1, 1], cols: 3, rows: 3 },
      { sizes: [2, 1, 2, 1, 2, 1], cols: 4, rows: 3 },
      { sizes: [2, 2, 1, 1, 1, 1, 1, 1], cols: 5, rows: 3 },
      { sizes: [1], cols: 1, rows: 1 },
    ];

    for (const { sizes, cols, rows } of cases) {
      const rects = packGrid(
        sizes,
        { cols, rows },
        { x: 10, y: 20, width: cols * 100, height: rows * 90 },
      );
      assertNoOverlaps(definedRects(rects));
    }
  });

  it("offsets rects by the area's origin, not just 0,0", () => {
    const rects = packGrid(
      [1],
      { cols: 2, rows: 2 },
      { x: 50, y: 75, width: 200, height: 200 },
    );
    expect(rects[0]).toEqual({ x: 50, y: 75, width: 100, height: 100 });
  });

  describe("gap", () => {
    it("defaults to 0 (no behavior change from before gap existed)", () => {
      const withoutGapArg = packGrid(
        [1, 1],
        { cols: 2, rows: 1 },
        { x: 0, y: 0, width: 200, height: 100 },
      );
      const withExplicitZero = packGrid(
        [1, 1],
        { cols: 2, rows: 1 },
        { x: 0, y: 0, width: 200, height: 100 },
        0,
      );
      expect(withoutGapArg).toEqual(withExplicitZero);
      expect(withoutGapArg).toEqual([
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 100, y: 0, width: 100, height: 100 },
      ]);
    });

    it("insets adjacent size-1 cells by gap, split evenly, without touching the area's outer edge", () => {
      // cols=2, area width 200 (cell 100), gap 20: 左セルの右端・右セルの
      // 左端だけそれぞれ 10px ずつ削られ、外側（左端の左・右端の右）は
      // area の端のまま動かない。
      const rects = packGrid(
        [1, 1],
        { cols: 2, rows: 1 },
        { x: 0, y: 0, width: 200, height: 100 },
        20,
      );
      expect(rects).toEqual([
        { x: 0, y: 0, width: 90, height: 100 },
        { x: 110, y: 0, width: 90, height: 100 },
      ]);
      assertNoOverlaps(definedRects(rects));
      // 90 (左) + 20 (gap) + 90 (右) = 200 = area の幅、と辻褄が合う。
      expect(90 + 20 + 90).toBe(200);
    });

    it("lets a size-2 item absorb the interior gap it spans, insetting only on its own outer edges", () => {
      // 3 cols x 2 rows, cell 100x100, gap 30. sizes=[2, 1]:
      // - size 2 は (0,0)-(1,1) を占有。上下左は area の外周に接するので
      //   インセット無し。右だけ size 1 と隣接するので gap/2=15px
      //   インセットされ、幅は 200-15=185（跨いだ col0-col1 の内部境界は
      //   インセットしない = 2 重にインセットして gap 分小さくなり
      //   すぎることを避ける、というのがここでの決め）。
      // - size 1 は (0,2)。左が size 2 と隣接するので 15px、下が area の
      //   最終行との境界なので同じく 15px インセットされ、85x85 になる。
      const rects = packGrid(
        [2, 1],
        { cols: 3, rows: 2 },
        { x: 0, y: 0, width: 300, height: 200 },
        30,
      );
      expect(rects).toEqual([
        { x: 0, y: 0, width: 185, height: 200 },
        { x: 215, y: 0, width: 85, height: 85 },
      ]);
      assertNoOverlaps(definedRects(rects));
      // 二つの矩形の間の gap がちょうど 30px であることも直接確認しておく。
      expect(215 - (0 + 185)).toBe(30);
    });

    it("a size-2 item spanning the whole grid dimension has no interior boundary to absorb, so gap has no effect on it", () => {
      const rects = packGrid(
        [2],
        { cols: 2, rows: 2 },
        { x: 0, y: 0, width: 200, height: 200 },
        40,
      );
      expect(rects).toEqual([{ x: 0, y: 0, width: 200, height: 200 }]);
    });
  });
});
