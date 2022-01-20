import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  Range,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { HardhatCompilerError } from "../types";
import { attemptConstrainToContractName } from "@compilerDiagnostics/conversions/attemptConstrainToContractName";
import { parseContractDefinition } from "./parsing/parseContractDefinition";

export class MarkContractAbstract {
  public code = "3656";
  public blocks = [];

  fromHardhatCompilerError(
    document: TextDocument,
    error: HardhatCompilerError
  ): Diagnostic {
    return attemptConstrainToContractName(document, error);
  }

  resolveActions(
    diagnostic: Diagnostic,
    { document, uri }: { document: TextDocument; uri: string }
  ): CodeAction[] {
    const parseResult = parseContractDefinition(diagnostic, document);

    if (parseResult === null) {
      return [];
    }

    const { tokens, functionSourceLocation } = parseResult;

    const contractToken = tokens.find(
      (t) => "Keyword" && t.value === "contract"
    );

    if (contractToken === undefined || contractToken.range === undefined) {
      return [];
    }

    const startChar = functionSourceLocation.start + contractToken.range[0];

    const quickfix = {
      title: `Add abstract to contract declaration`,
      kind: CodeActionKind.QuickFix,
      isPreferred: true,
      edit: {
        changes: {
          [uri]: [
            {
              range: Range.create(
                document.positionAt(startChar),
                document.positionAt(startChar)
              ),
              newText: "abstract ",
            },
          ],
        },
      },
    };

    return [quickfix];
  }
}
