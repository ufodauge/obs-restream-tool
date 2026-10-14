import { describe, expect, it } from "vitest";

import { applyLaunchOverrides } from "./obsLaunchOverrides";
import type { ObsSyncSettings } from "./obsSyncSettings";

const base: ObsSyncSettings = {
  enable: false,
  url: "ws://127.0.0.1:4455",
  password: "",
  baseUrl: "http://localhost:5173",
  sceneName: "",
  sourcePrefix: "VideoSlot",
  slotCount: 9,
  grid: { cols: 3, rows: 3 },
  area: { x: 0, y: 0, width: 1920, height: 1080 },
  gap: 0,
  borderRadius: 0,
  subtextPosition: "bottom-full",
};

describe("applyLaunchOverrides", () => {
  it("通常環境（クエリ無し・localhost）では何も変えない", () => {
    expect(
      applyLaunchOverrides(base, false, "", "http://localhost:5173/"),
    ).toEqual(base);
  });

  it("クエリのパスワード・URL で上書きし、初回のみ enable と sceneName を補う", () => {
    const r = applyLaunchOverrides(
      base,
      false,
      "?obsUrl=ws%3A%2F%2F127.0.0.1%3A4456&obsPassword=s3cret&obsScene=Restream",
      "http://localhost:5173/index.html",
    );
    expect(r).toMatchObject({
      url: "ws://127.0.0.1:4456",
      password: "s3cret",
      sceneName: "Restream",
      enable: true,
      baseUrl: "http://localhost:5173",
    });
  });

  it("保存済みの enable=false / sceneName は上書きしないが、パスワードは常に追従", () => {
    const stored = { ...base, password: "old", sceneName: "Mine" };
    const r = applyLaunchOverrides(
      stored,
      true,
      "?obsPassword=new&obsScene=Restream",
      "http://localhost/",
    );
    expect(r.password).toBe("new");
    expect(r.sceneName).toBe("Mine");
    expect(r.enable).toBe(false);
  });

  it("ランチャーのクエリがあるとき baseUrl をページのディレクトリにする（ポート維持）", () => {
    const r = applyLaunchOverrides(
      base,
      true,
      "?obsUrl=ws%3A%2F%2F127.0.0.1%3A4455",
      "http://localhost:48610/index.html?obsUrl=x",
    );
    expect(r.baseUrl).toBe("http://localhost:48610");
  });

  it("クエリが無ければ localhost:ポートでも baseUrl は変えない", () => {
    const r = applyLaunchOverrides(base, true, "", "http://localhost:48610/");
    expect(r.baseUrl).toBe(base.baseUrl);
  });

  it("不正な pageUrl でも例外にならない", () => {
    expect(applyLaunchOverrides(base, true, "", "not a url")).toEqual(base);
  });
});
