import { type Dispatch, type SetStateAction } from "react";
import { type PanelInfo } from "../panel/type";
import { PanelListItemButtons } from "./panel-list/PanelListItemButtons";
import { PanelListItemContent } from "./panel-list/PanelListItem";

type Props = {
  panels: PanelInfo[];
  setPanels: Dispatch<SetStateAction<PanelInfo[]>>;
};

export const PanelsList = ({ panels, setPanels }: Props) => {
  // TODO: wrap by reducer
  const removeItem = (item: PanelInfo) =>
    setPanels((prev) => prev.filter((v) => v.uuid !== item.uuid));
  const editItem = (newItem: PanelInfo) =>
    setPanels((prev) =>
      prev.map((v) => (v.uuid === newItem.uuid ? newItem : v)),
    );

  return (
    <div className="grid gap-4 overflow-x-auto rounded-md bg-base-200 p-2">
      <div className="rounded-md">
        <div className="grid grid-cols-[1fr_auto] rounded-md">
          {panels.map((panel) => (
            <div
              key={panel.uuid}
              className="col-span-full grid grid-cols-subgrid items-center border border-base-300 bg-base-100 px-3"
            >
              <PanelListItemContent
                panel={panel}
                editItem={editItem}
                removeItem={removeItem}
              />
              <PanelListItemButtons
                panel={panel}
                editItem={editItem}
                removeItem={removeItem}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
