import * as cache from "@common/cache";
import * as finder from "@common/finder";
import {
    SourceUnit,
    FinderType,
    Node,
    SourceUnitNode as AbstractSourceUnitNode
} from "@common/types";

export class SourceUnitNode extends AbstractSourceUnitNode {
    astNode: SourceUnit;

    constructor (sourceUnit: SourceUnit, uri: string, rootPath: string) {
        super(sourceUnit, uri, rootPath);
        this.astNode = sourceUnit;
    }

    getDefinitionNode(): Node | undefined {
        return undefined;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);

        const documentAnalyzer = cache.getDocumentAnalyzer(this.uri);
        if (documentAnalyzer?.analyzerTree && documentAnalyzer.analyzerTree instanceof SourceUnitNode) {
            this.exportNodes = documentAnalyzer.analyzerTree.getExportNodes().filter(exportNode => exportNode.isAlive);
        }

        if (documentAnalyzer) {
            documentAnalyzer.analyzerTree = this;
        }

        finder.setRoot(documentAnalyzer?.analyzerTree);

        for (const child of this.astNode.children) {
            find(child, this.uri, this.rootPath).accept(find, orphanNodes, this);
        }

        return this;
    }
}
