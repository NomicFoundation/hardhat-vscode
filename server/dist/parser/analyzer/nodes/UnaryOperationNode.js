"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnaryOperationNode = void 0;
const types_1 = require("@common/types");
class UnaryOperationNode extends types_1.Node {
    constructor(unaryOperation, uri, rootPath, documentsAnalyzer) {
        super(unaryOperation, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = unaryOperation;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        find(this.astNode.subExpression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        return this;
    }
}
exports.UnaryOperationNode = UnaryOperationNode;
//# sourceMappingURL=UnaryOperationNode.js.map