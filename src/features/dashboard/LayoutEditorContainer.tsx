import { type Dispatch, type SetStateAction } from "react";
import { LayoutEditor } from "./layout/LayoutEditor";
import { PanelContainer } from "../panel/PanelContainer";
import type { PanelInfo } from "../panel/type";
import type { Layout } from "./layout/layout";

type Props = {
  items: PanelInfo[];
  setItems: Dispatch<SetStateAction<PanelInfo[]>>;
  layout: Layout;
  setLayout: Dispatch<SetStateAction<Layout>>;
};

export const LayoutEditorContainer = ({
  items,
  setItems,

  layout,
  setLayout,
}: Props) => {
  const removeItem = (item: PanelInfo) =>
    setItems((prev) => prev.filter((v) => v.uuid !== item.uuid));
  const editItem = (item: PanelInfo) =>
    setItems((prev) => prev.map((v) => (v.uuid === item.uuid ? item : v)));

  return (
    <LayoutEditor layout={layout} setLayout={setLayout}>
      {items.map((item) => (
        <div key={item.uuid} className="scrollbar-none p-1">
          <div className="h-full rounded-md bg-base-100 outline-1 outline-base-content/20">
            <PanelContainer
              panelInfo={item}
              removeItem={removeItem}
              editItem={editItem}
            />
          </div>
        </div>
      ))}
    </LayoutEditor>
  );
};
