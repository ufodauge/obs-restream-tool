import { IframePanel } from "./IframePanel";
import type { SubtextPosition } from "./videos/obsSyncSettings";

export const TwitchPanel = ({
  channel,
  subtext,
  borderRadius,
  subtextPosition,
}: {
  channel: string;
  subtext?: string;
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
  // channel は配信者入力の文字列なので、クエリに入れる前に URLSearchParams で
  // エンコードする（"&" や "#" を含んでも別パラメータとして解釈されないように）。
  const params = new URLSearchParams({
    channel,
    parent: hostname,
    muted: "true",
    width: "100%",
    height: "100%",
  });
  const url =
    import.meta.env.DEV && import.meta.env.VITE_TWITCH_STUB
      ? import.meta.env.VITE_TWITCH_STUB
      : `https://player.twitch.tv/?${params.toString()}`;

  return (
    <IframePanel
      src={url}
      subtext={subtext}
      title={`Twitch: ${subtext ?? channel}`}
      borderRadius={borderRadius}
      subtextPosition={subtextPosition}
    />
  );
};
