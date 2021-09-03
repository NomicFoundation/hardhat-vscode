"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockNode = void 0;
const types_1 = require("@common/types");
class BlockNode extends types_1.Node {
    constructor(block, uri, rootPath, documentsAnalyzer) {
        super(block, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = block;
    }
    getDefinitionNode() {
        return undefined;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        for (const statement of this.astNode.statements) {
            find(statement, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        return this;
    }
}
exports.BlockNode = BlockNode;
//# sourceMappingURL=BlockNode.js.map