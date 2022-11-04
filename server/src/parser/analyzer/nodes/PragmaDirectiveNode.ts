import {
  PragmaDirective,
  FinderType,
  SolFileIndexMap,
  Node,
} from "@common/types";

export class PragmaDirectiveNode extends Node {
  public astNode: PragmaDirective;

  constructor(
    pragmaDirective: PragmaDirective,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(pragmaDirective, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = pragmaDirective;
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
