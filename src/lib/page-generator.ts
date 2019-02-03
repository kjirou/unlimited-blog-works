import * as path from 'path';
import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import * as yaml from 'js-yaml';

import TopPage from './templates/TopPage';
import {NonArticlePageProps} from './templates/shared';
import {
  UbwConfigs,
  generatePaths,
} from './utils';

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
const rehypeParse = require('rehype-parse');
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
  pageName: string,
}

interface ArticleFrontMatters {
  publicId: string,
  pageName?: string,
}

interface RemarkAstNode {
  type: string,
  value?: string,
  depth?: number,
  children?: RemarkAstNode[],
}

function createRemarkPlugins(): any[] {
  return [
    [remarkFrontmatter, ['yaml']],
  ];
}

function createRehypePlugins(): any[] {
  return [
    [rehypeRaw],
    [rehypeDocument, {
      title: 'This is TITLE',
    }],
    [rehypeFormat],
  ];
}

export function scanRemarkAstNode(
  node: RemarkAstNode,
  callback: (node: RemarkAstNode) => void
): void {
  callback(node);
  if (node.children) {
    node.children.forEach(childNode => {
      scanRemarkAstNode(childNode, callback);
    });
  }
}

export function extractPageName(node: RemarkAstNode): string {
  const fragments: string[] = [];
  scanRemarkAstNode(node, (heading1Node) => {
    if (heading1Node.type === 'heading' && heading1Node.depth === 1) {
      scanRemarkAstNode(heading1Node, (node_) => {
        const trimmed = (node_.value || '').trim();
        if (trimmed) {
          fragments.push(trimmed);
        }
      });
    }
  });
  return fragments.join(' ');
}

export function processArticles(
  repositoryDirPath: string,
  configs: UbwConfigs,
  articles: Article[]
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
      pageName: frontMatters.pageName ? frontMatters.pageName : extractPageName(ast),
    });
  });

  const rehypePlugins = createRehypePlugins();

  const processedArticles: Article[] = preprocessedArticles.map(article => {
    const htmlInfo = unified()
      .use(remarkParse)
      .use(createRemarkPlugins())
      .use(remarkRehype, {
        allowDangerousHTML: true,
      })
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

interface NonArticlePage {
  component: React.ComponentClass<NonArticlePageProps>,
  relativeOutputFilePath: string,
  outputFilePath: string,
  html: string,
}

export function generateNonArticlePages(
  repositoryDirPath: string,
  configs: UbwConfigs,
  articles: Article[]
): NonArticlePage[] {
  const paths = generatePaths(repositoryDirPath);

  const nonArticlePages: NonArticlePage[] = [
    {
      component: TopPage,
      relativeOutputFilePath: 'index.html',
      outputFilePath: '',
      html: '',
    },
  ];

  const articlesProps: NonArticlePageProps['articles'] = articles.map(article => {
    return {
      articleId: article.articleId,
      pageName: article.pageName,
      permalink: article.permalink,
    };
  });

  const processedNonArticlePages: NonArticlePage[] = nonArticlePages.map(nonArticlePage => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(nonArticlePage.component, {
        articles: articlesProps,
      })
    );

    const unifiedResult = unified()
      .use(rehypeParse, {
        fragment: true,
      })
      .use(createRehypePlugins())
      .use(rehypeStringify)
      .processSync(html);

    return Object.assign({}, nonArticlePage, {
      outputFilePath: path.join(paths.distDirPath, nonArticlePage.relativeOutputFilePath),
      html: unifiedResult.contents,
    });
  });

  return processedNonArticlePages;
}
