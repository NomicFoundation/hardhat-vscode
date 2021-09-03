"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HexLiteralNode = void 0;
const types_1 = require("@common/types");
class HexLiteralNode extends types_1.Node {
    constructor(hexLiteral, uri, rootPath, documentsAnalyzer) {
        super(hexLiteral, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = hexLiteral;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.HexLiteralNode = HexLiteralNode;
//# sourceMappingURL=HexLiteralNode.js.map