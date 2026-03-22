import { useAtomValue } from "jotai";

import { BoardPanel } from "@/features/panels/BoardPanel";
import { TextPanel } from "@/features/panels/TextPanel";
import { TimerPanel } from "@/features/panels/TimerPanel";
import { TwitchPanel } from "@/features/panels/TwitchPanel";
import { videoPanelStores } from "@/features/panels/videos/panels";

import { panelTextStore } from "../panels/text/text";

export const SceneBoards = ({ className }: { className: string }) => {
  const panels = useAtomValue(videoPanelStores)
    .values()
    .filter(({ enable }) => enable)
    .map((v, i) =>
      v.type === "twitch" ? (
        <TwitchPanel key={v.channel} channel={v.channel} size={v.size} />
      ) : (
        <div key={i}>unknown</div>
      ),
    )
    .toArray();

  const text = useAtomValue(panelTextStore);

  return (
    <div
      className={`${className} grid grid-flow-row-dense grid-cols-13 grid-rows-13 gap-1 backdrop-blur-xs backdrop-hue-rotate-60`}
    >
      <BoardPanel className="col-start-9 -col-end-1 row-span-9" />
      {panels}
      <div className="col-span-5 -row-end-1 pb-2">
        <TimerPanel className="rounded-r-[.3cqw] bg-neutral/70" />
      </div>
      <div className="col-span-8 -row-end-1 grid">
        <TextPanel
          text={text}
          className="rounded-tl-[.3cqw] bg-neutral/70 pl-[4cqw]"
        />
      </div>
    </div>
  );
};
