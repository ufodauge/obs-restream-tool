import { useAtom } from "jotai";
import { PlusIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Modal } from "@/components/Modal";
import { randomId } from "@/libs/id/randomId";

import { type PanelType, videoPanelStores } from "../panels/videos/panels";
import { VideoPanelForm } from "./VideoPanelForm";

const createDefaultPanel = (type: PanelType["type"]): PanelType => {
  const base = {
    enable: false,
    id: randomId(),
    size: 1 as const,
    subtext: "",
  };

  return type === "twitch"
    ? { ...base, type, channel: "channel_id" }
    : { ...base, type, url: "https://example.com" };
};

export const VideoPanelForms = () => {
  const [videoPanel, setVideoPanel] = useAtom(videoPanelStores);
  const modalRef = useRef<HTMLDialogElement>(null);
  const [onModalOk, setOnModalOk] = useState<() => void>();

  return (
    <div className="grid h-full min-h-0 grid-rows-[1fr_auto] gap-2">
      {/*
        Phase 4: 固定 h-96 をやめ、親（ドックの高さ）に追従させる。
        grid-rows-[1fr_auto] で「一覧（伸縮）+ 追加ボタン列（内容ぶんの高さ）」
        に分け、一覧側だけ min-h-0 を効かせてスクロールさせる（min-h-0 が
        無いと grid item は内容の高さを最小サイズにしてしまい、親の高さで
        頭打ちにならず overflow-y-scroll が効かない）。
      */}
      <div className="grid min-h-0 scrollbar-thin auto-rows-min gap-2 overflow-y-scroll">
        {videoPanel.map((v) => (
          <VideoPanelForm
            key={v.id}
            videoPanel={v}
            setVideoPanel={(data) => {
              setVideoPanel((panels) =>
                panels.map((panel) => (panel.id === data.id ? data : panel)),
              );
            }}
            removeVideoPanel={() => {
              setOnModalOk(() => () => {
                setVideoPanel((panels) =>
                  panels.filter((panel) => panel.id !== v.id),
                );
                modalRef.current?.close();
              });
              modalRef.current?.showModal();
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 p-2">
        <button
          className="btn btn-primary"
          onClick={() => {
            setVideoPanel((p) => [...p, createDefaultPanel("twitch")]);
          }}
        >
          <PlusIcon /> Twitch
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            setVideoPanel((p) => [...p, createDefaultPanel("iframe")]);
          }}
        >
          <PlusIcon /> iframe
        </button>
        <Modal ref={modalRef} backdrop>
          <div className="p-6">
            <p>本当に削除しますか？</p>
          </div>
          <div className="grid grid-flow-col-dense gap-2">
            <button
              className="btn btn-sm"
              onClick={() => modalRef.current?.close()}
            >
              キャンセル
            </button>
            <button className="btn btn-error btn-sm" onClick={onModalOk}>
              消す
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};
