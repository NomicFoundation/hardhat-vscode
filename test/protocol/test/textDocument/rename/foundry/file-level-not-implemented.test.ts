import { expect } from 'chai'
import { test } from 'mocha'
import { TextEdit, WorkspaceEdit } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

// Edits within a file come in no particular order: compare them as sets.
function sorted(edit: WorkspaceEdit | null) {
  if (edit === null) {
    return null
  }
  const changes: Record<string, TextEdit[]> = {}
  for (const [uri, edits] of Object.entries(edit.changes ?? {})) {
    changes[uri] = [...edits].sort(
      (a, b) => a.range.start.line - b.range.start.line || a.range.start.character - b.range.start.character
    )
  }
  return { changes }
}

describe('[foundry] rename - file-level (not implemented)', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let defsPath: string
  let userPath: string

  before(async () => {
    client = await getInitializedClient()
    defsPath = getProjectPath('foundry/src/definition/file-level/FileLevelDefs.sol')
    userPath = getProjectPath('foundry/src/definition/file-level/FileLevelUser.sol')

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
