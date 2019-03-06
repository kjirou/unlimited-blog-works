import * as assert from 'assert';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as sinon from 'sinon';

import {
  UbwSettings,
  executeArticleNew,
  executeCompile,
  executeCompileWithSettings,
  executeInit,
  requireSettings,
} from '../src/index';
import {
  ArticlePageProps,
  NonArticlePageProps,
} from '../src/templates/shared';
import {
  dumpDir,
  prepareWorkspace,
} from '../src/test-helper';

const clearModule = require('clear-module');
const hast = require('hastscript');

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

  describe('executeCompile, executeCompileWithSettings', function() {
    describe('when after `executeInit` and `executeArticleNew`', function() {
      let clock: any;
      let configFilePath: string;

      beforeEach(function() {
        clock = sinon.useFakeTimers(new Date('2019-01-01 00:00:00+0000'));
        configFilePath = path.join(workspaceRoot, 'ubw-configs.js');

        return executeInit(workspaceRoot)
          .then(() => {
            clearModule(configFilePath);
            return executeArticleNew(configFilePath);
          })
          .then(() => {
            clearModule(configFilePath);
          });
      });

      afterEach(function() {
        clock.restore();
      });

      describe('Basic specification of `executeCompile`', function() {
        it('can create some files into the publication dir', function() {
          return executeCompile(configFilePath)
            .then(result => {
              assert.strictEqual(result.exitCode, 0);

              const dump = dumpDir(workspaceRoot);
              assert.strictEqual(typeof dump['blog-publication/index.html'], 'string');
              assert.strictEqual(typeof dump['blog-publication/atom-feed.xml'], 'string');
              assert.strictEqual(typeof dump['blog-publication/robots.txt'], 'string');
              assert.strictEqual(typeof dump['blog-publication/external-resources/index.css'], 'string');
              assert.strictEqual(typeof dump['blog-publication/external-resources/github-markdown.css'], 'string');
              assert.strictEqual(typeof dump['blog-publication/articles/20190101-0001.html'], 'string');
            });
        });

        it('should add hyperlinks that refer the same page to page-title autolinks', function() {
          return executeCompile(configFilePath)
            .then(result => {
              assert.strictEqual(result.exitCode, 0);

              const dump = dumpDir(workspaceRoot);
              assert.strictEqual(
                /<h1 .+href="".+<\/h1>/.test(dump['blog-publication/index.html']),
                true
              );
              assert.strictEqual(
                /<h1 .+href="".+<\/h1>/.test(dump['blog-publication/articles/20190101-0001.html']),
                true
              );
            });
        });
      });

      describe('"_direct" directory', function() {
        it('should succeed even if there is no "_direct" dir', function() {
          fs.removeSync(path.join(workspaceRoot, 'blog-source/external-resources/_direct'));

          return executeCompile(configFilePath)
            .then(result => {
              assert.strictEqual(result.exitCode, 0);

              const dump = dumpDir(workspaceRoot);
              assert.strictEqual(typeof dump['blog-publication/index.html'], 'string');
              assert.strictEqual(typeof dump['blog-publication/robots.txt'], 'undefined');
            });
        });

        it('should succeed even if the "_direct" dir is empty', function() {
          fs.emptyDirSync(path.join(workspaceRoot, 'blog-source/external-resources/_direct'));

          return executeCompile(configFilePath)
            .then(result => {
              assert.strictEqual(result.exitCode, 0);

              const dump = dumpDir(workspaceRoot);
              assert.strictEqual(typeof dump['blog-publication/index.html'], 'string');
              assert.strictEqual(typeof dump['blog-publication/robots.txt'], 'undefined');
            });
        });
      });

      describe('Change due to each setting', function() {
        let settings: UbwSettings;

        beforeEach(function() {
          clearModule(configFilePath);
          settings = requireSettings(configFilePath);
        });

        it('ogp', function() {
          Object.assign(settings.configs, {
            blogName: 'FOO',
            blogUrl: 'https://example.com/bar',
          });

          return executeCompileWithSettings(settings)
            .then(result => {
              assert.strictEqual(result.exitCode, 0);

              const dump = dumpDir(workspaceRoot);
              assert.notStrictEqual(
                dump['blog-publication/articles/20190101-0001.html']
                  .indexOf('<meta property="og:title" content="Page Title">'),
                -1
              );
              assert.notStrictEqual(
                dump['blog-publication/articles/20190101-0001.html']
                  .indexOf('<meta property="og:type" content="website">'),
                -1
              );
              assert.notStrictEqual(
                dump['blog-publication/articles/20190101-0001.html']
                  .indexOf('<meta property="og:url" content="https://example.com/bar/articles/20190101-0001.html">'),
                -1
              );
              assert.notStrictEqual(
                dump['blog-publication/articles/20190101-0001.html']
                  .indexOf('<meta property="og:site_name" content="FOO">'),
                -1
              );

              assert.notStrictEqual(
                dump['blog-publication/index.html']
                  .indexOf('<meta property="og:title" content="FOO">'),
                -1
              );
              assert.notStrictEqual(
                dump['blog-publication/index.html']
                  .indexOf('<meta property="og:type" content="website">'),
                -1
              );
              assert.notStrictEqual(
                dump['blog-publication/index.html']
                  .indexOf('<meta property="og:url" content="https://example.com/bar/">'),
                -1
              );
              assert.notStrictEqual(
                dump['blog-publication/index.html']
                  .indexOf('<meta property="og:site_name" content="FOO">'),
                -1
              );
            });
        });

        it('generateArticleHeadNodes', function() {
          settings.configs.generateArticleHeadNodes = function(props: ArticlePageProps): HastscriptAst[] {
            return [
              hast('script', {src: '/path/to/foo.js'}),
              hast('link', {rel: '/path/to/bar.css'}),
            ];
          };

          return executeCompileWithSettings(settings)
            .then(result => {
              assert.strictEqual(result.exitCode, 0);

              const dump = dumpDir(workspaceRoot);
              assert.notStrictEqual(
                dump['blog-publication/articles/20190101-0001.html']
                  .indexOf('<script src="/path/to/foo.js"></script>'),
                -1
              );
              assert.notStrictEqual(
                dump['blog-publication/articles/20190101-0001.html']
                  .indexOf('<link rel="/path/to/bar.css">'),
                -1
              );
            });
        });

        it('generateNonArticleHeadNodes', function() {
          settings.configs.generateNonArticleHeadNodes = function(props: NonArticlePageProps): HastscriptAst[] {
            return [
              hast('script', {src: '/path/to/foo.js'}),
              hast('link', {rel: '/path/to/bar.css'}),
            ];
          };

          return executeCompileWithSettings(settings)
            .then(result => {
              assert.strictEqual(result.exitCode, 0);

              const dump = dumpDir(workspaceRoot);
              assert.notStrictEqual(
                dump['blog-publication/index.html'].indexOf('<script src="/path/to/foo.js"></script>'),
                -1
              );
              assert.notStrictEqual(
                dump['blog-publication/index.html'].indexOf('<link rel="/path/to/bar.css">'),
                -1
              );
            });
        });

        describe('additionalTopPageLinks', function() {
          it('can render as anchor tags', function() {
            settings.configs.additionalTopPageLinks = [
              {linkText: 'FOOOO', href: 'https://example.com/aaa'},
              {linkText: 'BARRR', href: 'https://example.com/bbb'},
            ];

            return executeCompileWithSettings(settings)
              .then(result => {
                assert.strictEqual(result.exitCode, 0);

                const dump = dumpDir(workspaceRoot);
                assert.notStrictEqual(
                  dump['blog-publication/index.html'].indexOf('<a href="https://example.com/aaa">FOOOO</a>'),
                  -1
                );
                assert.notStrictEqual(
                  dump['blog-publication/index.html'].indexOf('<a href="https://example.com/bbb">BARRR</a>'),
                  -1
                );
              });
          });
        });

        describe('nonArticles', function() {
          describe('pathIsNormalizedToSlash', function() {
            it('should render the link normalized to slash when the value is true', function() {
              const topPageConfigs = settings.configs.nonArticles
                .find(nonArticle => nonArticle.nonArticlePageId === 'top') as any;
              topPageConfigs.pathIsNormalizedToSlash = true;

              return executeCompileWithSettings(settings)
                .then(result => {
                  assert.strictEqual(result.exitCode, 0);

                  const dump = dumpDir(workspaceRoot);
                  assert.notStrictEqual(
                    dump['blog-publication/articles/20190101-0001.html'].indexOf('<a href="/">Back to the Top</a>'),
                    -1
                  );
                });
            });

            it('should render the link not normalized to slash when the value is false', function() {
              const topPageConfigs = settings.configs.nonArticles
                .find(nonArticle => nonArticle.nonArticlePageId === 'top') as any;
              topPageConfigs.pathIsNormalizedToSlash = false;

              return executeCompileWithSettings(settings)
                .then(result => {
                  assert.strictEqual(result.exitCode, 0);

                  const dump = dumpDir(workspaceRoot);
                  assert.notStrictEqual(
                    dump['blog-publication/articles/20190101-0001.html'].indexOf('<a href="/index.html">Back to the Top</a>'),
                    -1
                  );
                });
            });
          });
        });
      });
    });
  });
});
