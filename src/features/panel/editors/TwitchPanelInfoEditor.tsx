import { useImperativeHandle, type RefObject } from "react";
import type { PanelInfo, TwitchPanelInfo } from "../type";
import type { PanelInfoEditorRefProps } from "./PanelInfoEditorRefProps";

type Props = {
  panelInfo: TwitchPanelInfo;
  ref: RefObject<PanelInfoEditorRefProps | null>;
};

const NAME_FIELD_CHANNEL_ID = "channel_id";

export const TwitchPanelInfoEditor = ({ panelInfo, ref }: Props) => {
  const getModifiedPanelInfo = (data: FormData): PanelInfo => {
    const channelId = data.get(NAME_FIELD_CHANNEL_ID);
    if (typeof channelId !== "string") {
      console.error(`'${channelId}' is not string`);
      // このコンポーネントに閉じたミス
      throw new Error();
    }

    return {
      ...panelInfo,
      channel: channelId,
    };
  };

  useImperativeHandle(ref, () => ({
    getModifiedPanelInfo,
  }));

  return (
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
  );
};
