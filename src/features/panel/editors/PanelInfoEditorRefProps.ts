import type { PanelInfo } from "../type";

export type PanelInfoEditorRefProps = {
  getModifiedPanelInfo: (e: FormData) => PanelInfo;
};
