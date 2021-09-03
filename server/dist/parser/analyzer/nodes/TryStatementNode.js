"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TryStatementNode = void 0;
const types_1 = require("@common/types");
class TryStatementNode extends types_1.Node {
    constructor(tryStatement, uri, rootPath, documentsAnalyzer) {
        super(tryStatement, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = tryStatement;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        if (parent) {
            this.setParent(parent);
        }
        find(this.astNode.expression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        for (const returnParameter of this.astNode.returnParameters || []) {
            find(returnParameter, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        find(this.astNode.body, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        for (const catchClause of this.astNode.catchClauses || []) {
            find(catchClause, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
}
exports.TryStatementNode = TryStatementNode;
//# sourceMappingURL=TryStatementNode.js.map