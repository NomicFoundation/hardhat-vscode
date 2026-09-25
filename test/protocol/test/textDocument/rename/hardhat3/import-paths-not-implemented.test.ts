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

describe('[hardhat3] rename - import-paths (not implemented)', () => {
  let contextPath: string
  let ozPath: string
  let consoleSolPath: string
  let sharedPath: string
  let rnNestedPath: string
  let rnRemapPath: string
  let ipOwnablePath: string
  let rnIpOwnablePath: string
  let fileRenamePath: string
  let importTestPath: string
  let ipConsolePath: string
  let consoleCallerPath: string

  before(async () => {
    client = await getInitializedClient()
    contextPath = getProjectPath('hardhat3/contracts/../node_modules/@openzeppelin/contracts/utils/Context.sol')
    ozPath = getProjectPath('hardhat3/contracts/../node_modules/@openzeppelin/contracts/access/Ownable.sol')
    consoleSolPath = getProjectPath('hardhat3/contracts/../node_modules/hardhat/console.sol')
    sharedPath = getProjectPath('hardhat3/contracts/rename/import-paths/shared/RnIpShared.sol')
    rnNestedPath = getProjectPath('hardhat3/contracts/rename/import-paths/nested/RnIpNestedUser.sol')
    rnRemapPath = getProjectPath('hardhat3/contracts/rename/import-paths/RnIpRemapUser.sol')
    ipOwnablePath = getProjectPath('hardhat3/contracts/references/import-paths/IpOwnable.sol')
    rnIpOwnablePath = getProjectPath('hardhat3/contracts/rename/import-paths/RnIpOwnable.sol')
    fileRenamePath = getProjectPath('hardhat3/contracts/misc/FileRename.sol')
    importTestPath = getProjectPath('hardhat3/contracts/definition/ImportTest.sol')
    ipConsolePath = getProjectPath('hardhat3/contracts/references/import-paths/IpConsole.sol')
    consoleCallerPath = getProjectPath('hardhat3/contracts/definition/bugs/overload-resolution/ConsoleCaller.sol')

    await client.openDocument(contextPath)
    await client.openDocument(ozPath)
    await client.openDocument(consoleSolPath)
    await client.openDocument(sharedPath)
    await client.openDocument(rnNestedPath)
    await client.openDocument(rnRemapPath)
    await client.openDocument(ipOwnablePath)
    await client.openDocument(rnIpOwnablePath)
    await client.openDocument(fileRenamePath)
    await client.openDocument(importTestPath)
    await client.openDocument(ipConsolePath)
    await client.openDocument(consoleCallerPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(contextPath)
    await client.openDocument(ozPath)
    await client.openDocument(consoleSolPath)
    await client.openDocument(sharedPath)
    await client.openDocument(rnNestedPath)
    await client.openDocument(rnRemapPath)
    await client.openDocument(ipOwnablePath)
    await client.openDocument(rnIpOwnablePath)
    await client.openDocument(fileRenamePath)
    await client.openDocument(importTestPath)
    await client.openDocument(ipConsolePath)
    await client.openDocument(consoleCallerPath)
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

  // Not implemented: edits the declaration and calls in the package's Ownable.sol along with the project's calls.
  test.skip('package function from a project call is refused', async () => {
    const workspaceEdit = await client
      .rename(toUri(ipOwnablePath), makePosition(7, 8), 'rnIpRenamedTransfer')
      .catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(Object.keys(workspaceEdit?.changes ?? {})).to.deep.equal([])
  })

  // Not implemented: edits the declaration and calls in the package's Ownable.sol along with the project's calls.
  test.skip('package function from its declaration is refused', async () => {
    const workspaceEdit = await client
      .rename(toUri(ozPath), makePosition(70, 13), 'rnIpRenamedTransfer')
      .catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(Object.keys(workspaceEdit?.changes ?? {})).to.deep.equal([])
  })

  // Not implemented: edits the contract's declaration in the package's Ownable.sol and every use in the project.
  test.skip('package contract from an inheritance list is refused', async () => {
    const workspaceEdit = await client
      .rename(toUri(ipOwnablePath), makePosition(5, 22), 'RnIpRenamedOwnable')
      .catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(Object.keys(workspaceEdit?.changes ?? {})).to.deep.equal([])
  })

  // Not implemented: edits the declaration in the package's Context.sol and the project's call.
  test.skip('transitively imported package function is refused', async () => {
    const workspaceEdit = await client
      .rename(toUri(ipOwnablePath), makePosition(16, 15), 'rnIpRenamedMsgData')
      .catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(Object.keys(workspaceEdit?.changes ?? {})).to.deep.equal([])
  })

  // Not implemented: edits console.sol's log(uint256, uint256) and every two-argument log call.
  test.skip('console.log overload is refused', async () => {
    const workspaceEdit = await client
      .rename(toUri(ipConsolePath), makePosition(8, 16), 'rnIpRenamedLog')
      .catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(Object.keys(workspaceEdit?.changes ?? {})).to.deep.equal([])
  })

  // Not implemented: renames the override and its call, and the overridden function in the package's Ownable.sol.
  test.skip('project override of a package function is refused', async () => {
    const workspaceEdit = await client
      .rename(toUri(rnIpOwnablePath), makePosition(8, 13), 'rnIpRenamedRenounce')
      .catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(Object.keys(workspaceEdit?.changes ?? {})).to.deep.equal([])
  })
})
