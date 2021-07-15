import { Analyzer, types } from "solidity-analyzer";

import { getParserPositionFromVSCodePosition, getRange } from "../../utils";
import {
	TextDocument, Position, Location,
	WorkspaceEdit, TextEdit
} from "../../types/languageTypes";

export class SolidityNavigation {
	analyzer: Analyzer

	constructor(analyzer: Analyzer) {
		this.analyzer = analyzer;
	}

	public findDefinition(uri: string, position: Position, analyzerTree: types.Node): Location | undefined {
		const definitionNode = this.findNodeByPosition(uri, position, analyzerTree);

		if (definitionNode && definitionNode.astNode.loc) {
			return {
				uri: definitionNode.uri,
				range: getRange(definitionNode.astNode.loc)
			};
		}

		return undefined;
	}

	public findTypeDefinition(uri: string, position: Position, analyzerTree: types.Node): Location[] {
		const definitionNode = this.findNodeByPosition(uri, position, analyzerTree);

		if (!definitionNode) {
			return [];
		}

		return this.getHighlightLocations(definitionNode.getTypeNodes());
	}

	public findReferences(uri: string, position: Position, analyzerTree: types.Node): Location[] {
		const highlightNodes = this.findHighlightNodes(uri, position, analyzerTree);

		return this.getHighlightLocations(highlightNodes);
	}

	public findImplementation(uri: string, position: Position, analyzerTree: types.Node): Location[] {
		const highlightNodes = this.findHighlightNodes(uri, position, analyzerTree);

		const implementationNodes: types.Node[] = [];
		for (const highlightNode of highlightNodes) {
			if (types.definitionNodeTypes.includes(highlightNode.type)) {
				implementationNodes.push(highlightNode);
			}
		}

        return this.getHighlightLocations(implementationNodes);
	}

	public doRename(uri: string, document: TextDocument, position: Position, newName: string, analyzerTree: types.Node): WorkspaceEdit {
		const highlightNodes = this.findHighlightNodes(uri, position, analyzerTree);
		const workspaceEdit: WorkspaceEdit = { changes: {} };

		highlightNodes.forEach(highlightNode => {
			if (highlightNode.nameLoc && workspaceEdit.changes) {
				if (workspaceEdit.changes && !workspaceEdit.changes[highlightNode.uri]) {
					workspaceEdit.changes[highlightNode.uri] = [];
				}

				const range = getRange(highlightNode.nameLoc);
				workspaceEdit.changes[highlightNode.uri].push(TextEdit.replace(range, newName));

				highlightNode.setName(newName);
			}
		});

		return workspaceEdit;
	}

	private getHighlightLocations(highlightNodes: types.Node[]): Location[] {
		const locations: Location[] = [];

		highlightNodes.forEach(highlightNode => {
			if (highlightNode.nameLoc) {
				locations.push({
					uri: highlightNode.uri,
					range: getRange(highlightNode.nameLoc)
				});
			}
		});

        return locations;
	}

	private findHighlightNodes(uri: string, position: Position, analyzerTree: types.Node): types.Node[] {
		const highlights: types.Node[] = [];

		const node = this.findNodeByPosition(uri, position, analyzerTree);

		const nodeName = node?.getName();
		if (node && nodeName) {
			this.extractHighlightsFromNodeRecursive(nodeName, node, highlights);
		}

        return highlights;
	}

	private findNodeByPosition(uri: string, position: Position, analyzerTree: types.Node): types.Node | undefined {
		const documentAnalyzer = this.analyzer.getDocumentAnalyzer(uri);
		return documentAnalyzer.searcher.findDefinitionNodeByPosition(uri, getParserPositionFromVSCodePosition(position), analyzerTree);
	}

	private extractHighlightsFromNodeRecursive(name: string, node: types.Node, results: types.Node[], visitedNodes?: types.Node[]): void {
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
}
