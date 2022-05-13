import {
  NameValueExpression,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class NameValueExpressionNode extends Node {
  public astNode: NameValueExpression;

  constructor(
    nameValueExpression: NameValueExpression,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(nameValueExpression, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = nameValueExpression;
  }

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    find(
      this.astNode.expression,
      this.uri,
      this.rootPath,
      this.solFileIndex
    ).accept(find, orphanNodes, parent);
    find(
      this.astNode.arguments,
      this.uri,
      this.rootPath,
      this.solFileIndex
    ).accept(find, orphanNodes, parent);

    return this;
  }
}
