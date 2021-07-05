import * as finder from "@common/finder";
import {
    SourceUnit, FinderType, DocumentsAnalyzerMap,
    Node, SourceUnitNode as AbstractSourceUnitNode
} from "@common/types";

export class SourceUnitNode extends AbstractSourceUnitNode {
    astNode: SourceUnit;

    constructor (sourceUnit: SourceUnit, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(sourceUnit, uri, rootPath, documentsAnalyzer);
        this.astNode = sourceUnit;
    }

    getDefinitionNode(): Node | undefined {
        return undefined;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        const documentAnalyzer = this.documentsAnalyzer[this.uri];
        if (
            documentAnalyzer?.isAnalyzed &&
            documentAnalyzer.analyzerTree instanceof SourceUnitNode
        ) {
            this.exportNodes = documentAnalyzer.analyzerTree.getExportNodes().filter(exportNode => exportNode.isAlive);
        }

        if (documentAnalyzer) {
            documentAnalyzer.analyzerTree = this;
        }

        finder.setRoot(documentAnalyzer?.analyzerTree);

        for (const child of this.astNode.children) {
            find(child, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }

        return this;
    }
}
