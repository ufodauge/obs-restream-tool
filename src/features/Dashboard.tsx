import { useRef } from "react";
import GridLayout from "react-grid-layout";
import { AddPanelForm } from "./dashboard/AddPanelForm";
import {
  createDefaultPanelInfo,
  PanelInfoListSchema,
  type PanelType,
} from "./dashboard/layout/panel/type";
import { LayoutEditorContainer } from "./dashboard/LayoutEditorContainer";
import type { LayoutEditorRefProps } from "./dashboard/layout/LayoutEditor";
import { useLocalStorage } from "../libs/hooks/useLocalStorage";

export const Dashboard = () => {
  const layoutEditorRef = useRef<LayoutEditorRefProps>(null);

  const [items, setItems] = useLocalStorage(
    "dashboard-items",
    PanelInfoListSchema,
    [],
  );

  const handleAddPanel = (panel: PanelType) => {
    if (layoutEditorRef.current === null) {
      return;
    }

    const newItem = createDefaultPanelInfo(panel);
    const newLayoutItem: GridLayout.Layout = {
      i: newItem.uuid,
      x: 0,
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
