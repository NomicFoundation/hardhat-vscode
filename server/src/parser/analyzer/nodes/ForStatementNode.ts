import { ForStatement, FinderType, SolFileIndexMap, Node } from "@common/types";

export class ForStatementNode extends Node {
  public astNode: ForStatement;

  constructor(
    forStatement: ForStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(forStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = forStatement;
  }

  public getDefinitionNode(): Node | undefined {
    return undefined;
  }

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    if (parent) {
      this.setParent(parent);
    }

    if (this.astNode.initExpression) {
      await (
        await find(
          this.astNode.initExpression,
          this.uri,
          this.rootPath,
          this.solFileIndex
        )
      ).accept(find, orphanNodes, this);
    }

    if (this.astNode.conditionExpression) {
      await (
        await find(
          this.astNode.conditionExpression,
          this.uri,
          this.rootPath,
          this.solFileIndex
        )
      ).accept(find, orphanNodes, this);
    }

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (this.astNode.loopExpression) {
      await (
        await find(
          this.astNode.loopExpression,
          this.uri,
          this.rootPath,
          this.solFileIndex
        )
      ).accept(find, orphanNodes, this);
    }

    await (
      await find(this.astNode.body, this.uri, this.rootPath, this.solFileIndex)
    ).accept(find, orphanNodes, this);

    parent?.addChild(this);

    return this;
  }
}
