import { atomWithStorage } from "jotai/utils";

import { STORAGE_KEY_PANEL_TEXT } from "@/features/storage";

export const panelTextStore = atomWithStorage(
  STORAGE_KEY_PANEL_TEXT,
  "",
  undefined,
  { getOnInit: true },
);
