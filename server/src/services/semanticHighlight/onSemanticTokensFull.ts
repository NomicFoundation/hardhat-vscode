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
import { startSpan } from "@sentry/core";
import { ServerState } from "../../types";
import { resolveVersion } from "../../parser/slangHelpers";
import { INTERNAL_ERROR, OK } from "../../telemetry/TelemetryStatus";
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
import { Highlighter } from "./Highlighter";

const emptyResponse: SemanticTokens = { data: [] };

export function createHighlighters(): Highlighter[] {
  return [
    new CustomTypeHighlighter(),
    new FunctionDefinitionHighlighter(),
    new FunctionCallHighlighter(),
    new EventEmissionHighlighter(),
    new EventDefinitionHighlighter(),
    new ContractDefinitionHighlighter(),
    new InterfaceDefinitionHighlighter(),
    new StructDefinitionHighlighter(),
    new UserDefinedValueTypeDefinitionHighlighter(),
    new EnumDefinitionHighlighter(),
    new ErrorDefinitionHighlighter(),
    new LibraryDefinitionHighlighter(),
  ];
}

export function onSemanticTokensFull(serverState: ServerState) {
  // Create all highlighters (and parse their queries) only once for all upcoming requests:
  const highlighters = createHighlighters();

  return (params: SemanticTokensParams): SemanticTokens => {
    const { telemetry, logger } = serverState;

    return (
      telemetry.trackTimingSync("onSemanticTokensFull", () => {
        const { uri } = params.textDocument;

        // Find the file in the documents collection
        const document = serverState.documents.get(uri);

        if (document === undefined) {
          logger.error("document not found in collection");
          return {
            status: INTERNAL_ERROR,
            result: emptyResponse,
          };
        }

        const text = document.getText();

        // Get the document's solidity version
        const { versionPragmas } = startSpan(
          { name: "solidity-analyzer" },
          () => analyze(text)
        );

        const resolvedVersion = resolveVersion(logger, versionPragmas);

        try {
          const language = new Language(resolvedVersion);
          // Parse using slang
          const parseOutput = startSpan({ name: "slang-parsing" }, () =>
            language.parse(Language.rootKind(), document.getText())
          );

          // Register highlighters
          const builder = new SemanticTokensBuilder(document);

          const cursor = parseOutput.createTreeCursor();

          // Execute queries
          const matches = cursor.query(highlighters.map((h) => h.query));

          // Iterate over query results
          let match;

          while ((match = matches.next())) {
            const highlighter = highlighters[match.queryNumber];
            highlighter.onResult(builder, match);
          }

          return { status: OK, result: { data: builder.getTokenData() } };
        } catch (error) {
          logger.error(`Semantic Highlighting Error: ${error}`);
          return { status: INTERNAL_ERROR, result: emptyResponse };
        }
      }) || emptyResponse
    );
  };
}
