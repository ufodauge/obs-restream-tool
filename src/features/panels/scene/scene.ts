import { atomWithStorage } from "jotai/utils";

import { STORAGE_KEY_SCENE_SETTINGS } from "@/features/storage";

export const sceneSettingsStore = atomWithStorage(
  STORAGE_KEY_SCENE_SETTINGS,
  {
    text: "",
    background: "https://i.imgur.com/lwC9Q.jpeg",
  },
  // TODO: indexedDB を使用
  undefined,
  { getOnInit: true },
);
