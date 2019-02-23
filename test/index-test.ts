import * as assert from 'assert';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as sinon from 'sinon';

import {
  UbwSettings,
  executeArticleNew,
  executeCompile,
  executeCompileWithConfigs,
  executeInit,
  requireSettings,
} from '../src/index';
import {
  dumpDir,
  prepareWorkspace,
} from '../src/test-helper';

describe('index', function() {
  let workspaceRoot: string;

  beforeEach(function() {
    workspaceRoot = prepareWorkspace();
  });

  describe('executeInit', function() {
    it('can create some files', function() {
      return executeInit(workspaceRoot)
        .then(result => {
          assert.strictEqual(result.exitCode, 0);

          const dump = dumpDir(workspaceRoot);
          assert.strictEqual(typeof dump['ubw-configs.js'], 'string');
          assert.strictEqual(typeof dump['blog-source/external-resources/index.css'], 'string');
          assert.strictEqual(typeof dump['blog-source/external-resources/github-markdown.css'], 'string');
        });
    });
  });

  describe('executeArticleNew', function() {
    describe('when after `executeInit`', function() {
      let clock: any;

      beforeEach(function() {
        clock = sinon.useFakeTimers(new Date('2019-01-01 00:00:00+0000'));

        return executeInit(workspaceRoot);
      });

      afterEach(function() {
        clock.restore();
      });

      it('can create an article source file', function() {
        return executeArticleNew(path.join(workspaceRoot, 'ubw-configs.js'))
          .then(result => {
            assert.strictEqual(result.exitCode, 0);

            const dump = dumpDir(workspaceRoot);
            assert.strictEqual(typeof dump['blog-source/articles/20190101-0001.md'], 'string');
          })
      });
    });
  });

  describe('executeCompile, executeCompileWithConfigs', function() {
    describe('when after `executeInit` and `executeArticleNew`', function() {
      let clock: any;
      let configFilePath: string;
      let settings: UbwSettings;

      beforeEach(function() {
        clock = sinon.useFakeTimers(new Date('2019-01-01 00:00:00+0000'));

        configFilePath = path.join(workspaceRoot, 'ubw-configs.js');
        settings = requireSettings(configFilePath);

        return executeInit(workspaceRoot)
          .then(() => executeArticleNew(configFilePath));
      });

      afterEach(function() {
        clock.restore();
      });

      it('can create some files into the publication dir', function() {
        return executeCompileWithConfigs(settings)
          .then(result => {
            assert.strictEqual(result.exitCode, 0);

            const dump = dumpDir(workspaceRoot);
            assert.strictEqual(typeof dump['blog-publication/index.html'], 'string');
            assert.strictEqual(typeof dump['blog-publication/robots.txt'], 'string');
            assert.strictEqual(typeof dump['blog-publication/external-resources/index.css'], 'string');
            assert.strictEqual(typeof dump['blog-publication/external-resources/github-markdown.css'], 'string');
            assert.strictEqual(typeof dump['blog-publication/articles/20190101-0001.html'], 'string');
          });
      });

      describe('"_direct" directory', function() {
        it('should succeed even if there is no "_direct" dir', function() {
          fs.removeSync(path.join(workspaceRoot, 'blog-source/external-resources/_direct'));

          return executeCompileWithConfigs(settings)
            .then(result => {
              assert.strictEqual(result.exitCode, 0);

              const dump = dumpDir(workspaceRoot);
              assert.strictEqual(typeof dump['blog-publication/index.html'], 'string');
              assert.strictEqual(typeof dump['blog-publication/robots.txt'], 'undefined');
            });
        });

        it('should succeed even if the "_direct" dir is empty', function() {
          fs.emptyDirSync(path.join(workspaceRoot, 'blog-source/external-resources/_direct'));

          return executeCompileWithConfigs(settings)
            .then(result => {
              assert.strictEqual(result.exitCode, 0);

              const dump = dumpDir(workspaceRoot);
              assert.strictEqual(typeof dump['blog-publication/index.html'], 'string');
              assert.strictEqual(typeof dump['blog-publication/robots.txt'], 'undefined');
            });
        });
      });
    });
  });
});
