import {
  NameValueList,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class NameValueListNode extends Node {
  public astNode: NameValueList;

  constructor(
    nameValueList: NameValueList,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(nameValueList, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = nameValueList;
  }

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    for (const identifier of this.astNode.identifiers) {
      await (
        await find(identifier, this.uri, this.rootPath, this.solFileIndex)
      ).accept(find, orphanNodes, parent);
    }
    return this;
  }
}
