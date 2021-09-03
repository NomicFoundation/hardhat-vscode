"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileLevelConstantNode = void 0;
const types_1 = require("@common/types");
class FileLevelConstantNode extends types_1.Node {
    constructor(fileLevelConstant, uri, rootPath, documentsAnalyzer) {
        super(fileLevelConstant, uri, rootPath, documentsAnalyzer, fileLevelConstant.name);
        this.connectionTypeRules = ["Identifier"];
        this.astNode = fileLevelConstant;
        if (fileLevelConstant.loc && fileLevelConstant.name) {
            this.nameLoc = {
                start: {
                    line: fileLevelConstant.loc.end.line,
                    column: fileLevelConstant.loc.end.column - fileLevelConstant.name.length
                },
                end: {
                    line: fileLevelConstant.loc.end.line,
                    column: fileLevelConstant.loc.end.column
                }
            };
        }
    }
    getDefinitionNode() {
        return this;
    }
    accept(find, orphanNodes, parent, expression) {
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
        if (this.astNode.initialValue) {
            find(this.astNode.initialValue, this.uri, this.rootPath, this.documentsAnalyzer).accept(find, orphanNodes, parent);
        }
        parent === null || parent === void 0 ? void 0 : parent.addChild(this);
        return this;
    }
    updateLocationName(typeNode) {
        var _a;
        if (this.astNode.loc && this.nameLoc && typeNode.astNode.range) {
            const diff = 1 + (+typeNode.astNode.range[1] - +typeNode.astNode.range[0]);
            this.nameLoc.start.column = this.astNode.loc.start.column + diff + 1;
            this.nameLoc.end.column = this.nameLoc.start.column + (((_a = this.getName()) === null || _a === void 0 ? void 0 : _a.length) || 0);
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
exports.FileLevelConstantNode = FileLevelConstantNode;
//# sourceMappingURL=FileLevelConstantNode.js.map