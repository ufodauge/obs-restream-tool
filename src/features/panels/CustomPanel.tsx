import { IframePanel } from "./IframePanel";
import type { SubtextPosition } from "./videos/obsSyncSettings";

export const CustomPanel = ({
  url,
  size,
  subtext,
  fill,
  borderRadius,
  subtextPosition,
}: {
  url: string;
  size: number;
  subtext?: string;
  fill?: boolean;
  borderRadius?: number;
  subtextPosition?: SubtextPosition;
}) => {
  return (
    <IframePanel
      src={url}
      size={size}
      subtext={subtext}
      fill={fill}
      title={subtext ?? url}
      borderRadius={borderRadius}
      subtextPosition={subtextPosition}
    />
  );
};
