"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssemblyForNode = void 0;
const types_1 = require("@common/types");
class AssemblyForNode extends types_1.Node {
    constructor(assemblyFor, uri, rootPath, documentsAnalyzer) {
        super(assemblyFor, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = assemblyFor;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        if (parent) {
            this.setParent(parent);
        }
        find(this.astNode.pre, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        find(this.astNode.condition, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        find(this.astNode.post, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        find(this.astNode.body, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
}
exports.AssemblyForNode = AssemblyForNode;
//# sourceMappingURL=AssemblyForNode.js.map