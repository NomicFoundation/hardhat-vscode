import {
  IfStatement,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class IfStatementNode extends Node {
  public astNode: IfStatement;

  constructor(
    ifStatement: IfStatement,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(ifStatement, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = ifStatement;
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
      this.astNode.trueBody,
      this.uri,
      this.rootPath,
      this.documentsAnalyzer
    ).accept(find, orphanNodes, this);

    if (this.astNode.falseBody) {
      find(
        this.astNode.falseBody,
        this.uri,
        this.rootPath,
        this.documentsAnalyzer
      ).accept(find, orphanNodes, this);
    }

    parent?.addChild(this);

    return this;
  }
}
