import {
  UncheckedStatement,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class UncheckedStatementNode extends Node {
  astNode: UncheckedStatement;

  constructor(
    uncheckedStatement: UncheckedStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(uncheckedStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = uncheckedStatement;
  }

  accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    if (this.astNode.block) {
      find(
        this.astNode.block,
        this.uri,
        this.rootPath,
        this.documentsAnalyzer
      ).accept(find, orphanNodes, parent);
    }

    return this;
  }
}
