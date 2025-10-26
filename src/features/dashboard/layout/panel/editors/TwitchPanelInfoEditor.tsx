import type { RefObject } from "react";
import type { TwitchPanelInfo } from "../type";

type Props = {
  dialogRef: RefObject<HTMLElement | null>;
  panelInfo: TwitchPanelInfo;
};

const NAME_FIELD_CHANNEL_ID = "channel_id";

export const TwitchPanelInfoEditor = ({ panelInfo }: Props) => {
  const submitHandler = (data: FormData): void => {
    const channel_id = data.get(NAME_FIELD_CHANNEL_ID);
    if (typeof channel_id !== "string") {
      console.error(`'${channel_id}' is not string`);
      return;
    }

    console.log(channel_id);
    // dialogRef.current?.();
  };

  return (
    <form className="grid gap-2 p-3" action={submitHandler}>
      <label className="floating-label">
        <span>channel ID</span>
        <input
          type="text"
          name={NAME_FIELD_CHANNEL_ID}
          placeholder="text"
          className="input input-md"
          defaultValue={panelInfo.channel}
        />
      </label>
      <div className="grid justify-end">
        <button type="submit" className="btn btn-sm">
          更新
        </button>
      </div>
    </form>
  );
};
