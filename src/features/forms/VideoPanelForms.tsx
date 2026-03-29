import { useAtom } from "jotai";
import { PlusIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Modal } from "@/components/Modal";

import { videoPanelStores } from "../panels/videos/panels";
import { VideoPanelForm } from "./VideoPanelForm";

export const VideoPanelForms = () => {
  const [videoPanel, setVideoPanel] = useAtom(videoPanelStores);
  const modalRef = useRef<HTMLDialogElement>(null);
  const [onModalOk, setOnModalOk] = useState<() => void>();

  return (
    <div className="grid gap-2">
      <div className="scrollbar-thin grid h-96 gap-2 overflow-y-scroll">
        {videoPanel.map((v) => (
          <VideoPanelForm
            key={v.id}
            videoPanel={v}
            setVideoPanel={(data) => {
              setVideoPanel((panels) => {
                const result = panels.map((panel) =>
                  panel.id === data.id ? data : panel,
                );

                console.log(data, panels, result);
                return result;
              });
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
      <div className="grid p-2">
        <button
          className="btn btn-primary"
          onClick={() => {
            setVideoPanel((p) => [
              ...p,
              {
                channel: "channel_id",
                enable: false,
                id: crypto.randomUUID(),
                size: 1,
                subtext: "",
                type: "twitch",
              },
            ]);
          }}
        >
          <PlusIcon />
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
            <button className="btn btn-sm btn-error" onClick={onModalOk}>
              消す
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};
