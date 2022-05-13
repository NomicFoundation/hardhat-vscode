import {
  TypeNameExpression,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class TypeNameExpressionNode extends Node {
  public astNode: TypeNameExpression;

  constructor(
    typeNameExpression: TypeNameExpression,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(typeNameExpression, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = typeNameExpression;
    // TO-DO: Implement name location for rename
  }

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);
    // TO-DO: Method not implemented
    return this;
  }
}
