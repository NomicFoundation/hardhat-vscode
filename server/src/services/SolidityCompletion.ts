import { DocumentAnalyzer, Node } from "../../../parser/out/types";
import * as finder from "../../../parser/out/finder";

import { getParserPositionFromVSCodePosition } from "../utils";
import { Position, CompletionList, CompletionItem, CompletionItemKind } from "../types/languageTypes";

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
                    result.items = this.getDefaultCompletions(documentAnalyzer.uri, position, analyzerTree);
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

    private getDefaultCompletions(uri: string, position: Position, analyzerTree: Node): CompletionItem[] {
        const definitionNodes: Node[] = finder.findDefinitionNodes(
            uri,
            getParserPositionFromVSCodePosition(position),
            analyzerTree
        );
        
        return this.getCompletionsFromNodes(definitionNodes);
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
