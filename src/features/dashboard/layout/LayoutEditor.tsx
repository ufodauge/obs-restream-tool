import {
  useRef,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import GridLayout from "react-grid-layout";
import { RGL_DRAGGABLE_CANCEL_CLASS_NAME, type Layout } from "./layout";
import { useDebouncedGridLayoutParams } from "./useLayout";

export type LayoutEditorRefProps = {
  addPanel: (panel: GridLayout.Layout) => void;
  removePanel: (panelId: string) => void;
};

type Props = {
  children: ReactNode;
  layout: Layout;
  setLayout: Dispatch<SetStateAction<Layout>>;
};

export const LayoutEditor = ({ children, layout, setLayout }: Props) => {
  const onLayoutChange = (newLayout: GridLayout.Layout[]) => {
    setLayout(newLayout);
  };

  const refDiv = useRef<HTMLDivElement>(null);
  const { width, height, rowHeight, gridSize } =
    useDebouncedGridLayoutParams(refDiv);

  return (
    <div ref={refDiv} className="overflow-x-hidden rounded-md bg-base-200">
      <GridLayout
        className="layout"
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
