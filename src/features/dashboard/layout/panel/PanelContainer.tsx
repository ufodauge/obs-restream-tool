import { useRef, type PropsWithChildren } from "react";
import type { PanelInfo } from "./type";
import { createPortal } from "react-dom";
import { PanelContent } from "./PanelContent";
import { PanelInfoEditor } from "./PanelInfoEditor";
import { PanelHeader } from "./PanelHeader";
import { PanelClosePopover } from "./PanelClosePopover";

type Props = PropsWithChildren<{
  panelInfo: PanelInfo;
  removeItem: (item: PanelInfo) => void;
  editItem: (item: PanelInfo) => void;
}>;

export const PanelContainer = ({
  panelInfo,
  removeItem,
  editItem,
}: Props) => {
  const editorDialogRef = useRef<HTMLDialogElement>(null);
  const panelCloseDialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div
      // has-[.panel-content:hover]:grid-rows-[.1rem_1fr]
      className={`grid size-full grid-rows-[auto_1fr] overflow-hidden rounded-md bg-base-200`}
    >
      <PanelHeader
        panelInfo={panelInfo}
        onCloseClick={() => panelCloseDialogRef.current?.showModal()}
        // onCloseClick={removeSelf}
      />
      <div className="grid p-1">
        <PanelContent dialogRef={editorDialogRef} panelInfo={panelInfo} />
      </div>
      {createPortal(
        <PanelInfoEditor
          dialogRef={editorDialogRef}
          panelInfo={panelInfo}
          editInfo={editItem}
        />,
        document.body,
      )}
      {createPortal(
        <PanelClosePopover
          dialogRef={panelCloseDialogRef}
          onConfirmed={() => {
            removeItem(panelInfo);
            editorDialogRef.current?.hidePopover();
          }}
        />,
        document.body,
      )}
    </div>
  );
};
