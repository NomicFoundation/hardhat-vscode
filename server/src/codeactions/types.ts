import { CodeAction, Diagnostic } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

export type CodeActionResolver = (
  diagnostic: Diagnostic,
  { document, uri }: { document: TextDocument; uri: string }
) => CodeAction[];
