import {
  WhileStatement,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class WhileStatementNode extends Node {
  public astNode: WhileStatement;

  constructor(
    whileStatement: WhileStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(whileStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = whileStatement;
  }

  public getDefinitionNode(): Node | undefined {
    return undefined;
  }

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    if (parent) {
      this.setParent(parent);
    }

    find(
      this.astNode.condition,
      this.uri,
      this.rootPath,
      this.documentsAnalyzer
    ).accept(find, orphanNodes, this);
    find(
      this.astNode.body,
      this.uri,
      this.rootPath,
      this.documentsAnalyzer
    ).accept(find, orphanNodes, this);

    parent?.addChild(this);

    return this;
  }
}
