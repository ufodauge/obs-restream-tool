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

    // 表示を 1 回更新する。fractionalSecondDigits: 1 は有効（秒の小数第 1 位
    // "00:01:23.4" まで出る）なので残している。
    const render = () => {
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
    };

    // 停止・準備中・一時停止中は時刻が進まないので、1 回描画するだけで
    // requestAnimationFrame を回さない（OBS の CEF で無駄にフレームを消費しない）。
    render();
    if (globalTimer.state !== "running") {
      return;
    }

    // 動作中は 3 フレームに 1 回だけ描画する。
    let skip = 3;
    let id: number;
    const tick = () => {
      id = requestAnimationFrame(tick);
      if (--skip > 0) {
        return;
      }
      skip = 3;
      render();
    };

    id = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(id);
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
