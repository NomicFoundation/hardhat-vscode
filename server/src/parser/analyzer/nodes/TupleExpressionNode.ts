import {
  TupleExpression,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class TupleExpressionNode extends Node {
  public astNode: TupleExpression;

  constructor(
    tupleExpression: TupleExpression,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(tupleExpression, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = tupleExpression;
  }

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    for (const component of this.astNode.components) {
      if (component) {
        find(component, this.uri, this.rootPath, this.solFileIndex).accept(
          find,
          orphanNodes,
          parent
        );
      }
    }

    return this;
  }
}
