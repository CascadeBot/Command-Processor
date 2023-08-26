import joi from 'joi';
import { idRegex } from '@utils/regex';

export const action = 'reply';

interface Reply {
  message: string;
  guildId: string;
  interactionId: string;
}

export const schema = joi.object<Reply>({
  message: joi.string().required(),
  guildId: joi.string().regex(idRegex).required(),
  interactionId: joi.string().required(), // TODO do we use the interaction id or something else (message id)?
});

export const run = (data: Reply) => {
  console.log(data);
  // TODO rabbitmq
  return '';
};
