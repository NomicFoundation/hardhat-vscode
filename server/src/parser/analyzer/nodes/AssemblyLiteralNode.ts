import {
  AssemblyLiteral,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class AssemblyLiteralNode extends Node {
  public astNode: AssemblyLiteral;

  constructor(
    assemblyLiteral: AssemblyLiteral,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(assemblyLiteral, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = assemblyLiteral;
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
