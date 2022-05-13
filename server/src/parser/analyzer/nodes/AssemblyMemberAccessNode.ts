import {
  AssemblyMemberAccess,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class AssemblyMemberAccessNode extends Node {
  public astNode: AssemblyMemberAccess;

  constructor(
    assemblyMemberAccess: AssemblyMemberAccess,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(assemblyMemberAccess, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = assemblyMemberAccess;
    // TO-DO: Implement name location for rename
  }

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);
    // TO-DO: Method not implemented
    return this;
  }
}
