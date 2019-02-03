import * as path from 'path';

const RELATIVE_SRC_DIR_PATH: string = 'src';
const RELATIVE_DIST_DIR_PATH: string = 'dist';
const RELATIVE_ARTICLES_DIR_PATH: string = 'articles';

export function generatePaths(repositoryDirPath: string): {
  srcDirPath: string,
  distDirPath: string,
  srcArticlesDirPath: string,
  distArticlesDirPath: string,
} {
  const srcDirPath = path.join(repositoryDirPath, RELATIVE_SRC_DIR_PATH);
  const distDirPath = path.join(repositoryDirPath, RELATIVE_DIST_DIR_PATH);
  const srcArticlesDirPath = path.join(srcDirPath, RELATIVE_ARTICLES_DIR_PATH);
  const distArticlesDirPath = path.join(distDirPath, RELATIVE_ARTICLES_DIR_PATH);

  return {
    srcDirPath,
    distDirPath,
    srcArticlesDirPath,
    distArticlesDirPath,
  };
}
