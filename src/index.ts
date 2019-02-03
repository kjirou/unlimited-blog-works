import * as fs from 'fs-extra';
import * as path from 'path';

import {generatePaths} from './lib/constants';
import {
  Article,
  processArticles,
} from './lib/markdowns-processer';

const CONFIGS_FILE_NAME: string = 'ubwconfigs.json';

export function executeInit(repositoryDirPath: string): string {
  const paths = generatePaths(repositoryDirPath);

  fs.ensureDirSync(repositoryDirPath);
  fs.writeFileSync(
    path.join(repositoryDirPath, CONFIGS_FILE_NAME),
    JSON.stringify(
      {
        blogName: 'Your blog',
      },
      null,
      2
    ) + '\n'
  );

  fs.ensureDirSync(paths.srcDirPath);
  fs.ensureDirSync(paths.srcArticlesDirPath);

  fs.writeFileSync(
    path.join(paths.srcArticlesDirPath, '00000001.md'),
    [
      '---',
      'publicId: "00000001"',
      'testValue: "Hello"',
      '---',
      '',
      '# My First Article\n',
    ].join('\n')
  );

  return 'Done init\n';
}

export function executeCompile(configsFilePath: string): string {
  const configs = fs.readJsonSync(configsFilePath);
  const repositoryDirPath = path.dirname(configsFilePath);
  const paths = generatePaths(repositoryDirPath);

  const articles = fs.readdirSync(paths.srcArticlesDirPath)
    .map(relativeSrcArticleFilePath => {
      const articleFilePath = path.join(paths.srcArticlesDirPath, relativeSrcArticleFilePath);
      const articleId = path.basename(articleFilePath, '.md');

      return {
        articleId,
        publicId: '',
        inputFilePath: articleFilePath,
        outputFilePath: '',
        // TODO: articleId を外向けに使わない
        // TODO: GitHub Pages の仕様で拡張子省略可ならその対応
        // TODO: サブディレクトリ対応
        href: `/permalink/${articleId}.html`,
        htmlSource: '',
        markdownSource: fs.readFileSync(articleFilePath).toString(),
      };
    });

  const processedArticles = processArticles(articles, repositoryDirPath);

  fs.ensureDirSync(paths.distArticlesDirPath);
  processedArticles.forEach(article => {
    fs.writeFileSync(article.outputFilePath, article.htmlSource);
  });

  return 'Done compile\n';
}
