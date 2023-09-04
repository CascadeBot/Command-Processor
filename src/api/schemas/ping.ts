import { z } from 'zod';

export const action = 'ping';

export const schema = z.object({
  msg: z.string().default('pong!'),
});

export const run = async (_data: z.infer<typeof schema>) => {
  throw new Error('test');
};
