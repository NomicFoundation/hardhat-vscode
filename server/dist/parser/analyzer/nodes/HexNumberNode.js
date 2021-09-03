"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HexNumberNode = void 0;
const types_1 = require("@common/types");
class HexNumberNode extends types_1.Node {
    constructor(hexNumber, uri, rootPath, documentsAnalyzer) {
        super(hexNumber, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = hexNumber;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.HexNumberNode = HexNumberNode;
//# sourceMappingURL=HexNumberNode.js.map