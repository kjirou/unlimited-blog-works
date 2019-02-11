/*
 * MUST NOT import this file except under the "test" directory.
 */
import * as fs from 'fs-extra';
import * as klawSync from 'klaw-sync';
import * as path from 'path';

import {PROJECT_ROOT} from './utils';

const TEST_TMP_ROOT = path.join(PROJECT_ROOT, 'test/tmp');

export function prepareWorkspace(subDir: string = 'default'): string {
  const workspaceRoot = path.join(TEST_TMP_ROOT, subDir);
  fs.ensureDirSync(workspaceRoot);
  fs.emptyDirSync(workspaceRoot);
  return workspaceRoot;
}

export interface DumpedDir {
  [relativePath: string]: string,
}

export function dumpDir(root: string): DumpedDir {
  const dumped: DumpedDir = {};
  klawSync(root, {nodir: true}).forEach(result => {
    const rootIncludedSlash = root + '/';
    const relativePathStart = result.path.indexOf(rootIncludedSlash);
    if (relativePathStart !== 0) {
      throw new Error('The root dir must be included in the path.');
    }
    const relativePath = result.path.slice(rootIncludedSlash.length);
    dumped[relativePath] = fs.readFileSync(result.path).toString();
  });
  return dumped;
}
