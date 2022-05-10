import {
  LabelDefinition,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
} from "@common/types";

export class LabelDefinitionNode extends Node {
  public astNode: LabelDefinition;

  constructor(
    labelDefinition: LabelDefinition,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(labelDefinition, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = labelDefinition;
    // TO-DO: Implement name location for rename
  }

  public getTypeNodes(): Node[] {
    return this.typeNodes;
  }

  public getDefinitionNode(): Node | undefined {
    return this;
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
