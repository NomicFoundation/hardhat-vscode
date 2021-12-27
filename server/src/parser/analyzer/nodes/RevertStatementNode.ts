import {
  RevertStatement,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class RevertStatementNode extends Node {
  astNode: RevertStatement;

  constructor(
    revertStatement: RevertStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(revertStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = revertStatement;
  }

  accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    find(
      this.astNode.revertCall,
      this.uri,
      this.rootPath,
      this.documentsAnalyzer
    ).accept(find, orphanNodes, parent, this);

    return this;
  }
}
