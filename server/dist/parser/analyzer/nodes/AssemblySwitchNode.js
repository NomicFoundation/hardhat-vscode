"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssemblySwitchNode = void 0;
const types_1 = require("@common/types");
class AssemblySwitchNode extends types_1.Node {
    constructor(assemblySwitch, uri, rootPath, documentsAnalyzer) {
        super(assemblySwitch, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = assemblySwitch;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        if (parent) {
            this.setParent(parent);
        }
        find(this.astNode.expression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        for (const caseNode of this.astNode.cases) {
            find(caseNode, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
}
exports.AssemblySwitchNode = AssemblySwitchNode;
//# sourceMappingURL=AssemblySwitchNode.js.map