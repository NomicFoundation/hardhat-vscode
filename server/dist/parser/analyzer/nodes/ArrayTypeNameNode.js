"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrayTypeNameNode = void 0;
const types_1 = require("@common/types");
class ArrayTypeNameNode extends types_1.Node {
    constructor(arrayTypeName, uri, rootPath, documentsAnalyzer) {
        super(arrayTypeName, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = arrayTypeName;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        const typeNode = find(this.astNode.baseTypeName, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent, this);
        if (typeNode) {
            this.addTypeNode(typeNode);
        }
        return this;
    }
}
exports.ArrayTypeNameNode = ArrayTypeNameNode;
//# sourceMappingURL=ArrayTypeNameNode.js.map