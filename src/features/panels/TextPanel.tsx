export const TextPanel = ({
  text,
  className,
}: {
  text: string;
  className: string;
}) => (
  <div className={`grid items-baseline ${className}`}>
    <span className="font-sans text-[2cqw] text-ellipsis text-white">
      {text}
    </span>
  </div>
);
