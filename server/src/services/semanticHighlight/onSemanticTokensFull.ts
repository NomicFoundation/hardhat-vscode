/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import {
  SemanticTokens,
  SemanticTokensParams,
} from "vscode-languageserver-protocol";
import _, { Dictionary } from "lodash";
import { analyze } from "@nomicfoundation/solidity-analyzer";
import { Language } from "@nomicfoundation/slang/language";
import { RuleKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { TokenNode } from "@nomicfoundation/slang/cst";
import { ServerState } from "../../types";
import { resolveVersion } from "../../parser/slangHelpers";
import { CustomTypeHighlighter } from "./highlighters/CustomTypeHighlighter";
import { SemanticTokensBuilder } from "./SemanticTokensBuilder";
import { FunctionDefinitionHighlighter } from "./highlighters/FunctionDefinitionHighlighter";
import { FunctionCallHighlighter } from "./highlighters/FunctionCallHighlighter";
import { EventEmissionHighlighter } from "./highlighters/EventEmissionHighlighter";
import { EventDefinitionHighlighter } from "./highlighters/EventDefinitionHighlighter";
import { ContractDefinitionHighlighter } from "./highlighters/ContractDefinitionHighlighter";
import { InterfaceDefinitionHighlighter } from "./highlighters/InterfaceDefinitionHighlighter";
import { StructDefinitionHighlighter } from "./highlighters/StructDefinitionHighlighter";
import { HighlightVisitor } from "./HighlightVisitor";
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

          // Register visitors
          const builder = new SemanticTokensBuilder(document);

          const visitors = [
            new CustomTypeHighlighter(document, builder),
            new FunctionDefinitionHighlighter(document, builder),
            new FunctionCallHighlighter(document, builder),
            new EventEmissionHighlighter(document, builder),
            new EventDefinitionHighlighter(document, builder),
            new ContractDefinitionHighlighter(document, builder),
            new InterfaceDefinitionHighlighter(document, builder),
            new StructDefinitionHighlighter(document, builder),
            new UserDefinedValueTypeDefinitionHighlighter(document, builder),
            new EnumDefinitionHighlighter(document, builder),
            new ErrorDefinitionHighlighter(document, builder),
            new LibraryDefinitionHighlighter(document, builder),
          ];

          // Visit the CST
          const indexedVisitors: Dictionary<HighlightVisitor[]> = {};
          const registeredTokenKinds: TokenKind[] = [];

          for (const visitor of visitors) {
            for (const tokenKind of visitor.tokenKinds) {
              indexedVisitors[tokenKind] ||= [];
              indexedVisitors[tokenKind].push(visitor);

              if (!registeredTokenKinds.includes(tokenKind)) {
                registeredTokenKinds.push(tokenKind);
              }
            }
          }

          const cursor = parseOutput.createTreeCursor();

          span = transaction.startChild({ op: "walk-highlight-tokens" });
          while (cursor.goToNextTokenWithKinds(registeredTokenKinds)) {
            const node = cursor.node() as TokenNode;

            const nodeWrapper = {
              kind: node.kind,
              ancestors: () => cursor.ancestors(),
              text: node.text,
              textRange: cursor.textRange,
              label: cursor.label,
              type: node.type,
            };

            const registeredVisitors = indexedVisitors[nodeWrapper.kind];
            for (const visitor of registeredVisitors) {
              visitor.enter(nodeWrapper);
            }
          }
          span.finish();

          return { status: "ok", result: { data: builder.getTokenData() } };
        } catch (error) {
          logger.error(`Semantic Highlighting Error: ${error}`);
          return { status: "internal_error", result: emptyResponse };
        }
      }) || emptyResponse
    );
  };
}
