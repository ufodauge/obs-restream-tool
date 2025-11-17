import { useCallback, type Dispatch, type SetStateAction } from "react";
import { LayoutEditor } from "./layout/LayoutEditor";
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

const inverseMapPanelInfoToGridLayout = (
  layouts: ReactGridLayout.Layout[],
  panelInfoList: PanelInfo[],
): PanelInfo[] =>
  panelInfoList.map((v) => ({
    ...v,
    layout: layouts.find(({ i: uuid }) => uuid === v.uuid) ?? {
      w: 4,
      h: 3,
      x: 0,
      y: 0,
    },
  }));

export const LayoutEditorContainer = ({ items, setItems }: Props) => {
  const removeItem = (item: PanelInfo) =>
    setItems((prev) => prev.filter((v) => v.uuid !== item.uuid));
  const editItem = (item: PanelInfo) =>
    setItems((prev) => prev.map((v) => (v.uuid === item.uuid ? item : v)));

  const setLayoutList = useCallback<
    Dispatch<SetStateAction<ReactGridLayout.Layout[]>>
  >(
    (layouts: SetStateAction<ReactGridLayout.Layout[]>) =>
      createDerivedSetter<PanelInfo[], ReactGridLayout.Layout[]>(
        setItems,
        mapPanelInfoToGridLayout,
        inverseMapPanelInfoToGridLayout,
      )(layouts),
    [setItems],
  );

  return (
    <LayoutEditor
      layoutList={items.map((panel) => ({
        ...panel.layout,
        i: panel.uuid,
        static: !panel.alignTop,
        isDraggable: !panel.pinned,
        isResizable: !panel.pinned,
      }))}
      setLayoutList={setLayoutList}
    >
      {items.map((item) => (
        <div key={item.uuid} className="scrollbar-none p-1">
          <div className="h-full rounded-md outline-1 outline-base-content/20">
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
