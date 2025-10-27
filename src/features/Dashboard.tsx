import { useRef, useState } from "react";
import GridLayout from "react-grid-layout";
import { AddPanelForm } from "./dashboard/AddPanelForm";
import {
  createDefaultPanelInfo,
  PanelInfoListSchema,
  type PanelInfo,
  type PanelType,
} from "./dashboard/layout/panel/type";
import { LayoutEditorContainer } from "./dashboard/LayoutEditorContainer";
import { tryParseJson } from "../libs/json/json";
import type { LayoutEditorRefProps } from "./dashboard/layout/LayoutEditor";

// TODO: overlap の許可、プリセット機能、グリッドの詳細度、パネルの追加易化
export const Dashboard = () => {
  const layoutEditorRef = useRef<LayoutEditorRefProps>(null);

  // TODO: useSyncExternalStore
  const [items, setItems] = useState<PanelInfo[]>(() => {
    const savedItemsString = localStorage.getItem("dashboard-items");
    if (savedItemsString === null) {
      return [];
    }

    return tryParseJson(savedItemsString, PanelInfoListSchema).unwrapOr([]);
  });

  const handleAddPanel = (panel: PanelType) => {
    if (layoutEditorRef.current === null) {
      return;
    }

    const newItem = createDefaultPanelInfo(panel);
    const newLayoutItem: GridLayout.Layout = {
      i: newItem.uuid,
      x: (items.length * 4) % 12,
      y: 0,
      w: 4,
      h: 3,
    };
    setItems([...items, newItem]);
    layoutEditorRef.current?.addPanel(newLayoutItem);
  };

  return (
    <div className="min-h-screen bg-base-300 p-4">
      <h1 className="mb-4 text-3xl font-bold">Dashboard</h1>
      <AddPanelForm onAddPanel={handleAddPanel} />
      <LayoutEditorContainer
        items={items}
        setItems={setItems}
        ref={layoutEditorRef}
      />
    </div>
  );
};
