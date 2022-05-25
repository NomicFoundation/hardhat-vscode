import {
  AssemblyAssignment,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class AssemblyAssignmentNode extends Node {
  public astNode: AssemblyAssignment;

  constructor(
    assemblyAssignment: AssemblyAssignment,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(assemblyAssignment, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = assemblyAssignment;
  }

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    for (const name of this.astNode.names ?? []) {
      find(name, this.uri, this.rootPath, this.solFileIndex).accept(
        find,
        orphanNodes,
        parent
      );
    }

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (this.astNode.expression) {
      find(
        this.astNode.expression,
        this.uri,
        this.rootPath,
        this.solFileIndex
      ).accept(find, orphanNodes, parent);
    }

    return this;
  }
}
