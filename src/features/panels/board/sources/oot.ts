import { generateBingoBoardFromVersion } from "oot-bingo-lists";
import type { BingoVersion } from "oot-bingo-lists";

import { translations } from "@/i18n/ootBingo";
import { err, ok, type Result } from "@/libs/result/result";

import type { BoardTask } from "./types";

// oot-bingo-lists は BingoVersion の一覧を配列としては export していない
// （`BingoVersion` 型と `isBingoVersion` 型ガードのみが公開されている）。
// BoardForm の <select> を同期的に描画するにはここで静的に持つしかない。
// v2.1.2 (node_modules/oot-bingo-lists/build/index.d.ts) 時点の一覧。
// 上流にバージョンが増えたらここも追記する。
export const OOT_BINGO_VERSIONS: readonly BingoVersion[] = [
  "v9.1",
  "v9.2",
  "v9.3",
  "v9.4",
  "v9.5",
  "v9.5.1",
  "v10.0",
  "v10.1",
  "v10.2",
  "v10.3",
  "v10.3.1",
  "v10.3.2",
  "v10.4",
  "v10.5",
  "v10.5.1",
  "v10.6",
];

/**
 * oot-bingo-lists からタスクを生成し、mm 側と共通の形（BoardTask[]）に
 * 正規化する。生成自体は同期処理だが、mm-bingo（generateTasksAsync、
 * Promise を返す）と型を揃えて BoardPanel を単一の経路（use(promise)）で
 * 素朴に保てるように Promise.resolve() で包む（Phase 6 の方針）。
 */
export const generateOotBoard = (
  version: BingoVersion,
  seed: number,
): Promise<Result<BoardTask[], Error>> => {
  const board = generateBingoBoardFromVersion(version, "normal", seed);
  if (!board) {
    return Promise.resolve(
      err(
        new Error(
          `oot-bingo-lists: ボードの生成に失敗しました (version=${version}, seed=${seed})`,
        ),
      ),
    );
  }

  const tasks = board.squares
    .values()
    .map(
      (square): BoardTask => ({
        key: square.goal.id,
        label: translations.get(square.goal.name) ?? square.goal.name,
      }),
    )
    .toArray();

  return Promise.resolve(ok(tasks));
};
