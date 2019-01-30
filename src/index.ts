import * as fs from 'fs-extra';
import * as path from 'path';

const RELATIVE_SRC_DIR_PATH: string = 'src';

export function executeInit(destinationDirPath: string): string {
  fs.ensureDirSync(destinationDirPath);
  const srcDirPath = path.join(destinationDirPath, RELATIVE_SRC_DIR_PATH);
  fs.ensureDirSync(srcDirPath);
  fs.writeFileSync(
    path.join(srcDirPath, 'index.md'),
    [
      '# Your blog',
    ].join('\n')
  );

  return 'Done init\n';
}

export function executeCompile(): string {
  return 'Done compile\n';
}
