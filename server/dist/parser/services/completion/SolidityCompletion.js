"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolidityCompletion = void 0;
const fs = require("fs");
const path = require("path");
const utils_1 = require("@common/utils");
const types_1 = require("@common/types");
const defaultCompletion_1 = require("./defaultCompletion");
class SolidityCompletion {
    constructor(analyzer) {
        this.analyzer = analyzer;
    }
    doComplete(rootPath, position, documentAnalyzer) {
        var _a;
        const analyzerTree = documentAnalyzer.analyzerTree.tree;
        const result = { isIncomplete: false, items: [] };
        if (analyzerTree) {
            let definitionNode = this.findNodeByPosition(documentAnalyzer.uri, position, analyzerTree);
            // Check if the definitionNode exists and if not, we will check if maybe Node exists in orphan Nodes.
            // This is important for "this", "super" and global variables because they exist only in orphanNodes.
            if (!definitionNode) {
                const newPosition = {
                    line: position.line + 1,
                    column: position.character - 1 // -1 because we want to get the element before "."
                };
                for (const orphanNode of documentAnalyzer.orphanNodes) {
                    if (this.isNodePosition(orphanNode, newPosition)) {
                        definitionNode = orphanNode;
                        break;
                    }
                }
            }
            const definitionNodeName = definitionNode === null || definitionNode === void 0 ? void 0 : definitionNode.getName();
            if (definitionNodeName === "this") {
                result.items = this.getThisCompletions(documentAnalyzer, position);
            }
            else if (definitionNodeName === "super") {
                result.items = this.getSuperCompletions(documentAnalyzer, position);
            }
            else if (definitionNodeName && Object.keys(defaultCompletion_1.globalVariables).includes(definitionNodeName)) {
                result.items = this.getGlobalVariableCompletions(definitionNodeName);
            }
            else if (definitionNode && definitionNode.type === "ImportDirective") {
                result.items = this.getImportPathCompletion(rootPath, definitionNode);
            }
            else if (definitionNode && types_1.expressionNodeTypes.includes(((_a = definitionNode.getExpressionNode()) === null || _a === void 0 ? void 0 : _a.type) || "")) {
                result.items = this.getMemberAccessCompletions(documentAnalyzer.uri, position, definitionNode);
            }
            else {
                result.items = this.getDefaultCompletions(documentAnalyzer.uri, position, analyzerTree);
            }
        }
        return result;
    }
    getThisCompletions(documentAnalyzer, position) {
        const definitionNodes = [];
        const cursorPosition = utils_1.getParserPositionFromVSCodePosition(position);
        const contractDefinitionNode = this.findContractDefinition(documentAnalyzer.analyzerTree.tree, cursorPosition);
        for (const definitionNode of (contractDefinitionNode === null || contractDefinitionNode === void 0 ? void 0 : contractDefinitionNode.children) || []) {
            if ((contractDefinitionNode === null || contractDefinitionNode === void 0 ? void 0 : contractDefinitionNode.getName()) !== definitionNode.getName()) {
                definitionNodes.push(definitionNode);
            }
        }
        return this.getCompletionsFromNodes(definitionNodes);
    }
    getSuperCompletions(documentAnalyzer, position) {
        const definitionNodes = [];
        const cursorPosition = utils_1.getParserPositionFromVSCodePosition(position);
        const contractDefinitionNode = this.findContractDefinition(documentAnalyzer.analyzerTree.tree, cursorPosition);
        for (const inheritanceNode of (contractDefinitionNode === null || contractDefinitionNode === void 0 ? void 0 : contractDefinitionNode.getInheritanceNodes()) || []) {
            for (const definitionNode of inheritanceNode.children) {
                const visibility = documentAnalyzer.searcher.getNodeVisibility(definitionNode);
                if (visibility !== "private" && (contractDefinitionNode === null || contractDefinitionNode === void 0 ? void 0 : contractDefinitionNode.getName()) !== definitionNode.getName()) {
                    definitionNodes.push(definitionNode);
                }
            }
        }
        return this.getCompletionsFromNodes(definitionNodes);
    }
    getGlobalVariableCompletions(globalVariable) {
        const globalVariableFunctions = defaultCompletion_1.globalVariables[globalVariable];
        if (globalVariableFunctions) {
            return globalVariableFunctions.map((globalVariableFunction) => {
                return {
                    label: globalVariableFunction,
                    kind: types_1.CompletionItemKind.Function
                };
            });
        }
        return [];
    }
    getImportPathCompletion(rootPath, node) {
        let completions = [];
        const importPath = path.join(node.realUri, "..", node.astNode.path);
        let nodeModulesPath = utils_1.findNodeModules(node.realUri, rootPath);
        if (fs.existsSync(importPath)) {
            const files = fs.readdirSync(importPath);
            completions = this.getCompletionsFromFiles(importPath, files);
        }
        else if (nodeModulesPath) {
            nodeModulesPath = path.join(nodeModulesPath, node.astNode.path);
            if (fs.existsSync(nodeModulesPath)) {
                const files = fs.readdirSync(nodeModulesPath);
                completions = this.getCompletionsFromFiles(nodeModulesPath, files);
            }
        }
        return completions;
    }
    getMemberAccessCompletions(uri, position, node) {
        const definitionNodes = [];
        const documentAnalyzer = this.analyzer.getDocumentAnalyzer(uri);
        const cursorPosition = utils_1.getParserPositionFromVSCodePosition(position);
        for (const definitionType of node.getTypeNodes()) {
            for (const definitionNode of definitionType.children) {
                if (definitionType.uri === definitionNode.uri) {
                    const isVisible = documentAnalyzer.searcher.checkIsNodeVisible(uri, cursorPosition, definitionNode);
                    if (isVisible && definitionNode.getName() !== definitionType.getName()) {
                        definitionNodes.push(definitionNode);
                    }
                }
            }
        }
        return this.getCompletionsFromNodes(definitionNodes);
    }
    getDefaultCompletions(uri, position, analyzerTree) {
        const documentAnalyzer = this.analyzer.getDocumentAnalyzer(uri);
        const definitionNodes = documentAnalyzer.searcher.findDefinitionNodes(uri, utils_1.getParserPositionFromVSCodePosition(position), analyzerTree);
        return [
            ...this.getCompletionsFromNodes(definitionNodes),
            ...defaultCompletion_1.defaultCompletion
        ];
    }
    getCompletionsFromFiles(importPath, files) {
        const completions = [];
        files.forEach(file => {
            try {
                const absolutePath = path.join(importPath, file);
                const fileStat = fs.lstatSync(absolutePath);
                if (fileStat.isFile() && file.slice(-4) === ".sol") {
                    completions.push({
                        label: file,
                        kind: types_1.CompletionItemKind.File,
                        documentation: "Imports the package"
                    });
                }
                else if (fileStat.isDirectory() && file !== "node_modules") {
                    completions.push({
                        label: file,
                        kind: types_1.CompletionItemKind.Folder,
                        documentation: "Imports the package"
                    });
                }
            }
            catch (err) {
                console.error(err);
            }
        });
        return completions;
    }
    getCompletionsFromNodes(nodes) {
        const completions = [];
        let typeNode;
        let item;
        let contractDefinitionNode;
        for (let node of nodes) {
            const name = node.getName();
            if (name && !completions.filter(completion => completion.label === name)[0]) {
                if (node.type === "Identifier") {
                    const nodeTmp = node.getDefinitionNode();
                    node = nodeTmp ? nodeTmp : node;
                }
                switch (node.type) {
                    case "ContractDefinition":
                        contractDefinitionNode = node;
                        switch (contractDefinitionNode.getKind()) {
                            case "interface":
                                item = {
                                    label: name,
                                    kind: types_1.CompletionItemKind.Interface,
                                    documentation: {
                                        kind: types_1.MarkupKind.Markdown,
                                        value: `${contractDefinitionNode.getKind()} ${name}`
                                    }
                                };
                                break;
                            default:
                                item = {
                                    label: name,
                                    kind: types_1.CompletionItemKind.Class,
                                    documentation: {
                                        kind: types_1.MarkupKind.Markdown,
                                        value: `${contractDefinitionNode.getKind()} ${name}`
                                    }
                                };
                                break;
                        }
                        break;
                    case "StructDefinition":
                        item = {
                            label: name,
                            kind: types_1.CompletionItemKind.Struct,
                            documentation: {
                                kind: types_1.MarkupKind.Markdown,
                                value: `struct ${name}`
                            }
                        };
                        break;
                    case "EnumDefinition":
                        item = {
                            label: name,
                            kind: types_1.CompletionItemKind.Enum,
                            documentation: {
                                kind: types_1.MarkupKind.Markdown,
                                value: `enum ${name}`
                            }
                        };
                        break;
                    case "EnumValue":
                        item = {
                            label: name,
                            kind: types_1.CompletionItemKind.EnumMember,
                            documentation: {
                                kind: types_1.MarkupKind.Markdown,
                                value: `enum member ${name}`
                            }
                        };
                        break;
                    case "EventDefinition":
                        item = {
                            label: name,
                            kind: types_1.CompletionItemKind.Event,
                            documentation: {
                                kind: types_1.MarkupKind.Markdown,
                                value: `event ${name}`
                            }
                        };
                        break;
                    case "VariableDeclaration":
                        typeNode = node.astNode.typeName;
                        item = {
                            label: name,
                            kind: types_1.CompletionItemKind.Variable,
                            documentation: {
                                kind: types_1.MarkupKind.Markdown,
                                value: `*(variable)* ${this.getTypeName(typeNode)} ${name}`
                            }
                        };
                        break;
                    case "FileLevelConstant":
                        typeNode = node.astNode.typeName;
                        item = {
                            label: name,
                            kind: types_1.CompletionItemKind.Constant,
                            documentation: {
                                kind: types_1.MarkupKind.Markdown,
                                value: `*(constant)* ${this.getTypeName(typeNode)} ${name}`
                            }
                        };
                        break;
                    case "AssemblyLocalDefinition":
                        item = {
                            label: name,
                            kind: types_1.CompletionItemKind.Variable,
                            documentation: {
                                kind: types_1.MarkupKind.Markdown,
                                value: `*(assembly variable)* ${name}`
                            }
                        };
                        break;
                    default:
                        item = {
                            label: name,
                            kind: types_1.CompletionItemKind.Function
                        };
                        break;
                }
                completions.push(item);
            }
        }
        return completions;
    }
    getTypeName(typeNode) {
        switch (typeNode === null || typeNode === void 0 ? void 0 : typeNode.type) {
            case "ElementaryTypeName":
                return typeNode.name;
            case "UserDefinedTypeName":
                return typeNode.namePath;
            case "Mapping":
                return `mapping(${typeNode.keyType.type === "ElementaryTypeName" ? typeNode.keyType.name : typeNode.keyType.namePath} => ${this.getTypeName(typeNode.valueType)})`;
            case "ArrayTypeName":
                return this.getTypeName(typeNode.baseTypeName);
        }
        return "";
    }
    findNodeByPosition(uri, position, analyzerTree) {
        const documentAnalyzer = this.analyzer.getDocumentAnalyzer(uri);
        return documentAnalyzer.searcher.findNodeByPosition(uri, utils_1.getParserPositionFromVSCodePosition(position), analyzerTree, true);
    }
    isNodePosition(node, position) {
        if (node.nameLoc &&
            node.nameLoc.start.line === position.line &&
            node.nameLoc.end.line === position.line &&
            node.nameLoc.start.column <= position.column &&
            node.nameLoc.end.column >= position.column) {
            return true;
        }
        return false;
    }
    findContractDefinition(from, position, visitedNodes) {
        if (!visitedNodes) {
            visitedNodes = [];
        }
        if (!from) {
            return undefined;
        }
        if (visitedNodes.includes(from)) {
            return undefined;
        }
        // Add as visited node
        visitedNodes.push(from);
        if (from.astNode.loc &&
            from.astNode.loc.start.line <= position.line &&
            from.astNode.loc.end.line >= position.line &&
            from.type === "ContractDefinition") {
            return from;
        }
        let contractDefinitionNode;
        for (const child of from.children) {
            contractDefinitionNode = this.findContractDefinition(child, position, visitedNodes);
            if (contractDefinitionNode) {
                return contractDefinitionNode;
            }
        }
    }
}
exports.SolidityCompletion = SolidityCompletion;
//# sourceMappingURL=SolidityCompletion.js.map