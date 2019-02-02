import * as fs from 'fs-extra';
import * as path from 'path';

import {
  Article,
  processArticles,
} from './lib/markdowns-processer';

const CONFIGS_FILE_NAME: string = 'ubwconfigs.json';
const RELATIVE_SRC_DIR_PATH: string = 'src';

const RELATIVE_ARTICLE_MARKDOWNS_DIR_PATH: string = 'articles';

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

  const articleMarkdownsDirPath = path.join(srcDirPath, RELATIVE_ARTICLE_MARKDOWNS_DIR_PATH);
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
  const articleMarkdownsDirPath = path.join(srcDirPath, RELATIVE_ARTICLE_MARKDOWNS_DIR_PATH);

  const articles = fs.readdirSync(articleMarkdownsDirPath)
    .map(relativeArticleMarkdownFilePath => {
      const articleMarkdownFilePath = path.join(articleMarkdownsDirPath, relativeArticleMarkdownFilePath);
      return {
        articleId: path.basename(articleMarkdownFilePath, '.md'),
        inputFilePath: articleMarkdownFilePath,
        outputFilePath: '',
        href: '',
        htmlSource: '',
        markdownSource: fs.readFileSync(articleMarkdownFilePath).toString(),
      };
    });
  const processedArticles = processArticles(articles);
  console.log(processedArticles);

  return 'Done compile\n';
}
