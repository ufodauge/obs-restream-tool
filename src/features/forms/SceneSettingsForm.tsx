import { useAtom } from "jotai";
import { CheckIcon } from "lucide-react";
import { useActionState, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import * as v from "valibot";

import {
  sceneSettingsSchema,
  sceneSettingsStore,
  type SceneSettings,
} from "@/features/panels/scene/scene";
import { useFormDirty } from "@/libs/hooks/useFormDirty";

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-circle" type="submit" disabled={pending}>
      <CheckIcon />
    </button>
  );
};

// BoardForm と同じ理由で、保存済みの値が変わるたびに key で再マウントする
// （A-8 / isDirty ベースラインの作り直し）。
const SceneSettingsFormCard = ({
  panelText,
  onSave,
}: {
  panelText: SceneSettings;
  onSave: (data: SceneSettings) => void;
}): ReactNode => {
  const formRef = useRef<HTMLFormElement>(null);
  const { isDirty, handleInput } = useFormDirty(formRef);

  const [error, formAction] = useActionState<string | null, FormData>(
    (_prevError, formData) => {
      const parsed = v.safeParse(sceneSettingsSchema, {
        text: formData.get("text"),
        background: formData.get("background"),
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
          className="grid grid-flow-row-dense gap-2"
        >
          <label className="label">
            テキスト
            <input
              type="text"
              name="text"
              className="input"
              defaultValue={panelText.text}
            />
          </label>
          <label className="label">
            背景
            <input
              type="url"
              name="background"
              className="input"
              defaultValue={panelText.background}
            />
          </label>
          <SubmitButton />
        </form>
        {error ? <p className="text-xs text-error">{error}</p> : null}
      </div>
    </div>
  );
};

export const SceneSettingsForm = (): ReactNode => {
  const [panelText, setPanelText] = useAtom(sceneSettingsStore);

  return (
    <SceneSettingsFormCard
      key={JSON.stringify([panelText.text, panelText.background])}
      panelText={panelText}
      onSave={setPanelText}
    />
  );
};
