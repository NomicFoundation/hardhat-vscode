import { TextDocument } from "vscode-languageserver-textdocument";
import { TextDocumentIdentifier } from "vscode-languageserver-protocol";

export function getUriFromDocument(
  document: TextDocument | TextDocumentIdentifier
): string {
  return decodeUriAndRemoveFilePrefix(document.uri);
}

export function decodeUriAndRemoveFilePrefix(uri: string): string {
  if (uri && uri.includes("file://")) {
    uri = uri.replace("file://", "");
  }

  if (uri) {
    uri = decodeURIComponent(uri);
  }

  return uri;
}

export function isCharacterALetter(char: string): boolean {
  return /[a-zA-Z]/.test(char);
}

export function isCharacterANumber(char: string): boolean {
  return /[0-9]/.test(char);
}
