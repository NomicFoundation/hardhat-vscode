import { expect } from 'chai'
import { test } from 'mocha'
import { TextEdit, WorkspaceEdit } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

// A WorkspaceEdit can carry its edits in `changes` or in `documentChanges`, and
// the edits within a file come in no particular order. Normalise both to sorted
// `changes` of plain `{ range, newText }` edits, leaving out files with no edits.
// File operations (create, rename, delete) are kept apart under `operations`, so
// an answer that includes any never compares equal to an edit or a refusal.
function sorted(edit: WorkspaceEdit | null) {
  const changes: Record<string, TextEdit[]> = {}
  const operations: unknown[] = []
  const add = (uri: string, edits: TextEdit[]) => {
    if (edits.length > 0) {
      changes[uri] = [...(changes[uri] ?? []), ...edits.map(({ range, newText }) => ({ range, newText }))].sort(
        (a, b) => a.range.start.line - b.range.start.line || a.range.start.character - b.range.start.character
      )
    }
  }
  for (const [uri, edits] of Object.entries(edit?.changes ?? {})) {
    add(uri, edits)
  }
  for (const change of edit?.documentChanges ?? []) {
    if ('edits' in change) {
      add(change.textDocument.uri, change.edits as TextEdit[])
    } else {
      operations.push(change)
    }
  }
  return operations.length > 0 ? { changes, operations } : { changes }
}

describe('[hardhat] rename - file-level (not implemented)', () => {
  let defsPath: string
  let userPath: string

  before(async () => {
    client = await getInitializedClient()
    defsPath = getProjectPath('hardhat/contracts/definition/file-level/FileLevelDefs.sol')
    userPath = getProjectPath('hardhat/contracts/definition/file-level/FileLevelUser.sol')

    await client.openDocument(defsPath)
    await client.openDocument(userPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(defsPath)
    await client.openDocument(userPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns an empty edit; attached calls through using are not linked.
  test.skip('free function attached with using {f} for T, from an attached call', async () => {
    const workspaceEdit = await client.rename(toUri(userPath), makePosition(15, 18), 'pointTotal')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(defsPath)]: [
            { range: makeRange(31, 9, 31, 12), newText: 'pointTotal' },
            { range: makeRange(41, 7, 41, 10), newText: 'pointTotal' },
            { range: makeRange(50, 17, 50, 20), newText: 'pointTotal' },
          ],
          [toUri(userPath)]: [
            { range: makeRange(5, 14, 5, 17), newText: 'pointTotal' },
            { range: makeRange(15, 17, 15, 20), newText: 'pointTotal' },
          ],
        },
      })
    )
  })

  // Not implemented: returns an empty edit; attached calls through using are not linked.
  test.skip('library function attached with using L for T, from an attached call', async () => {
    const workspaceEdit = await client.rename(toUri(userPath), makePosition(15, 28), 'taxicab')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(defsPath)]: [{ range: makeRange(36, 13, 36, 22), newText: 'taxicab' }],
          [toUri(userPath)]: [{ range: makeRange(15, 27, 15, 36), newText: 'taxicab' }],
        },
      })
    )
  })
})
