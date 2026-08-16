import * as v from "valibot";

import { STORAGE_KEY_SCENE_SETTINGS } from "@/features/storage";
import { atomWithValidatedStorage } from "@/libs/store/atomWithValidatedStorage";

export interface SceneSettings {
  text: string;
  background: string;
}

// ストレージ境界の検証（B-1）と SceneSettingsForm の FormData 検証を兼ねる。
export const sceneSettingsSchema: v.GenericSchema<unknown, SceneSettings> =
  v.object({
    text: v.string(),
    background: v.string(),
  });

export const sceneSettingsStore = atomWithValidatedStorage<SceneSettings>(
  STORAGE_KEY_SCENE_SETTINGS,
  {
    text: "",
    background: "https://i.imgur.com/lwC9Q.jpeg",
  },
  // TODO: indexedDB を使用
  sceneSettingsSchema,
);
