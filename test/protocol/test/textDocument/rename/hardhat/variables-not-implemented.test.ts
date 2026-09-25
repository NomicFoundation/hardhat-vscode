import { expect } from 'chai'
import { test } from 'mocha'
import { TextEdit, WorkspaceEdit } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../src/helpers'
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

describe('[hardhat] rename - variables (not implemented)', () => {
  let layoutPath: string
  let localsPath: string

  before(async () => {
    client = await getInitializedClient()
    layoutPath = getProjectPath('hardhat/contracts/definition/variables/LayoutConstants.sol')
    localsPath = getProjectPath('hardhat/contracts/references/variables/RvLocals.sol')

    await client.openDocument(layoutPath)
    await client.openDocument(localsPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(layoutPath)
    await client.openDocument(localsPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns 3:17-3:26 and 4:32-4:41 but not the use in layout at; layout at expressions are not analysed.
  test.skip('file-level constant from its declaration, including its use in layout at', async () => {
    const workspaceEdit = await client.rename(toUri(layoutPath), makePosition(3, 17), 'ROOT_SLOT')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(layoutPath)]: [
            { range: makeRange(3, 17, 3, 26), newText: 'ROOT_SLOT' },
            { range: makeRange(4, 32, 4, 41), newText: 'ROOT_SLOT' },
            { range: makeRange(16, 54, 16, 63), newText: 'ROOT_SLOT' },
          ],
        },
      })
    )
  })

  // Not implemented: returns the three plain edits to sum; there is no collision check.
  test.skip('state variable renamed to the name of a named return that would capture a use is refused', async () => {
    const workspaceEdit = await client.rename(toUri(localsPath), makePosition(4, 19), 'sum').catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(Object.keys(workspaceEdit?.changes ?? {})).to.deep.equal([])
  })

  // Not implemented: returns the two plain edits to hi; there is no collision check.
  test.skip('named return renamed to the other named return of the same function is refused', async () => {
    const workspaceEdit = await client.rename(toUri(localsPath), makePosition(23, 73), 'hi').catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(Object.keys(workspaceEdit?.changes ?? {})).to.deep.equal([])
  })
})
