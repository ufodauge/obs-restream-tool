import { CheckIcon, XIcon } from "lucide-react";
import { useActionState, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import * as v from "valibot";

import {
  AVAILABLE_TYPES,
  panelTypeSchema,
  type PanelType,
} from "@/features/panels/videos/panels";
import { mergeFormDataOverDefaults } from "@/libs/form/formData";
import { useFormDirty } from "@/libs/hooks/useFormDirty";

type Props = {
  videoPanel: PanelType;
  setVideoPanel: (data: PanelType) => void;
  removeVideoPanel: () => void;
};

const SIZE_LABEL: Record<PanelType["size"], string> = { 1: "小", 2: "大" };

// 折り畳み行に出す「表示名」。subtext が空ならチャンネル/URL で代用する。
const summaryLabel = (videoPanel: PanelType): string =>
  videoPanel.subtext ||
  (videoPanel.type === "twitch" ? videoPanel.channel : videoPanel.url);

// twitch / iframe どちらのパネルにも共通するフィールド（表示名・サイズ）。
const VideoPanelCommonFields = ({ videoPanel }: { videoPanel: PanelType }) => (
  <>
    <label className="label">
      表示名
      <input
        type="text"
        name="subtext"
        className="input"
        placeholder="配信者名など"
        defaultValue={videoPanel.subtext}
      />
    </label>
    <label className="label">
      サイズ
      <input
        type="radio"
        name="size"
        value={1}
        className="radio"
        defaultChecked={videoPanel.size === 1}
      />
      小
      <input
        type="radio"
        name="size"
        value={2}
        className="radio"
        defaultChecked={videoPanel.size === 2}
      />
      大
    </label>
  </>
);

// useFormStatus は <form> の子孫コンポーネントでないと pending を取得できない
// ため、送信ボタンだけ切り出す。
const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-sm" type="submit" disabled={pending}>
      <CheckIcon />
    </button>
  );
};

// 保存済みの値（videoPanel）が変わるたびに、呼び出し元で key を変えてこの
// コンポーネントごと再マウントする。非制御フォームの defaultValue・isDirty
// のベースラインが一緒に作り直されるので、他ドックでの編集・自分の保存の
// 両方が自然に反映される（A-8）。
const VideoPanelFormCard = ({
  videoPanel,
  onSave,
  removeVideoPanel,
}: {
  videoPanel: PanelType;
  onSave: (data: PanelType) => void;
  removeVideoPanel: () => void;
}): ReactNode => {
  const formRef = useRef<HTMLFormElement>(null);
  const { isDirty, handleInput } = useFormDirty(formRef);

  const [error, formAction] = useActionState<string | null, FormData>(
    (_prevError, formData) => {
      const merged = mergeFormDataOverDefaults(videoPanel, formData, [
        "enable",
      ]);
      const parsed = v.safeParse(panelTypeSchema, merged);
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
      // min-w-0: このカードは VideoPanelForms 側の grid のアイテムになる。
      // grid item は初期値が min-width: auto（中身の min-content 分は
      // 縮まない）なので、中の flex 行を詰めても中身の最小幅がドック幅を
      // 超えたままだと grid ごと右にはみ出す（実機の 300px 幅ドックで確認
      // した不具合）。min-w-0 でこの制約を外し、実際に詰められるようにする。
      className={`card min-w-0 bg-base-100 shadow-sm card-border ${isDirty ? "border-error" : ""}`}
    >
      <form ref={formRef} action={formAction} onInput={handleInput}>
        <input type="hidden" name="id" defaultValue={videoPanel.id} />
        <select
          defaultValue={videoPanel.type}
          name="type"
          className="select"
          hidden
        >
          {AVAILABLE_TYPES.map((v) => (
            <option value={v} key={v}>
              {v}
            </option>
          ))}
        </select>
        {/*
          Phase 4: 折り畳み行（表示名 / 種別・サイズ / 有効トグル）+
          <details> で展開する詳細フォーム。<details> は閉じていても
          子要素を DOM から外さず CSS で隠すだけ（React の条件レンダリング
          と違い unmount しない）ので、閉じたまま保存しても
          channel/url/表示名/サイズが FormData から消えることはない。
          有効トグル・保存・削除は <details> の外（summary の兄弟）に
          置くことで、クリックが summary に伝播して開閉してしまう問題を
          回避しつつ、折り畳んだままでも常に操作できるようにしている。
        */}
        <div className="flex flex-wrap items-start gap-2 p-2">
          <details className="min-w-0 flex-1 basis-32">
            <summary className="cursor-pointer truncate text-sm select-none">
              {summaryLabel(videoPanel)}
              <span className="ml-2 badge badge-ghost align-middle badge-sm">
                {videoPanel.type}/{SIZE_LABEL[videoPanel.size]}
              </span>
            </summary>
            <div className="grid gap-2 pt-2">
              {videoPanel.type === "twitch" ? (
                <label className="label">
                  チャンネル
                  <input
                    type="text"
                    name="channel"
                    className="input"
                    defaultValue={videoPanel.channel}
                    required
                  />
                </label>
              ) : (
                <label className="label">
                  URL
                  <input
                    type="url"
                    name="url"
                    className="input"
                    defaultValue={videoPanel.url}
                    required
                  />
                </label>
              )}
              <VideoPanelCommonFields videoPanel={videoPanel} />
              {error ? <p className="text-xs text-error">{error}</p> : null}
            </div>
          </details>
          <input
            type="checkbox"
            name="enable"
            className="toggle toggle-sm"
            defaultChecked={videoPanel.enable}
          />
          <SubmitButton />
          <button
            className="btn btn-error btn-sm"
            type="button"
            onClick={removeVideoPanel}
          >
            <XIcon />
          </button>
        </div>
      </form>
    </div>
  );
};

export const VideoPanelForm = ({
  videoPanel,
  setVideoPanel,
  removeVideoPanel,
}: Props): ReactNode => (
  <VideoPanelFormCard
    key={JSON.stringify(videoPanel)}
    videoPanel={videoPanel}
    onSave={setVideoPanel}
    removeVideoPanel={removeVideoPanel}
  />
);
