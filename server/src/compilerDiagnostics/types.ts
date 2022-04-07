import { CodeAction, Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ServerState } from "types";

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
};

export interface CompilerDiagnostic {
  code: string;
  blocks: string[];

  resolveActions: (
    serverState: ServerState,
    diagnostic: Diagnostic,
    { document, uri }: ResolveActionsContext
  ) => CodeAction[];

  fromHardhatCompilerError: (
    document: TextDocument,
    error: HardhatCompilerError
  ) => Diagnostic;
}
