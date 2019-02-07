import * as fs from 'fs-extra';
import * as path from 'path';

import {
  ArticlePage,
  NonArticlePage,
  generateArticlePages,
  generateNonArticlePages,
  initializeArticlePages,
  preprocessArticlePages,
  preprocessNonArticlePages,
} from './lib/page-generator';
import {
  UbwConfigs,
  STATIC_FILES_ROOT,
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

  let articlePages: ArticlePage[] = initializeArticlePages(blogRoot, fs.readdirSync(paths.srcArticlesDirPath))
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

  fs.ensureDirSync(paths.distArticlesDirPath);
  articlePages.forEach(article => {
    fs.writeFileSync(article.outputFilePath, article.htmlSource);
  });
  nonArticlePages.forEach(nonArticlePage => {
    fs.writeFileSync(nonArticlePage.outputFilePath, nonArticlePage.html);
  });

  fs.copySync(
    path.join(STATIC_FILES_ROOT, 'github-markdown.css'),
    path.join(paths.distDirPath, 'github-markdown.css')
  );

  return 'Done compile\n';
}
