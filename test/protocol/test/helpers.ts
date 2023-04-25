import path from 'path'
import { Position, Range } from 'vscode-languageserver-protocol'

export function getProjectPath(partialPath: string) {
  return path.join(__dirname, '..', 'projects', partialPath)
}

export function makePosition(line: number, character: number): Position {
  return {
    line,
    character,
  }
}

export function makeRange(startLine: number, startChar: number, endLine: number, endChar: number): Range {
  return {
    start: {
      character: startChar,
      line: startLine,
    },
    end: {
      character: endChar,
      line: endLine,
    },
  }
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
