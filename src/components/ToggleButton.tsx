import { type ReactNode } from "react";

type Props = {
  iconOn: ReactNode;
  iconOff: ReactNode;
} & Omit<React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>, "type">;

export const ToggleButton = ({ iconOff, iconOn, ...rest }: Props) => {
  return (
    <label className="swap">
      <input type="checkbox" {...rest} />
      <div className="swap-on fill-current">{iconOn}</div>
      <div className="swap-off fill-current">{iconOff}</div>
    </label>
  );
};
