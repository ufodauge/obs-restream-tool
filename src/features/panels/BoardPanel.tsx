import { Suspense, use, useMemo } from "react";

const BoardPanelBody = ({ cells }: { cells: Promise<string | undefined> }) => {
  const c = use(cells);

  console.log(c);

  return (
    <iframe
      src="https://ootbingo.github.io/bingo/board-popout.html?version=10.5.1&seed=771575&mode=normal"
      className="rounded-[.3cqw]"
      width="100%"
      height="100%"
    />
  );
};

export const BoardPanel = ({ className }: { className: string }) => {
  const cells = useMemo(async () => {
    const page = await fetch(
      "https://ootbingo.github.io/bingo/board-popout.html?version=10.5.1&seed=771575&mode=normal",
    );

    if (!page.ok) {
      return undefined;
    }

    const text = await page.text();
    console.log(text);

    return text;
  }, []);

  return (
    <div className={`${className} grid rounded-[.3cqw]`}>
      <Suspense fallback={"loading"}>
        <BoardPanelBody cells={cells} />
      </Suspense>
    </div>
  );
};
