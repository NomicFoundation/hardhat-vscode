import {
  AssemblyIf,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class AssemblyIfNode extends Node {
  astNode: AssemblyIf;

  constructor(
    assemblyIf: AssemblyIf,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(assemblyIf, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = assemblyIf;
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
      this.astNode.condition,
      this.uri,
      this.rootPath,
      this.documentsAnalyzer
    ).accept(find, orphanNodes, this);

    find(
      this.astNode.body,
      this.uri,
      this.rootPath,
      this.documentsAnalyzer
    ).accept(find, orphanNodes, this);

    parent?.addChild(this);

    return this;
  }
}
