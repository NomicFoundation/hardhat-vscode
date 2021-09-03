"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnStatementNode = void 0;
const types_1 = require("@common/types");
class ReturnStatementNode extends types_1.Node {
    constructor(returnStatement, uri, rootPath, documentsAnalyzer) {
        super(returnStatement, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = returnStatement;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        if (this.astNode.expression) {
            find(this.astNode.expression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        return this;
    }
}
exports.ReturnStatementNode = ReturnStatementNode;
//# sourceMappingURL=ReturnStatementNode.js.map