import {
  PragmaDirective,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class PragmaDirectiveNode extends Node {
  public astNode: PragmaDirective;

  constructor(
    pragmaDirective: PragmaDirective,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(pragmaDirective, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = pragmaDirective;
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
