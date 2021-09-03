"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssemblyCallNode = void 0;
const types_1 = require("@common/types");
class AssemblyCallNode extends types_1.Node {
    constructor(assemblyCall, uri, rootPath, documentsAnalyzer) {
        super(assemblyCall, uri, rootPath, documentsAnalyzer, assemblyCall.functionName);
        if (assemblyCall.loc) {
            // Bug in solidity parser doesn't give exact end location
            assemblyCall.loc.end.column = assemblyCall.loc.end.column + assemblyCall.functionName.length;
            this.nameLoc = JSON.parse(JSON.stringify(assemblyCall.loc));
        }
        this.astNode = assemblyCall;
    }
    accept(find, orphanNodes, parent, expression) {
        var _a;
        this.setExpressionNode(expression);
        for (const argument of this.astNode.arguments || []) {
            find(argument, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        if (parent) {
            const searcher = (_a = this.documentsAnalyzer[this.uri]) === null || _a === void 0 ? void 0 : _a.searcher;
            const assemblyCallParent = searcher === null || searcher === void 0 ? void 0 : searcher.findParent(this, parent);
            if (assemblyCallParent) {
                this.addTypeNode(assemblyCallParent);
                this.setParent(assemblyCallParent);
                assemblyCallParent === null || assemblyCallParent === void 0 ? void 0 : assemblyCallParent.addChild(this);
                return this;
            }
        }
        orphanNodes.push(this);
        return this;
    }
}
exports.AssemblyCallNode = AssemblyCallNode;
//# sourceMappingURL=AssemblyCallNode.js.map