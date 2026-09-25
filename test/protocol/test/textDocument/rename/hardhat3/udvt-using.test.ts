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

describe('[hardhat3] rename - udvt-using', () => {
  let pricePath: string
  let usePricePath: string
  let vaultPath: string
  let rnMoneyPath: string

  before(async () => {
    client = await getInitializedClient()
    pricePath = getProjectPath('hardhat3/contracts/definition/udvt-using/Price.sol')
    usePricePath = getProjectPath('hardhat3/contracts/definition/udvt-using/UsePrice.sol')
    vaultPath = getProjectPath('hardhat3/contracts/definition/udvt-using/Vault.sol')
    rnMoneyPath = getProjectPath('hardhat3/contracts/rename/udvt-using/RnMoney.sol')

    await client.openDocument(pricePath)
    await client.openDocument(usePricePath)
    await client.openDocument(vaultPath)
    await client.openDocument(rnMoneyPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(pricePath)
    await client.openDocument(usePricePath)
    await client.openDocument(vaultPath)
    await client.openDocument(rnMoneyPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  test('user-defined value type, from a use in another file', async () => {
    const workspaceEdit = await client.rename(toUri(usePricePath), makePosition(8, 21), 'Cost')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(pricePath)]: [
            { range: makeRange(3, 5, 3, 10), newText: 'Cost' },
            { range: makeRange(5, 48, 5, 53), newText: 'Cost' },
            { range: makeRange(7, 13, 7, 18), newText: 'Cost' },
            { range: makeRange(7, 22, 7, 27), newText: 'Cost' },
            { range: makeRange(7, 45, 7, 50), newText: 'Cost' },
            { range: makeRange(8, 11, 8, 16), newText: 'Cost' },
            { range: makeRange(8, 22, 8, 27), newText: 'Cost' },
            { range: makeRange(8, 40, 8, 45), newText: 'Cost' },
            { range: makeRange(11, 13, 11, 18), newText: 'Cost' },
            { range: makeRange(11, 22, 11, 27), newText: 'Cost' },
            { range: makeRange(11, 45, 11, 50), newText: 'Cost' },
            { range: makeRange(12, 11, 12, 16), newText: 'Cost' },
            { range: makeRange(12, 22, 12, 27), newText: 'Cost' },
            { range: makeRange(12, 40, 12, 45), newText: 'Cost' },
            { range: makeRange(15, 12, 15, 17), newText: 'Cost' },
            { range: makeRange(15, 21, 15, 26), newText: 'Cost' },
            { range: makeRange(16, 11, 16, 16), newText: 'Cost' },
            { range: makeRange(16, 30, 16, 35), newText: 'Cost' },
            { range: makeRange(19, 15, 19, 20), newText: 'Cost' },
            { range: makeRange(20, 11, 20, 16), newText: 'Cost' },
            { range: makeRange(23, 16, 23, 21), newText: 'Cost' },
            { range: makeRange(23, 39, 23, 44), newText: 'Cost' },
          ],
          [toUri(usePricePath)]: [
            { range: makeRange(3, 8, 3, 13), newText: 'Cost' },
            { range: makeRange(6, 4, 6, 9), newText: 'Cost' },
            { range: makeRange(8, 21, 8, 26), newText: 'Cost' },
            { range: makeRange(12, 22, 12, 27), newText: 'Cost' },
            { range: makeRange(13, 22, 13, 27), newText: 'Cost' },
          ],
        },
      })
    )
  })

  test('library, from its name in a using directive', async () => {
    const workspaceEdit = await client.rename(toUri(vaultPath), makePosition(22, 10), 'Arith')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(vaultPath)]: [
            { range: makeRange(3, 8, 3, 12), newText: 'Arith' },
            { range: makeRange(22, 10, 22, 14), newText: 'Arith' },
          ],
        },
      })
    )
  })

  test('user-defined operator token is refused (only because the operator is not linked to its function)', async () => {
    const workspaceEdit = await client.rename(toUri(usePricePath), makePosition(13, 19), 'eqCost').catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(Object.keys(workspaceEdit?.changes ?? {})).to.deep.equal([])
  })

  test('built-in wrap member is refused', async () => {
    const workspaceEdit = await client.rename(toUri(usePricePath), makePosition(13, 28), 'wrapped').catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(Object.keys(workspaceEdit?.changes ?? {})).to.deep.equal([])
  })

  test('file-level user-defined value type shadowed in a contract, from its declaration', async () => {
    const workspaceEdit = await client.rename(toUri(rnMoneyPath), makePosition(3, 5), 'RnCash')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(rnMoneyPath)]: [
            { range: makeRange(3, 5, 3, 12), newText: 'RnCash' },
            { range: makeRange(5, 36, 5, 43), newText: 'RnCash' },
            { range: makeRange(7, 16, 7, 23), newText: 'RnCash' },
            { range: makeRange(7, 27, 7, 34), newText: 'RnCash' },
            { range: makeRange(7, 52, 7, 59), newText: 'RnCash' },
            { range: makeRange(8, 11, 8, 18), newText: 'RnCash' },
            { range: makeRange(8, 24, 8, 31), newText: 'RnCash' },
            { range: makeRange(8, 44, 8, 51), newText: 'RnCash' },
            { range: makeRange(11, 15, 11, 22), newText: 'RnCash' },
            { range: makeRange(11, 40, 11, 47), newText: 'RnCash' },
            { range: makeRange(12, 11, 12, 18), newText: 'RnCash' },
            { range: makeRange(12, 25, 12, 32), newText: 'RnCash' },
            { range: makeRange(16, 4, 16, 11), newText: 'RnCash' },
            { range: makeRange(18, 20, 18, 27), newText: 'RnCash' },
          ],
        },
      })
    )
  })

  test('contract-level user-defined value type shadowing a file-level one, from a use', async () => {
    const workspaceEdit = await client.rename(toUri(rnMoneyPath), makePosition(34, 16), 'RnTally')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(rnMoneyPath)]: [
            { range: makeRange(29, 9, 29, 16), newText: 'RnTally' },
            { range: makeRange(31, 4, 31, 11), newText: 'RnTally' },
            { range: makeRange(34, 16, 34, 23), newText: 'RnTally' },
            { range: makeRange(34, 29, 34, 36), newText: 'RnTally' },
          ],
        },
      })
    )
  })
})
