"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThrowStatementNode = void 0;
const types_1 = require("@common/types");
class ThrowStatementNode extends types_1.Node {
    constructor(throwStatement, uri, rootPath, documentsAnalyzer) {
        super(throwStatement, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = throwStatement;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.ThrowStatementNode = ThrowStatementNode;
//# sourceMappingURL=ThrowStatementNode.js.map