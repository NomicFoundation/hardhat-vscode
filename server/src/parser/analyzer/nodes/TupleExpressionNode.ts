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

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    for (const component of this.astNode.components) {
      if (component) {
        await (
          await find(component, this.uri, this.rootPath, this.solFileIndex)
        ).accept(find, orphanNodes, parent);
      }
    }

    return this;
  }
}
