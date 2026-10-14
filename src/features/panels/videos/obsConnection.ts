import OBSWebSocket from "obs-websocket-js";

import { packGrid, type PixelRect, type UnitSize } from "./layout";
import { buildSlotUrl } from "./obsSetup";
import type { ObsSyncSettings } from "./obsSyncSettings";
import { selectEnabledPanelsWithSlotIndex, type PanelType } from "./panels";

export type ObsSyncStatus =
  | { state: "disabled" }
  | { state: "connecting" }
  // failedSources: 直近の sync() で GetSceneItemId / SetSceneItemEnabled /
  // SetSceneItemTransform のいずれかが失敗した sourceName の一覧。空配列なら
  // 全スロット成功。以前は catch 内で console.error するだけで状態には
  // 一切反映していなかったため、OBS 側にまだソースが無い等の理由で
  // 全スロットが失敗していても UI は緑の「同期中」のままだった
  // （実機テストで報告されたバグの一因）。
  | { state: "connected"; syncedAt: number; failedSources: string[] }
  | { state: "error"; message: string };

// A-5: 切断からの再接続バックオフ。1s, 2s, 4s, ... と倍々に伸ばし、30s で頭打ち。
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30000;

// OBS の alignment / boundsAlignment はビットマスク（LEFT=1, RIGHT=2, TOP=4,
// BOTTOM=8, CENTER=0）で、5 = LEFT|TOP = 左上。
//
// boundsType: "OBS_BOUNDS_STRETCH" を使うとき、positionX/positionY が
// 指すのは「bounds box のどの点か」であり、それを決めるのは alignment
// ではなく boundsAlignment の方（libobs の obs_sceneitem_set_bounds_alignment /
// get_ui_transform 実装上、非バウンズ時の配置点が alignment、バウンズ時の
// 配置点が boundsAlignment とそれぞれ独立に効く）。ここを明示的に指定
// しないと（＝ obs-websocket / libobs のデフォルト値である 0 = CENTER の
// まま）、positionX/positionY は「箱の中心」を指してしまい、packGrid が
// 計算した「セル左上」という意味と食い違う。alignment も念のため同じ
// 左上に揃えておく（bounds モードでは見た目に影響しないはずだが、
// 万一 boundsType が変わったときの事故を減らすため）。
const ALIGN_TOP_LEFT = 5;

const resolveSceneItemId = async (
  obs: OBSWebSocket,
  cache: Map<string, number>,
  sceneName: string,
  sourceName: string,
): Promise<number> => {
  const cacheKey = `${sceneName}::${sourceName}`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const { sceneItemId } = await obs.call("GetSceneItemId", {
    sceneName,
    sourceName,
  });

  cache.set(cacheKey, sceneItemId);
  return sceneItemId;
};

/**
 * スロット用の Browser Source がシーンに無いときに作る。動画パネルを
 * 追加しても OBS 側の {sourcePrefix}N は増えないため、以前は
 * 「スロット数を増やしてセットアップをやり直す」まで新しいパネルが
 * 表示されなかった。sync() は矩形を割り当てたスロットについてだけ
 * これを呼ぶ。
 *
 * 入力自体は既にある（シーンから外されただけ）場合や、並行する sync() が
 * 先に作った場合は CreateInput が失敗するので、シーンアイテムを引き直し、
 * それでも無ければ既存の入力をシーンに追加する。
 */
const createSlotSceneItem = async (
  obs: OBSWebSocket,
  cache: Map<string, number>,
  settings: SyncSettings,
  index: number,
  rect: PixelRect,
): Promise<number> => {
  const sourceName = `${settings.sourcePrefix}${index}`;
  const cacheKey = `${settings.sceneName}::${sourceName}`;

  let sceneItemId: number;
  try {
    ({ sceneItemId } = await obs.call("CreateInput", {
      sceneName: settings.sceneName,
      inputName: sourceName,
      inputKind: "browser_source",
      inputSettings: {
        url: buildSlotUrl(settings, index),
        // obsSetup.ts の runObsSetup と同じく、ブラウザソース自体の解像度は
        // 割り当てた矩形に合わせ、1px を下限にする。
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
        shutdown: true,
      },
      // 有効化と配置は呼び出し側（sync()）がこの後に行う。
      sceneItemEnabled: false,
    }));
  } catch (createInputError) {
    try {
      return await resolveSceneItemId(
        obs,
        cache,
        settings.sceneName,
        sourceName,
      );
    } catch {
      // シーンアイテムはやはり無い。入力が既にあるなら追加する。
    }
    try {
      ({ sceneItemId } = await obs.call("CreateSceneItem", {
        sceneName: settings.sceneName,
        sourceName,
        sceneItemEnabled: false,
      }));
    } catch {
      // シーンが無い等。CreateInput 側の理由の方が原因に近いのでそちらを投げる。
      throw createInputError;
    }
  }

  cache.set(cacheKey, sceneItemId);
  return sceneItemId;
};

type ConnectionSettings = {
  enable: boolean;
  url: string;
  password: string;
};

// 同期呼び出し（sync）に必要な設定だけを抜き出した形。ObsSyncSettings から
// enable/url/password（接続用）を除いたもの。baseUrl は不足スロットを
// 自動作成するときの slot.html の URL に使う。
type SyncSettings = Pick<
  ObsSyncSettings,
  | "sceneName"
  | "sourcePrefix"
  | "slotCount"
  | "grid"
  | "area"
  | "gap"
  | "baseUrl"
>;

/**
 * OBS への接続・自動再接続・sceneItemId キャッシュ・実際の同期呼び出しを
 * 一手に引き受ける、React の外側に置いたオブジェクト（Phase 3）。
 *
 * 旧 useObsSync は「接続 effect」と「同期 effect」の 2 本立てで、後者の
 * 依存に status.state を含めていたために状態遷移とデータ同期が絡み合い、
 * 前者は setStatus をエフェクト本体で同期的に呼んでいたため
 * react-compiler の EffectSetState 診断が出ていた。
 *
 * ここでは「外部システム（OBS への WebSocket 接続）を React の外に出し、
 * React 側は useSyncExternalStore で状態を読むだけ」という形にすることで
 * 両方を解消する。setState 相当（this.setStatus）はこのクラスの中でしか
 * 呼ばれず、しかも常に「実際に何かが起きた後」（接続成功/失敗・切断・
 * 同期完了）にしか呼ばれないので、EffectSetState が問題にしていた
 * 「props から導出できる値をわざわざ effect + setState で作る」パターンには
 * そもそも当てはまらない。
 *
 * ページ（sync.html）につき 1 個の obs-websocket 接続で十分なので
 * シングルトンとして下部で 1 個だけ生成してエクスポートする。クラス自体も
 * export しているのは、テストでは（sync.html と ObsSetupButton が別ページ＝
 * 別 JS 実行コンテキストになるのと同じ理由で）ページを跨がず複数の独立した
 * インスタンスを状態を共有せず駆動したいため。
 */
export class ObsSyncConnection {
  private status: ObsSyncStatus = { state: "disabled" };
  private readonly listeners = new Set<() => void>();

  private obs: OBSWebSocket | null = null;
  private sceneItemIdCache = new Map<string, number>();
  // A-4: sceneName / sourcePrefix が変わったらキャッシュ全体を無効化するための
  // 直近のキー。sourceName は "{sourcePrefix}{index}" で組み立てられるので、
  // どちらか一方でも変われば以前のキャッシュは意味を失う。
  private lastSceneKey: string | null = null;

  private connectionSettings: ConnectionSettings | null = null;

  // 進行中の接続の「世代」。接続をやり直すたびに増やし、古い世代の
  // ConnectionClosed ハンドラ・再接続タイマー・connect() の
  // then/catch が状態を書き換えないようにするためのガードに使う。
  private connectId = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private reconnectAttempt = 0;

  // 進行中の sync() 呼び出しの「世代」。connectId は接続そのものが
  // やり直されたときしか増えないため、同じ接続の上でデバウンスされた
  // 変更が短時間に 2 回 sync() を呼ぶケース（古い sync がまだ
  // slotCount 回のループ途中）を検出できない。この世代カウンタを
  // sync() の入り口で増やし、ループの各反復でキャプチャしておいた
  // 値と比較することで、後から始まった sync が古い sync を上書きし、
  // 古い方はそこで諦める（＝ SetSceneItemTransform が入り乱れて
  // 到着順で最終状態が決まる問題を防ぐ）。
  private syncId = 0;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getStatus = (): ObsSyncStatus => this.status;

  private setStatus(next: ObsSyncStatus): void {
    this.status = next;
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * enable / url / password が変わるたびに useEffect から呼ぶ。値が
   * 実質変わっていなければ何もしない（既に繋がっている接続を保つ）。
   */
  configureConnection(enable: boolean, url: string, password: string): void {
    const prev = this.connectionSettings;
    const changed =
      prev === null ||
      prev.enable !== enable ||
      prev.url !== url ||
      prev.password !== password;
    this.connectionSettings = { enable, url, password };

    if (!enable) {
      this.teardownConnection();
      this.reconnectAttempt = 0;
      this.setStatus({ state: "disabled" });
      return;
    }

    if (!changed && this.obs !== null) {
      return; // 変化なし・既に接続済み/接続試行中
    }

    if (changed) {
      // 新しい接続先への切り替え（手動保存含む）なので、前の接続先で
      // 積み上がったバックオフは引き継がない。
      this.reconnectAttempt = 0;
    }

    this.connect();
  }

  /** hook が完全にアンマウントされた時だけ呼ぶ、後始末込みの停止。 */
  shutdown(): void {
    this.teardownConnection();
    this.connectionSettings = null;
    this.reconnectAttempt = 0;
    this.sceneItemIdCache = new Map();
    this.lastSceneKey = null;
    this.setStatus({ state: "disabled" });
  }

  private teardownConnection(): void {
    this.connectId++; // 進行中の接続試行・再接続タイマーを無効化
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    if (this.obs !== null) {
      const obs = this.obs;
      this.obs = null;
      void obs.disconnect();
    }
  }

  private connect(): void {
    this.teardownConnection();
    const settings = this.connectionSettings;
    if (settings === null || !settings.enable) {
      return;
    }

    const myConnectId = this.connectId;
    const obs = new OBSWebSocket();
    this.obs = obs;
    // 新規接続のたびにキャッシュを作り直す（OBS 再起動でシーン構成が
    // 変わっている可能性があるため）。
    this.sceneItemIdCache = new Map();

    this.setStatus({ state: "connecting" });

    // obs-websocket-js は「接続確立中に切れた」場合、公開イベント
    // ConnectionClosed と connect() が返す Promise の reject の両方を
    // 同じ切断について発火させる（内部的には同じ内部イベントバスから
    // 両方が生える）。ここでは両方から呼べる共通ハンドラにまとめ、
    // this.obs をこの世代で既に null にしていたら二重処理しない
    // （＝どちらが先に来ても 1 回しか setStatus/scheduleReconnect しない）。
    // これをしないと reconnectAttempt が 1 失敗あたり 2 回進んでしまい、
    // バックオフが実際より早く伸びる（実測で確認した不具合）。
    const handleFailure = (error: { message?: string } | undefined) => {
      if (myConnectId !== this.connectId || this.obs === null) return;
      this.obs = null;
      this.setStatus({
        state: "error",
        message: error?.message || "接続が切断されました",
      });
      this.scheduleReconnect(myConnectId);
    };

    obs.on("ConnectionClosed", (error) => {
      if (myConnectId !== this.connectId) return;
      handleFailure(error);
    });

    // A-4: OBS 側でソースを消して作り直した場合に古い sceneItemId を
    // 使い続けないよう、該当エントリだけピンポイントで無効化する。
    obs.on("SceneItemCreated", (data) => {
      if (myConnectId !== this.connectId) return;
      this.sceneItemIdCache.delete(`${data.sceneName}::${data.sourceName}`);
    });
    obs.on("SceneItemRemoved", (data) => {
      if (myConnectId !== this.connectId) return;
      this.sceneItemIdCache.delete(`${data.sceneName}::${data.sourceName}`);
    });

    obs
      .connect(settings.url, settings.password || undefined)
      .then(() => {
        if (myConnectId !== this.connectId) return;
        this.reconnectAttempt = 0;
        this.setStatus({ state: "connected", syncedAt: 0, failedSources: [] });
      })
      .catch((error: unknown) => {
        if (myConnectId !== this.connectId) return;
        handleFailure({
          message: error instanceof Error ? error.message : String(error),
        });
      });
  }

  private scheduleReconnect(myConnectId: number): void {
    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * 2 ** this.reconnectAttempt,
      RECONNECT_MAX_DELAY_MS,
    );
    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(() => {
      if (myConnectId !== this.connectId) return;
      this.connect();
    }, delay);
  }

  private invalidateCacheOnSceneKeyChange(
    sceneName: string,
    sourcePrefix: string,
  ): void {
    const key = `${sceneName}::${sourcePrefix}`;
    if (this.lastSceneKey !== null && this.lastSceneKey !== key) {
      this.sceneItemIdCache = new Map();
    }
    this.lastSceneKey = key;
  }

  /**
   * パネル構成・レイアウト設定を OBS に反映する。呼び出し側（useObsSync）で
   * useDebounce により間引かれた panels/settings を渡す想定（A-6）。
   *
   * A-7: 接続していない・エラー中は何もしない。呼び出し側でも
   * status.state === "connected" を見て呼び出しを間引いているが、
   * 接続が非同期に切れた直後の取りこぼしに備えてここでも確認する。
   *
   * A-3: スロット index は panels 配列そのままの index（Slot.tsx と同じ）。
   * packGrid には有効なパネルを size 降順に並べたものしか渡せないので、
   * selectEnabledPanelsWithSlotIndex で元の index を保持したまま並べ替え、
   * packGrid が返す矩形をその元 index に配り直してから同期する。
   *
   * スロットは max(slotCount, panels.length) 個ぶん扱う。矩形を割り当てた
   * スロットのソースが OBS に無ければ自動で作る（createSlotSceneItem）ので、
   * パネルを追加してもセットアップのやり直しは要らない。
   */
  async sync(panels: PanelType[], settings: SyncSettings): Promise<void> {
    const obs = this.obs;
    if (obs === null || this.status.state !== "connected") {
      return;
    }

    this.invalidateCacheOnSceneKeyChange(
      settings.sceneName,
      settings.sourcePrefix,
    );

    const myConnectId = this.connectId;
    const mySyncId = ++this.syncId;

    // slotCount は「最低限用意するスロット数」。パネルの方が多ければ
    // 足りない分は下のループで自動作成する。
    const slotCount = Math.max(settings.slotCount, panels.length);
    const enabledWithSlot = selectEnabledPanelsWithSlotIndex(panels);
    const sizes: UnitSize[] = enabledWithSlot.map(({ panel }) => panel.size);
    const rects = packGrid(sizes, settings.grid, settings.area, settings.gap);

    const rectBySlotIndex = new Map<number, PixelRect>();
    enabledWithSlot.forEach(({ slotIndex }, i) => {
      const rect = rects[i];
      if (rect !== undefined) {
        rectBySlotIndex.set(slotIndex, rect);
      }
    });

    const failedSources: string[] = [];

    for (let index = 0; index < slotCount; index++) {
      if (myConnectId !== this.connectId) return;
      if (mySyncId !== this.syncId) return; // 新しい sync() に追い越された

      const sourceName = `${settings.sourcePrefix}${index}`;
      const rect = rectBySlotIndex.get(index);

      try {
        let sceneItemId: number;
        try {
          sceneItemId = await resolveSceneItemId(
            obs,
            this.sceneItemIdCache,
            settings.sceneName,
            sourceName,
          );
        } catch (error) {
          // 表示しないスロットのソースが無いだけなら、隠すものも無いので何もしない。
          if (rect === undefined) {
            continue;
          }
          console.info(`[obsSync] "${sourceName}" が無いので作成します`, error);
          sceneItemId = await createSlotSceneItem(
            obs,
            this.sceneItemIdCache,
            settings,
            index,
            rect,
          );
        }

        await obs.call("SetSceneItemEnabled", {
          sceneName: settings.sceneName,
          sceneItemId,
          sceneItemEnabled: rect !== undefined,
        });

        if (rect !== undefined) {
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
        }
      } catch (error) {
        // 1つのソースの解決/更新に失敗しても他のスロットの同期は続ける。
        // 典型的には「OBS 側にまだ VideoSlotN という名前のソースを
        // 作っていない」ケース。ただし console.error だけに留めず
        // failedSources にも積み、最終的な status に反映する
        // （実機テストで報告された「全滅していても UI が緑のまま」バグの
        // 直接の原因はここが何もしていなかったこと）。
        console.error(`[obsSync] failed to sync "${sourceName}"`, error);
        failedSources.push(sourceName);
      }
    }

    if (myConnectId === this.connectId && mySyncId === this.syncId) {
      this.setStatus({
        state: "connected",
        syncedAt: Date.now(),
        failedSources,
      });
    }
  }

  /**
   * 「OBS 側の状態が今しがた変わったので、次の debounce を待たず今すぐ
   * 同期し直したい」ときに呼ぶ。sceneItemId キャッシュを丸ごと破棄してから
   * 通常の sync() を呼ぶだけの薄いラッパー（バグ調査で確定した原因の 1 つ:
   * ObsSetupButton がシーンアイテムを新規作成しても、それは別ページの
   * obsSyncConnection シングルトンには一切伝わらず、settings/panels も
   * 変化しないため同期 effect が発火しなかった）。
   *
   * 呼び出し側（useObsSync）は sync.html ページ内の storage イベント
   * リスナー経由でこれを呼ぶ想定。未接続なら sync() 側のガードで何もしない。
   */
  async forceResync(
    panels: PanelType[],
    settings: SyncSettings,
  ): Promise<void> {
    this.sceneItemIdCache = new Map();
    await this.sync(panels, settings);
  }
}

export const obsSyncConnection = new ObsSyncConnection();
