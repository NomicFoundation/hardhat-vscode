"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InlineAssemblyStatementNode = void 0;
const types_1 = require("@common/types");
class InlineAssemblyStatementNode extends types_1.Node {
    constructor(inlineAssemblyStatement, uri, rootPath, documentsAnalyzer) {
        super(inlineAssemblyStatement, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = inlineAssemblyStatement;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        if (this.astNode.body) {
            find(this.astNode.body, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        return this;
    }
}
exports.InlineAssemblyStatementNode = InlineAssemblyStatementNode;
//# sourceMappingURL=InlineAssemblyStatementNode.js.map