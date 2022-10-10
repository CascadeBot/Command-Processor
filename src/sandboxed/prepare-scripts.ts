import { promises as fs } from 'fs';
import path from 'path';

let scripts = '';

export async function setupScripts() {
  const files = await fs.readdir(path.join(__dirname, './scripts'), {
    withFileTypes: true,
  });
  const fileNames = files
    .filter((v) => {
      const isCodefile = v.name.endsWith('.js');
      const isNormalFile = v.isFile();
      return isCodefile && isNormalFile;
    })
    .map((v) => v.name);

  const scriptStrings = await Promise.all(
    fileNames.map((name) =>
      fs.readFile(path.join(__dirname, './scripts', name), {
        encoding: 'utf8',
      }),
    ),
  );

  // each script is wrapped in its own namespace, return values are recorded in an array
  const functions = scriptStrings.map(
    (script) => `
      (function () {
        ${script}
      })()
    `,
  );

  // also in its own namespaces, the array return values are all assigned to the global scope
  scripts = `
    (() => {
      let arr = [${functions.join(',')}];
      arr.forEach((v) => {
        Object.assign(global, v)
      })
    })()
  `;
}

export function getPrependScript(): string {
  return scripts;
}
