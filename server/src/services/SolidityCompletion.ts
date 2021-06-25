import * as fs from "fs";
import * as path from "path";
import * as finder from "../../../parser/out/finder";
import { DocumentAnalyzer, Node, ImportDirectiveNode, expressionNodeTypes } from "../../../parser/out/types";

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

        console.log(result);

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

        for (const node of nodes) {
            const name = node.getName();

            if (name && !completions.filter(completion => completion.label === name)[0]) {
                completions.push({
                    label: name,
                    kind: CompletionItemKind.Function
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
