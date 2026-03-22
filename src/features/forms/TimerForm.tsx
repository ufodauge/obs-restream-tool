import { useAtom } from "jotai";
import {
  PauseIcon,
  PlayIcon,
  SquareStopIcon,
  TimerResetIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  globalTimerStore,
  calcCurrentTime,
  reduceGlobalTimer,
} from "@/features/panels/timer/timer";

export const TimerForm = (): ReactNode => {
  const [timer, setTimer] = useAtom(globalTimerStore);

  const start = () => setTimer(reduceGlobalTimer(timer, "start"));
  const pause = () => setTimer(reduceGlobalTimer(timer, "pause"));
  const reset = () => setTimer(reduceGlobalTimer(timer, "reset"));
  const resume = () => setTimer(reduceGlobalTimer(timer, "resume"));
  const stop = () => setTimer(reduceGlobalTimer(timer, "stop"));

  return (
    <div className="card w-96 gap-2 bg-base-100 p-2 shadow-sm card-border">
      <div
        className={`grid justify-center ${timer.state === "stopped" ? "bg-primary text-primary-content" : "bg-neutral text-neutral-content"} rounded-md p-2 shadow-md`}
      >
        <span
          className={`font-mono text-xl`}
          ref={(element) => {
            if (element === null) {
              return;
            }

            let id: number | undefined = undefined;
            const update = () => {
              const time = calcCurrentTime(timer);

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
      <div className="join justify-center">
        <button
          className={`btn join-item btn-soft ${timer.state === "running" ? "btn-disabled" : "btn-primary"}`}
          onClick={reset}
          disabled={timer.state === "running"}
        >
          <TimerResetIcon />
        </button>
        {timer.state === "ready" ? (
          <button
            className={`btn join-item btn-soft btn-primary`}
            onClick={start}
          >
            <PlayIcon />
          </button>
        ) : timer.state === "running" ? (
          <button
            className={`btn join-item btn-soft btn-primary`}
            onClick={pause}
          >
            <PauseIcon />
          </button>
        ) : (
          <button
            className={`btn join-item btn-soft btn-primary`}
            onClick={resume}
          >
            <PlayIcon />
          </button>
        )}
        <button
          className={`btn join-item btn-soft ${timer.state === "ready" || timer.state === "stopped" ? "btn-disabled" : "btn-primary"}`}
          disabled={timer.state === "ready" || timer.state === "stopped"}
          onClick={stop}
        >
          <SquareStopIcon />
        </button>
      </div>
    </div>
  );
};
