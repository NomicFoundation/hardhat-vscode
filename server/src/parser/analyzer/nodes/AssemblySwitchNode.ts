import {
  AssemblySwitch,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class AssemblySwitchNode extends Node {
  astNode: AssemblySwitch;

  constructor(
    assemblySwitch: AssemblySwitch,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(assemblySwitch, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = assemblySwitch;
  }

  accept(
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
      this.documentsAnalyzer
    ).accept(find, orphanNodes, this);

    for (const caseNode of this.astNode.cases) {
      find(caseNode, this.uri, this.rootPath, this.documentsAnalyzer).accept(
        find,
        orphanNodes,
        this
      );
    }

    parent?.addChild(this);

    return this;
  }
}
