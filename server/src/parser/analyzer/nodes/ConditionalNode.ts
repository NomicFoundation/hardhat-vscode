import { Conditional, FinderType, SolFileIndexMap, Node } from "@common/types";

export class ConditionalNode extends Node {
  public astNode: Conditional;

  constructor(
    conditional: Conditional,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(conditional, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = conditional;
  }

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (this.astNode.condition) {
      await (
        await find(
          this.astNode.condition,
          this.uri,
          this.rootPath,
          this.solFileIndex
        )
      ).accept(find, orphanNodes, parent);
    }

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (this.astNode.trueExpression) {
      await (
        await find(
          this.astNode.trueExpression,
          this.uri,
          this.rootPath,
          this.solFileIndex
        )
      ).accept(find, orphanNodes, parent);
    }

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (this.astNode.falseExpression) {
      await (
        await find(
          this.astNode.falseExpression,
          this.uri,
          this.rootPath,
          this.solFileIndex
        )
      ).accept(find, orphanNodes, parent);
    }

    return this;
  }
}
