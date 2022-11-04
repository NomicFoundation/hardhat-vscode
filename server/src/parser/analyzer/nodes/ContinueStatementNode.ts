import {
  ContinueStatement,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class ContinueStatementNode extends Node {
  public astNode: ContinueStatement;

  constructor(
    continueStatement: ContinueStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(continueStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = continueStatement;
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
