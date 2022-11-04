import { IndexAccess, FinderType, SolFileIndexMap, Node } from "@common/types";

export class IndexAccessNode extends Node {
  public astNode: IndexAccess;

  constructor(
    indexAccess: IndexAccess,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(indexAccess, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = indexAccess;
  }

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    const typeNode = await (
      await find(this.astNode.base, this.uri, this.rootPath, this.solFileIndex)
    ).accept(find, orphanNodes, parent, this);
    await (
      await find(this.astNode.index, this.uri, this.rootPath, this.solFileIndex)
    ).accept(find, orphanNodes, parent);

    return typeNode;
  }
}
