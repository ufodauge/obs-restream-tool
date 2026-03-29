import { useAtom } from "jotai";
import { CheckIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";

import { sceneSettingsStore } from "@/features/panels/scene/scene";

type FormProps = {
  text: string;
  background: string;
};

export const SceneSettingsForm = (): ReactNode => {
  const [panelText, setPanelText] = useAtom(sceneSettingsStore);

  const { register, handleSubmit, formState, reset } = useForm<FormProps>({
    defaultValues: {
      ...panelText,
    },
  });

  const onSubmit: SubmitHandler<FormProps> = (data) => {
    setPanelText({ ...data });
    reset({ ...data });
  };

  return (
    <div
      className={`card bg-base-100 shadow-sm card-border ${formState.isDirty ? "border-error" : ""}`}
    >
      <div className="card-body">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-flow-row-dense gap-2"
        >
          <label className="label">
            テキスト
            <input
              type="text"
              className="input"
              defaultValue={panelText.text}
              {...register("text")}
            />
          </label>
          <label className="label">
            背景
            <input
              type="url"
              className="input"
              defaultValue={panelText.background}
              {...register("background")}
            />
          </label>
          <button className="btn btn-circle" type="submit">
            <CheckIcon />
          </button>
        </form>
      </div>
    </div>
  );
};
