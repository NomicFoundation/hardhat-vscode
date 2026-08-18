import {
  ISolFileEntry,
  VSCodePosition,
  Node,
  Location,
  VSCodeLocation,
  Overwrite,
} from "@common/types";
import { getParserPositionFromVSCodePosition, getRange } from "@common/utils";
import { findReferencesFor } from "@utils/findReferencesFor";
import { onCommand } from "@utils/onCommand";
import { ReferenceParams } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { toUri } from "../../utils";

export const onReferences = (serverState: ServerState) => {
  return (params: ReferenceParams) => {
    try {
      return onCommand(
        serverState,
        "onReferences",
        params.textDocument.uri,
        (documentAnalyzer) =>
          findReferences(serverState, documentAnalyzer, params.position)
      );
    } catch (err) {
      serverState.logger.error(err);
    }
  };
};

function findReferences(
  serverState: ServerState,
  documentAnalyzer: ISolFileEntry,
  position: VSCodePosition
): VSCodeLocation[] {
  const definitionNode = documentAnalyzer.searcher.findDefinitionNodeByPosition(
    documentAnalyzer.uri,
    getParserPositionFromVSCodePosition(position),
    documentAnalyzer.analyzerTree.tree
  );

  const references: Node[] = findReferencesFor(definitionNode);

  return references
    .filter(
      (refNode): refNode is Overwrite<Node, { nameLoc: Location }> =>
        refNode.nameLoc !== undefined
    )
    .map((refNode) => ({
      uri: toUri(refNode.uri),
      range: getRange(refNode.nameLoc),
    }));
}
