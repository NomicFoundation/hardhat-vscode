import * as fs from "fs";
import * as path from "path";
import * as finder from "../../../parser/out/finder";
import {
    DocumentAnalyzer, ImportDirectiveNode, ContractDefinitionNode,
    Node, VariableDeclaration, FileLevelConstant, TypeName, expressionNodeTypes
} from "../../../parser/out/types";

import { getParserPositionFromVSCodePosition, findNodeModules } from "../utils";
import { Position, CompletionList, CompletionItem, CompletionItemKind, MarkupKind } from "../types/languageTypes";

export class SolidityCompletion {
    public doComplete(rootPath: string, position: Position, documentAnalyzer: DocumentAnalyzer): CompletionList {
        const analyzerTree = documentAnalyzer.analyzerTree;
        const result: CompletionList = { isIncomplete: false, items: [] };

        if (analyzerTree) {
            const definitionNode = this.findNodeByPosition(documentAnalyzer.uri, position, analyzerTree);

            if (definitionNode && definitionNode.type === "ImportDirective") {
                result.items = this.getImportPathCompletion(rootPath, definitionNode as ImportDirectiveNode);
            }
            else if (definitionNode && expressionNodeTypes.includes(definitionNode.getExpressionNode()?.type || "")) {
                result.items = this.getMemberAccessCompletions(documentAnalyzer.uri, position, definitionNode);
            }
            else {
                result.items = this.getDefaultCompletions(documentAnalyzer.uri, position, analyzerTree);
            }
        }

        return result;
    }

    private getImportPathCompletion(rootPath: string, node: ImportDirectiveNode): CompletionItem[] {
        let completions: CompletionItem[] = [];
        const importPath = path.join(node.realUri, "..", node.astNode.path);
        let nodeModulesPath = findNodeModules(node.realUri, rootPath);

        if (fs.existsSync(importPath)) {
            const files = fs.readdirSync(importPath);
            completions = this.getCompletionsFromFiles(importPath, files);
        } else if (nodeModulesPath) {
            nodeModulesPath = path.join(nodeModulesPath, node.astNode.path);

            if (fs.existsSync(nodeModulesPath)) {
                const files = fs.readdirSync(nodeModulesPath);
                completions = this.getCompletionsFromFiles(nodeModulesPath, files);
            }
        }

        return completions;
    }

    private getMemberAccessCompletions(uri: string, position: Position, node: Node): CompletionItem[] {
        const definitionNodes: Node[] = [];
        const cursorPosition = getParserPositionFromVSCodePosition(position);

        for (const definitionType of node.getTypeNodes()) {
            for (const definitionChild of definitionType.children) {
                if (definitionType.uri === definitionChild.uri) {
                    const isVisible = finder.checkIsNodeVisible(uri, cursorPosition, definitionChild);

                    if (isVisible && definitionChild.getName() !== definitionType.getName()) {
                        definitionNodes.push(definitionChild);
                    }
                }
            }
        }

        return this.getCompletionsFromNodes(definitionNodes);
    }

    private getDefaultCompletions(uri: string, position: Position, analyzerTree: Node): CompletionItem[] {
        const definitionNodes: Node[] = finder.findDefinitionNodes(
            uri,
            getParserPositionFromVSCodePosition(position),
            analyzerTree
        );

        return this.getCompletionsFromNodes(definitionNodes);
    }

    private getCompletionsFromFiles(importPath: string, files: string[]): CompletionItem[] {
        const completions: CompletionItem[] = [];

        files.forEach(file => {
            try {
                const absolutePath = path.join(importPath, file);
                const fileStat = fs.lstatSync(absolutePath);

                if (fileStat.isFile() && file.slice(-4) === ".sol") {
                    completions.push({
                        label: file,
                        kind: CompletionItemKind.File,
                        documentation: "Imports the package"
                    });
                } else if (fileStat.isDirectory() && file !== "node_modules") {
                    completions.push({
                        label: file,
                        kind: CompletionItemKind.Folder,
                        documentation: "Imports the package"
                    });
                }
            } catch (err) {
                console.error(err);
            }
        });

        return completions;
    }

    private getCompletionsFromNodes(nodes: Node[]): CompletionItem[] {
        const completions: CompletionItem[] = [];
        let typeNode: TypeName | null;
        let item: CompletionItem;
        let contractDefinitionNode: ContractDefinitionNode;

        for (let node of nodes) {
            const name = node.getName();

            if (name && !completions.filter(completion => completion.label === name)[0]) {
                if (node.type === "Identifier") {
                    const nodeTmp = node.getDefinitionNode();
                    node = nodeTmp ? nodeTmp : node;
                }

                switch (node.type) {
                    case "ContractDefinition":
                        contractDefinitionNode = node as ContractDefinitionNode;

                        switch (contractDefinitionNode.getKind()) {
                            case "interface":
                                item = {
                                    label: name,
                                    kind: CompletionItemKind.Interface,
                                    documentation: {
                                        kind: MarkupKind.Markdown,
                                        value: `${contractDefinitionNode.getKind()} ${name}`
                                    }
                                };
                                break;
                        
                            default:
                                item = {
                                    label: name,
                                    kind: CompletionItemKind.Class,
                                    documentation: {
                                        kind: MarkupKind.Markdown,
                                        value: `${contractDefinitionNode.getKind()} ${name}`
                                    }
                                };
                                break;
                        }
                        break;

                    case "StructDefinition":
                        item = {
                            label: name,
                            kind: CompletionItemKind.Struct,
                            documentation: {
                                kind: MarkupKind.Markdown,
                                value: `struct ${name}`
                            }
                        };
                        break;

                    case "EnumDefinition":
                        item = {
                            label: name,
                            kind: CompletionItemKind.Enum,
                            documentation: {
                                kind: MarkupKind.Markdown,
                                value: `enum ${name}`
                            }
                        };
                        break;

                    case "EnumValue":
                        item = {
                            label: name,
                            kind: CompletionItemKind.EnumMember,
                            documentation: {
                                kind: MarkupKind.Markdown,
                                value: `enum member ${name}`
                            }
                        };
                        break;

                    case "EventDefinition":
                        item = {
                            label: name,
                            kind: CompletionItemKind.Event,
                            documentation: {
                                kind: MarkupKind.Markdown,
                                value: `event ${name}`
                            }
                        };
                        break;

                    case "VariableDeclaration":
                        typeNode = (node.astNode as VariableDeclaration).typeName;

                        item = {
                            label: name,
                            kind: CompletionItemKind.Variable,
                            documentation: {
                                kind: MarkupKind.Markdown,
                                value: `*(variable)* ${this.getTypeName(typeNode)} ${name}`
                            }
                        };
                        break;

                    case "FileLevelConstant":
                        typeNode = (node.astNode as FileLevelConstant).typeName;

                        item = {
                            label: name,
                            kind: CompletionItemKind.Constant,
                            documentation: {
                                kind: MarkupKind.Markdown,
                                value: `*(constant)* ${this.getTypeName(typeNode)} ${name}`
                            }
                        };
                        break;

                    case "AssemblyLocalDefinition":
                        item = {
                            label: name,
                            kind: CompletionItemKind.Variable,
                            documentation: {
                                kind: MarkupKind.Markdown,
                                value: `*(assembly variable)* ${name}`
                            }
                        };
                        break;

                    default:
                        item = {
                            label: name,
                            kind: CompletionItemKind.Function
                        };
                        break;
                }

                completions.push(item);
            }
        }

        return completions;
    }

    private getTypeName(typeNode: TypeName | null): string {
        switch (typeNode?.type) {
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

    private findNodeByPosition(uri: string, position: Position, analyzerTree: Node): Node | undefined {
		return finder.findNodeByPosition(
            uri,
            getParserPositionFromVSCodePosition(position),
            analyzerTree,
            false,
            true
        );
	}
}
