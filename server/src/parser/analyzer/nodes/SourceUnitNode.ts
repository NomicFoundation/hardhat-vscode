import {
  SourceUnit,
  FinderType,
  DocumentsAnalyzerMap,
  Node,
  SourceUnitNode as AbstractSourceUnitNode,
} from "@common/types";

export class SourceUnitNode extends AbstractSourceUnitNode {
  public astNode: SourceUnit;

  constructor(
    sourceUnit: SourceUnit,
    uri: string,
    rootPath: string,
    documentsAnalyzer: DocumentsAnalyzerMap
  ) {
    super(sourceUnit, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = sourceUnit;
  }

  public getDefinitionNode(): Node | undefined {
    return undefined;
  }

  public accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Node {
    this.setExpressionNode(expression);

    const documentAnalyzer = this.documentsAnalyzer[this.uri];
    if (
      documentAnalyzer?.isAnalyzed() === true &&
      documentAnalyzer.analyzerTree.tree instanceof SourceUnitNode
    ) {
      this.exportNodes = documentAnalyzer.analyzerTree.tree
        .getExportNodes()
        .filter((exportNode) => exportNode.isAlive);
    }

    if (documentAnalyzer) {
      documentAnalyzer.analyzerTree.tree = this;
    }

    for (const child of this.astNode.children) {
      find(child, this.uri, this.rootPath, this.documentsAnalyzer).accept(
        find,
        orphanNodes,
        this
      );
    }

    return this;
  }
}
