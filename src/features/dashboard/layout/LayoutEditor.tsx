import {
  useRef,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from 'react';
import { TextPanel } from './panel/TextPanel';
import { TwitchPanel } from './panel/TwitchPanel';
import type { PanelInfo } from './panel/type';
import {
  LayoutEditorComponent,
  type LayoutEditorRefProps,
} from './LayoutEditorComponent';

type Props = PropsWithChildren<{
  items: PanelInfo[];
  setItems: Dispatch<SetStateAction<PanelInfo[]>>;
}>;

export const LayoutEditor = ({ items, setItems }: Props) => {
  const layoutEditorRef = useRef<LayoutEditorRefProps>(null);

  const handleRemovePanel = (panelInfo: PanelInfo) => {
    setItems(items.filter((item) => item.uuid !== panelInfo.uuid));
    layoutEditorRef.current?.removePanel(panelInfo.uuid);
  };

  return (
    <LayoutEditorComponent ref={layoutEditorRef}>
      {items.map((item) => (
        <div
          key={item.uuid}
          className="card bg-base-100 shadow-xl overflow-hidden"
        >
          <div className="card-body p-0 h-full">
            {item.type === 'text' ? (
              <TextPanel panelInfo={item} />
            ) : item.type === 'twitch' ? (
              <TwitchPanel panelInfo={item} />
            ) : (
              <>????</>
            )}
            <button
              className="btn btn-xs btn-circle absolute top-2 right-2"
              onClick={() => handleRemovePanel(item)}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </LayoutEditorComponent>
  );
};
