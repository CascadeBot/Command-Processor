import { Module } from 'isolated-vm';

export interface ScriptInfo {
  code: string;
  filename: string;
  isolateScript?: Module;
}
