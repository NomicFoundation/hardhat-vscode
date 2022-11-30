import { URI } from 'vscode-uri'

export function toUri(path: string) {
  return URI.file(path).toString()
}
