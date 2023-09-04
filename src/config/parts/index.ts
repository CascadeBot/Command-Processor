import { z } from 'zod';
import { loggingConfSchema } from './logging';
import { rabbitMqConfSchema } from '@config/parts/rabbitMQ';

export type Config = z.infer<typeof configSchema>;

export const configSchema = z.object({
  logging: loggingConfSchema.default({}),
  rabbitMq: rabbitMqConfSchema,
});
