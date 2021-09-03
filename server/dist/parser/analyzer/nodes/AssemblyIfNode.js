"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssemblyIfNode = void 0;
const types_1 = require("@common/types");
class AssemblyIfNode extends types_1.Node {
    constructor(assemblyIf, uri, rootPath, documentsAnalyzer) {
        super(assemblyIf, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = assemblyIf;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        if (parent) {
            this.setParent(parent);
        }
        find(this.astNode.condition, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        find(this.astNode.body, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
}
exports.AssemblyIfNode = AssemblyIfNode;
//# sourceMappingURL=AssemblyIfNode.js.map