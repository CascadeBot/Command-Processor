import { Isolate } from 'isolated-vm';
import { IsolateInstance } from '@models/isolate-instance';

export let cpuLimit = 10000000n; // TODO arbitrary number, need to do more research
export let memoryLimit = 512; // TODO not so arbitrary number, but we should still do some research into if this is needed or not, 512 MB is quite a bit
export let timeout = 1000 * 60 * 10; // 10 mins

export function setLimit(
  newCpuLimit: bigint,
  newMemoryLimit: number,
  newTimeout: number,
) {
  cpuLimit = newCpuLimit;
  memoryLimit = newMemoryLimit;
  timeout = newTimeout;
}

const isolates: IsolateInstance[] = [];

function startKillTask() {
  setInterval(() => {
    for (const isolate of isolates) {
      if (isolate.running == false) {
        continue;
      }
      const diff: bigint =
        isolate.backendInstance.cpuTime - isolate.startCpuTime;
      if (diff >= cpuLimit) {
        disposeOfInstance(isolate);
      }
    }
  }, 500);
}

export default function createIsolateInstance(): IsolateInstance {
  const vmInstance = new Isolate({
    onCatastrophicError: handleCatastrophicError,
    memoryLimit: memoryLimit,
  });
  const instance = new IsolateInstance(vmInstance, disposeOfInstance);
  isolates.push(instance);
  return instance;
}

function handleCatastrophicError(message: string) {
  // TODO try to shut down as nicely as possible
  process.exit(1);
}

function disposeOfInstance(isolate: IsolateInstance) {
  isolate.backendInstance.dispose();
  delete isolates[isolates.indexOf(isolate)];
}

startKillTask();
