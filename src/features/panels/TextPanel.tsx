type Props = {
  text: string;
  className: string;
};

export const TextPanel = ({ text, className }: Props) => {
  return (
    <div className={`grid items-baseline ${className}`}>
      <span className="font-sans text-[2cqw] text-ellipsis text-neutral-content">
        {text}
      </span>
    </div>
  );
};
