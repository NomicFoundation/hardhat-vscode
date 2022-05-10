import {
  ElementaryTypeName,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class ElementaryTypeNameNode extends Node {
  public astNode: ElementaryTypeName;

  constructor(
    elementaryTypeName: ElementaryTypeName,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(
      elementaryTypeName,
      uri,
      rootPath,
      documentsAnalyzer,
      elementaryTypeName.name
    );
    this.astNode = elementaryTypeName;
    // TO-DO: Implement name location for rename
  }

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);
    // TO-DO: Method not implemented
    return this;
  }
}
