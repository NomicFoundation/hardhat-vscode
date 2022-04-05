import { Analyzer } from "@analyzer/index";
import { isFunctionDefinitionNode } from "@analyzer/utils/typeGuards";
import {
  VSCodePosition,
  VSCodeLocation,
  Node,
  definitionNodeTypes,
  Location,
} from "@common/types";

import { getParserPositionFromVSCodePosition, getRange } from "@common/utils";
import { convertHardhatUriToVscodeUri } from "../../utils/index";

export class SolidityNavigation {
  analyzer: Analyzer;

  constructor(analyzer: Analyzer) {
    this.analyzer = analyzer;
  }

  public findDefinition(
    uri: string,
    position: VSCodePosition,
    analyzerTree: Node
  ): VSCodeLocation | undefined {
    const definitionNode = this.findNodeByPosition(uri, position, analyzerTree);

    if (!definitionNode) {
      return undefined;
    }

    const location = this.resolveLocationFrom(definitionNode);

    if (!location) {
      return undefined;
    }

    return {
      uri: convertHardhatUriToVscodeUri(definitionNode.uri),
      range: getRange(location),
    };
  }

  public findTypeDefinition(
    uri: string,
    position: VSCodePosition,
    analyzerTree: Node
  ): VSCodeLocation[] {
    const definitionNode = this.findNodeByPosition(uri, position, analyzerTree);

    if (!definitionNode) {
      return [];
    }

    return this.getHighlightLocations(definitionNode.getTypeNodes());
  }

  public findReferences(
    uri: string,
    position: VSCodePosition,
    analyzerTree: Node
  ): VSCodeLocation[] {
    const highlightNodes = this.findHighlightNodes(uri, position, analyzerTree);

    return this.getHighlightLocations(highlightNodes);
  }

  public findImplementation(
    uri: string,
    position: VSCodePosition,
    analyzerTree: Node
  ): VSCodeLocation[] {
    const potentialImplNodes = this.findHighlightNodes(
      uri,
      position,
      analyzerTree
    );

    const implementationNodes: Node[] = potentialImplNodes
      .filter(this.isDefinitionNode)
      .filter(this.isNotAbstractFunction);

    return this.getHighlightLocations(implementationNodes);
  }

  private getHighlightLocations(highlightNodes: Node[]): VSCodeLocation[] {
    const locations: VSCodeLocation[] = [];

    highlightNodes.forEach((highlightNode) => {
      if (highlightNode.nameLoc) {
        locations.push({
          uri: convertHardhatUriToVscodeUri(highlightNode.uri),
          range: getRange(highlightNode.nameLoc),
        });
      }
    });

    return locations;
  }

  private findHighlightNodes(
    uri: string,
    position: VSCodePosition,
    analyzerTree: Node
  ): Node[] {
    const highlights: Node[] = [];

    const node = this.findNodeByPosition(uri, position, analyzerTree);

    const nodeName = node?.getName();
    if (node && nodeName) {
      this.extractHighlightsFromNodeRecursive(nodeName, node, highlights);
    }

    return highlights;
  }

  private findNodeByPosition(
    uri: string,
    position: VSCodePosition,
    analyzerTree: Node
  ): Node | undefined {
    const documentAnalyzer = this.analyzer.getDocumentAnalyzer(uri);
    return documentAnalyzer.searcher.findDefinitionNodeByPosition(
      uri,
      getParserPositionFromVSCodePosition(position),
      analyzerTree
    );
  }

  private extractHighlightsFromNodeRecursive(
    name: string,
    node: Node,
    results: Node[],
    visitedNodes?: Node[]
  ): void {
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
      this.extractHighlightsFromNodeRecursive(
        name,
        child,
        results,
        visitedNodes
      );
    }
  }

  private resolveLocationFrom(definitionNode: Node): Location | undefined {
    if (definitionNode.type === "ImportDirective") {
      return definitionNode.astNode.loc;
    }

    return definitionNode.nameLoc ?? definitionNode.astNode.loc;
  }

  private isDefinitionNode(node: Node): boolean {
    return definitionNodeTypes.includes(node.type);
  }

  private isNotAbstractFunction(node: Node): boolean {
    return !(isFunctionDefinitionNode(node) && node.astNode.body === null);
  }
}
