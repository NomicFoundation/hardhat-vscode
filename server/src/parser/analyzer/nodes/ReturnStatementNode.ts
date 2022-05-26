import {
  ReturnStatement,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class ReturnStatementNode extends Node {
  public astNode: ReturnStatement;

  constructor(
    returnStatement: ReturnStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(returnStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = returnStatement;
  }

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    if (this.astNode.expression) {
      find(
        this.astNode.expression,
        this.uri,
        this.rootPath,
        this.solFileIndex
      ).accept(find, orphanNodes, parent);
    }

    return this;
  }
}
