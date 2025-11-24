import { useRef } from "react";
import { DeleteIcon } from "../../components/icons/DeleteIcon";
import { KeepIcon } from "../../components/icons/KeepIcon";
import { VisibilityIcon } from "../../components/icons/VisibilityIcon";
import { ToggleButton } from "../../components/ToggleButton";
import type { PanelInfo } from "../panel/type";
import { Modal } from "../../components/Modal";
import { RGL_DRAGGABLE_CANCEL_CLASS_NAME } from "../layout/layout";
import { PanelClosePopover } from "../panel/PanelClosePopover";
import { AlignVerticalTopIcon } from "../../components/icons/AlignVerticalTopIcon";
import { useCompactionMode } from "../../libs/store/compaction";

type Props = {
  panel: PanelInfo;
  removeItem: (item: PanelInfo) => void;
  editItem: (newItem: PanelInfo) => void;
};

export const PanelListItemButtons = ({
  panel,
  editItem,
  removeItem,
}: Props) => {
  const panelCloseDialogRef = useRef<HTMLDialogElement>(null);

  const compaction = useCompactionMode();

  return (
    <div className="flex items-center gap-2">
      <ToggleButton
        iconOn={
          <AlignVerticalTopIcon
            className={`${compaction.enable ? "fill-current" : "fill-transparent"}`}
          />
        }
        iconOff={
          <AlignVerticalTopIcon
            className={`${compaction.enable ? "fill-current/20" : "fill-transparent"}`}
          />
        }
        checked={panel.alignTop}
        className={`size-4`}
        disabled={!compaction.enable}
        onChange={(e) =>
          editItem({
            ...panel,
            alignTop: e.currentTarget.checked,
          })
        }
      />
      <ToggleButton
        iconOn={<KeepIcon className="size-4 fill-current" />}
        iconOff={<KeepIcon className="size-4 fill-current/20" />}
        checked={panel.pinned}
        onChange={(e) =>
          editItem({
            ...panel,
            pinned: e.currentTarget.checked,
          })
        }
      />
      <ToggleButton
        iconOn={<VisibilityIcon className="size-4 fill-current" />}
        iconOff={<VisibilityIcon className="size-4 fill-current/20" />}
        checked={panel.visible}
        onChange={(e) => {
          editItem({
            ...panel,
            visible: e.currentTarget.checked,
          });
        }}
      />
      <button
        className="btn btn-square btn-ghost btn-sm"
        onClick={() => panelCloseDialogRef.current?.showModal()}
      >
        <DeleteIcon className="size-4 fill-current" />
      </button>
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
