import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';

import {
  executeArticleNew,
  executeCompile,
  executeInit,
} from '../src/index';
import {
  defaultUbwConfigs,
} from '../src/utils';
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
        clock = sinon.useFakeTimers(new Date(2019, 0, 1));

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

  describe('executeCompile', function() {
    describe('when after `executeInit` and `executeArticleNew`', function() {
      let clock: any;
      let configFilePath: string;

      beforeEach(function() {
        clock = sinon.useFakeTimers(new Date(2019, 0, 1));
        configFilePath = path.join(workspaceRoot, 'ubw-configs.js');

        return executeInit(workspaceRoot)
          .then(() => executeArticleNew(configFilePath));
      });

      afterEach(function() {
        clock.restore();
      });

      it('can create some files into the publication dir', function() {
        return executeCompile(configFilePath)
          .then(result => {
            assert.strictEqual(result.exitCode, 0);

            const dump = dumpDir(workspaceRoot);
            assert.strictEqual(typeof dump['docs/index.html'], 'string');
            assert.strictEqual(typeof dump['docs/robots.txt'], 'string');
            assert.strictEqual(typeof dump['docs/external-resources/index.css'], 'string');
            assert.strictEqual(typeof dump['docs/external-resources/github-markdown.css'], 'string');
            assert.strictEqual(typeof dump['docs/articles/20190101-0001.html'], 'string');
          });
      });
    });
  });
});
