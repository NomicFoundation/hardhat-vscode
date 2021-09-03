"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatchClauseNode = void 0;
const types_1 = require("@common/types");
class CatchClauseNode extends types_1.Node {
    constructor(catchClause, uri, rootPath, documentsAnalyzer) {
        super(catchClause, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = catchClause;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        if (parent) {
            this.setParent(parent);
        }
        for (const param of this.astNode.parameters || []) {
            find(param, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        find(this.astNode.body, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
}
exports.CatchClauseNode = CatchClauseNode;
//# sourceMappingURL=CatchClauseNode.js.map