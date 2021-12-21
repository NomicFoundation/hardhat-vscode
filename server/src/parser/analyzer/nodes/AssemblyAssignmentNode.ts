import {
  AssemblyAssignment,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class AssemblyAssignmentNode extends Node {
  astNode: AssemblyAssignment;

  constructor(
    assemblyAssignment: AssemblyAssignment,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(assemblyAssignment, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = assemblyAssignment;
  }

  accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    for (const name of this.astNode.names || []) {
      find(name, this.uri, this.rootPath, this.documentsAnalyzer).accept(
        find,
        orphanNodes,
        parent
      );
    }

    if (this.astNode.expression) {
      find(
        this.astNode.expression,
        this.uri,
        this.rootPath,
        this.documentsAnalyzer
      ).accept(find, orphanNodes, parent);
    }

    return this;
  }
}
