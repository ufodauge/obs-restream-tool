import type { TextPanelInfo } from "../type";

type Props = {
  panelInfo: TextPanelInfo;
};

export const TextPanelContent = ({ panelInfo }: Props) => {
  return <span className="text-2xl select-none">{panelInfo.content}</span>;
};
