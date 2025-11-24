import { type PropsWithChildren } from "react";
import { getPanelContentCaption, type PanelInfo } from "./type";
import { RGL_DRAGGABLE_CANCEL_CLASS_NAME } from "../dashboard/layout/layout";
import { CloseIcon } from "../../components/icons/CloseIcon";
import { KeepIcon } from "../../components/icons/KeepIcon";
import { ToggleButton } from "../../components/ToggleButton";
import { AlignVerticalTopIcon } from "../../components/icons/AlignVerticalTopIcon";
import { useCompactionMode } from "../../libs/store/compaction";

type Props = PropsWithChildren<{
  panelInfo: PanelInfo;
  onCloseClick: (item: PanelInfo) => void;
  editItem: (item: PanelInfo) => void;
}>;

export const PanelHeader = ({ panelInfo, onCloseClick, editItem }: Props) => {
  const compaction = useCompactionMode();

  return (
    <div
      className={`grid grid-cols-[1fr_auto] justify-end pr-1 pl-3 select-none ${panelInfo.pinned ? "" : "cursor-grab active:cursor-grabbing"}`}
    >
      <span className="overflow-hidden font-medium text-ellipsis whitespace-nowrap text-base-content/40">
        {getPanelContentCaption(panelInfo)}
      </span>
      <div className="grid grid-cols-3 gap-1">
        <ToggleButton
          iconOn={
            <AlignVerticalTopIcon
              className={`fill-primary ${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
            />
          }
          iconOff={
            <AlignVerticalTopIcon
              className={`fill-current/50 ${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
            />
          }
          checked={panelInfo.alignTop}
          className={`size-4 ${compaction.enable ? "" : "hidden"}`}
          onChange={(e) =>
            editItem({
              ...panelInfo,
              alignTop: e.currentTarget.checked,
            })
          }
        />
        <ToggleButton
          iconOn={
            <KeepIcon
              className={`fill-current ${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
            />
          }
          iconOff={
            <KeepIcon
              className={`fill-current/20 ${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
            />
          }
          checked={panelInfo.pinned}
          className={`size-4 p-1`}
          onChange={(e) =>
            editItem({
              ...panelInfo,
              pinned: e.currentTarget.checked,
            })
          }
        />
        <button
          type="button"
          onClick={() => onCloseClick(panelInfo)}
          className={`btn btn-circle p-1 btn-ghost btn-xs ${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
        >
          <CloseIcon className="fill-current" />
        </button>
      </div>
    </div>
  );
};
