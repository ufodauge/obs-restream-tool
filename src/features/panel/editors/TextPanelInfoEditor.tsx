import { useImperativeHandle, type RefObject } from "react";
import type { PanelInfo, TextPanelInfo } from "../type";
import type { PanelInfoEditorRefProps } from "./PanelInfoEditorRefProps";

type Props = {
  panelInfo: TextPanelInfo;
  ref: RefObject<PanelInfoEditorRefProps | null>;
};

const NAME_FIELD_CONTENT = "content";

export const TextPanelInfoEditor = ({ panelInfo, ref }: Props) => {
  const getModifiedPanelInfo = (data: FormData): PanelInfo => {
    const content = data.get(NAME_FIELD_CONTENT);
    if (typeof content !== "string") {
      console.error(`'${content}' is not string`);
      // このコンポーネントに閉じたミス
      throw new Error();
    }

    return {
      ...panelInfo,
      content,
    };
  };

  useImperativeHandle(ref, () => ({
    getModifiedPanelInfo,
  }));

  return (
    <label className="floating-label">
      <span>text</span>
      <input
        type="text"
        name={NAME_FIELD_CONTENT}
        placeholder="text"
        className="input input-md"
        defaultValue={panelInfo.content}
      />
    </label>
  );
};
