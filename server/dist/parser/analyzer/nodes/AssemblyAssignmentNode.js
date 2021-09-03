"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssemblyAssignmentNode = void 0;
const types_1 = require("@common/types");
class AssemblyAssignmentNode extends types_1.Node {
    constructor(assemblyAssignment, uri, rootPath, documentsAnalyzer) {
        super(assemblyAssignment, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = assemblyAssignment;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        for (const name of this.astNode.names || []) {
            find(name, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        if (this.astNode.expression) {
            find(this.astNode.expression, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        return this;
    }
}
exports.AssemblyAssignmentNode = AssemblyAssignmentNode;
//# sourceMappingURL=AssemblyAssignmentNode.js.map