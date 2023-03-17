import { URI } from "vscode-uri";

export function toPath(uri: string) {
  return URI.parse(uri).fsPath;
}

export function toUri(path: string) {
  return URI.file(path);
}
