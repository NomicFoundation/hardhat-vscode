import { AssemblyIf, FinderType, SolFileIndexMap, Node } from "@common/types";

export class AssemblyIfNode extends Node {
  public astNode: AssemblyIf;

  constructor(
    assemblyIf: AssemblyIf,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(assemblyIf, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = assemblyIf;
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
