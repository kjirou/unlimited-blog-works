//
// TODO:
//   When executing via reqiure("ts-node").register, the following error occurs.
//
//   ```
//   /path/to/unlimited-blog-works/src/lib/markdowns-converter.ts:17
//     return allMarkdownSources.map(markdownSource => {
//                               ^
//   TypeError: unified_1.default is not a function
//   ```
//
//   There is no error when passing through "tsc" command directly
//     (and through "mocha --require ts-settings" command too).
//
//   Give up exact typing and confine the influence into this file.
//
const rehypeDocument = require('rehype-document');
const rehypeRaw = require('rehype-raw');
const rehypeStringify = require('rehype-stringify');
const remarkParse = require('remark-parse');
const remarkRehype = require('remark-rehype');
const unified = require('unified');

export function convert(
  allMarkdownSources: {
    filePath: string,
    source: string,
  }[]
): {
  outputFilePath: string,
  html: string,
}[] {
  // TODO: 全体の情報を先に取得する。
  // ここで生成した markdownSyntaxTrees を後に unified().stringify() で処理する方法が不明だった。
  // 結果として、.md の解析は二回行っている。
  //const markdownSyntaxTrees = allMarkdownSources.map(markdownSource => {
  //  return unified()
  //    .use(remarkParse)
  //    .parse(markdownSource.source);
  //});

  const htmls = allMarkdownSources.map(markdownSource => {
    const htmlInfo = unified()
      .use(remarkParse)
      .use(remarkRehype, {
        allowDangerousHTML: true,
      })
      .use(rehypeRaw)
      .use(rehypeDocument, {
        title: 'This is TITLE',
      })
      .use(rehypeStringify)
      .processSync(markdownSource.source);

    return {
      outputFilePath: '',
      html: htmlInfo.contents,
    };
  });

  return htmls;
}
