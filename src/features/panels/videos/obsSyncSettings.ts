import * as v from "valibot";

import { STORAGE_KEY_OBS_SYNC_SETTINGS } from "@/features/storage";
import { atomWithValidatedStorage } from "@/libs/store/atomWithValidatedStorage";

// IframePanel の subtext（各スロットに重ねる補助テキスト）の表示位置。
// "bottom-full" が今までの唯一の見た目（下部全幅バー）と完全に一致するので、
// 既存ユーザーの見た目を変えないためのデフォルトはこれにする。
export const SUBTEXT_POSITIONS = [
  "bottom-full",
  "bottom-left",
  "bottom-right",
  "top-full",
  "top-left",
  "top-right",
] as const;

export type SubtextPosition = (typeof SUBTEXT_POSITIONS)[number];

export interface ObsSyncSettings {
  enable: boolean;
  // obs-websocket サーバーの URL（例: ws://127.0.0.1:4455）
  url: string;
  password: string;
  // slot.html を配信しているオリジン。初回セットアップで
  // {baseUrl}/slot.html?index=N を Browser Source の URL として使う。
  baseUrl: string;
  // 動画スロット用ソースが置かれているシーン名
  sceneName: string;
  // OBS 側に事前に用意しておく Browser Source の名前の接頭辞。
  // "VideoSlot" なら VideoSlot0, VideoSlot1, ... という名前で
  // slotCount 個のソースを作っておく想定。
  sourcePrefix: string;
  slotCount: number;
  grid: { cols: number; rows: number };
  // 動画パネル群を配置する、OBS キャンバス上のピクセル矩形
  area: { x: number; y: number; width: number; height: number };
  // スロット間の隙間（px）。CSS では実現できない（各スロットは独立した
  // Browser Source なので、slot.html 内の margin/padding では他のソースとの
  // 間隔を動かせない）ため、packGrid が返す矩形そのものをインセットする形で
  // 反映する（layout.ts の cellRect を参照）。省略時 0 = 従来どおり隙間なし。
  gap: number;
  // 各スロット（IframePanel の iframe）の角丸半径（px）。Browser Source は
  // 既定で背景が透過なので、丸めた分だけ下のシーンが透けて見える。
  // 省略時 0 = 従来どおり角丸なし。
  borderRadius: number;
  // 各スロットの subtext（配信者名などのラベル）の表示位置。
  subtextPosition: SubtextPosition;
}

// number input 由来の文字列を数値に直すための共通パイプ。valibot に
// z.coerce 相当は無いので、Number() での変換を v.transform で明示的に書く
// （壊れた値は NaN になり、後段の v.number() / v.integer() / v.minValue() で
// 弾かれる）。ただし Number("") と Number(null) は 0 になってしまうので、
// 入力を空にした場合に黙って 0 とみなさないよう、変換の前に弾く。
const coercedNumber = v.pipe(
  v.unknown(),
  v.transform((value) => Number(value)),
  v.number(),
);
  v.check(
    (value) =>
      value !== null && !(typeof value === "string" && value.trim() === ""),
    "空の値は数値として扱えません",
  ),

// gap/borderRadius 共通: 0 以上の整数（px）。number input 由来の文字列も
// coercedNumber で数値化する。
const coercedNonNegativeInt = v.pipe(coercedNumber, v.integer(), v.minValue(0));

// ストレージ境界の検証（B-1）と ObsSyncForm の FormData 検証を兼ねる。
// enable は ObsSyncForm 側で mergeFormDataOverDefaults() が
// formData.has("enable") から既に真偽値へ変換した後の値を渡してくるため、
// Boolean(x) 相当の変換（文字列 "false" も true になる）は不要かつ危険。
// v.boolean() で素通しにする。
//
// gap/borderRadius/subtextPosition は後から追加したフィールドなので、
// 既存の保存値には存在しない。v.optional(schema, default) は該当キーが
// undefined（＝存在しない）のときに default を素通しする（boardSettings.ts の
// ような「キー自体は無いが値の意味を変えるマイグレーション」ではなく、
// 単に「無ければデフォルト」で足りるので、あちらの v.transform による
// 事前補完までは不要）。atomWithValidatedStorage は検証に失敗した値を
// オブジェクト全体ごと initialValue にフォールバックさせる仕様なので、
// ここで per-field に default を効かせておかないと、新フィールド追加前の
// 保存値が「壊れた値」として丸ごと初期化されてしまう。
export const obsSyncSettingsSchema: v.GenericSchema<unknown, ObsSyncSettings> =
  v.object({
    enable: v.boolean(),
    url: v.string(),
    password: v.string(),
    baseUrl: v.string(),
    sceneName: v.string(),
    sourcePrefix: v.string(),
    slotCount: v.pipe(coercedNumber, v.integer(), v.minValue(1)),
    grid: v.object({
      cols: v.pipe(coercedNumber, v.integer(), v.minValue(1)),
      rows: v.pipe(coercedNumber, v.integer(), v.minValue(1)),
    }),
    area: v.object({
      x: coercedNumber,
      y: coercedNumber,
      // 幅・高さ 0 だと packGrid の cellWidth/cellHeight が 0 になり全スロットが潰れるので 1 以上に絞る。
      width: v.pipe(coercedNumber, v.minValue(1)),
      height: v.pipe(coercedNumber, v.minValue(1)),
    }),
    gap: v.optional(coercedNonNegativeInt, 0),
    borderRadius: v.optional(coercedNonNegativeInt, 0),
    subtextPosition: v.optional(v.picklist(SUBTEXT_POSITIONS), "bottom-full"),
  });

export const obsSyncSettingsStore = atomWithValidatedStorage<ObsSyncSettings>(
  STORAGE_KEY_OBS_SYNC_SETTINGS,
  {
    enable: false,
    url: "ws://127.0.0.1:4455",
    password: "",
    baseUrl: "http://localhost:5173",
    sceneName: "",
    sourcePrefix: "VideoSlot",
    slotCount: 9,
    grid: { cols: 3, rows: 3 },
    area: { x: 0, y: 0, width: 1920, height: 1080 },
    gap: 0,
    borderRadius: 0,
    subtextPosition: "bottom-full",
  },
  obsSyncSettingsSchema,
);
