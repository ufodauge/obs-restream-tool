import { useRef } from "react";
import { Modal } from "../../components/Modal";
import { PanelClosePopover } from "../panel/PanelClosePopover";
import type { PanelInfo } from "../panel/type";
import { RGL_DRAGGABLE_CANCEL_CLASS_NAME } from "../layout/layout";
import { PanelListTitle } from "./PanelListTitle";
import { PanelInfoEditForm } from "../panel/PanelInfoEditorForm";

type Props = {
  panel: PanelInfo;
  removeItem: (item: PanelInfo) => void;
  editItem: (newItem: PanelInfo) => void;
};

export const PanelListItemContent = ({ panel, editItem, removeItem }: Props) => {
  const panelCloseDialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="collapse">
      <input type="radio" name="panel-list-item-accordion" />

      <div className="collapse-title flex items-center gap-2 font-semibold">
        <PanelListTitle panelInfo={panel} />
      </div>

      <div className="collapse-content grid grid-cols-[1fr_auto] gap-2">
        <PanelInfoEditForm panelInfo={panel} editInfo={editItem} />
      </div>
      <Modal
        ref={panelCloseDialogRef}
        backdrop
        className={RGL_DRAGGABLE_CANCEL_CLASS_NAME}
      >
        <PanelClosePopover
          onConfirmed={() => {
            removeItem(panel);
            panelCloseDialogRef.current?.close();
          }}
        />
      </Modal>
    </div>
  );
};
