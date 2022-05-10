import {
  NewExpression,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class NewExpressionNode extends Node {
  public astNode: NewExpression;

  constructor(
    newExpression: NewExpression,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(newExpression, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = newExpression;
  }

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (this.astNode.typeName) {
      find(
        this.astNode.typeName,
        this.uri,
        this.rootPath,
        this.documentsAnalyzer
      ).accept(find, orphanNodes, parent);
    }

    return this;
  }
}
