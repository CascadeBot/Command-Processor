import { convertToBotEmbed, Embed, EmbedSchema } from '@api/common/embed';
import { getShardCount, sendMessageGetReply } from '@managers/rabbitmq-manager';
import joi from 'joi';
import { idRegex } from '@utils/regex';

export const action = 'replyEmbed';

interface ReplyEmbed {
  embed: Embed;
  guildId: string;
  interactionId: string;
}

export const schema = joi
  .object<ReplyEmbed>({
    embed: EmbedSchema.required(),
    guildId: joi.string().regex(idRegex).required(),
    interactionId: joi.string().required(),
  })
  .required();

//export const schema = EmbedSchema.required();

export const run = async (data: ReplyEmbed) => {
  const botEmbed = convertToBotEmbed(data.embed);
  const message = {
    embeds: [botEmbed],
  };
  const count = await getShardCount();
  const shard = Number((BigInt(data.guildId) >> 22n) % BigInt(count));
  await sendMessageGetReply(
    'channel:interaction:reply:complex',
    {
      guild_id: data.guildId,
      interaction_id: data.interactionId,
      message: message,
    },
    'amq.direct',
    'shard.' + shard,
  );
  return 'TODO';
};
