//
// TODO:
//   When executing via reqiure("ts-node").register, the following error occurs.
//
//   ```
//   /path/to/unlimited-blog-works/src/lib/markdowns-converter.ts:17
//     return hoge.map(markdownSource => {
//                 ^
//   TypeError: unified_1.default is not a function
//   ```
//
//   There is no error when passing through "tsc" command directly
//     (and through "mocha --require ts-settings" command too).
//
//   Give up exact typing and confine the influence into this file.
//
const rehypeDocument = require('rehype-document');
const rehypeFormat = require('rehype-format');
const rehypeRaw = require('rehype-raw');
const rehypeStringify = require('rehype-stringify');
const remarkParse = require('remark-parse');
const remarkRehype = require('remark-rehype');
const unified = require('unified');

export interface Article {
  articleId: string,
  inputFilePath: string,
  outputFilePath: string,
  href: string,
  htmlSource: string,
  markdownSource: string,
}

export function processArticles(articles: Article[]): Article[] {
  // TODO: 全体の情報を先に取得する。
  // ここで生成した markdownSyntaxTrees を後に unified().stringify() で処理する方法が不明だった。
  // 結果として、.md の解析は二回行っている。
  //const markdownSyntaxTrees = articles.map(markdownSource => {
  //  return unified()
  //    .use(remarkParse)
  //    .parse(markdownSource.source);
  //});

  const processedArticles = articles.map(article => {
    const htmlInfo = unified()
      .use(remarkParse)
      .use(remarkRehype, {
        allowDangerousHTML: true,
      })
      .use(rehypeRaw)
      .use(rehypeDocument, {
        title: 'This is TITLE',
      })
      .use(rehypeFormat)
      .use(rehypeStringify)
      .processSync(article.markdownSource);

    return Object.assign({}, article, {
      htmlSource: htmlInfo.contents,
    });
  });

  return processedArticles;
}
