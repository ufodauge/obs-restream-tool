import OBSWebSocket from "obs-websocket-js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FakeObsWebSocketServer } from "@/testing/fakeObsServer";

import { runObsSetup } from "./obsSetup";
import type { ObsSyncSettings } from "./obsSyncSettings";

const SCENE = "TestScene";

const baseSettings: ObsSyncSettings = {
  enable: true,
  url: "",
  password: "",
  baseUrl: "http://localhost:5173",
  sceneName: SCENE,
  sourcePrefix: "VideoSlot",
  slotCount: 4,
  grid: { cols: 2, rows: 2 },
  area: { x: 0, y: 0, width: 200, height: 200 },
  gap: 0,
  borderRadius: 0,
  subtextPosition: "bottom-full",
};

describe("obsSetup.ts (runObsSetup) against a fake obs-websocket v5 server", () => {
  let server: FakeObsWebSocketServer;
  let obs: OBSWebSocket;

  beforeEach(async () => {
    server = new FakeObsWebSocketServer();
    await server.start();
    obs = new OBSWebSocket();
    await obs.connect(server.url);
  });

  afterEach(async () => {
    await obs.disconnect();
    await server.stop();
  });

  const drain = async (settings: ObsSyncSettings) => {
    const logs = [];
    for await (const log of runObsSetup(obs, settings)) {
      logs.push(log);
    }
    return logs;
  };

  it("gives every newly-created slot a distinct default position (row-major) instead of leaving them stacked at the OBS default", async () => {
    server.setScenes([]); // シーン自体も無い、まっさらな状態

    await drain(baseSettings);

    const transformRequests = server.getRequestsByType("SetSceneItemTransform");
    expect(transformRequests).toHaveLength(4);

    // 2x2 グリッド、cell 100x100 の行優先: index 0..3 → (0,0) (100,0) (0,100) (100,100)
    const expectedPositions = [
      { positionX: 0, positionY: 0 },
      { positionX: 100, positionY: 0 },
      { positionX: 0, positionY: 100 },
      { positionX: 100, positionY: 100 },
    ];
    for (let index = 0; index < 4; index++) {
      const sceneItemId = server.getSceneItem(
        SCENE,
        `VideoSlot${index}`,
      )?.sceneItemId;
      const req = transformRequests.find(
        (r) => r.requestData.sceneItemId === sceneItemId,
      );
      expect(req?.requestData).toEqual({
        sceneName: SCENE,
        sceneItemId,
        sceneItemTransform: {
          ...expectedPositions[index],
          alignment: 5,
          boundsType: "OBS_BOUNDS_STRETCH",
          boundsAlignment: 5,
          boundsWidth: 100,
          boundsHeight: 100,
        },
      });
    }

    // 座標が全部バラバラであること（本題の regression と同じ観点）。
    const positions = transformRequests.map((r) =>
      JSON.stringify(r.requestData.sceneItemTransform as object),
    );
    expect(new Set(positions).size).toBe(4);
  });

  it("also (re-)positions sources that already exist in the scene (idempotent re-run)", async () => {
    server.seedSceneItems(SCENE, [
      "VideoSlot0",
      "VideoSlot1",
      "VideoSlot2",
      "VideoSlot3",
    ]);
    server.clearRequests();

    const logs = await drain(baseSettings);

    // 全スロットが「既に用意済み」ログになり、CreateInput/CreateSceneItem は呼ばれない。
    expect(server.getRequestsByType("CreateInput")).toHaveLength(0);
    expect(server.getRequestsByType("CreateSceneItem")).toHaveLength(0);
    expect(logs.filter((l) => l.message.includes("既に用意済み"))).toHaveLength(
      4,
    );

    // それでも SetSceneItemTransform は毎回全スロットに送られる
    // （既存ソースが過去に stack したままでも直す）。
    expect(server.getRequestsByType("SetSceneItemTransform")).toHaveLength(4);
  });

  it("adds a scene item for an input that exists but isn't in the scene yet, then positions it", async () => {
    server.setScenes([SCENE]);
    server.setInputs(["VideoSlot0"]);

    await drain({ ...baseSettings, slotCount: 1 });

    expect(server.getRequestsByType("CreateSceneItem")).toHaveLength(1);
    const sceneItemId = server.getSceneItem(SCENE, "VideoSlot0")?.sceneItemId;
    expect(sceneItemId).toBeDefined();
    const transformReq = server
      .getRequestsByType("SetSceneItemTransform")
      .find((r) => r.requestData.sceneItemId === sceneItemId);
    expect(transformReq).toBeDefined();
  });

  it("insets the placeholder rect (and the browser source's own resolution) by gap, matching layout.ts's cellRect used by packGrid", async () => {
    server.setScenes([]);

    // 2x2 グリッド、cell 100x100、gap 20: どのセルも「外周は詰めず、
    // 隣接セルとの境界だけ gap/2 ずつインセット」される 1x1 のセルなので、
    // 4 マスとも同じ 90x90 になる（cellRect のテストと同じ計算方法）。
    await drain({ ...baseSettings, gap: 20 });

    const expectedPositions = [
      { positionX: 0, positionY: 0 },
      { positionX: 110, positionY: 0 },
      { positionX: 0, positionY: 110 },
      { positionX: 110, positionY: 110 },
    ];
    const transformRequests = server.getRequestsByType("SetSceneItemTransform");
    for (let index = 0; index < 4; index++) {
      const sceneItemId = server.getSceneItem(
        SCENE,
        `VideoSlot${index}`,
      )?.sceneItemId;
      const req = transformRequests.find(
        (r) => r.requestData.sceneItemId === sceneItemId,
      );
      expect(req?.requestData).toEqual({
        sceneName: SCENE,
        sceneItemId,
        sceneItemTransform: {
          ...expectedPositions[index],
          alignment: 5,
          boundsType: "OBS_BOUNDS_STRETCH",
          boundsAlignment: 5,
          boundsWidth: 90,
          boundsHeight: 90,
        },
      });
    }

    // ブラウザソース自体の解像度（CreateInput の inputSettings.width/height）も
    // gap インセット後の rect と一致させている。
    const createRequests = server.getRequestsByType("CreateInput");
    expect(createRequests).toHaveLength(4);
    for (const req of createRequests) {
      const settings = req.requestData.inputSettings as {
        width: number;
        height: number;
      };
      expect(settings.width).toBe(90);
      expect(settings.height).toBe(90);
    }
  });
});
