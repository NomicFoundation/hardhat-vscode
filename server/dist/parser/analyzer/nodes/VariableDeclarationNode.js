"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableDeclarationNode = void 0;
const utils_1 = require("@common/utils");
const types_1 = require("@common/types");
class VariableDeclarationNode extends types_1.VariableDeclarationNode {
    constructor(variableDeclaration, uri, rootPath, documentsAnalyzer) {
        super(variableDeclaration, uri, rootPath, documentsAnalyzer, variableDeclaration.name || undefined);
        this.connectionTypeRules = ["Identifier", "MemberAccess", "AssemblyCall"];
        this.astNode = variableDeclaration;
        if (variableDeclaration.loc && variableDeclaration.name) {
            this.nameLoc = {
                start: {
                    line: variableDeclaration.loc.end.line,
                    column: variableDeclaration.loc.end.column - variableDeclaration.name.length
                },
                end: {
                    line: variableDeclaration.loc.end.line,
                    column: variableDeclaration.loc.end.column
                }
            };
        }
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
        if (this.astNode.typeName) {
            const typeNode = find(this.astNode.typeName, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, this);
            this.addTypeNode(typeNode);
            typeNode.setDeclarationNode(this);
            this.updateLocationName(typeNode);
        }
        const rootNode = utils_1.findSourceUnitNode(parent);
        if (rootNode) {
            const searcher = (_a = this.documentsAnalyzer[this.uri]) === null || _a === void 0 ? void 0 : _a.searcher;
            const exportNodes = new Array(...rootNode.getExportNodes());
            searcher === null || searcher === void 0 ? void 0 : searcher.findAndAddExportChildren(this, exportNodes);
        }
        // Don't handle expression, it is handled in StateVariableDeclarationNode
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
    updateLocationName(typeNode) {
        var _a;
        if (this.astNode.loc && this.nameLoc && typeNode.astNode.range) {
            const diff = 1 + (+typeNode.astNode.range[1] - +typeNode.astNode.range[0]);
            this.nameLoc.start.column = this.astNode.loc.start.column + diff + 1;
            this.nameLoc.end.column = this.nameLoc.start.column + (((_a = this.getName()) === null || _a === void 0 ? void 0 : _a.length) || 0);
            if (this.astNode.visibility && this.astNode.visibility !== "default") {
                this.nameLoc.start.column += this.astNode.visibility.length + 1;
                this.nameLoc.end.column += this.astNode.visibility.length + 1;
            }
            if (this.astNode.storageLocation) {
                this.nameLoc.start.column += this.astNode.storageLocation.length + 1;
                this.nameLoc.end.column += this.astNode.storageLocation.length + 1;
            }
            if (this.astNode.isDeclaredConst) {
                this.nameLoc.start.column += "constant ".length;
                this.nameLoc.end.column += "constant ".length;
            }
            if (this.astNode.isImmutable) {
                this.nameLoc.start.column += "immutable ".length;
                this.nameLoc.end.column += "immutable ".length;
            }
            if (this.astNode.loc.end.column < this.nameLoc.end.column) {
                this.astNode.loc.end.column = this.nameLoc.end.column;
            }
        }
    }
}
exports.VariableDeclarationNode = VariableDeclarationNode;
//# sourceMappingURL=VariableDeclarationNode.js.map