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

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    await (
      await find(
        this.astNode.expression,
        this.uri,
        this.rootPath,
        this.solFileIndex
      )
    ).accept(find, orphanNodes, parent);
    await (
      await find(
        this.astNode.arguments,
        this.uri,
        this.rootPath,
        this.solFileIndex
      )
    ).accept(find, orphanNodes, parent);

    return this;
  }
}
