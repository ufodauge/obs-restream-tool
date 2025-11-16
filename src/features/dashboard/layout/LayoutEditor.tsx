import {
  useRef,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import GridLayout from "react-grid-layout";
import { RGL_DRAGGABLE_CANCEL_CLASS_NAME } from "./layout";
import { useDebouncedGridLayoutParams } from "./useLayout";
import type { LayoutList } from "../../panel/type";

type Props = {
  children: ReactNode;
  layoutList: LayoutList;
  setLayoutList: Dispatch<SetStateAction<LayoutList>>;
};

export const LayoutEditor = ({
  children,
  layoutList,
  setLayoutList,
}: Props) => {
  const onLayoutChange = (newLayout: GridLayout.Layout[]) => {
    setLayoutList(newLayout);
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
        layout={layoutList}
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
