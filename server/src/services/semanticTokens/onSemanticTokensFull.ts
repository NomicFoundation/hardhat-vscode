import {
  SemanticTokens,
  SemanticTokensParams,
  SemanticTokensRangeParams,
} from "vscode-languageserver-protocol/node";
import { onCommand } from "@utils/onCommand";
import { ServerState } from "../../types";

export const onSemanticTokensFull = (serverState: ServerState) => {
  serverState.logger.log("!!!!! Setting up semantic tokens");
  return async (
    params: SemanticTokensParams | SemanticTokensRangeParams
  ): Promise<SemanticTokens> => {
    try {
      serverState.logger.log("!!!!! Request for semantic token full");

      const response = onCommand(
        serverState,
        "onSemanticTokensFull",
        params.textDocument.uri,
        (_documentAnalyzer) => {
          const docText = serverState.solFileIndex[params.textDocument.uri];

          if (docText === undefined || docText.text === undefined) {
            return { data: [] as number[] };
          }

          serverState.logger.log(docText.text);

          const semanticTokens: SemanticTokens = { data: [] as number[] };

          return semanticTokens;
        }
      );

      return response ?? { data: [] as number[] };
    } catch (err) {
      serverState.logger.error(err);
      return { data: [] as number[] };
    }
  };
};
