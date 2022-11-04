import {
  IndexRangeAccess,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class IndexRangeAccessNode extends Node {
  public astNode: IndexRangeAccess;

  constructor(
    indexRangeAccess: IndexRangeAccess,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(indexRangeAccess, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = indexRangeAccess;
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

    if (this.astNode.indexStart) {
      await (
        await find(
          this.astNode.indexStart,
          this.uri,
          this.rootPath,
          this.solFileIndex
        )
      ).accept(find, orphanNodes, parent);
    }

    if (this.astNode.indexEnd) {
      await (
        await find(
          this.astNode.indexEnd,
          this.uri,
          this.rootPath,
          this.solFileIndex
        )
      ).accept(find, orphanNodes, parent);
    }

    return typeNode;
  }
}
