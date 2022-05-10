import {
  VariableDeclarationStatement,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class VariableDeclarationStatementNode extends Node {
  public astNode: VariableDeclarationStatement;

  constructor(
    variableDeclarationStatement: VariableDeclarationStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
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

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    for (const variable of this.astNode.variables) {
      if (variable) {
        find(variable, this.uri, this.rootPath, this.documentsAnalyzer).accept(
          find,
          orphanNodes,
          parent
        );
      }
    }

    if (this.astNode.initialValue) {
      find(
        this.astNode.initialValue,
        this.uri,
        this.rootPath,
        this.documentsAnalyzer
      ).accept(find, orphanNodes, parent);
    }

    return this;
  }
}
