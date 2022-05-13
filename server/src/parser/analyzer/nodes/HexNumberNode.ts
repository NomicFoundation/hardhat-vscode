import { HexNumber, FinderType, SolFileIndexMap, Node } from "@common/types";

export class HexNumberNode extends Node {
  public astNode: HexNumber;

  constructor(
    hexNumber: HexNumber,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(hexNumber, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = hexNumber;
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
