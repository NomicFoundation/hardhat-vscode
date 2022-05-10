import {
  ArrayTypeName,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class ArrayTypeNameNode extends Node {
  public astNode: ArrayTypeName;

  constructor(
    arrayTypeName: ArrayTypeName,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(arrayTypeName, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = arrayTypeName;
  }

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    const typeNode = find(
      this.astNode.baseTypeName,
      this.uri,
      this.rootPath,
      this.documentsAnalyzer
    ).accept(find, orphanNodes, parent, this);

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (typeNode) {
      this.addTypeNode(typeNode);
    }

    return this;
  }
}
