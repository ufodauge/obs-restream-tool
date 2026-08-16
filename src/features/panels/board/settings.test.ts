import { createStore } from "jotai";
import { latestBingoVersion } from "oot-bingo-lists";
import { describe, expect, it, vi } from "vitest";

import { STORAGE_KEY_PANEL_BOARD_SEED } from "@/features/storage";
import { tryParseJson } from "@/libs/json/json";

import { boardSettingsSchema, type BoardSettings } from "./settings";

// Phase 7 (zod → valibot): z.preprocess で書いていた「source 欠損の
// マイグレーション」は v.pipe(v.unknown(), v.transform(...), v.variant(...))
// に置き換えた。preprocess/transform はどちらも「型をすり抜けて何でも
// 受け取れる」箇所なので、移行後も壊れていないことをここで固定する。
describe("boardSettingsSchema（valibot）: source 欠損の migration", () => {
  it("Phase 6 以前の保存値（source なし）は version/seed を保ったまま source: 'oot' を補う", () => {
    const legacy = { version: latestBingoVersion, seed: 42 };
    const result = tryParseJson(JSON.stringify(legacy), boardSettingsSchema);

    expect(result.ok).toBe(true);
    expect(result.unwrapOr("FALLBACK" as unknown as BoardSettings)).toEqual({
      source: "oot",
      version: latestBingoVersion,
      seed: 42,
    });
  });

  it("boardSettingsStore を通した localStorage 境界でも同じマイグレーションが起きる", async () => {
    localStorage.clear();
    vi.resetModules();
    localStorage.setItem(
      STORAGE_KEY_PANEL_BOARD_SEED,
      JSON.stringify({ version: latestBingoVersion, seed: 777 }),
    );

    const { boardSettingsStore } = await import("./settings");
    const store = createStore();
    const settings = store.get(boardSettingsStore);

    expect(settings).toEqual({
      source: "oot",
      version: latestBingoVersion,
      seed: 777,
    });
  });

  it.each([
    ["malformed JSON", "{not json"],
    ["empty string", ""],
    ["structurally wrong value", JSON.stringify({ foo: "bar" })],
    [
      "missing key (seed)",
      JSON.stringify({ source: "oot", version: latestBingoVersion }),
    ],
    ["literal null", JSON.stringify(null)],
  ])(
    "%s は投げずに default にフォールバックする（transform 段でも例外化しない）",
    (_label, raw) => {
      expect(() => tryParseJson(raw, boardSettingsSchema)).not.toThrow();
      const result = tryParseJson(raw, boardSettingsSchema);
      expect(result.ok).toBe(false);
      expect(result.unwrapOr("FALLBACK" as unknown as BoardSettings)).toBe(
        "FALLBACK",
      );
    },
  );
});
