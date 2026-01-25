// import {
//   createDefaultPanelInfo,
//   PanelInfoListSchema,
//   type PanelType,
// } from "./panel/type";
// import { useLocalStorage } from "../libs/hooks/useLocalStorage";
import { getBingoList, latestBingoVersion } from "oot-bingo-lists";
import { ootBingoGenerator } from "oot-bingo-generator";

export const Dashboard = () => {
  const boardEnable = true;
  const seed = 123456;
  const bingoList = getBingoList(latestBingoVersion);
  console.log(bingoList);
  const bingoBoard = ootBingoGenerator(bingoList, {
    mode: "normal",
    seed,
  });

  return (
    <div className="min-h-screen bg-base-100 p-2">
      <div className="grid gap-2">
        <div className="grid aspect-video grid-cols-13 grid-rows-13 gap-2 bg-base-200">
          <div className="col-span-8 row-span-12 grid grid-cols-subgrid grid-rows-subgrid">
            {Array.from({ length: 6 }, () => (
              <div className="col-span-4 row-span-4 rounded-md bg-base-300 shadow-xs"></div>
            ))}
          </div>
          {boardEnable ? (
            <div className="col-span-5 row-span-8 grid grid-cols-5 grid-rows-5 gap-1">
              {bingoBoard?.map(({ name, jp }) => (
                <div className="grid place-content-center rounded-md bg-base-300 shadow-xs">
                  <div
                    className={`overflow-hidden text-center text-pretty text-ellipsis`}
                  >
                    {name} ({jp})
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <></>
          )}
          <div className="col-span-9 rounded-md bg-base-300 shadow-xs">
            <div className="overflow-hidden text-nowrap text-ellipsis">
              text
            </div>
          </div>
          <div className="col-span-4 rounded-md bg-base-300 shadow-xs">
            <div className="overflow-hidden text-nowrap text-ellipsis">
              XX:XX:XX
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
