import { RequiredKeysOf } from 'type-fest';
import { z } from 'zod';

export const messageType = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  DANGER: 'DANGER',
  WARNING: 'WARNING',
  NEUTRAL: 'NEUTRAL',
} as const;

export type MessageType = RequiredKeysOf<typeof messageType>;

const colorSchema = z.number().or(z.nativeEnum(messageType));

const embedFieldSchema = z.object({
  title: z.string().max(256),
  content: z.string().max(1024),
  inline: z.boolean(),
});

const embedAuthorSchema = z.object({
  author: z.string().max(256),
  url: z.string().url().optional(),
  image: z.string().url().optional(),
});

const embedTitleSchema = z.object({
  title: z.string().max(256),
  url: z.string().url().optional(),
});

const embedFooterSchema = z.object({
  footer: z.string().max(2048),
  iconUrl: z.string().url().optional(),
  timestamp: z.date().optional(),
});

export const EmbedSchema = z
  .object({
    title: embedTitleSchema,
    content: z.string().max(4096),
    fields: z.array(embedFieldSchema),
    author: embedAuthorSchema,
    footer: embedFooterSchema,
    thumbnail: z.string().url(),
    image: z.string().url(),
    color: colorSchema,
  })
  .partial()
  .refine(
    (value) => value.content || value.fields,
    'Either content or fields are required',
  )
  .refine((value) => {
    let currentLen = 0;
    if (value.fields) {
      for (const field of value.fields) {
        currentLen += field.title.length + field.content.length;
      }
    }
    if (value.title) {
      currentLen += value.title.title.length;
    }
    if (value.content) {
      currentLen += value.content.length;
    }
    if (value.author) {
      currentLen += value.author.author.length;
    }
    if (value.footer) {
      currentLen += value.footer.footer.length;
    }

    return currentLen <= 6000;
  }, 'All embed content together exceed max length of 6000');

type Embed = z.infer<typeof EmbedSchema>;

export function convertToBotEmbed(embed: Embed) {
  const botEmbed = {
    description: embed.content,
    image: embed.image,
    thumbnail: embed.thumbnail,
    title: undefined,
    url: undefined,
    timestamp: undefined,
    footer: undefined,
    fields: undefined,
    author: undefined,
    color: undefined,
    message_type: undefined,
  };
  if (embed.title) {
    botEmbed.title = embed.title.title;
    botEmbed.url = embed.title.url;
  }
  if (embed.footer) {
    if (embed.footer.timestamp) {
      botEmbed.timestamp = embed.footer.timestamp;
    }
    if (embed.footer.footer) {
      botEmbed.footer = {};
      botEmbed.footer.text = embed.footer.footer;
      botEmbed.footer.icon_url = embed.footer.iconUrl;
    }
  }
  if (embed.fields) {
    botEmbed.fields = [];
    for (const field of embed.fields) {
      botEmbed.fields.push({
        name: field.title,
        value: field.content,
        inline: field.inline,
      });
    }
  }
  if (embed.author) {
    botEmbed.author = {};
    botEmbed.author.name = embed.author.author;
    botEmbed.author.url = embed.author.url;
    botEmbed.author.icon_url = embed.author.image;
  }
  if (embed.color) {
    if (typeof embed.color == 'number') {
      botEmbed.color = embed.color;
    } else {
      botEmbed.message_type = botEmbed.color;
    }
  }
  return botEmbed;
}
