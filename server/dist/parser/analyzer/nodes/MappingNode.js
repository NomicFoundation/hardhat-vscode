"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MappingNode = void 0;
const types_1 = require("@common/types");
class MappingNode extends types_1.Node {
    constructor(mapping, uri, rootPath, documentsAnalyzer) {
        super(mapping, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = mapping;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        find(this.astNode.keyType, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        const typeNode = find(this.astNode.valueType, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        this.addTypeNode(typeNode);
        return this;
    }
}
exports.MappingNode = MappingNode;
//# sourceMappingURL=MappingNode.js.map