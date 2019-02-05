/*
 * This file MUST NOT depend on any file in the project.
 */
import * as path from 'path';

const RELATIVE_SRC_DIR_PATH: string = 'src';
const RELATIVE_DIST_DIR_PATH: string = 'dist';
const RELATIVE_ARTICLES_DIR_PATH: string = 'articles';

export function generatePaths(repositoryDirPath: string): {
  srcDirPath: string,
  distDirPath: string,
  srcConfigsFilePath: string,
  srcArticlesDirPath: string,
  distArticlesDirPath: string,
  permalinkRootPath: string,
} {
  const srcDirPath = path.join(repositoryDirPath, RELATIVE_SRC_DIR_PATH);
  const distDirPath = path.join(repositoryDirPath, RELATIVE_DIST_DIR_PATH);
  const srcConfigsFilePath = path.join(repositoryDirPath, 'ubw-configs.json');
  const srcArticlesDirPath = path.join(srcDirPath, RELATIVE_ARTICLES_DIR_PATH);
  const distArticlesDirPath = path.join(distDirPath, RELATIVE_ARTICLES_DIR_PATH);
  const permalinkRootPath = `/${RELATIVE_ARTICLES_DIR_PATH}`;

  return {
    srcDirPath,
    distDirPath,
    srcConfigsFilePath,
    srcArticlesDirPath,
    distArticlesDirPath,
    permalinkRootPath,
  };
}

export interface UbwConfigs {
  blogName: string,
  language: string,
}

export const defaultUbwConfigs: UbwConfigs = {
  blogName: 'My Blog',
  language: 'en',
};
