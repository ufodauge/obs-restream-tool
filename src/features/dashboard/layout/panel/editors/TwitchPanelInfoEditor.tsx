import type { RefObject } from "react";
import type { PanelInfo, TwitchPanelInfo } from "../type";

type Props = {
  dialogRef: RefObject<HTMLDialogElement | null>;
  panelInfo: TwitchPanelInfo;
  editInfo: (info: PanelInfo) => void;
};

const NAME_FIELD_CHANNEL_ID = "channel_id";

export const TwitchPanelInfoEditor = ({
  panelInfo,
  dialogRef,
  editInfo,
}: Props) => {
  const submitHandler = (data: FormData): void => {
    const channelId = data.get(NAME_FIELD_CHANNEL_ID);
    if (typeof channelId !== "string") {
      console.error(`'${channelId}' is not string`);
      return;
    }

    editInfo({
      ...panelInfo,
      channel: channelId,
    });
    dialogRef.current?.close();
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
