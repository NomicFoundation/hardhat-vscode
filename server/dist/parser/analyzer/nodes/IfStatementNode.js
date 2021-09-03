"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IfStatementNode = void 0;
const types_1 = require("@common/types");
class IfStatementNode extends types_1.Node {
    constructor(ifStatement, uri, rootPath, documentsAnalyzer) {
        super(ifStatement, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = ifStatement;
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
        find(this.astNode.trueBody, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        if (this.astNode.falseBody) {
            find(this.astNode.falseBody, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
}
exports.IfStatementNode = IfStatementNode;
//# sourceMappingURL=IfStatementNode.js.map