import { z, ZodAny } from 'zod';
import { scopedLogger } from '@logger';
import { glob } from 'glob';
import { config } from '@config';

const log = scopedLogger('runner');

const actionPayloadSchema = z
  .object({
    action: z.string(),
    // partial check, first check if action payload structure is correct, specific checks later
    data: z.any(),
  })
  .strict();

interface Schema {
  action: string;
  schema: ZodAny;
  run: (data: any) => any;
}

const schemas: Record<string, Schema> = {};

export async function setupApi() {
  const globFiles = await glob([
    __dirname + '/schemas/**/*.js',
    __dirname + '/schemas/**/*.ts',
  ]);
  const importedData = globFiles.map((name) => require(name));
  importedData.forEach((data: Schema) => {
    schemas[data.action] = data;
  });
}

/*
 ** main entrypoint for sandboxed methods to be called
 ** all data passed into this method is untrusted
 */
export async function callApiMethod(payload: any): Promise<any> {
  const isValidPayload = actionPayloadSchema.safeParse(payload);
  if (isValidPayload.success === false)
    return {
      success: false,
      error: 'input',
      data: isValidPayload.error,
    };

  const action = payload.action;
  const actionData = payload.data;
  const schema = schemas[action];
  if (!schema)
    return {
      success: false,
      error: 'action',
    };

  const isValidPayloadContent = schema.schema.safeParse(actionData);
  if (isValidPayloadContent.success === false) {
    if (config.logging.allowScripts)
      log.warn('Failed validation', isValidPayloadContent.error);
    return {
      success: false,
      error: 'input',
      data: isValidPayloadContent.error,
    };
  }

  try {
    // this is awaited regardless of promise or not
    const data = await schema.run(isValidPayloadContent.data);
    return {
      success: true,
      data,
    };
  } catch (err) {
    const errorStr: Error | string =
      err instanceof Error ? err : JSON.stringify(err, null, 2);
    log.error('Failed to run api method: ' + schema.action, errorStr);
    return {
      success: false,
      error: 'exec',
      data: err.message,
    };
  }
}
