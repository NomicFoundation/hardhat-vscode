import {
  CatchClause,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class CatchClauseNode extends Node {
  astNode: CatchClause;

  constructor(
    catchClause: CatchClause,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(catchClause, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = catchClause;
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

    for (const param of this.astNode.parameters || []) {
      find(param, this.uri, this.rootPath, this.documentsAnalyzer).accept(
        find,
        orphanNodes,
        this
      );
    }

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
