import type { TwitchPanelInfo } from "../type";

type Props = {
  panelInfo: TwitchPanelInfo;
};

export const TwitchPanelHeader = ({ panelInfo }: Props) => {
  return (
    <>
      {panelInfo.type} / {panelInfo.channel}
    </>
  );
};
