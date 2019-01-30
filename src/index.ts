import * as fs from 'fs-extra';
import * as path from 'path';

const CONFIGS_FILE_NAME: string = 'ubwconfigs.json';
const RELATIVE_SRC_DIR_PATH: string = 'src';

const RELATIVE_ARTICLE_MARKDOWNS_DIR_PATH: string = 'articles';

export function executeInit(destinationDirPath: string): string {
  fs.ensureDirSync(destinationDirPath);

  const srcDirPath = path.join(destinationDirPath, RELATIVE_SRC_DIR_PATH);
  fs.ensureDirSync(srcDirPath);

  fs.writeFileSync(
    path.join(srcDirPath, CONFIGS_FILE_NAME),
    JSON.stringify(
      {
        blogName: 'Your blog',
      },
      null,
      2
    ) + '\n'
  );

  const articleMarkdownsDirPath = path.join(srcDirPath, RELATIVE_ARTICLE_MARKDOWNS_DIR_PATH);
  fs.ensureDirSync(articleMarkdownsDirPath);

  fs.writeFileSync(
    path.join(articleMarkdownsDirPath, '00000001.md'),
    [
      '# My First Article\n',
    ].join('\n')
  );

  return 'Done init\n';
}

export function executeCompile(): string {
  return 'Done compile\n';
}
