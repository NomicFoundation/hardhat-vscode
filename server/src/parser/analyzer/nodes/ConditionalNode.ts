import {
  Conditional,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class ConditionalNode extends Node {
  astNode: Conditional;

  constructor(
    conditional: Conditional,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(conditional, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = conditional;
  }

  accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    if (this.astNode.condition) {
      find(
        this.astNode.condition,
        this.uri,
        this.rootPath,
        this.documentsAnalyzer
      ).accept(find, orphanNodes, parent);
    }

    if (this.astNode.trueExpression) {
      find(
        this.astNode.trueExpression,
        this.uri,
        this.rootPath,
        this.documentsAnalyzer
      ).accept(find, orphanNodes, parent);
    }

    if (this.astNode.falseExpression) {
      find(
        this.astNode.falseExpression,
        this.uri,
        this.rootPath,
        this.documentsAnalyzer
      ).accept(find, orphanNodes, parent);
    }

    return this;
  }
}
