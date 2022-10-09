import { Context, Isolate, Module } from 'isolated-vm';
import { ScriptInfo } from '@models/script-info';
import { createGlobalContext } from './setup-context';

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

export class IsolateInstance {
  public readonly backendInstance: Isolate;
  private readonly dispose: (instance: IsolateInstance) => void;
  private readonly instanceId: string;
  private readonly timeout: number;
  private readonly scriptContext: ScriptFileContext = {
    files: new Map(),
  };

  constructor(
    id: string,
    isolate: Isolate,
    dispose: (instance: IsolateInstance) => void,
    timeout: number,
  ) {
    this.instanceId = id;
    this.backendInstance = isolate;
    this.dispose = dispose;
    this.timeout = timeout;
  }

  get id() {
    return this.instanceId;
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
      await createGlobalContext(script.context);
    }
    this.loaded = true;
  }

  public async runScript(mainFile: string) {
    this.running = true;
    try {
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
      await createGlobalContext(context);
      await this.instantiateModule(scriptInfo.module, context);
      await scriptInfo.module.evaluate({
        copy: true,
      });
    } catch (err) {
      console.error('failed to run script:', err);
    } finally {
      this.dispose(this);
      this.running = false;
    }
  }

  private async instantiateModule(module: Module, context: Context) {
    return await module.instantiate(context, async (specifier) => {
      const script = await requireInContext(this.scriptContext, specifier);
      return script.module;
    });
  }
}
