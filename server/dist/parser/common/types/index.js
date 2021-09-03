"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expressionNodeTypes = exports.declarationNodeTypes = exports.definitionNodeTypes = exports.VariableDeclarationNode = exports.FunctionDefinitionNode = exports.SourceUnitNode = exports.ImportDirectiveNode = exports.MemberAccessNode = exports.ContractDefinitionNode = exports.EmptyNode = exports.Node = exports.DiagnosticSeverity = exports.Diagnostic = exports.CompletionItemKind = exports.CompletionItem = exports.CompletionList = exports.VSCodeLocation = exports.Hover = exports.MarkupKind = exports.DocumentHighlightKind = exports.Range = exports.TextEdit = exports.DocumentHighlight = exports.WorkspaceEdit = exports.VSCodePosition = exports.TextDocument = void 0;
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
Object.defineProperty(exports, "VSCodePosition", { enumerable: true, get: function () { return vscode_languageserver_types_1.Position; } });
Object.defineProperty(exports, "WorkspaceEdit", { enumerable: true, get: function () { return vscode_languageserver_types_1.WorkspaceEdit; } });
Object.defineProperty(exports, "DocumentHighlight", { enumerable: true, get: function () { return vscode_languageserver_types_1.DocumentHighlight; } });
Object.defineProperty(exports, "TextEdit", { enumerable: true, get: function () { return vscode_languageserver_types_1.TextEdit; } });
Object.defineProperty(exports, "Range", { enumerable: true, get: function () { return vscode_languageserver_types_1.Range; } });
Object.defineProperty(exports, "DocumentHighlightKind", { enumerable: true, get: function () { return vscode_languageserver_types_1.DocumentHighlightKind; } });
Object.defineProperty(exports, "MarkupKind", { enumerable: true, get: function () { return vscode_languageserver_types_1.MarkupKind; } });
Object.defineProperty(exports, "Hover", { enumerable: true, get: function () { return vscode_languageserver_types_1.Hover; } });
Object.defineProperty(exports, "VSCodeLocation", { enumerable: true, get: function () { return vscode_languageserver_types_1.Location; } });
Object.defineProperty(exports, "CompletionList", { enumerable: true, get: function () { return vscode_languageserver_types_1.CompletionList; } });
Object.defineProperty(exports, "CompletionItem", { enumerable: true, get: function () { return vscode_languageserver_types_1.CompletionItem; } });
Object.defineProperty(exports, "CompletionItemKind", { enumerable: true, get: function () { return vscode_languageserver_types_1.CompletionItemKind; } });
Object.defineProperty(exports, "Diagnostic", { enumerable: true, get: function () { return vscode_languageserver_types_1.Diagnostic; } });
Object.defineProperty(exports, "DiagnosticSeverity", { enumerable: true, get: function () { return vscode_languageserver_types_1.DiagnosticSeverity; } });
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
Object.defineProperty(exports, "TextDocument", { enumerable: true, get: function () { return vscode_languageserver_textdocument_1.TextDocument; } });
class Node {
    /**
     * Base Node constructor
     * @param baseASTNode AST node interface.
     * @param uri The path to the node file. Uri needs to be decoded and without the "file://" prefix.
     */
    constructor(baseASTNode, uri, rootPath, documentsAnalyzer, name) {
        /**
         * Represents is node alive or not. If it isn't alive we need to remove it, because if we don't
         * remove the dead nodes, we can have references to code that doesn't exist. Default is true and
         * default implementations of the removeChildren will set isAlive to false.
         */
        this.isAlive = true;
        /**
         * Rules for declaration nodes that must be met in order for nodes to be connected.
         */
        this.connectionTypeRules = [];
        /**
         * Node children.
         */
        this.children = [];
        /**
         * Node types.
         * Example: uint256 num; uint256 will be typeNode for VariableDeclarationNode num
         * TypeNodes is an array because some declaration can have more than one types like function.
         */
        this.typeNodes = [];
        this.type = baseASTNode.type;
        this.uri = uri;
        this.rootPath = rootPath;
        this.documentsAnalyzer = documentsAnalyzer;
        this.name = name;
    }
    /**
     * Return Nodes that are the type definition of the Node
     */
    getTypeNodes() {
        let nodes = [];
        this.typeNodes.forEach(typeNode => {
            nodes = nodes.concat(typeNode.getTypeNodes());
        });
        return nodes;
    }
    /**
     * If node alerdy exists in the {@link Node.typeNodes typeNodes}, the old node will be removed, and new node will be added.
     * In that way we secure that we alwes have the latast node references in our {@link Node.typeNodes typeNodes}.
     */
    addTypeNode(node) {
        const typeNodeExist = this.typeNodes.filter(typeNode => isNodeEqual(typeNode, node))[0];
        if (typeNodeExist) {
            const index = this.typeNodes.indexOf(typeNodeExist);
            this.typeNodes.splice(index, 1);
        }
        this.typeNodes.push(node);
    }
    /**
     * An {@link Node.expressionNode expressionNode} is a Node above the current Node by AST.
     * @returns ExpressionNode if exist otherwise undefined
     */
    getExpressionNode() {
        return this.expressionNode;
    }
    setExpressionNode(node) {
        this.expressionNode = node;
    }
    /**
     * Return Node that are the definition of the Node if definition exists.
     */
    getDefinitionNode() {
        var _a;
        return (_a = this.parent) === null || _a === void 0 ? void 0 : _a.getDefinitionNode();
    }
    getDeclarationNode() {
        return this.declarationNode;
    }
    setDeclarationNode(node) {
        this.declarationNode = node;
    }
    /**
     * A Node name can be undefined for Nodes that don't have a name.
     */
    getName() {
        return this.name;
    }
    setName(name) {
        this.name = name;
    }
    /**
     * A Node alias name can be undefined for Nodes that don't declared with alias name.
     * If the aliasName exists he is the real name and {@link Node.getName getName} will return the alias.
     */
    getAliasName() {
        return this.aliasName;
    }
    setAliasName(aliasName) {
        this.aliasName = aliasName;
    }
    /**
     * If a child already exists in the {@link Node.children children}, it will not be added.
     */
    addChild(child) {
        const childExist = this.children.filter(tmpChild => isNodeEqual(tmpChild, child))[0];
        if (!childExist) {
            this.children.push(child);
        }
    }
    /**
     * Note that removeChild will set {@link Node.isAlive isAlive} to false for the removed child
     * @param child Child who you want to remove
     */
    removeChild(child) {
        const index = this.children.indexOf(child, 0);
        if (index > -1) {
            this.children.splice(index, 1);
        }
        child.isAlive = false;
    }
    setParent(parent) {
        this.parent = parent;
    }
    getParent() {
        return this.parent;
    }
}
exports.Node = Node;
class EmptyNode extends Node {
    constructor(emptyNode, uri, rootPath, documentsAnalyzer) {
        super(emptyNode, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = emptyNode;
    }
    accept(find, orphanNodes, parent, expression) {
        return this;
    }
}
exports.EmptyNode = EmptyNode;
class ContractDefinitionNode extends Node {
    constructor() {
        super(...arguments);
        this.inheritanceNodes = [];
    }
    /**
     * @returns inherited Nodes
     */
    getInheritanceNodes() {
        return this.inheritanceNodes;
    }
}
exports.ContractDefinitionNode = ContractDefinitionNode;
class MemberAccessNode extends Node {
    setPreviousMemberAccessNode(node) {
        this.previousMemberAccessNode = node;
    }
    /**
     * @returns get previous MemberAccessNode
     */
    getPreviousMemberAccessNode() {
        return this.previousMemberAccessNode;
    }
}
exports.MemberAccessNode = MemberAccessNode;
class ImportDirectiveNode extends Node {
    constructor() {
        super(...arguments);
        this.aliasNodes = [];
    }
    getImportPath() {
        return this.uri;
    }
    addAliasNode(aliasNode) {
        this.aliasNodes.push(aliasNode);
    }
    getAliasNodes() {
        return this.aliasNodes;
    }
}
exports.ImportDirectiveNode = ImportDirectiveNode;
class SourceUnitNode extends Node {
    constructor() {
        super(...arguments);
        this.importNodes = [];
        this.exportNodes = [];
    }
    addImportNode(importNode) {
        this.importNodes.push(importNode);
    }
    /**
     * @returns all imported Nodes in this SourceUint.
     */
    getImportNodes() {
        return this.importNodes;
    }
    addExportNode(exportNode) {
        this.exportNodes.push(exportNode);
    }
    /**
     * @returns all exported Nodes from this SourceUint.
     */
    getExportNodes() {
        return this.exportNodes;
    }
}
exports.SourceUnitNode = SourceUnitNode;
class FunctionDefinitionNode extends Node {
    /**
     * Visability can be 'default' | 'external' | 'internal' | 'public' | 'private'
     *
     * @returns function visability.
     */
    getVisibility() {
        return this.astNode.visibility;
    }
}
exports.FunctionDefinitionNode = FunctionDefinitionNode;
class VariableDeclarationNode extends Node {
    /**
     * Visability can be 'public' | 'private' | 'internal' | 'default'
     *
     * @returns function visability.
     */
    getVisibility() {
        return this.astNode.visibility;
    }
}
exports.VariableDeclarationNode = VariableDeclarationNode;
exports.definitionNodeTypes = ["ContractDefinition", "StructDefinition", "ModifierDefinition", "FunctionDefinition", "EventDefinition", "EnumDefinition", "AssemblyLocalDefinition", "LabelDefinition", "AssemblyFunctionDefinition", "UserDefinedTypeName", "FileLevelConstant"];
exports.declarationNodeTypes = ["StateVariableDeclaration", "UsingForDeclaration", "VariableDeclaration", "VariableDeclarationStatement"];
exports.expressionNodeTypes = ["IndexAccess", "IndexRangeAccess", "TupleExpression", "BinaryOperation", "Conditional", "MemberAccess", "FunctionCall", "UnaryOperation", "NewExpression", "NameValueExpression", "BooleanLiteral", "HexLiteral", "StringLiteral", "NumberLiteral", "Identifier", "TupleExpression", "TypeNameExpression"];
/**
 * Checks if 2 nodes have the same {@link Node.getName name}, {@link Node.nameLoc location name} and {@link Node.uri URI}.
 * @returns true if the Nodes are equal, otherwise false.
 */
function isNodeEqual(node1, node2) {
    if (!node1 || !node2) {
        return false;
    }
    if (node1 === node2) {
        return true;
    }
    if (node1.getName() === node2.getName() &&
        JSON.stringify(node1.nameLoc) === JSON.stringify(node2.nameLoc) &&
        node1.uri === node2.uri) {
        return true;
    }
    return false;
}
//# sourceMappingURL=index.js.map