import { useRef, type PropsWithChildren } from "react";
import type { PanelInfo } from "./type";
import type { PanelInfoEditorRefProps } from "./editors/PanelInfoEditorRefProps";
import { PanelInfoEditor } from "./editors/PanelInfoEditor";

type Props = PropsWithChildren<{
  panelInfo: PanelInfo;
  editInfo: (info: PanelInfo) => void;
  onSubmitCompleted?: (info: PanelInfo) => void;
}>;

export const PanelInfoEditForm = ({
  onSubmitCompleted,
  panelInfo,
  editInfo,
}: Props) => {
  const ref = useRef<PanelInfoEditorRefProps>(null);

  const onSubmit = (data: FormData) => {
    const newPanelInfo = ref.current?.getModifiedPanelInfo(data);
    if (!newPanelInfo) {
      console.error("ref is not bounding.");
      return;
    }

    editInfo(newPanelInfo);
    onSubmitCompleted?.(newPanelInfo);
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
