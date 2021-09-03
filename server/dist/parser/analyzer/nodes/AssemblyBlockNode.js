"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssemblyBlockNode = void 0;
const types_1 = require("@common/types");
class AssemblyBlockNode extends types_1.Node {
    constructor(assemblyBlock, uri, rootPath, documentsAnalyzer) {
        super(assemblyBlock, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = assemblyBlock;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        if (parent) {
            this.setParent(parent);
        }
        for (const operation of this.astNode.operations || []) {
            find(operation, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
}
exports.AssemblyBlockNode = AssemblyBlockNode;
//# sourceMappingURL=AssemblyBlockNode.js.map