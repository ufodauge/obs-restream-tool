import { createHash, randomUUID } from "node:crypto";

import { WebSocketServer, type RawData, type WebSocket as WsSocket } from "ws";

// obs-websocket v5 の WebSocket サブプロトコル名。obs-websocket-js は
// json.ts で `protocol = "obswebsocket.json"` を使い、接続確立後に
// `socket.protocol` がこれと一致しているかを確認する（一致しないと
// "Server sent an invalid subprotocol" で接続自体が失敗する）ので、
// フェイクサーバーもハンドシェイクでこれを選択して返す必要がある。
const PROTOCOL = "obswebsocket.json";
const RPC_VERSION = 1;

// op コード（obs-websocket-js の WebSocketOpCode と同じ値）。
const OP_HELLO = 0;
const OP_IDENTIFY = 1;
const OP_IDENTIFIED = 2;
const OP_EVENT = 5;
const OP_REQUEST = 6;
const OP_REQUEST_RESPONSE = 7;

export interface CapturedRequest {
  requestType: string;
  requestData: Record<string, unknown>;
}

export interface FakeObsServerOptions {
  /** 設定すると、Identify に一致する password ハッシュが無いと接続を拒否する。 */
  password?: string;
}

interface FakeSceneItem {
  sceneItemId: number;
  sourceName: string;
  enabled: boolean;
  transform: Record<string, unknown> | undefined;
}

type RequestResult =
  | { ok: true; responseData: Record<string, unknown> }
  | { ok: false; code: number; comment: string };

const asRecord = (value: unknown): Record<string, unknown> =>
  (value ?? {}) as Record<string, unknown>;

/**
 * obs-websocket v5 プロトコルの最小実装フェイクサーバー（実 TCP / 実
 * WebSocket ハンドシェイクを喋る。プロトコルのモックではなく obsConnection.ts /
 * obsSetup.ts をブラックボックスとして駆動するためのテスト用サーバー本体）。
 *
 * 過去に同種のものが使い捨てで 3 回書き直された経緯があるため、
 * obsConnection.test.ts / obsSetup 関連のテストはこれを共通で再利用すること
 * （docs/improvement-plan.md 参照）。
 *
 * 対応しているのは、このリポジトリの実コードが実際に呼ぶ範囲の
 * リクエストのみ（GetSceneList / CreateScene / GetInputList /
 * GetSceneItemList / CreateInput / SetInputSettings / CreateSceneItem /
 * GetSceneItemId / SetSceneItemEnabled / SetSceneItemTransform）。
 */
export class FakeObsWebSocketServer {
  private wss: WebSocketServer | null = null;
  private readonly sockets = new Set<WsSocket>();
  private port = 0;
  private readonly password: string | undefined;

  /** 受信した Request をそのまま記録する。テストはここを検証する。 */
  readonly requests: CapturedRequest[] = [];

  private scenes = new Set<string>();
  private inputs = new Set<string>();
  // sceneName -> sourceName -> FakeSceneItem
  private readonly sceneItems = new Map<string, Map<string, FakeSceneItem>>();
  private nextSceneItemId = 1;

  constructor(options: FakeObsServerOptions = {}) {
    this.password = options.password;
  }

  get url(): string {
    return `ws://127.0.0.1:${this.port}`;
  }

  async start(): Promise<void> {
    await new Promise<void>((resolvePromise, reject) => {
      const wss = new WebSocketServer({
        port: 0,
        handleProtocols: (protocols) =>
          protocols.has(PROTOCOL) ? PROTOCOL : false,
      });
      wss.once("listening", () => {
        const address = wss.address();
        this.port =
          typeof address === "object" && address !== null ? address.port : 0;
        resolvePromise();
      });
      wss.once("error", reject);
      wss.on("connection", (socket) => {
        this.handleConnection(socket);
      });
      this.wss = wss;
    });
  }

  async stop(): Promise<void> {
    for (const socket of this.sockets) {
      socket.close();
    }
    this.sockets.clear();
    const wss = this.wss;
    this.wss = null;
    if (wss === null) {
      return;
    }
    await new Promise<void>((resolvePromise, reject) => {
      wss.close((error) => (error ? reject(error) : resolvePromise()));
    });
  }

  // --- テスト側から OBS 側の状態を組み立てるための設定 API ---

  setScenes(names: readonly string[]): void {
    this.scenes = new Set(names);
    for (const name of names) {
      if (!this.sceneItems.has(name)) {
        this.sceneItems.set(name, new Map());
      }
    }
  }

  setInputs(names: readonly string[]): void {
    this.inputs = new Set(names);
  }

  /**
   * sceneName にあらかじめ sourceNames のシーンアイテムを用意しておく
   * （= runObsSetup が既に走った後の状態を再現する）。setScenes /
   * setInputs も合わせて呼んでおく。
   */
  seedSceneItems(sceneName: string, sourceNames: readonly string[]): void {
    this.setScenes([...this.scenes, sceneName]);
    this.setInputs([...this.inputs, ...sourceNames]);
    const items = new Map<string, FakeSceneItem>();
    for (const sourceName of sourceNames) {
      items.set(sourceName, {
        sceneItemId: this.nextSceneItemId++,
        sourceName,
        enabled: true,
        transform: undefined,
      });
    }
    this.sceneItems.set(sceneName, items);
  }

  getSceneItem(
    sceneName: string,
    sourceName: string,
  ): FakeSceneItem | undefined {
    return this.sceneItems.get(sceneName)?.get(sourceName);
  }

  getRequestsByType(requestType: string): CapturedRequest[] {
    return this.requests.filter(
      (request) => request.requestType === requestType,
    );
  }

  clearRequests(): void {
    this.requests.length = 0;
  }

  /** 接続中の全クライアントを異常切断させる（再接続系のテスト用）。 */
  disconnectAll(code = 1006, reason = "fake disconnect"): void {
    for (const socket of this.sockets) {
      socket.close(code, reason);
    }
  }

  // --- 内部実装 ---

  private handleConnection(socket: WsSocket): void {
    this.sockets.add(socket);
    let identified = false;
    let pendingChallenge: { salt: string; challenge: string } | undefined;

    socket.on("close", () => {
      this.sockets.delete(socket);
    });

    socket.on("message", (raw) => {
      let message: { op: number; d: unknown };
      try {
        message = JSON.parse(rawDataToText(raw)) as { op: number; d: unknown };
      } catch {
        return;
      }

      if (message.op === OP_IDENTIFY) {
        const d = asRecord(message.d);
        if (this.password !== undefined) {
          const expected =
            pendingChallenge !== undefined
              ? hashAuth(
                  this.password,
                  pendingChallenge.salt,
                  pendingChallenge.challenge,
                )
              : undefined;
          if (expected === undefined || d.authentication !== expected) {
            socket.close(4009, "Authentication failed");
            return;
          }
        }
        identified = true;
        send(socket, OP_IDENTIFIED, { negotiatedRpcVersion: RPC_VERSION });
        return;
      }

      if (message.op === OP_REQUEST) {
        if (!identified) {
          return;
        }
        const d = asRecord(message.d) as {
          requestId: string;
          requestType: string;
          requestData?: Record<string, unknown>;
        };
        const requestData = d.requestData ?? {};
        this.requests.push({ requestType: d.requestType, requestData });

        const result = this.handleRequest(socket, d.requestType, requestData);
        send(socket, OP_REQUEST_RESPONSE, {
          requestId: d.requestId,
          requestType: d.requestType,
          requestStatus: result.ok
            ? { result: true, code: 100 }
            : { result: false, code: result.code, comment: result.comment },
          responseData: result.ok ? result.responseData : undefined,
        });
      }
    });

    if (this.password !== undefined) {
      pendingChallenge = { salt: randomUUID(), challenge: randomUUID() };
      send(socket, OP_HELLO, {
        obsWebSocketVersion: "5.5.7",
        rpcVersion: RPC_VERSION,
        authentication: pendingChallenge,
      });
    } else {
      send(socket, OP_HELLO, {
        obsWebSocketVersion: "5.5.7",
        rpcVersion: RPC_VERSION,
      });
    }
  }

  private findItemById(
    sceneName: string,
    sceneItemId: number,
  ): FakeSceneItem | undefined {
    for (const item of this.sceneItems.get(sceneName)?.values() ?? []) {
      if (item.sceneItemId === sceneItemId) {
        return item;
      }
    }
    return undefined;
  }

  private handleRequest(
    socket: WsSocket,
    requestType: string,
    data: Record<string, unknown>,
  ): RequestResult {
    switch (requestType) {
      case "GetSceneList": {
        const sceneNames = [...this.scenes];
        return {
          ok: true,
          responseData: {
            scenes: sceneNames.map((sceneName) => ({ sceneName })),
            currentProgramSceneName: sceneNames[0] ?? "",
          },
        };
      }

      case "CreateScene": {
        const sceneName = data.sceneName as string;
        this.setScenes([...this.scenes, sceneName]);
        return { ok: true, responseData: {} };
      }

      case "GetInputList": {
        return {
          ok: true,
          responseData: {
            inputs: [...this.inputs].map((inputName) => ({
              inputName,
              inputKind: data.inputKind ?? "browser_source",
            })),
          },
        };
      }

      case "GetSceneItemList": {
        const sceneName = data.sceneName as string;
        const items = [...(this.sceneItems.get(sceneName)?.values() ?? [])];
        return {
          ok: true,
          responseData: {
            sceneItems: items.map((item) => ({
              sourceName: item.sourceName,
              sceneItemId: item.sceneItemId,
              sceneItemEnabled: item.enabled,
            })),
          },
        };
      }

      case "CreateInput": {
        const sceneName = data.sceneName as string;
        const inputName = data.inputName as string;
        this.inputs.add(inputName);
        const sceneItemId = this.nextSceneItemId++;
        const items =
          this.sceneItems.get(sceneName) ?? new Map<string, FakeSceneItem>();
        items.set(inputName, {
          sceneItemId,
          sourceName: inputName,
          enabled: Boolean(data.sceneItemEnabled ?? true),
          transform: undefined,
        });
        this.sceneItems.set(sceneName, items);
        this.broadcastEvent(socket, "SceneItemCreated", {
          sceneName,
          sourceName: inputName,
          sceneItemId,
        });
        return { ok: true, responseData: { sceneItemId } };
      }

      case "SetInputSettings": {
        // フェイク側では入力自体の設定内容までは保持しない
        // （実コードは url が更新されたかどうかを見ないため）。
        return { ok: true, responseData: {} };
      }

      case "CreateSceneItem": {
        const sceneName = data.sceneName as string;
        const sourceName = data.sourceName as string;
        const sceneItemId = this.nextSceneItemId++;
        const items =
          this.sceneItems.get(sceneName) ?? new Map<string, FakeSceneItem>();
        items.set(sourceName, {
          sceneItemId,
          sourceName,
          enabled: Boolean(data.sceneItemEnabled ?? true),
          transform: undefined,
        });
        this.sceneItems.set(sceneName, items);
        this.broadcastEvent(socket, "SceneItemCreated", {
          sceneName,
          sourceName,
          sceneItemId,
        });
        return { ok: true, responseData: { sceneItemId } };
      }

      case "GetSceneItemId": {
        const sceneName = data.sceneName as string;
        const sourceName = data.sourceName as string;
        const item = this.sceneItems.get(sceneName)?.get(sourceName);
        if (item === undefined) {
          // 実際の OBS が「そのシーンにそのソースのシーンアイテムが
          // 無い」場合に返す挙動を模す（= runObsSetup がまだ走っていない
          // 状態で sync() を呼んだときの再現に使う）。
          return {
            ok: false,
            code: 600,
            comment: `No source was found by the name of '${sourceName}' in scene '${sceneName}'.`,
          };
        }
        return { ok: true, responseData: { sceneItemId: item.sceneItemId } };
      }

      case "SetSceneItemEnabled": {
        const sceneName = data.sceneName as string;
        const sceneItemId = data.sceneItemId as number;
        const item = this.findItemById(sceneName, sceneItemId);
        if (item === undefined) {
          return {
            ok: false,
            code: 600,
            comment: "No scene items were found.",
          };
        }
        item.enabled = Boolean(data.sceneItemEnabled);
        return { ok: true, responseData: {} };
      }

      case "SetSceneItemTransform": {
        const sceneName = data.sceneName as string;
        const sceneItemId = data.sceneItemId as number;
        const item = this.findItemById(sceneName, sceneItemId);
        if (item === undefined) {
          return {
            ok: false,
            code: 600,
            comment: "No scene items were found.",
          };
        }
        item.transform = data.sceneItemTransform as Record<string, unknown>;
        return { ok: true, responseData: {} };
      }

      default:
        return {
          ok: false,
          code: 1,
          comment: `Unknown request type: ${requestType}`,
        };
    }
  }

  private broadcastEvent(
    origin: WsSocket,
    eventType: string,
    eventData: Record<string, unknown>,
  ): void {
    for (const socket of this.sockets) {
      send(socket, OP_EVENT, { eventType, eventData });
    }
    void origin;
  }
}

function send(socket: WsSocket, op: number, d: unknown): void {
  socket.send(JSON.stringify({ op, d }));
}

// ws の "message" イベントが渡す RawData は Buffer | ArrayBuffer | Buffer[]。
// 素の String(raw) は Buffer 以外のケースで "[object Object]" になり得る
// （no-base-to-string で指摘される）ので、実体に応じて明示的にデコードする。
function rawDataToText(raw: RawData): string {
  if (Buffer.isBuffer(raw)) {
    return raw.toString("utf8");
  }
  if (Array.isArray(raw)) {
    return Buffer.concat(raw).toString("utf8");
  }
  return Buffer.from(raw).toString("utf8");
}

// obs-websocket-js の authenticationHashing と同じアルゴリズム
// （src/utils/authenticationHashing.ts）: base64(sha256(base64(sha256(password+salt))+challenge))
function hashAuth(password: string, salt: string, challenge: string): string {
  const secret = createHash("sha256")
    .update(password + salt)
    .digest("base64");
  return createHash("sha256")
    .update(secret + challenge)
    .digest("base64");
}
