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

describe('[hardhat3] references - udvt-using (not implemented)', () => {
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

  // Not implemented: returns only the declaration; the using-list entry and the operator uses are not linked.
  test.skip('free function bound to an operator, from its declaration', async () => {
    const locations = await client.findReferences(toUri(pricePath), makePosition(7, 9))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(pricePath), range: makeRange(7, 9, 7, 12) },
        { uri: toUri(pricePath), range: makeRange(5, 7, 5, 10) },
        { uri: toUri(pricePath), range: makeRange(24, 13, 24, 14) },
        { uri: toUri(usePricePath), range: makeRange(9, 22, 9, 23) },
      ])
    )
  })

  // Not implemented: returns no locations; names in a using list are not linked.
  test.skip('free function, from its name in a using list', async () => {
    const locations = await client.findReferences(toUri(pricePath), makePosition(5, 7))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(pricePath), range: makeRange(7, 9, 7, 12) },
        { uri: toUri(pricePath), range: makeRange(5, 7, 5, 10) },
        { uri: toUri(pricePath), range: makeRange(24, 13, 24, 14) },
        { uri: toUri(usePricePath), range: makeRange(9, 22, 9, 23) },
      ])
    )
  })

  // Not implemented: returns no locations; user-defined operators are not linked.
  test.skip('user-defined operator in another file', async () => {
    const locations = await client.findReferences(toUri(usePricePath), makePosition(13, 19))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(pricePath), range: makeRange(15, 9, 15, 11) },
        { uri: toUri(pricePath), range: makeRange(5, 27, 5, 29) },
        { uri: toUri(usePricePath), range: makeRange(13, 19, 13, 21) },
      ])
    )
  })

  // Not implemented: returns only the declaration; the using-list entry and the attached call are not linked.
  test.skip('free function attached with using global, from its declaration', async () => {
    const locations = await client.findReferences(toUri(pricePath), makePosition(19, 9))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(pricePath), range: makeRange(19, 9, 19, 14) },
        { uri: toUri(pricePath), range: makeRange(5, 37, 5, 42) },
        { uri: toUri(usePricePath), range: makeRange(18, 21, 18, 26) },
      ])
    )
  })

  // Not implemented: returns no locations; attached calls through using are not linked.
  test.skip('free function attached with using global, from an attached call in another file', async () => {
    const locations = await client.findReferences(toUri(usePricePath), makePosition(18, 21))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(pricePath), range: makeRange(19, 9, 19, 14) },
        { uri: toUri(pricePath), range: makeRange(5, 37, 5, 42) },
        { uri: toUri(usePricePath), range: makeRange(18, 21, 18, 26) },
      ])
    )
  })

  // Not implemented: returns only the declaration; attached calls through using are not linked.
  test.skip('library overload attached with using, from its declaration', async () => {
    const locations = await client.findReferences(toUri(vaultPath), makePosition(4, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(vaultPath), range: makeRange(4, 13, 4, 18) },
        { uri: toUri(vaultPath), range: makeRange(29, 22, 29, 27) },
      ])
    )
  })

  // Not implemented: returns no locations; attached calls through using are not linked.
  test.skip('library overload attached with using, from an attached call', async () => {
    const locations = await client.findReferences(toUri(vaultPath), makePosition(29, 40))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(vaultPath), range: makeRange(8, 13, 8, 18) },
        { uri: toUri(vaultPath), range: makeRange(29, 40, 29, 45) },
      ])
    )
  })

  // Not implemented: returns no locations; attached calls through using are not linked.
  test.skip('library function attached to a user-defined value type in a contract, from an attached call', async () => {
    const locations = await client.findReferences(toUri(vaultPath), makePosition(41, 22))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(vaultPath), range: makeRange(46, 13, 46, 19) },
        { uri: toUri(vaultPath), range: makeRange(41, 22, 41, 28) },
      ])
    )
  })

  // Not implemented: returns no locations; attached calls through using are not linked.
  test.skip('library function called directly and attached, from the attached call', async () => {
    const locations = await client.findReferences(toUri(useAmountPath), makePosition(17, 53))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(amountPath), range: makeRange(6, 13, 6, 19) },
        { uri: toUri(useAmountPath), range: makeRange(17, 27, 17, 33) },
        { uri: toUri(useAmountPath), range: makeRange(17, 53, 17, 59) },
      ])
    )
  })
})
