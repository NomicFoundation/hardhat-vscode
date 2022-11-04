import {
  VariableDeclarationStatement,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class VariableDeclarationStatementNode extends Node {
  public astNode: VariableDeclarationStatement;

  constructor(
    variableDeclarationStatement: VariableDeclarationStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(
      variableDeclarationStatement,
      uri,
      rootPath,
      documentsAnalyzer,
      undefined
    );
    this.astNode = variableDeclarationStatement;
  }

  public getDefinitionNode(): Node | undefined {
    return this;
  }

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    for (const variable of this.astNode.variables) {
      if (variable) {
        await (
          await find(variable, this.uri, this.rootPath, this.solFileIndex)
        ).accept(find, orphanNodes, parent);
      }
    }

    if (this.astNode.initialValue) {
      await (
        await find(
          this.astNode.initialValue,
          this.uri,
          this.rootPath,
          this.solFileIndex
        )
      ).accept(find, orphanNodes, parent);
    }

    return this;
  }
}
