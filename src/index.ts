import { setupApi } from '@api/entrypoint';
import { scopedLogger } from '@logger';
import {
  createIsolateInstance,
  setupManager,
  stopManager,
} from '@managers/isolate-manager';
import { setupScripts } from '@sandboxed/prepare-scripts';
import fs from 'fs';
import { join } from 'path';
import { getShardCount, tryConnect } from '@managers/rabbitmq-manager';

const log = scopedLogger('command-processor');

async function test() {
  const instance = createIsolateInstance();
  await instance.loadScripts([
    {
      id: '',
      name: 'file1.js',
      code: fs.readFileSync(join(__dirname, 'example/file1.js'), 'utf-8'),
    },
    {
      id: '',
      name: 'file2.js',
      code: fs.readFileSync(join(__dirname, 'example/file2.js'), 'utf-8'),
    },
    {
      id: '',
      name: 'file3.js',
      code: fs.readFileSync(join(__dirname, 'example/file3.js'), 'utf-8'),
    },
  ]);

  await instance.runScript('file1.js', [
    {
      key: 'interactionId',
      value: '488394590458478602',
    },
    {
      key: 'guildId',
      value: '488394590458478602',
    },
  ]);
}

async function bootstrap() {
  // setup app
  log.info('setting up modules');
  setupManager();
  await setupApi();
  await setupScripts();
  log.info('everything setup, running code');

  await tryConnect();
  await getShardCount();

  // run test
  // TODO temp
  await test();

  // clean exit
  stopManager();
}

bootstrap().catch((e) => {
  console.error('critical error:', e);
});
