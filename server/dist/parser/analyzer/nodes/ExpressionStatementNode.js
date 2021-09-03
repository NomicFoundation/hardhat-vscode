"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionStatementNode = void 0;
const types_1 = require("@common/types");
class ExpressionStatementNode extends types_1.Node {
    constructor(expressionStatement, uri, rootPath, documentsAnalyzer) {
        super(expressionStatement, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = expressionStatement;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        if (this.astNode.expression) {
            find(this.astNode.expression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        return this;
    }
}
exports.ExpressionStatementNode = ExpressionStatementNode;
//# sourceMappingURL=ExpressionStatementNode.js.map