import { z } from 'zod';
import { pathRegex } from '@utils/regex';

// TODO optional types?
export const rabbitMqConfSchema = z.union([
  z.object({
    type: z.literal('connectionString').default('connectionString'),
    connectionString: z.string().url(), // TODO check scheme
  }),
  z.object({
    type: z.literal('individual').default('individual'),
    username: z.string(),
    password: z.string(),
    hostname: z.string(), // TODO hostname
    port: z.coerce.number().default(5672),
    virtualHost: z.string().regex(pathRegex).default('/'),
  }),
]);
