import {
  RevertStatement,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class RevertStatementNode extends Node {
  public astNode: RevertStatement;

  constructor(
    revertStatement: RevertStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(revertStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = revertStatement;
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
        this.astNode.revertCall,
        this.uri,
        this.rootPath,
        this.solFileIndex
      )
    ).accept(find, orphanNodes, parent, this);

    return this;
  }
}
