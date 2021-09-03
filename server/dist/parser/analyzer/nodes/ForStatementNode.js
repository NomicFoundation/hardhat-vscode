"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForStatementNode = void 0;
const types_1 = require("@common/types");
class ForStatementNode extends types_1.Node {
    constructor(forStatement, uri, rootPath, documentsAnalyzer) {
        super(forStatement, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = forStatement;
    }
    getDefinitionNode() {
        return undefined;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        if (parent) {
            this.setParent(parent);
        }
        if (this.astNode.initExpression) {
            find(this.astNode.initExpression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        if (this.astNode.conditionExpression) {
            find(this.astNode.conditionExpression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        if (this.astNode.loopExpression) {
            find(this.astNode.loopExpression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        find(this.astNode.body, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
}
exports.ForStatementNode = ForStatementNode;
//# sourceMappingURL=ForStatementNode.js.map