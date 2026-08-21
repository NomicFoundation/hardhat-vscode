import { Diagnostic } from "vscode-languageserver/node";

/**
 * A diagnostic's message is `string | MarkupContent` as of LSP 3.18. Every
 * diagnostic we act on comes from solc as plain text, so we read the text out
 * and match against that.
 */
export function readMessageFromDiagnostic(diagnostic: Diagnostic): string {
  return typeof diagnostic.message === "string"
    ? diagnostic.message
    : diagnostic.message.value;
}
