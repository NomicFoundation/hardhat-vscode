import {
  InheritanceSpecifier,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class InheritanceSpecifierNode extends Node {
  public astNode: InheritanceSpecifier;

  constructor(
    inheritanceSpecifier: InheritanceSpecifier,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(inheritanceSpecifier, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = inheritanceSpecifier;
  }

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    const baseNode = find(
      this.astNode.baseName,
      this.uri,
      this.rootPath,
      this.solFileIndex
    ).accept(find, orphanNodes, parent);

    for (const argument of this.astNode.arguments) {
      find(argument, this.uri, this.rootPath, this.solFileIndex).accept(
        find,
        orphanNodes,
        parent
      );
    }

    return baseNode;
  }
}
