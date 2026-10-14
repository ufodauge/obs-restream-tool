import { afterEach, describe, expect, it, vi } from "vitest";

import { randomId } from "./randomId";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("randomId", () => {
  it("crypto.randomUUID があればそれを使う", () => {
    const randomUUID = vi.fn<() => string>(
      () => "11111111-2222-4333-8444-555555555555",
    );
    vi.stubGlobal("crypto", {
      randomUUID,
      getRandomValues: vi.fn<(b: Uint8Array) => Uint8Array>(),
    });
    expect(randomId()).toBe("11111111-2222-4333-8444-555555555555");
    expect(randomUUID).toHaveBeenCalledTimes(1);
  });

  it("randomUUID が undefined（非 secure context）なら getRandomValues で v4 を作る", () => {
    vi.stubGlobal("crypto", {
      randomUUID: undefined,
      getRandomValues: (b: Uint8Array) => {
        b.fill(0xff);
        return b;
      },
    });
    expect(randomId()).toBe("ffffffff-ffff-4fff-bfff-ffffffffffff");
  });

  it("フォールバックでも毎回 RFC4122 v4 形式で、値が異なる", () => {
    vi.stubGlobal("crypto", {
      randomUUID: undefined,
      getRandomValues: (b: Uint8Array) => {
        for (let i = 0; i < b.length; i++)
          b[i] = Math.floor(Math.random() * 256);
        return b;
      },
    });
    const ids = Array.from({ length: 50 }, () => randomId());
    for (const id of ids) expect(id).toMatch(UUID_V4);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
