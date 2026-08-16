import { atomWithStorage } from "jotai/utils";
import type * as v from "valibot";

import { tryParseJson } from "@/libs/json/json";

/**
 * atomWithStorage を valibot スキーマでラップするヘルパー（B-1）。
 *
 * localStorage の中身は「古いスキーマのまま残っている」「手で書き換えられた」
 * 「単純に壊れた JSON」のいずれも起こり得るので、無条件で信用せず
 * v.safeParse(schema, ...) を通す。合わなければ initialValue にフォールバックする
 * （tryParseJson が JSON.parse の失敗も Result として吸収してくれるので、
 * 壊れた JSON もここで同じ経路でフォールバックする）。
 *
 * atomWithStorage の第三引数（カスタム storage）がそのための自然な差し込み
 * 口なので、ここではストレージの実体（localStorage）+ 検証だけを担当する。
 * 4 箇所の呼び出し元がすべて { getOnInit: true } を使っているため固定している。
 */
export const atomWithValidatedStorage = <T>(
  key: string,
  initialValue: T,
  schema: v.GenericSchema<unknown, T>,
) =>
  atomWithStorage<T>(
    key,
    initialValue,
    {
      getItem: (k, init) => {
        const raw = localStorage.getItem(k);
        return raw === null ? init : tryParseJson(raw, schema).unwrapOr(init);
      },
      setItem: (k, newValue) => {
        localStorage.setItem(k, JSON.stringify(newValue));
      },
      removeItem: (k) => {
        localStorage.removeItem(k);
      },
      // 他ドック（別タブ扱いの custom browser dock）が同じキーを書き換えた
      // ときに反映するための購読。ここも同じスキーマで検証する。
      subscribe: (k, callback, init) => {
        const listener = (event: StorageEvent) => {
          if (event.storageArea !== localStorage || event.key !== k) {
            return;
          }
          callback(
            event.newValue === null
              ? init
              : tryParseJson(event.newValue, schema).unwrapOr(init),
          );
        };
        window.addEventListener("storage", listener);
        return () => window.removeEventListener("storage", listener);
      },
    },
    { getOnInit: true },
  );
