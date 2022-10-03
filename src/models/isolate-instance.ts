import {Context, Isolate, Module} from "isolated-vm";
import {ScriptInfo} from "@models/script-info";
import {createContext} from "vm";
import {IsolateManager} from "@managers/isolate-manager";

export class IsolateInstance {

  public readonly backendInstance: Isolate;
  private readonly manager: IsolateManager

  constructor(isolate: Isolate, manager: IsolateManager) {
    this.backendInstance = isolate;
    this.manager = manager;
  }

  private scriptInfos: ScriptInfo[] = []

  public startCpuTime: bigint;
  private loaded: boolean = false;
  private running: boolean = false;

  public async loadScripts(scriptInfos: ScriptInfo[]) {
    for (const scriptInfo of scriptInfos) {
      scriptInfo.isolateScript = await this.backendInstance.compileModule(scriptInfo.code, {
        filename: scriptInfo.filename
      });
      this.scriptInfos.push(scriptInfo)
    }
  }

  public async runScript(mainFile: string) {
    const scriptInfo = this.scriptInfos.find(info => info.filename == mainFile);
    if (scriptInfo == undefined) {
      throw new Error("The specified file was not found!");
    }
    const context = await this.createContext()
    await this.instantiateModule(scriptInfo.isolateScript, context);
    await scriptInfo.isolateScript.evaluate({
      copy: true
    });
    this.manager.disposeOfInstance(this);
  }

  private async instantiateModule(module: Module, context: Context) {
    return await module.instantiate(context, specifier => {
      specifier = specifier.endsWith(".js") ? specifier : specifier + ".js"
      const scriptInfo = this.scriptInfos.find(info => info.filename == specifier);
      if (scriptInfo == undefined) {
        throw new Error("The specified file was not found!");
      }
      this.instantiateModule(scriptInfo.isolateScript, context);
      return scriptInfo.isolateScript;
    })
  }

  private async createContext() {
      const context = await this.backendInstance.createContext();
      const jail = context.global;
      await jail.set('global', jail.derefInto());

      await this.registerAsyncButSyncFunction(context, "require", 1, async (filename: string) => {
        const newContext = await createContext();
        filename = filename.endsWith(".js") ? filename : filename + ".js"
        const scriptInfo = this.scriptInfos.find(info => info.filename == filename);
        if (scriptInfo == undefined) {
          throw new Error("The specified file was not found!");
        }
        await this.instantiateModule(scriptInfo.isolateScript, <Context>newContext);
        const result = await scriptInfo.isolateScript.evaluate({
          copy: true
        });

        return result; // TODO cache result
      });

      return context;
  }

  private async registerAsyncFunction(context: Context, name: string, argCount: number, callback: any) {
    const argArgument = new Array(argCount).map((_, i) => `arg${i}`);
    await context.evalClosure(`
      global.${name} = function ${name}(${argArgument}) {
        return $0.apply(undefined, [${argArgument}], { arguments: { copy: true } })
      }    
    `, [callback], { arguments: { reference: true } });
  }

  private async registerAsyncButSyncFunction(context: Context, name: string, argCount: number, callback: any) {
    const argArgument = new Array(argCount).map((_, i) => `arg${i}`);
    await context.evalClosure(`
      global.${name} = function ${name}(${argArgument}) {
        return $0.applySyncPromise(undefined, [${argArgument}], { arguments: { copy: true } })
      }    
    `, [callback], { arguments: { reference: true } });
  }

}
