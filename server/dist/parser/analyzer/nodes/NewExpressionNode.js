"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewExpressionNode = void 0;
const types_1 = require("@common/types");
class NewExpressionNode extends types_1.Node {
    constructor(newExpression, uri, rootPath, documentsAnalyzer) {
        super(newExpression, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = newExpression;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        if (this.astNode.typeName) {
            find(this.astNode.typeName, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        return this;
    }
}
exports.NewExpressionNode = NewExpressionNode;
//# sourceMappingURL=NewExpressionNode.js.map