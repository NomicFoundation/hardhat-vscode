"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubAssemblyNode = void 0;
const types_1 = require("@common/types");
class SubAssemblyNode extends types_1.Node {
    constructor(subAssembly, uri, rootPath, documentsAnalyzer) {
        super(subAssembly, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = subAssembly;
        // TO-DO: Implement name location for rename
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}
exports.SubAssemblyNode = SubAssemblyNode;
//# sourceMappingURL=SubAssemblyNode.js.map