import { useAtomValue } from "jotai";
import { useEffect, useEffectEvent, useSyncExternalStore } from "react";

import { STORAGE_KEY_OBS_RESYNC_SIGNAL } from "@/features/storage";
import { useDebounce } from "@/libs/hooks/useDebounce";

import { obsSyncConnection, type ObsSyncStatus } from "./obsConnection";
import { obsSyncSettingsStore } from "./obsSyncSettings";
import { videoPanelStores } from "./panels";

export type { ObsSyncStatus } from "./obsConnection";

// A-6: 保存（= atom 更新）のたびに slotCount 回の往復が走らないよう、
// 実際に OBS へ送る直前で間引く。300ms は「連続保存の束ね」が目的で、
// 単発の保存の体感レイテンシにはほぼ影響しない値として選んだ。
const SYNC_DEBOUNCE_MS = 300;

/**
 * 動画パネルの一覧・並び順（panels.ts）から各パネルの矩形を計算し、
 * OBS 側に事前に用意された {sourcePrefix}0, {sourcePrefix}1, ... という
 * 名前の Browser Source の SceneItemTransform / SceneItemEnabled を
 * obs-websocket 経由で更新し続ける。
 *
 * このロジック自体はどこか特定のページに紐付いていないので、
 * ダッシュボード（index.html）に載せてもいいし、OBS のカスタムブラウザ
 * ドックとして独立させても良い（Sync.tsx がその薄いラッパー）。
 *
 * Phase 3: 実際の接続・再接続・キャッシュ管理は obsConnection.ts の
 * シングルトン（React の外側のオブジェクト）に移した。このフックは
 * - jotai の settings/panels を読む
 * - useSyncExternalStore で状態を購読する
 * - 「接続を張り直すべきタイミング」「同期を送るべきタイミング」を
 *   effect の依存配列として表現し、実際の処理はシングルトンに委譲する
 * だけの薄いアダプタで、ここ自体はもう setState を一切呼ばない
 * （EffectSetState の解消はこの設計そのものの帰結）。
 */
export const useObsSync = (): ObsSyncStatus => {
  const settings = useAtomValue(obsSyncSettingsStore);
  const panels = useAtomValue(videoPanelStores);

  const status = useSyncExternalStore(
    obsSyncConnection.subscribe,
    obsSyncConnection.getStatus,
  );

  // 接続の確立・破棄は enable/url/password の変化にだけ反応させる。
  // レイアウト設定やパネル構成の変化はここには影響しない
  // （以前は同じ effect の依存に settings 全体・status.state まで
  // 入っていたため、状態遷移とデータ同期が絡み合っていた）。
  useEffect(() => {
    obsSyncConnection.configureConnection(
      settings.enable,
      settings.url,
      settings.password,
    );
  }, [settings.enable, settings.url, settings.password]);

  // フック自体が完全にアンマウントされる時だけ後始末する。上の effect は
  // settings が変わるたびに configureConnection() 経由で古い接続を
  // 自分で畳んでから新しい接続を張るので、ここで cleanup を共有すると
  // 通常の設定変更のたびに不要な切断が挟まってしまう。
  useEffect(() => {
    return () => {
      obsSyncConnection.shutdown();
    };
  }, []);

  // A-6: 実際に OBS へ送る値だけ debounce する。settings/panels は
  // 内容が変わらない限り同一参照が返る（jotai の atomWithStorage）ため、
  // useDebounce の内部 effect が意図せず毎レンダー発火することはない。
  const debouncedSettings = useDebounce(settings, SYNC_DEBOUNCE_MS);
  const debouncedPanels = useDebounce(panels, SYNC_DEBOUNCE_MS);

  useEffect(() => {
    // A-7: エラー中（および未接続中）は同期を試みない。
    if (status.state !== "connected") {
      return;
    }
    void obsSyncConnection.sync(debouncedPanels, debouncedSettings);
  }, [status.state, debouncedPanels, debouncedSettings]);

  // バグ調査で確定した原因: ObsSetupButton は index.html 側（多くの場合
  // sync.html とは別の OBS カスタムブラウザドック = 別 JS 実行コンテキスト）
  // で動くため、そこでシーンアイテムを新規作成しても、この hook が読んでいる
  // settings/panels には一切変化が無く、上の同期 effect は発火しない。
  // ObsSetupButton は STORAGE_KEY_OBS_RESYNC_SIGNAL への書き込みで
  // 「今すぐ同期し直してほしい」と合図するので、ここではそれを storage
  // イベントとして受け取り、debounce を待たず forceResync する。
  //
  // useEffectEvent にしているのは「いつ listener を張り直すか」（mount 時の
  // 1 回だけ）と「発火時に何を読むか」（そのときの最新の panels/settings/
  // status）を分離するため（TimerForm.tsx の onFrame と同じ理由）。
  const handleResyncSignal = useEffectEvent(() => {
    if (status.state !== "connected") {
      return;
    }
    void obsSyncConnection.forceResync(panels, settings);
  });

  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) return;
      if (event.key !== STORAGE_KEY_OBS_RESYNC_SIGNAL) return;
      handleResyncSignal();
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);

  return status;
};
