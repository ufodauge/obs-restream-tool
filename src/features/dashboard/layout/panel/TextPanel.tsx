import type { TextPanelInfo } from './type';

type Props = {
  panelInfo: TextPanelInfo;
};

export const TextPanel = ({ panelInfo }: Props) => {
  return (
    <div className="p-4 size-full overflow-auto">
      <label className="floating-label">
        <span>テキスト</span>
        <input
          className="input"
          type="text"
          name={panelInfo.uuid}
          defaultValue={panelInfo.content}
        />
      </label>
    </div>
  );
};
