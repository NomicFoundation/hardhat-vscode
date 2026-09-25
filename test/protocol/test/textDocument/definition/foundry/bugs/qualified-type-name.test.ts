import { expect } from 'chai'
import { test } from 'mocha'
import { shouldSkipFoundryTests, toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

let client!: TestLanguageClient

describe('[foundry] definition bug - qualified type name', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let vaultPath: string

  before(async () => {
    client = await getInitializedClient()
    vaultPath = getProjectPath('foundry/src/definition/udvt-using/Vault.sol')

    await client.openDocument(vaultPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns null; the qualified type name Vault.Shares is looked up as one dotted name.
  // data-types-not-implemented.test.ts has three more cases with this root cause.
  test.skip('contract-level user-defined value type in a qualified type name C.T, from another contract', async () => {
    const location = await client.findDefinition(toUri(vaultPath), makePosition(52, 25))

    expect(location).to.deep.equal({
      uri: toUri(vaultPath),
      range: makeRange(20, 9, 20, 15),
    })
  })

  // Bug: returns null; the qualified type name Vault.Shares is looked up as one dotted name.
  test.skip('contract name in a qualified type name C.T', async () => {
    const location = await client.findDefinition(toUri(vaultPath), makePosition(52, 19))

    expect(location).to.deep.equal({
      uri: toUri(vaultPath),
      range: makeRange(19, 9, 19, 14),
    })
  })

  // Bug: returns null.
  test.skip('contract-level user-defined value type in C.T.unwrap, from another contract', async () => {
    const location = await client.findDefinition(toUri(vaultPath), makePosition(53, 22))

    expect(location).to.deep.equal({
      uri: toUri(vaultPath),
      range: makeRange(20, 9, 20, 15),
    })
  })
})
