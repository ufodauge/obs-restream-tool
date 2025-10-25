import * as z from 'zod';
import { v7 } from 'uuid';

const TextPanelTypeKey = z.literal('text');
const TwitchPanelTypeKey = z.literal('twitch');

const PanelTypesSchema = z.union([TextPanelTypeKey, TwitchPanelTypeKey]);

const PanelInfoBaseSchema = z.object({
  uuid: z.uuidv7(),
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PanelInfoSchema = z.union([TextPanelInfoSchema, TwitchPanelInfoSchema]);

export type TextPanelInfo = z.infer<typeof TextPanelInfoSchema>;
export type TwitchPanelInfo = z.infer<typeof TwitchPanelInfoSchema>;

export type PanelType = z.infer<typeof PanelTypesSchema>;
export type PanelInfo = z.infer<typeof PanelInfoSchema>;

export const PanelTypes = PanelTypesSchema.options.map((v) => v.value);

export const isPanelType = (str: string): str is PanelType => {
  const parsed = PanelTypesSchema.safeParse(str);
  return parsed.success;
};

// TODO: write test
export const createDefaultPanelInfo = (type: PanelType): PanelInfo => {
  switch (type) {
    case 'text':
      return {
        type: 'text',
        content: 'text',
        uuid: v7(),
      };

    case 'twitch':
      return {
        type: 'twitch',
        channel: 'ajakany',
        uuid: v7(),
      };
  }
};
