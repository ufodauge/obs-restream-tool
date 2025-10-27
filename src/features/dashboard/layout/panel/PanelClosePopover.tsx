import type { RefObject } from "react";

type Props = {
  dialogRef: RefObject<HTMLDialogElement | null>;
  onConfirmed: () => void;
};

export const PanelClosePopover = ({ dialogRef, onConfirmed }: Props) => (
  <dialog ref={dialogRef} className="modal">
    <div className="modal-box">
      <h2 className="card-title">消去しますか？</h2>
      <p>この操作はもとに戻せません。</p>
      <div className="modal-action">
        <form method="dialog" action={onConfirmed}>
          <button className="btn btn-error">Close</button>
        </form>
      </div>
    </div>
    <form method="dialog" className="modal-backdrop">
      <button>閉じる</button>
    </form>
  </dialog>
);
