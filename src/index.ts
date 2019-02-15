import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import * as path from 'path';

import {
  ActualUbwConfigs,
  ArticlePage,
  NonArticlePage,
  UbwConfigs,
  createDefaultUbwConfigs as createDefaultUbwConfigs_,
  createInitialArticleFrontMatters,
  createInitialUbwConfigs,
  fillWithDefaultUbwConfigs,
  generateArticlePages,
  generateNonArticlePages,
  getNextAutomaticArticleId,
  initializeArticlePages,
  initializeNonArticlePages,
  preprocessArticlePages,
  preprocessNonArticlePages,
} from './page-generator';
import {
  CONFIG_FILE_NAME,
  PRESETS_EXTERNAL_RESOURCES_ROOT,
  generateBlogPaths,
  generateDateTimeString,
  generateTodayDateString,
  toNormalizedAbsolutePath,
} from './utils';
import TopLayout from './templates/TopLayout';
import {NonArticlePageProps} from './templates/shared';

export const createDefaultUbwConfigs = createDefaultUbwConfigs_;

export const cliUtils = {
  CONFIG_FILE_NAME,
  toNormalizedAbsolutePath,
};

export interface CommandResult {
  exitCode: number,
  message: string,
}

export function executeInit(blogRoot: string): Promise<CommandResult> {
  const configFilePath = path.join(blogRoot, CONFIG_FILE_NAME);

  const initialConfigs = createInitialUbwConfigs();
  const configs = fillWithDefaultUbwConfigs(initialConfigs);

  fs.ensureDirSync(blogRoot);
  fs.writeFileSync(
    configFilePath,
    `module.exports = ${JSON.stringify(initialConfigs, null, 2)}\n`
  );

  const paths = generateBlogPaths(blogRoot, configs.publicationPath);

  fs.ensureDirSync(paths.sourceExternalResourcesRoot);
  fs.copySync(PRESETS_EXTERNAL_RESOURCES_ROOT, paths.sourceExternalResourcesRoot);

  return Promise.resolve({
    exitCode: 0,
    message: 'Done "init"',
  });
}

export function executeCompile(configFilePath: string): Promise<CommandResult> {
  const actualConfigs = require(configFilePath) as ActualUbwConfigs;
  const configs = fillWithDefaultUbwConfigs(actualConfigs);

  const blogRoot = path.join(path.dirname(configFilePath), configs.blogPath);
  const paths = generateBlogPaths(blogRoot, configs.publicationPath);

  let articlePages: ArticlePage[] = initializeArticlePages(
      blogRoot, configs, fs.readdirSync(paths.sourceArticlesRoot)
    )
    .map(articlePage => {
      return Object.assign({}, articlePage, {
        markdownSource: fs.readFileSync(articlePage.inputFilePath).toString(),
      });
    });
  let nonArticlePages: NonArticlePage[] = initializeNonArticlePages(blogRoot, configs);

  articlePages = preprocessArticlePages(blogRoot, configs, articlePages);
  nonArticlePages = preprocessNonArticlePages(blogRoot, configs, nonArticlePages);

  articlePages = generateArticlePages(blogRoot, configs, articlePages, nonArticlePages);
  nonArticlePages = generateNonArticlePages(blogRoot, configs, articlePages, nonArticlePages);

  fs.ensureDirSync(paths.publicationRoot);
  fs.ensureDirSync(paths.publicationArticlesRoot);

  articlePages.forEach(article => {
    fs.writeFileSync(article.outputFilePath, article.htmlSource);
  });
  nonArticlePages.forEach(nonArticlePage => {
    fs.writeFileSync(nonArticlePage.outputFilePath, nonArticlePage.html);
  });

  fs.copySync(paths.sourceExternalResourcesRoot, paths.publicationExternalResourcesRoot);

  // Expand files under the "external-resources/_direct" into under the document root.
  //
  // NOTICE: Previously expanded files using "fs-extra"'s `moveSync` like the following code,
  //         this didn't work in the Travis CI environment.
  //         ```
  //         fs.moveSync("/path/to/external-resources/_direct", "/path/to/publication");
  //         ```
  fs.ensureDirSync(paths.publicationExternalResourcesDirectPlacementRoot);
  fs.readdirSync(paths.publicationExternalResourcesDirectPlacementRoot).forEach(fileName => {
    const from = path.join(paths.publicationExternalResourcesDirectPlacementRoot, fileName);
    const to = path.join(paths.publicationRoot, fileName);
    fs.copySync(from, to);
  });
  fs.removeSync(paths.publicationExternalResourcesDirectPlacementRoot);

  return Promise.resolve({
    exitCode: 0,
    message: 'Done "compile"',
  });
}

export function executeArticleNew(configFilePath: string): Promise<CommandResult> {
  const actualConfigs = require(configFilePath) as ActualUbwConfigs;
  const configs = fillWithDefaultUbwConfigs(actualConfigs);

  const blogRoot = path.join(path.dirname(configFilePath), configs.blogPath);
  const paths = generateBlogPaths(blogRoot, configs.publicationPath);

  fs.ensureDirSync(paths.sourceRoot);
  fs.ensureDirSync(paths.sourceArticlesRoot);

  const articlePages: ArticlePage[] =
    initializeArticlePages(blogRoot, configs, fs.readdirSync(paths.sourceArticlesRoot));

  const now = new Date();
  const todayDateString = generateTodayDateString(now, configs.timeZone);
  const articleId = getNextAutomaticArticleId(articlePages, todayDateString);
  const frontMatters = createInitialArticleFrontMatters(articleId, generateDateTimeString(now, 'UTC'));

  fs.writeFileSync(
    path.join(paths.sourceArticlesRoot, articleId + '.md'),
    [
      // TODO: Want to wrap string variables with double quotes always.
      '---\n' + yaml.safeDump(frontMatters) + '---',
      '',
      '# Page Title\n',
    ].join('\n')
  );

  return Promise.resolve({
    exitCode: 0,
    message: 'Done "article new"',
  });
}
