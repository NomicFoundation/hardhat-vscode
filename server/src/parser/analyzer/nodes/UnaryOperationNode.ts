import {
  UnaryOperation,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class UnaryOperationNode extends Node {
  public astNode: UnaryOperation;

  constructor(
    unaryOperation: UnaryOperation,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(unaryOperation, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = unaryOperation;
  }

  public accept(
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
      this.solFileIndex
    ).accept(find, orphanNodes, parent);

    return this;
  }
}
