"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssemblyLiteralNode = void 0;
const types_1 = require("@common/types");
class AssemblyLiteralNode extends types_1.Node {
    constructor(assemblyLiteral, uri, rootPath, documentsAnalyzer) {
        super(assemblyLiteral, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = assemblyLiteral;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.AssemblyLiteralNode = AssemblyLiteralNode;
//# sourceMappingURL=AssemblyLiteralNode.js.map