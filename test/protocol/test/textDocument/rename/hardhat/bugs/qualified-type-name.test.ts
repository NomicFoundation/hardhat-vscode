import { expect } from 'chai'
import { test } from 'mocha'
import { TextEdit, WorkspaceEdit } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

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
  test.skip('user-defined value type in a contract, from a qualified use', async () => {
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
