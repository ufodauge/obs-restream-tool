import { useRef, type PropsWithChildren, type RefObject } from "react";
import type { PanelInfo } from "./type";
import type { PanelInfoEditorRefProps } from "./editors/PanelInfoEditorRefProps";
import { PanelInfoEditor } from "./editors/PanelInfoEditor";

type Props = PropsWithChildren<{
  panelInfo: PanelInfo;
  dialogRef: RefObject<HTMLDialogElement | null>;
  editInfo: (info: PanelInfo) => void;
}>;

export const PanelInfoEditForm = ({
  dialogRef,
  panelInfo,
  editInfo,
}: Props) => {
  const ref = useRef<PanelInfoEditorRefProps>(null);

  const onSubmit = (data: FormData) => {
    const newPanelInfo = ref.current?.getModifiedPanelInfo(data);
    if (!newPanelInfo) {
      console.error("ref is not bound.");
      return;
    }

    editInfo(newPanelInfo);
    dialogRef.current?.close();
  };

  return (
    <form className="grid gap-2 p-3" action={onSubmit}>
      <PanelInfoEditor panelInfo={panelInfo} ref={ref} />
      <div className="grid justify-end">
        <button type="submit" className="btn btn-sm">
          更新
        </button>
      </div>
    </form>
  );
};
