import {
  ExpressionStatement,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class ExpressionStatementNode extends Node {
  public astNode: ExpressionStatement;

  constructor(
    expressionStatement: ExpressionStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(expressionStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = expressionStatement;
  }

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    if (this.astNode.expression) {
      await (
        await find(
          this.astNode.expression,
          this.uri,
          this.rootPath,
          this.solFileIndex
        )
      ).accept(find, orphanNodes, parent);
    }

    return this;
  }
}
