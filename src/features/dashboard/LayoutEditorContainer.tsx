import { useCallback, type Dispatch, type SetStateAction } from "react";
import { LayoutEditor } from "../layout/LayoutEditor";
import { PanelContainer } from "../panel/PanelContainer";
import { type PanelInfo } from "../panel/type";
import { createDerivedSetter } from "../../libs/createDerivedSetter";
import type ReactGridLayout from "react-grid-layout";

type Props = {
  items: PanelInfo[];
  setItems: Dispatch<SetStateAction<PanelInfo[]>>;
};

const mapPanelInfoToGridLayout = (
  panelInfoList: PanelInfo[],
): ReactGridLayout.Layout[] =>
  panelInfoList.map((panelInfo) => ({
    ...panelInfo.layout,
    i: panelInfo.uuid,
  }));

// そもそもこんな煩雑なことをするべきではない
// どうせ feature 層でやるんだから
// さっさと Atom にしろ
const inverseMapPanelInfoToGridLayout = (
  layouts: ReactGridLayout.Layout[],
  panelInfoList: PanelInfo[],
): PanelInfo[] =>
  panelInfoList.map((v) => {
    // 見つからないものは更新しない
    const newLayout =
      layouts.find(({ i: uuid }) => uuid === v.uuid) ?? v.layout;

    return {
      ...v,
      layout: newLayout,
    };
  });

export const LayoutEditorContainer = ({ items, setItems }: Props) => {
  const editItem = (item: PanelInfo) =>
    setItems((prev) => prev.map((v) => (v.uuid === item.uuid ? item : v)));

  const setLayoutList = useCallback<
    Dispatch<SetStateAction<ReactGridLayout.Layout[]>>
  >(
    (layouts: SetStateAction<ReactGridLayout.Layout[]>) => {
      const setter = createDerivedSetter<PanelInfo[], ReactGridLayout.Layout[]>(
        setItems,
        mapPanelInfoToGridLayout,
        inverseMapPanelInfoToGridLayout,
      );
      setter(layouts);
    },
    [setItems],
  );

  return (
    <LayoutEditor
      layoutList={items.map((panel) => ({
        ...panel.layout,
        i: panel.uuid,
        static: panel.pinned || !panel.alignTop,
        isDraggable: !panel.pinned,
        isResizable: !panel.pinned,
      }))}
      setLayoutList={setLayoutList}
    >
      {items.map((item) => (
        <div key={item.uuid} className="scrollbar-none p-1">
          <div className="h-full rounded-md outline-1 outline-base-content/20">
            <PanelContainer panelInfo={item} editItem={editItem} />
          </div>
        </div>
      ))}
    </LayoutEditor>
  );
};
