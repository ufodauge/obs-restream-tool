import { useRef, type PropsWithChildren } from "react";
import type { PanelInfo } from "./type";
import { PanelContent } from "./PanelContent";
import { PanelInfoEditForm } from "./PanelInfoEditorForm";
import { PanelHeader } from "./PanelHeader";
import { PanelClosePopover } from "./PanelClosePopover";
import { Modal } from "../../components/Modal";
import { RGL_DRAGGABLE_CANCEL_CLASS_NAME } from "../dashboard/layout/layout";

type Props = PropsWithChildren<{
  panelInfo: PanelInfo;
  removeItem: (item: PanelInfo) => void;
  editItem: (item: PanelInfo) => void;
}>;

export const PanelContainer = ({ panelInfo, removeItem, editItem }: Props) => {
  const editorDialogRef = useRef<HTMLDialogElement>(null);
  const panelCloseDialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="grid size-full grid-rows-[auto_1fr] overflow-hidden rounded-md bg-base-200">
      <PanelHeader
        panelInfo={panelInfo}
        onCloseClick={() => panelCloseDialogRef.current?.showModal()}
        editItem={editItem}
      />
      <div className="grid p-1">
        <PanelContent dialogRef={editorDialogRef} panelInfo={panelInfo} />
      </div>
      <Modal
        ref={editorDialogRef}
        backdrop
        className={RGL_DRAGGABLE_CANCEL_CLASS_NAME}
      >
        <PanelInfoEditForm
          onSubmitCompleted={() => editorDialogRef.current?.close()}
          panelInfo={panelInfo}
          editInfo={editItem}
        />
      </Modal>
      <Modal
        ref={panelCloseDialogRef}
        backdrop
        className={RGL_DRAGGABLE_CANCEL_CLASS_NAME}
      >
        <PanelClosePopover
          onConfirmed={() => {
            removeItem(panelInfo);
            panelCloseDialogRef.current?.close();
          }}
        />
      </Modal>
    </div>
  );
};
