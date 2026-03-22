import { atomWithStorage } from "jotai/utils";

import { STORAGE_KEY_PANEL_VIDEOS } from "@/features/storage";

const AVAILABLE_TYPE_TWITCH = "twitch";

export const AVAILABLE_TYPES = [AVAILABLE_TYPE_TWITCH];

interface PanelTypeCore<T extends string> {
  type: T;
  enable: boolean;
  size: 1 | 2;
  id: string;
}

interface PanelTypeTwitch extends PanelTypeCore<typeof AVAILABLE_TYPE_TWITCH> {
  channel: string;
  subtext: string | undefined;
}

export type PanelType = PanelTypeTwitch;

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

export const videoPanelStores = atomWithStorage<PanelType[]>(
  STORAGE_KEY_PANEL_VIDEOS,
  videoPanelSourcesInit,
  undefined,
  { getOnInit: true },
);
