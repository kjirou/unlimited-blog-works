import * as path from 'path';
import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import * as yaml from 'js-yaml';

import ArticleLayout from './templates/ArticleLayout';
import {NonArticlePageProps} from './templates/shared';
import {
  RELATIVE_ARTICLES_DIR_PATH,
  RehypeAstNode,
  RemarkAstNode,
  UbwConfigs,
  extractPageTitle,
  generateBlogPaths,
} from './utils';

// NOTICE: "unified" set MUST use only in the file
const rehypeDocument = require('rehype-document');
const rehypeFormat = require('rehype-format');
const rehypeParse = require('rehype-parse');
const rehypeRaw = require('rehype-raw');
const rehypeStringify = require('rehype-stringify');
const remarkFrontmatter = require('remark-frontmatter');
const remarkParse = require('remark-parse');
const remarkRehype = require('remark-rehype');
const unified = require('unified');

function createRemarkPlugins(): any[] {
  return [
    [remarkFrontmatter, ['yaml']],
  ];
}

function createRehypePlugins(params: {
  title: string,
  language: string,
  cssUrl: string,
  jsUrl: string,
}): any[] {
  const documentOptions: any = {
    title: params.title,
    language: params.language,
  };
  if (params.cssUrl) {
    documentOptions.css = params.cssUrl;
  }
  if (params.jsUrl) {
    documentOptions.js = params.jsUrl;
  }

  return [
    [rehypeRaw],
    [rehypeDocument, documentOptions],
    [rehypeFormat],
  ];
}

interface ArticleFrontMatters {
  // Last updated date time, time zone is "UTC"
  // e.g. "2019-12-31 23:59:59"
  lastUpdatedAt: string,
  publicId: string,
}

interface ActualArticleFrontMatters extends Partial<ArticleFrontMatters> {
  lastUpdatedAt: ArticleFrontMatters['lastUpdatedAt'],
  publicId: ArticleFrontMatters['publicId'],
}

function createDefaultArticleFrontMatters() {
  return {
    lastUpdatedAt: '',
    publicId: '',
  };
}

export function createInitialArticleFrontMatters(
  publicId: ArticleFrontMatters['publicId'],
  lastUpdatedAt: ArticleFrontMatters['lastUpdatedAt'],
) {
  return {
    publicId,
    lastUpdatedAt,
  };
}

function fillWithDefaultArticleFrontMatters(actualFrontMatters: ActualArticleFrontMatters) {
  return Object.assign({}, createDefaultArticleFrontMatters(), actualFrontMatters);
}

export interface ArticlePage {
  articleId: string,
  publicId: string,
  inputFilePath: string,
  outputFilePath: string,
  permalink: string,
  htmlSource: string,
  markdownSource: string,
  pageTitle: string,
  lastUpdatedAt: Date,
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
    pageTitle: '',
    lastUpdatedAt: new Date(1970, 0, 1),  // Dummy
  };
}

export function initializeArticlePages(
  blogRoot: string,
  configs: UbwConfigs,
  articleFileNames: string[]
): ArticlePage[] {
  const paths = generateBlogPaths(blogRoot, configs.publicationPath);

  return articleFileNames.map(articleFileName => {
    const articleFilePath = path.join(paths.sourceArticlesRoot, articleFileName);

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

export function preprocessArticlePages(
  blogRoot: string,
  configs: UbwConfigs,
  articlePages: ArticlePage[]
): ArticlePage[] {
  const paths = generateBlogPaths(blogRoot, configs.publicationPath);

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
    const actualFrontMatters = yaml.safeLoad(frontMattersNode.value) as ActualArticleFrontMatters;
    const frontMatters = fillWithDefaultArticleFrontMatters(actualFrontMatters);

    const permalink = `${configs.baseUrl}${RELATIVE_ARTICLES_DIR_PATH}/${frontMatters.publicId}.html`;

    return Object.assign({}, articlePage, {
      // TODO: GitHub Pages の仕様で拡張子省略可ならその対応
      outputFilePath: path.join(paths.publicationArticlesRoot, frontMatters.publicId + '.html'),
      permalink,
      pageTitle: extractPageTitle(ast),
      lastUpdatedAt: new Date(frontMatters.lastUpdatedAt),
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
    const contentHtmlData = unified()
      .use(remarkParse)
      .use(createRemarkPlugins())
      .use(remarkRehype, {
        allowDangerousHTML: true,
      })
      .use(rehypeStringify)
      .processSync(articlePage.markdownSource);

    const articleHtml = ReactDOMServer.renderToStaticMarkup(
      React.createElement(ArticleLayout, {
        contentHtml: contentHtmlData.contents,
        lastUpdatedAt: articlePage.lastUpdatedAt,
        timeZone: configs.timeZone,
      })
    );

    const unifiedResult = unified()
      .use(rehypeParse, {
        fragment: true,
      })
      .use(createRehypePlugins({
        title: `${articlePage.pageTitle} | ${configs.blogName}`,
        language: configs.language,
        cssUrl: configs.cssUrl || '',
        jsUrl: configs.jsUrl || '',
      }))
      .use(rehypeStringify)
      .processSync(articleHtml);

    return Object.assign({}, articlePage, {
      htmlSource: unifiedResult.contents,
    });
  });
}

export interface NonArticlePage {
  render: (props: NonArticlePageProps) => string,
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
  const paths = generateBlogPaths(blogRoot, configs.publicationPath);

  const articlesProps: NonArticlePageProps['articles'] = articlePages.map(articlePage => {
    return {
      articleId: articlePage.articleId,
      lastUpdatedAt: articlePage.lastUpdatedAt,
      pageTitle: articlePage.pageTitle,
      permalink: articlePage.permalink,
    };
  });

  return nonArticlePages.map(nonArticlePage => {
    const html = nonArticlePage.render({
      articles: articlesProps,
      blogName: configs.blogName,
      permalink: nonArticlePage.permalink,
      timeZone: configs.timeZone,
    });

    const unifiedResult = unified()
      .use(rehypeParse, {
        fragment: true,
      })
      .use(createRehypePlugins({
        title: configs.blogName,
        language: configs.language,
        cssUrl: configs.cssUrl || '',
        jsUrl: configs.jsUrl || '',
      }))
      .use(rehypeStringify)
      .processSync(html);

    return Object.assign({}, nonArticlePage, {
      outputFilePath: path.join(paths.publicationRoot, nonArticlePage.relativeOutputFilePath),
      html: unifiedResult.contents,
    });
  });
}
