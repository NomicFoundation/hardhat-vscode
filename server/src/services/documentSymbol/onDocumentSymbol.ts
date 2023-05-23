/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { DocumentSymbolParams } from "vscode-languageserver/node";
import { DocumentSymbol, SymbolInformation } from "vscode-languageserver-types";
import { analyze } from "@nomicfoundation/solidity-analyzer";
import semver from "semver";
import { Language, ProductionKind } from "@nomicfoundation/slang";
import _ from "lodash";
import { ServerState } from "../../types";
import { walk } from "../../parser/slangHelpers";
import { onCommand } from "../../utils/onCommand";
import { SymbolTreeBuilder } from "./SymbolTreeBuilder";
import { StructDefinition } from "./visitors/StructDefinition";
import { SymbolVisitor } from "./SymbolVisitor";
import { StructMember } from "./visitors/StructMember";
import { InterfaceDefinition } from "./visitors/InterfaceDefinition";
import { FunctionDefinition } from "./visitors/FunctionDefinition";
import { ContractDefinition } from "./visitors/ContractDefinition";
import { EventDefinition } from "./visitors/EventDefinition";
import { StateVariableDeclaration } from "./visitors/StateVariableDeclaration";
import { VariableDeclarationStatement } from "./visitors/VariableDeclarationStatement";
import { ConstantDefinition } from "./visitors/ConstantDefinition";
import { ConstructorDefinition } from "./visitors/ConstructorDefinition";
import { EnumDefinition } from "./visitors/EnumDefinition";
import { ErrorDefinition } from "./visitors/ErrorDefinition";
import { FallbackFunctionDefinition } from "./visitors/FallbackFunctionDefinition";
import { LibraryDefinition } from "./visitors/LibraryDefinition";
import { ModifierDefinition } from "./visitors/ModifierDefinition";
import { ReceiveFunctionDefinition } from "./visitors/ReceiveFunctionDefinition";
import { UserDefinedValueTypeDefinition } from "./visitors/UserDefinedValueTypeDefinition";

export function onDocumentSymbol(serverState: ServerState) {
  return async (
    params: DocumentSymbolParams
  ): Promise<DocumentSymbol[] | SymbolInformation[] | null> => {
    return onCommand(
      serverState,
      "onDocumentSymbol",
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

            return null;
          }

          const builder = new SymbolTreeBuilder();

          const visitors: SymbolVisitor[] = [
            new StructDefinition(document, builder),
            new StructMember(document, builder),
            new InterfaceDefinition(document, builder),
            new FunctionDefinition(document, builder),
            new ContractDefinition(document, builder),
            new EventDefinition(document, builder),
            new StateVariableDeclaration(document, builder),
            new VariableDeclarationStatement(document, builder),
            new ConstantDefinition(document, builder),
            new ConstructorDefinition(document, builder),
            new EnumDefinition(document, builder),
            new ErrorDefinition(document, builder),
            new FallbackFunctionDefinition(document, builder),
            new LibraryDefinition(document, builder),
            new ModifierDefinition(document, builder),
            new ReceiveFunctionDefinition(document, builder),
            new UserDefinedValueTypeDefinition(document, builder),
          ];

          walk(
            parseTree,
            (node, ancestors) => {
              for (const visitor of visitors) {
                visitor.enter(node, ancestors);
              }
            },
            (node, ancestors) => {
              for (const visitor of visitors) {
                visitor.exit(node, ancestors);
              }
            }
          );

          return builder.symbols;
        } catch (error) {
          logger.error(error);
          return null;
        }
      }
    );
  };
}
