import {Callback, Isolate} from 'isolated-vm'
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
        scriptInfo.isolateScript = await vmInstance.compileScript(scriptInfo.code, {
            filename: scriptInfo.filename
        });
    }
    let context = await vmInstance.createContext({inspector: true});
    await context.global.set("require", new Callback(function (fileName: string) {
        console.log("require function called for file " + fileName);
        let newContext = vmInstance.createContextSync({inspector: true});
        newContext.global.setSync("log", new Callback(function (message: string) {
            console.log(message);
        }));
        fileName = fileName + ".js";
        console.log(fileName);
        let script = scriptInfoArray.find(info => info.filename == fileName);
        let result = script!.isolateScript?.run(newContext);
    }));
    await context.global.set("log", new Callback(function (message: string) {
        console.log(message);
    }))
    let mainScript = scriptInfoArray.find(info => info.filename == "file1.js");
    try {
        console.log(await mainScript!.isolateScript?.run(context));
    } catch (e) {
        console.log(e);
    }
}

let i = 0;
setInterval(() => console.log("hi " + i++), 100);

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