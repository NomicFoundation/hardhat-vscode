import * as os from "os";
import { TextDocument } from "vscode-languageserver-textdocument";
import { TextDocumentIdentifier } from "vscode-languageserver-protocol";

export function getUriFromDocument(
  document: TextDocument | TextDocumentIdentifier
): string {
  return decodeUriAndRemoveFilePrefix(document.uri);
}

export function toUnixStyle(uri: string) {
  return uri.replace(/\\/g, "/");
}

export function decodeUriAndRemoveFilePrefix(uri: string): string {
  if (os.platform() === "win32" && uri && uri.includes("file:///")) {
    uri = uri.replace("file:///", "");
  } else if (uri && uri.includes("file://")) {
    uri = uri.replace("file://", "");
  }

  if (uri) {
    uri = decodeURIComponent(uri);
  }

  uri = uri.replace(/\\/g, "/");

  return uri;
}

export function convertHardhatUriToVscodeUri(uri: string) {
  if (uri.startsWith("/")) {
    return uri;
  } else {
    return `/${uri}`;
  }
}

export function isCharacterALetter(char: string): boolean {
  return /[a-zA-Z]/.test(char);
}

export function isCharacterANumber(char: string): boolean {
  return /[0-9]/.test(char);
}
