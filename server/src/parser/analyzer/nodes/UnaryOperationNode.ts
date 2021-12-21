import {
  UnaryOperation,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class UnaryOperationNode extends Node {
  astNode: UnaryOperation;

  constructor(
    unaryOperation: UnaryOperation,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(unaryOperation, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = unaryOperation;
  }

  accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    find(
      this.astNode.subExpression,
      this.uri,
      this.rootPath,
      this.documentsAnalyzer
    ).accept(find, orphanNodes, parent);

    return this;
  }
}
