/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { DocumentSymbolParams } from "vscode-languageserver/node";
import { DocumentSymbol, SymbolInformation } from "vscode-languageserver-types";
import { analyze } from "@nomicfoundation/solidity-analyzer";
import _ from "lodash";
import * as Sentry from "@sentry/node";
import { ServerState } from "../../types";
import { resolveVersion, slangToVSCodeRange } from "../../parser/slangHelpers";
import { INTERNAL_ERROR, OK } from "../../telemetry/TelemetryStatus";
import { SymbolTreeBuilder } from "./SymbolTreeBuilder";
import { SymbolFinder } from "./SymbolFinder";
import { StructDefinition } from "./finders/StructDefinition";
import { StructMember } from "./finders/StructMember";
import { InterfaceDefinition } from "./finders/InterfaceDefinition";
import { FunctionDefinition } from "./finders/FunctionDefinition";
import { ContractDefinition } from "./finders/ContractDefinition";
import { EventDefinition } from "./finders/EventDefinition";
import { StateVariableDefinition } from "./finders/StateVariableDefinition";
import { ConstantDefinition } from "./finders/ConstantDefinition";
import { ConstructorDefinition } from "./finders/ConstructorDefinition";
import { EnumDefinition } from "./finders/EnumDefinition";
import { ErrorDefinition } from "./finders/ErrorDefinition";
import { FallbackFunctionDefinition } from "./finders/FallbackFunctionDefinition";
import { LibraryDefinition } from "./finders/LibraryDefinition";
import { ModifierDefinition } from "./finders/ModifierDefinition";
import { ReceiveFunctionDefinition } from "./finders/ReceiveFunctionDefinition";
import { UserDefinedValueTypeDefinition } from "./finders/UserDefinedValueTypeDefinition";
import { YulFunctionDefinition } from "./finders/YulFunctionDefinition";
import { UnnamedFunctionDefinition } from "./finders/UnnamedFunctionDefinition";
import { VariableDeclarationStatement } from "./finders/VariableDeclarationStatement";

export function createFinders(): SymbolFinder[] {
  return [
    new StructDefinition(),
    new StructMember(),
    new InterfaceDefinition(),
    new FunctionDefinition(),
    new ContractDefinition(),
    new EventDefinition(),
    new StateVariableDefinition(),
    new VariableDeclarationStatement(),
    new ConstantDefinition(),
    new ConstructorDefinition(),
    new EnumDefinition(),
    new ErrorDefinition(),
    new FallbackFunctionDefinition(),
    new LibraryDefinition(),
    new ModifierDefinition(),
    new ReceiveFunctionDefinition(),
    new UserDefinedValueTypeDefinition(),
    new YulFunctionDefinition(),
    new UnnamedFunctionDefinition(),
  ];
}

export function onDocumentSymbol(serverState: ServerState) {
  // Create all finders (and parse their queries) only once for all upcoming requests:
  const finders = createFinders();

  return async (
    params: DocumentSymbolParams
  ): Promise<DocumentSymbol[] | SymbolInformation[] | null> => {
    const { Parser } = await import("@nomicfoundation/slang/parser");
    const { NonterminalKind } = await import("@nomicfoundation/slang/cst");

    const { telemetry, logger } = serverState;
    return telemetry.trackTiming("onDocumentSymbol", async () => {
      const { uri } = params.textDocument;

      // Find the file in the documents collection
      const document = serverState.documents.get(uri);

      if (document === undefined) {
        throw new Error(`${uri} not found in documents`);
      }

      const text = document.getText();

      // Get the document's solidity version
      const { versionPragmas } = Sentry.startSpan(
        { name: "solidity-analyzer" },
        () => analyze(text)
      );

      const resolvedVersion = await resolveVersion(logger, versionPragmas);

      try {
        const language = Parser.create(resolvedVersion);

        // Parse using slang

        const parseOutput = Sentry.startSpan({ name: "slang-parsing" }, () =>
          language.parseNonterminal(
            NonterminalKind.SourceUnit,
            document.getText()
          )
        );

        const builder = new SymbolTreeBuilder();

        const cursor = parseOutput.createTreeCursor();

        // Useful to keep this here for development
        // const kursor = cursor.clone();
        // do {
        //   const range = slangToVSCodeRange(document, kursor.textRange);
        //   const start = document.offsetAt(range.start);
        //   const end = document.offsetAt(range.end);
        //   console.log(
        //     `${"  ".repeat(kursor.ancestors().length)}${kursor.node().kind}(${
        //       kursor.node().type
        //     })(${kursor.label})[${start}:${end}]: ${
        //       (kursor.node() as any)?.text || ""
        //     }`
        //   );
        // } while (kursor.goToNext());

        // Execute a single call with all the queries
        const matches = await Sentry.startSpan(
          { name: "run-query" },
          async () =>
            cursor.query(await Promise.all(finders.map((f) => f.getQuery())))
        );

        // Transform the query results into symbols
        Sentry.startSpan({ name: "build-symbols" }, () => {
          let match;
          const symbols = [];

          while ((match = matches.next())) {
            const finder = finders[match.queryIndex];
            const symbol = finder.findSymbol(match);

            symbols.push(symbol);
          }

          // Build the symbol tree
          for (const symbol of symbols) {
            const symbolRange = slangToVSCodeRange(symbol.range);

            let lastOpenSymbol;

            // Insert the symbol in the tree with the correct hierarchy
            while ((lastOpenSymbol = builder.lastOpenSymbol())) {
              const lastEndOffset = document.offsetAt(
                lastOpenSymbol.range!.end
              );
              const currentEndOffset = document.offsetAt(symbolRange.end);

              if (lastEndOffset < currentEndOffset) {
                builder.closeSymbol();
              } else {
                break;
              }
            }

            builder.openSymbol({
              kind: symbol.symbolKind,
              name: symbol.name,
              range: symbolRange,
              selectionRange: symbolRange,
            });
          }
        });

        return { status: OK, result: builder.getSymbols() };
      } catch (error) {
        logger.error(`Document Symbol Error: ${error}`);
        return { status: INTERNAL_ERROR, result: null };
      }
    });
  };
}
