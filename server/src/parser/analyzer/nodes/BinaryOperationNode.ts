import {
  BinaryOperation,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class BinaryOperationNode extends Node {
  public astNode: BinaryOperation;

  constructor(
    binaryOperation: BinaryOperation,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(binaryOperation, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = binaryOperation;
  }

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    await (
      await find(this.astNode.left, this.uri, this.rootPath, this.solFileIndex)
    ).accept(find, orphanNodes, parent);
    await (
      await find(this.astNode.right, this.uri, this.rootPath, this.solFileIndex)
    ).accept(find, orphanNodes, parent);

    return this;
  }
}
