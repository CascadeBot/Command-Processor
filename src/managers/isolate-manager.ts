import { Isolate } from 'isolated-vm';
import { IsolateInstance } from '@models/isolate-instance';

export class IsolateManager {
  private readonly cpuLimit: bigint;
  private readonly memoryLimit: number;
  private readonly timeout: number;
  constructor(cpuLimit: bigint, memoryLimit: number, timeout: number) {
    this.cpuLimit = cpuLimit;
    this.memoryLimit = memoryLimit;
    this.timeout = timeout;
    this.startKillTask();
  }

  private isolates: IsolateInstance[] = [];

  private startKillTask() {
    setInterval(() => {
      for (const isolate of this.isolates) {
        const diff = isolate.backendInstance.cpuTime - isolate.startCpuTime;
        if (diff >= this.cpuLimit) {
          this.disposeOfInstance(isolate);
        }
      }
    }, 500);
  }

  public createIsolateInstance(): IsolateInstance {
    const vmInstance = new Isolate({
      onCatastrophicError: this.handleCatastrophicError,
      memoryLimit: this.memoryLimit,
    });
    const instance = new IsolateInstance(vmInstance, this);
    this.isolates.push(instance);
    return instance;
  }

  private handleCatastrophicError(message: string) {
    // TODO try to shut down as nicely as possible
    process.exit(1);
  }

  public disposeOfInstance(isolate: IsolateInstance) {
    isolate.backendInstance.dispose();
    delete this.isolates[this.isolates.indexOf(isolate)];
  }
}
