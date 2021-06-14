import {
	Location as NodeLocation, Node,
	definitionNodeTypes
} from "../../../parser/out/analyzer/nodes/Node";
import * as finder from "../../../parser/out/analyzer/finder";

import {
	TextDocument, Position, Location,
	Range, WorkspaceEdit, TextEdit
} from "../types/languageTypes";

export class SolidityNavigation {
	public findDefinition(uri: string, position: Position, analyzerTree: Node): Location | undefined {
		const definitionNode = this.findNodeByPosition(uri, position, analyzerTree);

		if (definitionNode && definitionNode.astNode.loc) {
			return {
				uri: definitionNode.uri,
				range: this.getRange(definitionNode.astNode.loc)
			};
		}

		return undefined;
	}

	public findTypeDefinition(uri: string, position: Position, analyzerTree: Node): Location[] {
		const definitionNode = this.findNodeByPosition(uri, position, analyzerTree);

		if (!definitionNode) {
			return [];
		}

		return this.getHighlightLocations(definitionNode.getTypeNodes());
	}

	public findReferences(uri: string, position: Position, analyzerTree: Node): Location[] {
		const highlightNodes = this.findHighlightNodes(uri, position, analyzerTree);

		return this.getHighlightLocations(highlightNodes);
	}

	public findImplementation(uri: string, position: Position, analyzerTree: Node): Location[] {
		const highlightNodes = this.findHighlightNodes(uri, position, analyzerTree);

		const implementationNodes: Node[] = [];
		for (const highlightNode of highlightNodes) {
			if (definitionNodeTypes.includes(highlightNode.type)) {
				implementationNodes.push(highlightNode);
			}
		}

        return this.getHighlightLocations(implementationNodes);
	}

	public doRename(uri: string, document: TextDocument, position: Position, newName: string, analyzerTree: Node): WorkspaceEdit {
		const highlightNodes = this.findHighlightNodes(uri, position, analyzerTree);
		const workspaceEdit: WorkspaceEdit = { changes: {} };

		highlightNodes.forEach(highlightNode => {
			if (highlightNode.nameLoc && workspaceEdit.changes) {
				if (workspaceEdit.changes && !workspaceEdit.changes[highlightNode.uri]) {
					workspaceEdit.changes[highlightNode.uri] = [];
				}

				const range = this.getRange(highlightNode.nameLoc);
				workspaceEdit.changes[highlightNode.uri].push(TextEdit.replace(range, newName));
			}
		});

		return workspaceEdit;
	}

	private getHighlightLocations(highlightNodes: Node[]): Location[] {
		const locations: Location[] = [];

		highlightNodes.forEach(highlightNode => {
			if (highlightNode.nameLoc) {
				locations.push({
					uri: highlightNode.uri,
					range: this.getRange(highlightNode.nameLoc)
				});
			}
		});

		console.log(locations);

        return locations;
	}

	private findHighlightNodes(uri: string, position: Position, analyzerTree: Node): Node[] {
		const highlights: Node[] = [];

		const node = this.findNodeByPosition(uri, position, analyzerTree);

		const nodeName = node?.getName();
		if (node && nodeName) {
			this.extractHighlightsFromNodeRecursive(nodeName, node, highlights);
		}

        return highlights;
	}

	private findNodeByPosition(uri: string, position: Position, analyzerTree: Node): Node | undefined {
		return finder.findNodeByPosition(uri, {
			// TO-DO: Remove +1 when "@solidity-parser" fix line counting.
			// Why +1? Because "vs-code" line counting from 0, and "@solidity-parser" from 1.
			line: position.line + 1,
			column: position.character
		}, analyzerTree);
	}

	private extractHighlightsFromNodeRecursive(name: string, node: Node, results: Node[], visitedNodes?: Node[]): void {
		if (!visitedNodes) {
			visitedNodes = [];
		}

		if (visitedNodes.includes(node)) {
			return;
		}

		visitedNodes.push(node);

		if (name === node.getName() || name === node.getAliasName()) {
			results.push(node);
		}

		for (const child of node.children) {
			this.extractHighlightsFromNodeRecursive(name, child, results, visitedNodes);
		}
	}

	private getRange(loc: NodeLocation): Range {
		// TO-DO: Remove -1 when "@solidity-parser" fix line counting.
		// Why -1? Because "vs-code" line counting from 0, and "@solidity-parser" from 1.
		return Range.create(
			Position.create(loc.start.line - 1, loc.start.column),
			Position.create(loc.end.line - 1, loc.end.column),
		);
	}
}
