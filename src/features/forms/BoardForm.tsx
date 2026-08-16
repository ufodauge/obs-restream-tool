import { useAtom } from "jotai";
import { CheckIcon } from "lucide-react";
import { latestBingoVersion } from "oot-bingo-lists";
import {
  useActionState,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import * as v from "valibot";

import { useFormDirty } from "@/libs/hooks/useFormDirty";

import {
  AVAILABLE_BOARD_SOURCES,
  boardSettingsSchema,
  boardSettingsStore,
  type BoardSettings,
} from "../panels/board/settings";
import {
  latestMmTaskVersion,
  MM_TASK_VERSIONS,
  OOT_BINGO_VERSIONS,
} from "../panels/board/sources";

const SOURCE_LABEL: Record<BoardSettings["source"], string> = {
  oot: "oot-bingo-lists（OoT Rando）",
  mm: "mm-bingo（ムジュラの仮面）",
};

// useFormStatus は <form> の子孫コンポーネントでないと pending を取得できない
// ため、送信ボタンだけ切り出す。
const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-circle" type="submit" disabled={pending}>
      <CheckIcon />
    </button>
  );
};

// 保存済みの値（boardSettings）が変わるたびに、呼び出し元で key を変えて
// このコンポーネントごと再マウントする。非制御フォームの defaultValue も
// isDirty のベースラインも一緒に作り直されるので、他ドックでの編集・自分の
// 保存の両方が自然に反映される（A-8）。
const BoardFormCard = ({
  settings,
  onSave,
}: {
  settings: BoardSettings;
  onSave: (data: BoardSettings) => void;
}): ReactNode => {
  const formRef = useRef<HTMLFormElement>(null);
  const { isDirty, handleInput } = useFormDirty(formRef);

  // バージョンの選択肢はソースによって変わる（oot: BingoVersion、
  // mm: ALGORITHM_BY_VERSION のキー）ため、source の変更を state で
  // 追いかけて version の <select> を出し分ける。
  const [source, setSource] = useState<BoardSettings["source"]>(
    settings.source,
  );
  const [version, setVersion] = useState<string>(settings.version);
  const versionOptions: readonly string[] =
    source === "oot" ? OOT_BINGO_VERSIONS : MM_TASK_VERSIONS;

  const handleSourceChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextSource = event.currentTarget.value as BoardSettings["source"];
    setSource(nextSource);
    // 直前の version は別ソースの値なので、切替時はそのソースの最新版へ
    // リセットする（そのまま送信するとバリデーションで弾かれてしまう）。
    setVersion(nextSource === "oot" ? latestBingoVersion : latestMmTaskVersion);
  };

  const [error, formAction] = useActionState<string | null, FormData>(
    (_prevError, formData) => {
      const parsed = v.safeParse(boardSettingsSchema, {
        source: formData.get("source"),
        version: formData.get("version"),
        seed: formData.get("seed"),
      });
      if (!parsed.success) {
        return "入力内容を確認してください";
      }
      onSave(parsed.output);
      return null;
    },
    null,
  );

  return (
    <div
      className={`card bg-base-100 shadow-sm card-border ${isDirty ? "border-error" : ""}`}
    >
      <div className="card-body">
        <form
          ref={formRef}
          action={formAction}
          onInput={handleInput}
          className="grid gap-2"
        >
          <label className="label">
            タスクソース
            <select
              name="source"
              className="select"
              value={source}
              onChange={handleSourceChange}
            >
              {AVAILABLE_BOARD_SOURCES.map((s) => (
                <option value={s} key={s}>
                  {SOURCE_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="label">
            バージョン
            <select
              name="version"
              className="select"
              value={version}
              onChange={(e) => setVersion(e.currentTarget.value)}
            >
              {versionOptions.map((v) => (
                <option value={v} key={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="label">
            シード値
            <input
              type="number"
              name="seed"
              className="input"
              placeholder="123456"
              defaultValue={settings.seed}
              min={0}
              required
            />
          </label>
          <SubmitButton />
        </form>
        {error ? <p className="text-xs text-error">{error}</p> : null}
      </div>
    </div>
  );
};

export const BoardForm = (): ReactNode => {
  const [boardSettings, setBoardSettings] = useAtom(boardSettingsStore);

  return (
    <BoardFormCard
      key={`${boardSettings.source}:${boardSettings.version}:${boardSettings.seed}`}
      settings={boardSettings}
      onSave={setBoardSettings}
    />
  );
};
