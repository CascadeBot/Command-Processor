import { callApiMethod } from '@api/entrypoint';
import { scopedLogger } from '@logger';
import { getPrependScript } from '@sandboxed/prepare-scripts';
import { registerAsyncFunction, registerFunction } from '@utils/registerFunc';
import { Context } from 'isolated-vm';
import { z } from 'zod';
import { config } from '@config';

const log = scopedLogger('sandbox');
const stringSchema = z.string();

export async function createGlobalContext(ctx: Context) {
  const jail = ctx.global;
  await jail.set('global', jail.derefInto());

  if (config.logging.allowScripts) {
    // simple console log for debugging purposes
    await registerFunction(ctx, 'log', (msg: any) => {
      if (!stringSchema.safeParse(msg).success) return false;
      log.debug('SANDBOX: ' + msg);
      return true;
    });
  }

  // register api function, used as backend for api scripts
  await registerAsyncFunction(ctx, '__cascadeApi', 1, (data: any) => {
    return callApiMethod(data);
  });

  // import api scripts
  await ctx.evalClosure(getPrependScript());
}
