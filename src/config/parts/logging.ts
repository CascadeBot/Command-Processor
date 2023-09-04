import { z } from 'zod';

export const loggingConfSchema = z.object({
  format: z.enum(['json', 'pretty']).default('json'),
  allowScripts: z.coerce.boolean().default(false),
});
