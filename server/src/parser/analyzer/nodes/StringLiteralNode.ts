import {
  StringLiteral,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class StringLiteralNode extends Node {
  public astNode: StringLiteral;

  constructor(
    stringLiteral: StringLiteral,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(stringLiteral, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = stringLiteral;
    // TO-DO: Implement name location for rename
  }

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);
    // TO-DO: Method not implemented
    return this;
  }
}
