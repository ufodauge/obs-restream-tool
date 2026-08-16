import type {
  Task,
  TaskVersion,
} from "https://ufodauge.github.io/mm-bingo/task.js";

import { err, ok, type Result } from "@/libs/result/result";

import type { BoardTask } from "./types";

export type MmTaskVersion = TaskVersion;

// task.js 自体は実行時に動的 import する（バンドルしない）ため、フォームの
// <select> を同期的に描画するにはここで静的にバージョン一覧を持つしかない。
// 上流の ALGORITHM_BY_VERSION のキーと同じ（https://ufodauge.github.io/
// mm-bingo/task.d.ts、2026-08-16 に取得して実測した内容）。上流にバージョンが
// 増えたらここも追記する。
export const MM_TASK_VERSIONS: readonly MmTaskVersion[] = [
  "v20260208",
  "v20260409",
  "v20260419",
  "v20260718",
];

// 一覧の末尾 = 上流での最新版という並び順（task.d.ts の union 順）に合わせる。
export const latestMmTaskVersion: MmTaskVersion =
  MM_TASK_VERSIONS[MM_TASK_VERSIONS.length - 1];

const toBoardTask = (task: Task, seed: number, index: number): BoardTask => ({
  // mm-bingo の Task に id が無いため、row-major で安定した index を
  // 使う（改善計画 Phase 6 の調査結果どおり）。
  key: `${seed}-${index}`,
  label: task.text.ja ?? task.text.en ?? "",
});

/**
 * mm-bingo（https://ufodauge.github.io/mm-bingo/task.js）からタスクを
 * 取得してボード用の共通形（BoardTask[]）に正規化する。
 *
 * OBS の Browser Source 内でレンダリング中にネットワーク fetch が走る
 * （task.js 自体の動的 import + tasks/*.json の fetch の 2 段階）ため、
 * オフラインや GitHub Pages 側の障害で失敗しうる。ここで throw すると
 * BoardPanel（Suspense + use()）の外まで例外が伝播し、ボードが真っ白な
 * まま console.error にしか記録が残らない ── このタスクの発端になった
 * mm-bingo 側のバグと同じ壊れ方になる。そのため必ず Result に包んで返し、
 * 呼び出し側（BoardPanel）で明示的にエラー状態を描画させる。
 */
export const generateMmBoard = async (
  version: MmTaskVersion,
  seed: number,
): Promise<Result<BoardTask[], Error>> => {
  try {
    // dynamic import() は文字列リテラルを直接渡した場合のみ mmTask.d.ts の
    // ambient module 宣言で型解決される（変数経由だと any になる。実測で
    // 確認済み）ため、ここではリテラルのまま渡す。@vite-ignore は
    // ビルド時にバンドルしようとするのを止めるための Vite 向け指示。
    const mod = await import(
      /* @vite-ignore */ "https://ufodauge.github.io/mm-bingo/task.js"
    );
    const result = await mod.generateTasksAsync(seed, version);
    if (!result.ok) {
      return err(result.error);
    }
    return ok(
      result.value.map((task, index) => toBoardTask(task, seed, index)),
    );
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error("mm-bingo: タスクの取得に失敗しました", {
            cause: error,
          }),
    );
  }
};
