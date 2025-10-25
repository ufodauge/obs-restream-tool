import type { TwitchPanelInfo } from "../type";

type Props = {
  panelInfo: TwitchPanelInfo;
};

export const TwitchPanelContent = ({ panelInfo }: Props) => {
  // const twitchSrc = `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&muted=true`;
  return (
    <div className="aspect-video p-2 select-none">
      <div className="text-sm text-base-content/60">channel</div>
      <div className="text-xl font-bold text-base-content">
        {panelInfo.channel}
      </div>
    </div>
  );
};
