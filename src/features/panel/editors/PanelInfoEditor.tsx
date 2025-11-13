import type { RefObject } from "react";
import type { PanelInfoEditorRefProps } from "./PanelInfoEditorRefProps";
import { TextPanelInfoEditor } from "./TextPanelInfoEditor";
import { TwitchPanelInfoEditor } from "./TwitchPanelInfoEditor";
import type { PanelInfo } from "../type";

type Props = {
  panelInfo: PanelInfo;
  ref: RefObject<PanelInfoEditorRefProps | null>;
};

export const PanelInfoEditor = ({ panelInfo, ref }: Props) =>
  panelInfo.type === "text" ? (
    <TextPanelInfoEditor panelInfo={panelInfo} ref={ref} />
  ) : panelInfo.type === "twitch" ? (
    <TwitchPanelInfoEditor panelInfo={panelInfo} ref={ref} />
  ) : (
    <>???</>
  );
