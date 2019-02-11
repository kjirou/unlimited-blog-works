import * as fs from 'fs-extra';
import * as path from 'path';
import * as yaml from 'js-yaml';

import {
  ArticleFrontMatters,
  ArticlePage,
  NonArticlePage,
  generateArticlePages,
  generateNonArticlePages,
  getNextAutomaticArticleId,
  initializeArticlePages,
  preprocessArticlePages,
  preprocessNonArticlePages,
} from './page-generator';
import {
  UbwConfigs,
  STATIC_FILES_ROOT,
  defaultUbwConfigs,
  generateBlogPaths,
  generateDateTimeString,
  generateTodayDateString,
  toNormalizedAbsolutePath,
} from './utils';
import TopLayout from './templates/TopLayout';

export const cliUtils = {
  toNormalizedAbsolutePath,
};

export interface CommandResult {
  exitCode: number,
  message: string,
}

export function executeInit(blogRoot: string): Promise<CommandResult> {
  const configFilePath = path.join(blogRoot, 'ubw-configs.json');

  fs.ensureDirSync(blogRoot);
  fs.writeFileSync(
    configFilePath,
    JSON.stringify(defaultUbwConfigs, null, 2) + '\n'
  );

  const paths = generateBlogPaths(blogRoot, defaultUbwConfigs.publicationPath);

  fs.ensureDirSync(paths.sourceStaticFilesRoot);
  fs.writeFileSync(path.join(paths.sourceStaticFilesRoot, '.keep'), '');

  return Promise.resolve({
    exitCode: 0,
    message: 'Done "init"',
  });
}

export function executeCompile(configFilePath: string): Promise<CommandResult> {
  const rawConfigs = fs.readJsonSync(configFilePath);
  const configs = Object.assign({}, defaultUbwConfigs, rawConfigs) as UbwConfigs;

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
  let nonArticlePages: NonArticlePage[] = [
    {
      layoutComponent: TopLayout,
      relativeOutputFilePath: 'index.html',
      permalink: '/index.html',
      outputFilePath: '',
      html: '',
    },
  ];

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

  fs.removeSync(paths.publicationStaticFilesRoot);
  fs.copySync(paths.sourceStaticFilesRoot, paths.publicationStaticFilesRoot);

  fs.copySync(
    path.join(STATIC_FILES_ROOT, 'github-markdown.css'),
    path.join(paths.publicationRoot, 'github-markdown.css')
  );

  return Promise.resolve({
    exitCode: 0,
    message: 'Done "compile"',
  });
}

export function executeArticleNew(configFilePath: string): Promise<CommandResult> {
  const rawConfigs = fs.readJsonSync(configFilePath);
  const configs = Object.assign({}, defaultUbwConfigs, rawConfigs) as UbwConfigs;

  const blogRoot = path.join(path.dirname(configFilePath), configs.blogPath);
  const paths = generateBlogPaths(blogRoot, configs.publicationPath);

  fs.ensureDirSync(paths.sourceRoot);
  fs.ensureDirSync(paths.sourceArticlesRoot);

  const articlePages: ArticlePage[] =
    initializeArticlePages(blogRoot, configs, fs.readdirSync(paths.sourceArticlesRoot));

  const now = new Date();
  const todayDateString = generateTodayDateString(now, configs.timeZone);
  const articleId = getNextAutomaticArticleId(articlePages, todayDateString);
  const frontMatters: ArticleFrontMatters = {
    publicId: articleId,
    lastUpdatedAt: generateDateTimeString(now, 'UTC'),
  };

  fs.writeFileSync(
    path.join(paths.sourceArticlesRoot, articleId + '.md'),
    [
      // TODO: Want to wrap string variables with double quotes always.
      '---\n' + yaml.safeDump(frontMatters) + '---',
      '',
      '# My First Article & **Bold**\n',
    ].join('\n')
  );

  return Promise.resolve({
    exitCode: 0,
    message: 'Done "article new"',
  });
}
