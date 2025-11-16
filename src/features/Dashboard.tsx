import { AddPanelForm } from "./dashboard/AddPanelForm";
import {
  createDefaultPanelInfo,
  PanelInfoListSchema,
  type PanelType,
} from "./panel/type";
import { LayoutEditorContainer } from "./dashboard/LayoutEditorContainer";
import { useLocalStorage } from "../libs/hooks/useLocalStorage";
import { PanelsList } from "./dashboard/PanelsList";

export const Dashboard = () => {
  const [items, setItems] = useLocalStorage(
    "dashboard-items",
    PanelInfoListSchema,
    [],
  );

  const handleAddPanel = (panel: PanelType) => {
    const newItem = createDefaultPanelInfo(panel);
    setItems([...items, newItem]);
  };

  return (
    <div className="min-h-screen bg-base-300 p-2">
      <div className="grid gap-2">
        <AddPanelForm onAddPanel={handleAddPanel} />
        <LayoutEditorContainer
          items={items}
          setItems={setItems}
          layoutList={items.map((v) => v.layout)}
          setLayoutList={
            () => {
              // TODO
              throw new Error();
            }
            // setItems((p) => typeof layoutList === "function" ?  p.map((v) => layoutList()))
          }
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
