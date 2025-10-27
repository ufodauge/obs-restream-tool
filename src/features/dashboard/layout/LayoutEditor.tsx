import {
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import GridLayout from "react-grid-layout";
import { LayoutSchema, RGL_DRAGGABLE_CANCEL_CLASS_NAME } from "./layout";
import { tryParseJson } from "../../../libs/json/json";

const aspectVideo = 9 / 16;
const gridSize = 12;

export type LayoutEditorRefProps = {
  addPanel: (panel: GridLayout.Layout) => void;
  removePanel: (panelId: string) => void;
};

type Props = {
  children: ReactNode;
  ref?: RefObject<LayoutEditorRefProps | null>;
};

export const LayoutEditor = ({ children, ref }: Props) => {
  // TODO: useSyncExternalStore
  const [layout, setLayout] = useState<GridLayout.Layout[]>(() => {
    const savedLayoutString = localStorage.getItem("dashboard-layout");
    if (savedLayoutString === null) {
      return [];
    }
    // TODO: Zod validation
    return tryParseJson(savedLayoutString, LayoutSchema).unwrapOr([]);
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
      document.addEventListener("resize", cb);
      return () => document.addEventListener("resize", cb);
    },
    () => Math.floor(refDiv.current?.clientWidth ?? 0),
  );

  const height = Math.floor(width * aspectVideo);
  const rowHeight = Math.floor(height / gridSize);
  // const rowWidth = Math.floor(width / gridSize);

  return (
    <div ref={refDiv}>
      <GridLayout
        className="layout rounded-md bg-base-200"
        style={{
          width,
          height,
          // `linear-gradient( 0deg, transparent ${rowWidth - 1}px,  #333 ${rowWidth}px),` +
          // `linear-gradient(90deg, transparent ${rowHeight - 1}px, #333 ${rowHeight}px)`,
          // backgroundSize: `${rowWidth}px ${rowHeight}px`,
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
