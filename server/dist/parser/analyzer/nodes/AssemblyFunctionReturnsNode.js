"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssemblyFunctionReturnsNode = void 0;
const types_1 = require("@common/types");
class AssemblyFunctionReturnsNode extends types_1.Node {
    constructor(assemblyFunctionReturns, uri, rootPath, documentsAnalyzer) {
        super(assemblyFunctionReturns, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = assemblyFunctionReturns;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.AssemblyFunctionReturnsNode = AssemblyFunctionReturnsNode;
//# sourceMappingURL=AssemblyFunctionReturnsNode.js.map