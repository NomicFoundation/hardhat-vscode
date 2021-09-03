"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModifierInvocationNode = void 0;
const types_1 = require("@common/types");
class ModifierInvocationNode extends types_1.Node {
    constructor(modifierInvocation, uri, rootPath, documentsAnalyzer) {
        super(modifierInvocation, uri, rootPath, documentsAnalyzer, modifierInvocation.name);
        this.astNode = modifierInvocation;
        if (modifierInvocation.loc) {
            this.nameLoc = {
                start: {
                    line: modifierInvocation.loc.start.line,
                    column: modifierInvocation.loc.start.column
                },
                end: {
                    line: modifierInvocation.loc.start.line,
                    column: modifierInvocation.loc.start.column + modifierInvocation.name.length
                }
            };
        }
    }
    accept(find, orphanNodes, parent, expression) {
        var _a;
        this.setExpressionNode(expression);
        for (const argument of this.astNode.arguments || []) {
            find(argument, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        if (parent) {
            const searcher = (_a = this.documentsAnalyzer[this.uri]) === null || _a === void 0 ? void 0 : _a.searcher;
            const modifierInvocationParent = searcher === null || searcher === void 0 ? void 0 : searcher.findParent(this, parent);
            if (modifierInvocationParent) {
                this.addTypeNode(modifierInvocationParent);
                this.setParent(modifierInvocationParent);
                modifierInvocationParent === null || modifierInvocationParent === void 0 ? void 0 : modifierInvocationParent.addChild(this);
                return this;
            }
        }
        orphanNodes.push(this);
        return this;
    }
}
exports.ModifierInvocationNode = ModifierInvocationNode;
//# sourceMappingURL=ModifierInvocationNode.js.map