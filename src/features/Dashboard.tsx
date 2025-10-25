import { useState } from "react";
import GridLayout from "react-grid-layout";
import { AddPanelForm } from "./dashboard/AddPanelForm";
import {
  createDefaultPanelInfo,
  type PanelInfo,
  type PanelType,
} from "./dashboard/layout/panel/type";
import { LayoutEditorContainer } from "./dashboard/LayoutEditorContainer";

export const Dashboard = () => {
  const [items, setItems] = useState<PanelInfo[]>(() => {
    const savedItems = localStorage.getItem("dashboard-items");
    // TODO: Zod validation
    return savedItems ? JSON.parse(savedItems) : [];
  });

  const [layout, setLayout] = useState<GridLayout.Layout[]>(() => {
    const savedLayout = localStorage.getItem("dashboard-layout");
    // TODO: Zod validation
    return savedLayout ? JSON.parse(savedLayout) : [];
  });

  // TODO: Save on commit time
  // useEffect(() => {
  //   localStorage.setItem('dashboard-items', JSON.stringify(items));
  //   localStorage.setItem('dashboard-layout', JSON.stringify(layout));
  // }, [items, layout]);

  const handleAddPanel = (panel: PanelType) => {
    const newItem = createDefaultPanelInfo(panel);
    const newLayoutItem: GridLayout.Layout = {
      i: newItem.uuid,
      x: (items.length * 4) % 12,
      y: Infinity,
      w: 4,
      h: 3,
    };
    setItems([...items, newItem]);
    setLayout([...layout, newLayoutItem]);
  };

  return (
    <div className="p-4 bg-base-300 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      <AddPanelForm onAddPanel={handleAddPanel} />
      <LayoutEditorContainer items={items} setItems={setItems} />
    </div>
  );
};
