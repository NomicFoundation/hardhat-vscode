"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssemblyMemberAccessNode = void 0;
const types_1 = require("@common/types");
class AssemblyMemberAccessNode extends types_1.Node {
    constructor(assemblyMemberAccess, uri, rootPath, documentsAnalyzer) {
        super(assemblyMemberAccess, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = assemblyMemberAccess;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.AssemblyMemberAccessNode = AssemblyMemberAccessNode;
//# sourceMappingURL=AssemblyMemberAccessNode.js.map