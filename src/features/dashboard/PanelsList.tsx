import { useRef, type Dispatch, type SetStateAction } from "react";
import {
  getPanelContentCaption as getPanelContentDescription,
  type PanelInfo,
} from "./layout/panel/type";
import { EditIcon } from "../../components/icons/EditIcon";
import { DeleteIcon } from "../../components/icons/DeleteIcon";
import { PanelInfoEditor } from "./layout/panel/PanelInfoEditor";
import { createPortal } from "react-dom";
import { PanelClosePopover } from "./layout/panel/PanelClosePopover";

type Props = {
  panels: PanelInfo[];
  setPanels: Dispatch<SetStateAction<PanelInfo[]>>;
};

export const PanelsList = ({ panels, setPanels }: Props) => {
  // TODO: wrap by reducer
  const removeItem = (item: PanelInfo) =>
    setPanels((prev) => prev.filter((v) => v.uuid !== item.uuid));
  const editItem = (item: PanelInfo) =>
    setPanels((prev) => prev.map((v) => (v.uuid === item.uuid ? item : v)));

  const editorDialogRef = useRef<HTMLDialogElement>(null);
  const panelCloseDialogRef = useRef<HTMLDialogElement>(null);

  return (
    <div className="grid gap-4 overflow-x-auto rounded-md bg-base-200 p-2">
      <div className="grid grid-cols-[auto_auto_1fr_auto] gap-x-5 rounded-md">
        {panels.map((v, i) => (
          <>
            {createPortal(
              <PanelInfoEditor
                dialogRef={editorDialogRef}
                panelInfo={v}
                editInfo={editItem}
              />,
              document.body,
            )}
            {createPortal(
              <PanelClosePopover
                dialogRef={panelCloseDialogRef}
                onConfirmed={() => {
                  removeItem(v);
                  panelCloseDialogRef.current?.close();
                }}
              />,
              document.body,
            )}
            <div
              key={`panel-list-item-${i}`}
              className="col-span-full grid grid-cols-subgrid p-1 last:rounded-b-md even:bg-base-300"
            >
              <label className="flex items-center rounded-md">
                <input type="checkbox" className="checkbox checkbox-sm" />
              </label>
              <span className="text-lg font-semibold">{v.type}</span>
              <span>{getPanelContentDescription(v)}</span>
              <div className="grid grid-cols-2 items-center">
                <button
                  className="btn btn-square btn-ghost btn-sm"
                  onClick={() => editorDialogRef.current?.showModal()}
                >
                  <EditIcon className="size-4 fill-current" />
                </button>
                <button
                  className="btn btn-square btn-ghost btn-sm"
                  onClick={() => panelCloseDialogRef.current?.showModal()}
                >
                  <DeleteIcon className="size-4 fill-current" />
                </button>
              </div>
            </div>
          </>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_auto]">
        {/* TODO: Texts */}
        <button className="btn rounded-r-none btn-sm btn-primary">+</button>
        <button className="btn rounded-l-none btn-sm btn-primary">▽</button>
      </div>
    </div>
  );
};
