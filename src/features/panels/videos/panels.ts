import * as v from "valibot";

import { STORAGE_KEY_PANEL_VIDEOS } from "@/features/storage";
import { atomWithValidatedStorage } from "@/libs/store/atomWithValidatedStorage";

const AVAILABLE_TYPE_TWITCH = "twitch";
const AVAILABLE_TYPE_IFRAME = "iframe";

export const AVAILABLE_TYPES = [AVAILABLE_TYPE_TWITCH, AVAILABLE_TYPE_IFRAME];

interface PanelTypeCore<T extends string> {
  type: T;
  enable: boolean;
  size: 1 | 2;
  id: string;
  // ラベルとして各パネルに表示される名前。twitch/iframe 共通。
  subtext?: string;
}

interface PanelTypeTwitch extends PanelTypeCore<typeof AVAILABLE_TYPE_TWITCH> {
  channel: string;
}

interface PanelTypeIframe extends PanelTypeCore<typeof AVAILABLE_TYPE_IFRAME> {
  url: string;
}

export type PanelType = PanelTypeTwitch | PanelTypeIframe;

// A-1: サイズは 1 | 2 の数値。旧データ（react-hook-form が valueAsNumber 無しで
// 書き込んでいた "1" / "2" という文字列）も数値に直してから 1 | 2 の範囲に絞る。
// valibot に z.coerce 相当は無いので、Number() での変換を v.transform で
// 明示的に書く（"1" → 1、壊れた値は NaN になり後段の v.picklist で弾かれる）。
// form の FormData 側（文字列）も同じ経路で数値化される。
const panelSizeSchema: v.GenericSchema<unknown, 1 | 2> = v.pipe(
  v.unknown(),
  v.transform((value) => Number(value)),
  v.picklist([1, 2]),
);

const panelCoreShape = {
  // enable は VideoPanelForm 側で mergeFormDataOverDefaults() が
  // formData.has("enable") から既に真偽値へ変換した後の値を渡してくる
  // （チェックボックス由来の "on" 文字列がここまで来ることはない）ので、
  // Boolean(x) 相当の変換（"false" も true になる）は不要かつ危険。
  // v.boolean() で素通しにする。
  enable: v.boolean(),
  size: panelSizeSchema,
  id: v.string(),
  subtext: v.optional(v.string()),
};

// v.variant が判別子（type）のリテラル値を静的に追うために、この 2 つは
// GenericSchema<T> に早期に潰さず valibot の具象型のまま渡す必要がある
// （GenericSchema<T> に一度潰すと variant 側の判別が効かなくなる）。
const panelTwitchSchema = v.object({
  ...panelCoreShape,
  type: v.literal(AVAILABLE_TYPE_TWITCH),
  channel: v.string(),
});

const panelIframeSchema = v.object({
  ...panelCoreShape,
  type: v.literal(AVAILABLE_TYPE_IFRAME),
  url: v.string(),
});

// VideoPanelForm の FormData 検証（B-1 と共通化）・panels[] のストレージ検証の
// 両方から参照される単一の真実の源。
export const panelTypeSchema: v.GenericSchema<unknown, PanelType> = v.variant(
  "type",
  [panelTwitchSchema, panelIframeSchema],
);

const panelTypesSchema: v.GenericSchema<unknown, PanelType[]> =
  v.array(panelTypeSchema);

const videoPanelSourcesInit: PanelType[] = [
  {
    type: "twitch",
    channel: `sva16162`,
    subtext: "すば",
    enable: true,
    size: 1,
    id: crypto.randomUUID(),
  },
  {
    type: "twitch",
    channel: `tkc014`,
    subtext: "TKC",
    enable: true,
    size: 1,
    id: crypto.randomUUID(),
  },
  {
    type: "twitch",
    channel: `tororo_vtuber`,
    subtext: "猫麦とろろ",
    enable: false,
    size: 1,
    id: crypto.randomUUID(),
  },
  {
    type: "twitch",
    channel: `hayafo`,
    subtext: "はやふぉ",
    enable: true,
    size: 1,
    id: crypto.randomUUID(),
  },
  {
    type: "twitch",
    channel: `takera0628`,
    subtext: "takera",
    enable: false,
    size: 1,
    id: crypto.randomUUID(),
  },
  {
    type: "twitch",
    channel: `plasma_parse`,
    subtext: "ぷらずま",
    enable: true,
    size: 1,
    id: crypto.randomUUID(),
  },
  {
    type: "twitch",
    channel: `tsundererar`,
    subtext: "つりゃ",
    enable: true,
    size: 1,
    id: crypto.randomUUID(),
  },
];

export const videoPanelStores = atomWithValidatedStorage(
  STORAGE_KEY_PANEL_VIDEOS,
  videoPanelSourcesInit,
  panelTypesSchema,
);

/**
 * 有効なパネルを size 降順に並べ、各パネルが元の panels 配列で何番目
 * だったか（= Slot.tsx がそのまま `panels[N]` として参照する「本来の
 * スロット index」）も一緒に返す。
 *
 * A-3: かつては「有効なものだけ抽出・size 降順」に並べ替えた配列を Slot.tsx
 * が直接 `[index]` で参照していたが、それだと 1 パネル無効化するだけで
 * 以降の全スロットの中身がズレて無関係な Twitch プレイヤーまで全部
 * リロードされていた。スロット index は今は panels 配列そのままの
 * index（= ここでいう slotIndex）を使う。
 *
 * obsSync.ts はこれで packGrid に渡すサイズ（size 降順）を作り、packGrid が
 * 返す矩形を slotIndex（元 index）に配り直すことで、「無効化されたパネルは
 * 対応する OBS ソースが非表示になるだけで、他のスロットの中身・位置は
 * 変わらない」という Slot.tsx 側の前提と一致させる。
 */
export const selectEnabledPanelsWithSlotIndex = (
  panels: PanelType[],
): { panel: PanelType; slotIndex: number }[] =>
  panels
    .map((panel, slotIndex) => ({ panel, slotIndex }))
    .filter(({ panel }) => panel.enable)
    .toSorted((a, b) => b.panel.size - a.panel.size);
