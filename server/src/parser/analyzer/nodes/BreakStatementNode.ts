import {
  BreakStatement,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class BreakStatementNode extends Node {
  public astNode: BreakStatement;

  constructor(
    breakStatement: BreakStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(breakStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = breakStatement;
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
