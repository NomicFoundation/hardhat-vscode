"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeNameExpressionNode = void 0;
const types_1 = require("@common/types");
class TypeNameExpressionNode extends types_1.Node {
    constructor(typeNameExpression, uri, rootPath, documentsAnalyzer) {
        super(typeNameExpression, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = typeNameExpression;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.TypeNameExpressionNode = TypeNameExpressionNode;
//# sourceMappingURL=TypeNameExpressionNode.js.map