import { useAtom } from "jotai";
import { PlusIcon } from "lucide-react";

import { videoPanelStores } from "../panels/videos/panels";
import { VideoPanelForm } from "./VideoPanelForm";

export const VideoPanelForms = () => {
  const [videoPanel, setVideoPanel] = useAtom(videoPanelStores);

  return (
    <div className="">
      {videoPanel.map((v) => (
        <VideoPanelForm
          key={v.id}
          videoPanel={v}
          setVideoPanel={(data) => {
            setVideoPanel((panels) => {
              const result = panels.map((panel) =>
                panel.id === data.id ? data : panel,
              );

              console.log(data, panels, result);
              return result;
            });
          }}
          removeVideoPanel={() => {
            setVideoPanel((panels) =>
              panels.filter((panel) => panel.id !== v.id),
            );
          }}
        />
      ))}
      <button
        className="btn btn-primary"
        onClick={() => {
          setVideoPanel((p) => [
            ...p,
            {
              channel: "channel_id",
              enable: false,
              id: crypto.randomUUID(),
              size: 1,
              subtext: "",
              type: "twitch",
            },
          ]);
        }}
      >
        <PlusIcon />
      </button>
    </div>
  );
};
