import type { TextPanelInfo } from "../type";

type Props = {
  panelInfo: TextPanelInfo;
};

export const TextPanelHeader = ({ panelInfo }: Props) => {
  return (
    <>
      {panelInfo.type} / {panelInfo.content}
    </>
  );
};
