import { Context, Isolate, Module } from 'isolated-vm';
import { ScriptInfo } from '@models/script-info';
import { registerAsyncFunction } from '@utils/registerFunc';
import {timeout} from "@managers/isolate-manager";

interface ScriptFile {
  fileName: string;
  context: Context;
  module: Module;
  initiated: boolean;
}

interface ScriptFileContext {
  files: Map<string, ScriptFile>;
}

async function requireInContext(
  files: ScriptFileContext,
  path: string,
): Promise<ScriptFile> {
  console.log('hello world (requireing)');
  // TODO better resolving of path
  const filename = path.endsWith('.js') ? path : path + '.js';
  const script = files.files.get(filename);
  if (!script) throw new Error('The specified file was not found!');

  if (!script.initiated) {
    await script.module.instantiate(script.context, (specifier) => {
      requireInContext(files, specifier);
      return script.module;
    });
    await script.module.evaluate({
      copy: true,
    });
    script.initiated = true;
  }

  return script;
}

async function createGlobalContext(files: ScriptFileContext, ctx: Context) {
  const jail = ctx.global;
  await jail.set('global', jail.derefInto());

  await registerAsyncFunction(ctx, 'log', 1, async (msg: any) => {
    console.log(msg);
  });
}

export class IsolateInstance {
  public readonly backendInstance: Isolate;
  private readonly dispose: any;
  private readonly timeout: number;
  private readonly scriptContext: ScriptFileContext = {
    files: new Map(),
  };

  constructor(isolate: Isolate, dispose: any, timeout: number) {
    this.backendInstance = isolate;
    this.dispose = dispose;
    this.timeout = timeout;
  }

  public startCpuTime: bigint;
  private loaded = false;
  public running = false;

  public async loadScripts(scriptInfos: ScriptInfo[]) {
    for (const script of scriptInfos) {
      this.scriptContext.files.set(script.filename, {
        context: await this.backendInstance.createContext(),
        module: await this.backendInstance.compileModule(script.code, {
          filename: script.filename,
        }),
        fileName: script.filename,
        initiated: false,
      });
    }
    for (const script of this.scriptContext.files.values()) {
      await createGlobalContext(this.scriptContext, script.context);
    }
    this.loaded = true;
  }

  public async runScript(mainFile: string) {
    this.running = true;
    setTimeout(() => {
      if (this.running) {
        this.dispose(this);
      }
    }, this.timeout);
    const scriptInfo = this.scriptContext.files.get(mainFile);
    if (scriptInfo == undefined) {
      throw new Error('The specified file was not found!');
    }
    const context = await this.backendInstance.createContext();
    await createGlobalContext(this.scriptContext, context);
    await this.instantiateModule(scriptInfo.module, context);
    await scriptInfo.module.evaluate({
      copy: true,
    });
    this.dispose(this);

    this.running = false;
  }

  private async instantiateModule(module: Module, context: Context) {
    return await module.instantiate(context, async (specifier) => {
      const script = await requireInContext(this.scriptContext, specifier);
      return script.module;
    });
  }
}
