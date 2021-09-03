"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateVariableDeclarationNode = void 0;
const types_1 = require("@common/types");
class StateVariableDeclarationNode extends types_1.Node {
    constructor(stateVariableDeclaration, uri, rootPath, documentsAnalyzer) {
        super(stateVariableDeclaration, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = stateVariableDeclaration;
    }
    getDefinitionNode() {
        return this;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        for (const variable of this.astNode.variables) {
            find(variable, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        if (this.astNode.initialValue) {
            find(this.astNode.initialValue, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        return this;
    }
}
exports.StateVariableDeclarationNode = StateVariableDeclarationNode;
//# sourceMappingURL=StateVariableDeclarationNode.js.map