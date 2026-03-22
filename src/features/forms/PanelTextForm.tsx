import { useAtom } from "jotai";
import { CheckIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";

import { panelTextStore } from "@/features/panels/text/text";

type FormProps = {
  text: string;
};

export const PanelTextForm = (): ReactNode => {
  const [panelText, setPanelText] = useAtom(panelTextStore);

  const { register, handleSubmit, formState } = useForm<FormProps>();

  const onSubmit: SubmitHandler<FormProps> = (data) => {
    setPanelText(data.text);
  };

  return (
    <div
      className={`card w-96 bg-base-100 shadow-sm card-border ${formState.isDirty ? "border-error" : ""}`}
    >
      <div className="card-body">
        <form onSubmit={handleSubmit(onSubmit)}>
          <label className="label">
            テキスト
            <input
              type="text"
              className="input"
              defaultValue={panelText}
              {...register("text")}
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
