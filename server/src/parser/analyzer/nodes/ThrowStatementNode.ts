import {
  ThrowStatement,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class ThrowStatementNode extends Node {
  public astNode: ThrowStatement;

  constructor(
    throwStatement: ThrowStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(throwStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = throwStatement;
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
