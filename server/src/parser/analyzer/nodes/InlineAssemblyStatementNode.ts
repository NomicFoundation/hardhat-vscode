import {
  InlineAssemblyStatement,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class InlineAssemblyStatementNode extends Node {
  astNode: InlineAssemblyStatement;

  constructor(
    inlineAssemblyStatement: InlineAssemblyStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(inlineAssemblyStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = inlineAssemblyStatement;
  }

  accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    if (this.astNode.body) {
      find(
        this.astNode.body,
        this.uri,
        this.rootPath,
        this.documentsAnalyzer
      ).accept(find, orphanNodes, parent);
    }

    return this;
  }
}
