/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import {
  SemanticTokens,
  SemanticTokensParams,
} from "vscode-languageserver-protocol";
import _ from "lodash";
import { analyze } from "@nomicfoundation/solidity-analyzer";
import { Language } from "@nomicfoundation/slang/language";
import { RuleKind } from "@nomicfoundation/slang/kinds";
import { Query } from "@nomicfoundation/slang/query";
import { ServerState } from "../../types";
import { resolveVersion } from "../../parser/slangHelpers";
import { SemanticTokensBuilder } from "./SemanticTokensBuilder";
import { ContractDefinitionHighlighter } from "./highlighters/ContractDefinitionHighlighter";
import { CustomTypeHighlighter } from "./highlighters/CustomTypeHighlighter";
import { FunctionDefinitionHighlighter } from "./highlighters/FunctionDefinitionHighlighter";
import { FunctionCallHighlighter } from "./highlighters/FunctionCallHighlighter";
import { EventEmissionHighlighter } from "./highlighters/EventEmissionHighlighter";
import { EventDefinitionHighlighter } from "./highlighters/EventDefinitionHighlighter";
import { InterfaceDefinitionHighlighter } from "./highlighters/InterfaceDefinitionHighlighter";
import { StructDefinitionHighlighter } from "./highlighters/StructDefinitionHighlighter";
import { UserDefinedValueTypeDefinitionHighlighter } from "./highlighters/UserDefinedValueTypeDefinitionHighlighter";
import { EnumDefinitionHighlighter } from "./highlighters/EnumDefinitionHighlighter";
import { ErrorDefinitionHighlighter } from "./highlighters/ErrorDefinitionHighlighter";
import { LibraryDefinitionHighlighter } from "./highlighters/LibraryDefinitionHighlighter";

const emptyResponse: SemanticTokens = { data: [] };

export function onSemanticTokensFull(serverState: ServerState) {
  return (params: SemanticTokensParams): SemanticTokens => {
    const { telemetry, logger } = serverState;

    return (
      telemetry.trackTimingSync("onSemanticTokensFull", (transaction) => {
        const { uri } = params.textDocument;

        // Find the file in the documents collection
        const document = serverState.documents.get(uri);

        if (document === undefined) {
          logger.error("document not found in collection");
          return {
            status: "internal_error",
            result: emptyResponse,
          };
        }

        const text = document.getText();

        // Get the document's solidity version
        let span = transaction.startChild({ op: "solidity-analyzer" });
        const { versionPragmas } = analyze(text);
        span.finish();

        const resolvedVersion = resolveVersion(logger, versionPragmas);

        try {
          const language = new Language(resolvedVersion);
          // Parse using slang
          span = transaction.startChild({ op: "slang-parsing" });

          const parseOutput = language.parse(
            RuleKind.SourceUnit,
            document.getText()
          );

          span.finish();

          // Register highlighters
          const builder = new SemanticTokensBuilder(document);

          const highlighters = [
            new CustomTypeHighlighter(builder),
            new FunctionDefinitionHighlighter(builder),
            new FunctionCallHighlighter(builder),
            new EventEmissionHighlighter(builder),
            new EventDefinitionHighlighter(builder),
            new ContractDefinitionHighlighter(builder),
            new InterfaceDefinitionHighlighter(builder),
            new StructDefinitionHighlighter(builder),
            new UserDefinedValueTypeDefinitionHighlighter(builder),
            new EnumDefinitionHighlighter(builder),
            new ErrorDefinitionHighlighter(builder),
            new LibraryDefinitionHighlighter(builder),
          ];

          const cursor = parseOutput.createTreeCursor();

          // Execute queries
          const queries = highlighters.map((v) => Query.parse(v.query));
          const results = cursor.query(queries);

          // Iterate over query results
          let result;
          while ((result = results.next())) {
            for (const visitor of highlighters) {
              visitor.onResult(result);
            }
          }

          return { status: "ok", result: { data: builder.getTokenData() } };
        } catch (error) {
          logger.error(`Semantic Highlighting Error: ${error}`);
          return { status: "internal_error", result: emptyResponse };
        }
      }) || emptyResponse
    );
  };
}
