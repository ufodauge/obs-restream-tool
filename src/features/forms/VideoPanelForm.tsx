import { CheckIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";

import {
  AVAILABLE_TYPES,
  type PanelType,
} from "@/features/panels/videos/panels";

type FormProps = PanelType;

type Props = {
  videoPanel: PanelType;
  setVideoPanel: (data: PanelType) => void;
  removeVideoPanel: () => void;
};

export const VideoPanelForm = ({
  videoPanel,
  setVideoPanel,
  removeVideoPanel,
}: Props): ReactNode => {
  const { register, handleSubmit, formState } = useForm<FormProps>();

  const onSubmit: SubmitHandler<FormProps> = (data) => {
    setVideoPanel({
      ...data,
      id: videoPanel.id,
    });
  };

  return (
    <div
      className={`card w-96 bg-base-100 shadow-sm card-border ${formState.isDirty ? "border-error" : ""}`}
    >
      <div className="card-body">
        <form onSubmit={handleSubmit(onSubmit)}>
          <button
            className="btn btn-circle btn-error"
            type="button"
            onClick={removeVideoPanel}
          >
            <XIcon />
          </button>
          <input
            type="checkbox"
            className="toggle"
            defaultChecked={videoPanel.enable}
            {...register("enable")}
          />
          <label className="label">
            チャンネル
            <input
              type="text"
              className="input"
              defaultValue={videoPanel.channel}
              {...register("channel")}
            />
          </label>
          <label className="label">
            サブテキスト
            <input
              type="text"
              className="input"
              defaultValue={videoPanel.subtext}
              {...register("subtext")}
            />
          </label>
          <select
            defaultValue={videoPanel.type}
            className="select"
            {...register("type")}
          >
            {AVAILABLE_TYPES.map((v) => (
              <option value={v} key={v}>
                {v}
              </option>
            ))}
          </select>
          <select
            defaultValue={videoPanel.size}
            className="select"
            {...register("size")}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
          <button
            className="btn btn-circle"
            type="submit"
            disabled={!formState.isValid}
          >
            <CheckIcon />
          </button>
        </form>
      </div>
    </div>
  );
};
