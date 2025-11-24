import { getPanelContentCaption, type PanelInfo } from "../panel/type";

export const PanelListTitle = ({ panelInfo }: { panelInfo: PanelInfo }) => (
  <span className="text-lg font-semibold">
    {getPanelContentCaption(panelInfo)}
  </span>
);
