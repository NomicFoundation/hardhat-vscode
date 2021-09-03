"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssemblyCaseNode = void 0;
const types_1 = require("@common/types");
class AssemblyCaseNode extends types_1.Node {
    constructor(assemblyCase, uri, rootPath, documentsAnalyzer) {
        super(assemblyCase, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = assemblyCase;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        if (parent) {
            this.setParent(parent);
        }
        if (this.astNode.value) {
            find(this.astNode.value, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        find(this.astNode.block, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
}
exports.AssemblyCaseNode = AssemblyCaseNode;
//# sourceMappingURL=AssemblyCaseNode.js.map