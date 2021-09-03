"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinaryOperationNode = void 0;
const types_1 = require("@common/types");
class BinaryOperationNode extends types_1.Node {
    constructor(binaryOperation, uri, rootPath, documentsAnalyzer) {
        super(binaryOperation, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = binaryOperation;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        find(this.astNode.left, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        find(this.astNode.right, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        return this;
    }
}
exports.BinaryOperationNode = BinaryOperationNode;
//# sourceMappingURL=BinaryOperationNode.js.map