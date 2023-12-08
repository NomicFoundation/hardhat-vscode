/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { DocumentSymbolParams } from "vscode-languageserver/node";
import { DocumentSymbol, SymbolInformation } from "vscode-languageserver-types";
import { analyze } from "@nomicfoundation/solidity-analyzer";
import semver from "semver";
import _ from "lodash";
import { Language } from "@nomicfoundation/slang/language";
import { ProductionKind } from "@nomicfoundation/slang/kinds";
import { Cursor } from "@nomicfoundation/slang/cursor";
import { RuleNode } from "@nomicfoundation/slang/cst";
import { ServerState } from "../../types";
import { SymbolTreeBuilder } from "./SymbolTreeBuilder";
import { StructDefinition } from "./visitors/StructDefinition";
import { StructMember } from "./visitors/StructMember";
import { InterfaceDefinition } from "./visitors/InterfaceDefinition";
import { FunctionDefinition } from "./visitors/FunctionDefinition";
import { ContractDefinition } from "./visitors/ContractDefinition";
import { EventDefinition } from "./visitors/EventDefinition";
import { StateVariableDeclaration } from "./visitors/StateVariableDeclaration";
import { VariableDeclaration } from "./visitors/VariableDeclaration";
import { ConstantDefinition } from "./visitors/ConstantDefinition";
import { ConstructorDefinition } from "./visitors/ConstructorDefinition";
import { EnumDefinition } from "./visitors/EnumDefinition";
import { ErrorDefinition } from "./visitors/ErrorDefinition";
import { FallbackFunctionDefinition } from "./visitors/FallbackFunctionDefinition";
import { LibraryDefinition } from "./visitors/LibraryDefinition";
import { ModifierDefinition } from "./visitors/ModifierDefinition";
import { ReceiveFunctionDefinition } from "./visitors/ReceiveFunctionDefinition";
import { UserDefinedValueTypeDefinition } from "./visitors/UserDefinedValueTypeDefinition";
import { SymbolVisitor } from "./SymbolVisitor";
import { YulFunctionDefinition } from "./visitors/YulFunctionDefinition";

export function onDocumentSymbol(serverState: ServerState) {
  return async (
    params: DocumentSymbolParams
  ): Promise<DocumentSymbol[] | SymbolInformation[] | null> => {
    const { telemetry } = serverState;
    return telemetry.trackTimingSync("onDocumentSymbol", (transaction) => {
      const { uri } = params.textDocument;

      // Find the file in the documents collection
      const document = serverState.documents.get(uri);

      if (document === undefined) {
        throw new Error(`${uri} not found in documents`);
      }

      const text = document.getText();

      // Get the document's solidity version
      let span = transaction.startChild({ op: "solidity-analyzer" });
      const { versionPragmas } = analyze(text);
      span.finish();

      const versions = Language.supportedVersions();
      versionPragmas.push(
        `>= ${versions[0]}`,
        `<= ${versions[versions.length - 1]}`
      );

      const solcVersion = semver.maxSatisfying(
        Language.supportedVersions(),
        versionPragmas.join(" ")
      );

      if (solcVersion === null) {
        throw new Error(
          `No supported solidity version found. Supported versions: ${Language.supportedVersions()}, pragma directives: ${versionPragmas}`
        );
      }

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
        const strings = parseOutput.errors.map((e: any) =>
          e.toErrorReport(uri, text, false)
        );

        throw new Error(`Slang parsing error:\n${strings.join("\n")}`);
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
        new VariableDeclaration(document, builder),
        new ConstantDefinition(document, builder),
        new ConstructorDefinition(document, builder),
        new EnumDefinition(document, builder),
        new ErrorDefinition(document, builder),
        new FallbackFunctionDefinition(document, builder),
        new LibraryDefinition(document, builder),
        new ModifierDefinition(document, builder),
        new ReceiveFunctionDefinition(document, builder),
        new UserDefinedValueTypeDefinition(document, builder),
        new YulFunctionDefinition(document, builder),
      ];

      const indexedVisitors = _.keyBy(visitors, "ruleKind");

      const cursor: Cursor = parseTree.cursor;
      const ruleKinds = visitors.map((v) => v.ruleKind);
      let node: RuleNode;

      // Useful to keep this here for development
      // const kursor: Cursor = parseTree.cursor.clone();
      // do {
      //   console.log(
      //     `${"  ".repeat(kursor.pathRuleNodes.length)}${kursor.node.kind}(${
      //       ["R", "T"][kursor.node.type]
      //     }): ${kursor.node?.text ?? ""}`
      //   );
      // } while (kursor.goToNext());

      span = transaction.startChild({ op: "walk-generate-symbols" });
      while ((node = cursor.findRuleWithKind(ruleKinds)) !== null) {
        const visitor: SymbolVisitor = indexedVisitors[node.kind];
        visitor.onRuleNode(cursor);

        cursor.goToNext();
      }
      span.finish();

      return { status: "ok", result: builder.getSymbols() };
    });
  };
}
