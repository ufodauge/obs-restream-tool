import * as z from "zod";

export const RGL_DRAGGABLE_CANCEL_CLASS_NAME = "rgl-draggable-cancel";
export const RGL_DRAGGABLE_CANCEL_CLASS_NAME_BACKDROP =
  "backdrop:rgl-draggable-cancel";

export const LayoutSchema = z.array(
  z.object({
    i: z.string(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
);

export type Layout = z.output<typeof LayoutSchema>;
