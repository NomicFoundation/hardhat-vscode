import {
  NameValueList,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class NameValueListNode extends Node {
  public astNode: NameValueList;

  constructor(
    nameValueList: NameValueList,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(nameValueList, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = nameValueList;
  }

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    for (const identifier of this.astNode.identifiers) {
      find(identifier, this.uri, this.rootPath, this.documentsAnalyzer).accept(
        find,
        orphanNodes,
        parent
      );
    }
    return this;
  }
}
