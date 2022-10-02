import {Callback, Isolate, Reference} from 'isolated-vm'
import {ScriptInfo} from "./models/script-info";
import {IUtf8Message, server} from "websocket";
import http from "http"
import fs from "fs";
import {resolve} from "path";

let vmInstance = new Isolate({
    memoryLimit: 512,
    inspector: true,
    onCatastrophicError: handleError
});

let startTime: bigint = 0n;

async function doTests() {
    let scriptInfoArray: ScriptInfo[] = [
        {
            code: fs.readFileSync("example/file1.js", 'utf-8'),
            filename: "file1.js"
        },
        {
            code: fs.readFileSync("example/file2.js", 'utf-8'),
            filename: "file2.js"
        }
    ]
    for (const scriptInfoIndex in scriptInfoArray) {
        const scriptInfo = scriptInfoArray[scriptInfoIndex];
        scriptInfo.isolateScript = await vmInstance.compileModule(scriptInfo.code, {
            filename: scriptInfo.filename
        });
    }
    let context = await vmInstance.createContext({inspector: true});
    const jail = context.global
    await jail.set('global', jail.derefInto())

    await context.global.set("require", new Callback(function (fileName: string) {
        console.log("require function called for file " + fileName);
        let newContext = vmInstance.createContextSync({inspector: true});
        newContext.global.setSync("log", new Callback(function (message: string) {
            console.log(message);
        }));
        fileName = fileName + ".js";
        console.log(fileName);
        let script = scriptInfoArray.find(info => info.filename == fileName);
        //let result = script!.isolateScript?.run(newContext);
    }));
    /*await context.global.set("wait", new Callback(function () {
        let resolve: any = null;
        setTimeout(() => resolve(), 5000);
        return new Promise((r) => resolve = r);
    }))*/
    await context.global.set("log", new Callback(function (message: string) {
        console.log(message);
    }))

    await context.evalClosure(
        `
      global.wait = function timeoutPromise(ms) {
        return $0.apply(undefined, [ms], { arguments: { copy: true }, result: { copy: true, promise: true } })
      }
    `,
        [(ms: number) => {
            let resolve: any = null;
            setTimeout(() => resolve(), ms);
            return new Promise((r) => resolve = r);
        }],
        { arguments: { reference: true } },
    )

    let mainScript = scriptInfoArray.find(info => info.filename == "file1.js");
    try {
        await mainScript!.isolateScript?.instantiate(context, () => {
            throw new Error()
        });
        startTime = vmInstance.cpuTime;
        console.log("initial cpu time: " + startTime)
        console.log(await mainScript!.isolateScript?.evaluate());
    } catch (e) {
        console.log(e);
    }
}

let i = 0;
setInterval(() => console.log("cpu time " + vmInstance.cpuTime + " difference " + (vmInstance.cpuTime - startTime)), 100);

let httpServer = http.createServer();

let wsServer = new server({
    httpServer
});

wsServer.on('request', function (request) {
    let conn = request.accept()
    let channel = vmInstance.createInspectorSession();

    function dispose() {
        channel.dispose();
    }

    conn.on('close', dispose);
    conn.on('error', dispose);

    conn.on('message', function (message) {
        channel.dispatchProtocolMessage((<IUtf8Message>message).utf8Data)
    });

    channel.onResponse = (callId, message) => conn.sendUTF(message);
    channel.onNotification = (message) => conn.sendUTF(message);
});

function handleError(message: string) {

}

doTests()