import { useRef, type PropsWithChildren } from "react";
import { EditIcon } from "../../../../components/icons/EditIcon";
import { RGL_DRAGGABLE_CANCEL_CLASS_NAME } from "../layout";
import type { PanelInfo } from "./type";
import { TextPanelContent } from "./contents/TextPanelContent";
import { TwitchPanelContent } from "./contents/TwitchPanelContent";
import { TextPanelInfoEditor } from "./editors/TextPanelInfoEditor";
import { TwitchPanelInfoEditor } from "./editors/TwitchPanelInfoEditor";

type Props = PropsWithChildren<{
  panelInfo: PanelInfo;
}>;

export const PanelContainer = ({ panelInfo }: Props) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  return (
    <div className="grid size-full grid-rows-[auto_1fr] overflow-hidden p-2">
      <div className="grid justify-end">
        <button
          type="button"
          onClick={() => popoverRef.current?.showPopover()}
          className={`btn btn-circle p-1 btn-soft btn-sm btn-primary ${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
        >
          <EditIcon className="fill-current" />
        </button>
        <div
          ref={popoverRef}
          popover="auto"
          className={`m-auto rounded-md bg-base-100 backdrop:bg-black backdrop:opacity-40 ${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
        >
          {panelInfo.type === "text" ? (
            <TextPanelInfoEditor
              popoverRef={popoverRef}
              panelInfo={panelInfo}
            />
          ) : panelInfo.type === "twitch" ? (
            <TwitchPanelInfoEditor
              popoverRef={popoverRef}
              panelInfo={panelInfo}
            />
          ) : (
            <>???</>
          )}
        </div>
      </div>
      <div className="grid items-center justify-center overflow-hidden">
        {panelInfo.type === "text" ? (
          <TextPanelContent panelInfo={panelInfo} />
        ) : panelInfo.type === "twitch" ? (
          <TwitchPanelContent panelInfo={panelInfo} />
        ) : (
          <>???</>
        )}
      </div>
    </div>
  );
};
