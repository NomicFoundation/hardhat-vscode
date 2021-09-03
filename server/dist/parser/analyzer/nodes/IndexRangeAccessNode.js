"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexRangeAccessNode = void 0;
const types_1 = require("@common/types");
class IndexRangeAccessNode extends types_1.Node {
    constructor(indexRangeAccess, uri, rootPath, documentsAnalyzer) {
        super(indexRangeAccess, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = indexRangeAccess;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        const typeNode = find(this.astNode.base, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent, this);
        if (this.astNode.indexStart) {
            find(this.astNode.indexStart, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        if (this.astNode.indexEnd) {
            find(this.astNode.indexEnd, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        return typeNode;
    }
}
exports.IndexRangeAccessNode = IndexRangeAccessNode;
//# sourceMappingURL=IndexRangeAccessNode.js.map