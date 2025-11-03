import {
  type Dispatch,
  type PropsWithChildren,
  type RefObject,
  type SetStateAction,
} from "react";
import { type LayoutEditorRefProps, LayoutEditor } from "./layout/LayoutEditor";
import { PanelContainer } from "./layout/panel/PanelContainer";
import type { PanelInfo } from "./layout/panel/type";

type Props = PropsWithChildren<{
  items: PanelInfo[];
  setItems: Dispatch<SetStateAction<PanelInfo[]>>;
  ref?: RefObject<LayoutEditorRefProps | null>;
}>;

export const LayoutEditorContainer = ({ items, setItems, ref }: Props) => {
  const removeItem = (item: PanelInfo) =>
    setItems((prev) => prev.filter((v) => v.uuid !== item.uuid));
  const editItem = (item: PanelInfo) =>
    setItems((prev) => prev.map((v) => (v.uuid === item.uuid ? item : v)));

  return (
    <LayoutEditor ref={ref}>
      {items.map((item) => (
        <div
          key={item.uuid}
          className="scrollbar-none rounded-md bg-base-100 outline-1 outline-base-content/20"
        >
          <PanelContainer
            panelInfo={item}
            removeItem={removeItem}
            editItem={editItem}
          />
        </div>
      ))}
    </LayoutEditor>
  );
};
