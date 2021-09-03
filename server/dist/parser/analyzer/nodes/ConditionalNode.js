"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionalNode = void 0;
const types_1 = require("@common/types");
class ConditionalNode extends types_1.Node {
    constructor(conditional, uri, rootPath, documentsAnalyzer) {
        super(conditional, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = conditional;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        if (this.astNode.condition) {
            find(this.astNode.condition, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        if (this.astNode.trueExpression) {
            find(this.astNode.trueExpression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        if (this.astNode.falseExpression) {
            find(this.astNode.falseExpression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        return this;
    }
}
exports.ConditionalNode = ConditionalNode;
//# sourceMappingURL=ConditionalNode.js.map