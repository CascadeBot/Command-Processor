import createIsolateInstance from '@managers/isolate-manager';
import fs from 'fs';
import { join } from 'path';

const instance = createIsolateInstance();

async function testLoad() {
  await instance.loadScripts([
    {
      filename: 'file1.js',
      code: fs.readFileSync(join(__dirname, 'example/file1.js'), 'utf-8'),
    },
    {
      filename: 'file2.js',
      code: fs.readFileSync(join(__dirname, 'example/file2.js'), 'utf-8'),
    },
    {
      filename: 'file3.js',
      code: fs.readFileSync(join(__dirname, 'example/file3.js'), 'utf-8'),
    },
  ]);

  await instance.runScript('file1.js');
}

testLoad().catch((e) => {
  console.log(e);
});
