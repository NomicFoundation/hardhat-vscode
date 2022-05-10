import {
  Conditional,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class ConditionalNode extends Node {
  public astNode: Conditional;

  constructor(
    conditional: Conditional,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(conditional, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = conditional;
  }

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (this.astNode.condition) {
      find(
        this.astNode.condition,
        this.uri,
        this.rootPath,
        this.documentsAnalyzer
      ).accept(find, orphanNodes, parent);
    }

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (this.astNode.trueExpression) {
      find(
        this.astNode.trueExpression,
        this.uri,
        this.rootPath,
        this.documentsAnalyzer
      ).accept(find, orphanNodes, parent);
    }

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
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
