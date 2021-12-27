import {Break, FinderType, DocumentsAnalyzerMap, Node} from "@common/types";

export class BreakNode extends Node {
  astNode: Break;

  constructor(
    astBreak: Break,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(astBreak, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = astBreak;
    // TO-DO: Implement name location for rename
  }

  accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);
    // TO-DO: Method not implemented
    return this;
  }
}
