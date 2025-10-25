import type { TwitchPanelInfo } from './type';

type Props = {
  panelInfo: TwitchPanelInfo;
};

export const TwitchPanel = ({ panelInfo }: Props) => {
  // const twitchSrc = `https://player.twitch.tv/?channel=${panel.channel}&parent=${window.location.hostname}&muted=true`;
  return (
    <div className="p-4 size-full overflow-auto">
      <label className="floating-label">
        <span>チャンネル ID</span>
        <input
          className="input"
          type="text"
          name={panelInfo.uuid}
          defaultValue={panelInfo.channel}
        />
      </label>
    </div>
  );
};
