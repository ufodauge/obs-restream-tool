import { useAtom } from "jotai";
import {
  PauseIcon,
  PlayIcon,
  SquareStopIcon,
  TimerResetIcon,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import {
  globalTimerStore,
  calcCurrentTime,
  reduceGlobalTimer,
  type GlobalTimer,
} from "@/features/panels/timer/timer";

export const TimerForm = (): ReactNode => {
  const [timer, setTimer] = useAtom(globalTimerStore);

  const start = () =>
    setTimer(
      reduceGlobalTimer(timer, {
        action: "start",
      }),
    );
  const pause = () =>
    setTimer(
      reduceGlobalTimer(timer, {
        action: "pause",
      }),
    );
  const reset = () =>
    setTimer(
      reduceGlobalTimer(timer, {
        action: "reset",
      }),
    );
  const resume = () =>
    setTimer(
      reduceGlobalTimer(timer, {
        action: "resume",
      }),
    );
  const stop = () =>
    setTimer(
      reduceGlobalTimer(timer, {
        action: "stop",
      }),
    );

  const timerInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (timerInputRef.current === null) {
      return;
    }

    const element = timerInputRef.current;

    let skip = 5;
    let prevState: GlobalTimer["state"] | undefined = undefined;
    let id: number | undefined = undefined;
    const update = () => {
      if (timer.state !== "running" && prevState === timer.state) {
        id = requestAnimationFrame(update);
        return;
      }
      prevState = timer.state;

      if (timer.state === "running" && --skip > 0) {
        id = requestAnimationFrame(update);
        return;
      }
      skip = 5;

      const time = calcCurrentTime(timer);

      if (element.valueAsNumber !== time) {
        element.valueAsNumber = time;
      }

      id = requestAnimationFrame(update);
    };

    update();

    return () => {
      if (id) {
        cancelAnimationFrame(id);
      }
    };
  }, [timer]);

  return (
    <div className="card gap-2 bg-base-100 p-2 shadow-sm card-border">
      <div
        className={`grid justify-center ${timer.state === "stopped" ? "bg-primary text-primary-content" : "text-base-300-content bg-base-300"} rounded-md p-2 shadow-md`}
      >
        <input
          type="time"
          readOnly={timer.state === "running"}
          onChange={(e) =>
            setTimer(
              reduceGlobalTimer(timer, {
                action: "set",
                duration: e.currentTarget.valueAsNumber,
              }),
            )
          }
          
          className={`font-mono text-xl`}
          ref={timerInputRef}
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
