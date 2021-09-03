"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssemblyStackAssignmentNode = void 0;
const types_1 = require("@common/types");
class AssemblyStackAssignmentNode extends types_1.Node {
    constructor(assemblyStackAssignment, uri, rootPath, documentsAnalyzer) {
        super(assemblyStackAssignment, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = assemblyStackAssignment;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.AssemblyStackAssignmentNode = AssemblyStackAssignmentNode;
//# sourceMappingURL=AssemblyStackAssignmentNode.js.map