import {
  EmitStatement,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class EmitStatementNode extends Node {
  public astNode: EmitStatement;

  constructor(
    emitStatement: EmitStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(emitStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = emitStatement;
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
        this.astNode.eventCall,
        this.uri,
        this.rootPath,
        this.solFileIndex
      )
    ).accept(find, orphanNodes, parent, this);

    return this;
  }
}
