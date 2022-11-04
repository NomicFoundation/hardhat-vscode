import {
  DoWhileStatement,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class DoWhileStatementNode extends Node {
  public astNode: DoWhileStatement;

  constructor(
    doWhileStatement: DoWhileStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(doWhileStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = doWhileStatement;
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

    await (
      await find(
        this.astNode.condition,
        this.uri,
        this.rootPath,
        this.solFileIndex
      )
    ).accept(find, orphanNodes, this);

    await (
      await find(this.astNode.body, this.uri, this.rootPath, this.solFileIndex)
    ).accept(find, orphanNodes, this);

    parent?.addChild(this);

    return this;
  }
}
