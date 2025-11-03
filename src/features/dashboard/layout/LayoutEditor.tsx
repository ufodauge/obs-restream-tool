import {
  useImperativeHandle,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import GridLayout from "react-grid-layout";
import { LayoutSchema, RGL_DRAGGABLE_CANCEL_CLASS_NAME } from "./layout";
import { useLocalStorage } from "../../../libs/hooks/useLocalStorage";
import { useDebouncedGridLayoutParams } from "./useLayout";

export type LayoutEditorRefProps = {
  addPanel: (panel: GridLayout.Layout) => void;
  removePanel: (panelId: string) => void;
};

type Props = {
  children: ReactNode;
  ref?: RefObject<LayoutEditorRefProps | null>;
};

export const LayoutEditor = ({ children, ref }: Props) => {
  const [layout, setLayout] = useLocalStorage(
    "dashboard-layout",
    LayoutSchema,
    [],
  );

  const onLayoutChange = (newLayout: GridLayout.Layout[]) => {
    setLayout(newLayout);
  };

  useImperativeHandle(ref, () => ({
    addPanel: (panel) => setLayout((l) => [...l, panel]),
    removePanel: (panelId) =>
      setLayout((l) => l.filter((v) => v.i === panelId)),
  }));

  const refDiv = useRef<HTMLDivElement>(null);
  const { width, height, rowHeight, gridSize } =
    useDebouncedGridLayoutParams(refDiv);

  return (
    <div ref={refDiv} className="overflow-x-scroll scrollbar-thin">
      <GridLayout
        className="layout rounded-md bg-base-200"
        style={{
          width,
          height,
        }}
        draggableCancel={`.${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
        layout={layout}
        cols={gridSize}
        resizeHandles={["ne", "nw", "se", "sw"]}
        rowHeight={rowHeight}
        margin={[0, 0]}
        verticalCompact={false}
        maxRows={gridSize}
        width={width}
        preventCollision
        isBounded
        onLayoutChange={onLayoutChange}
      >
        {children}
      </GridLayout>
    </div>
  );
};
