//
// globals
//

interface HastscriptAst {
  type: string,
  tagName?: string,
  properties?: {
    [propertyName: string]: string | string[] | number | boolean,
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
  function defaultExport(selector: string): HastscriptAst;
  function defaultExport(selector: string, properties: HastscriptAst['properties']): HastscriptAst;
  function defaultExport(selector: string, children: HastscriptAst[]): HastscriptAst;
  function defaultExport(
    selector: string, properties: HastscriptAst['properties'], children: HastscriptAst[]): HastscriptAst;

  namespace defaultExport {}

  export = defaultExport;
}
