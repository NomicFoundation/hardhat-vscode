/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import {
  SemanticTokens,
  SemanticTokensParams,
} from "vscode-languageserver-protocol";
import { Language, ProductionKind } from "@nomicfoundation/slang";
import _ from "lodash";
import { analyze } from "@nomicfoundation/solidity-analyzer";
import semver from "semver";
import { ServerState } from "../../types";
import { onCommand } from "../../utils/onCommand";
import { CustomTypeHighlighter } from "./highlighters/CustomTypeHighlighter";
import { SemanticTokensBuilder } from "./SemanticTokensBuilder";
import { KeywordHighlighter } from "./highlighters/KeywordHighlighter";
import { ElementaryTypeHighlighter } from "./highlighters/ElementaryTypeHighlighter";
import { NumberHighlighter } from "./highlighters/NumberHighlighter";
import { StringHighlighter } from "./highlighters/StringHighlighter";
import { FunctionDefinitionHighlighter } from "./highlighters/FunctionDefinitionHighlighter";
import { FunctionCallHighlighter } from "./highlighters/FunctionCallHighlighter";
import { EventEmissionHighlighter } from "./highlighters/EventEmissionHighlighter";
import { EventDefinitionHighlighter } from "./highlighters/EventDefinitionHighlighter";
import { ContractDefinitionHighlighter } from "./highlighters/ContractDefinitionHighlighter";
import { InterfaceDefinitionHighlighter } from "./highlighters/InterfaceDefinitionHighlighter";
import { StructDefinitionHighlighter } from "./highlighters/StructDefinitionHighlighter";
import { walk } from "./slangHelpers";

let lastValidResponse: SemanticTokens = { data: [] };

export function onSemanticTokensFull(serverState: ServerState) {
  return (params: SemanticTokensParams): SemanticTokens => {
    return (
      onCommand(
        serverState,
        "onSemanticTokensFull",
        params.textDocument.uri,
        () => {
          const { uri } = params.textDocument;
          const { logger, solcVersions } = serverState;

          // Find the file in the documents collection
          const document = serverState.documents.get(uri);

          if (document === undefined) {
            throw new Error(`Document not found: ${uri}`);
          }

          const text = document.getText();

          // Get the document's solidity version
          const { versionPragmas } = analyze(text);
          const solcVersion =
            semver.maxSatisfying(solcVersions, versionPragmas.join(" ")) ||
            _.last(solcVersions);

          try {
            // Parse using slang
            const language = new Language(solcVersion!);

            const parseOutput = language.parse(
              ProductionKind.SourceUnit,
              document.getText()
            );

            const parseTree = parseOutput.parseTree;

            if (parseTree === null) {
              logger.trace("Slang parsing error");
              const strings = parseOutput.errors.map((e) =>
                e.toErrorReport(uri, text, false)
              );
              logger.trace(strings.join(""));

              return lastValidResponse;
            }

            // Register visitors
            const builder = new SemanticTokensBuilder(document);

            const visitors = [
              new CustomTypeHighlighter(document, builder),
              new KeywordHighlighter(document, builder),
              new ElementaryTypeHighlighter(document, builder),
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
            walk(parseTree, (node, ancestors) => {
              for (const visitor of visitors) {
                visitor.visit(node, ancestors);
              }
            });

            lastValidResponse = { data: builder.getTokenData() };
          } catch (error) {
            serverState.logger.error(error);
          }
          return lastValidResponse;
        }
      ) || lastValidResponse
    );
  };
}
