import {
  DecimalNumber,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class DecimalNumberNode extends Node {
  public astNode: DecimalNumber;

  constructor(
    decimalNumber: DecimalNumber,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(decimalNumber, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = decimalNumber;
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
