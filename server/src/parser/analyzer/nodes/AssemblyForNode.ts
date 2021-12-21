import {
  AssemblyFor,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class AssemblyForNode extends Node {
  astNode: AssemblyFor;

  constructor(
    assemblyFor: AssemblyFor,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(assemblyFor, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = assemblyFor;
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
      this.astNode.pre,
      this.uri,
      this.rootPath,
      this.documentsAnalyzer
    ).accept(find, orphanNodes, this);
    find(
      this.astNode.condition,
      this.uri,
      this.rootPath,
      this.documentsAnalyzer
    ).accept(find, orphanNodes, this);
    find(
      this.astNode.post,
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
