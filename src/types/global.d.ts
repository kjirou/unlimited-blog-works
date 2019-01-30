// TODO: How do I include it in `export =`?
interface RemarkAstNode {
  // Type on only the values to be referenced
  type: 'code' | 'html' | 'root',
  value: string,
  position: {
    start: {
      line: number,
      column: number,
      offset: number,
    },
    end: {
      line: number,
      column: number,
      offset: number,
    },
  },
  children?: RemarkAstNode[],
}

declare module 'remark' {
  // Ref) https://www.typescriptlang.org/docs/handbook/declaration-files/templates/global-d-ts.html
  // Ref) http://developer.hatenastaff.com/entry/2016/06/27/140931
  namespace defaultExports {
    function parse(markdownText: string): RemarkAstNode;
  }
  export = defaultExports;
}
