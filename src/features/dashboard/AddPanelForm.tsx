import { useCallback } from 'react';
import { isPanelType, type PanelType } from './layout/panel/type';

type Props = {
  onAddPanel: (w: PanelType) => void;
};

const PanelTypeLabelMap: Record<PanelType, string> = {
  text: 'テキスト',
  twitch: 'Twitch',
};

const WIDGET_TYPE_KEY = 'widget-type';

export const AddPanelForm = ({ onAddPanel: onAddPanel }: Props) => {
  const onSubmit = useCallback((data: FormData): void => {
    const widgetType = data.get(WIDGET_TYPE_KEY)?.toString();
    if (widgetType !== undefined && isPanelType(widgetType)) {
      onAddPanel(widgetType);
    }
  }, [onAddPanel]);

  return (
    <div className="p-4 bg-base-200 rounded-lg mb-4">
      <form action={onSubmit} className="flex flex-col sm:flex-row gap-2">
        <select className="select select-bordered" name={WIDGET_TYPE_KEY}>
          {Object.entries(PanelTypeLabelMap).map(([k, v]) => (
            <option value={k}>{v}</option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          パネルを追加
        </button>
      </form>
    </div>
  );
};
