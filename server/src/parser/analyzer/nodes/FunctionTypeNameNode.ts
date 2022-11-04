import {
  FunctionTypeName,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class FunctionTypeNameNode extends Node {
  public astNode: FunctionTypeName;

  constructor(
    functionTypeName: FunctionTypeName,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(functionTypeName, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = functionTypeName;
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
