import { useRef } from "react";
import GridLayout from "react-grid-layout";
import { AddPanelForm } from "./dashboard/AddPanelForm";
import {
  createDefaultPanelInfo,
  PanelInfoListSchema,
  type PanelType,
} from "./panel/type";
import { LayoutEditorContainer } from "./dashboard/LayoutEditorContainer";
import type { LayoutEditorRefProps } from "./dashboard/layout/LayoutEditor";
import { useLocalStorage } from "../libs/hooks/useLocalStorage";
import { PanelsList } from "./dashboard/PanelsList";
import { LayoutSchema } from "./dashboard/layout/layout";

export const Dashboard = () => {
  const layoutEditorRef = useRef<LayoutEditorRefProps>(null);

  const [items, setItems] = useLocalStorage(
    "dashboard-items",
    PanelInfoListSchema,
    [],
  );

  const [layout, setLayout] = useLocalStorage(
    "dashboard-layout",
    LayoutSchema,
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
    <div className="min-h-screen bg-base-300 p-2">
      <div className="grid gap-2">
        <AddPanelForm onAddPanel={handleAddPanel} />
        <LayoutEditorContainer
          items={items}
          setItems={setItems}
          layout={layout}
          setLayout={setLayout}
        />
        <PanelsList
          panels={items}
          setPanels={setItems}
          onAddPanel={handleAddPanel}
        />
      </div>
    </div>
  );
};
