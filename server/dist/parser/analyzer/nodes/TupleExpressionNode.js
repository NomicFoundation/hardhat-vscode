"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TupleExpressionNode = void 0;
const types_1 = require("@common/types");
class TupleExpressionNode extends types_1.Node {
    constructor(tupleExpression, uri, rootPath, documentsAnalyzer) {
        super(tupleExpression, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = tupleExpression;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        for (const component of this.astNode.components) {
            if (component) {
                find(component, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
            }
        }
        return this;
    }
}
exports.TupleExpressionNode = TupleExpressionNode;
//# sourceMappingURL=TupleExpressionNode.js.map