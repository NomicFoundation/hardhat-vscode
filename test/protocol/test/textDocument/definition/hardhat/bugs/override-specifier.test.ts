import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] definition bug - contract in an override specifier goes to its constructor', () => {
  let derivedPath: string

  before(async () => {
    client = await getInitializedClient()
    derivedPath = getProjectPath('hardhat/contracts/definition/inheritance/Derived.sol')

    await client.openDocument(derivedPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns Middle's constructor (6:4-6:15) instead of the contract name.
  test.skip('contract in an override specifier goes to the contract, not its constructor', async () => {
    const location = await client.findDefinition(toUri(derivedPath), makePosition(22, 37))

    expect(location).to.deep.equal({
      uri: toUri(derivedPath),
      range: makeRange(5, 9, 5, 15),
    })
  })
})
