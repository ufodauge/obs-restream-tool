import {
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import GridLayout from "react-grid-layout";
import { RGL_DRAGGABLE_CANCEL_CLASS_NAME } from "./layout";

export type LayoutEditorRefProps = {
  addPanel: (panel: GridLayout.Layout) => void;
  removePanel: (panelId: string) => void;
};

type Props = {
  children: ReactNode;
  ref?: RefObject<LayoutEditorRefProps | null>;
};

export const LayoutEditor = ({ children, ref }: Props) => {
  const [layout, setLayout] = useState<GridLayout.Layout[]>(() => {
    const savedLayout = undefined;
    // TODO: Zod validation
    // const savedLayout = localStorage.getItem('dashboard-layout');
    return savedLayout ? JSON.parse(savedLayout) : [];
  });

  const onLayoutChange = (newLayout: GridLayout.Layout[]) => {
    setLayout(newLayout);
  };

  useImperativeHandle(ref, () => ({
    addPanel: (panel) => setLayout((l) => [...l, panel]),
    removePanel: (panelId) =>
      setLayout((l) => l.filter((v) => v.i === panelId)),
  }));

  const refDiv = useRef<HTMLDivElement>(null);
  const width = useSyncExternalStore(
    (cb) => {
      const element = refDiv.current;
      if (element === null) {
        return () => {};
      }

      element.addEventListener("resize", cb);
      return () => element.addEventListener("resize", cb);
    },
    () => refDiv.current?.clientWidth ?? 0,
  );

  return (
    <div ref={refDiv}>
      <GridLayout
        className="layout"
        draggableCancel={`.${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
        layout={layout}
        cols={12}
        rowHeight={100}
        width={width}
        onLayoutChange={onLayoutChange}
      >
        {children}
      </GridLayout>
    </div>
  );
};
