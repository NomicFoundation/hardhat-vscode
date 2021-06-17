import { DocumentAnalyzer, Node, definitionNodeTypes } from "../../../parser/out/analyzer/common/types";
import * as finder from "../../../parser/out/analyzer/common/finder";

import { Position, CompletionList, CompletionItem, CompletionItemKind } from '../types/languageTypes';

export class SolidityCompletion {
    public doComplete(position: Position, documentAnalyzer: DocumentAnalyzer): CompletionList {
        const analyzerTree = documentAnalyzer.analyzerTree;
        const result: CompletionList = { isIncomplete: false, items: [] };

        if (analyzerTree) {
            const definitionNode = this.findNodeByPosition(documentAnalyzer.uri, position, analyzerTree);

            switch (definitionNode?.type) {
                case "ImportDirective":
                    result.items = this.getImportPathCompletion(definitionNode);
                    break;

                case "MemberAccess":
                    result.items = this.getMemberAccessCompletions(definitionNode);
                    break;

                default:
                    result.items = this.getDefaultCompletions(definitionNode, analyzerTree);
                    break;
            }
        }

        console.log(result);

        return result;
    }

    private getImportPathCompletion(node: Node): CompletionItem[] {
        return [];
    }

    private getMemberAccessCompletions(node: Node): CompletionItem[] {
        return [];
    }

    private getDefaultCompletions(node: Node | undefined, analyzerTree: Node): CompletionItem[] {
        const completions: CompletionItem[] = [];

        if (!node) {
            this.findAllDefaultCompletions(analyzerTree, completions);
        }

        return completions;
    }

    private findAllDefaultCompletions(node: Node | undefined, completions: CompletionItem[]): void {
        if (!node) {
            return;
        }

        for (const child of node.children) {
            const name = child.getName();

            if (
                definitionNodeTypes.includes(child.type) && name &&
                !completions.filter(completion => completion.label === name)[0]
            ) {
                completions.push({
                    label: name,
                    kind: CompletionItemKind.Function
                });
            }

            this.findAllDefaultCompletions(child, completions);
        }
    }

    private findNodeByPosition(uri: string, position: Position, analyzerTree: Node): Node | undefined {
		return finder.findNodeByPosition(uri, {
			// TO-DO: Remove +1 when "@solidity-parser" fix line counting.
			// Why +1? Because "vs-code" line counting from 0, and "@solidity-parser" from 1.
			line: position.line + 1,
			column: position.character
		}, analyzerTree, false, true);
	}
}
