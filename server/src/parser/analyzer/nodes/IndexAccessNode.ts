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
    find(this.astNode.index, this.uri, this.rootPath, this.solFileIndex).accept(
      find,
      orphanNodes,
      parent
    );

    return typeNode;
  }
}
