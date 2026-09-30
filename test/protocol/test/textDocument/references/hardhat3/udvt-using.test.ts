import { expect } from 'chai'
import { test } from 'mocha'
import { Location } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

// References come in no particular order: compare them as sets.
function sorted(locations: Location[]) {
  return [...locations].sort(
    (a, b) =>
      a.uri.localeCompare(b.uri) ||
      a.range.start.line - b.range.start.line ||
      a.range.start.character - b.range.start.character
  )
}

describe('[hardhat3] references - udvt-using', () => {
  let pricePath: string
  let usePricePath: string
  let vaultPath: string
  let amountPath: string
  let useAmountPath: string

  before(async () => {
    client = await getInitializedClient()
    pricePath = getProjectPath('hardhat3/contracts/definition/udvt-using/Price.sol')
    usePricePath = getProjectPath('hardhat3/contracts/definition/udvt-using/UsePrice.sol')
    vaultPath = getProjectPath('hardhat3/contracts/definition/udvt-using/Vault.sol')
    amountPath = getProjectPath('hardhat3/contracts/references/udvt-using/UuAmount.sol')
    useAmountPath = getProjectPath('hardhat3/contracts/references/udvt-using/UuUseAmount.sol')

    await client.openDocument(pricePath)
    await client.openDocument(usePricePath)
    await client.openDocument(vaultPath)
    await client.openDocument(amountPath)
    await client.openDocument(useAmountPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('user-defined value type, from its declaration', async () => {
    const locations = await client.findReferences(toUri(pricePath), makePosition(3, 5))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(pricePath), range: makeRange(3, 5, 3, 10) },
        { uri: toUri(pricePath), range: makeRange(5, 48, 5, 53) },
        { uri: toUri(pricePath), range: makeRange(7, 13, 7, 18) },
        { uri: toUri(pricePath), range: makeRange(7, 22, 7, 27) },
        { uri: toUri(pricePath), range: makeRange(7, 45, 7, 50) },
        { uri: toUri(pricePath), range: makeRange(8, 11, 8, 16) },
        { uri: toUri(pricePath), range: makeRange(8, 22, 8, 27) },
        { uri: toUri(pricePath), range: makeRange(8, 40, 8, 45) },
        { uri: toUri(pricePath), range: makeRange(11, 13, 11, 18) },
        { uri: toUri(pricePath), range: makeRange(11, 22, 11, 27) },
        { uri: toUri(pricePath), range: makeRange(11, 45, 11, 50) },
        { uri: toUri(pricePath), range: makeRange(12, 11, 12, 16) },
        { uri: toUri(pricePath), range: makeRange(12, 22, 12, 27) },
        { uri: toUri(pricePath), range: makeRange(12, 40, 12, 45) },
        { uri: toUri(pricePath), range: makeRange(15, 12, 15, 17) },
        { uri: toUri(pricePath), range: makeRange(15, 21, 15, 26) },
        { uri: toUri(pricePath), range: makeRange(16, 11, 16, 16) },
        { uri: toUri(pricePath), range: makeRange(16, 30, 16, 35) },
        { uri: toUri(pricePath), range: makeRange(19, 15, 19, 20) },
        { uri: toUri(pricePath), range: makeRange(20, 11, 20, 16) },
        { uri: toUri(pricePath), range: makeRange(23, 16, 23, 21) },
        { uri: toUri(pricePath), range: makeRange(23, 39, 23, 44) },
        { uri: toUri(usePricePath), range: makeRange(3, 8, 3, 13) },
        { uri: toUri(usePricePath), range: makeRange(6, 4, 6, 9) },
        { uri: toUri(usePricePath), range: makeRange(8, 21, 8, 26) },
        { uri: toUri(usePricePath), range: makeRange(12, 22, 12, 27) },
        { uri: toUri(usePricePath), range: makeRange(13, 22, 13, 27) },
      ])
    )
  })

  test('user-defined value type, from a use in another file', async () => {
    const locations = await client.findReferences(toUri(usePricePath), makePosition(8, 21))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(pricePath), range: makeRange(3, 5, 3, 10) },
        { uri: toUri(pricePath), range: makeRange(5, 48, 5, 53) },
        { uri: toUri(pricePath), range: makeRange(7, 13, 7, 18) },
        { uri: toUri(pricePath), range: makeRange(7, 22, 7, 27) },
        { uri: toUri(pricePath), range: makeRange(7, 45, 7, 50) },
        { uri: toUri(pricePath), range: makeRange(8, 11, 8, 16) },
        { uri: toUri(pricePath), range: makeRange(8, 22, 8, 27) },
        { uri: toUri(pricePath), range: makeRange(8, 40, 8, 45) },
        { uri: toUri(pricePath), range: makeRange(11, 13, 11, 18) },
        { uri: toUri(pricePath), range: makeRange(11, 22, 11, 27) },
        { uri: toUri(pricePath), range: makeRange(11, 45, 11, 50) },
        { uri: toUri(pricePath), range: makeRange(12, 11, 12, 16) },
        { uri: toUri(pricePath), range: makeRange(12, 22, 12, 27) },
        { uri: toUri(pricePath), range: makeRange(12, 40, 12, 45) },
        { uri: toUri(pricePath), range: makeRange(15, 12, 15, 17) },
        { uri: toUri(pricePath), range: makeRange(15, 21, 15, 26) },
        { uri: toUri(pricePath), range: makeRange(16, 11, 16, 16) },
        { uri: toUri(pricePath), range: makeRange(16, 30, 16, 35) },
        { uri: toUri(pricePath), range: makeRange(19, 15, 19, 20) },
        { uri: toUri(pricePath), range: makeRange(20, 11, 20, 16) },
        { uri: toUri(pricePath), range: makeRange(23, 16, 23, 21) },
        { uri: toUri(pricePath), range: makeRange(23, 39, 23, 44) },
        { uri: toUri(usePricePath), range: makeRange(3, 8, 3, 13) },
        { uri: toUri(usePricePath), range: makeRange(6, 4, 6, 9) },
        { uri: toUri(usePricePath), range: makeRange(8, 21, 8, 26) },
        { uri: toUri(usePricePath), range: makeRange(12, 22, 12, 27) },
        { uri: toUri(usePricePath), range: makeRange(13, 22, 13, 27) },
      ])
    )
  })

  test('library, from its name in a using directive', async () => {
    const locations = await client.findReferences(toUri(vaultPath), makePosition(22, 10))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(vaultPath), range: makeRange(3, 8, 3, 12) },
        { uri: toUri(vaultPath), range: makeRange(22, 10, 22, 14) },
      ])
    )
  })

  test('user-defined value type imported under an alias, from its declaration', async () => {
    const locations = await client.findReferences(toUri(amountPath), makePosition(3, 5))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(amountPath), range: makeRange(3, 5, 3, 13) },
        { uri: toUri(amountPath), range: makeRange(6, 20, 6, 28) },
        { uri: toUri(amountPath), range: makeRange(7, 15, 7, 23) },
        { uri: toUri(amountPath), range: makeRange(10, 18, 10, 26) },
        { uri: toUri(amountPath), range: makeRange(10, 30, 10, 38) },
        { uri: toUri(amountPath), range: makeRange(10, 65, 10, 73) },
        { uri: toUri(amountPath), range: makeRange(11, 15, 11, 23) },
        { uri: toUri(amountPath), range: makeRange(11, 29, 11, 37) },
        { uri: toUri(amountPath), range: makeRange(11, 50, 11, 58) },
        { uri: toUri(useAmountPath), range: makeRange(3, 8, 3, 16) },
        { uri: toUri(useAmountPath), range: makeRange(3, 20, 3, 23) },
        { uri: toUri(useAmountPath), range: makeRange(5, 22, 5, 25) },
        { uri: toUri(useAmountPath), range: makeRange(9, 4, 9, 7) },
        { uri: toUri(useAmountPath), range: makeRange(12, 8, 12, 11) },
        { uri: toUri(useAmountPath), range: makeRange(12, 21, 12, 24) },
      ])
    )
  })

  test('user-defined value type imported under an alias, from the alias', async () => {
    const locations = await client.findReferences(toUri(useAmountPath), makePosition(12, 21))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(amountPath), range: makeRange(3, 5, 3, 13) },
        { uri: toUri(amountPath), range: makeRange(6, 20, 6, 28) },
        { uri: toUri(amountPath), range: makeRange(7, 15, 7, 23) },
        { uri: toUri(amountPath), range: makeRange(10, 18, 10, 26) },
        { uri: toUri(amountPath), range: makeRange(10, 30, 10, 38) },
        { uri: toUri(amountPath), range: makeRange(10, 65, 10, 73) },
        { uri: toUri(amountPath), range: makeRange(11, 15, 11, 23) },
        { uri: toUri(amountPath), range: makeRange(11, 29, 11, 37) },
        { uri: toUri(amountPath), range: makeRange(11, 50, 11, 58) },
        { uri: toUri(useAmountPath), range: makeRange(3, 8, 3, 16) },
        { uri: toUri(useAmountPath), range: makeRange(3, 20, 3, 23) },
        { uri: toUri(useAmountPath), range: makeRange(5, 22, 5, 25) },
        { uri: toUri(useAmountPath), range: makeRange(9, 4, 9, 7) },
        { uri: toUri(useAmountPath), range: makeRange(12, 8, 12, 11) },
        { uri: toUri(useAmountPath), range: makeRange(12, 21, 12, 24) },
      ])
    )
  })
})
