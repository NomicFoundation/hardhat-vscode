"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreakNode = void 0;
const types_1 = require("@common/types");
class BreakNode extends types_1.Node {
    constructor(astBreak, uri, rootPath, documentsAnalyzer) {
        super(astBreak, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = astBreak;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.BreakNode = BreakNode;
//# sourceMappingURL=BreakNode.js.map