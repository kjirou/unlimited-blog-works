//
// globals
//

interface HastscriptAst {
  type: string,
  tagName?: string,
  properties?: {
    [propertyName: string]: string | string[] | boolean,
  },
  value?: string,
  children?: HastscriptAst[],
}

interface RemarkAstNode {
  type: string,
  value?: string,
  depth?: number,
  children?: RemarkAstNode[],
}


//
// modules
//

declare module 'hastscript' {
  function defaultExport(
    tag: string,
    attributes: {
      [attributeName: string]: string,
    },
    test?: string
  ): HastscriptAst;

  namespace defaultExport {}

  export = defaultExport;
}
