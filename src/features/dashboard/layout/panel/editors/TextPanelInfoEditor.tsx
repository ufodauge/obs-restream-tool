import type { RefObject } from "react";
import type { TextPanelInfo } from "../type";

type Props = {
  dialogRef: RefObject<HTMLDialogElement | null>;
  panelInfo: TextPanelInfo;
};

const NAME_FIELD_CONTENT = "content";

export const TextPanelInfoEditor = ({ panelInfo, dialogRef }: Props) => {
  const submitHandler = (data: FormData): void => {
    const content = data.get(NAME_FIELD_CONTENT);
    if (typeof content !== "string") {
      console.error(`'${content}' is not string`);
      return;
    }

    console.log(content);
    dialogRef.current?.close();
  };

  return (
    <form className="grid gap-2 p-3" action={submitHandler}>
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
      <div className="grid justify-end">
        <button type="submit" className="btn btn-sm">
          更新
        </button>
      </div>
    </form>
  );
};
