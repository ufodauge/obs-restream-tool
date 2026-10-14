import { isBingoVersion, latestBingoVersion } from "oot-bingo-lists";
import type { BingoVersion } from "oot-bingo-lists";
import * as v from "valibot";

import { STORAGE_KEY_PANEL_BOARD_SEED } from "@/features/storage";
import { atomWithValidatedStorage } from "@/libs/store/atomWithValidatedStorage";

import { MM_TASK_VERSIONS, type MmTaskVersion } from "./sources/mm";

const SOURCE_OOT = "oot";
const SOURCE_MM = "mm";

// BoardForm の <select name="source"> 用。
export const AVAILABLE_BOARD_SOURCES = [SOURCE_OOT, SOURCE_MM] as const;

// Phase 6: タスクソースの選択制。oot-bingo-lists（同期・バンドル済み）と
// mm-bingo（非同期・実行時に動的 import）でバージョンの型が違うため、
// source を判別子にした判別共用体にする。
export type BoardSettings =
  | { source: typeof SOURCE_OOT; version: BingoVersion; seed: number }
  | { source: typeof SOURCE_MM; version: MmTaskVersion; seed: number };

// isBingoVersion は `str is BingoVersion` の型ガードだが、valibot の
// v.custom() の Check は `(input: unknown) => boolean` を取るため、その
// まま渡すと引数型（string）が合わずコンパイルエラーになる。unknown を
// 受けて string チェックと型ガードを両方くぐらせる薄いラッパーを挟む。
const isBingoVersionValue = (value: unknown): value is BingoVersion =>
  typeof value === "string" && isBingoVersion(value);

// number input 由来の文字列を数値に直すための共通パイプ。valibot に
// z.coerce 相当は無いので、Number() での変換を v.transform で明示的に書く。
const coercedSeed = v.pipe(
  v.unknown(),
  v.transform((value) => Number(value)),
  v.number(),
  v.integer(),
  v.minValue(0),
);

// v.variant が判別子（source）のリテラル値を静的に追うために、この 2 つは
// GenericSchema<T> に早期に潰さず valibot の具象型のまま渡す必要がある
// （panels.ts の panelTwitchSchema/panelIframeSchema と同じ理由）。
const boardSettingsOotSchema = v.object({
  source: v.literal(SOURCE_OOT),
  // isBingoVersionValue が `value is BingoVersion` の型ガードなので、
  // v.custom<BingoVersion>() がそのまま出力型を BingoVersion に絞ってくれる。
  version: v.custom<BingoVersion>(isBingoVersionValue),
  seed: coercedSeed,
});

const boardSettingsMmSchema = v.object({
  source: v.literal(SOURCE_MM),
  version: v.picklist(MM_TASK_VERSIONS),
  seed: coercedSeed,
});

// ストレージ境界の検証（B-1）と BoardForm の FormData 検証を兼ねる。
//
// 既存の保存値（Phase 6 以前）には source というキー自体が無い。
// 無ければ黙って初期値へフォールバックさせる（= seed が勝手に初期値へ
// 巻き戻る）のではなく、当時の挙動どおり oot として扱うのが正しい
// 移行なので、v.variant に通す前に v.transform で補う。
export const boardSettingsSchema: v.GenericSchema<unknown, BoardSettings> =
  v.pipe(
    v.unknown(),
    v.transform((value) =>
      typeof value === "object" && value !== null && !("source" in value)
        ? { ...value, source: SOURCE_OOT }
        : value,
    ),
    v.variant("source", [boardSettingsOotSchema, boardSettingsMmSchema]),
  );

export const boardSettingsStore = atomWithValidatedStorage<BoardSettings>(
  STORAGE_KEY_PANEL_BOARD_SEED,
  {
    source: SOURCE_OOT,
    version: latestBingoVersion,
    seed: 123456,
  },
  boardSettingsSchema,
);
