export function ensureFilePrefix(path: string) {
  if (path.startsWith("file://")) {
    return path;
  }

  if (path.startsWith("/")) {
    return `file://${path}`;
  } else {
    return `file:///${path}`;
  }
}
