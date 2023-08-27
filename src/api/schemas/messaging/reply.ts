import joi from 'joi';
import { idRegex } from '@utils/regex';
import { getShardCount, sendMessageGetReply } from '@managers/rabbitmq-manager';

export const action = 'reply';

interface Reply {
  message: string;
  guildId: string;
  interactionId: string;
}

export const schema = joi.object<Reply>({
  message: joi.string().required(),
  guildId: joi.string().regex(idRegex).required(),
  interactionId: joi.string().required(),
});

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
  // TODO rabbitmq
  return '';
};