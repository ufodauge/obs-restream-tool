/**
 * https://ufodauge.github.io/mm-bingo/task.js の型宣言。
 *
 * URL 経由の動的 import（./mm.ts の import("https://...") 呼び出し。
 * vite に静的解析させないための @vite-ignore コメント付き）には型が
 * 付かないため、公開されている task.d.ts
 * （https://ufodauge.github.io/mm-bingo/task.d.ts、2026-08-16 に取得して
 * 実測した内容）を元にここへベンダリングし、ambient module 宣言として
 * 当てる。TypeScript の dynamic import() は「文字列リテラルを直接渡した
 * 場合」のみこの宣言を使って型解決される（変数経由だと any になる。
 * 実測で確認済み）ため、mm.ts 側では必ずリテラルのまま import() に渡すこと。
 *
 * trackers 配下のプロパティ型は上流では valibot の型
 * （vb.InferOutput<typeof trackerXxxParamsSchema>）から導出されているが、
 * このアプリでは trackers を未使用（改善計画 Phase 6 の「将来」項目）。
 * valibot を型のためだけに依存へ足すのは本末転倒なので、ここでは緩く
 * Record<string, unknown> にしている。実際に使うことになったら
 * mm-bingo 側の schema.ts を見ながら書き直すこと。
 */
declare module "https://ufodauge.github.io/mm-bingo/task.js" {
  export type TaskVersion =
    | "v20260208"
    | "v20260409"
    | "v20260419"
    | "v20260718";

  export type LineType = string;

  export type Tracker = {
    type: "counter" | "heart-piece" | "toggler";
    properties: Record<string, unknown>;
  };

  export type Task = {
    difficulty: number;
    // 実測では { ja: string; en: string } だが、d.ts 上の宣言は
    // Partial<Record<string, string>>（キーが動的に増える余地がある）。
    text: Partial<Record<string, string>>;
    tags: Set<string>;
    lineTypes: LineType[];
    trackers: Tracker[];
    isFallback?: boolean;
  };

  export type Ok<T> = {
    ok: true;
    value: T;
    unwrapOr: <U>(or: U) => T;
    unwrapOrElse: <U>(fn: () => U) => T;
  };

  export type Err<E extends Error> = {
    ok: false;
    error: E;
    unwrapOr: <U>(or: U) => U;
    unwrapOrElse: <U>(fn: () => U) => U;
  };

  export type Result<T, E extends Error> = Ok<T> | Err<E>;

  export const ALGORITHM_BY_VERSION: Record<
    TaskVersion,
    "legacy" | "resilient"
  >;

  export const emptyTask: Task;

  export const generateTasksAsync: (
    seed: number,
    version: TaskVersion,
  ) => Promise<Result<Task[], Error>>;

  export const isEmptyTask: (task: Task) => boolean;

  export const isFallbackTask: (task: Task) => boolean;

  /**
   * tasks/ の fetch 先を変更する。デフォルト（無指定）は import.meta.url を
   * 基準に解決するため、このアプリ（このオリジンから見ればあくまで
   * 「外部」）からは呼ぶ必要が無い ── 以前はここが `/mm-bingo` 決め打ちで
   * 壊れていたが、上流で修正済み（実測で確認済み。改善計画 Phase 6 参照）。
   * vitest 側で実データを使う検証にのみ使用する。
   */
  export const setTasksBaseUrl: (base: string) => void;
}
