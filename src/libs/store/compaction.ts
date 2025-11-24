import { useAtomValue } from "jotai";
import { atomWithStorage, useAtomCallback } from "jotai/utils";
import { useCallback } from "react";

type CompactionMode = "vertical" | "horizontal";

const compactionModeStore = atomWithStorage<{
  mode: CompactionMode;
  enable: boolean;
}>("compaction-mode", {
  mode: "vertical",
  enable: false,
});

export const useToggleCompactionMode = () => {
  const setter = useAtomCallback(
    useCallback((_, set, action: "toggle-enable" | "toggle-mode") => {
      switch (action) {
        case "toggle-enable": {
          set(compactionModeStore, ({ enable, mode }) => ({
            mode,
            enable: !enable,
          }));
          break;
        }

        case "toggle-mode": {
          set(compactionModeStore, ({ enable, mode }) => ({
            enable,
            mode: mode === "horizontal" ? "vertical" : "horizontal",
          }));
          break;
        }
      }
    }, []),
  );

  return setter;
};

export const useCompactionMode = (): {
  mode: CompactionMode;
  enable: boolean;
} => useAtomValue(compactionModeStore);
