import * as fs from 'fs-extra';
import * as path from 'path';

import {
  Article,
  generateArticles,
  generateNonArticlePages,
  preprocessArticles,
} from './lib/page-generator';
import {
  UbwConfigs,
  defaultUbwConfigs,
  generatePaths,
} from './lib/utils';

export function executeInit(repositoryDirPath: string): string {
  const paths = generatePaths(repositoryDirPath);

  fs.ensureDirSync(repositoryDirPath);
  fs.writeFileSync(
    paths.srcConfigsFilePath,
    JSON.stringify(defaultUbwConfigs, null, 2) + '\n'
  );

  fs.ensureDirSync(paths.srcDirPath);
  fs.ensureDirSync(paths.srcArticlesDirPath);

  fs.writeFileSync(
    path.join(paths.srcArticlesDirPath, '00000001.md'),
    [
      '---',
      'publicId: "00000001"',
      '---',
      '',
      '# My First Article & **Bold**\n',
    ].join('\n')
  );

  return 'Done init\n';
}

export function executeCompile(configsFilePath: string): string {
  const rawConfigs = fs.readJsonSync(configsFilePath);
  const configs = Object.assign({}, defaultUbwConfigs, rawConfigs) as UbwConfigs;

  const repositoryDirPath = path.dirname(configsFilePath);
  const paths = generatePaths(repositoryDirPath);

  let articles = fs.readdirSync(paths.srcArticlesDirPath)
    .map(relativeSrcArticleFilePath => {
      const articleFilePath = path.join(paths.srcArticlesDirPath, relativeSrcArticleFilePath);

      return {
        articleId: path.basename(articleFilePath, '.md'),
        publicId: '',
        inputFilePath: articleFilePath,
        outputFilePath: '',
        permalink: '',
        htmlSource: '',
        markdownSource: fs.readFileSync(articleFilePath).toString(),
        pageName: '',
      };
    });

  articles = preprocessArticles(repositoryDirPath, configs, articles);

  articles = generateArticles(repositoryDirPath, configs, articles);
  const nonArticlePages = generateNonArticlePages(repositoryDirPath, configs, articles);

  fs.ensureDirSync(paths.distArticlesDirPath);
  articles.forEach(article => {
    fs.writeFileSync(article.outputFilePath, article.htmlSource);
  });
  nonArticlePages.forEach(nonArticlePage => {
    fs.writeFileSync(nonArticlePage.outputFilePath, nonArticlePage.html);
  });

  return 'Done compile\n';
}
