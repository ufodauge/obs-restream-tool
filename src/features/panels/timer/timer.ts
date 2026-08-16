import * as v from "valibot";

import { STORAGE_KEY_PANEL_GLOBAL_TIMER } from "@/features/storage";
import { atomWithValidatedStorage } from "@/libs/store/atomWithValidatedStorage";

type State<K extends string, T extends {} = {}> = { state: K } & T;

export type Duration = {
  start: number;
  end: number;
};

export type StatedDuration =
  | State<"ready">
  | State<"running", { start: number }>
  | State<"paused", { start: number; pausedAt: number }>
  | State<
      "stopped",
      {
        start: number;
        end: number;
      }
    >;

export type GlobalTimer = StatedDuration & {
  pausedSpans: Duration[];
};

const durationSchema: v.GenericSchema<unknown, Duration> = v.object({
  start: v.number(),
  end: v.number(),
});

// ストレージ境界の検証（B-1）専用。TimerForm は Phase 3 以降の対象なので
// FormData 側の共通化はしない（GlobalTimer はボタン操作の reduce でしか
// 更新されず、フォーム入力から組み立てることはないため）。
const globalTimerSchema: v.GenericSchema<unknown, GlobalTimer> = v.variant(
  "state",
  [
    v.object({
      state: v.literal("ready"),
      pausedSpans: v.array(durationSchema),
    }),
    v.object({
      state: v.literal("running"),
      start: v.number(),
      pausedSpans: v.array(durationSchema),
    }),
    v.object({
      state: v.literal("paused"),
      start: v.number(),
      pausedAt: v.number(),
      pausedSpans: v.array(durationSchema),
    }),
    v.object({
      state: v.literal("stopped"),
      start: v.number(),
      end: v.number(),
      pausedSpans: v.array(durationSchema),
    }),
  ],
);

export const globalTimerStore = atomWithValidatedStorage<GlobalTimer>(
  STORAGE_KEY_PANEL_GLOBAL_TIMER,
  {
    state: "ready",
    pausedSpans: [],
  },
  globalTimerSchema,
);

export const calcCurrentTime = (timer: GlobalTimer): number => {
  if (timer.state === "ready") {
    return 0;
  }

  const pausedDuration = timer.pausedSpans.reduce((acc, v) => {
    return acc + (v.end - v.start);
  }, 0);

  switch (timer.state) {
    case "running":
      return Date.now() - timer.start - pausedDuration;

    case "paused":
      return timer.pausedAt - timer.start - pausedDuration;

    case "stopped":
      return timer.end - timer.start - pausedDuration;
  }
};

export const reduceGlobalTimer = (
  timer: GlobalTimer,
  args:
    | {
        action: "reset" | "start" | "resume" | "pause" | "stop";
      }
    | { action: "set"; duration: number },
): GlobalTimer => {
  switch (timer.state) {
    case "ready":
      switch (args.action) {
        case "start":
          return {
            ...timer,
            state: "running",
            start: Date.now(),
          };
        case "set":
          return {
            ...timer,
            state: "paused",
            start: Date.now() - args.duration,
            pausedAt: Date.now(),
          };
        default:
          return timer;
      }
    case "running":
      switch (args.action) {
        case "pause":
          return {
            ...timer,
            state: "paused",
            pausedAt: Date.now(),
          };
        case "stop":
          return {
            ...timer,
            state: "stopped",
            end: Date.now(),
          };
        case "reset":
          return {
            state: "ready",
            pausedSpans: [],
          };
        case "set":
          return {
            ...timer,
            start: Date.now() - args.duration,
            pausedSpans: [],
          };
        default:
          return timer;
      }
    case "paused":
      switch (args.action) {
        case "stop":
          return {
            ...timer,
            state: "stopped",
            end: timer.pausedAt,
          };
        case "resume":
          return {
            ...timer,
            state: "running",
            pausedSpans: [
              ...timer.pausedSpans,
              {
                start: timer.pausedAt,
                end: Date.now(),
              },
            ],
          };
        case "reset":
          return {
            state: "ready",
            pausedSpans: [],
          };
        case "set":
          return {
            ...timer,
            start: Date.now() - args.duration,
            pausedAt: Date.now(),
            pausedSpans: [],
          };
        default:
          return timer;
      }
    case "stopped":
      switch (args.action) {
        case "resume":
          return {
            ...timer,
            state: "running",
            pausedSpans: [
              ...timer.pausedSpans,
              {
                start: timer.end,
                end: Date.now(),
              },
            ],
          };
        case "reset":
          return {
            state: "ready",
            pausedSpans: [],
          };
        case "set":
          return {
            ...timer,
            start: Date.now() - args.duration,
            end: Date.now(),
            pausedSpans: [],
          };
        default:
          return timer;
      }
  }
};
