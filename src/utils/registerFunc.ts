import { Context } from 'isolated-vm';

export async function registerAsyncFunction(
  context: Context,
  name: string,
  argCount: number,
  callback: any,
) {
  const argArgument = new Array(argCount).fill(1).map((_, i) => `arg${i}`);
  await context.evalClosure(
    `
    global.${name} = function ${name}(${argArgument}) {
      return $0.apply(undefined, [${argArgument}], { arguments: { copy: true } })
    }    
  `,
    [callback],
    { arguments: { reference: true } },
  );
}

export async function registerAsyncButSyncFunction(
  context: Context,
  name: string,
  argCount: number,
  callback: any,
) {
  const argArgument = new Array(argCount).fill(1).map((_, i) => `arg${i}`);
  await context.evalClosure(
    `
    global.${name} = function ${name}(${argArgument}) {
      return $0.applySyncPromise(undefined, [${argArgument}], { arguments: { copy: true } })
    }    
  `,
    [callback],
    { arguments: { reference: true } },
  );
}

export async function registerSyncFunction(
  context: Context,
  name: string,
  argCount: number,
  callback: any,
) {
  const argArgument = new Array(argCount).fill(1).map((_, i) => `arg${i}`);
  await context.evalClosure(
    `
    global.${name} = function ${name}(${argArgument}) {
      return $0.applySync(undefined, [${argArgument}], { arguments: { copy: true } })
    }    
  `,
    [callback],
    { arguments: { reference: true } },
  );
}
