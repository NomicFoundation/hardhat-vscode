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

export function makeCodeAction(uri: string, title: string, range: Range, newText: string, isPreferred = false) {
  return {
    title,
    edit: {
      changes: {
        [uri]: [
          {
            range,
            newText,
          },
        ],
      },
    },
    isPreferred,
    kind: 'quickfix',
  }
}
