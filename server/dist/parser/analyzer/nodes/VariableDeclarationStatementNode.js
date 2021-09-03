"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableDeclarationStatementNode = void 0;
const types_1 = require("@common/types");
class VariableDeclarationStatementNode extends types_1.Node {
    constructor(variableDeclarationStatement, uri, rootPath, documentsAnalyzer) {
        super(variableDeclarationStatement, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = variableDeclarationStatement;
    }
    getDefinitionNode() {
        return this;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        for (const variable of this.astNode.variables) {
            if (variable) {
                find(variable, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
            }
        }
        if (this.astNode.initialValue) {
            find(this.astNode.initialValue, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        return this;
    }
}
exports.VariableDeclarationStatementNode = VariableDeclarationStatementNode;
//# sourceMappingURL=VariableDeclarationStatementNode.js.map