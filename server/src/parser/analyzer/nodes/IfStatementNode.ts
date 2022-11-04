import { IfStatement, FinderType, SolFileIndexMap, Node } from "@common/types";

export class IfStatementNode extends Node {
  public astNode: IfStatement;

  constructor(
    ifStatement: IfStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(ifStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = ifStatement;
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
      await find(
        this.astNode.trueBody,
        this.uri,
        this.rootPath,
        this.solFileIndex
      )
    ).accept(find, orphanNodes, this);

    if (this.astNode.falseBody) {
      await (
        await find(
          this.astNode.falseBody,
          this.uri,
          this.rootPath,
          this.solFileIndex
        )
      ).accept(find, orphanNodes, this);
    }

    parent?.addChild(this);

    return this;
  }
}
