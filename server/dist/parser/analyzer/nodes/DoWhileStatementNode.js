"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoWhileStatementNode = void 0;
const types_1 = require("@common/types");
class DoWhileStatementNode extends types_1.Node {
    constructor(doWhileStatement, uri, rootPath, documentsAnalyzer) {
        super(doWhileStatement, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = doWhileStatement;
    }
    getDefinitionNode() {
        return undefined;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        if (parent) {
            this.setParent(parent);
        }
        find(this.astNode.condition, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        find(this.astNode.body, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
}
exports.DoWhileStatementNode = DoWhileStatementNode;
//# sourceMappingURL=DoWhileStatementNode.js.map