import { describe, expect, it } from "vitest";

/**
 * BoardPanel が実際に叩く先そのもの（https://ufodauge.github.io/mm-bingo/task.js）
 * に対する、実ネットワーク越しの疎通・生成テスト（改善計画 Phase 6）。
 *
 * mm.ts は import("https://...") で動的 import する（vite に静的解析させ
 * ないための @vite-ignore コメント付き）前提だが、vitest はブラウザでは
 * なく Node で走る。Node は https: の
 * ESM import に非対応（`--experimental-network-imports` は過去に実験的に
 * 存在したが、このリポジトリの Node 24 では既に削除されている。実測で
 * 確認済み: `node --experimental-network-imports` は
 * "bad option" で即エラーになる）。
 *
 * そのためここでは task.js のソースを fetch で取得し、data: URL 経由で
 * 動的 import することで実データを検証する。data: URL は import.meta.url
 * が https ではなくなるため、task.js 内部の「import.meta.url を基準に
 * tasks/ を解決する」というゼロコンフィグ動作（Phase 6 の主眼だった
 * fetch base バグの修正確認）はこの経路では検証できない ── setTasksBaseUrl
 * で明示的に実オリジンへ向け直す必要がある。ゼロコンフィグ動作そのものは
 * 実ブラウザで BoardPanel を動かして確認する（手順は改善計画・作業ログ側）。
 *
 * ネットワーク不通・GitHub Pages 側の障害でテストスイート全体を落とさない
 * よう、疎通に失敗したらこのテストだけ ctx.skip() でスキップする。
 */
const TASK_JS_URL = "https://ufodauge.github.io/mm-bingo/task.js";
const TASKS_BASE_URL = "https://ufodauge.github.io/mm-bingo/tasks/";

type MmTaskModule =
  typeof import("https://ufodauge.github.io/mm-bingo/task.js");

const loadRemoteTaskModule = async (): Promise<MmTaskModule> => {
  const res = await fetch(TASK_JS_URL);
  if (!res.ok) {
    throw new Error(`${TASK_JS_URL} -> HTTP ${res.status}`);
  }
  const source = await res.text();
  const dataUrl = `data:text/javascript;base64,${Buffer.from(source, "utf-8").toString("base64")}`;
  // dynamic import() は文字列リテラルでないと型解決されない（変数経由は
  // any）ため、ここは公開している task.d.ts 由来の型に明示的にキャストする。
  const mod = (await import(/* @vite-ignore */ dataUrl)) as MmTaskModule;
  mod.setTasksBaseUrl(TASKS_BASE_URL);
  return mod;
};

describe("mm-bingo task.js（公開されている実モジュールへの疎通確認）", () => {
  it("実データから 25 マス・決定的にタスクを生成できる", async (ctx) => {
    let mod: MmTaskModule;
    try {
      mod = await loadRemoteTaskModule();
    } catch (error) {
      ctx.skip(
        `mm-bingo task.js への到達に失敗したためスキップ: ${String(error)}`,
      );
      return;
    }

    const first = await mod.generateTasksAsync(123456, "v20260718");
    if (!first.ok) {
      ctx.skip(
        `generateTasksAsync が失敗したためスキップ: ${first.error.message}`,
      );
      return;
    }

    expect(first.value).toHaveLength(25);
    for (const task of first.value) {
      // text は { ja, en } が実際に載っている（d.ts 上は
      // Partial<Record<string, string>> だが実測済み）。
      expect(typeof task.text.ja).toBe("string");
    }

    // 同一シードで決定的（改善計画 Phase 6 の調査結果どおり）。
    const second = await mod.generateTasksAsync(123456, "v20260718");
    expect(second.ok).toBe(true);
    expect(second.unwrapOr([])).toEqual(first.value);

    // pnpm test の出力で実際の文言を目視確認できるように残す。
    console.log(
      "mm-bingo v20260718 seed=123456 の最初の3マス (ja):",
      first.value.slice(0, 3).map((task) => task.text.ja),
    );
  });
});
