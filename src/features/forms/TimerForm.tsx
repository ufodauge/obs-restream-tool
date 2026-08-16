import { useAtom } from "jotai";
import {
  PauseIcon,
  PlayIcon,
  SquareStopIcon,
  TimerResetIcon,
} from "lucide-react";
import { useEffect, useEffectEvent, useRef, type ReactNode } from "react";

import {
  globalTimerStore,
  calcCurrentTime,
  reduceGlobalTimer,
  type GlobalTimer,
} from "@/features/panels/timer/timer";

// running 中に毎フレーム DOM を書き換えると無駄が多いので、SKIP_FRAMES
// フレームに 1 回だけ実際に valueAsNumber を更新する。
const SKIP_FRAMES = 5;

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
  // rAF ループ本体からしか使わない、コンポーネントの再レンダーとは無関係な
  // 内部状態。let 変数のまま入れ子の関数（rAF のコールバック）内で
  // ++/-- すると react-compiler がコンパイルを丸ごとスキップする
  // （BuildHIR::lowerExpression: "Handle UpdateExpression to variables
  // captured within lambdas"、TimerForm はまさにこれで長らく無言スキップ
  // されていた）。ref の .current 経由の更新はサポートされているので
  // ref に置き換える。
  const skipRef = useRef(SKIP_FRAMES);
  const prevStateRef = useRef<GlobalTimer["state"] | undefined>(undefined);

  // 1 フレーム分の処理。useEffectEvent にすることで「rAF ループを
  // いつ張り直すか」（＝ mount 時の 1 回だけ）と「毎フレーム最新の timer を
  // 読む」を分離できる。以前は timer を effect の依存に入れていたため、
  // start/pause/resume/stop はもちろん <input type="time"> の change の
  // たびにループ全体（cancelAnimationFrame → 新しい rAF チェーン）を
  // 張り直していた。
  const onFrame = useEffectEvent((element: HTMLInputElement) => {
    if (timer.state !== "running" && prevStateRef.current === timer.state) {
      return;
    }
    prevStateRef.current = timer.state;

    if (timer.state === "running" && --skipRef.current > 0) {
      return;
    }
    skipRef.current = SKIP_FRAMES;

    const time = calcCurrentTime(timer);
    if (element.valueAsNumber !== time) {
      element.valueAsNumber = time;
    }
  });

  useEffect(() => {
    const element = timerInputRef.current;
    if (element === null) {
      return;
    }

    // 自己再帰する named function expression（旧: `function tick() { ...;
    // requestAnimationFrame(tick); }`）は react-compiler 1.0 で内部
    // invariant crash を引き起こす（[InferMutationAliasingEffects]
    // Expected value kind to be initialized、実測で確認）ので避ける。
    // let で捕まえた const 関数を自己参照する形なら問題なくコンパイルされる。
    let id: number;
    const tick = () => {
      onFrame(element);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(id);
  }, []);

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
