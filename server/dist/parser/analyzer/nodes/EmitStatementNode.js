"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmitStatementNode = void 0;
const types_1 = require("@common/types");
class EmitStatementNode extends types_1.Node {
    constructor(emitStatement, uri, rootPath, documentsAnalyzer) {
        super(emitStatement, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = emitStatement;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        find(this.astNode.eventCall, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent, this);
        return this;
    }
}
exports.EmitStatementNode = EmitStatementNode;
//# sourceMappingURL=EmitStatementNode.js.map