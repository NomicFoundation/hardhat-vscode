import { Analyzer } from "@analyzer/index";
import {
	TextDocument, VSCodePosition, VSCodeLocation, WorkspaceEdit,
	TextEdit, Node, definitionNodeTypes
} from "@common/types";

import { getParserPositionFromVSCodePosition, getRange } from "@common/utils";

export class SolidityNavigation {
	analyzer: Analyzer

	constructor(analyzer: Analyzer) {
		this.analyzer = analyzer;
	}

	public findDefinition(uri: string, position: VSCodePosition, analyzerTree: Node): VSCodeLocation | undefined {
		const definitionNode = this.findNodeByPosition(uri, position, analyzerTree);

		if (definitionNode && definitionNode.astNode.loc) {
			return {
				uri: definitionNode.uri,
				range: getRange(definitionNode.astNode.loc)
			};
		}

		return undefined;
	}

	public findTypeDefinition(uri: string, position: VSCodePosition, analyzerTree: Node): VSCodeLocation[] {
		const definitionNode = this.findNodeByPosition(uri, position, analyzerTree);

		if (!definitionNode) {
			return [];
		}

		return this.getHighlightLocations(definitionNode.getTypeNodes());
	}

	public findReferences(uri: string, position: VSCodePosition, analyzerTree: Node): VSCodeLocation[] {
		const highlightNodes = this.findHighlightNodes(uri, position, analyzerTree);

		return this.getHighlightLocations(highlightNodes);
	}

	public findImplementation(uri: string, position: VSCodePosition, analyzerTree: Node): VSCodeLocation[] {
		const highlightNodes = this.findHighlightNodes(uri, position, analyzerTree);

		const implementationNodes: Node[] = [];
		for (const highlightNode of highlightNodes) {
			if (definitionNodeTypes.includes(highlightNode.type)) {
				implementationNodes.push(highlightNode);
			}
		}

        return this.getHighlightLocations(implementationNodes);
	}

	public doRename(uri: string, document: TextDocument, position: VSCodePosition, newName: string, analyzerTree: Node): WorkspaceEdit {
		const highlightNodes = this.findHighlightNodes(uri, position, analyzerTree);
		const workspaceEdit: WorkspaceEdit = { changes: {} };

		highlightNodes.forEach(highlightNode => {
			if (highlightNode.nameLoc && workspaceEdit.changes) {
				if (workspaceEdit.changes && !workspaceEdit.changes[highlightNode.uri]) {
					workspaceEdit.changes[highlightNode.uri] = [];
				}

				const range = getRange(highlightNode.nameLoc);
				workspaceEdit.changes[highlightNode.uri].push(TextEdit.replace(range, newName));

				highlightNode.isAlive = false;
			}
		});

		return workspaceEdit;
	}

	private getHighlightLocations(highlightNodes: Node[]): VSCodeLocation[] {
		const locations: VSCodeLocation[] = [];

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

	private findHighlightNodes(uri: string, position: VSCodePosition, analyzerTree: Node): Node[] {
		const highlights: Node[] = [];

		const node = this.findNodeByPosition(uri, position, analyzerTree);

		const nodeName = node?.getName();
		if (node && nodeName) {
			this.extractHighlightsFromNodeRecursive(nodeName, node, highlights);
		}

        return highlights;
	}

	private findNodeByPosition(uri: string, position: VSCodePosition, analyzerTree: Node): Node | undefined {
		const documentAnalyzer = this.analyzer.getDocumentAnalyzer(uri);
		return documentAnalyzer.searcher.findDefinitionNodeByPosition(uri, getParserPositionFromVSCodePosition(position), analyzerTree);
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
}
