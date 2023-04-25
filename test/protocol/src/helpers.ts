import { existsSync } from 'fs'
import { URI } from 'vscode-uri'
import os from 'os'

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

let forgeInstalled: boolean | undefined

export function isForgeInstalled() {
  if (forgeInstalled === undefined) {
    forgeInstalled = existsSync(`${process.env.HOME}/.foundry/bin/forge`)
  }

  return forgeInstalled
}

export function shouldSkipFoundryTests() {
  return os.platform() !== 'linux' && !isForgeInstalled()
}
