import { useRef, type Dispatch, type SetStateAction } from "react";
import { DeleteIcon } from "../../components/icons/DeleteIcon";
import { PanelClosePopover } from "../panel/PanelClosePopover";
import {
  type PanelInfo,
  type PanelType,
  getPanelContentCaption,
} from "../panel/type";
import { Modal } from "../../components/Modal";
import { RGL_DRAGGABLE_CANCEL_CLASS_NAME } from "./layout/layout";
import { ToggleButton } from "../../components/ToggleButton";
import { VisibilityIcon } from "../../components/icons/VisibilityIcon";
import { VisibilityOffIcon } from "../../components/icons/VisibilityOffIcon";
import { DropDownIcon } from "../../components/icons/DropDownIcon";
import { KeepIcon } from "../../components/icons/KeepIcon";
import { KeepOffIcon } from "../../components/icons/KeepOffIcon";

type Props = {
  panels: PanelInfo[];
  onAddPanel: (panelType: PanelType) => void;
  setPanels: Dispatch<SetStateAction<PanelInfo[]>>;
};

export const PanelsList = ({ panels, setPanels, onAddPanel }: Props) => {
  // TODO: wrap by reducer
  const removeItem = (item: PanelInfo) =>
    setPanels((prev) => prev.filter((v) => v.uuid !== item.uuid));
  const editItem = (newItem: PanelInfo) =>
    setPanels((prev) =>
      prev.map((v) => (v.uuid === newItem.uuid ? newItem : v)),
    );

  const editorDialogRef = useRef<HTMLDialogElement>(null);
  const panelCloseDialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="grid gap-4 overflow-x-auto rounded-md bg-base-200 p-2">
      <div className="rounded-md">
        <div className="grid grid-cols-[1fr_auto] rounded-md">
          {panels.map((v, i) => (
            <div
              key={`panel-list-item-${i}`}
              className="col-span-full grid grid-cols-subgrid items-center border border-base-300 bg-base-100 px-3"
            >
              <div className="collapse">
                <input type="radio" name="panel-list-item-accordion" />

                <div className="collapse-title flex items-center gap-2 font-semibold">
                  <span className="text-lg font-semibold">
                    {getPanelContentCaption(v)}
                  </span>
                </div>

                <div className="collapse-content grid grid-cols-[1fr_auto] gap-2">
                  {/* <PanelInfoEditor panelInfo={v} ref={} /> */}
                </div>
                <Modal
                  ref={editorDialogRef}
                  backdrop
                  className={RGL_DRAGGABLE_CANCEL_CLASS_NAME}
                >
                  <PanelClosePopover
                    onConfirmed={() => {
                      removeItem(v);
                      panelCloseDialogRef.current?.close();
                    }}
                  />
                </Modal>
              </div>

              <div className="grid grid-cols-3 items-center">
                <ToggleButton
                  iconOn={<KeepIcon className="size-4 fill-current" />}
                  iconOff={<KeepOffIcon className="size-4 fill-current" />}
                  defaultChecked={v.static}
                  onChange={(e) =>
                    editItem({
                      ...v,
                      static: e.currentTarget.checked,
                    })
                  }
                />
                <ToggleButton
                  iconOn={<VisibilityIcon className="size-4" />}
                  iconOff={<VisibilityOffIcon className="size-4" />}
                  defaultChecked={v.visible}
                  onChange={(e) =>
                    editItem({
                      ...v,
                      visible: e.currentTarget.checked,
                    })
                  }
                />
                <button
                  className="btn btn-square btn-ghost btn-sm"
                  onClick={() => panelCloseDialogRef.current?.showModal()}
                >
                  <DeleteIcon className="size-4 fill-current" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="join justify-center">
        {/* TODO: Texts */}
        <button
          className="btn join-item flex-10 btn-sm btn-primary"
          onClick={() => onAddPanel("text")}
        >
          Add
        </button>
        <button className="btn join-item btn-sm btn-primary">
          <DropDownIcon className="size-4 fill-current" />
        </button>
      </div>
    </div>
  );
};
