"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnumDefinitionNode = void 0;
const utils_1 = require("@common/utils");
const types_1 = require("@common/types");
class EnumDefinitionNode extends types_1.Node {
    constructor(enumDefinition, uri, rootPath, documentsAnalyzer) {
        super(enumDefinition, uri, rootPath, documentsAnalyzer, enumDefinition.name);
        this.connectionTypeRules = ["Identifier", "UserDefinedTypeName"];
        this.astNode = enumDefinition;
        if (enumDefinition.loc) {
            this.nameLoc = {
                start: {
                    line: enumDefinition.loc.start.line,
                    column: enumDefinition.loc.start.column + "enum ".length
                },
                end: {
                    line: enumDefinition.loc.start.line,
                    column: enumDefinition.loc.start.column + "enum ".length + enumDefinition.name.length
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
        const searcher = (_a = this.documentsAnalyzer[this.uri]) === null || _a === void 0 ? void 0 : _a.searcher;
        if (parent) {
            this.setParent(parent);
        }
        for (const member of this.astNode.members) {
            find(member, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
        }
        const rootNode = utils_1.findSourceUnitNode(parent);
        if (rootNode) {
            const exportNodes = new Array(...rootNode.getExportNodes());
            searcher === null || searcher === void 0 ? void 0 : searcher.findAndAddExportChildren(this, exportNodes);
        }
        searcher === null || searcher === void 0 ? void 0 : searcher.findAndAddChildren(this, orphanNodes);
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
}
exports.EnumDefinitionNode = EnumDefinitionNode;
//# sourceMappingURL=EnumDefinitionNode.js.map