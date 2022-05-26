import { Mapping, FinderType, SolFileIndexMap, Node } from "@common/types";

export class MappingNode extends Node {
  public astNode: Mapping;

  constructor(
    mapping: Mapping,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(mapping, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = mapping;
  }

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    find(
      this.astNode.keyType,
      this.uri,
      this.rootPath,
      this.solFileIndex
    ).accept(find, orphanNodes, parent);
    const typeNode = find(
      this.astNode.valueType,
      this.uri,
      this.rootPath,
      this.solFileIndex
    ).accept(find, orphanNodes, parent);

    this.addTypeNode(typeNode);

    return this;
  }
}
