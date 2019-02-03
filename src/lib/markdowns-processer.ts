import * as path from 'path';
import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import * as yaml from 'js-yaml';

import TopPage from './templates/TopPage';
import {generatePaths} from './utils';

//
// TODO:
//   When executing via reqiure("ts-node").register, the following error occurs.
//
//   ```
//   /path/to/unlimited-blog-works/src/lib/markdowns-converter.ts:17
//     return hoge.map(markdownSource => {
//                 ^
//   TypeError: unified_1.default is not a function
//   ```
//
//   There is no error when passing through "tsc" command directly
//     (and through "mocha --require ts-settings" command too).
//
//   Give up exact typing and confine the influence into this file.
//
const rehypeDocument = require('rehype-document');
const rehypeFormat = require('rehype-format');
const rehypeRaw = require('rehype-raw');
const rehypeStringify = require('rehype-stringify');
const remarkFrontmatter = require('remark-frontmatter');
const remarkParse = require('remark-parse');
const remarkRehype = require('remark-rehype');
const unified = require('unified');

export interface Article {
  articleId: string,
  publicId: string,
  inputFilePath: string,
  outputFilePath: string,
  permalink: string,
  htmlSource: string,
  markdownSource: string,
}

interface ArticleFrontMatters {
  publicId: string,
}

function createRemarkPlugins(): any[] {
  return [
    [remarkFrontmatter, ['yaml']],
  ];
}

function createRehypePlugins(): any[] {
  return [
    [remarkRehype, {
      allowDangerousHTML: true,
    }],
    [rehypeRaw],
    [rehypeDocument, {
      title: 'This is TITLE',
    }],
    [rehypeFormat],
  ];
}

export function processArticles(
  articles: Article[],
  repositoryDirPath: string
): Article[] {
  const paths = generatePaths(repositoryDirPath);

  // ここで生成した Markdown の Syntax Tree を再利用して unified().stringify() で処理する方法が不明だった。
  // 結果として、.md の解析は二回行っている。
  const preprocessedArticles: Article[] = articles.map(article => {
    const ast = unified()
      .use(remarkParse)
      .use(createRemarkPlugins())
      .parse(article.markdownSource);

    const frontMattersNode = ast.children[0];
    if (frontMattersNode.type !== 'yaml') {
      throw new Error('Can not find a Front-matter block in an article.');
    }
    const frontMatters = yaml.safeLoad(frontMattersNode.value) as ArticleFrontMatters;

    return Object.assign({}, article, {
      // TODO: GitHub Pages の仕様で拡張子省略可ならその対応
      // TODO: サブディレクトリ対応
      outputFilePath: path.join(paths.distArticlesDirPath, frontMatters.publicId + '.html'),
      permalink: `${paths.permalinkRootPath}/${frontMatters.publicId}.html`,
    });
  });
  console.log(preprocessedArticles);

  const rehypePlugins = createRehypePlugins();

  const processedArticles: Article[] = preprocessedArticles.map(article => {
    const htmlInfo = unified()
      .use(remarkParse)
      .use(createRemarkPlugins())
      .use(() => {
        return (tree: object[], file: object) => {
          console.log('====  Debug Transformer  ====');
          console.log(tree);
          //console.log(JSON.stringify(tree, null, 2));
          console.log('==== /Debug Transformer  ====');
        };
      })
      .use(rehypePlugins)
      .use(rehypeStringify)
      .processSync(article.markdownSource);

    return Object.assign({}, article, {
      htmlSource: htmlInfo.contents,
    });
  });

  return processedArticles;
}

export function processFramePages(
  articles: Article[],
  repositoryDirPath: string
): {}[] {
  const output = ReactDOMServer.renderToStaticMarkup(React.createElement(TopPage));
  console.log(output);
  return [];
}
