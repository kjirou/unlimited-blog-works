/*
 * This file MUST NOT depend on any file in the project.
 */
import * as path from 'path';
import * as url from 'url';

// Reason for using `require`) https://github.com/marnusw/date-fns-tz/issues/12
const dateFnsTz = require('date-fns-tz');

const RELATIVE_SOURCE_DIR_PATH: string = 'blog-source';
export const RELATIVE_ARTICLES_DIR_PATH: string = 'articles';
const RELATIVE_EXTERNAL_RESOURCES_DIR_PATH: string = 'external-resources';
const RELATIVE_EXTERNAL_RESOURCES_DIRECT_PLACEMENT_DIR_PATH: string = '_direct';

export const PROJECT_ROOT: string = path.join(__dirname, '..');
const PRESETS_ROOT: string = path.join(PROJECT_ROOT, 'presets');
export const PRESETS_EXTERNAL_RESOURCES_ROOT: string =
  path.join(PRESETS_ROOT, RELATIVE_EXTERNAL_RESOURCES_DIR_PATH);

export const CONFIG_FILE_NAME = 'ubw-configs.js';

export function toNormalizedAbsolutePath(pathInput: string, baseAbsolutePath: string): string {
  const absolutePath = path.isAbsolute(pathInput) ? pathInput : path.join(baseAbsolutePath, pathInput);
  return path.normalize(absolutePath);
}

export function permalinksToRelativeUrl(fromPermalink: string, toPermalink: string): string {
  // NOTICE: Originally `path.relative()` should not be used for URLs.
  //         In this time, there is probably no inconsistency, so there is no problem.
  const relativeDir = path.relative(
    path.dirname('.' + fromPermalink),
    path.dirname('.' + toPermalink)
  );
  return path.join(relativeDir, path.basename(toPermalink));
}

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
  // A absolute URL or root-relative URL to the .css
  //
  // This value is used <link rel="{here}"> directly.
  // It becomes disabled if it is set with "".
  cssUrl: string,
  // A absolute URL or root-relative URL to the .js
  //
  // This value is used <script src="{here}"> directly.
  // It becomes disabled if it is set with "".
  jsUrl: string,
  // Used <html lang="{here}">
  language: string,
  // IANA time zone name (e.g. "America/New_York", "Asia/Tokyo")
  timeZone: string,
}

export interface ActualUbwConfigs {
  blogName?: UbwConfigs['blogName'],
  blogPath?: UbwConfigs['blogPath'],
  publicationPath?: UbwConfigs['publicationPath'],
  baseUrl?: UbwConfigs['baseUrl'],
  cssUrl?: UbwConfigs['cssUrl'],
  jsUrl?: UbwConfigs['jsUrl'],
  language?: UbwConfigs['language'],
  timeZone?: UbwConfigs['timeZone'],
}

function createDefaultUbwConfigs(): UbwConfigs {
  return {
    blogName: 'My Blog',
    blogPath: '.',
    publicationPath: './blog-publication',
    baseUrl: '/',
    cssUrl: `/${RELATIVE_EXTERNAL_RESOURCES_DIR_PATH}/index.css`,
    jsUrl: '',
    language: 'en',
    timeZone: 'UTC',
  };
}

export function createInitialUbwConfigs(): ActualUbwConfigs {
  const configs = createDefaultUbwConfigs();
  return {
    blogName: configs.blogName,
    publicationPath: configs.publicationPath,
    baseUrl: configs.baseUrl,
    cssUrl: configs.cssUrl,
    language: configs.language,
    timeZone: configs.timeZone,
  };
}

export function fillWithDefaultUbwConfigs(configs: ActualUbwConfigs): UbwConfigs {
  return Object.assign({}, createDefaultUbwConfigs(), configs);
}

export function generateBlogPaths(blogRoot: string, relativePublicationDirPath: string): {
  sourceRoot: string,
  publicationRoot: string,
  sourceArticlesRoot: string,
  sourceExternalResourcesRoot: string,
  sourceExternalResourcesDirectPlacementRoot: string,
  publicationArticlesRoot: string,
  publicationExternalResourcesRoot: string,
  publicationExternalResourcesDirectPlacementRoot: string,
} {
  const sourceRoot = path.join(blogRoot, RELATIVE_SOURCE_DIR_PATH);
  const publicationRoot = path.join(blogRoot, relativePublicationDirPath);
  const sourceArticlesRoot = path.join(sourceRoot, RELATIVE_ARTICLES_DIR_PATH);
  const sourceExternalResourcesRoot = path.join(sourceRoot, RELATIVE_EXTERNAL_RESOURCES_DIR_PATH);
  const sourceExternalResourcesDirectPlacementRoot =
    path.join(sourceExternalResourcesRoot, RELATIVE_EXTERNAL_RESOURCES_DIRECT_PLACEMENT_DIR_PATH);
  const publicationArticlesRoot = path.join(publicationRoot, RELATIVE_ARTICLES_DIR_PATH);
  const publicationExternalResourcesRoot = path.join(publicationRoot, RELATIVE_EXTERNAL_RESOURCES_DIR_PATH);
  const publicationExternalResourcesDirectPlacementRoot =
    path.join(publicationExternalResourcesRoot, RELATIVE_EXTERNAL_RESOURCES_DIRECT_PLACEMENT_DIR_PATH);

  return {
    sourceRoot,
    publicationRoot,
    sourceArticlesRoot,
    sourceExternalResourcesRoot,
    sourceExternalResourcesDirectPlacementRoot,
    publicationArticlesRoot,
    publicationExternalResourcesRoot,
    publicationExternalResourcesDirectPlacementRoot,
  };
}

export function generateTodayDateString(date: Date, timeZone: string): string {
  return dateFnsTz.format(date, 'YYYYMMdd', {timeZone});
}

export function generateDateTimeString(date: Date, timeZone: string): string {
  return dateFnsTz.format(date, 'YYYY-MM-dd HH:mm:ss', {timeZone});
}

export interface RemarkAstNode {
  type: string,
  value?: string,
  depth?: number,
  children?: RemarkAstNode[],
}

export interface RehypeAstNode {
  type: string,
  tagName: string,
  properties: {
    className?: string[],
  },
  children?: RehypeAstNode[],
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

export function extractPageTitle(node: RemarkAstNode): string {
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
