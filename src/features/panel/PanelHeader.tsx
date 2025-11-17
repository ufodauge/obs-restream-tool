import { type PropsWithChildren } from "react";
import { getPanelContentCaption, type PanelInfo } from "./type";
import { RGL_DRAGGABLE_CANCEL_CLASS_NAME } from "../dashboard/layout/layout";
import { CloseIcon } from "../../components/icons/CloseIcon";
import { KeepIcon } from "../../components/icons/KeepIcon";
import { ToggleButton } from "../../components/ToggleButton";
import { AlignVerticalTopIcon } from "../../components/icons/AlignVerticalTopIcon";

type Props = PropsWithChildren<{
  panelInfo: PanelInfo;
  onCloseClick: (item: PanelInfo) => void;
  editItem: (item: PanelInfo) => void;
}>;

export const PanelHeader = ({ panelInfo, onCloseClick, editItem }: Props) => {
  return (
    <div
      className={`grid grid-cols-[1fr_auto] justify-end px-3 select-none ${panelInfo.pinned ? "" : "cursor-grab active:cursor-grabbing"}`}
    >
      <span className="overflow-hidden font-medium text-ellipsis whitespace-nowrap text-base-content/40">
        {getPanelContentCaption(panelInfo)}
      </span>
      <div className="flex gap-1">
        <ToggleButton
          iconOn={
            <AlignVerticalTopIcon
              className={`size-4 fill-current ${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
            />
          }
          iconOff={
            <AlignVerticalTopIcon
              className={`size-4 fill-current/20 ${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
            />
          }
          checked={panelInfo.alignTop}
          className={`p-1 ${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
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
              className={`size-4 fill-current ${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
            />
          }
          iconOff={
            <KeepIcon
              className={`size-4 fill-current/20 ${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
            />
          }
          checked={panelInfo.pinned}
          className={`p-1 ${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
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
