import {
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from 'react';
import GridLayout from 'react-grid-layout';

export type LayoutEditorRefProps = {
  addPanel: (panel: GridLayout.Layout) => void;
  removePanel: (panelId: string) => void;
};

type Props = {
  children: ReactNode;
  ref?: RefObject<LayoutEditorRefProps | null>;
};

export const LayoutEditorComponent = ({ children, ref }: Props) => {
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
      console.assert(refDiv.current);
      refDiv.current?.addEventListener('resize', cb);
      return () => refDiv.current?.addEventListener('resize', cb);
    },
    () => refDiv.current?.clientWidth ?? 0
  );

  return (
    <div ref={refDiv}>
      <GridLayout
        className="layout"
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
