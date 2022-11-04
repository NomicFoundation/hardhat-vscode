import {
  AssemblyFunctionReturns,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class AssemblyFunctionReturnsNode extends Node {
  public astNode: AssemblyFunctionReturns;

  constructor(
    assemblyFunctionReturns: AssemblyFunctionReturns,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(assemblyFunctionReturns, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = assemblyFunctionReturns;
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
