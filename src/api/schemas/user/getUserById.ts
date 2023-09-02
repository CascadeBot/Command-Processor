import joi from 'joi';
import { idRegex } from '@utils/regex';

export const action = 'getUserById';

interface GetUserById {
  userId: string;
  guildId: string;
}

export const schema = joi
  .object<GetUserById>({
    userId: joi.string().regex(idRegex).required(),
    guildId: joi.string().regex(idRegex).required(),
  })
  .required();

export const run = (data: GetUserById) => {
  // TODO rabbitmq
  return 'NO';
};
