import { useAtom } from "jotai";
import { CheckIcon } from "lucide-react";
import { latestBingoVersion } from "oot-bingo-lists";
import type { ReactNode } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";

import { boardSettingsStore } from "../panels/board/settings";

type FormProps = {
  seed: number;
};

export const BoardForm = (): ReactNode => {
  const [boardSettings, setBoardSettings] = useAtom(boardSettingsStore);

  const { register, handleSubmit, formState } = useForm<FormProps>();

  const onSubmit: SubmitHandler<FormProps> = (data) => {
    setBoardSettings({
      seed: data.seed,
      version: latestBingoVersion,
    });
  };

  return (
    <div
      className={`card w-96 bg-base-100 shadow-sm card-border ${formState.isDirty ? "border-error" : ""}`}
    >
      <div className="card-body">
        <form onSubmit={handleSubmit(onSubmit)}>
          <label className="label">
            シード値
            <input
              type="number"
              className="input"
              placeholder="123456"
              defaultValue={boardSettings.seed}
              {...register("seed", {
                min: 0,
                valueAsNumber: true,
                required: true,
              })}
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
