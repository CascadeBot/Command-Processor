import { z } from 'zod';
import { idRegex } from '@utils/regex';
import { getShardCount, sendMessageGetReply } from '@managers/rabbitmq-manager';

export const action = 'reply';

export const schema = z.object({
  message: z.string(),
  guildId: z.string().regex(idRegex),
  interactionId: z.string(),
});

type Reply = z.infer<typeof schema>;

export const run = async (data: Reply) => {
  const count = await getShardCount();
  const shard = Number((BigInt(data.guildId) >> 22n) % BigInt(count));
  await sendMessageGetReply(
    'channel:interaction:reply:simple',
    {
      guild_id: data.guildId,
      interaction_id: data.interactionId,
      message: data.message,
    },
    'amq.direct',
    'shard.' + shard,
  );
  // TODO return message
  return '';
};
