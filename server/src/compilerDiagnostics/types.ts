import { CodeAction, Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { HardhatCompilerError, ServerState } from "../types";

export interface ResolveActionsContext {
  document: TextDocument;
  uri: string;
}

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
