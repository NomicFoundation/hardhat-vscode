import {
  HexLiteral,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class HexLiteralNode extends Node {
  public astNode: HexLiteral;

  constructor(
    hexLiteral: HexLiteral,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(hexLiteral, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = hexLiteral;
    // TO-DO: Implement name location for rename
  }

  public accept(
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
