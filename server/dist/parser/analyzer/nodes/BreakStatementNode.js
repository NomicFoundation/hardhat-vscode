"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BreakStatementNode = void 0;
const types_1 = require("@common/types");
class BreakStatementNode extends types_1.Node {
    constructor(breakStatement, uri, rootPath, documentsAnalyzer) {
        super(breakStatement, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = breakStatement;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.BreakStatementNode = BreakStatementNode;
//# sourceMappingURL=BreakStatementNode.js.map