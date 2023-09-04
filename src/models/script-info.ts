import { Module } from 'isolated-vm';

export interface ScriptInfo {
  id: string;
  code: string;
  name: string;
  isolateScript?: Module;
}
