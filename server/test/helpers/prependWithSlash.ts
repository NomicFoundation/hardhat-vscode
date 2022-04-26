export function prependWithSlash(path: string) {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }

  return path;
}
