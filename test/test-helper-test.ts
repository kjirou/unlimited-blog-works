import * as assert from 'assert';
import * as fs from 'fs-extra';
import * as path from 'path';

import {
  dumpDir,
  prepareWorkspace,
} from '../src/test-helper';

describe('test-helper', function() {
  describe('prepareWorkspace', function() {
    describe('when there are no dirs', function() {
      it('can ensure a default dir', function() {
        const workspaceRoot = prepareWorkspace();
        const stats = fs.statSync(workspaceRoot);
        assert.strictEqual(stats.isDirectory(), true);
      });
    });

    describe('when there is the same dir with containing any files', function() {
      let workspaceRoot: string;
      let fooFilePath: string;
      let barFilePath: string;

      beforeEach(function() {
        workspaceRoot = prepareWorkspace();
        fooFilePath = path.join(workspaceRoot, 'foo');
        barFilePath = path.join(workspaceRoot, 'bar');
        fs.writeFileSync(fooFilePath, '');
        fs.writeFileSync(barFilePath, '');
      });

      it('can ensure an empty default dir', function() {
        const workspaceRoot = prepareWorkspace();
        const stats = fs.statSync(workspaceRoot);
        assert.strictEqual(stats.isDirectory(), true);
        assert.strictEqual(fs.existsSync(fooFilePath), false);
        assert.strictEqual(fs.existsSync(barFilePath), false);
      });
    });
  });

  describe('dumpDir', function() {
    it('can get a simple file list', function() {
      const workspaceRoot = prepareWorkspace();
      fs.ensureDirSync(path.join(workspaceRoot, 'x/y'));
      fs.writeFileSync(path.join(workspaceRoot, 'foo'), 'FOO');
      fs.writeFileSync(path.join(workspaceRoot, 'bar'), 'BAR');
      fs.writeFileSync(path.join(workspaceRoot, 'x/y', 'baz'), 'BAZ');

      const dump = dumpDir(workspaceRoot);
      assert.deepStrictEqual(dump, {
        foo: 'FOO',
        bar: 'BAR',
        'x/y/baz': 'BAZ',
      });
    });
  });
});
