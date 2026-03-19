import { atomWithStorage } from "jotai/utils";
import { latestBingoVersion } from "oot-bingo-lists";
import type { BingoVersion } from "oot-bingo-lists";

export const boardSettings = atomWithStorage<{
  version: BingoVersion;
  seed: number;
}>(
  "obs-restream-tool:board-settings",
  {
    version: latestBingoVersion,
    seed: 123456,
  },
  undefined,
  { getOnInit: true },
);
