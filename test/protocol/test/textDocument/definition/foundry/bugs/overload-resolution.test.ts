import { expect } from 'chai'
import { test } from 'mocha'
import { shouldSkipFoundryTests, toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

let client!: TestLanguageClient

describe('[foundry] definition bug - overload resolution', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let functionsPath: string
  let sameArityPath: string

  before(async () => {
    client = await getInitializedClient()
    functionsPath = getProjectPath('foundry/src/definition/functions/Functions.sol')
    sameArityPath = getProjectPath('foundry/src/definition/bugs/overload-resolution/SameArity.sol')

    await client.openDocument(functionsPath)
    await client.openDocument(sameArityPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns the two-parameter add declared first (8:13-8:16); overloads are matched on argument count only, and this plain call takes the first by name.
  test.skip('call to the one-parameter overload declared second', async () => {
    const location = await client.findDefinition(toUri(functionsPath), makePosition(29, 22))

    expect(location).to.deep.equal({
      uri: toUri(functionsPath),
      range: makeRange(12, 13, 12, 16),
    })
  })

  // Bug: returns log(uint256) declared first (4:13-4:16); same-arity overloads are not told apart by argument type.
  test.skip('library call to the same-arity overload taking a string', async () => {
    const location = await client.findDefinition(toUri(sameArityPath), makePosition(15, 21))

    expect(location).to.deep.equal({
      uri: toUri(sameArityPath),
      range: makeRange(8, 13, 8, 16),
    })
  })
})
