import { onCommand } from "@utils/onCommand";
import { RenameParams } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { isFunctionDefinitionNode } from "@analyzer/utils/typeGuards";
import {
  VSCodePosition,
  WorkspaceEdit,
  TextEdit,
  Node,
  ISolFileEntry,
} from "@common/types";

import { getParserPositionFromVSCodePosition, getRange } from "@common/utils";
import { findReferencesFor } from "@utils/findReferencesFor";
import { convertHardhatUriToVscodeUri } from "../../utils/index";

export const onRename = (serverState: ServerState) => {
  return (params: RenameParams) => {
    try {
      return onCommand(
        serverState,
        "onRenameRequest",
        params.textDocument.uri,
        (documentAnalyzer) =>
          rename(documentAnalyzer, params.position, params.newName)
      );
    } catch (err) {
      serverState.logger.error(err);
    }
  };
};

function rename(
  documentAnalyzer: ISolFileEntry,
  position: VSCodePosition,
  newName: string
): WorkspaceEdit {
  const originRenameNode = documentAnalyzer.searcher.findRenameNodeByPosition(
    documentAnalyzer.uri,
    getParserPositionFromVSCodePosition(position),
    documentAnalyzer.analyzerTree.tree
  );

  if (!originRenameNode) {
    return { changes: {} };
  }

  const canonicalRenameNode = resolveCanonicalNodeForRename(originRenameNode);

  if (canonicalRenameNode === undefined) {
    return { changes: {} };
  }

  const referenceNodes = findReferencesFor(canonicalRenameNode);

  const workspaceEdit = convertRefNodesToUpdates(referenceNodes, newName);

  return workspaceEdit;
}

function resolveCanonicalNodeForRename(originRenameNode: Node) {
  if (
    isConstructorContractModifier(originRenameNode) ||
    isFunctionOverrideContractSymbol(originRenameNode)
  ) {
    return originRenameNode.parent?.parent;
  } else {
    return originRenameNode.getDefinitionNode();
  }
}

function convertRefNodesToUpdates(referenceNodes: Node[], newName: string) {
  const workspaceEdit: WorkspaceEdit = { changes: {} };

  referenceNodes.forEach((potentialUpdate) => {
    if (!potentialUpdate.isAlive) {
      return;
    }

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

function isConstructorContractModifier(initialRenameNode: Node) {
  return (
    initialRenameNode.type === "ModifierInvocation" &&
    initialRenameNode.parent &&
    isFunctionDefinitionNode(initialRenameNode.parent) &&
    initialRenameNode.parent.isConstructor
  );
}

function isFunctionOverrideContractSymbol(initialRenameNode: Node) {
  return (
    initialRenameNode.type === "UserDefinedTypeName" &&
    initialRenameNode.parent &&
    isFunctionDefinitionNode(initialRenameNode.parent) &&
    initialRenameNode.parent.isConstructor
  );
}
