import { atom } from "jotai";

interface PanelTypeCore<T extends string> {
  type: T;
  enable: boolean;
}

interface PanelTypeTwitch extends PanelTypeCore<"twitch"> {
  channel: string;
  subtext: string | undefined;
}

type PanelType = PanelTypeTwitch;

const videoPanelSourcesInit: PanelType[] = [
  {
    type: "twitch",
    channel: `sva16162`,
    subtext: "すば",
    enable: true,
  },
  {
    type: "twitch",
    channel: `tkc014`,
    subtext: "TKC",
    enable: true,
  },
  {
    type: "twitch",
    channel: `tororo_vtuber`,
    subtext: "猫麦とろろ",
    enable: false,
  },
  {
    type: "twitch",
    channel: `hayafo`,
    subtext: "はやふぉ",
    enable: true,
  },
  {
    type: "twitch",
    channel: `takera0628`,
    subtext: "takera",
    enable: false,
  },
  {
    type: "twitch",
    channel: `plasma_parse`,
    subtext: "ぷらずま",
    enable: true,
  },
  {
    type: "twitch",
    channel: `tsundererar`,
    subtext: "つりゃ",
    enable: true,
  },
];

export const videoPanelSources = atom<PanelType[]>(videoPanelSourcesInit);
