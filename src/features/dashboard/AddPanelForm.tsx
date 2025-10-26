import { useCallback } from "react";
import { isPanelType, type PanelType } from "./layout/panel/type";

type Props = {
  onAddPanel: (w: PanelType) => void;
};

const panelTypeLabelMap: Record<PanelType, string> = {
  text: "テキスト",
  twitch: "Twitch",
};

const PANEL_TYPE_KEY = "panel-type";

export const AddPanelForm = ({ onAddPanel: onAddPanel }: Props) => {
  const onSubmit = useCallback(
    (data: FormData): void => {
      const panelType = data.get(PANEL_TYPE_KEY)?.toString();
      if (panelType !== undefined && isPanelType(panelType)) {
        onAddPanel(panelType);
      }
    },
    [onAddPanel],
  );

  return (
    <div className="mb-4 rounded-lg bg-base-200 p-4">
      <form
        action={onSubmit}
        className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]"
      >
        <select className="select-bordered select" name={PANEL_TYPE_KEY}>
          {Object.entries(panelTypeLabelMap).map(([key, text]) => (
            <option key={`panel-options-${key}`} value={key}>
              {text}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          パネルを追加
        </button>
      </form>
    </div>
  );
};
