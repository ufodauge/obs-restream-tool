import type OBSWebSocket from "obs-websocket-js";

import { cellRect, type PixelRect } from "./layout";
import type { ObsSyncSettings } from "./obsSyncSettings";

// obsConnection.ts の ALIGN_TOP_LEFT と同じ値・同じ理由
// （boundsAlignment を明示しないと positionX/positionY が bounds box の
// 中心を指してしまう）。ここでも SetSceneItemTransform を投げるので揃える。
const ALIGN_TOP_LEFT = 5;

export type SetupLog =
  | { level: "info"; message: string }
  | { level: "success"; message: string }
  | { level: "error"; message: string };

// obsConnection.ts の sync() が不足スロットを自動作成するときも同じ URL を使う。
export const buildSlotUrl = (
  settings: Pick<ObsSyncSettings, "baseUrl">,
  index: number,
): string => {
  const base = settings.baseUrl.replace(/\/+$/, "");
  return `${base}/slot.html?index=${index}`;
};

const getSceneNames = async (obs: OBSWebSocket): Promise<Set<string>> => {
  const { scenes } = await obs.call("GetSceneList");
  return new Set(
    scenes
      .map((scene) => (scene as { sceneName?: string }).sceneName)
      .filter((name): name is string => name !== undefined),
  );
};

const getInputNames = async (obs: OBSWebSocket): Promise<Set<string>> => {
  const { inputs } = await obs.call("GetInputList", {
    inputKind: "browser_source",
  });
  return new Set(
    inputs
      .map((input) => (input as { inputName?: string }).inputName)
      .filter((name): name is string => name !== undefined),
  );
};

const getSceneItemNames = async (
  obs: OBSWebSocket,
  sceneName: string,
): Promise<Set<string>> => {
  const { sceneItems } = await obs.call("GetSceneItemList", { sceneName });
  return new Set(
    sceneItems
      .map((item) => (item as { sourceName?: string }).sourceName)
      .filter((name): name is string => name !== undefined),
  );
};

/**
 * settings の内容から、
 *  - シーンが無ければ作成
 *  - {sourcePrefix}0..{slotCount-1} という browser_source が無ければ作成
 *  - 既存だがシーンに入っていないだけなら追加
 *  - 既存なら URL だけ最新の baseUrl に合わせて更新
 * を行う。何度実行しても同じ結果になるように（冪等に）作ってある。
 *
 * obs.call の逐次 await で進捗を1ステップずつ yield するので、
 * 呼び出し側（UI）は for await でそのままログ表示できる。
 */
export async function* runObsSetup(
  obs: OBSWebSocket,
  settings: ObsSyncSettings,
): AsyncGenerator<SetupLog> {
  const sceneNames = await getSceneNames(obs);

  if (sceneNames.has(settings.sceneName)) {
    yield {
      level: "info",
      message: `シーン "${settings.sceneName}" は既に存在します`,
    };
  } else {
    await obs.call("CreateScene", { sceneName: settings.sceneName });
    yield {
      level: "success",
      message: `シーン "${settings.sceneName}" を作成しました`,
    };
  }

  const [inputNames, sceneItemNames] = await Promise.all([
    getInputNames(obs),
    getSceneItemNames(obs, settings.sceneName),
  ]);

  // ここではまだ panels.ts 側の状態（どのパネルが有効でどのサイズか）を
  // 知らないので、packGrid と同じサイズ別の詰め方はできない。行優先の
  // 均等グリッドに「サイズは全部 1」とみなして置くだけの既定値であり、
  // 実際の見た目は直後に走る本同期（forceResync 経由の obsConnection.ts の
  // sync()）が上書きする想定。gap のインセットだけは packGrid と同じ
  // cellRect を使って揃えておく（そうしないと、初回セットアップ直後の
  // 見た目と本同期後の見た目で隙間の入り方が変わってしまう）。
  //
  // これを入れずに CreateInput の inputSettings（url/width/height。
  // width/height はブラウザソース自体の解像度で、シーン上の座標とは無関係）
  // だけで済ませると、シーンアイテムの座標は OBS の既定値のまま
  // （実質 0,0）で全ソースが積み重なる。obsSyncConnection 側の本同期が
  // 何らかの理由で（sync.html を開いていない・enable がオフ等）走らなければ
  // その状態がずっと残る — 実機で報告された症状と一致する。
  const defaultRect = (index: number): PixelRect => {
    const row = Math.floor(index / settings.grid.cols);
    const col = index % settings.grid.cols;
    return cellRect(row, col, 1, settings.grid, settings.area, settings.gap);
  };

  for (let index = 0; index < settings.slotCount; index++) {
    const sourceName = `${settings.sourcePrefix}${index}`;
    const url = buildSlotUrl(settings, index);
    const rect = defaultRect(index);

    try {
      let sceneItemId: number;

      if (!inputNames.has(sourceName)) {
        const created = await obs.call("CreateInput", {
          sceneName: settings.sceneName,
          inputName: sourceName,
          inputKind: "browser_source",
          inputSettings: {
            url,
            // ブラウザソース自体の解像度。gap インセット後の rect からそのまま
            // 出すと 0 や負値もあり得なくはない（gap が area に対して極端に
            // 大きい等）ので、以前と同じく 1px を下限にしておく。
            width: Math.max(1, Math.round(rect.width)),
            height: Math.max(1, Math.round(rect.height)),
            // 非表示のスロットは実際にデコードを止めてCPU/GPUを節約する
            shutdown: true,
          },
          sceneItemEnabled: true,
        });
        sceneItemId = created.sceneItemId;
        yield { level: "success", message: `${sourceName} を新規作成しました` };
      } else {
        await obs.call("SetInputSettings", {
          inputName: sourceName,
          inputSettings: { url },
          overlay: true,
        });

        if (sceneItemNames.has(sourceName)) {
          const existing = await obs.call("GetSceneItemId", {
            sceneName: settings.sceneName,
            sourceName,
          });
          sceneItemId = existing.sceneItemId;
          yield { level: "info", message: `${sourceName} は既に用意済みです` };
        } else {
          const created = await obs.call("CreateSceneItem", {
            sceneName: settings.sceneName,
            sourceName,
            sceneItemEnabled: true,
          });
          sceneItemId = created.sceneItemId;
          yield {
            level: "success",
            message: `既存の ${sourceName} をシーンに追加しました`,
          };
        }
      }

      await obs.call("SetSceneItemTransform", {
        sceneName: settings.sceneName,
        sceneItemId,
        sceneItemTransform: {
          positionX: rect.x,
          positionY: rect.y,
          alignment: ALIGN_TOP_LEFT,
          boundsType: "OBS_BOUNDS_STRETCH",
          boundsAlignment: ALIGN_TOP_LEFT,
          boundsWidth: rect.width,
          boundsHeight: rect.height,
        },
      });
    } catch (error) {
      yield {
        level: "error",
        message: `${sourceName}: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  yield { level: "success", message: "セットアップが完了しました" };
}
