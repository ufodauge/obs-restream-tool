import { type PropsWithChildren, type RefObject } from "react";
import { RGL_DRAGGABLE_CANCEL_CLASS_NAME } from "../layout";
import type { PanelInfo } from "./type";
import { TextPanelInfoEditor } from "./editors/TextPanelInfoEditor";
import { TwitchPanelInfoEditor } from "./editors/TwitchPanelInfoEditor";

type Props = PropsWithChildren<{
  panelInfo: PanelInfo;
  dialogRef: RefObject<HTMLDialogElement | null>;
  editInfo: (info: PanelInfo) => void;
}>;

// TODO: 汎用性が高いので切り出し
export const PanelInfoEditor = ({ dialogRef, panelInfo, editInfo }: Props) => {
  return (
    <dialog
      ref={dialogRef}
      className={`modal ${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
    >
      <div className="modal-box">
        {panelInfo.type === "text" ? (
          <TextPanelInfoEditor
            dialogRef={dialogRef}
            panelInfo={panelInfo}
            editInfo={editInfo}
          />
        ) : panelInfo.type === "twitch" ? (
          <TwitchPanelInfoEditor
            dialogRef={dialogRef}
            panelInfo={panelInfo}
            editInfo={editInfo}
          />
        ) : (
          <>???</>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>閉じる</button>
      </form>
    </dialog>
  );
};
