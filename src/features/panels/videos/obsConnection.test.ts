import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FakeObsWebSocketServer } from "@/testing/fakeObsServer";
import { waitFor } from "@/testing/waitFor";

import { packGrid } from "./layout";
import { ObsSyncConnection } from "./obsConnection";
import type { ObsSyncSettings } from "./obsSyncSettings";
import { selectEnabledPanelsWithSlotIndex, type PanelType } from "./panels";

// obsConnection.ts の (未 export の) SyncSettings と同じ形。sync() は
// 構造的に互換な値なら受け取れるので、ここでは型だけ揃えて自前で持つ。
type SyncSettings = Pick<
  ObsSyncSettings,
  "sceneName" | "sourcePrefix" | "slotCount" | "grid" | "area" | "gap"
>;

let nextPanelId = 0;
const makePanel = (enable: boolean, size: 1 | 2): PanelType => ({
  type: "twitch",
  channel: `channel-${nextPanelId}`,
  subtext: `panel-${nextPanelId}`,
  enable,
  size,
  id: `panel-${nextPanelId++}`,
});

const SCENE = "TestScene";
const PREFIX = "VideoSlot";

const sourceNameOf = (index: number): string => `${PREFIX}${index}`;

describe("obsConnection.ts (ObsSyncConnection) against a fake obs-websocket v5 server", () => {
  let server: FakeObsWebSocketServer;
  let connection: ObsSyncConnection;

  beforeEach(async () => {
    server = new FakeObsWebSocketServer();
    await server.start();
    connection = new ObsSyncConnection();
  });

  afterEach(async () => {
    connection.shutdown();
    await server.stop();
  });

  const connect = async (): Promise<void> => {
    connection.configureConnection(true, server.url, "");
    await waitFor(() => connection.getStatus().state === "connected");
  };

  it("sends distinct SetSceneItemTransform positions to every enabled slot, matching packGrid, and disables slots with no rect (regression test for 'all sources land on the same coordinates')", async () => {
    // panels[2] は無効。他の 4 枚が有効（size は 1,2,1,1）。
    const panels: PanelType[] = [
      makePanel(true, 1),
      makePanel(true, 2),
      makePanel(false, 1),
      makePanel(true, 1),
      makePanel(true, 1),
    ];
    const settings: SyncSettings = {
      sceneName: SCENE,
      sourcePrefix: PREFIX,
      slotCount: panels.length,
      grid: { cols: 3, rows: 3 },
      area: { x: 0, y: 0, width: 300, height: 300 },
      gap: 0,
    };

    // runObsSetup が既に走って全スロット分のシーンアイテムが存在する状態。
    server.seedSceneItems(
      SCENE,
      Array.from({ length: settings.slotCount }, (_, i) => sourceNameOf(i)),
    );

    await connect();
    await connection.sync(panels, settings);

    const transformRequests = server.getRequestsByType("SetSceneItemTransform");
    const enabledRequests = server.getRequestsByType("SetSceneItemEnabled");

    // packGrid が実際に何を返すか（production コードと同じ組み立て方）を
    // 使って期待値を作る — 手計算の数値を決め打ちしない。
    const enabledWithSlot = selectEnabledPanelsWithSlotIndex(panels);
    const rects = packGrid(
      enabledWithSlot.map(({ panel }) => panel.size),
      settings.grid,
      settings.area,
    );
    const expectedRectBySlotIndex = new Map<number, (typeof rects)[number]>();
    enabledWithSlot.forEach(({ slotIndex }, i) => {
      expectedRectBySlotIndex.set(slotIndex, rects[i]);
    });

    // 有効な 4 スロット（0,1,3,4）はすべて SetSceneItemTransform を受け取り、
    // packGrid の計算どおりの座標・サイズ・alignment を持つ。
    for (const slotIndex of [0, 1, 3, 4]) {
      const expectedRect = expectedRectBySlotIndex.get(slotIndex);
      expect(expectedRect).toBeDefined();
      const sceneItemId = server.getSceneItem(
        SCENE,
        sourceNameOf(slotIndex),
      )?.sceneItemId;

      const req = transformRequests.find(
        (r) => r.requestData.sceneItemId === sceneItemId,
      );
      expect(
        req,
        `no SetSceneItemTransform for slot ${slotIndex}`,
      ).toBeDefined();
      expect(req?.requestData).toEqual({
        sceneName: SCENE,
        sceneItemId,
        sceneItemTransform: {
          positionX: expectedRect?.x,
          positionY: expectedRect?.y,
          alignment: 5,
          boundsType: "OBS_BOUNDS_STRETCH",
          boundsAlignment: 5,
          boundsWidth: expectedRect?.width,
          boundsHeight: expectedRect?.height,
        },
      });
    }

    // 本題の回帰テスト: 全スロットが同じ座標に積み重なっていないこと。
    expect(transformRequests).toHaveLength(4);
    const positions = transformRequests.map(
      (r) =>
        `${(r.requestData.sceneItemTransform as { positionX: number }).positionX},${
          (r.requestData.sceneItemTransform as { positionY: number }).positionY
        }`,
    );
    expect(new Set(positions).size).toBe(positions.length);

    // 無効化された panels[2] (VideoSlot2) は SetSceneItemEnabled: false のみ。
    // transform は一切送らない。
    const disabledId = server.getSceneItem(SCENE, sourceNameOf(2))?.sceneItemId;
    expect(
      transformRequests.some((r) => r.requestData.sceneItemId === disabledId),
    ).toBe(false);
    const disabledEnabledReq = enabledRequests.find(
      (r) => r.requestData.sceneItemId === disabledId,
    );
    expect(disabledEnabledReq?.requestData).toEqual({
      sceneName: SCENE,
      sceneItemId: disabledId,
      sceneItemEnabled: false,
    });

    // 有効な 4 スロットは SetSceneItemEnabled: true。
    for (const slotIndex of [0, 1, 3, 4]) {
      const sceneItemId = server.getSceneItem(
        SCENE,
        sourceNameOf(slotIndex),
      )?.sceneItemId;
      const req = enabledRequests.find(
        (r) => r.requestData.sceneItemId === sceneItemId,
      );
      expect(req?.requestData).toEqual({
        sceneName: SCENE,
        sceneItemId,
        sceneItemEnabled: true,
      });
    }

    expect(connection.getStatus()).toMatchObject({
      state: "connected",
      failedSources: [],
    });
  });

  it("keeps each slot index's enabled-state tied only to its own panel (A-3): toggling one panel does not disable or reshuffle other slots", async () => {
    const panels: PanelType[] = [
      makePanel(true, 1),
      makePanel(true, 1),
      makePanel(false, 1),
      makePanel(true, 1),
      makePanel(true, 1),
    ];
    const settings: SyncSettings = {
      sceneName: SCENE,
      sourcePrefix: PREFIX,
      slotCount: panels.length,
      grid: { cols: 3, rows: 3 },
      area: { x: 0, y: 0, width: 300, height: 300 },
      gap: 0,
    };
    server.seedSceneItems(
      SCENE,
      Array.from({ length: settings.slotCount }, (_, i) => sourceNameOf(i)),
    );
    await connect();

    await connection.sync(panels, settings);
    server.clearRequests();

    // panels[3] だけを無効化して再同期する。
    const toggledPanels = panels.map((p, i) =>
      i === 3 ? { ...p, enable: false } : p,
    );
    await connection.sync(toggledPanels, settings);

    const enabledRequests = server.getRequestsByType("SetSceneItemEnabled");
    const enabledBySlot = new Map<number, boolean>();
    for (let index = 0; index < settings.slotCount; index++) {
      const sceneItemId = server.getSceneItem(
        SCENE,
        sourceNameOf(index),
      )?.sceneItemId;
      const req = enabledRequests.find(
        (r) => r.requestData.sceneItemId === sceneItemId,
      );
      if (req === undefined) {
        throw new Error(`no SetSceneItemEnabled request for slot ${index}`);
      }
      enabledBySlot.set(
        index,
        (req.requestData as { sceneItemEnabled: boolean }).sceneItemEnabled,
      );
    }

    // トグルした panels[3] だけが disabled になり、他はそれぞれの
    // panels[index].enable のとおりのまま（panels[2] は最初から false）。
    expect(enabledBySlot.get(0)).toBe(true);
    expect(enabledBySlot.get(1)).toBe(true);
    expect(enabledBySlot.get(2)).toBe(false);
    expect(enabledBySlot.get(3)).toBe(false);
    expect(enabledBySlot.get(4)).toBe(true);
  });

  it("does not let a panel without a slot (index >= slotCount) take up grid space ahead of the real slots", async () => {
    // panels[3] は slotCount(3) の外にあり OBS 側のソースが無い。size 2 なので
    // size 降順ソートでは先頭に来るが、packGrid に渡すと左上の 2x2 を
    // 取ってしまい、slot 0〜2 の 1x1 が左上に詰められなくなる。
    const panels: PanelType[] = [
      makePanel(true, 1),
      makePanel(true, 1),
      makePanel(true, 1),
      makePanel(true, 2),
    ];
    const settings: SyncSettings = {
      sceneName: SCENE,
      sourcePrefix: PREFIX,
      slotCount: 3,
      grid: { cols: 3, rows: 3 },
      area: { x: 0, y: 0, width: 300, height: 300 },
      gap: 0,
    };
    server.seedSceneItems(
      SCENE,
      Array.from({ length: settings.slotCount }, (_, i) => sourceNameOf(i)),
    );

    await connect();
    await connection.sync(panels, settings);

    // 3x3 の 1 セル = 100px。slot 0〜2 は 1 行目に x=0,100,200 で並ぶ。
    const transformRequests = server.getRequestsByType("SetSceneItemTransform");
    const positionXBySlot = [0, 1, 2].map((slotIndex) => {
      const sceneItemId = server.getSceneItem(
        SCENE,
        sourceNameOf(slotIndex),
      )?.sceneItemId;
      const req = transformRequests.find(
        (r) => r.requestData.sceneItemId === sceneItemId,
      );
      if (req === undefined) {
        throw new Error(`no SetSceneItemTransform for slot ${slotIndex}`);
      }
      const transform = (
        req.requestData as {
          sceneItemTransform: { positionX: number; boundsWidth: number };
        }
      ).sceneItemTransform;
      return { x: transform.positionX, width: transform.boundsWidth };
    });
    expect(positionXBySlot).toEqual([
      { x: 0, width: 100 },
      { x: 100, width: 100 },
      { x: 200, width: 100 },
    ]);
    expect(transformRequests).toHaveLength(3);
  });

  it("surfaces a failed sync (e.g. sources not created yet) as failedSources instead of silently succeeding", async () => {
    // seedSceneItems を呼ばない = runObsSetup がまだ一度も走っていない状態。
    // GetSceneItemId は全スロットで失敗するはず。
    server.setScenes([SCENE]);

    const panels: PanelType[] = [makePanel(true, 1), makePanel(true, 1)];
    const settings: SyncSettings = {
      sceneName: SCENE,
      sourcePrefix: PREFIX,
      slotCount: panels.length,
      grid: { cols: 2, rows: 1 },
      area: { x: 0, y: 0, width: 200, height: 100 },
      gap: 0,
    };

    await connect();
    await connection.sync(panels, settings);

    // 以前は console.error に流すだけで status には一切反映されず、UI は
    // ずっと緑の「同期中」だった。今は failedSources に載る。
    expect(connection.getStatus()).toMatchObject({
      state: "connected",
      failedSources: [sourceNameOf(0), sourceNameOf(1)],
    });
    // 失敗しているので当然 SetSceneItemTransform は 1 件も送られていない。
    expect(server.getRequestsByType("SetSceneItemTransform")).toHaveLength(0);
  });

  it("forceResync clears the sceneItemId cache and re-syncs immediately (setup-button -> sync-page handoff)", async () => {
    server.setScenes([SCENE]);
    const panels: PanelType[] = [makePanel(true, 1)];
    const settings: SyncSettings = {
      sceneName: SCENE,
      sourcePrefix: PREFIX,
      slotCount: 1,
      grid: { cols: 1, rows: 1 },
      area: { x: 0, y: 0, width: 100, height: 100 },
      gap: 0,
    };

    await connect();

    // 1 回目: まだソースが無いので失敗する
    // （= ObsSetupButton が別ページで動いていて、まだ CreateInput していない状態）。
    await connection.sync(panels, settings);
    expect(connection.getStatus()).toMatchObject({
      failedSources: [sourceNameOf(0)],
    });

    // ObsSetupButton 側の runObsSetup がソースを作り終えた、という想定。
    server.seedSceneItems(SCENE, [sourceNameOf(0)]);

    await connection.forceResync(panels, settings);

    expect(connection.getStatus()).toMatchObject({
      state: "connected",
      failedSources: [],
    });
    expect(server.getRequestsByType("SetSceneItemTransform")).toHaveLength(1);
  });

  it("insets SetSceneItemTransform rects by a non-zero gap, and lets a size-2 panel absorb the interior gap it spans instead of being inset on both sides", async () => {
    // 3 cols x 2 rows, cell 100x100, gap 30. panels[0] は size 2
    // （(0,0)-(1,1) の 4 セル分を占有）、panels[1] は size 1（(0,2)）。
    //
    // gap は「セルの境界」にだけ 30px（= 片側 15px ずつ）挿入され、area の
    // 外周には挿入されない。size 2 の panels[0] は自分が跨ぐ内部の境界
    // （col0-col1 の間）ではインセットされず、外側の境界（col1-col2 の間、
    // つまり panels[1] との間）でだけ 15px インセットされる —
    // 「2 回インセットして gap 分小さくなりすぎる」を避けるための挙動。
    const panels: PanelType[] = [makePanel(true, 2), makePanel(true, 1)];
    const settings: SyncSettings = {
      sceneName: SCENE,
      sourcePrefix: PREFIX,
      slotCount: panels.length,
      grid: { cols: 3, rows: 2 },
      area: { x: 0, y: 0, width: 300, height: 200 },
      gap: 30,
    };
    server.seedSceneItems(
      SCENE,
      Array.from({ length: settings.slotCount }, (_, i) => sourceNameOf(i)),
    );

    await connect();
    await connection.sync(panels, settings);

    const transformRequests = server.getRequestsByType("SetSceneItemTransform");
    expect(transformRequests).toHaveLength(2);

    const sizeTwoId = server.getSceneItem(SCENE, sourceNameOf(0))?.sceneItemId;
    const sizeOneId = server.getSceneItem(SCENE, sourceNameOf(1))?.sceneItemId;

    // size 2: 外周（左・上・下）は area の端に接しているのでインセット無し。
    // 右だけ panels[1] と隣接するので gap/2 = 15px インセットされ、
    // 200 - 15 = 185 幅になる（跨いだ内部の col0-col1 境界はインセットしない）。
    expect(
      transformRequests.find((r) => r.requestData.sceneItemId === sizeTwoId)
        ?.requestData,
    ).toEqual({
      sceneName: SCENE,
      sceneItemId: sizeTwoId,
      sceneItemTransform: {
        positionX: 0,
        positionY: 0,
        alignment: 5,
        boundsType: "OBS_BOUNDS_STRETCH",
        boundsAlignment: 5,
        boundsWidth: 185,
        boundsHeight: 200,
      },
    });

    // size 1: 左だけ size-2 側と隣接するので 15px インセットされて
    // x = 200 + 15 = 215、幅は 100 - 15 = 85。縦方向は下の行との境界に
    // 接するので同様に 15px インセットされ、高さも 85。
    expect(
      transformRequests.find((r) => r.requestData.sceneItemId === sizeOneId)
        ?.requestData,
    ).toEqual({
      sceneName: SCENE,
      sceneItemId: sizeOneId,
      sceneItemTransform: {
        positionX: 215,
        positionY: 0,
        alignment: 5,
        boundsType: "OBS_BOUNDS_STRETCH",
        boundsAlignment: 5,
        boundsWidth: 85,
        boundsHeight: 85,
      },
    });
  });
});
