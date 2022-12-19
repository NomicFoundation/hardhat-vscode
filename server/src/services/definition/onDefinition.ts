import { ISolFileEntry, VSCodePosition, Node, Location } from "@common/types";
import { getParserPositionFromVSCodePosition, getRange } from "@common/utils";
import { onCommand } from "@utils/onCommand";
import { DefinitionParams } from "vscode-languageserver/node";
import { ServerState } from "../../types";
import { toUri } from "../../utils";

export const onDefinition = (serverState: ServerState) => {
  return (params: DefinitionParams) => {
    try {
      return onCommand(
        serverState,
        "onDefinition",
        params.textDocument.uri,
        (documentAnalyzer) =>
          findDefinition(serverState, documentAnalyzer, params.position)
      );
    } catch (err) {
      serverState.logger.error(err);
    }
  };
};

function findDefinition(
  serverState: ServerState,
  documentAnalyzer: ISolFileEntry,
  position: VSCodePosition
) {
  const definitionNode = documentAnalyzer.searcher.findDefinitionNodeByPosition(
    documentAnalyzer.uri,
    getParserPositionFromVSCodePosition(position),
    documentAnalyzer.analyzerTree.tree
  );

  if (!definitionNode) {
    return undefined;
  }

  const location = resolveLocationFrom(definitionNode);

  if (!location) {
    return undefined;
  }

  return {
    uri: toUri(definitionNode.uri),
    range: getRange(location),
  };
}

function resolveLocationFrom(definitionNode: Node): Location | undefined {
  if (definitionNode.type === "ImportDirective") {
    return definitionNode.astNode.loc;
  }

  return definitionNode.nameLoc ?? definitionNode.astNode.loc;
}
