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

describe('[foundry] rename - import-paths (not implemented)', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let sharedPath: string
  let rnNestedPath: string
  let rnRemapPath: string

  before(async () => {
    client = await getInitializedClient()
    sharedPath = getProjectPath('foundry/src/rename/import-paths/shared/RnIpShared.sol')
    rnNestedPath = getProjectPath('foundry/src/rename/import-paths/nested/RnIpNestedUser.sol')
    rnRemapPath = getProjectPath('foundry/src/rename/import-paths/RnIpRemapUser.sol')

    await client.openDocument(sharedPath)
    await client.openDocument(rnNestedPath)
    await client.openDocument(rnRemapPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(sharedPath)
    await client.openDocument(rnNestedPath)
    await client.openDocument(rnRemapPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: also renames the alias RnIpRemote and its uses; rename has no alias handling.
  test.skip('contract imported under an alias, from its declaration, leaving the alias alone', async () => {
    const workspaceEdit = await client.rename(toUri(sharedPath), makePosition(3, 9), 'RnIpRenamedShared')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(sharedPath)]: [{ range: makeRange(3, 9, 3, 19), newText: 'RnIpRenamedShared' }],
          [toUri(rnNestedPath)]: [
            { range: makeRange(3, 8, 3, 18), newText: 'RnIpRenamedShared' },
            { range: makeRange(6, 4, 6, 14), newText: 'RnIpRenamedShared' },
            { range: makeRange(6, 37, 6, 47), newText: 'RnIpRenamedShared' },
          ],
          [toUri(rnRemapPath)]: [{ range: makeRange(3, 8, 3, 18), newText: 'RnIpRenamedShared' }],
        },
      })
    )
  })

  // Not implemented: also renames the alias RnIpRemote and its uses; rename has no alias handling.
  test.skip('contract from the name before as in an aliased import', async () => {
    const workspaceEdit = await client.rename(toUri(rnRemapPath), makePosition(3, 8), 'RnIpRenamedShared')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(sharedPath)]: [{ range: makeRange(3, 9, 3, 19), newText: 'RnIpRenamedShared' }],
          [toUri(rnNestedPath)]: [
            { range: makeRange(3, 8, 3, 18), newText: 'RnIpRenamedShared' },
            { range: makeRange(6, 4, 6, 14), newText: 'RnIpRenamedShared' },
            { range: makeRange(6, 37, 6, 47), newText: 'RnIpRenamedShared' },
          ],
          [toUri(rnRemapPath)]: [{ range: makeRange(3, 8, 3, 18), newText: 'RnIpRenamedShared' }],
        },
      })
    )
  })

  // Not implemented: renames RnIpShared, its declaration and every use in other files, along with the alias.
  test.skip('import alias from a use, leaving the aliased contract alone', async () => {
    const workspaceEdit = await client.rename(toUri(rnRemapPath), makePosition(6, 4), 'RnIpFarShared')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(rnRemapPath)]: [
            { range: makeRange(3, 22, 3, 32), newText: 'RnIpFarShared' },
            { range: makeRange(6, 4, 6, 14), newText: 'RnIpFarShared' },
            { range: makeRange(12, 43, 12, 53), newText: 'RnIpFarShared' },
          ],
        },
      })
    )
  })
})
