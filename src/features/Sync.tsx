import { useObsSync } from "@/features/panels/videos/obsSync";

const STATUS_LABEL: Record<string, string> = {
  disabled: "無効",
  connecting: "接続中…",
  connected: "同期中",
  error: "エラー",
};

const STATUS_CLASSNAME: Record<string, string> = {
  disabled: "badge-neutral",
  connecting: "badge-warning",
  connected: "badge-success",
  error: "badge-error",
};

/**
 * OBS の「カスタムブラウザドック」としてこのページ（sync.html）を追加すると、
 * OBS 起動中ずっと動画パネルの配置を obs-websocket 経由で同期し続ける。
 * 設定自体はダッシュボード（ObsSyncForm）で行い、ここは実行するだけ。
 */
export const Sync = () => {
  const status = useObsSync();

  // 実機テストで報告されたバグ: 全スロットの同期が失敗していても
  // status.state は "connected" のままだったため、バッジは常に緑
  // （badge-success）で「同期中」としか表示されず、ユーザーが異常に
  // 気付く手段が無かった。failedSources が 1 件でもあればバッジを警告色に
  // 切り替え、どのソースが失敗したかも文字で出す。
  const hasFailures =
    status.state === "connected" && status.failedSources.length > 0;
  const badgeClassName = hasFailures
    ? "badge-warning"
    : STATUS_CLASSNAME[status.state];

  return (
    <div className="grid gap-2 bg-base-200 p-2 font-sans text-sm">
      <div className="flex items-center gap-2">
        <span className={`badge ${badgeClassName}`}>
          {STATUS_LABEL[status.state]}
        </span>
        {status.state === "error" ? (
          <span className="text-error">{status.message}</span>
        ) : null}
        {status.state === "connected" && status.syncedAt > 0 ? (
          <span className="text-base-content/60">
            最終同期: {new Date(status.syncedAt).toLocaleTimeString("ja-JP")}
          </span>
        ) : null}
      </div>
      {status.state === "connected" && hasFailures ? (
        <p className="text-xs text-warning">
          {status.failedSources.length} 件のソースの同期に失敗しました:{" "}
          {status.failedSources.join(", ")}
        </p>
      ) : null}
    </div>
  );
};
