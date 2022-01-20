import { CodeAction, Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Analyzer } from "@analyzer/index";

export type HardhatCompilerError = {
  errorCode: string;
  severity: "error" | "warning";
  message: string;
  sourceLocation: {
    start: number;
    end: number;
  };
};

export type ResolveActionsContext = {
  document: TextDocument;
  uri: string;
  analyzer: Analyzer;
};

export interface CompilerDiagnostic {
  code: string;
  blocks: string[];

  resolveActions: (
    diagnostic: Diagnostic,
    { document, uri, analyzer }: ResolveActionsContext
  ) => CodeAction[];

  fromHardhatCompilerError: (
    document: TextDocument,
    error: HardhatCompilerError
  ) => Diagnostic;
}
