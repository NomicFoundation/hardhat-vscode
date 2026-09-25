import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] definition bug - private member shadows inherited internal one', () => {
  let shadowPath: string

  before(async () => {
    client = await getInitializedClient()
    shadowPath = getProjectPath('hardhat/contracts/definition/bugs/private-shadows-internal/Shadow.sol')

    await client.openDocument(shadowPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns the other base's private vm (16:30-16:32), which a derived contract cannot see.
  test.skip('inherited internal constant, with a private one of the same name in another base', async () => {
    const location = await client.findDefinition(toUri(shadowPath), makePosition(21, 8))

    expect(location).to.deep.equal({
      uri: toUri(shadowPath),
      range: makeRange(12, 27, 12, 29),
    })
  })

  // Bug: returns null; vm resolves to the private PsVmSafe constant, whose type has no prank.
  test.skip('function called on the inherited internal constant', async () => {
    const location = await client.findDefinition(toUri(shadowPath), makePosition(21, 11))

    expect(location).to.deep.equal({
      uri: toUri(shadowPath),
      range: makeRange(8, 13, 8, 18),
    })
  })
})
