import { useSyncExternalStore, type RefObject } from "react";
import { useDebounce } from "../../libs/hooks/useDebounce";

const aspectVideo = 9 / 16;
const gridSize = 12;

const useDebouncedElementWidth = (ref: RefObject<HTMLElement | null>) => {
  const width = useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);

      return () => window.addEventListener("resize", cb);
    },
    () => Math.floor(ref.current?.clientWidth ?? 0),
  );

  return useDebounce(width, 100);
};

export const useDebouncedGridLayoutParams = (
  ref: RefObject<HTMLElement | null>,
) => {
  const width = useDebouncedElementWidth(ref);

  const height = Math.floor(width * aspectVideo);
  const rowHeight = Math.floor(height / gridSize);

  return {
    width,
    height,
    rowHeight,
    gridSize,
  };
};
