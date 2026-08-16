import { IframePanel } from "./IframePanel";
import type { SubtextPosition } from "./videos/obsSyncSettings";

export const TwitchPanel = ({
  channel,
  size,
  subtext,
  fill,
  borderRadius,
  subtextPosition,
}: {
  channel: string;
  size: number;
  subtext?: string;
  fill?: boolean;
  borderRadius?: number;
  subtextPosition?: SubtextPosition;
}) => {
  // A-2: import.meta.url の hostname（モジュールを読み込んだ URL の
  // ホスト名）ではなく window.location.hostname（実際にページを開いている
  // オリジンのホスト名）を使う。base: "./" ビルドを file:// や OBS の
  // ローカル配信で開くと import.meta.url は file:// / 相対 URL になり
  // hostname が取れず、以前はここで throw してページ全体が死んでいた。
  // Twitch の parent= にはそもそも「埋め込み先ページのホスト名」を渡す
  // 必要があるので、window.location.hostname の方が意味的にも正しい。
  const hostname = window.location.hostname;
  const url =
    import.meta.env.DEV && import.meta.env.VITE_TWITCH_STUB
      ? import.meta.env.VITE_TWITCH_STUB
      : `https://player.twitch.tv/?channel=${channel}&parent=${hostname}&muted=true&width=100%&heigh=100%`;

  return (
    <IframePanel
      src={url}
      size={size}
      subtext={subtext}
      fill={fill}
      title={`Twitch: ${subtext ?? channel}`}
      borderRadius={borderRadius}
      subtextPosition={subtextPosition}
    />
  );
};
