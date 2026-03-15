export const TimerPanel = ({ className }: { className: string }) => (
  <div className={`grid place-items-center ${className}`}>
    <span className="font-mono text-[2cqw] text-ellipsis text-white">
      12:34:56
    </span>
  </div>
);
