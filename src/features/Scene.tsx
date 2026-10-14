import { useAtomValue } from "jotai";

import { sceneSettingsStore } from "./panels/scene/scene";
import { SceneBoards } from "./scene/SceneBoards";

export const Scene = () => {
  const { background } = useAtomValue(sceneSettingsStore);

  return (
    <div className="grid w-svw">
      <div
        style={{
          // JSON.stringify で二重引用符付き・エスケープ済みの文字列にする（CSS の url() 内で
          // 空白や ")" を含む URL が壊れないように）。
          backgroundImage: `url(${JSON.stringify(background)})`,
        }}
        className={`col-span-full row-span-full bg-cover`}
      />
      <SceneBoards className="col-span-full row-span-full aspect-video" />
    </div>
  );
};
