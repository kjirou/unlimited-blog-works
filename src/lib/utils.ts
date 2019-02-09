/*
 * This file MUST NOT depend on any file in the project.
 */
import * as path from 'path';

const PROJECT_ROOT: string = path.join(__dirname, '../..');
export const STATIC_FILES_ROOT: string = path.join(PROJECT_ROOT, 'static-files');

const RELATIVE_SRC_DIR_PATH: string = 'src';
const RELATIVE_DIST_DIR_PATH: string = 'dist';
const RELATIVE_ARTICLES_DIR_PATH: string = 'articles';

export function toNormalizedAbsolutePath(pathInput: string): string {
  const absolutePath = path.isAbsolute(pathInput) ? pathInput : path.join(process.cwd(), pathInput);
  return path.normalize(absolutePath);
}

export function generatePaths(repositoryDirPath: string): {
  srcDirPath: string,
  distDirPath: string,
  srcConfigFilePath: string,
  srcArticlesDirPath: string,
  distArticlesDirPath: string,
  permalinkRootPath: string,
} {
  const srcDirPath = path.join(repositoryDirPath, RELATIVE_SRC_DIR_PATH);
  const distDirPath = path.join(repositoryDirPath, RELATIVE_DIST_DIR_PATH);
  const srcConfigFilePath = path.join(repositoryDirPath, 'ubw-configs.json');
  const srcArticlesDirPath = path.join(srcDirPath, RELATIVE_ARTICLES_DIR_PATH);
  const distArticlesDirPath = path.join(distDirPath, RELATIVE_ARTICLES_DIR_PATH);
  const permalinkRootPath = `/${RELATIVE_ARTICLES_DIR_PATH}`;

  return {
    srcDirPath,
    distDirPath,
    srcConfigFilePath,
    srcArticlesDirPath,
    distArticlesDirPath,
    permalinkRootPath,
  };
}

export interface UbwConfigs {
  blogName: string,
  // A relative path from the ubw-configs.json file to the blog container directory
  blogPath: string,
  // Used <html lang="{here}">
  language: string,
  // IANA time zone name (e.g. "America/New_York", "Asia/Tokyo")
  timeZone: string,
}

export const defaultUbwConfigs: UbwConfigs = {
  blogName: 'My Blog',
  blogPath: '.',
  language: 'en',
  timeZone: 'UTC',
};
