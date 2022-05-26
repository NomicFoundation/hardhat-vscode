import {
  AssemblySwitch,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class AssemblySwitchNode extends Node {
  public astNode: AssemblySwitch;

  constructor(
    assemblySwitch: AssemblySwitch,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(assemblySwitch, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = assemblySwitch;
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

    find(
      this.astNode.expression,
      this.uri,
      this.rootPath,
      this.solFileIndex
    ).accept(find, orphanNodes, this);

    for (const caseNode of this.astNode.cases) {
      find(caseNode, this.uri, this.rootPath, this.solFileIndex).accept(
        find,
        orphanNodes,
        this
      );
    }

    parent?.addChild(this);

    return this;
  }
}
