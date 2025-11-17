import { DropDownIcon } from "../../components/icons/DropDownIcon";
import type { PanelType } from "./type";

type Props = {
  onAddPanel: (panelType: PanelType) => void;
};

export const AddPanelButton = ({ onAddPanel }: Props) => (
  <div className="join justify-center">
    {/* TODO: Texts */}
    <button
      className="btn join-item flex-10 btn-sm btn-primary"
      onClick={() => onAddPanel("text")}
    >
      Add
    </button>
    <button className="btn join-item btn-sm btn-primary">
      <DropDownIcon className="size-4 fill-current" />
    </button>
  </div>
);
