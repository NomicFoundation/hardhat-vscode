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

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    const baseNode = await (
      await find(
        this.astNode.baseName,
        this.uri,
        this.rootPath,
        this.solFileIndex
      )
    ).accept(find, orphanNodes, parent);

    for (const argument of this.astNode.arguments) {
      await (
        await find(argument, this.uri, this.rootPath, this.solFileIndex)
      ).accept(find, orphanNodes, parent);
    }

    return baseNode;
  }
}
