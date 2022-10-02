import {Script} from "isolated-vm";

export interface ScriptInfo {
    code: string,
    filename: string
    isolateScript?: Script
}