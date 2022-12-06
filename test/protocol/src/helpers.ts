import { Range } from 'vscode-languageserver-protocol'
import { URI } from 'vscode-uri'

export function toUri(path: string) {
  return URI.file(path).toString()
}

export function timeoutPromise(timeout: number, reason: string) {
  return new Promise((_resolve, reject) => {
    setTimeout(() => {
      reject(`Timeout: ${reason}`)
    }, timeout)
  })
}
