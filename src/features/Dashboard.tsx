import {
  createDefaultPanelInfo,
  PanelInfoListSchema,
  type PanelType,
} from "./panel/type";
import { LayoutEditorContainer } from "./dashboard/LayoutEditorContainer";
import { useLocalStorage } from "../libs/hooks/useLocalStorage";
import { PanelsList } from "./dashboard/PanelsList";
import { AddPanelForm } from "./dashboard/AddPanelForm";
import { Toolbar } from "./dashboard/Toolbar";

export const Dashboard = () => {
  const [items, setItems] = useLocalStorage(
    "dashboard-items",
    PanelInfoListSchema,
    [],
  );

  const onAddPanel = (panel: PanelType) => {
    const newItem = createDefaultPanelInfo(panel);
    setItems([...items, newItem]);
  };

  return (
    <div className="min-h-screen bg-base-300 p-2">
      <div className="grid gap-2">
        <Toolbar />
        <LayoutEditorContainer
          items={items.filter((v) => v.visible)}
          setItems={setItems}
        />
        <PanelsList panels={items} setPanels={setItems} />
        <AddPanelForm onSubmit={onAddPanel} />
      </div>
    </div>
  );
};
