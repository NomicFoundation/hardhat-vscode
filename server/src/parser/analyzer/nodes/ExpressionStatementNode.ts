import {
  ExpressionStatement,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class ExpressionStatementNode extends Node {
  astNode: ExpressionStatement;

  constructor(
    expressionStatement: ExpressionStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(expressionStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = expressionStatement;
  }

  accept(
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
        this.documentsAnalyzer
      ).accept(find, orphanNodes, parent);
    }

    return this;
  }
}
