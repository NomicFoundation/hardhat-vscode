export function forceToUnixStyle(uri: string) {
  return uri.replace(/\\/g, "/");
}
