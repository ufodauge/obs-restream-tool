import { useAtomValue } from "jotai";
import { Suspense, use } from "react";

import { boardSettingsStore } from "./board/settings";
import { getBoardTasks } from "./board/sources";

// generateTasksAsync（mm-bingo）が Promise を返すため BoardPanel は非同期に
// なる。React 19 の use(promise) は Suspense と組み合わせないと throw が
// 誰にもキャッチされないので、ここだけ内側のコンポーネントに切り出して
// <Suspense> で包む（Phase 6）。
const BoardGrid = () => {
  const settings = useAtomValue(boardSettingsStore);
  // getBoardTasks は source+version+seed をキーにモジュールレベルの Map で
  // Promise をキャッシュしている（毎レンダリング新規 Promise だと use() が
  // 無限にサスペンドする）。生成に失敗しても throw はせず Result で返る
  // ので、use() 自体が失敗することはない（オフライン等は下の !result.ok
  // 分岐で明示的に表示する）。
  const result = use(getBoardTasks(settings));

  if (!result.ok) {
    // OBS の Browser Source は失敗しても操作している人が常にいるとは
    // 限らない。ここで黙って空のグリッドを出すと「配信画面が真っ白」に
    // 気付けないまま進行してしまう（mm-bingo 側の fetch base バグを
    // 潰した際の教訓）ので、エラーメッセージ自体をボードの枠内に描画する。
    return (
      <div className="grid place-content-center place-items-center gap-1 rounded-[.3cqw] bg-neutral/70 p-[2cqw] text-center text-[.8cqw] text-balance text-error-content">
        <p>ボードの読み込みに失敗しました</p>
        <p className="opacity-70">{result.error.message}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 grid-rows-5 gap-[.2cqw]">
      {result.value.map((task) => (
        <span
          key={task.key}
          className="grid place-content-center place-items-center rounded-[.3cqw] bg-neutral/70 px-[1cqw] text-center text-[.9cqw] text-balance text-neutral-content"
        >
          {task.label}
        </span>
      ))}
    </div>
  );
};

export const BoardPanel = ({ className }: { className: string }) => (
  <div className={`${className} grid rounded-[.3cqw]`}>
    <Suspense
      fallback={
        <div className="grid place-content-center rounded-[.3cqw] bg-neutral/70 text-[.9cqw] text-neutral-content">
          読み込み中…
        </div>
      }
    >
      <BoardGrid />
    </Suspense>
  </div>
);
