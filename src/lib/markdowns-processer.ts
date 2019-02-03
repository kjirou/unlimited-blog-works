import * as yaml from 'js-yaml';

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
const remarkFrontmatter = require('remark-frontmatter');
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
  function createMarkdownParser(): any {
    return unified()
      .use(remarkParse)
      .use(remarkFrontmatter, ['yaml']);
  }

  // ここで生成した Markdown の Syntax Tree を再利用して unified().stringify() で処理する方法が不明だった。
  // 結果として、.md の解析は二回行っている。
  const preprocessedArticles = articles.map(article => {
    const ast = createMarkdownParser()
      .parse(article.markdownSource);

    const frontMatterNode = ast.children[0];
    if (frontMatterNode.type !== 'yaml') {
      throw new Error('Can not find a Front-matter block in an article.');
    }
    const frontMatters = yaml.safeLoad(frontMatterNode.value);

    return article;
  });

  const processedArticles = preprocessedArticles.map(article => {
    const htmlInfo = createMarkdownParser()
      .use(() => {
        return (tree: object[], file: object) => {
          console.log('====  Debug Transformer  ====');
          console.log(tree);
          //console.log(JSON.stringify(tree, null, 2));
          console.log('==== /Debug Transformer  ====');
        };
      })
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
