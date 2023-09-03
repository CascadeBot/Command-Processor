import { convertToBotEmbed, EmbedSchema } from '@api/common/embed';
import { getShardCount, sendMessageGetReply } from '@managers/rabbitmq-manager';
import { z } from 'zod';
import { idRegex } from '@utils/regex';

export const action = 'replyEmbed';

export const schema = z
  .object({
    embed: EmbedSchema,
    guildId: z.string().regex(idRegex),
    interactionId: z.string(),
  })
  .required();

type ReplyEmbed = z.infer<typeof schema>;

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
