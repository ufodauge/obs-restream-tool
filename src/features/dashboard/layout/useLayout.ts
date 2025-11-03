import { useSyncExternalStore, type RefObject } from "react";
import { useDebounce } from "../../../libs/hooks/useDebounce";

const aspectVideo = 9 / 16;
const gridSize = 12;

export const useDebouncedGridLayoutParams = (
  ref: RefObject<HTMLElement | null>,
) => {
  const width = useSyncExternalStore(
    (cb) => {
      window.addEventListener("resize", cb);

      return () => window.addEventListener("resize", cb);
    },
    () => Math.floor(ref.current?.clientWidth ?? 0),
  );

  
  const height = Math.floor(width * aspectVideo);
  const rowHeight = Math.floor(height / gridSize);
  
  // TODO: why is this called
  console.log(width, height);
  
  return useDebounce(
    {
      width,
      height,
      rowHeight,
      gridSize,
    },
    400,
  );
};
