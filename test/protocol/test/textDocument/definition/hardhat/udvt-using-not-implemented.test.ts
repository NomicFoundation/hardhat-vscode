import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] definition - udvt-using (not implemented)', () => {
  let pricePath: string
  let usePricePath: string
  let vaultPath: string

  before(async () => {
    client = await getInitializedClient()
    pricePath = getProjectPath('hardhat/contracts/definition/udvt-using/Price.sol')
    usePricePath = getProjectPath('hardhat/contracts/definition/udvt-using/UsePrice.sol')
    vaultPath = getProjectPath('hardhat/contracts/definition/udvt-using/Vault.sol')

    await client.openDocument(pricePath)
    await client.openDocument(usePricePath)
    await client.openDocument(vaultPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns null.
  test.skip('function attached with using to a contract-level user-defined value type', async () => {
    const location = await client.findDefinition(toUri(vaultPath), makePosition(41, 23))

    expect(location).to.deep.equal({
      uri: toUri(vaultPath),
      range: makeRange(46, 13, 46, 19),
    })
  })

  // Not implemented: returns null.
  test.skip('library function attached with using for *', async () => {
    const location = await client.findDefinition(toUri(vaultPath), makePosition(33, 23))

    expect(location).to.deep.equal({
      uri: toUri(vaultPath),
      range: makeRange(14, 13, 14, 17),
    })
  })

  // Not implemented: returns null.
  test.skip('attached library call picks the one-parameter overload', async () => {
    const location = await client.findDefinition(toUri(vaultPath), makePosition(29, 41))

    expect(location).to.deep.equal({
      uri: toUri(vaultPath),
      range: makeRange(8, 13, 8, 18),
    })
  })

  // Not implemented: returns null.
  test.skip('attached library call picks the two-parameter overload', async () => {
    const location = await client.findDefinition(toUri(vaultPath), makePosition(29, 23))

    expect(location).to.deep.equal({
      uri: toUri(vaultPath),
      range: makeRange(4, 13, 4, 18),
    })
  })

  // Not implemented: returns null.
  test.skip('function attached with using global, called from another file', async () => {
    const location = await client.findDefinition(toUri(usePricePath), makePosition(18, 22))

    expect(location).to.deep.equal({
      uri: toUri(pricePath),
      range: makeRange(19, 9, 19, 14),
    })
  })

  // Not implemented: returns null.
  test.skip('user-defined operator + goes to its function', async () => {
    const location = await client.findDefinition(toUri(pricePath), makePosition(24, 13))

    expect(location).to.deep.equal({
      uri: toUri(pricePath),
      range: makeRange(7, 9, 7, 12),
    })
  })

  // Not implemented: returns null.
  test.skip('user-defined operator + goes to its function, from another file', async () => {
    const location = await client.findDefinition(toUri(usePricePath), makePosition(9, 22))

    expect(location).to.deep.equal({
      uri: toUri(pricePath),
      range: makeRange(7, 9, 7, 12),
    })
  })

  // Not implemented: returns null.
  test.skip('user-defined operator == goes to its function, from another file', async () => {
    const location = await client.findDefinition(toUri(usePricePath), makePosition(13, 19))

    expect(location).to.deep.equal({
      uri: toUri(pricePath),
      range: makeRange(15, 9, 15, 11),
    })
  })

  // Not implemented: returns null.
  test.skip('function named in a using-for list', async () => {
    const location = await client.findDefinition(toUri(pricePath), makePosition(5, 8))

    expect(location).to.deep.equal({
      uri: toUri(pricePath),
      range: makeRange(7, 9, 7, 12),
    })
  })
})
