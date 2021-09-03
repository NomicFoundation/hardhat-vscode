"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UncheckedStatementNode = void 0;
const types_1 = require("@common/types");
class UncheckedStatementNode extends types_1.Node {
    constructor(uncheckedStatement, uri, rootPath, documentsAnalyzer) {
        super(uncheckedStatement, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = uncheckedStatement;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        if (this.astNode.block) {
            find(this.astNode.block, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        return this;
    }
}
exports.UncheckedStatementNode = UncheckedStatementNode;
//# sourceMappingURL=UncheckedStatementNode.js.map