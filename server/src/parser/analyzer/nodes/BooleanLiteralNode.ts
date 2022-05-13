import {
  BooleanLiteral,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class BooleanLiteralNode extends Node {
  public astNode: BooleanLiteral;

  constructor(
    booleanLiteral: BooleanLiteral,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(booleanLiteral, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = booleanLiteral;
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
