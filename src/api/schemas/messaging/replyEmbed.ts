import { Embed, EmbedSchema } from '@api/common/embed';

export const action = 'replyEmbed';

export const schema = EmbedSchema.required();

export const run = async (data: Embed) => {
  return 'TODO';
};
