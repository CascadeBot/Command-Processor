import { callApiMethod } from '@api/entrypoint';
import { scopedLogger } from '@logger';
import { getPrependScript } from '@sandboxed/prepare-scripts';
import { registerAsyncFunction, registerFunction } from '@utils/registerFunc';
import { Context } from 'isolated-vm';
import joi from 'joi';

const log = scopedLogger('sandbox');
const stringSchema = joi.string().required().strict();

export async function createGlobalContext(ctx: Context) {
  const jail = ctx.global;
  await jail.set('global', jail.derefInto());

  // simple console log for debugging purposes
  // TODO remove this function from production code
  await registerFunction(ctx, 'log', (msg: any) => {
    if (stringSchema.validate(msg).error) return false;
    log.debug('SANDBOX: ' + msg);
    return true;
  });

  // register api function, used as backend for api scripts
  await registerAsyncFunction(ctx, '__cascadeApi', 1, (data: any) => {
    return callApiMethod(data);
  });

  // import api scripts
  await ctx.evalClosure(getPrependScript());
}
