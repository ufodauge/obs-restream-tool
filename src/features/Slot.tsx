import { useAtomValue } from "jotai";

import { CustomPanel } from "@/features/panels/CustomPanel";
import { TwitchPanel } from "@/features/panels/TwitchPanel";
import { obsSyncSettingsStore } from "@/features/panels/videos/obsSyncSettings";
import { videoPanelStores } from "@/features/panels/videos/panels";

const getSlotIndex = (): number => {
  const raw = new URLSearchParams(window.location.search).get("index");
  const parsed = raw === null ? Number.NaN : Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
};

/**
 * OBS の Browser Source 1 個 = 1 スロット。
 * ?index=N を見て、panels 配列の N 番目のパネルだけを丸ごとの画面に描画する。
 * 1 ソースに 1 iframe しか置かないのがポイント。
 *
 * A-3: 以前は selectEnabledPanels（有効なものだけ抽出・size 降順）の N 番目
 * を見ていたため、パネルを 1 つ無効化するだけで以降の全スロットの中身が
 * 1 つずつズレ、無関係な Twitch プレイヤーまで全部リロードされていた。
 * 今はスロット index = panels 配列そのままの index。無効なパネルは
 * このスロットが何も描画しない（= 対応する OBS ソース側で非表示にする）
 * だけで、他のスロットの中身・位置には影響しない。位置決め（size 降順の
 * パッキング）は obsSync.ts 側が selectEnabledPanelsWithSlotIndex を使って
 * この元 index に矩形を配り直すことで実現する。
 */
export const Slot = () => {
  const index = getSlotIndex();
  const panel = useAtomValue(videoPanelStores)[index];
  // borderRadius / subtextPosition は「OBS 側と自動同期するか」（enable）
  // とは無関係にスロット自体の見た目を決めるので、obsSyncSettingsStore の
  // enable の値に関わらず常に読む（sync.html の enable トグルをオフに
  // していても、slot.html の Browser Source 自体は OBS 上に存在し続け、
  // 見た目の設定は反映されているべきなので）。
  const { borderRadius, subtextPosition } = useAtomValue(obsSyncSettingsStore);

  if (panel === undefined || !panel.enable) {
    return null;
  }

  switch (panel.type) {
    case "twitch":
      return (
        <TwitchPanel
          channel={panel.channel}
          size={panel.size}
          subtext={panel.subtext}
          fill
          borderRadius={borderRadius}
          subtextPosition={subtextPosition}
        />
      );
    case "iframe":
      return (
        <CustomPanel
          url={panel.url}
          size={panel.size}
          subtext={panel.subtext}
          fill
          borderRadius={borderRadius}
          subtextPosition={subtextPosition}
        />
      );
    default:
      return null;
  }
};
