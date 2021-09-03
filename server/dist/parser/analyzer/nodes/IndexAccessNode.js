"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexAccessNode = void 0;
const types_1 = require("@common/types");
class IndexAccessNode extends types_1.Node {
    constructor(indexAccess, uri, rootPath, documentsAnalyzer) {
        super(indexAccess, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = indexAccess;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        const typeNode = find(this.astNode.base, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent, this);
        find(this.astNode.index, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        return typeNode;
    }
}
exports.IndexAccessNode = IndexAccessNode;
//# sourceMappingURL=IndexAccessNode.js.map