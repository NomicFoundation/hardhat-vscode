/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import {
  SemanticTokens,
  SemanticTokensParams,
} from "vscode-languageserver-protocol";
import _, { Dictionary } from "lodash";
import { analyze } from "@nomicfoundation/solidity-analyzer";
import semver from "semver";
import { Language } from "@nomicfoundation/slang/language";
import { ProductionKind, TokenKind } from "@nomicfoundation/slang/kinds";
import { Cursor } from "@nomicfoundation/slang/cursor";
import { TokenNode } from "@nomicfoundation/slang/cst";
import { ServerState } from "../../types";
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
import { HighlightVisitor } from "./HighlightVisitor";

const emptyResponse: SemanticTokens = { data: [] };

export function onSemanticTokensFull(serverState: ServerState) {
  return (params: SemanticTokensParams): SemanticTokens => {
    const { telemetry, logger, solcVersions } = serverState;

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

        versionPragmas.push("<= 0.8.19"); // latest supported by slang

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
            logger.error("Slang parsing error");
            const strings = parseOutput.errors.map((e: any) =>
              e.toErrorReport(uri, text, false)
            );
            logger.error(strings.join(""));

            return {
              status: "internal_error",
              result: emptyResponse,
            };
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

          const cursor: Cursor = parseTree.cursor;
          let node: TokenNode;

          span = transaction.startChild({ op: "walk-highlight-tokens" });
          while (
            (node = cursor.findTokenWithKind(registeredTokenKinds)) !== null
          ) {
            const nodeWrapper = {
              kind: node.kind,
              pathRuleNodes: cursor.pathRuleNodes,
              text: node.text,
              textRange: cursor.textRange,
              type: node.type,
            };

            const registeredVisitors = indexedVisitors[nodeWrapper.kind];
            for (const visitor of registeredVisitors) {
              visitor.enter(nodeWrapper);
            }

            cursor.goToNext();
          }
          span.finish();

          return { status: "ok", result: { data: builder.getTokenData() } };
        } catch (error) {
          logger.error(`Slang parsing error: ${error}`);
          return { status: "internal_error", result: emptyResponse };
        }
      }) || emptyResponse
    );
  };
}
