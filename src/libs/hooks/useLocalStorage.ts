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

  const itemRaw = useSyncExternalStore(subscribeStorageEvent, getSnapshot);

  const parsedValue =
    itemRaw === null ? init : tryParseJson(itemRaw, schema).unwrapOr(init);

  const setState = (value: SetStateAction<T>) => {
    const newValue =
      typeof value === "function"
        ? (value as (prev: T) => T)(parsedValue)
        : value;

    const stringifiedNewValue = JSON.stringify(newValue);
    localStorage.setItem(key, stringifiedNewValue);
    dispatchStorageEvent(key, stringifiedNewValue);
  };

  return [parsedValue, setState];
};
