import { TryStatement, FinderType, SolFileIndexMap, Node } from "@common/types";

export class TryStatementNode extends Node {
  public astNode: TryStatement;

  constructor(
    tryStatement: TryStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(tryStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = tryStatement;
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

    await (
      await find(
        this.astNode.expression,
        this.uri,
        this.rootPath,
        this.solFileIndex
      )
    ).accept(find, orphanNodes, this);

    for (const returnParameter of this.astNode.returnParameters || []) {
      await (
        await find(returnParameter, this.uri, this.rootPath, this.solFileIndex)
      ).accept(find, orphanNodes, this);
    }

    await (
      await find(this.astNode.body, this.uri, this.rootPath, this.solFileIndex)
    ).accept(find, orphanNodes, this);

    for (const catchClause of this.astNode.catchClauses ?? []) {
      await (
        await find(catchClause, this.uri, this.rootPath, this.solFileIndex)
      ).accept(find, orphanNodes, this);
    }

    parent?.addChild(this);

    return this;
  }
}
