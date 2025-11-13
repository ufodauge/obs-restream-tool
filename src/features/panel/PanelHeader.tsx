import { type PropsWithChildren } from "react";
import { getPanelContentCaption, type PanelInfo } from "./type";
import { RGL_DRAGGABLE_CANCEL_CLASS_NAME } from "../dashboard/layout/layout";
import { CloseIcon } from "../../components/icons/CloseIcon";

type Props = PropsWithChildren<{
  panelInfo: PanelInfo;
  onCloseClick: (item: PanelInfo) => void;
}>;

export const PanelHeader = ({ panelInfo, onCloseClick }: Props) => {
  return (
    <div className="grid cursor-grab grid-cols-[1fr_auto] justify-end px-3 select-none active:cursor-grabbing">
      <span className="overflow-hidden font-medium text-ellipsis whitespace-nowrap text-base-content/40">
        {getPanelContentCaption(panelInfo)}
      </span>
      <button
        type="button"
        onClick={() => onCloseClick(panelInfo)}
        className={`btn btn-circle p-1 btn-ghost btn-xs ${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
      >
        <CloseIcon className="fill-current" />
      </button>
    </div>
  );
};
