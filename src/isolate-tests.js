"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isolated_vm_1 = require("isolated-vm");
const websocket_1 = require("websocket");
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
let vmInstance = new isolated_vm_1.Isolate({
    memoryLimit: 512,
    inspector: true,
    onCatastrophicError: handleError
});
function doTests() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let scriptInfoArray = [
            {
                code: fs_1.default.readFileSync("example/file1.js", 'utf-8'),
                filename: "file1.js"
            },
            {
                code: fs_1.default.readFileSync("example/file2.js", 'utf-8'),
                filename: "file2.js"
            }
        ];
        for (const scriptInfoIndex in scriptInfoArray) {
            const scriptInfo = scriptInfoArray[scriptInfoIndex];
            scriptInfo.isolateScript = yield vmInstance.compileScript(scriptInfo.code, {
                filename: scriptInfo.filename
            });
        }
        let context = yield vmInstance.createContext({ inspector: true });
        yield context.global.set("require", new isolated_vm_1.Callback(function (fileName) {
            var _a;
            console.log("require function called for file " + fileName);
            let newContext = vmInstance.createContextSync({ inspector: true });
            newContext.global.setSync("log", new isolated_vm_1.Callback(function (message) {
                console.log(message);
            }));
            fileName = fileName + ".js";
            console.log(fileName);
            let script = scriptInfoArray.find(info => info.filename == fileName);
            let result = (_a = script.isolateScript) === null || _a === void 0 ? void 0 : _a.run(newContext);
        }));
        yield context.global.set("log", new isolated_vm_1.Callback(function (message) {
            console.log(message);
        }));
        let mainScript = scriptInfoArray.find(info => info.filename == "file1.js");
        try {
            console.log(yield ((_a = mainScript.isolateScript) === null || _a === void 0 ? void 0 : _a.run(context)));
        }
        catch (e) {
            console.log(e);
        }
    });
}
let i = 0;
setInterval(() => console.log("hi " + i++), 100);
let httpServer = http_1.default.createServer();
let wsServer = new websocket_1.server({
    httpServer
});
wsServer.on('request', function (request) {
    let conn = request.accept();
    let channel = vmInstance.createInspectorSession();
    function dispose() {
        channel.dispose();
    }
    conn.on('close', dispose);
    conn.on('error', dispose);
    conn.on('message', function (message) {
        channel.dispatchProtocolMessage(message.utf8Data);
    });
    channel.onResponse = (callId, message) => conn.sendUTF(message);
    channel.onNotification = (message) => conn.sendUTF(message);
});
function handleError(message) {
}
doTests();
