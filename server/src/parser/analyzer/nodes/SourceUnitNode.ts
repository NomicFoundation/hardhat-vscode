import {
  SourceUnit,
  FinderType,
  SolFileIndexMap,
  Node,
  SourceUnitNode as AbstractSourceUnitNode,
} from "@common/types";

export class SourceUnitNode extends AbstractSourceUnitNode {
  public astNode: SourceUnit;

  constructor(
    sourceUnit: SourceUnit,
    uri: string,
    rootPath: string,
    documentsAnalyzer: SolFileIndexMap
  ) {
    super(sourceUnit, uri, rootPath, documentsAnalyzer, undefined);
    this.astNode = sourceUnit;
  }

  public getDefinitionNode(): Node | undefined {
    return undefined;
  }

  public async accept(
    find: FinderType,
    orphanNodes: Node[],
    parent?: Node,
    expression?: Node
  ): Promise<Node> {
    this.setExpressionNode(expression);

    const documentAnalyzer = this.solFileIndex[this.uri];
    if (
      documentAnalyzer?.isAnalyzed() === true &&
      documentAnalyzer.analyzerTree.tree instanceof SourceUnitNode
    ) {
      this.exportNodes = documentAnalyzer.analyzerTree.tree
        .getExportNodes()
        .filter((exportNode) => exportNode.isAlive);
    }

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (documentAnalyzer) {
      documentAnalyzer.analyzerTree.tree = this;
    }

    for (const child of this.astNode.children) {
      await (
        await find(child, this.uri, this.rootPath, this.solFileIndex)
      ).accept(find, orphanNodes, this);
    }

    return this;
  }
}
