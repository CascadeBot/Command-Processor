import { Isolate } from 'isolated-vm';
import { IsolateInstance } from '@models/isolate-instance';
import { scopedLogger } from '@logger';
import { randomUUID } from 'crypto';

const log = scopedLogger('isolate-manager');

let killTask: ReturnType<typeof setInterval> | null = null;
let cpuLimit = 10000000n; // TODO arbitrary number, need to do more research
let memoryLimit = 512; // TODO not so arbitrary number, but we should still do some research into if this is needed or not, 512 MB is quite a bit
let timeout = 1000 * 60 * 10; // 10 mins

export function setLimit(
  newCpuLimit: bigint,
  newMemoryLimit: number,
  newTimeout: number,
) {
  cpuLimit = newCpuLimit;
  memoryLimit = newMemoryLimit;
  timeout = newTimeout;
}

let isolates: IsolateInstance[] = [];

export function setupManager() {
  killTask = setInterval(() => {
    for (const isolate of isolates) {
      if (isolate == undefined) {
        continue;
      }
      if (isolate.running == false) {
        continue;
      }
      if (isolate.startCpuTime == undefined) {
        continue;
      }
      const diff: bigint =
        isolate.backendInstance.cpuTime - isolate.startCpuTime;
      if (diff >= cpuLimit) {
        disposeOfInstance(isolate.id);
      }
    }
  }, 500);
}

export function stopManager() {
  if (killTask) clearInterval(killTask);
}

export function createIsolateInstance(): IsolateInstance {
  const vmInstance = new Isolate({
    onCatastrophicError: handleCatastrophicError,
    memoryLimit: memoryLimit,
  });
  const instance = new IsolateInstance(
    randomUUID(),
    vmInstance,
    (ins) => disposeOfInstance(ins.id),
    timeout,
  );
  isolates.push(instance);
  return instance;
}

function handleCatastrophicError(message: string) {
  // TODO cleanup
  log.error(`catastrophic error: ${message}`, { evt: 'catastrophic' });
  process.exit(1);
}

function disposeOfInstance(id: string) {
  // this supports multiple with same id, just incase it happens
  // we still need to be able to dispose of it if it does happen
  const foundInstances = [];
  isolates = isolates.filter((ins) => {
    if (ins.id !== id) {
      foundInstances.push(ins);
      return true;
    }
    return false;
  });
  foundInstances.forEach((ins) => ins.backendInstance.dispose());
}
