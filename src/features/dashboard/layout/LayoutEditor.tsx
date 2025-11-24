import {
  useRef,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import GridLayout from "react-grid-layout";
import { RGL_DRAGGABLE_CANCEL_CLASS_NAME } from "./layout";
import { useDebouncedGridLayoutParams } from "./useLayout";
import { useCompactionMode } from "../../../libs/store/compaction";

type Props = {
  children: ReactNode;
  layoutList: GridLayout.Layout[];
  setLayoutList: Dispatch<SetStateAction<GridLayout.Layout[]>>;
};

const resizeHandles: GridLayout["props"]["resizeHandles"] = [
  "ne",
  "nw",
  "se",
  "sw",
  "e",
  "n",
  "s",
  "w",
];

export const LayoutEditor = ({
  children,
  layoutList,
  setLayoutList,
}: Props) => {
  const refDiv = useRef<HTMLDivElement>(null);
  // MEMO: <div style={{transform: 'scale(0.5) translate(-50%, -50%)'}}></div>
  const { width, height, rowHeight, gridSize } =
    useDebouncedGridLayoutParams(refDiv);

  const compaction = useCompactionMode();

  return (
    <div ref={refDiv} className="overflow-hidden rounded-md bg-base-200">
      <GridLayout
        className="layout overflow-hidden"
        style={{
          width,
          minHeight: height,
        }}
        draggableCancel={`.${RGL_DRAGGABLE_CANCEL_CLASS_NAME}`}
        layout={layoutList}
        cols={gridSize}
        // TODO: Custom
        // resizeHandle={(v) => <>{v}</>}
        resizeHandles={resizeHandles}
        compactType={compaction.enable ? compaction.mode : undefined}
        rowHeight={rowHeight}
        verticalCompact={true}
        margin={[0, 0]}
        maxRows={gridSize}
        width={width}
        isBounded
        onLayoutChange={setLayoutList}
      >
        {children}
      </GridLayout>
    </div>
  );
};
