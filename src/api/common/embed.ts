import joi from 'joi';

export interface Embed {
  title?: EmbedTitle;
  content?: string;
  fields?: EmbedField[];
  author?: EmbedAuthor;
  provider?: EmbedProver;
  footer?: EmbedFooter;
  thumbnail?: string;
  image?: string;
  color?: number;
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
  url?: string;
  timestamp?: Date;
}

export interface EmbedProver {
  provider: string;
  url?: string;
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
    provider: joi.object<EmbedProver>({
      provider: joi.string().required(),
      url: joi.string().uri(),
    }),
    footer: joi.object<EmbedFooter>({
      footer: joi.string().max(2048).required(),
      url: joi.string().uri(),
      timestamp: joi.date(),
    }),
    thumbnail: joi.string().uri(),
    image: joi.string().uri(),
    color: joi.number(),
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
    if (value.provider) {
      currentLen += value.provider.provider.length;
    }
    if (value.footer) {
      currentLen += value.footer.footer.length;
    }
    if (currentLen > 6000) {
      return helpers.message({
        error: 'All embed content together exceed max length of 6000',
      });
    }
  });
