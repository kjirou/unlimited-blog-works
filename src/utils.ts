/*
 * This file MUST NOT depend on any file in the project.
 */
import * as path from 'path';
import * as url from 'url';

// Reason for using `require`) https://github.com/marnusw/date-fns-tz/issues/12
const dateFnsTz = require('date-fns-tz');

const PROJECT_ROOT: string = path.join(__dirname, '..');
export const STATIC_FILES_ROOT: string = path.join(PROJECT_ROOT, 'static-files');

const RELATIVE_SOURCE_DIR_PATH: string = 'blog-source';
const RELATIVE_ARTICLES_DIR_PATH: string = 'articles';
const RELATIVE_STATIC_FILES_DIR_PATH: string = 'static-files';

export function toNormalizedAbsolutePath(pathInput: string): string {
  const absolutePath = path.isAbsolute(pathInput) ? pathInput : path.join(process.cwd(), pathInput);
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
  // Used <html lang="{here}">
  language: string,
  // IANA time zone name (e.g. "America/New_York", "Asia/Tokyo")
  timeZone: string,
}

export const defaultUbwConfigs: UbwConfigs = {
  blogName: 'My Blog',
  blogPath: '.',
  publicationPath: './docs',
  language: 'en',
  timeZone: 'UTC',
};

export function generateBlogPaths(blogRoot: string, relativePublicationDirPath: string): {
  sourceRoot: string,
  publicationRoot: string,
  sourceArticlesRoot: string,
  sourceStaticFilesRoot: string,
  publicationArticlesRoot: string,
  publicationStaticFilesRoot: string,
  permalinkRootPath: string,
} {
  const sourceRoot = path.join(blogRoot, RELATIVE_SOURCE_DIR_PATH);
  const publicationRoot = path.join(blogRoot, relativePublicationDirPath);
  const sourceArticlesRoot = path.join(sourceRoot, RELATIVE_ARTICLES_DIR_PATH);
  const sourceStaticFilesRoot = path.join(sourceRoot, RELATIVE_STATIC_FILES_DIR_PATH);
  const publicationArticlesRoot = path.join(publicationRoot, RELATIVE_ARTICLES_DIR_PATH);
  const publicationStaticFilesRoot = path.join(publicationRoot, RELATIVE_STATIC_FILES_DIR_PATH);
  const permalinkRootPath = `/${RELATIVE_ARTICLES_DIR_PATH}`;

  return {
    sourceRoot,
    publicationRoot,
    sourceArticlesRoot,
    sourceStaticFilesRoot,
    publicationArticlesRoot,
    publicationStaticFilesRoot,
    permalinkRootPath,
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