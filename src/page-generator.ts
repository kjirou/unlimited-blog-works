import * as hast from 'hastscript';
import * as yaml from 'js-yaml';
import * as path from 'path';
import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import * as urlModule from 'url';

import ArticleLayout from './templates/ArticleLayout';
import TopLayout from './templates/TopLayout';
import {
  ArticlePageProps,
  NonArticlePageProps,
} from './templates/shared';
import {
  RELATIVE_ARTICLES_DIR_PATH,
  RELATIVE_EXTERNAL_RESOURCES_DIR_PATH,
  classifyUrl,
  extractPageTitle,
  generateDateTimeString,
  generateBlogPaths,
  getPathnameWithoutTailingSlash,
  removeTailingResourceNameFromPath,
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
const unistUtilRemove = require('unist-util-remove');
const unistUtilVisit = require('unist-util-visit');

// NOTICE: Its type definition file exists but it is broken.
const Feed = require('feed').Feed;

export interface UbwConfigs {
  // The name of your blog
  //
  // It is used in <title> and so on.
  blogName: string,
  // An absolute url of the blog
  //
  // e.g.
  //   "http://your-host.com"
  //   "http://your-host.com/sub/path"
  //   Notice: Remove "/" of the end
  blogUrl: string,
  // A relative path from the ubw-configs.js file to the blog root
  blogDir: string,
  // A relative path from the blog root to the publication directory
  publicationDir: string,
  // Absolute or root-relative urls for CSS sources
  //
  // These values are assigned to <link rel="{here}"> directly.
  cssUrls: string[],
  // Absolute or root-relative urls for JavaScript sources
  //
  // These values are assigned to <script src="{here}"> directly.
  // Place these script tags at the end of the body.
  jsUrls: string[],
  // Used <html lang="{here}">
  language: string,
  // IANA time zone name (e.g. "America/New_York", "Asia/Tokyo")
  timeZone: string,
  // Easy OGP setting
  //
  // When you pass true, the following settings are made for all articles.
  // - og:title = Set the page name by top heading.
  // - og:type = It is always "website".
  // - og:image = The head image of each article or "defaultOgpImageUrl" or not.
  // - og:url = blogUrl + each page path
  // - og:site_name = blogName
  ogp: boolean,
  // An absolute url to use default og:image for each article
  //
  // It is disabled if it is empty or "ogp" is false.
  defaultOgpImageUrl: string,
  // [Experimental] Additional links the bottom of the top page
  //
  // If you want to hide "Powered by unlimited-blog-works", change this value to empty.
  additionalTopPageLinks: {
    linkText: string,
    href: string,
  }[],
  // Additional tags in <head> on articles
  //
  // Set a callback that returns a list of HAST node.
  // Ref) https://github.com/syntax-tree/hastscript
  generateArticleHeadNodes: (articlesProps: ArticlePageProps) => HastscriptAst[],
  // Additional tags in <head> on non-articles
  //
  // Set a callback that returns a list of HAST node.
  // Ref) https://github.com/syntax-tree/hastscript
  generateNonArticleHeadNodes: (nonArticlePageProps: NonArticlePageProps) => HastscriptAst[],
  // Article pages renderer
  renderArticle: (props: ArticlePageProps) => string,
  // Non-article pages configurations
  nonArticles: {
    // An identifier for user reference
    //
    // For example, when the user wishes to use the existing setting, this value is used for identification.
    nonArticlePageId: string,
    // A relative url from the "blogUrl"
    path: string,
    // Whether "/{path}" is normalized to "/" due to external influences
    pathIsNormalizedToSlash: boolean,
    // Page is output with layout
    //
    // When it is false, the return value of "render" is directly output as a page.
    useLayout: boolean,
    // Non-article pages renderer
    render: (props: NonArticlePageProps) => string,
  }[],
}

export interface ActualUbwConfigs extends Partial<UbwConfigs> {
}

export function createDefaultUbwConfigs(): UbwConfigs {
  return {
    blogName: 'My Blog',
    blogUrl: 'https://example.com',
    blogDir: '.',
    publicationDir: './blog-publication',
    cssUrls: [
      `/${RELATIVE_EXTERNAL_RESOURCES_DIR_PATH}/index.css`,
    ],
    jsUrls: [],
    language: 'en',
    timeZone: 'UTC',
    ogp: true,
    defaultOgpImageUrl: '',
    additionalTopPageLinks: [
      {
        linkText: 'Powered by unlimited-blog-works',
        href: 'https://github.com/kjirou/unlimited-blog-works',
      },
    ],
    generateArticleHeadNodes() {
      return [];
    },
    generateNonArticleHeadNodes() {
      return [];
    },
    renderArticle(props: ArticlePageProps): string {
      return ReactDOMServer.renderToStaticMarkup(React.createElement(ArticleLayout, props));
    },
    nonArticles: [
      {
        nonArticlePageId: 'top',
        path: 'index.html',
        pathIsNormalizedToSlash: true,
        useLayout: true,
        render(props: NonArticlePageProps): string {
          return ReactDOMServer.renderToStaticMarkup(React.createElement(TopLayout, props));
        },
      },
      {
        nonArticlePageId: 'atom-feed',
        path: 'atom-feed.xml',
        pathIsNormalizedToSlash: false,
        useLayout: false,
        render(props: NonArticlePageProps): string {
          const feed = new Feed({
            title: props.blogName,
            id: props.blogUrl,
          });

          props.articles
            .slice()
            .sort((a, b) => {
              return b.lastUpdatedAt.getTime() - a.lastUpdatedAt.getTime();
            })
            .slice(0, 100)
            .forEach(article => {
              feed.addItem({
                title: article.pageTitle,
                id: article.permalink,
                // The "link" field is not required as specification of Atom,
                //   but this "feed" library requests it.
                link: article.permalink,
                date: article.lastUpdatedAt,
              });
            });

          return feed.atom1() + '\n';
        },
      },
    ],
  };
}

export function createInitialUbwConfigs(): ActualUbwConfigs {
  const configs = createDefaultUbwConfigs();
  return {
    blogName: configs.blogName,
    blogUrl: configs.blogUrl,
    publicationDir: configs.publicationDir,
    cssUrls: configs.cssUrls,
    language: configs.language,
    timeZone: configs.timeZone,
  };
}

export function fillWithDefaultUbwConfigs(configs: ActualUbwConfigs): UbwConfigs {
  return Object.assign({}, createDefaultUbwConfigs(), configs);
}

function findFirstImageUrl(node: RemarkAstNode): string {
  let found = '';
  unistUtilVisit(node, (n: any) => {
    if (n.type === 'image') {
      if (n.url) {
        found = n.url;
        return unistUtilVisit.EXIT;
      }
    }
  });
  return found;
}

export function extractOgpDescription(node: RemarkAstNode): string {
  const filtered = unistUtilRemove(node, (n: any) => (
    n.type === 'yaml' ||
    n.type === 'heading' && n.depth === 1 ||
    // NOTE: link を除外しているのは、Slack がチャットでそれを展開してしまうため。
    n.type === 'link' ||
    n.type === 'html' ||
    n.type === 'code'
  )) as RemarkAstNode | null;

  if (filtered === null) {
    return '';
  }

  const words: string[] = [];

  unistUtilVisit(filtered, {type: 'text'}, (n: any) => {
    if (n.value) {
      words.push(n.value);
    }
  });

  const collapsed = words.join(' ')
    .replace(/\s+/g, ' ');

  // NOTE: This is a value based on a miscellaneous investigation.
  const recommendedMaxLength = 90;

  return collapsed.length <= recommendedMaxLength
    ? collapsed
    : collapsed.slice(0, recommendedMaxLength - 3) + '...';
}

function generateOgpNodes(
  title: string,
  image: string,
  url: string,
  siteName: string,
  description: string,
): HastscriptAst[] {
  return [
    hast('meta', {property: 'og:title', content: title}),
    hast('meta', {property: 'og:type', content: 'website'}),
    ...(image !== '' ? [hast('meta', {property: 'og:image', content: image})] : []),
    hast('meta', {property: 'og:url', content: url}),
    hast('meta', {property: 'og:site_name', content: siteName}),
    ...(description !== '' ? [hast('meta', {property: 'og:description', content: description})] : []),
  ];
}

function createRemarkPlugins(): any[] {
  return [
    [remarkFrontmatter, ['yaml']],
  ];
}

/**
 * Generate an unified's transformer that empty a href of <h1>'s autolink
 */
export function generateH1AutolinkHrefReplacementTransformer(
  autolinkMarkerAttributeName: string
): (tree: HastscriptAst) => void {
  return function transformer(tree: HastscriptAst): void {
    unistUtilVisit(tree, {type: 'element', tagName: 'h1'}, function(h1Node: HastscriptAst): void {
      unistUtilVisit(h1Node, {type: 'element', tagName: 'a'}, function(anchorNode: HastscriptAst): void {
        if (anchorNode.properties && anchorNode.properties[autolinkMarkerAttributeName] === true) {
          // NOTE: The empty string will probably work except for IE(<= 10)
          // Ref) https://hail2u.net/blog/coding/empty-href-value.html
          anchorNode.properties.href = '';
        }
      });
    });
  }
};

function createRehypePlugins(params: {
  title: string,
  language: string,
  cssUrls: string[],
  jsUrls: string[],
  additionalHeadNodes: HastscriptAst[],
}): any[] {
  const documentOptions: any = {
    title: params.title,
    language: params.language,
    css: params.cssUrls,
  };
  documentOptions.css = params.cssUrls;
  documentOptions.js = params.jsUrls;
  const additionalHeadNodes = params.additionalHeadNodes;

  const autolinkContent: HastscriptAst = {
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
        // NOTICE: Apply to search with `unist-util-*`. It is not used in HTML.
        dataUbwAutolink: true,
      },
    }],
    function(): any {
      return generateH1AutolinkHrefReplacementTransformer('dataUbwAutolink');
    },
    [rehypeDocument, documentOptions],
    function(): any {
      return function transformer(tree: HastscriptAst): void {
        unistUtilVisit(tree, {type: 'element', tagName: 'head'}, function(node: HastscriptAst): void {
          params.additionalHeadNodes.forEach(nodeInHead => {
            (node.children || []).push(nodeInHead);
          });
        });
      };
    },
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
  rootRelativePath: string,
  permalink: string,
  ogpImageUrl: string,  // "" means that it does not exist.
  ogpDescription: string,  // "" means that it does not exist.
  html: string,
  markdown: string,
  pageTitle: string,
  lastUpdatedAt: Date,
}

export interface NonArticlePage {
  nonArticlePageId: string,
  render: (props: NonArticlePageProps) => string,
  rootRelativePath: string,
  permalink: string,
  outputFilePath: string,
  useLayout: boolean,
  html: string,
}

export function createArticlePage(): ArticlePage {
  return {
    articleId: '',
    publicId: '',
    inputFilePath: '',
    outputFilePath: '',
    rootRelativePath: '',
    permalink: '',
    ogpImageUrl: '',
    ogpDescription: '',
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
  const paths = generateBlogPaths(blogRoot, configs.publicationDir);

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
  const paths = generateBlogPaths(blogRoot, configs.publicationDir);

  // NOTE: .html を生成する際にも .md を Ast にする変換は行なっており、つまりは二度同じことをしている。
  //       これは、unified().parse() で生成した Ast を再利用して .stringify() へ直接渡す方法が不明だったため。
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

    const basePath = getPathnameWithoutTailingSlash(configs.blogUrl);
    const rootRelativePath = `${basePath}/${RELATIVE_ARTICLES_DIR_PATH}/${frontMatters.publicId}.html`;
    const permalink = `${configs.blogUrl}/${RELATIVE_ARTICLES_DIR_PATH}/${frontMatters.publicId}.html`;

    let ogpImageUrl = '';
    if (configs.ogp) {
      ogpImageUrl = configs.defaultOgpImageUrl;
      const foundUrl = findFirstImageUrl(ast);
      if (foundUrl) {
        const urlType = classifyUrl(foundUrl);
        if (urlType === 'absolute') {
          ogpImageUrl = foundUrl;
        } else if (urlType === 'root-relative') {
          ogpImageUrl = `${configs.blogUrl}${foundUrl}`;
        } else if (urlType === 'relative') {
          ogpImageUrl = urlModule.resolve(`${configs.blogUrl}/${RELATIVE_ARTICLES_DIR_PATH}/`, foundUrl);
        }
      }
    }

    const ogpDescription = extractOgpDescription(ast);

    return Object.assign({}, articlePage, {
      outputFilePath: path.join(paths.publicationArticlesRoot, frontMatters.publicId + '.html'),
      rootRelativePath,
      permalink,
      ogpImageUrl,
      ogpDescription,
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
        rootRelativePath: nonArticlePage.rootRelativePath,
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
      blogName: configs.blogName,
      blogUrl: configs.blogUrl,
      contentHtml: contentHtmlData.contents,
      lastUpdatedAt: articlePage.lastUpdatedAt,
      formattedLastUpdatedAt: generateDateTimeString(articlePage.lastUpdatedAt, configs.timeZone),
      timeZone: configs.timeZone,
      nonArticles: nonArticlesProps,
    };
    const articleHtml = configs.renderArticle(articlePageProps);

    const ogpNodes = configs.ogp
      ? generateOgpNodes(
        articlePage.pageTitle,
        articlePage.ogpImageUrl,
        articlePage.permalink,
        configs.blogName,
        articlePage.ogpDescription
      )
      : [];

    const unifiedResult = unified()
      .use(rehypeParse, {
        fragment: true,
      })
      .use(createRehypePlugins({
        title: `${articlePage.pageTitle} | ${configs.blogName}`,
        language: configs.language,
        cssUrls: configs.cssUrls,
        jsUrls: configs.jsUrls,
        additionalHeadNodes: [
          ...ogpNodes,
          ...configs.generateArticleHeadNodes(articlePageProps),
        ],
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
  const paths = generateBlogPaths(blogRoot, configs.publicationDir);
  const basePath = getPathnameWithoutTailingSlash(configs.blogUrl);

  return configs.nonArticles.map(nonArticleConfigs => {
    const blogRootRelativePath = nonArticleConfigs.pathIsNormalizedToSlash
      ? removeTailingResourceNameFromPath(nonArticleConfigs.path)
      : nonArticleConfigs.path;

    return {
      nonArticlePageId: nonArticleConfigs.nonArticlePageId,
      render: nonArticleConfigs.render,
      rootRelativePath: basePath + '/' + blogRootRelativePath,
      permalink: configs.blogUrl + '/' + blogRootRelativePath,
      outputFilePath: path.join(paths.publicationRoot, nonArticleConfigs.path),
      useLayout: nonArticleConfigs.useLayout,
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
  const paths = generateBlogPaths(blogRoot, configs.publicationDir);

  const articlesProps = articlePages.map(articlePage => {
    return {
      articleId: articlePage.articleId,
      lastUpdatedAt: articlePage.lastUpdatedAt,
      formattedLastUpdatedAt: generateDateTimeString(articlePage.lastUpdatedAt, configs.timeZone),
      pageTitle: articlePage.pageTitle,
      permalink: articlePage.permalink,
      rootRelativePath: articlePage.rootRelativePath,
    };
  });
  const nonArticlesProps = nonArticlePages.map(nonArticlePage => {
    return {
      id: nonArticlePage.nonArticlePageId,
      permalink: nonArticlePage.permalink,
      rootRelativePath: nonArticlePage.rootRelativePath,
    };
  });

  return nonArticlePages.map(nonArticlePage => {
    const nonArticlePageProps: NonArticlePageProps = {
      additionalTopPageLinks: configs.additionalTopPageLinks,
      articles: articlesProps,
      blogName: configs.blogName,
      blogUrl: configs.blogUrl,
      nonArticles: nonArticlesProps,
      permalink: nonArticlePage.permalink,
      rootRelativePath: nonArticlePage.rootRelativePath,
      timeZone: configs.timeZone,
    };
    let html = nonArticlePage.render(nonArticlePageProps);

    if (nonArticlePage.useLayout) {
      const ogpNodes = configs.ogp
        ? generateOgpNodes(
          configs.blogName,
          configs.defaultOgpImageUrl,
          nonArticlePage.permalink,
          configs.blogName,
          ''
        )
        : [];

      const unifiedResult = unified()
        .use(rehypeParse, {
          fragment: true,
        })
        .use(createRehypePlugins({
          title: configs.blogName,
          language: configs.language,
          cssUrls: configs.cssUrls,
          jsUrls: configs.jsUrls,
          additionalHeadNodes: [
            ...ogpNodes,
            ...configs.generateNonArticleHeadNodes(nonArticlePageProps),
          ]
        }))
        .use(rehypeStringify)
        .processSync(html);

      html = unifiedResult.contents;
    }

    return Object.assign({}, nonArticlePage, {
      html,
    });
  });
}
