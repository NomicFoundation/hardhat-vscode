import type { CompilationUnit } from "@nomicfoundation/slang/compilation" with { "resolution-mode": "import" };
import { ServerState } from "../types";
import { decodeUriAndRemoveFilePrefix, isTestMode } from "../utils";
import { getCompilationForFile } from "../parser/compilation";

export function onCommand<
  P extends { textDocument: { uri: string } },
  R,
>(
  serverState: ServerState,
  handler: (
    unit: CompilationUnit,
    uri: string,
    params: P
  ) => Promise<R>,
  fallback: R
): (params: P) => Promise<R> {
  return async (params: P): Promise<R> => {
    try {
      const uri = decodeUriAndRemoveFilePrefix(params.textDocument.uri);

      const unit = await getCompilationForFile(
        serverState,
        params.textDocument.uri
      );

      if (unit === undefined) {
        return fallback;
      }

      return await handler(unit, uri, params);
    } catch (err) {
      serverState.logger.error(err);

      // Re-throw in tests so silent fallbacks don't mask real bugs.
      if (isTestMode()) {
        throw err;
      }

      return fallback;
    }
  };
}
