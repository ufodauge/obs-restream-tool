import {
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { ZodType } from "zod";
import { tryParseJson } from "../json/json";

const dispatchStorageEvent = (key: string, newValue: string) => {
  window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
};

const subscribeStorageEvent = (cb: () => void): (() => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

export const useLocalStorage = <T>(
  key: string,
  schema: ZodType<T>,
  init: T,
): [T, Dispatch<SetStateAction<T>>] => {
  const getSnapshot = () => localStorage.getItem(key);

  const stateRaw = useSyncExternalStore(subscribeStorageEvent, getSnapshot);

  const state =
    stateRaw === null ? init : tryParseJson(stateRaw, schema).unwrapOr(init);

  const setState = (value: SetStateAction<T>) => {
    const newValue =
      typeof value === "function" ? (value as (prev: T) => T)(state) : value;

    const stringifiedNewValue = JSON.stringify(newValue);
    try {
      localStorage.setItem(key, stringifiedNewValue);
    } catch (e) {
      console.error(e);
    }
    dispatchStorageEvent(key, stringifiedNewValue);
  };

  return [state, setState];
};

