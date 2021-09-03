"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevertStatementNode = void 0;
const types_1 = require("@common/types");
class RevertStatementNode extends types_1.Node {
    constructor(revertStatement, uri, rootPath, documentsAnalyzer) {
        super(revertStatement, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = revertStatement;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.RevertStatementNode = RevertStatementNode;
//# sourceMappingURL=RevertStatementNode.js.map