/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import {
  SemanticTokens,
  SemanticTokensParams,
} from "vscode-languageserver-protocol";
import _ from "lodash";
import { analyze } from "@nomicfoundation/solidity-analyzer";
import semver from "semver";
import { Language } from "@nomicfoundation/slang/language";
import { ProductionKind } from "@nomicfoundation/slang/kinds";
import { ServerState } from "../../types";
import { onCommand } from "../../utils/onCommand";
import { walk } from "../../parser/slangHelpers";
import { CustomTypeHighlighter } from "./highlighters/CustomTypeHighlighter";
import { SemanticTokensBuilder } from "./SemanticTokensBuilder";
import { KeywordHighlighter } from "./highlighters/KeywordHighlighter";
import { NumberHighlighter } from "./highlighters/NumberHighlighter";
import { StringHighlighter } from "./highlighters/StringHighlighter";
import { FunctionDefinitionHighlighter } from "./highlighters/FunctionDefinitionHighlighter";
import { FunctionCallHighlighter } from "./highlighters/FunctionCallHighlighter";
import { EventEmissionHighlighter } from "./highlighters/EventEmissionHighlighter";
import { EventDefinitionHighlighter } from "./highlighters/EventDefinitionHighlighter";
import { ContractDefinitionHighlighter } from "./highlighters/ContractDefinitionHighlighter";
import { InterfaceDefinitionHighlighter } from "./highlighters/InterfaceDefinitionHighlighter";
import { StructDefinitionHighlighter } from "./highlighters/StructDefinitionHighlighter";

const emptyResponse: SemanticTokens = { data: [] };

export function onSemanticTokensFull(serverState: ServerState) {
  return (params: SemanticTokensParams): SemanticTokens => {
    return (
      onCommand(
        serverState,
        "onSemanticTokensFull",
        params.textDocument.uri,
        (_analyzer, _document, transaction) => {
          const { uri } = params.textDocument;
          const { logger, solcVersions } = serverState;

          // Find the file in the documents collection
          const document = serverState.documents.get(uri);

          if (document === undefined) {
            throw new Error(`Document not found: ${uri}`);
          }

          const text = document.getText();

          // Get the document's solidity version
          let span = transaction.startChild({ op: "solidity-analyzer" });
          const { versionPragmas } = analyze(text);
          span.finish();
          const solcVersion =
            semver.maxSatisfying(solcVersions, versionPragmas.join(" ")) ||
            _.last(solcVersions);

          try {
            // Parse using slang
            span = transaction.startChild({ op: "slang-parsing" });
            const language = new Language(solcVersion!);

            const parseOutput = language.parse(
              ProductionKind.SourceUnit,
              document.getText()
            );

            const parseTree = parseOutput.parseTree;
            span.finish();

            if (parseTree === null) {
              logger.trace("Slang parsing error");
              const strings = parseOutput.errors.map((e: any) =>
                e.toErrorReport(uri, text, false)
              );
              logger.trace(strings.join(""));

              return emptyResponse;
            }

            // Register visitors
            const builder = new SemanticTokensBuilder(document);

            const visitors = [
              new CustomTypeHighlighter(document, builder),
              new KeywordHighlighter(document, builder),
              new NumberHighlighter(document, builder),
              new StringHighlighter(document, builder),
              new FunctionDefinitionHighlighter(document, builder),
              new FunctionCallHighlighter(document, builder),
              new EventEmissionHighlighter(document, builder),
              new EventDefinitionHighlighter(document, builder),
              new ContractDefinitionHighlighter(document, builder),
              new InterfaceDefinitionHighlighter(document, builder),
              new StructDefinitionHighlighter(document, builder),
            ];

            // Visit the CST
            span = transaction.startChild({ op: "walk-generate-symbols" });
            walk(
              parseTree.cursor,
              (cursor) => {
                for (const visitor of visitors) {
                  visitor.enter(cursor);
                }
              },
              (cursor) => {
                for (const visitor of visitors) {
                  visitor.exit(cursor);
                }
              }
            );
            span.finish();

            return { data: builder.getTokenData() };
          } catch (error) {
            serverState.logger.error(error);
            return emptyResponse;
          }
        }
      ) || emptyResponse
    );
  };
}
