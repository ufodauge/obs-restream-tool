import { BoardForm } from "./forms/BoardForm";
import { PanelTextForm } from "./forms/PanelTextForm";
import { TimerForm } from "./forms/TimerForm";
import { VideoPanelForms } from "./forms/VideoPanelForms";

export const Dashboard = () => {
  return (
    <div className="flow w-svw gap-2 p-2">
      <BoardForm />
      <PanelTextForm />
      <TimerForm />
      <VideoPanelForms />
    </div>
  );
};
