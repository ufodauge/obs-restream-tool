import { IframePanel } from "./IframePanel";
import type { SubtextPosition } from "./videos/obsSyncSettings";

export const CustomPanel = ({
  url,
  subtext,
  borderRadius,
  subtextPosition,
}: {
  url: string;
  subtext?: string;
  borderRadius?: number;
  subtextPosition?: SubtextPosition;
}) => {
  return (
    <IframePanel
      src={url}
      subtext={subtext}
      title={subtext ?? url}
      borderRadius={borderRadius}
      subtextPosition={subtextPosition}
    />
  );
};
