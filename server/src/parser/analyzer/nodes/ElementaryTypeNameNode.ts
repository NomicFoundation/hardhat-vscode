import {
  ElementaryTypeName,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class ElementaryTypeNameNode extends Node {
  public astNode: ElementaryTypeName;

  constructor(
    elementaryTypeName: ElementaryTypeName,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
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

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);
    // TO-DO: Method not implemented
    return this;
  }
}
