import joi from 'joi';
import { promises as fs } from 'fs';
import path from 'path';
import { scopedLogger } from '@logger';

const log = scopedLogger('runner');

const actionPayloadSchema = joi
  .object({
    action: joi.string().required(),
    data: joi.object(),
  })
  .strict();

interface Schema {
  action: string;
  schema: joi.ObjectSchema;
  run: (data: any) => any;
}
const schemas: Record<string, Schema> = {};

export async function setupApi() {
  const files = await fs.readdir(path.join(__dirname, './schemas'), {
    withFileTypes: true,
  });
  const fileNames = files
    .filter((v) => {
      // js files are supported in production use, where ts are compiled to js
      const isCodefile = v.name.endsWith('.js') || v.name.endsWith('.ts');
      const isNormalFile = v.isFile();
      return isCodefile && isNormalFile;
    })
    .map((v) => v.name);

  const importedData = fileNames.map((name) =>
    require(path.join(__dirname, './schemas', name)),
  );
  importedData.forEach((data: Schema) => {
    schemas[data.action] = data;
  });
}

/*
 ** main entrypoint for sandboxed methods to be called
 ** all data passed into this method is untrusted
 */
export async function callApiMethod(payload: any): Promise<any> {
  const isValidPayload = actionPayloadSchema.validate(payload);
  if (isValidPayload.error)
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

  const isValidPayloadContent = schema.schema.validate(actionData);
  if (!schema)
    return {
      success: false,
      error: 'input',
      data: isValidPayloadContent.error,
    };

  try {
    // this is awaited regardless of promise or not
    const data = await schema.run(isValidPayloadContent.value);
    return {
      success: true,
      data,
    };
  } catch (err) {
    log.error('Failed to run api method: ' + schema.action, err);
    return {
      success: false,
      error: 'exec',
      data: err.message,
    };
  }
}
