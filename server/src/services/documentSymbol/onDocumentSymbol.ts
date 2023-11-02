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
import { ServerState } from "../../types";
import { walk } from "../../parser/slangHelpers";
import { SymbolTreeBuilder } from "./SymbolTreeBuilder";
import { StructDefinition } from "./visitors/StructDefinition";
import { SymbolVisitor } from "./SymbolVisitor";
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

export function onDocumentSymbol(serverState: ServerState) {
  return async (
    params: DocumentSymbolParams
  ): Promise<DocumentSymbol[] | SymbolInformation[] | null> => {
    const { telemetry, solcVersions } = serverState;
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

      versionPragmas.push("<= 0.8.19"); // latest supported by slang

      const solcVersion =
        semver.maxSatisfying(solcVersions, versionPragmas.join(" ")) ||
        _.last(solcVersions);

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

        throw new Error(`Slang parsing error: ${strings.join("")}`);
      }

      // let count = 0;
      // // const start = performance.now();
      // const kursor: Cursor = parseTree.cursor.clone();
      // do {
      //   console.log(
      //     `${"  ".repeat(kursor.pathRuleNodes.length)}${kursor.node.kind}: ${
      //       kursor.node?.text
      //     }`
      //   );
      // } while (kursor.goToNext());
      // const end = performance.now();
      // const elapsed = end - start;
      // console.log({ elapsed });
      // console.log({ count });

      // const myobj = { foo: { bar: 123 } };
      // const node = kursor.node;
      // const start = performance.now();
      // for (let index = 0; index < 1_000_000; index++) {
      //   // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      //   myobj.foo.bar;
      //   // node.type;
      // }
      // const end = performance.now();
      // const elapsed = end - start;
      // console.log({ elapsed });

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
      ];

      // Walk the tree and generate symbol nodes
      span = transaction.startChild({ op: "walk-generate-symbols" });
      walk(
        parseTree.cursor,
        (nodeWrapper) => {
          for (const visitor of visitors) {
            visitor.enter(nodeWrapper);
          }
        },
        (nodeWrapper) => {
          for (const visitor of visitors) {
            visitor.exit(nodeWrapper);
          }
        }
      );
      span.finish();
      // console.log("ALL GOOD");
      // console.log(JSON.stringify(builder.symbols, null, 2));

      return { status: "ok", result: builder.symbols };
    });
  };
}
