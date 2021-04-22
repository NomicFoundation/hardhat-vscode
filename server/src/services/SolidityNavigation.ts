import { Node } from "../../../parser/out/analyzer/nodes/Node";
import * as finder from "../../../parser/out/analyzer/finder";

import {
	TextDocument, Position, Location,
	Range, WorkspaceEdit, TextEdit
} from '../types/languageTypes';

export class SolidityNavigation {
	public findDefinition(position: Position, analyzerTree: Node): Location | undefined {
		// TO-DO: Implement findDefinition
		return undefined;
	}

	public findReferences(position: Position, analyzerTree: Node): Location[] {
		const highlightNodes = this.findHighlightNodes(position, analyzerTree);
		const references: Location[] = [];

		highlightNodes.forEach(highlightNode => {
			if (highlightNode.astNode.loc) {
				// TO-DO: Remove -1 when "@solidity-parser" fix line counting.
				// Why -1? Because "vs-code" line counting from 0, and "@solidity-parser" from 1.
				references.push({
					uri: highlightNode.uri,
					range: Range.create(
						Position.create(highlightNode.astNode.loc.start.line - 1, highlightNode.astNode.loc.start.column),
						Position.create(highlightNode.astNode.loc.end.line - 1, highlightNode.astNode.loc.end.column),
					)
				});
			}
		});

        return references;
	}

	public doRename(document: TextDocument, position: Position, newName: string, analyzerTree: Node): WorkspaceEdit {
		const highlightNodes = this.findHighlightNodes(position, analyzerTree);
		const edits: TextEdit[] = [];

		highlightNodes.forEach(highlightNode => {
			if (highlightNode.nameLoc) {
				// TO-DO: Remove -1 when "@solidity-parser" fix line counting.
				// Why -1? Because "vs-code" line counting from 0, and "@solidity-parser" from 1.
				const range = Range.create(
					Position.create(highlightNode.nameLoc.start.line - 1, highlightNode.nameLoc.start.column),
					Position.create(highlightNode.nameLoc.end.line - 1, highlightNode.nameLoc.end.column),
				);

				edits.push(TextEdit.replace(range, newName));
			}
		});

		return {
			changes: {
				[document.uri]: edits
			}
		};
	}

	private findHighlightNodes(position: Position, analyzerTree: Node): Node[] {
		const highlights: Node[] = [];

		const node = finder.findNodeByPosition({
			// TO-DO: Remove +1 when "@solidity-parser" fix line counting.
			// Why +1? Because "vs-code" line counting from 0, and "@solidity-parser" from 1.
			line: position.line + 1,
			column: position.character
		}, analyzerTree);

		const nodeName = node?.getName();
		if (node && nodeName) {
			this.extractHighlightsFromNode(nodeName, node, highlights);
		}

        return highlights;
	}

	private extractHighlightsFromNode(name: string, node: Node, highlights: Node[]) {
		if (name === node.getName()) {
			highlights.push(node);
		}

		for (const child of node.children) {
			this.extractHighlightsFromNode(name, child, highlights);
		}
	}
}
