const fs = require("fs");
const {Callback, Isolate} = require("isolated-vm");

let vmInstance = new Isolate({
  memoryLimit: 512,
  inspector: true,
  onCatastrophicError: (e) => {
    console.log("YEET", e)
  }
});

async function registerAsyncFunction(ctx, name, argCount, cb) {
  const argArr = (new Array(argCount)).map((_,i)=>`arg${i}`).join(",");
  return await ctx.evalClosure(
      `
    global.${name} = function ${name}(${argArr}) {
      return $0.apply(undefined, [${argArr}], { arguments: { copy: true }, result: { copy: true, promise: true } })
    }
  `,
    [cb],
    { arguments: { reference: true } },
  )
}

async function registerASyncButsyncFunction(ctx, name, argCount, cb) {
  const argArr = (new Array(argCount)).map((_,i)=>`arg${i}`).join(",");
  return await ctx.evalClosure(
      `
    global.${name} = function ${name}(${argArr}) {
      return $0.applySyncPromise(undefined, [${argArr}], { arguments: { copy: true } })
    }
  `,
    [cb],
    { arguments: { reference: true } },
  )
}

async function registerFunction(ctx, name, cb) {
  return await ctx.global.set(name, new Callback(cb));
}

async function bootstrap() {
    const script = fs.readFileSync("sandboxed.js", { 
        encoding: "utf8"
     });
    const scriptModule = await vmInstance.compileModule(script, {
        filename: "sandboxed.js"
    });

    let scriptContext = await vmInstance.createContext();
    const jail = scriptContext.global
    await jail.set('global', jail.derefInto())

    registerFunction(scriptContext, "log", (msg) => {
      console.log(msg);
    })

    registerASyncButsyncFunction(scriptContext, "wait", 0,  () => {
      console.log("starting wait()")
      return new Promise((resv) => {
        setTimeout(() => {
          console.log("ending wait()")
          resv()
        }, 5000);
      })
    })

    await scriptModule.instantiate(scriptContext, () => {
      throw new Error()
    });
    await scriptModule.evaluate();
}

bootstrap().catch(err=>console.error(err));
