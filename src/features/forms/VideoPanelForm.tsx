import { CheckIcon, XIcon } from "lucide-react";
import { type ReactNode } from "react";
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
  const { register, handleSubmit, watch, formState, reset } =
    useForm<FormProps>({
      defaultValues: videoPanel,
    });

  const onSubmit: SubmitHandler<FormProps> = (data) => {
    setVideoPanel({
      ...data,
    });
    reset({
      ...data,
    });
  };

  const [watcherPanelType, watcherEnable] = watch(["type", "enable"]);

  return (
    <div
      className={`card bg-base-100 shadow-sm card-border ${formState.isDirty ? "border-error" : ""}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-2">
        <div className="card-body p-2">
          <input type="hidden" value={videoPanel.id} {...register("id")} />
          <input
            type="checkbox"
            className="toggle"
            defaultChecked={videoPanel.enable}
            {...register("enable")}
          />
          <label>
            <select
              defaultValue={videoPanel.type}
              className="select"
              hidden
              {...register("type")}
            >
              {AVAILABLE_TYPES.map((v) => (
                <option value={v} key={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          {!watcherEnable ? (
            <p>{videoPanel.channel}</p>
          ) : watcherPanelType === "twitch" ? (
            <>
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
              <label className="label">
                サイズ
                <input
                  type="radio"
                  value={1}
                  className="radio"
                  defaultChecked={videoPanel.size === 1}
                  {...register("size")}
                />
                小
                <input
                  type="radio"
                  value={2}
                  className="radio"
                  defaultChecked={videoPanel.size === 2}
                  {...register("size")}
                />
                大
              </label>
            </>
          ) : (
            <></>
          )}
          <div className="grid grid-flow-col-dense gap-2">
            <button
              className="btn btn-sm"
              type="submit"
              disabled={!formState.isValid}
            >
              <CheckIcon />
            </button>
            <button
              className="btn btn-sm btn-error"
              type="button"
              onClick={removeVideoPanel}
            >
              <XIcon />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
