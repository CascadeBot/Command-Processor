import { z } from 'zod';
import { idRegex } from '@utils/regex';

export const action = 'getUserById';

export const schema = z
  .object({
    userId: z.string().regex(idRegex),
    guildId: z.string().regex(idRegex),
  })
  .required();

export const run = (_data: z.infer<typeof schema>) => {
  // TODO rabbitmq
  return 'NO';
};
