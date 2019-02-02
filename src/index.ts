import * as fs from 'fs-extra';
import * as path from 'path';

import {
  Article,
  processArticles,
} from './lib/markdowns-processer';

const CONFIGS_FILE_NAME: string = 'ubwconfigs.json';
const RELATIVE_SRC_DIR_PATH: string = 'src';
const RELATIVE_DIST_DIR_PATH: string = 'dist';
const RELATIVE_ARTICLES_DIR_PATH: string = 'articles';

export function executeInit(destinationDirPath: string): string {
  fs.ensureDirSync(destinationDirPath);
  fs.writeFileSync(
    path.join(destinationDirPath, CONFIGS_FILE_NAME),
    JSON.stringify(
      {
        blogName: 'Your blog',
      },
      null,
      2
    ) + '\n'
  );

  const srcDirPath = path.join(destinationDirPath, RELATIVE_SRC_DIR_PATH);
  fs.ensureDirSync(srcDirPath);

  const articleMarkdownsDirPath = path.join(srcDirPath, RELATIVE_ARTICLES_DIR_PATH);
  fs.ensureDirSync(articleMarkdownsDirPath);

  fs.writeFileSync(
    path.join(articleMarkdownsDirPath, '00000001.md'),
    [
      '# My First Article\n',
    ].join('\n')
  );

  return 'Done init\n';
}

export function executeCompile(configsFilePath: string): string {
  const configs = fs.readJsonSync(configsFilePath);
  const repositoryDirPath = path.dirname(configsFilePath);
  const srcDirPath = path.join(repositoryDirPath, RELATIVE_SRC_DIR_PATH);
  const distDirPath = path.join(repositoryDirPath, RELATIVE_DIST_DIR_PATH);
  const srcArticlesDirPath = path.join(srcDirPath, RELATIVE_ARTICLES_DIR_PATH);
  const distArticlesDirPath = path.join(distDirPath, RELATIVE_ARTICLES_DIR_PATH);

  const articles = fs.readdirSync(srcArticlesDirPath)
    .map(relativeArticleMarkdownFilePath => {
      const articleMarkdownFilePath = path.join(srcArticlesDirPath, relativeArticleMarkdownFilePath);
      const articleId = path.basename(articleMarkdownFilePath, '.md');
      return {
        articleId,
        inputFilePath: articleMarkdownFilePath,
        // TODO: articleId を外向けに使わない
        outputFilePath: path.join(distArticlesDirPath, articleId + '.html'),
        // TODO: articleId を外向けに使わない
        // TODO: GitHub Pages の仕様で拡張子省略可ならその対応
        // TODO: サブディレクトリ対応
        href: `/${RELATIVE_ARTICLES_DIR_PATH}/${articleId}.html`,
        htmlSource: '',
        markdownSource: fs.readFileSync(articleMarkdownFilePath).toString(),
      };
    });

  const processedArticles = processArticles(articles);

  fs.ensureDirSync(distArticlesDirPath);
  processedArticles.forEach(article => {
    fs.writeFileSync(article.outputFilePath, article.htmlSource);
  });

  return 'Done compile\n';
}
