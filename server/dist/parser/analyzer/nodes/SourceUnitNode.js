"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceUnitNode = void 0;
const types_1 = require("@common/types");
class SourceUnitNode extends types_1.SourceUnitNode {
    constructor(sourceUnit, uri, rootPath, documentsAnalyzer) {
        super(sourceUnit, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = sourceUnit;
    }
    getDefinitionNode() {
        return undefined;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        const documentAnalyzer = this.documentsAnalyzer[this.uri];
        if ((documentAnalyzer === null || documentAnalyzer === void 0 ? void 0 : documentAnalyzer.isAnalyzed) &&
            documentAnalyzer.analyzerTree.tree instanceof SourceUnitNode) {
            this.exportNodes = documentAnalyzer.analyzerTree.tree.getExportNodes().filter(exportNode => exportNode.isAlive);
        }
        if (documentAnalyzer) {
            documentAnalyzer.analyzerTree.tree = this;
        }
        for (const child of this.astNode.children) {
            find(child, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        return this;
    }
}
exports.SourceUnitNode = SourceUnitNode;
//# sourceMappingURL=SourceUnitNode.js.map