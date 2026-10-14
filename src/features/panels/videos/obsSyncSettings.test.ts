import { createStore } from "jotai";
import { describe, expect, it, vi } from "vitest";

import { STORAGE_KEY_OBS_SYNC_SETTINGS } from "@/features/storage";
import { tryParseJson } from "@/libs/json/json";

import { obsSyncSettingsSchema, type ObsSyncSettings } from "./obsSyncSettings";

// gap/borderRadius/subtextPosition はあとから追加したフィールド。既存の
// 保存値にはこの 3 キーが存在しない。atomWithValidatedStorage は
// v.safeParse に失敗した値をオブジェクト丸ごと initialValue へ
// フォールバックさせる仕様なので、この 3 キーを必須にしてしまうと
// 「新フィールド追加前に保存された設定」が丸ごと初期値に巻き戻る
// （= url/sceneName 等、ユーザーが個別に設定した値まで消える）
// リグレッションになる。v.optional(schema, default) で per-field に
// デフォルトを効かせていることをここで固定する。
describe("obsSyncSettingsSchema（valibot）: gap/borderRadius/subtextPosition の後方互換", () => {
  const legacyStored = {
    enable: true,
    url: "ws://192.168.1.5:4455",
    password: "hunter2",
    baseUrl: "http://localhost:5173",
    sceneName: "配信",
    sourcePrefix: "VideoSlot",
    slotCount: 5,
    grid: { cols: 3, rows: 2 },
    area: { x: 10, y: 20, width: 1900, height: 1000 },
    // gap / borderRadius / subtextPosition は無い（Phase 8 以前の保存値）。
  };

  it("missing gap/borderRadius/subtextPosition default in, while every other field is preserved as-is", () => {
    const result = tryParseJson(
      JSON.stringify(legacyStored),
      obsSyncSettingsSchema,
    );

    expect(result.ok).toBe(true);
    expect(result.unwrapOr("FALLBACK" as unknown as ObsSyncSettings)).toEqual({
      ...legacyStored,
      gap: 0,
      borderRadius: 0,
      subtextPosition: "bottom-full",
    });
  });

  it("obsSyncSettingsStore を通した localStorage 境界でも同じデフォルト補完が起きる", async () => {
    localStorage.clear();
    vi.resetModules();
    localStorage.setItem(
      STORAGE_KEY_OBS_SYNC_SETTINGS,
      JSON.stringify(legacyStored),
    );

    const { obsSyncSettingsStore } = await import("./obsSyncSettings");
    const store = createStore();
    const settings = store.get(obsSyncSettingsStore);

    expect(settings).toEqual({
      ...legacyStored,
      gap: 0,
      borderRadius: 0,
      subtextPosition: "bottom-full",
    });
  });

  it("an explicitly-set gap/borderRadius/subtextPosition round-trips (not silently overwritten by the default)", () => {
    const stored = {
      ...legacyStored,
      gap: 12,
      borderRadius: 8,
      subtextPosition: "top-left",
    };
    const result = tryParseJson(JSON.stringify(stored), obsSyncSettingsSchema);

    expect(result.ok).toBe(true);
    expect(result.unwrapOr("FALLBACK" as unknown as ObsSyncSettings)).toEqual(
      stored,
    );
  });

  it("an invalid subtextPosition (not one of SUBTEXT_POSITIONS) still fails validation instead of silently defaulting", () => {
    const stored = { ...legacyStored, subtextPosition: "middle" };
    const result = tryParseJson(JSON.stringify(stored), obsSyncSettingsSchema);
    expect(result.ok).toBe(false);
  });

  it.each([
    ["malformed JSON", "{not json"],
    ["empty string", ""],
    ["structurally wrong value", JSON.stringify({ foo: "bar" })],
    ["literal null", JSON.stringify(null)],
  ])("%s は投げずに default にフォールバックする", (_label, raw) => {
    expect(() => tryParseJson(raw, obsSyncSettingsSchema)).not.toThrow();
    const result = tryParseJson(raw, obsSyncSettingsSchema);
    expect(result.ok).toBe(false);
    expect(result.unwrapOr("FALLBACK" as unknown as ObsSyncSettings)).toBe(
      "FALLBACK",
    );
  });
});

describe("obsSyncSettingsSchema（valibot）: 空の数値入力と範囲の検証", () => {
  const validStored = {
    enable: true,
    url: "ws://127.0.0.1:4455",
    password: "",
    baseUrl: "http://localhost:5173",
    sceneName: "配信",
    sourcePrefix: "VideoSlot",
    slotCount: 5,
    grid: { cols: 3, rows: 2 },
    area: { x: 0, y: 0, width: 1920, height: 1080 },
  };

  // 空文字・null を Number() に通すと 0 になり、slotCount / area が黙って
  // 0 扱いになってしまう。どちらも検証で弾かれ、保存値全体が初期値に戻ること
  // （= 0 が混入しないこと）を固定する。
  it.each([
    ["slotCount が空文字", { ...validStored, slotCount: "" }],
    ["slotCount が null", { ...validStored, slotCount: null }],
    ["grid.cols が空白だけ", { ...validStored, grid: { cols: " ", rows: 2 } }],
    [
      "area.x が空文字",
      { ...validStored, area: { ...validStored.area, x: "" } },
    ],
  ])("%s は検証に失敗する", (_label, stored) => {
    const result = tryParseJson(JSON.stringify(stored), obsSyncSettingsSchema);
    expect(result.ok).toBe(false);
  });

  it.each([
    ["width が 0", { width: 0, height: 1080 }],
    ["height が 0", { width: 1920, height: 0 }],
    ["width が負", { width: -1, height: 1080 }],
  ])("area の %s は検証に失敗する", (_label, area) => {
    const stored = { ...validStored, area: { x: 0, y: 0, ...area } };
    const result = tryParseJson(JSON.stringify(stored), obsSyncSettingsSchema);
    expect(result.ok).toBe(false);
  });

  it("area の width / height が 1 なら通る（下限は 1）", () => {
    const stored = {
      ...validStored,
      area: { x: 0, y: 0, width: 1, height: 1 },
    };
    const result = tryParseJson(JSON.stringify(stored), obsSyncSettingsSchema);
    expect(result.ok).toBe(true);
  });

  it("数値の文字列（number input 由来）は従来どおり数値に変換される", () => {
    const stored = {
      ...validStored,
      slotCount: "4",
      area: { x: "10", y: "20", width: "1900", height: "1000" },
    };
    const result = tryParseJson(JSON.stringify(stored), obsSyncSettingsSchema);
    expect(result.ok).toBe(true);
    expect(
      result.unwrapOr("FALLBACK" as unknown as ObsSyncSettings),
    ).toMatchObject({
      slotCount: 4,
      area: { x: 10, y: 20, width: 1900, height: 1000 },
    });
  });
});
