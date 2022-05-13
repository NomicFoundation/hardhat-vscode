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

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    const typeNode = find(
      this.astNode.base,
      this.uri,
      this.rootPath,
      this.solFileIndex
    ).accept(find, orphanNodes, parent, this);

    if (this.astNode.indexStart) {
      find(
        this.astNode.indexStart,
        this.uri,
        this.rootPath,
        this.solFileIndex
      ).accept(find, orphanNodes, parent);
    }

    if (this.astNode.indexEnd) {
      find(
        this.astNode.indexEnd,
        this.uri,
        this.rootPath,
        this.solFileIndex
      ).accept(find, orphanNodes, parent);
    }

    return typeNode;
  }
}
