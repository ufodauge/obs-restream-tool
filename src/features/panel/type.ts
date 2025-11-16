import * as z from "zod";
import { v7 } from "uuid";

export const LayoutSchema = z.object({
  i: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

export type Layout = z.output<typeof LayoutSchema>;

export const LayoutListSchema = z.array(LayoutSchema);

export type LayoutList = z.output<typeof LayoutListSchema>;

const TextPanelTypeKey = z.literal("text");
const TwitchPanelTypeKey = z.literal("twitch");

const PanelTypesSchema = z.union([TextPanelTypeKey, TwitchPanelTypeKey]);

const PanelInfoBaseSchema = z.object({
  uuid: z.uuidv7(),
  visible: z.boolean(),
  static: z.boolean(),
  layout: LayoutSchema,
});

const TextPanelInfoSchema = z
  .object({
    type: TextPanelTypeKey,
    content: z.string(),
  })
  .and(PanelInfoBaseSchema);

const TwitchPanelInfoSchema = z
  .object({
    type: TwitchPanelTypeKey,
    channel: z.string(),
  })
  .and(PanelInfoBaseSchema);

const PanelInfoSchema = z.union([TextPanelInfoSchema, TwitchPanelInfoSchema]);

export const PanelInfoListSchema = z.array(PanelInfoSchema);

export type TextPanelInfo = z.output<typeof TextPanelInfoSchema>;
export type TwitchPanelInfo = z.output<typeof TwitchPanelInfoSchema>;

export type PanelType = z.output<typeof PanelTypesSchema>;
export type PanelInfo = z.output<typeof PanelInfoSchema>;

export const PanelTypes = PanelTypesSchema.options.map((v) => v.value);

export const isPanelType = (str: string): str is PanelType => {
  const parsed = PanelTypesSchema.safeParse(str);
  return parsed.success;
};

// TODO: write test
export const createDefaultPanelInfo = (type: PanelType): PanelInfo => {
  switch (type) {
    case "text":
      return {
        type: "text",
        content: "(sample text)",
        uuid: v7(),
        visible: true,
        static: false,
        layout: {
          i: v7(),
          w: 4,
          h: 3,
          x: 0,
          y: 0,
        },
      };

    case "twitch":
      return {
        type: "twitch",
        channel: "(some channel id)",
        uuid: v7(),
        visible: true,
        static: false,
        layout: {
          i: v7(),
          w: 4,
          h: 3,
          x: 0,
          y: 0,
        },
      };
  }
};

export const getPanelContentCaption = (info: PanelInfo): string => {
  return `${info.type} / ${getPanelContentDescription(info)}`;
};

export const getPanelContentDescription = (info: PanelInfo): string => {
  switch (info.type) {
    case "text":
      return info.content;

    case "twitch":
      return info.channel;
  }
};
