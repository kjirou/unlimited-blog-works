import * as path from 'path';
import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import * as yaml from 'js-yaml';

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

interface RemarkAstNode {
  type: string,
  value?: string,
  depth?: number,
  children?: RemarkAstNode[],
}

interface RehypeAstNode {
  type: string,
  tagName: string,
  properties: {
    className?: string[],
  },
  children?: RehypeAstNode[],
}

function createRemarkPlugins(): any[] {
  return [
    [remarkFrontmatter, ['yaml']],
  ];
}

function createRehypePlugins(params: {
  title: string,
  language: string,
}): any[] {
  return [
    [rehypeRaw],
    [() => {
      return function transformer(tree: RehypeAstNode): void {
        const mainContents = tree.children;
        tree.children = [
          {
            type: 'element',
            tagName: 'div',
            properties: {
              className: ['markdown-body'],
            },
            children: mainContents,
          },
        ];
      };
    }],
    [rehypeDocument, {
      title: params.title,
      language: params.language,
      css: '/github-markdown.css',
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

export interface ArticlePage {
  articleId: string,
  publicId: string,
  inputFilePath: string,
  outputFilePath: string,
  permalink: string,
  htmlSource: string,
  markdownSource: string,
  pageName: string,
}

export function createArticlePage(): ArticlePage {
  return {
    articleId: '',
    publicId: '',
    inputFilePath: '',
    outputFilePath: '',
    permalink: '',
    htmlSource: '',
    markdownSource: '',
    pageName: '',
  };
}

export function initializeArticlePages(
  blogRoot: string,
  articleFileNames: string[]
): ArticlePage[] {
  const paths = generatePaths(blogRoot);

  return articleFileNames.map(articleFileName => {
    const articleFilePath = path.join(paths.srcArticlesDirPath, articleFileName);

    return Object.assign(createArticlePage(), {
      articleId: path.basename(articleFilePath, '.md'),
      inputFilePath: articleFilePath,
    });
  });
}

// e.g. "20191231-0001"
// Each part is called "{dateString}-{serialString}".
const AUTOMATIC_ARTICLE_ID = /^(\d{8})-(\d{4})$/;

export function getNextAutomaticArticleId(
  articlePages: ArticlePage[],
  dateString: string
): string {
  let lastSerial = 0;
  articlePages.forEach(articlePage => {
    const matched = AUTOMATIC_ARTICLE_ID.exec(articlePage.articleId);
    if (matched !== null && matched[1] === dateString) {
      const foundSerial = parseInt(matched[2]);
      if (foundSerial >= lastSerial) {
        lastSerial = foundSerial;
      }
    }
  });
  return `${dateString}-${(lastSerial + 1).toString().padStart(4, '0')}`;
}

interface ArticleFrontMatters {
  publicId: string,
  pageName?: string,
}

export function preprocessArticlePages(
  blogRoot: string,
  configs: UbwConfigs,
  articlePages: ArticlePage[]
): ArticlePage[] {
  const paths = generatePaths(blogRoot);

  // NOTE: unified().parse() で生成した Syntax Tree を再利用して、
  //       unified().stringify() で処理する方法が不明だった。
  return articlePages.map(articlePage => {
    const ast = unified()
      .use(remarkParse)
      .use(createRemarkPlugins())
      .parse(articlePage.markdownSource);

    const frontMattersNode = ast.children[0];
    if (frontMattersNode.type !== 'yaml') {
      throw new Error('Can not find a Front-matter block in an articlePage.');
    }
    const frontMatters = yaml.safeLoad(frontMattersNode.value) as ArticleFrontMatters;

    return Object.assign({}, articlePage, {
      // TODO: GitHub Pages の仕様で拡張子省略可ならその対応
      // TODO: サブディレクトリ対応
      outputFilePath: path.join(paths.distArticlesDirPath, frontMatters.publicId + '.html'),
      permalink: `${paths.permalinkRootPath}/${frontMatters.publicId}.html`,
      pageName: frontMatters.pageName ? frontMatters.pageName : extractPageName(ast),
    });
  });
}

export function generateArticlePages(
  blogRoot: string,
  configs: UbwConfigs,
  articlePages: ArticlePage[],
  nonArticlePages: NonArticlePage[]
): ArticlePage[] {
  return articlePages.map(articlePage => {
    // TODO: Assign each article into layout
    const htmlData = unified()
      .use(remarkParse)
      .use(createRemarkPlugins())
      .use(remarkRehype, {
        allowDangerousHTML: true,
      })
      .use(() => {
        return (tree: object[], file: object) => {
          return;
          console.log('====  Debug Transformer  ====');
          console.log(tree);
          //console.log(JSON.stringify(tree, null, 2));
          console.log('==== /Debug Transformer  ====');
        };
      })
      .use(createRehypePlugins({
        title: `${articlePage.pageName} | ${configs.blogName}`,
        language: configs.language,
      }))
      .use(rehypeStringify)
      .processSync(articlePage.markdownSource);

    return Object.assign({}, articlePage, {
      htmlSource: htmlData.contents,
    });
  });
}

export interface NonArticlePage {
  layoutComponent: React.ComponentClass<NonArticlePageProps>,
  relativeOutputFilePath: string,
  permalink: string,
  outputFilePath: string,
  html: string,
}

export function preprocessNonArticlePages(
  blogRoot: string,
  configs: UbwConfigs,
  nonArticlePages: NonArticlePage[]
): NonArticlePage[] {
  return nonArticlePages;
}

export function generateNonArticlePages(
  blogRoot: string,
  configs: UbwConfigs,
  articlePages: ArticlePage[],
  nonArticlePages: NonArticlePage[]
): NonArticlePage[] {
  const paths = generatePaths(blogRoot);

  const articlesProps: NonArticlePageProps['articles'] = articlePages.map(articlePage => {
    return {
      articleId: articlePage.articleId,
      pageName: articlePage.pageName,
      permalink: articlePage.permalink,
    };
  });

  return nonArticlePages.map(nonArticlePage => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(nonArticlePage.layoutComponent, {
        articles: articlesProps,
      })
    );

    const unifiedResult = unified()
      .use(rehypeParse, {
        fragment: true,
      })
      .use(createRehypePlugins({
        title: configs.blogName,
        language: configs.language,
      }))
      .use(rehypeStringify)
      .processSync(html);

    return Object.assign({}, nonArticlePage, {
      outputFilePath: path.join(paths.distDirPath, nonArticlePage.relativeOutputFilePath),
      html: unifiedResult.contents,
    });
  });
}
