import { onCommand } from "@utils/onCommand";
import { RenameParams } from "vscode-languageserver/node";
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
import { invalidateWorkerPreprocessCache } from "@services/validation/invalidateWorkerPreprocessCache";
import { ServerState } from "../../types";
import {
  convertHardhatUriToVscodeUri,
  decodeUriAndRemoveFilePrefix,
} from "../../utils/index";

export const onRename = (serverState: ServerState) => {
  return async (params: RenameParams) => {
    try {
      const workspaceEdit = onCommand(
        serverState,
        "onRenameRequest",
        params.textDocument.uri,
        (documentAnalyzer) =>
          rename(documentAnalyzer, params.position, params.newName)
      );

      // Renames are multifile, if the change to the current
      // editor goes to validation before any file changes
      // are recorded, preprocessing won't recognise that
      // the cache is no longer valid, hence we clear it
      // before returning
      await invalidateWorkerPreprocessCache(
        serverState,
        decodeUriAndRemoveFilePrefix(params.textDocument.uri),
        true
      );

      return workspaceEdit;
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

    if (
      workspaceEdit.changes !== undefined &&
      !(uri in workspaceEdit.changes)
    ) {
      workspaceEdit.changes[uri] = [];
    }

    const range = getRange(potentialUpdate.nameLoc);
    workspaceEdit.changes[uri].push(TextEdit.replace(range, newName));

    potentialUpdate.isAlive = false;
  });

  return workspaceEdit;
}

function isConstructorContractModifier(initialRenameNode: Node): boolean {
  return (
    initialRenameNode.type === "ModifierInvocation" &&
    initialRenameNode.parent !== undefined &&
    isFunctionDefinitionNode(initialRenameNode.parent) &&
    initialRenameNode.parent.isConstructor
  );
}

function isFunctionOverrideContractSymbol(initialRenameNode: Node): boolean {
  return (
    initialRenameNode.type === "UserDefinedTypeName" &&
    initialRenameNode.parent !== undefined &&
    isFunctionDefinitionNode(initialRenameNode.parent) &&
    initialRenameNode.parent.isConstructor
  );
}
