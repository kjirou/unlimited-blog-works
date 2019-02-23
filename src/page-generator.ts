import * as path from 'path';
import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import * as yaml from 'js-yaml';

import ArticleLayout from './templates/ArticleLayout';
import TopLayout from './templates/TopLayout';
import {
  ArticlePageProps,
  NonArticlePageProps,
} from './templates/shared';
import {
  RELATIVE_ARTICLES_DIR_PATH,
  RELATIVE_EXTERNAL_RESOURCES_DIR_PATH,
  RehypeAstNode,
  RemarkAstNode,
  extractPageTitle,
  generateDateTimeString,
  generateBlogPaths,
} from './utils';

// NOTICE: "unified" set MUST use only in the file
const rehypeAutolinkHeadings = require('rehype-autolink-headings');
const rehypeDocument = require('rehype-document');
const rehypeFormat = require('rehype-format');
const rehypeParse = require('rehype-parse');
const rehypeRaw = require('rehype-raw');
const rehypeSlug = require('rehype-slug');
const rehypeStringify = require('rehype-stringify');
const remarkFrontmatter = require('remark-frontmatter');
const remarkParse = require('remark-parse');
const remarkRehype = require('remark-rehype');
const unified = require('unified');

export interface UbwConfigs {
  blogName: string,
  // A relative path from the ubw-configs.json file to the blog root
  blogPath: string,
  // A relative path from the blog root to the publication directory
  publicationPath: string,
  // A relative URL from the root
  //
  // If you want to place the generated "index.html" at "http://your-host.com/index.html", set "/" to this property.
  // If you want to place in "http://your-host.com/subdir/index.html", set "/subdir/" to this property.
  //
  // In case you are hosting on GitHub,
  // it will be "/" if it is published from the "<username>.github.io" repository,
  // In other cases it will probably be "/<your-repository-name>/".
  baseUrl: string,
  // Absolute or root-relative urls for CSS sources
  //
  // These values are assigned to <link rel="{here}"> directly.
  cssUrls: string[],
  // Absolute or root-relative urls for JavaScript sources
  //
  // These values are assigned to <script src="{here}"> directly.
  // Place these script tags at the end of the body.
  jsUrls: string[],
  generateArticleHeadTags: (articlePages: ArticlePage[], nonArticlePages: NonArticlePage[]) => string[],
  generateNonArticleHeadTags: (articlePages: ArticlePage[], nonArticlePages: NonArticlePage[]) => string[],
  // Used <html lang="{here}">
  language: string,
  // IANA time zone name (e.g. "America/New_York", "Asia/Tokyo")
  timeZone: string,
  // Article pages renderer
  renderArticle: (props: ArticlePageProps) => string,
  // Non-article pages configurations
  nonArticles: {
    // An identifier for user reference
    //
    // For example, when the user wishes to use the existing setting, this value is used for identification.
    nonArticlePageId: string,
    // A relative URL from the "baseUrl"
    url: string,
    // Non-article pages renderer
    render: (props: NonArticlePageProps) => string,
  }[],
}

export interface ActualUbwConfigs extends Partial<UbwConfigs> {
}

export function createDefaultUbwConfigs(): UbwConfigs {
  return {
    blogName: 'My Blog',
    blogPath: '.',
    publicationPath: './blog-publication',
    baseUrl: '/',
    cssUrls: [
      `/${RELATIVE_EXTERNAL_RESOURCES_DIR_PATH}/index.css`,
    ],
    jsUrls: [],
    generateArticleHeadTags() {
      return [];
    },
    generateNonArticleHeadTags() {
      return [];
    },
    language: 'en',
    timeZone: 'UTC',
    renderArticle(props: ArticlePageProps): string {
      return ReactDOMServer.renderToStaticMarkup(React.createElement(ArticleLayout, props));
    },
    nonArticles: [
      {
        nonArticlePageId: 'top',
        url: 'index.html',
        render(props: NonArticlePageProps): string {
          return ReactDOMServer.renderToStaticMarkup(React.createElement(TopLayout, props));
        },
      },
    ],
  };
}

export function createInitialUbwConfigs(): ActualUbwConfigs {
  const configs = createDefaultUbwConfigs();
  return {
    blogName: configs.blogName,
    publicationPath: configs.publicationPath,
    baseUrl: configs.baseUrl,
    cssUrls: configs.cssUrls,
    language: configs.language,
    timeZone: configs.timeZone,
  };
}

export function fillWithDefaultUbwConfigs(configs: ActualUbwConfigs): UbwConfigs {
  return Object.assign({}, createDefaultUbwConfigs(), configs);
}

function createRemarkPlugins(): any[] {
  return [
    [remarkFrontmatter, ['yaml']],
  ];
}

function createRehypePlugins(params: {
  title: string,
  language: string,
  cssUrls: string[],
  jsUrls: string[],
}): any[] {
  const documentOptions: any = {
    title: params.title,
    language: params.language,
    css: params.cssUrls,
  };
  documentOptions.css = params.cssUrls;
  documentOptions.js = params.jsUrls;

  const autolinkContent: RehypeAstNode = {
    type: 'text',
    value: '#',
  };

  return [
    [rehypeRaw],
    [rehypeSlug],
    [rehypeAutolinkHeadings, {
      behavior: 'append',
      content: autolinkContent,
      properties: {
        className: 'ubw-heading-slug',
        ariaHidden: true,
      },
    }],
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
  html: string,
  markdown: string,
  pageTitle: string,
  lastUpdatedAt: Date,
}

export interface NonArticlePage {
  nonArticlePageId: string,
  render: (props: NonArticlePageProps) => string,
  permalink: string,
  outputFilePath: string,
  html: string,
}

export function createArticlePage(): ArticlePage {
  return {
    articleId: '',
    publicId: '',
    inputFilePath: '',
    outputFilePath: '',
    permalink: '',
    html: '',
    markdown: '',
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
      .parse(articlePage.markdown);

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
  const nonArticlesProps = nonArticlePages.reduce((summary, nonArticlePage) => {
    return Object.assign({}, summary, {
      [nonArticlePage.nonArticlePageId]: {
        permalink: nonArticlePage.permalink,
      },
    });
  }, {});

  return articlePages.map(articlePage => {
    const contentHtmlData = unified()
      .use(remarkParse)
      .use(createRemarkPlugins())
      .use(remarkRehype, {
        allowDangerousHTML: true,
      })
      .use(rehypeStringify)
      .processSync(articlePage.markdown);

    const articlePageProps: ArticlePageProps = {
      contentHtml: contentHtmlData.contents,
      lastUpdatedAt: articlePage.lastUpdatedAt,
      formattedLastUpdatedAt: generateDateTimeString(articlePage.lastUpdatedAt, configs.timeZone),
      timeZone: configs.timeZone,
      nonArticles: nonArticlesProps,
    };
    const articleHtml = configs.renderArticle(articlePageProps);

    const unifiedResult = unified()
      .use(rehypeParse, {
        fragment: true,
      })
      .use(createRehypePlugins({
        title: `${articlePage.pageTitle} | ${configs.blogName}`,
        language: configs.language,
        cssUrls: configs.cssUrls || [],
        jsUrls: configs.jsUrls || [],
      }))
      .use(rehypeStringify)
      .processSync(articleHtml);

    return Object.assign({}, articlePage, {
      html: unifiedResult.contents,
    });
  });
}

export function initializeNonArticlePages(
  blogRoot: string,
  configs: UbwConfigs
): NonArticlePage[] {
  const paths = generateBlogPaths(blogRoot, configs.publicationPath);

  return configs.nonArticles.map(nonArticleConfigs => {
    return {
      nonArticlePageId: nonArticleConfigs.nonArticlePageId,
      render: nonArticleConfigs.render,
      permalink: configs.baseUrl + nonArticleConfigs.url,
      outputFilePath: path.join(paths.publicationRoot, nonArticleConfigs.url),
      html: '',
    };
  });
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
      formattedLastUpdatedAt: generateDateTimeString(articlePage.lastUpdatedAt, configs.timeZone),
      pageTitle: articlePage.pageTitle,
      permalink: articlePage.permalink,
    };
  });

  return nonArticlePages.map(nonArticlePage => {
    const nonArticlePageProps: NonArticlePageProps = {
      articles: articlesProps,
      blogName: configs.blogName,
      permalink: nonArticlePage.permalink,
      timeZone: configs.timeZone,
    };
    const html = nonArticlePage.render(nonArticlePageProps);

    const unifiedResult = unified()
      .use(rehypeParse, {
        fragment: true,
      })
      .use(createRehypePlugins({
        title: configs.blogName,
        language: configs.language,
        cssUrls: configs.cssUrls || [],
        jsUrls: configs.jsUrls || [],
      }))
      .use(rehypeStringify)
      .processSync(html);

    return Object.assign({}, nonArticlePage, {
      html: unifiedResult.contents,
    });
  });
}
