import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  Range,
  TextEdit,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { CompilerDiagnostic, HardhatCompilerError } from "../types";
import { attemptConstrainToFunctionName } from "../conversions/attemptConstrainToFunctionName";
import {
  parseFunctionDefinition,
  ParseFunctionDefinitionResult,
} from "./parsing/parseFunctionDefinition";
import { LookupResult, lookupToken } from "./parsing/lookupToken";
import { Token } from "@solidity-parser/parser/dist/src/types";

export class AddOverrideSpecifier implements CompilerDiagnostic {
  public code = "9456";

  fromHardhatCompilerError(
    document: TextDocument,
    error: HardhatCompilerError
  ): Diagnostic {
    return attemptConstrainToFunctionName(document, error);
  }

  resolveActions(
    diagnostic: Diagnostic,
    { document, uri }: { document: TextDocument; uri: string }
  ): CodeAction[] {
    if (!diagnostic.data) {
      return [];
    }

    const parseResult = parseFunctionDefinition(diagnostic, document);

    if (parseResult === null) {
      return [];
    }

    const { functionDefinition, functionSourceLocation } = parseResult;

    if (
      functionDefinition.visibility === "default" &&
      functionDefinition.stateMutability === null
    ) {
      return this.buildActionFrom(
        document,
        uri,
        parseResult,
        (t) => t.type === "Punctuator" && t.value === ")",
        (token: Token, { isSameLine, offset }) => {
          const end = token && token.range ? token.range[1] : 0;

          const position = document.positionAt(
            functionSourceLocation.start + end + (isSameLine ? 0 : 1)
          );

          return {
            newText: isSameLine
              ? ` override`
              : `${"".padStart(offset)}override\n`,
            range: Range.create(position, position),
          };
        }
      );
    }

    if (
      functionDefinition.visibility !== "default" &&
      functionDefinition.stateMutability === null
    ) {
      return this.buildActionFrom(
        document,
        uri,
        parseResult,
        (t) =>
          t.type === "Keyword" && t.value === functionDefinition.visibility,
        (token: Token, { isSameLine, offset }) => {
          const end = token && token.range ? token.range[1] : 0;

          const position = document.positionAt(
            functionSourceLocation.start + end + (isSameLine ? 0 : 1)
          );

          return {
            newText: isSameLine
              ? ` override`
              : `${"".padStart(offset)}override\n`,
            range: Range.create(position, position),
          };
        }
      );
    }

    if (
      functionDefinition.visibility !== "default" &&
      functionDefinition.stateMutability !== null
    ) {
      return this.buildActionFrom(
        document,
        uri,
        parseResult,
        (t) =>
          t.type === "Keyword" &&
          t.value === functionDefinition.stateMutability,
        (token: Token, { isSameLine, offset }) => {
          const end = token && token.range ? token.range[1] : 0;

          const position = document.positionAt(
            functionSourceLocation.start + end + (isSameLine ? 0 : 1)
          );

          return {
            newText: isSameLine
              ? ` override`
              : `${"".padStart(offset)}override\n`,
            range: Range.create(position, position),
          };
        }
      );
    }

    return [];
  }

  buildActionFrom(
    document: TextDocument,
    uri: string,
    { tokens, functionSourceLocation }: ParseFunctionDefinitionResult,
    tokenSelector: (token: Token) => boolean,
    buildChange: (token: Token, lookupResult: LookupResult) => TextEdit
  ) {
    const lookupResult = lookupToken(
      tokens,
      document,
      functionSourceLocation,
      tokenSelector
    );

    if (lookupResult === null) {
      return [];
    }

    const { token } = lookupResult;

    if (token.range === undefined) {
      return [];
    }

    const change = buildChange(token, lookupResult);

    const action: CodeAction = {
      title: "Add override specifier to function definition",
      kind: CodeActionKind.QuickFix,
      isPreferred: true,
      edit: {
        changes: {
          [uri]: [change],
        },
      },
    };

    return [action];
  }
}
