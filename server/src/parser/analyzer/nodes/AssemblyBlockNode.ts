import {
  AssemblyBlock,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class AssemblyBlockNode extends Node {
  public astNode: AssemblyBlock;

  constructor(
    assemblyBlock: AssemblyBlock,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(assemblyBlock, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = assemblyBlock;
  }

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    if (parent) {
      this.setParent(parent);
    }

    for (const operation of this.astNode.operations ?? []) {
      find(operation, this.uri, this.rootPath, this.solFileIndex).accept(
        find,
        orphanNodes,
        this
      );
    }

    parent?.addChild(this);

    return this;
  }
}
