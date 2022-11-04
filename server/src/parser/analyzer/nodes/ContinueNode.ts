import { Continue, FinderType, SolFileIndexMap, Node } from "@common/types";

export class ContinueNode extends Node {
  public astNode: Continue;

  constructor(
    astContinue: Continue,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(astContinue, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = astContinue;
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
