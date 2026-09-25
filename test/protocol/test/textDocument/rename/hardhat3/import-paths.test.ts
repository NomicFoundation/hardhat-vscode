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

describe('[hardhat3] rename - import-paths', () => {
  let basePath: string
  let nestedPath: string
  let deepPath: string
  let remappedPath: string
  let relPath: string
  let remapPath: string
  let sharedPath: string
  let rnNestedPath: string
  let rnRemapPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('hardhat3/contracts/references/import-paths/IpBase.sol')
    nestedPath = getProjectPath('hardhat3/contracts/references/import-paths/nested/IpNested.sol')
    deepPath = getProjectPath('hardhat3/contracts/references/import-paths/deep/inner/IpDeep.sol')
    remappedPath = getProjectPath('hardhat3/contracts/references/import-paths/remapped/IpRemapped.sol')
    relPath = getProjectPath('hardhat3/contracts/references/import-paths/IpRelUser.sol')
    remapPath = getProjectPath('hardhat3/contracts/references/import-paths/IpRemapUser.sol')
    sharedPath = getProjectPath('hardhat3/contracts/rename/import-paths/shared/RnIpShared.sol')
    rnNestedPath = getProjectPath('hardhat3/contracts/rename/import-paths/nested/RnIpNestedUser.sol')
    rnRemapPath = getProjectPath('hardhat3/contracts/rename/import-paths/RnIpRemapUser.sol')

    await client.openDocument(basePath)
    await client.openDocument(nestedPath)
    await client.openDocument(deepPath)
    await client.openDocument(remappedPath)
    await client.openDocument(relPath)
    await client.openDocument(remapPath)
    await client.openDocument(sharedPath)
    await client.openDocument(rnNestedPath)
    await client.openDocument(rnRemapPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(basePath)
    await client.openDocument(nestedPath)
    await client.openDocument(deepPath)
    await client.openDocument(remappedPath)
    await client.openDocument(relPath)
    await client.openDocument(remapPath)
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

  test('contract imported through a remapping and a relative path', async () => {
    const workspaceEdit = await client.rename(toUri(remapPath), makePosition(6, 4), 'IpRenamedRemapped')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(remappedPath)]: [{ range: makeRange(3, 9, 3, 19), newText: 'IpRenamedRemapped' }],
          [toUri(relPath)]: [{ range: makeRange(6, 4, 6, 14), newText: 'IpRenamedRemapped' }],
          [toUri(remapPath)]: [{ range: makeRange(6, 4, 6, 14), newText: 'IpRenamedRemapped' }],
        },
      })
    )
  })

  test('member called through an aliased remapped import', async () => {
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
