import {
  AssemblyStackAssignment,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class AssemblyStackAssignmentNode extends Node {
  public astNode: AssemblyStackAssignment;

  constructor(
    assemblyStackAssignment: AssemblyStackAssignment,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(assemblyStackAssignment, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = assemblyStackAssignment;
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
