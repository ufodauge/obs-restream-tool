import { useAtomValue } from "jotai";

import { sceneSettingsStore } from "./panels/scene/scene";
import { SceneBoards } from "./scene/SceneBoards";

export const Scene = () => {
  const { background } = useAtomValue(sceneSettingsStore);

  return (
    <div className="grid w-svw">
      <div
        style={{
          backgroundImage: `url(${background})`,
        }}
        className={`col-span-full row-span-full bg-cover`}
      />
      <SceneBoards className="col-span-full row-span-full aspect-video" />
    </div>
  );
};
