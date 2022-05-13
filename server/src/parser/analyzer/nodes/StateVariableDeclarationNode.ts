import {
  StateVariableDeclaration,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class StateVariableDeclarationNode extends Node {
  public astNode: StateVariableDeclaration;

  constructor(
    stateVariableDeclaration: StateVariableDeclaration,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(
      stateVariableDeclaration,
      uri,
      rootPath,
      documentsAnalyzer,
      undefined
    );
    this.astNode = stateVariableDeclaration;
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
      find(variable, this.uri, this.rootPath, this.solFileIndex).accept(
        find,
        orphanNodes,
        parent
      );
    }

    if (this.astNode.initialValue) {
      find(
        this.astNode.initialValue,
        this.uri,
        this.rootPath,
        this.solFileIndex
      ).accept(find, orphanNodes, parent);
    }

    return this;
  }
}
