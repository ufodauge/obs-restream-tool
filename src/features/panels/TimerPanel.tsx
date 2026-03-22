import { useAtomValue } from "jotai";

import {
  calcCurrentTime,
  globalTimerStore,
  type GlobalTimer,
} from "./timer/timer";

const getTextClassName = ({ state }: GlobalTimer): string => {
  switch (state) {
    case "ready":
    case "paused":
    case "running":
      return "text-neutral-content";
    case "stopped":
      return "text-accent";
  }
};

export const TimerPanel = ({ className }: { className: string }) => {
  const globalTimer = useAtomValue(globalTimerStore);
  const textClassName = getTextClassName(globalTimer);

  return (
    <div className={`grid place-items-center ${className}`}>
      <span
        className={`font-mono text-[2cqw] text-ellipsis ${textClassName}`}
        ref={(element) => {
          if (element === null) {
            return;
          }

          let id: number | undefined = undefined;
          const update = () => {
            const time = calcCurrentTime(globalTimer);

            const date = new Date(time);
            const text = date.toLocaleTimeString("en-US", {
              fractionalSecondDigits: 1,
              hour12: false,
              timeZone: "UTC",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            if (element.textContent !== text) {
              element.textContent = text;
            }

            id = requestAnimationFrame(update);
          };

          update();

          return () => {
            if (id) {
              cancelAnimationFrame(id);
            }
          };
        }}
      />
    </div>
  );
};
