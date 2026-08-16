import { PlayIcon } from "lucide-react";
import OBSWebSocket from "obs-websocket-js";
import { useState } from "react";

import { runObsSetup, type SetupLog } from "@/features/panels/videos/obsSetup";
import type { ObsSyncSettings } from "@/features/panels/videos/obsSyncSettings";
import { STORAGE_KEY_OBS_RESYNC_SIGNAL } from "@/features/storage";

const LOG_CLASSNAME: Record<SetupLog["level"], string> = {
  info: "text-base-content/70",
  success: "text-success",
  error: "text-error",
};

/**
 * 接続 → runObsSetup の逐次実行 → 切断、の一連の流れ。
 *
 * コンポーネント本体（ObsSetupButton）の中にこのまま書かず、あえて
 * モジュールトップレベルの関数に切り出している。try/finally や
 * for-await-of は react-compiler 1.0 時点で未対応の構文
 * （BuildHIR::lowerStatement: "Handle TryStatement with a finalizer" /
 * "Handle for-await loops"）で、コンポーネント関数の中に直接書くと
 * コンパイル自体が丸ごとスキップされてしまう（実測で確認）。この関数を
 * 呼ぶだけの handleClick 側にはどちらの構文も残らないので、
 * ObsSetupButton はコンパイル対象になる。
 */
const runObsSetupFlow = async (
  settings: ObsSyncSettings,
  onLog: (log: SetupLog) => void,
): Promise<void> => {
  const obs = new OBSWebSocket();
  try {
    await obs.connect(settings.url, settings.password || undefined);
    for await (const log of runObsSetup(obs, settings)) {
      onLog(log);
    }
  } catch (error) {
    onLog({
      level: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  } finally {
    await obs.disconnect();
  }
};

/**
 * settings（保存済みの値）を使って、シーンと VideoSlotN ソース一式を
 * obs-websocket 経由で自動生成する。接続はこのボタンの実行中だけ張り、
 * 終わったら切断する（常時接続は Sync.tsx の役目）。
 */
export const ObsSetupButton = ({ settings }: { settings: ObsSyncSettings }) => {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<SetupLog[]>([]);

  const handleClick = async () => {
    setRunning(true);
    setLogs([]);
    await runObsSetupFlow(settings, (log) => setLogs((prev) => [...prev, log]));
    setRunning(false);

    // このボタンは（多くの場合）常時同期を担う sync.html とは別の OBS
    // ドックで動いている＝別の JS 実行コンテキストなので、このページの
    // 中で何を呼んでも sync.html 側の obsSyncConnection シングルトンには
    // 届かない。localStorage への書き込みで発火する storage イベント
    // だけが唯一のクロスドック通知手段（useObsSync 側のリスナー参照）。
    // セットアップが一部失敗していても、成功したスロットだけでも
    // パネルサイズに応じた本来の位置へ直ちに合わせたいので常に送る。
    localStorage.setItem(STORAGE_KEY_OBS_RESYNC_SIGNAL, String(Date.now()));
  };

  return (
    <div className="grid gap-2">
      <button
        className="btn btn-secondary btn-sm"
        type="button"
        disabled={running || !settings.sceneName}
        onClick={() => void handleClick()}
      >
        <PlayIcon /> 初回セットアップ（シーン・スロットを自動生成）
      </button>
      {!settings.sceneName ? (
        <p className="text-xs text-warning">
          先にシーン名を入力・保存してください
        </p>
      ) : null}
      {logs.length > 0 ? (
        <ul className="grid max-h-40 scrollbar-thin gap-1 overflow-y-auto rounded bg-base-200 p-2 text-xs">
          {logs.map((log, i) => (
            <li key={i} className={LOG_CLASSNAME[log.level]}>
              {log.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};
