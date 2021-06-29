import * as fs from "fs";
import * as path from "path";
import * as finder from "../../../parser/out/finder";
import {
    DocumentAnalyzer, ImportDirectiveNode, ContractDefinitionNode,
    Node, expressionNodeTypes 
} from "../../../parser/out/types";

import { getParserPositionFromVSCodePosition, findNodeModules } from "../utils";
import { Position, CompletionList, CompletionItem, CompletionItemKind } from "../types/languageTypes";

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
                result.items = this.getMemberAccessCompletions(definitionNode);
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

    private getMemberAccessCompletions(node: Node): CompletionItem[] {
        const definitionNodes: Node[] = [];

        for (const definitionType of node.getTypeNodes()) {
            for (const definitionChild of definitionType.children) {
                if (definitionType.uri === definitionChild.uri) {
                    definitionNodes.push(definitionChild);
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
                        kind: CompletionItemKind.File
                    });
                } else if (fileStat.isDirectory() && file !== "node_modules") {
                    completions.push({
                        label: file,
                        kind: CompletionItemKind.Folder
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
        let kind;
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
                                kind = CompletionItemKind.Interface;
                                break;
                        
                            default:
                                kind = CompletionItemKind.Class;
                                break;
                        }
                        break;

                    case "StructDefinition":
                        kind = CompletionItemKind.Struct;
                        break;

                    case "EnumDefinition":
                        kind = CompletionItemKind.Enum;
                        break;

                    case "EnumValue":
                        kind = CompletionItemKind.EnumMember;
                        break;

                    case "EventDefinition":
                        kind = CompletionItemKind.Event;
                        break;

                    case "VariableDeclaration":
                        kind = CompletionItemKind.Variable;
                        break;

                    case "FileLevelConstant":
                        kind = CompletionItemKind.Constant;
                        break;

                    case "AssemblyLocalDefinition":
                        kind = CompletionItemKind.Variable;
                        break;

                    default:
                        kind = CompletionItemKind.Function;
                        break;
                }

                completions.push({
                    label: name,
                    kind
                });
            }
        }

        return completions;
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
