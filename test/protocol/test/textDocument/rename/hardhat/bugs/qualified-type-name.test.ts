import { expect } from 'chai'
import { test } from 'mocha'
import { TextEdit, WorkspaceEdit } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

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

describe('[hardhat] rename bug - qualified type name looked up as one dotted name', () => {
  let vaultPath: string

  before(async () => {
    client = await getInitializedClient()
    vaultPath = getProjectPath('hardhat/contracts/definition/udvt-using/Vault.sol')

    await client.openDocument(vaultPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(vaultPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns an empty edit; the qualified name Vault.Shares is looked up as one name.
  test('user-defined value type in a contract, from a qualified use', async () => {
    const workspaceEdit = await client.rename(toUri(vaultPath), makePosition(52, 24), 'Units')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(vaultPath)]: [
            { range: makeRange(20, 9, 20, 15), newText: 'Units' },
            { range: makeRange(24, 24, 24, 30), newText: 'Units' },
            { range: makeRange(26, 4, 26, 10), newText: 'Units' },
            { range: makeRange(37, 17, 37, 23), newText: 'Units' },
            { range: makeRange(37, 29, 37, 35), newText: 'Units' },
            { range: makeRange(46, 26, 46, 32), newText: 'Units' },
            { range: makeRange(47, 21, 47, 27), newText: 'Units' },
            { range: makeRange(52, 24, 52, 30), newText: 'Units' },
            { range: makeRange(53, 21, 53, 27), newText: 'Units' },
          ],
        },
      })
    )
  })
})
