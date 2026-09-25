import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] definition - udvt-using', () => {
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

  test('user-defined value type as a parameter type, from another file', async () => {
    const location = await client.findDefinition(toUri(usePricePath), makePosition(8, 22))

    expect(location).to.deep.equal({
      uri: toUri(pricePath),
      range: makeRange(3, 5, 3, 10),
    })
  })

  test('user-defined value type in T.wrap, from another file', async () => {
    const location = await client.findDefinition(toUri(usePricePath), makePosition(13, 23))

    expect(location).to.deep.equal({
      uri: toUri(pricePath),
      range: makeRange(3, 5, 3, 10),
    })
  })

  test('library name in a using-for directive', async () => {
    const location = await client.findDefinition(toUri(vaultPath), makePosition(22, 11))

    expect(location).to.deep.equal({
      uri: toUri(vaultPath),
      range: makeRange(3, 8, 3, 12),
    })
  })

  test('contract-level user-defined value type in T.wrap', async () => {
    const location = await client.findDefinition(toUri(vaultPath), makePosition(37, 18))

    expect(location).to.deep.equal({
      uri: toUri(vaultPath),
      range: makeRange(20, 9, 20, 15),
    })
  })
})
