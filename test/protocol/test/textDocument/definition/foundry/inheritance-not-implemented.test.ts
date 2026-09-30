import { expect } from 'chai'
import { test } from 'mocha'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[foundry] definition - inheritance (not implemented)', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let basePath: string
  let derivedPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('foundry/src/definition/inheritance/Base.sol')
    derivedPath = getProjectPath('foundry/src/definition/inheritance/Derived.sol')

    await client.openDocument(basePath)
    await client.openDocument(derivedPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns null; member lookup does not search the base interfaces of the receiver type.
  test.skip('member inherited from a parent interface, through an interface cast', async () => {
    const location = await client.findDefinition(toUri(derivedPath), makePosition(45, 34))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(4, 13, 4, 18),
    })
  })
})
