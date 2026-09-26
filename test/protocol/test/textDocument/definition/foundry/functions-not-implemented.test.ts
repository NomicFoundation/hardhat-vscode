import { expect } from 'chai'
import { test } from 'mocha'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[foundry] definition - functions (not implemented)', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let functionsPath: string
  let libPath: string

  before(async () => {
    client = await getInitializedClient()
    functionsPath = getProjectPath('foundry/src/definition/functions/Functions.sol')
    libPath = getProjectPath('foundry/src/definition/functions/FunctionsLib.sol')

    await client.openDocument(functionsPath)
    await client.openDocument(libPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns null.
  test.skip('named argument goes to the parameter', async () => {
    const location = await client.findDefinition(toUri(functionsPath), makePosition(31, 29))

    expect(location).to.deep.equal({
      uri: toUri(functionsPath),
      range: makeRange(8, 36, 8, 37),
    })
  })

  // Not implemented: returns null.
  test.skip('named argument goes to the parameter, in another file', async () => {
    const location = await client.findDefinition(toUri(functionsPath), makePosition(49, 28))

    expect(location).to.deep.equal({
      uri: toUri(libPath),
      range: makeRange(12, 45, 12, 47),
    })
  })

  // Not implemented: returns null.
  test.skip('function assigned to an internal function-type variable', async () => {
    const location = await client.findDefinition(toUri(functionsPath), makePosition(36, 63))

    expect(location).to.deep.equal({
      uri: toUri(functionsPath),
      range: makeRange(16, 13, 16, 19),
    })
  })
})
