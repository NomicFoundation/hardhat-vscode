"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecimalNumberNode = void 0;
const types_1 = require("@common/types");
class DecimalNumberNode extends types_1.Node {
    constructor(decimalNumber, uri, rootPath, documentsAnalyzer) {
        super(decimalNumber, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = decimalNumber;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.DecimalNumberNode = DecimalNumberNode;
//# sourceMappingURL=DecimalNumberNode.js.map