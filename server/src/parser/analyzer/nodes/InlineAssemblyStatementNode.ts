import {
  InlineAssemblyStatement,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class InlineAssemblyStatementNode extends Node {
  public astNode: InlineAssemblyStatement;

  constructor(
    inlineAssemblyStatement: InlineAssemblyStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(inlineAssemblyStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = inlineAssemblyStatement;
  }

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (this.astNode.body) {
      await (
        await find(
          this.astNode.body,
          this.uri,
          this.rootPath,
          this.solFileIndex
        )
      ).accept(find, orphanNodes, parent);
    }

    return this;
  }
}
