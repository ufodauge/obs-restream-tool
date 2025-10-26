import {
  useRef,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from "react";
import { type LayoutEditorRefProps, LayoutEditor } from "./layout/LayoutEditor";
import { PanelContainer } from "./layout/panel/PanelContainer";
import type { PanelInfo } from "./layout/panel/type";

type Props = PropsWithChildren<{
  items: PanelInfo[];
  setItems: Dispatch<SetStateAction<PanelInfo[]>>;
}>;

export const LayoutEditorContainer = ({ items }: Props) => {
  const layoutEditorRef = useRef<LayoutEditorRefProps>(null);

  return (
    <LayoutEditor ref={layoutEditorRef}>
      {items.map((item) => (
        <div key={item.uuid} className="scrollbar-none bg-base-100 shadow-md">
          <PanelContainer panelInfo={item} />
        </div>
      ))}
    </LayoutEditor>
  );
};
