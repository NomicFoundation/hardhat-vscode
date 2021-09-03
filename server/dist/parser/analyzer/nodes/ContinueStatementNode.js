"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContinueStatementNode = void 0;
const types_1 = require("@common/types");
class ContinueStatementNode extends types_1.Node {
    constructor(continueStatement, uri, rootPath, documentsAnalyzer) {
        super(continueStatement, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = continueStatement;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.ContinueStatementNode = ContinueStatementNode;
//# sourceMappingURL=ContinueStatementNode.js.map