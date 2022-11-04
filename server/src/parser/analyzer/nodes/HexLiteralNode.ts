import { HexLiteral, FinderType, SolFileIndexMap, Node } from "@common/types";

export class HexLiteralNode extends Node {
  public astNode: HexLiteral;

  constructor(
    hexLiteral: HexLiteral,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(hexLiteral, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = hexLiteral;
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
