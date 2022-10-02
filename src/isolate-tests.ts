import { Callback, Isolate } from 'isolated-vm';
import { ScriptInfo } from './models/script-info';
import fs from 'fs';

const vmInstance = new Isolate({
  memoryLimit: 512,
  inspector: true,
  onCatastrophicError: handleError,
});

let startTime = 0n;

async function doTests() {
  const scriptInfoArray: ScriptInfo[] = [
    {
      code: fs.readFileSync('example/file1.js', 'utf-8'),
      filename: 'file1.js',
    },
    {
      code: fs.readFileSync('example/file2.js', 'utf-8'),
      filename: 'file2.js',
    },
  ];
  for (const scriptInfoIndex in scriptInfoArray) {
    const scriptInfo = scriptInfoArray[scriptInfoIndex];
    scriptInfo.isolateScript = await vmInstance.compileModule(scriptInfo.code, {
      filename: scriptInfo.filename,
    });
  }
  const context = await vmInstance.createContext({ inspector: true });
  const jail = context.global;
  await jail.set('global', jail.derefInto());

  await context.global.set(
    'require',
    new Callback(function (fileName: string) {
      console.log('require function called for file ' + fileName);
      const newContext = vmInstance.createContextSync({ inspector: true });
      newContext.global.setSync(
        'log',
        new Callback(function (message: string) {
          console.log(message);
        }),
      );
      fileName = fileName + '.js';
      console.log(fileName);
      const script = scriptInfoArray.find((info) => info.filename == fileName);
      //let result = script!.isolateScript?.run(newContext);
    }),
  );
  /*await context.global.set("wait", new Callback(function () {
        let resolve: any = null;
        setTimeout(() => resolve(), 5000);
        return new Promise((r) => resolve = r);
    }))*/
  await context.global.set(
    'log',
    new Callback(function (message: string) {
      console.log(message);
    }),
  );

  await context.evalClosure(
    `
      global.wait = function timeoutPromise(ms) {
        return $0.apply(undefined, [ms], { arguments: { copy: true }, result: { copy: true, promise: true } })
      }
    `,
    [
      (ms: number) => {
        let resolve: any = null;
        setTimeout(() => resolve(), ms);
        return new Promise((r) => (resolve = r));
      },
    ],
    { arguments: { reference: true } },
  );

  const mainScript = scriptInfoArray.find(
    (info) => info.filename == 'file1.js',
  );
  try {
    await mainScript.isolateScript?.instantiate(context, () => {
      throw new Error();
    });
    startTime = vmInstance.cpuTime;
    console.log('initial cpu time: ' + startTime);
    console.log(await mainScript.isolateScript?.evaluate());
  } catch (e) {
    console.log(e);
  }
}

setInterval(
  () =>
    console.log(
      'cpu time ' +
        vmInstance.cpuTime +
        ' difference ' +
        (vmInstance.cpuTime - startTime),
    ),
  100,
);

function handleError(message: string) {
  // TODO
}

doTests().catch((err) => console.error(err));
