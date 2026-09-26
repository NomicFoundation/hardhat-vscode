import { expect } from 'chai'
import { test } from 'mocha'
import { TextEdit, WorkspaceEdit } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
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

describe('[foundry] rename - import-paths', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let basePath: string
  let nestedPath: string
  let deepPath: string
  let sharedPath: string
  let rnNestedPath: string
  let rnRemapPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('foundry/src/references/import-paths/IpBase.sol')
    nestedPath = getProjectPath('foundry/src/references/import-paths/nested/IpNested.sol')
    deepPath = getProjectPath('foundry/src/references/import-paths/deep/inner/IpDeep.sol')
    sharedPath = getProjectPath('foundry/src/rename/import-paths/shared/RnIpShared.sol')
    rnNestedPath = getProjectPath('foundry/src/rename/import-paths/nested/RnIpNestedUser.sol')
    rnRemapPath = getProjectPath('foundry/src/rename/import-paths/RnIpRemapUser.sol')

    await client.openDocument(basePath)
    await client.openDocument(nestedPath)
    await client.openDocument(deepPath)
    await client.openDocument(sharedPath)
    await client.openDocument(rnNestedPath)
    await client.openDocument(rnRemapPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(basePath)
    await client.openDocument(nestedPath)
    await client.openDocument(deepPath)
    await client.openDocument(sharedPath)
    await client.openDocument(rnNestedPath)
    await client.openDocument(rnRemapPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  test('contract in a parent directory, from its declaration, leaving import paths alone', async () => {
    const workspaceEdit = await client.rename(toUri(basePath), makePosition(3, 9), 'IpRenamedBase')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(basePath)]: [{ range: makeRange(3, 9, 3, 15), newText: 'IpRenamedBase' }],
          [toUri(nestedPath)]: [
            { range: makeRange(3, 8, 3, 14), newText: 'IpRenamedBase' },
            { range: makeRange(6, 21, 6, 27), newText: 'IpRenamedBase' },
          ],
          [toUri(deepPath)]: [
            { range: makeRange(6, 4, 6, 10), newText: 'IpRenamedBase' },
            { range: makeRange(8, 36, 8, 42), newText: 'IpRenamedBase' },
            { range: makeRange(9, 20, 9, 26), newText: 'IpRenamedBase' },
          ],
        },
      })
    )
  })

  test('contract in a parent directory, from a use two directories down', async () => {
    const workspaceEdit = await client.rename(toUri(deepPath), makePosition(9, 20), 'IpRenamedBase')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(basePath)]: [{ range: makeRange(3, 9, 3, 15), newText: 'IpRenamedBase' }],
          [toUri(nestedPath)]: [
            { range: makeRange(3, 8, 3, 14), newText: 'IpRenamedBase' },
            { range: makeRange(6, 21, 6, 27), newText: 'IpRenamedBase' },
          ],
          [toUri(deepPath)]: [
            { range: makeRange(6, 4, 6, 10), newText: 'IpRenamedBase' },
            { range: makeRange(8, 36, 8, 42), newText: 'IpRenamedBase' },
            { range: makeRange(9, 20, 9, 26), newText: 'IpRenamedBase' },
          ],
        },
      })
    )
  })

  test('function inherited from a contract in a parent directory', async () => {
    const workspaceEdit = await client.rename(toUri(nestedPath), makePosition(10, 15), 'ipRenamedPing')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(basePath)]: [{ range: makeRange(4, 13, 4, 19), newText: 'ipRenamedPing' }],
          [toUri(nestedPath)]: [{ range: makeRange(10, 15, 10, 21), newText: 'ipRenamedPing' }],
        },
      })
    )
  })

  test('member called through an aliased import', async () => {
    const workspaceEdit = await client.rename(toUri(rnRemapPath), makePosition(9, 23), 'rnIpRenamedTouch')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(sharedPath)]: [{ range: makeRange(4, 13, 4, 22), newText: 'rnIpRenamedTouch' }],
          [toUri(rnNestedPath)]: [{ range: makeRange(9, 23, 9, 32), newText: 'rnIpRenamedTouch' }],
          [toUri(rnRemapPath)]: [{ range: makeRange(9, 23, 9, 32), newText: 'rnIpRenamedTouch' }],
        },
      })
    )
  })
})
