"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructDefinitionNode = void 0;
const utils_1 = require("@common/utils");
const types_1 = require("@common/types");
class StructDefinitionNode extends types_1.Node {
    constructor(structDefinition, uri, rootPath, documentsAnalyzer) {
        super(structDefinition, uri, rootPath, documentsAnalyzer, structDefinition.name);
        this.connectionTypeRules = ["UserDefinedTypeName", "MemberAccess", "FunctionCall"];
        this.astNode = structDefinition;
        if (structDefinition.loc) {
            this.nameLoc = {
                start: {
                    line: structDefinition.loc.start.line,
                    column: structDefinition.loc.start.column + "struct ".length
                },
                end: {
                    line: structDefinition.loc.start.line,
                    column: structDefinition.loc.start.column + "struct ".length + structDefinition.name.length
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
        for (const member of this.astNode.members) {
            find(member, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
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
exports.StructDefinitionNode = StructDefinitionNode;
//# sourceMappingURL=StructDefinitionNode.js.map