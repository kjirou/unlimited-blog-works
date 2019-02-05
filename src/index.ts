import * as fs from 'fs-extra';
import * as path from 'path';

import {
  ArticlePage,
  NonArticlePage,
  generateArticlePages,
  generateNonArticlePages,
  preprocessArticlePages,
  preprocessNonArticlePages,
} from './lib/page-generator';
import {
  UbwConfigs,
  defaultUbwConfigs,
  generatePaths,
} from './lib/utils';
import TopLayout from './lib/templates/TopLayout';

export function executeInit(blogRoot: string): string {
  const paths = generatePaths(blogRoot);

  fs.ensureDirSync(blogRoot);
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

  const blogRoot = path.dirname(configsFilePath);
  const paths = generatePaths(blogRoot);

  let articlePages: ArticlePage[] = fs.readdirSync(paths.srcArticlesDirPath)
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

  fs.ensureDirSync(paths.distArticlesDirPath);
  articlePages.forEach(article => {
    fs.writeFileSync(article.outputFilePath, article.htmlSource);
  });
  nonArticlePages.forEach(nonArticlePage => {
    fs.writeFileSync(nonArticlePage.outputFilePath, nonArticlePage.html);
  });

  return 'Done compile\n';
}
