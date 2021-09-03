"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooleanLiteralNode = void 0;
const types_1 = require("@common/types");
class BooleanLiteralNode extends types_1.Node {
    constructor(booleanLiteral, uri, rootPath, documentsAnalyzer) {
        super(booleanLiteral, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = booleanLiteral;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.BooleanLiteralNode = BooleanLiteralNode;
//# sourceMappingURL=BooleanLiteralNode.js.map