import { Analyzer } from "@analyzer/index";
import { isFunctionDefinitionNode } from "@analyzer/utils/typeGuards";
import { VSCodePosition, WorkspaceEdit, TextEdit, Node } from "@common/types";

import { getParserPositionFromVSCodePosition, getRange } from "@common/utils";
import { convertHardhatUriToVscodeUri } from "../../utils/index";

export class SolidityRename {
  analyzer: Analyzer;

  constructor(analyzer: Analyzer) {
    this.analyzer = analyzer;
  }

  public doRename(
    uri: string,
    position: VSCodePosition,
    newName: string,
    analyzerTree: Node
  ): WorkspaceEdit {
    const originRenameNode = this.findNodeAtPosition(
      uri,
      position,
      analyzerTree
    );

    if (!originRenameNode) {
      return { changes: {} };
    }

    const canonicalRenameNode =
      this.resolveCanonicalNodeForRename(originRenameNode);

    if (canonicalRenameNode === undefined) {
      return { changes: {} };
    }

    const referenceNodes =
      this.findReferenceNodesWithSameName(canonicalRenameNode);

    const workspaceEdit = this.convertRefNodesToUpdates(
      referenceNodes,
      newName
    );

    return workspaceEdit;
  }

  private findNodeAtPosition(
    uri: string,
    position: VSCodePosition,
    analyzerTree: Node
  ) {
    const documentAnalyzer = this.analyzer.getDocumentAnalyzer(uri);

    const initialRenameNode =
      documentAnalyzer.searcher.findRenameNodeByPosition(
        uri,
        getParserPositionFromVSCodePosition(position),
        analyzerTree
      );

    return initialRenameNode;
  }

  private resolveCanonicalNodeForRename(originRenameNode: Node) {
    if (
      this.isConstructorContractModifier(originRenameNode) ||
      this.isFunctionOverrideContractSymbol(originRenameNode)
    ) {
      return originRenameNode.parent?.parent;
    } else {
      return originRenameNode.getDefinitionNode();
    }
  }

  private findReferenceNodesWithSameName(canonicalRenameNode: Node) {
    const nodeName = canonicalRenameNode?.getName();

    if (!canonicalRenameNode || !nodeName) {
      return [];
    }

    const potentialUpdates: Node[] = [];

    this.extractHighlightsFromNodeRecursive(
      nodeName,
      canonicalRenameNode,
      potentialUpdates
    );

    return potentialUpdates;
  }

  private convertRefNodesToUpdates(referenceNodes: Node[], newName: string) {
    const workspaceEdit: WorkspaceEdit = { changes: {} };

    referenceNodes.forEach((potentialUpdate) => {
      if (!potentialUpdate.nameLoc || !workspaceEdit.changes) {
        return;
      }

      if (
        isFunctionDefinitionNode(potentialUpdate) &&
        potentialUpdate.isConstructor
      ) {
        return;
      }

      const uri = convertHardhatUriToVscodeUri(potentialUpdate.uri);

      if (workspaceEdit.changes && !workspaceEdit.changes[uri]) {
        workspaceEdit.changes[uri] = [];
      }

      const range = getRange(potentialUpdate.nameLoc);
      workspaceEdit.changes[uri].push(TextEdit.replace(range, newName));

      potentialUpdate.isAlive = false;
    });

    return workspaceEdit;
  }

  private isConstructorContractModifier(initialRenameNode: Node) {
    return (
      initialRenameNode.type === "ModifierInvocation" &&
      initialRenameNode.parent &&
      isFunctionDefinitionNode(initialRenameNode.parent) &&
      initialRenameNode.parent.isConstructor
    );
  }

  private isFunctionOverrideContractSymbol(initialRenameNode: Node) {
    return (
      initialRenameNode.type === "UserDefinedTypeName" &&
      initialRenameNode.parent &&
      isFunctionDefinitionNode(initialRenameNode.parent) &&
      initialRenameNode.parent.isConstructor
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
}
