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

describe('[foundry] rename - udvt-using (not implemented)', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let pricePath: string
  let usePricePath: string
  let vaultPath: string
  let amountPath: string
  let useAmountPath: string
  let rnMoneyPath: string

  before(async () => {
    client = await getInitializedClient()
    pricePath = getProjectPath('foundry/src/definition/udvt-using/Price.sol')
    usePricePath = getProjectPath('foundry/src/definition/udvt-using/UsePrice.sol')
    vaultPath = getProjectPath('foundry/src/definition/udvt-using/Vault.sol')
    amountPath = getProjectPath('foundry/src/references/udvt-using/UuAmount.sol')
    useAmountPath = getProjectPath('foundry/src/references/udvt-using/UuUseAmount.sol')
    rnMoneyPath = getProjectPath('foundry/src/rename/udvt-using/RnMoney.sol')

    await client.openDocument(pricePath)
    await client.openDocument(usePricePath)
    await client.openDocument(vaultPath)
    await client.openDocument(amountPath)
    await client.openDocument(useAmountPath)
    await client.openDocument(rnMoneyPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(pricePath)
    await client.openDocument(usePricePath)
    await client.openDocument(vaultPath)
    await client.openDocument(amountPath)
    await client.openDocument(useAmountPath)
    await client.openDocument(rnMoneyPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns an empty edit; identifiers in a using list are not linked.
  test('operator function, from its name in a using list', async () => {
    const workspaceEdit = await client.rename(toUri(pricePath), makePosition(5, 7), 'plusCost')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(pricePath)]: [
            { range: makeRange(7, 9, 7, 12), newText: 'plusCost' },
            { range: makeRange(5, 7, 5, 10), newText: 'plusCost' },
          ],
        },
      })
    )
  })

  // Not implemented: returns an empty edit; attached calls through using are not linked.
  test('global using function, from an attached call in another file', async () => {
    const workspaceEdit = await client.rename(toUri(usePricePath), makePosition(18, 21), 'rawCost')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(pricePath)]: [
            { range: makeRange(19, 9, 19, 14), newText: 'rawCost' },
            { range: makeRange(5, 37, 5, 42), newText: 'rawCost' },
          ],
          [toUri(usePricePath)]: [{ range: makeRange(18, 21, 18, 26), newText: 'rawCost' }],
        },
      })
    )
  })

  // Not implemented: returns an empty edit; attached calls through using are not linked.
  test('one-parameter library overload, from an attached call', async () => {
    const workspaceEdit = await client.rename(toUri(vaultPath), makePosition(29, 40), 'scaleOnce')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(vaultPath)]: [
            { range: makeRange(8, 13, 8, 18), newText: 'scaleOnce' },
            { range: makeRange(29, 40, 29, 45), newText: 'scaleOnce' },
          ],
        },
      })
    )
  })

  // Not implemented: returns only the declaration; attached calls through using are not linked.
  test('two-parameter library overload, from its declaration', async () => {
    const workspaceEdit = await client.rename(toUri(vaultPath), makePosition(4, 13), 'scaleTwice')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(vaultPath)]: [
            { range: makeRange(4, 13, 4, 18), newText: 'scaleTwice' },
            { range: makeRange(29, 22, 29, 27), newText: 'scaleTwice' },
          ],
        },
      })
    )
  })

  // Not implemented: returns an empty edit; attached calls through using are not linked.
  test('library function called directly and attached, from the attached call', async () => {
    const workspaceEdit = await client.rename(toUri(useAmountPath), makePosition(17, 53), 'qtyToUint')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(amountPath)]: [{ range: makeRange(6, 13, 6, 19), newText: 'qtyToUint' }],
          [toUri(useAmountPath)]: [
            { range: makeRange(17, 27, 17, 33), newText: 'qtyToUint' },
            { range: makeRange(17, 53, 17, 59), newText: 'qtyToUint' },
          ],
        },
      })
    )
  })

  // Not implemented: returns the declaration and the direct call, not the name in the using list.
  test('operator function, from a direct call', async () => {
    const workspaceEdit = await client.rename(toUri(rnMoneyPath), makePosition(20, 15), 'rnSum')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(rnMoneyPath)]: [
            { range: makeRange(7, 9, 7, 15), newText: 'rnSum' },
            { range: makeRange(5, 7, 5, 13), newText: 'rnSum' },
            { range: makeRange(20, 15, 20, 21), newText: 'rnSum' },
          ],
        },
      })
    )
  })

  // Not implemented: returns only the declaration; identifiers in a using list are not linked.
  test('unary operator function, from its declaration', async () => {
    const workspaceEdit = await client.rename(toUri(rnMoneyPath), makePosition(11, 9), 'rnFlip')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(rnMoneyPath)]: [
            { range: makeRange(11, 9, 11, 14), newText: 'rnFlip' },
            { range: makeRange(5, 20, 5, 25), newText: 'rnFlip' },
          ],
        },
      })
    )
  })
})
