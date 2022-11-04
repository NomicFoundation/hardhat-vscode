import {
  UncheckedStatement,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class UncheckedStatementNode extends Node {
  public astNode: UncheckedStatement;

  constructor(
    uncheckedStatement: UncheckedStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(uncheckedStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = uncheckedStatement;
  }

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (this.astNode.block) {
      await (
        await find(
          this.astNode.block,
          this.uri,
          this.rootPath,
          this.solFileIndex
        )
      ).accept(find, orphanNodes, parent);
    }

    return this;
  }
}
