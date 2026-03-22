import { atomWithStorage } from "jotai/utils";

import { STORAGE_KEY_PANEL_GLOBAL_TIMER } from "@/features/storage";

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

export const globalTimerStore = atomWithStorage<GlobalTimer>(
  STORAGE_KEY_PANEL_GLOBAL_TIMER,
  {
    state: "ready",
    pausedSpans: [],
  },
  undefined,
  {
    getOnInit: true,
  },
);

export const calcCurrentTime = (timer: GlobalTimer): number => {
  if (timer.state === "ready") {
    return 0;
  }

  const pausedDuration = timer.pausedSpans.reduce((acc, v) => {
    return acc + (v.end - v.start);
    // return acc.add(
    //   Temporal.Instant.fromEpochMilliseconds(v.start).until(
    //     Temporal.Instant.fromEpochMilliseconds(v.end),
    //   ),
    // );
  }, 0);

  switch (timer.state) {
    case "running":
      return Date.now() - timer.start - pausedDuration;
    // return Temporal.Instant.fromEpochMilliseconds(timer.start)
    //   .until(Temporal.Now.instant())
    //   .subtract(pausedDuration);
    case "paused":
      return timer.pausedAt - timer.start - pausedDuration;
    // return Temporal.Instant.fromEpochMilliseconds(timer.start)
    //   .until(Temporal.Instant.fromEpochMilliseconds(timer.pausedAt))
    //   .subtract(pausedDuration);
    case "stopped":
      return timer.end - timer.start - pausedDuration;
    // return Temporal.Instant.fromEpochMilliseconds(timer.start)
    //   .until(Temporal.Instant.fromEpochMilliseconds(timer.end))
    //   .subtract(pausedDuration);
  }
};

export const reduceGlobalTimer = (
  timer: GlobalTimer,
  action: "reset" | "start" | "resume" | "pause" | "stop",
): GlobalTimer => {
  switch (timer.state) {
    case "ready":
      switch (action) {
        case "start":
          return {
            ...timer,
            state: "running",
            start: Date.now(),
          };
        default:
          return timer;
      }
    case "running":
      switch (action) {
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
        default:
          return timer;
      }
    case "paused":
      switch (action) {
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
        default:
          return timer;
      }
    case "stopped":
      switch (action) {
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
        default:
          return timer;
      }
  }
};
