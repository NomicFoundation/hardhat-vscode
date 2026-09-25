import { expect } from 'chai'
import { test } from 'mocha'
import { TextEdit, WorkspaceEdit } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../../src/helpers'
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

describe('[foundry] rename bug - an alias and its original are renamed together', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let otherPath: string
  let importerPath: string
  let ifBasePath: string
  let ifUserAPath: string
  let ifUserBPath: string
  let ifUserCPath: string
  let flRefDefsPath: string
  let flRefUserPath: string
  let uuAmountPath: string
  let uuUseAmountPath: string
  let guardPath: string
  let clientPath: string

  before(async () => {
    client = await getInitializedClient()
    otherPath = getProjectPath('foundry/src/definition/import-forms/Other.sol')
    importerPath = getProjectPath('foundry/src/definition/import-forms/Importer.sol')
    ifBasePath = getProjectPath('foundry/src/references/import-forms/IfBase.sol')
    ifUserAPath = getProjectPath('foundry/src/references/import-forms/IfUserA.sol')
    ifUserBPath = getProjectPath('foundry/src/references/import-forms/IfUserB.sol')
    ifUserCPath = getProjectPath('foundry/src/references/import-forms/IfUserC.sol')
    flRefDefsPath = getProjectPath('foundry/src/references/file-level/FlRefDefs.sol')
    flRefUserPath = getProjectPath('foundry/src/references/file-level/FlRefUser.sol')
    uuAmountPath = getProjectPath('foundry/src/references/udvt-using/UuAmount.sol')
    uuUseAmountPath = getProjectPath('foundry/src/references/udvt-using/UuUseAmount.sol')
    guardPath = getProjectPath('foundry/src/rename/errors-events/Guard.sol')
    clientPath = getProjectPath('foundry/src/rename/errors-events/Client.sol')

    await client.openDocument(otherPath)
    await client.openDocument(importerPath)
    await client.openDocument(ifBasePath)
    await client.openDocument(ifUserAPath)
    await client.openDocument(ifUserBPath)
    await client.openDocument(ifUserCPath)
    await client.openDocument(flRefDefsPath)
    await client.openDocument(flRefUserPath)
    await client.openDocument(uuAmountPath)
    await client.openDocument(uuUseAmountPath)
    await client.openDocument(guardPath)
    await client.openDocument(clientPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(otherPath)
    await client.openDocument(importerPath)
    await client.openDocument(ifBasePath)
    await client.openDocument(ifUserAPath)
    await client.openDocument(ifUserBPath)
    await client.openDocument(ifUserCPath)
    await client.openDocument(flRefDefsPath)
    await client.openDocument(flRefUserPath)
    await client.openDocument(uuAmountPath)
    await client.openDocument(uuUseAmountPath)
    await client.openDocument(guardPath)
    await client.openDocument(clientPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: also renames the alias OtherToken and its use (4:17-4:27, 11:4-11:14).
  test.skip('contract imported as an alias, from its declaration', async () => {
    const workspaceEdit = await client.rename(toUri(otherPath), makePosition(3, 9), 'IfRnOtherToken')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(otherPath)]: [{ range: makeRange(3, 9, 3, 14), newText: 'IfRnOtherToken' }],
          [toUri(importerPath)]: [{ range: makeRange(4, 8, 4, 13), newText: 'IfRnOtherToken' }],
        },
      })
    )
  })

  // Bug: also renames the alias OtherToken and its use (4:17-4:27, 11:4-11:14).
  test.skip('contract imported as an alias, from the name before as', async () => {
    const workspaceEdit = await client.rename(toUri(importerPath), makePosition(4, 8), 'IfRnOtherToken')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(otherPath)]: [{ range: makeRange(3, 9, 3, 14), newText: 'IfRnOtherToken' }],
          [toUri(importerPath)]: [{ range: makeRange(4, 8, 4, 13), newText: 'IfRnOtherToken' }],
        },
      })
    )
  })

  // Bug: also renames the aliased contract in Other.sol (3:9-3:14) and the name before as (4:8-4:13).
  test.skip('import alias of a contract, from a use', async () => {
    const workspaceEdit = await client.rename(toUri(importerPath), makePosition(11, 4), 'IfRnAlias')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(importerPath)]: [
            { range: makeRange(4, 17, 4, 27), newText: 'IfRnAlias' },
            { range: makeRange(11, 4, 11, 14), newText: 'IfRnAlias' },
          ],
        },
      })
    )
  })

  // Bug: also renames the aliased contract in Other.sol (3:9-3:14) and the name before as (4:8-4:13).
  test.skip('import alias of a contract, from the import braces', async () => {
    const workspaceEdit = await client.rename(toUri(importerPath), makePosition(4, 17), 'IfRnAlias')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(importerPath)]: [
            { range: makeRange(4, 17, 4, 27), newText: 'IfRnAlias' },
            { range: makeRange(11, 4, 11, 14), newText: 'IfRnAlias' },
          ],
        },
      })
    )
  })

  // Bug: also renames the alias Vault and its uses in IfUserB.sol and IfUserC.sol, except the Vault in IfUserC.sol's import braces.
  test.skip('contract whose alias is imported again, from its declaration', async () => {
    const workspaceEdit = await client.rename(toUri(ifBasePath), makePosition(11, 9), 'IfRnVault')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(ifBasePath)]: [{ range: makeRange(11, 9, 11, 16), newText: 'IfRnVault' }],
          [toUri(ifUserAPath)]: [
            { range: makeRange(3, 8, 3, 15), newText: 'IfRnVault' },
            { range: makeRange(7, 4, 7, 11), newText: 'IfRnVault' },
          ],
          [toUri(ifUserBPath)]: [{ range: makeRange(3, 8, 3, 15), newText: 'IfRnVault' }],
        },
      })
    )
  })

  // Bug: renames IfVault and all its uses as well, and misses the Vault in IfUserC.sol's import braces (3:8-3:13).
  test.skip('alias imported again from the file that made it, from a use', async () => {
    const workspaceEdit = await client.rename(toUri(ifUserCPath), makePosition(6, 4), 'IfRnVaultAlias')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(ifUserBPath)]: [
            { range: makeRange(3, 19, 3, 24), newText: 'IfRnVaultAlias' },
            { range: makeRange(6, 4, 6, 9), newText: 'IfRnVaultAlias' },
            { range: makeRange(7, 4, 7, 9), newText: 'IfRnVaultAlias' },
          ],
          [toUri(ifUserCPath)]: [
            { range: makeRange(3, 8, 3, 13), newText: 'IfRnVaultAlias' },
            { range: makeRange(6, 4, 6, 9), newText: 'IfRnVaultAlias' },
          ],
        },
      })
    )
  })

  // Bug: also renames the alias FL_CAP and its three uses.
  test.skip('constant imported as an alias, from its declaration', async () => {
    const workspaceEdit = await client.rename(toUri(flRefDefsPath), makePosition(3, 17), 'FL_BOUND')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(flRefDefsPath)]: [
            { range: makeRange(3, 17, 3, 25), newText: 'FL_BOUND' },
            { range: makeRange(7, 15, 7, 23), newText: 'FL_BOUND' },
          ],
          [toUri(flRefUserPath)]: [{ range: makeRange(3, 8, 3, 16), newText: 'FL_BOUND' }],
        },
      })
    )
  })

  // Bug: also renames the constant FL_LIMIT in FlRefDefs.sol and the name before as.
  test.skip('import alias of a constant, from a use', async () => {
    const workspaceEdit = await client.rename(toUri(flRefUserPath), makePosition(11, 37), 'FL_CEILING')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(flRefUserPath)]: [
            { range: makeRange(3, 20, 3, 26), newText: 'FL_CEILING' },
            { range: makeRange(6, 15, 6, 21), newText: 'FL_CEILING' },
            { range: makeRange(6, 24, 6, 30), newText: 'FL_CEILING' },
            { range: makeRange(11, 37, 11, 43), newText: 'FL_CEILING' },
          ],
        },
      })
    )
  })

  // Bug: also renames the constant FL_LIMIT in FlRefDefs.sol and the name before as.
  test.skip('import alias of a constant, from the import braces', async () => {
    const workspaceEdit = await client.rename(toUri(flRefUserPath), makePosition(3, 20), 'FL_CEILING')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(flRefUserPath)]: [
            { range: makeRange(3, 20, 3, 26), newText: 'FL_CEILING' },
            { range: makeRange(6, 15, 6, 21), newText: 'FL_CEILING' },
            { range: makeRange(6, 24, 6, 30), newText: 'FL_CEILING' },
            { range: makeRange(11, 37, 11, 43), newText: 'FL_CEILING' },
          ],
        },
      })
    )
  })

  // Bug: also renames the alias Amt and its four uses.
  test.skip('user-defined value type imported as an alias, from its declaration', async () => {
    const workspaceEdit = await client.rename(toUri(uuAmountPath), makePosition(3, 5), 'UuQty')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(uuAmountPath)]: [
            { range: makeRange(3, 5, 3, 13), newText: 'UuQty' },
            { range: makeRange(6, 20, 6, 28), newText: 'UuQty' },
            { range: makeRange(7, 15, 7, 23), newText: 'UuQty' },
            { range: makeRange(10, 18, 10, 26), newText: 'UuQty' },
            { range: makeRange(10, 30, 10, 38), newText: 'UuQty' },
            { range: makeRange(10, 65, 10, 73), newText: 'UuQty' },
            { range: makeRange(11, 15, 11, 23), newText: 'UuQty' },
            { range: makeRange(11, 29, 11, 37), newText: 'UuQty' },
            { range: makeRange(11, 50, 11, 58), newText: 'UuQty' },
          ],
          [toUri(uuUseAmountPath)]: [{ range: makeRange(3, 8, 3, 16), newText: 'UuQty' }],
        },
      })
    )
  })

  // Bug: also renames type UuAmount and all its uses in UuAmount.sol, and the name before as.
  test.skip('import alias of a user-defined value type, from a use', async () => {
    const workspaceEdit = await client.rename(toUri(uuUseAmountPath), makePosition(12, 21), 'Qty')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(uuUseAmountPath)]: [
            { range: makeRange(3, 20, 3, 23), newText: 'Qty' },
            { range: makeRange(5, 22, 5, 25), newText: 'Qty' },
            { range: makeRange(9, 4, 9, 7), newText: 'Qty' },
            { range: makeRange(12, 8, 12, 11), newText: 'Qty' },
            { range: makeRange(12, 21, 12, 24), newText: 'Qty' },
          ],
        },
      })
    )
  })

  // Bug: also renames the contract EERGGuard in Guard.sol (3:9-3:18) and the name before as (3:8-3:17).
  test.skip('import alias of a contract, from an error qualifier', async () => {
    const workspaceEdit = await client.rename(toUri(clientPath), makePosition(19, 15), 'EERNGate')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(clientPath)]: [
            { range: makeRange(3, 21, 3, 25), newText: 'EERNGate' },
            { range: makeRange(5, 23, 5, 27), newText: 'EERNGate' },
            { range: makeRange(6, 19, 6, 23), newText: 'EERNGate' },
            { range: makeRange(19, 15, 19, 19), newText: 'EERNGate' },
            { range: makeRange(23, 15, 23, 19), newText: 'EERNGate' },
          ],
        },
      })
    )
  })
})
