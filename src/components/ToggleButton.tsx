import { type ReactNode } from "react";

type Props = {
  iconOn: ReactNode;
  iconOff: ReactNode;
  rotate?: boolean;
} & Omit<
  React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >,
  "type"
>;

export const ToggleButton = ({ iconOff, iconOn, rotate, ...rest }: Props) => {
  return (
    <label
      className={`swap ${rotate ? "swap-rotate" : ""} ${rest.disabled ? "cursor-auto" : ""}`}
    >
      <input type="checkbox" {...rest} />
      <div className="swap-on">{iconOn}</div>
      <div className="swap-off">{iconOff}</div>
    </label>
  );
};
