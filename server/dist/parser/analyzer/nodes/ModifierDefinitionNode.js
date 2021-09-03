"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModifierDefinitionNode = void 0;
const utils_1 = require("@common/utils");
const types_1 = require("@common/types");
class ModifierDefinitionNode extends types_1.Node {
    constructor(modifierDefinition, uri, rootPath, documentsAnalyzer) {
        super(modifierDefinition, uri, rootPath, documentsAnalyzer, modifierDefinition.name);
        this.connectionTypeRules = ["ModifierInvocation"];
        this.astNode = modifierDefinition;
        if (modifierDefinition.loc) {
            this.nameLoc = {
                start: {
                    line: modifierDefinition.loc.start.line,
                    column: modifierDefinition.loc.start.column + "modifier ".length
                },
                end: {
                    line: modifierDefinition.loc.start.line,
                    column: modifierDefinition.loc.start.column + "modifier ".length + modifierDefinition.name.length
                }
            };
        }
        this.addTypeNode(this);
    }
    getTypeNodes() {
        return this.typeNodes;
    }
    getDefinitionNode() {
        return this;
    }
    accept(find, orphanNodes, parent, expression) {
        var _a;
        this.setExpressionNode(expression);
        if (parent) {
            this.setParent(parent);
        }
        for (const override of this.astNode.override || []) {
            find(override, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        for (const param of this.astNode.parameters || []) {
            find(param, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        if (this.astNode.body) {
            find(this.astNode.body, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        const rootNode = utils_1.findSourceUnitNode(parent);
        const searcher = (_a = this.documentsAnalyzer[this.uri]) === null || _a === void 0 ? void 0 : _a.searcher;
        if (rootNode) {
            const exportNodes = new Array(...rootNode.getExportNodes());
            searcher === null || searcher === void 0 ? void 0 : searcher.findAndAddExportChildren(this, exportNodes);
        }
        searcher === null || searcher === void 0 ? void 0 : searcher.findAndAddChildren(this, orphanNodes);
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
}
exports.ModifierDefinitionNode = ModifierDefinitionNode;
//# sourceMappingURL=ModifierDefinitionNode.js.map