import { type PropsWithChildren, type RefObject } from "react";
import { RGL_DRAGGABLE_CANCEL_CLASS_NAME } from "../layout";
import type { PanelInfo } from "./type";
import { TextPanelContent } from "./contents/TextPanelContent";
import { TwitchPanelContent } from "./contents/TwitchPanelContent";

type Props = PropsWithChildren<{
  panelInfo: PanelInfo;
  dialogRef: RefObject<HTMLDialogElement | null>;
}>;

export const PanelContent = ({ panelInfo, dialogRef }: Props) => (
  <button
    type="button"
    onClick={() => dialogRef.current?.showModal()}
    className={`grid cursor-pointer items-center justify-center overflow-hidden rounded-md bg-base-100 transition-colors hover:bg-primary/5 ${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
  >
    {panelInfo.type === "text" ? (
      <TextPanelContent panelInfo={panelInfo} />
    ) : panelInfo.type === "twitch" ? (
      <TwitchPanelContent panelInfo={panelInfo} />
    ) : (
      <>???</>
    )}
  </button>
);
