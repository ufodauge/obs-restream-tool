type Props = {
  onConfirmed: () => void;
};

export const PanelClosePopover = ({ onConfirmed }: Props) => (
  <>
    <h2 className="card-title">消去しますか？</h2>
    <p>この操作はもとに戻せません。</p>
    <div className="modal-action">
      <form action={onConfirmed}>
        <button className="btn btn-error">Close</button>
      </form>
    </div>
  </>
);
