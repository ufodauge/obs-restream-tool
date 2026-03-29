import { BoardForm } from "./forms/BoardForm";
import { SceneSettingsForm } from "./forms/SceneSettingsForm";
import { TimerForm } from "./forms/TimerForm";
import { VideoPanelForms } from "./forms/VideoPanelForms";

export const Dashboard = () => {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(332px,1fr))] gap-2 bg-base-200 p-2 *:shadow">
      <BoardForm />
      <SceneSettingsForm />
      <TimerForm />
      <VideoPanelForms />
    </div>
  );
};
