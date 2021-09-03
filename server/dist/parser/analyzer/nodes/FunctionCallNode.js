"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionCallNode = void 0;
const types_1 = require("@common/types");
class FunctionCallNode extends types_1.Node {
    constructor(functionCall, uri, rootPath, documentsAnalyzer) {
        super(functionCall, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = functionCall;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        if ((expression === null || expression === void 0 ? void 0 : expression.type) !== "EmitStatement") {
            expression = this;
        }
        const expressionNode = find(this.astNode.expression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent, expression);
        for (const argument of this.astNode.arguments) {
            find(argument, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        return expressionNode;
    }
}
exports.FunctionCallNode = FunctionCallNode;
//# sourceMappingURL=FunctionCallNode.js.map