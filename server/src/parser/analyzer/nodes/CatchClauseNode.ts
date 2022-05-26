import { CatchClause, FinderType, SolFileIndexMap, Node } from "@common/types";

export class CatchClauseNode extends Node {
  public astNode: CatchClause;

  constructor(
    catchClause: CatchClause,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(catchClause, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = catchClause;
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

    for (const param of this.astNode.parameters || []) {
      find(param, this.uri, this.rootPath, this.solFileIndex).accept(
        find,
        orphanNodes,
        this
      );
    }

    find(this.astNode.body, this.uri, this.rootPath, this.solFileIndex).accept(
      find,
      orphanNodes,
      this
    );

    parent?.addChild(this);

    return this;
  }
}
