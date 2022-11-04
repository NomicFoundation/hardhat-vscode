import { Break, FinderType, SolFileIndexMap, Node } from "@common/types";

export class BreakNode extends Node {
  public astNode: Break;

  constructor(
    astBreak: Break,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(astBreak, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = astBreak;
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
