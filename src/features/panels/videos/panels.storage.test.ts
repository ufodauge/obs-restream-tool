import { createStore } from "jotai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEY_PANEL_VIDEOS } from "@/features/storage";
import { tryParseJson } from "@/libs/json/json";

import { panelTypeSchema, type PanelType } from "./panels";

// Phase 7 (zod → valibot): このファイルは移行前に手動で確認していた
// 「保存境界で壊れない」性質を、再確認できる形でテストに固定する。
//
// videoPanelStores（atomWithValidatedStorage({ getOnInit: true })）は
// モジュール読み込み時点で localStorage.getItem を同期的に叩くため、
// 「レガシーな保存値を実際にどう読み込むか」を検証するには、
// localStorage を先に汚してから vi.resetModules() でモジュールを
// 作り直す必要がある（panels.ts を静的 import しているとタイミングが
// 合わない）。
describe("videoPanelStores の localStorage 境界（valibot 移行後）", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("A-1: 旧データの文字列 size ('2') を数値の 2 として読み込む", async () => {
    localStorage.setItem(
      STORAGE_KEY_PANEL_VIDEOS,
      JSON.stringify([
        {
          type: "twitch",
          channel: "sva16162",
          enable: true,
          size: "2", // react-hook-form 時代の valueAsNumber 無し register() が残した文字列
          id: "legacy-1",
        },
      ]),
    );

    const { videoPanelStores } = await import("./panels");
    const store = createStore();
    const panels = store.get(videoPanelStores);

    expect(panels).toHaveLength(1);
    expect(panels[0].size).toBe(2);
    expect(typeof panels[0].size).toBe("number");
  });
});

describe("panelTypeSchema（valibot）単体でのフォールバック", () => {
  const validPanel: PanelType = {
    type: "twitch",
    channel: "sva16162",
    enable: true,
    size: 1,
    id: "ok-1",
  };
  const FALLBACK = "FALLBACK" as unknown as PanelType;

  it.each([
    ["malformed JSON", "{not json"],
    ["empty string", ""],
    ["structurally wrong value", JSON.stringify({ foo: "bar" })],
    [
      "missing key (id)",
      JSON.stringify({
        type: "twitch",
        channel: "sva16162",
        enable: true,
        size: 1,
      }),
    ],
    ["literal null", JSON.stringify(null)],
  ])("%s は投げずに default にフォールバックする", (_label, raw) => {
    expect(() => tryParseJson(raw, panelTypeSchema)).not.toThrow();
    const result = tryParseJson(raw, panelTypeSchema);
    expect(result.ok).toBe(false);
    expect(result.unwrapOr(FALLBACK)).toBe(FALLBACK);
  });

  it("有効な入力はそのまま通す（対照）", () => {
    const result = tryParseJson(JSON.stringify(validPanel), panelTypeSchema);
    expect(result.ok).toBe(true);
    expect(result.unwrapOr(FALLBACK)).toEqual(validPanel);
  });

  it("enable は strict boolean のまま: 文字列 'false' は true に化けず弾かれる", () => {
    // z.coerce.boolean()（= Boolean(x)）だと "false" が true になってしまう
    // 落とし穴が Phase 2 で意図的に潰されている。valibot 移行でも
    // v.boolean() のまま（変換を挟まない）であることをここで固定する。
    const raw = JSON.stringify({ ...validPanel, enable: "false" });
    const result = tryParseJson(raw, panelTypeSchema);
    expect(result.ok).toBe(false);
  });
});
