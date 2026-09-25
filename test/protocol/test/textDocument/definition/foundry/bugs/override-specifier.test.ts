import { expect } from 'chai'
import { test } from 'mocha'
import { shouldSkipFoundryTests, toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

let client!: TestLanguageClient

describe('[foundry] definition bug - contract in an override specifier goes to its constructor', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let derivedPath: string

  before(async () => {
    client = await getInitializedClient()
    derivedPath = getProjectPath('foundry/src/definition/inheritance/Derived.sol')

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
