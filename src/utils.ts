/*
 * This file MUST NOT depend on any file in the project.
 */
import {formatToTimeZone} from 'date-fns-timezone';
import * as path from 'path';
import * as url from 'url';

const RELATIVE_SOURCE_DIR_PATH: string = 'blog-source';
export const RELATIVE_ARTICLES_DIR_PATH: string = 'articles';
export const RELATIVE_EXTERNAL_RESOURCES_DIR_PATH: string = 'external-resources';
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

/**
 * It is mainly used to normalize the following last case.
 *
 *   url="https://foo.com/bar"  -> pathname="/bar"
 *   url="https://foo.com/bar/" -> pathname="/bar/"
 *   url="https://foo.com/"     -> pathname="/"
 *   url="https://foo.com"      -> pathname="/" (What's!?)
 */
export function getPathnameWithoutTailingSlash(absoluteUrl: string): string {
  const urlObj = url.parse(absoluteUrl);
  if (typeof urlObj.pathname === 'string') {
    return urlObj.pathname.replace(/\/$/, '');
  }
  throw new Error('An invalid url passed');
}

/**
 * @param path A relative url (e.g. "foo/bar", "./foo/bar") or
 *               slash-started relative url (e.g. "/foo/bar")
 */
export function removeTailingResourceNameFromPath(path: string): string {
  return path.replace(/(\/)?[^/]+$/, '$1');
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

export function generateDateTimeString(date: Date, timeZone: string): string {
  return formatToTimeZone(date, 'YYYY-MM-DD HH:mm:ss', {timeZone});
}

export function generateTodayDateString(date: Date, timeZone: string): string {
  return formatToTimeZone(date, 'YYYYMMDD', {timeZone});
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
