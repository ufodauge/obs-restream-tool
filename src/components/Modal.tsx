import type { PropsWithChildren, RefObject } from "react";
import { createPortal } from "react-dom";

type Props = PropsWithChildren<{
  ref: RefObject<HTMLDialogElement | null>;
  backdrop?: boolean;
  className?: string;
  onClose?: () => void;
}>;

export const Modal = ({
  backdrop,
  ref,
  className,
  children,
  onClose,
}: Props) => createPortal(
  <dialog ref={ref} className={`modal ${className}`}>
    <div className="modal-box">{children}</div>
    <form
      method="dialog"
      className={`${backdrop ? "modal-backdrop" : ""}`}
      onSubmit={onClose}
    >
      <button>閉じる</button>
    </form>
  </dialog>,
  document.body
);
