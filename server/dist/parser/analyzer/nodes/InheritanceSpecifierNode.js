"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InheritanceSpecifierNode = void 0;
const types_1 = require("@common/types");
class InheritanceSpecifierNode extends types_1.Node {
    constructor(inheritanceSpecifier, uri, rootPath, documentsAnalyzer) {
        super(inheritanceSpecifier, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = inheritanceSpecifier;
    }
    accept(find, orphanNodes, parent, expression) {
        this.setExpressionNode(expression);
        const baseNode = find(this.astNode.baseName, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        for (const argument of this.astNode.arguments) {
            find(argument, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        return baseNode;
    }
}
exports.InheritanceSpecifierNode = InheritanceSpecifierNode;
//# sourceMappingURL=InheritanceSpecifierNode.js.map