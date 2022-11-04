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

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    for (const name of this.astNode.names ?? []) {
      const foundNode = await find(
        name,
        this.uri,
        this.rootPath,
        this.solFileIndex
      );
      await foundNode.accept(find, orphanNodes, parent);
    }

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (this.astNode.expression) {
      const foundNode = await find(
        this.astNode.expression,
        this.uri,
        this.rootPath,
        this.solFileIndex
      );
      await foundNode.accept(find, orphanNodes, parent);
    }

    return this;
  }
}
