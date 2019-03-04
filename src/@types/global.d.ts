//
// globals
//

interface RehypeAstNode {
  type: string,
  tagName?: string,
  properties?: {
    [propertyName: string]: string | string[] | boolean,
  },
  value?: string,
  children?: RehypeAstNode[],
}

interface RemarkAstNode {
  type: string,
  value?: string,
  depth?: number,
  children?: RemarkAstNode[],
}
