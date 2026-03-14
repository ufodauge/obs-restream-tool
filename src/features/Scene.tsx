import { ootBingoGenerator } from "oot-bingo-generator";
import { getBingoList, latestBingoVersion } from "oot-bingo-lists";

type PanelTypeCore = {
  type: string;
  enable: boolean;
};

type PanelTypeVariants = {
  type: "twitch";
  url: string;
  subtext: string | undefined;
};

type PanelType = PanelTypeCore & PanelTypeVariants;

const panelSources: PanelType[] = [
  {
    type: "twitch",
    url: "https://www.twitch.tv/sva16162",
    subtext: "すば",
    enable: true,
  },
  {
    type: "twitch",
    url: "https://www.twitch.tv/tkc014",
    subtext: "TKC",
    enable: true,
  },
  {
    type: "twitch",
    url: "https://www.twitch.tv/tororo_vtuber",
    subtext: "猫麦とろろ",
    enable: false,
  },
  {
    type: "twitch",
    url: "https://www.twitch.tv/hayafo",
    subtext: "はやふぉ",
    enable: true,
  },
  {
    type: "twitch",
    url: "https://www.twitch.tv/takera0628",
    subtext: "takera",
    enable: false,
  },
  {
    type: "twitch",
    url: "https://www.twitch.tv/plasma_parse",
    subtext: "ぷらずま",
    enable: true,
  },
  {
    type: "twitch",
    url: "https://www.twitch.tv/tsundererar",
    subtext: "つりゃ",
    enable: true,
  },
];

const seed = Math.floor(Math.random() * 1000000);
const boardEnable = true;
const bingoList = getBingoList(latestBingoVersion);
// console.log(bingoList);
const bingoBoard = ootBingoGenerator(bingoList, {
  mode: "normal",
  seed,
});

export const Scene = () => {
  const panels = panelSources
    .values()
    .filter(({ enable }) => enable)
    .map((v, i) =>
      v.type === "twitch" ? (
        <div
          key={i}
          className="col-span-4 row-span-4 rounded-md bg-base-300 shadow-xs"
        >
          <iframe src={v.url}></iframe>
        </div>
      ) : (
        <div key={i}>unknown</div>
      ),
    );

  const board = boardEnable ? (
    <div className="@container col-start-9 -col-end-1 row-span-9 grid grid-cols-5 grid-rows-5 gap-1">
      {bingoBoard?.map(({ name }, i) => (
        <div
          key={i}
          className="grid place-content-center rounded-md bg-base-300 shadow-xs"
        >
          <div
            className={`overflow-hidden text-center text-[3cqw] text-pretty text-ellipsis`}
          >
            {name}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <></>
  );

  return (
    <div className="min-h-screen bg-base-100 p-2">
      <div className="grid gap-2">
        <div className="grid aspect-video grid-flow-row-dense grid-cols-13 grid-rows-13 gap-2 bg-base-200">
          {board}
          {panels}
          <div className="col-span-9 -row-end-1 grid items-center rounded-md bg-base-300 px-4 shadow-xs">
            <div className="overflow-hidden text-nowrap text-ellipsis">
              text
            </div>
          </div>
          <div className="col-span-4 -row-end-1 grid place-items-center rounded-md bg-base-300 px-4 shadow-xs">
            <div className="overflow-hidden font-mono text-2xl text-nowrap text-ellipsis">
              XX:XX:XX
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
