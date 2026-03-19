import { useAtomValue } from "jotai";
import { generateBingoBoardFromVersion } from "oot-bingo-lists";

import { translations } from "@/i18n/ootBingo";

import { boardSettings } from "./board/settings";

export const BoardPanel = ({ className }: { className: string }) => {
  const { version, seed } = useAtomValue(boardSettings);

  const board = generateBingoBoardFromVersion(version, "normal", seed)
    ?.squares.values()
    .map((v) => (
      <span
        key={v.goal.id}
        className="grid place-content-center place-items-center rounded-[.3cqw] bg-neutral/70 px-[1cqw] text-center text-[.9cqw] text-balance text-neutral-content"
      >
        {translations.get(v.goal.name) ?? v.goal.name}
      </span>
    ));

  return (
    <div className={`${className} grid rounded-[.3cqw]`}>
      <div className="grid grid-cols-5 grid-rows-5 gap-[.2cqw]">{board}</div>
    </div>
  );
};
