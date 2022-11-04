import { SubAssembly, FinderType, SolFileIndexMap, Node } from "@common/types";

export class SubAssemblyNode extends Node {
  public astNode: SubAssembly;

  constructor(
    subAssembly: SubAssembly,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(subAssembly, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = subAssembly;
    // TO-DO: Implement name location for rename
  }

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);
    // TO-DO: Method not implemented
    return this;
  }
}
