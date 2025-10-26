import { useRef, type PropsWithChildren } from "react";
import { RGL_DRAGGABLE_CANCEL_CLASS_NAME } from "../layout";
import type { PanelInfo } from "./type";
import { CloseIcon } from "../../../../components/icons/CloseIcon";
import { createPortal } from "react-dom";
import { PanelContent } from "./PanelContent";
import { PanelInfoEditor } from "./PanelInfoEditor";

type Props = PropsWithChildren<{
  panelInfo: PanelInfo;
}>;

export const PanelContainer = ({ panelInfo }: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="grid size-full grid-rows-[auto_1fr] overflow-hidden rounded-md bg-base-200">
      <div className="grid justify-end">
        <button
          type="button"
          onClick={() => console.log("close")}
          className={`btn btn-circle p-1 btn-ghost btn-xs ${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
        >
          <CloseIcon className="fill-current" />
        </button>
      </div>
      <div className="grid p-1">
        <PanelContent dialogRef={dialogRef} panelInfo={panelInfo} />
      </div>
      {createPortal(
        <PanelInfoEditor dialogRef={dialogRef} panelInfo={panelInfo} />,
        document.body,
      )}
    </div>
  );
};
