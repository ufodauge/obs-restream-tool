import { atomWithStorage } from "jotai/utils";
import { latestBingoVersion } from "oot-bingo-lists";
import type { BingoVersion } from "oot-bingo-lists";

import { STORAGE_KEY_PANEL_BOARD_SEED } from "@/features/storage";

export const boardSettingsStore = atomWithStorage<{
  version: BingoVersion;
  seed: number;
}>(
  STORAGE_KEY_PANEL_BOARD_SEED,
  {
    version: latestBingoVersion,
    seed: 123456,
  },
  undefined,
  { getOnInit: true },
);
