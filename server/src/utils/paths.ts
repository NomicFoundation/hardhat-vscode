import { URI } from "vscode-uri";

export function toPath(uri: string) {
  return URI.parse(uri).fsPath;
}

// Ensure an absolute path uses os-specific slashes
export function normalizeAbsolutePath(absolutePath: string) {
  return uppercaseDriveLetter(URI.file(absolutePath).fsPath);
}

export function uppercaseDriveLetter(uri: string) {
  return uri.replace(/^\/?\w+:/, (match) => match.toUpperCase());
}

export function wildcardDriveLetter(uri: string) {
  return uri.replace(/^\/?\w+:/, "*");
}

export function pathsEqual(path1: string, path2: string) {
  return normalizeAbsolutePath(path1) === normalizeAbsolutePath(path2);
}
