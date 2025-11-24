import { useRef, type PropsWithChildren } from "react";
import type { PanelInfo } from "./type";
import { PanelContent } from "./PanelContent";
import { PanelInfoEditForm } from "./PanelInfoEditorForm";
import { PanelHeader } from "./PanelHeader";
import { Modal } from "../../components/Modal";
import { RGL_DRAGGABLE_CANCEL_CLASS_NAME } from "../layout/layout";

type Props = PropsWithChildren<{
  panelInfo: PanelInfo;
  editItem: (item: PanelInfo) => void;
}>;

export const PanelContainer = ({ panelInfo, editItem }: Props) => {
  const editorDialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="grid size-full grid-rows-[auto_1fr] overflow-hidden rounded-md bg-base-200">
      <PanelHeader
        panelInfo={panelInfo}
        onCloseClick={() => editItem({ ...panelInfo, visible: false })}
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
    </div>
  );
};
