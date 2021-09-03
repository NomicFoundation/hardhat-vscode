"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringLiteralNode = void 0;
const types_1 = require("@common/types");
class StringLiteralNode extends types_1.Node {
    constructor(stringLiteral, uri, rootPath, documentsAnalyzer) {
        super(stringLiteral, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = stringLiteral;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.StringLiteralNode = StringLiteralNode;
//# sourceMappingURL=StringLiteralNode.js.map