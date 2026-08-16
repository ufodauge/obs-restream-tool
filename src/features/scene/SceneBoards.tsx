import { useAtomValue } from "jotai";

import { BoardPanel } from "@/features/panels/BoardPanel";
import { TextPanel } from "@/features/panels/TextPanel";
import { TimerPanel } from "@/features/panels/TimerPanel";

import { sceneSettingsStore } from "../panels/scene/scene";

/**
 * 動画パネル（Twitch/iframe）は、1 つの Browser Source に大量の iframe を
 * 詰め込むと OBS 側のフレームレートが落ちるため、ここでは描画しない。
 * 各パネルは Slot.tsx（slot.html?index=N）が個別の Browser Source として
 * 1 枚ずつ描画し、位置・サイズは obs-websocket 経由（obsSync.ts）で
 * OBS 側のシーンアイテムとして配置する。
 *
 * このコンポーネントは背景・ビンゴボード・タイマー・テキストなど、
 * 単一ソースにまとめても問題ないパネルだけを描画する。
 */
export const SceneBoards = ({ className }: { className: string }) => {
  const { text } = useAtomValue(sceneSettingsStore);

  return (
    <div
      className={`${className} grid grid-flow-row-dense grid-cols-13 grid-rows-13 gap-1 backdrop-blur-xs backdrop-hue-rotate-60`}
    >
      <BoardPanel className="col-start-9 -col-end-1 row-span-9" />
      <div className="col-span-5 -row-start-2 -row-end-1 pb-2">
        <TimerPanel className="rounded-r-[.3cqw] bg-neutral/70" />
      </div>
      <div className="col-span-8 -row-start-2 -row-end-1 grid">
        <TextPanel
          text={text}
          className="rounded-tl-[.3cqw] bg-neutral/70 p-1 pl-4"
        />
      </div>
    </div>
  );
};
