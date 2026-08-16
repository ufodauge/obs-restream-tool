import type { Result } from "@/libs/result/result";

import type { BoardSettings } from "../settings";
import { generateMmBoard } from "./mm";
import { generateOotBoard } from "./oot";
import type { BoardTask } from "./types";

export type { BoardTask } from "./types";
export { OOT_BINGO_VERSIONS } from "./oot";
export {
  latestMmTaskVersion,
  MM_TASK_VERSIONS,
  type MmTaskVersion,
} from "./mm";

// React 19 の use(promise) で BoardPanel から読む。レンダリングのたびに
// 新しい Promise を作ると（use() は「参照が変わった Promise」を新規の
// サスペンドとして扱うため）無限サスペンドループになる（改善計画 Phase 6）。
// source + version + seed が同じ間は同じ Promise を使い回すよう、
// モジュールレベルの Map にキャッシュする。
const boardTaskPromiseCache = new Map<
  string,
  Promise<Result<BoardTask[], Error>>
>();

const cacheKey = (settings: BoardSettings): string =>
  `${settings.source}:${settings.version}:${settings.seed}`;

export const getBoardTasks = (
  settings: BoardSettings,
): Promise<Result<BoardTask[], Error>> => {
  const key = cacheKey(settings);
  const cached = boardTaskPromiseCache.get(key);
  if (cached) {
    return cached;
  }

  const promise =
    settings.source === "oot"
      ? generateOotBoard(settings.version, settings.seed)
      : generateMmBoard(settings.version, settings.seed);
  boardTaskPromiseCache.set(key, promise);
  return promise;
};
