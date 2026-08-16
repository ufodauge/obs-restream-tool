import { useState, type ReactNode } from "react";

import { STORAGE_KEY_DASHBOARD_TAB } from "@/features/storage";

import { BoardForm } from "./forms/BoardForm";
import { ObsSyncForm } from "./forms/ObsSyncForm";
import { SceneSettingsForm } from "./forms/SceneSettingsForm";
import { TimerForm } from "./forms/TimerForm";
import { VideoPanelForms } from "./forms/VideoPanelForms";

// index.html?dock=<key> で個別ドックとして開ける単位。OBS の Qt ドックは
// ドック同士を重ねればブラウザ側で勝手にタブ化してくれるので、ここで持つのは
// 「タブの内訳」ではなく「別ウィンドウ/ドックとして単独表示できる塊」の方。
// タイマーも配信中に単独の小さいドックとして常時表示したいという要望が
// あったため、他の 3 つと同じく dock キーを割り当てている
// （index.html?dock=timer で単独表示できる）。
const DOCK_KEYS = ["videos", "board", "timer", "obs"] as const;
type DockKey = (typeof DOCK_KEYS)[number];

const isDockKey = (value: string | null): value is DockKey =>
  DOCK_KEYS.some((key) => key === value);

type TabDef = {
  key: DockKey;
  label: string;
  // タブ本体の内容。ドック単独表示のときもここをそのまま流用する。
  content: ReactNode;
  // 一覧系（VideoPanelForms）はドックの高さいっぱいに広がって自前で
  // スクロールしたいので、タブ側で overflow-y-auto を足すと二重スクロール
  // になる。それ以外のタブはカードを並べるだけなので、はみ出た分をここで
  // スクロールさせる。
  scrollsInternally?: boolean;
};

const TAB_DEFS: TabDef[] = [
  {
    key: "videos",
    label: "動画",
    content: <VideoPanelForms />,
    scrollsInternally: true,
  },
  {
    key: "board",
    label: "ボード",
    content: (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] content-start gap-2">
        <BoardForm />
        <SceneSettingsForm />
      </div>
    ),
  },
  {
    key: "timer",
    label: "タイマー",
    content: (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] content-start gap-2">
        <TimerForm />
      </div>
    ),
  },
  {
    key: "obs",
    label: "OBS",
    content: (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] content-start gap-2">
        <ObsSyncForm />
      </div>
    ),
  },
];

const readStoredTab = (): TabDef["key"] => {
  const stored = localStorage.getItem(STORAGE_KEY_DASHBOARD_TAB);
  return TAB_DEFS.some((tab) => tab.key === stored)
    ? (stored as TabDef["key"])
    : TAB_DEFS[0].key;
};

const TabPanel = ({ tab }: { tab: TabDef }) => (
  <div
    className={`h-full min-h-0 p-2 ${tab.scrollsInternally ? "" : "overflow-y-auto"}`}
  >
    {tab.content}
  </div>
);

/**
 * Phase 4: 単一ドックの巨大グリッドをやめ、「?dock= で単体ドック化できる
 * グループ」+「フルダッシュボードではページ内タブ」に分ける。
 * OBS の Qt ドックマネージャがドック同士のタブ化・フロート・リサイズを
 * 既に持っているので、ここに本格的なドッキング機構（flexlayout-react 等）は
 * 持ち込まない。追加依存はゼロ。
 */
export const Dashboard = (): ReactNode => {
  const dockParam = new URLSearchParams(window.location.search).get("dock");
  const dock = isDockKey(dockParam) ? dockParam : null;

  if (dock !== null) {
    const tab = TAB_DEFS.find((t) => t.key === dock);
    // isDockKey で絞っているので必ず見つかるが、念のため。
    if (tab === undefined) {
      return null;
    }
    return (
      <div className="h-screen bg-base-200">
        <TabPanel tab={tab} />
      </div>
    );
  }

  return <TabbedDashboard />;
};

/**
 * フルダッシュボード（?dock= 無し）本体。選択中タブは localStorage に
 * 保存する（A-8 と同じ理由: 別ドックからの反映は要らないが、リロード・
 * OBS 再起動をまたいで直前のタブを覚えていてほしい）。
 *
 * URL hash ではなく localStorage を選んだ理由: OBS のカスタムブラウザ
 * ドックは「起動時にドック設定へ保存された URL を開き直す」実装なので、
 * タブ切り替えで hash を書き換えても OBS 再起動後には引き継がれない
 * （設定に保存された素の index.html に戻る）。localStorage ならドックの
 * 永続 Chromium プロファイルに残るので、他の設定値（panels 等）と同じ
 * 経路で復元できる。
 */
const TabbedDashboard = (): ReactNode => {
  const [activeTab, setActiveTab] = useState<TabDef["key"]>(readStoredTab);
  const active = TAB_DEFS.find((tab) => tab.key === activeTab) ?? TAB_DEFS[0];

  return (
    <div className="grid h-screen grid-rows-[auto_1fr] bg-base-200">
      <div role="tablist" className="tabs-lift tabs px-2 pt-2 tabs-sm">
        {TAB_DEFS.map((tab) => (
          <input
            key={tab.key}
            type="radio"
            name="dashboard-tab"
            role="tab"
            className="tab"
            aria-label={tab.label}
            checked={tab.key === activeTab}
            onChange={() => {
              setActiveTab(tab.key);
              localStorage.setItem(STORAGE_KEY_DASHBOARD_TAB, tab.key);
            }}
          />
        ))}
      </div>
      <TabPanel tab={active} />
    </div>
  );
};
