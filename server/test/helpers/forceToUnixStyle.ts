export function forceToUnixStyle(uri: string) {
  return uri
    .replace(/\\/g, "/")
    .replace(/^\/?\w+:/, (match) => match.toLowerCase());
}
