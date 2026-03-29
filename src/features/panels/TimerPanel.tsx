import { useAtomValue } from "jotai";
import { useRef, useEffect } from "react";

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

  const timerRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (timerRef.current === null) {
      return;
    }

    const element = timerRef.current;

    let skip = 3;
    let prevState: GlobalTimer["state"] | undefined = undefined;
    let id: number | undefined = undefined;
    const update = () => {
      if (globalTimer.state !== "running" && prevState === globalTimer.state) {
        id = requestAnimationFrame(update);
        return;
      }
      prevState = globalTimer.state;

      if (globalTimer.state === "running" && --skip > 0) {
        id = requestAnimationFrame(update);
        return;
      }
      skip = 3;

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
  }, [globalTimer]);

  return (
    <div className={`grid place-items-center ${className}`}>
      <span
        className={`font-mono text-[2cqw] text-ellipsis ${textClassName}`}
        ref={timerRef}
      />
    </div>
  );
};
