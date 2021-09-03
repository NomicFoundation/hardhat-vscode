"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberLiteralNode = void 0;
const types_1 = require("@common/types");
class NumberLiteralNode extends types_1.Node {
    constructor(numberLiteral, uri, rootPath, documentsAnalyzer) {
        super(numberLiteral, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = numberLiteral;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.NumberLiteralNode = NumberLiteralNode;
//# sourceMappingURL=NumberLiteralNode.js.map