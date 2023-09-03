import joi from 'joi';

export enum MessageType {
  INFO,
  SUCCESS,
  DANGER,
  WARNING,
  NEUTRAL,
}

export interface Embed {
  title?: EmbedTitle;
  content?: string;
  fields?: EmbedField[];
  author?: EmbedAuthor;
  footer?: EmbedFooter;
  thumbnail?: string;
  image?: string;
  color?: number | MessageType;
}

export interface EmbedField {
  title: string;
  inline: boolean;
  content: string;
}

export interface EmbedAuthor {
  author: string;
  url?: string;
  image?: string;
}

export interface EmbedTitle {
  title: string;
  url?: string;
}

export interface EmbedFooter {
  footer: string;
  iconUrl?: string;
  timestamp?: Date;
}

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

export const EmbedSchema = joi
  .object<Embed>({
    title: joi.object<EmbedTitle>({
      title: joi.string().max(256).required(),
      url: joi.string().uri(),
    }),
    content: joi.string().max(4096),
    fields: joi.array().items(
      joi.object<EmbedField>({
        title: joi.string().required().max(256),
        content: joi.string().required().max(1024),
        inline: joi.boolean().required(),
      }),
    ),
    author: joi.object<EmbedAuthor>({
      author: joi.string().max(256).required(),
      url: joi.string().uri(),
      image: joi.string().uri(),
    }),
    footer: joi.object<EmbedFooter>({
      footer: joi.string().max(2048).required(),
      iconUrl: joi.string().uri(),
      timestamp: joi.date(),
    }),
    thumbnail: joi.string().uri(),
    image: joi.string().uri(),
    color: joi.alternatives(
      // allow color to wither be number representation, or message type
      joi.number(),
      joi.string().valid('INFO', 'SUCCESS', 'DANGER', 'WARNING', 'NEUTRAL'),
    ),
  })
  .custom((value: Embed, helpers) => {
    if (!value.content && !value.fields) {
      return helpers.message({
        error: 'Either content or fields are required',
      });
    }
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
    if (currentLen > 6000) {
      return helpers.message({
        error: 'All embed content together exceed max length of 6000',
      });
    }
    return value;
  });
