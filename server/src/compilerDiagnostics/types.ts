import { CodeAction, Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

export type HardhatCompilerError = {
  errorCode: string;
  severity: "error" | "warning";
  message: string;
  sourceLocation: {
    start: number;
    end: number;
  };
};

export interface CompilerDiagnostic {
  code: string;
  blocks: string[];

  resolveActions: (
    diagnostic: Diagnostic,
    { document, uri }: { document: TextDocument; uri: string }
  ) => CodeAction[];

  fromHardhatCompilerError: (
    document: TextDocument,
    error: HardhatCompilerError
  ) => Diagnostic;
}
