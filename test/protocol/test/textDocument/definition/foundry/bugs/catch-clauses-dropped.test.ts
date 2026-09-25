import { expect } from 'chai'
import { test } from 'mocha'
import { shouldSkipFoundryTests, toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

let client!: TestLanguageClient

describe('[foundry] definition bug - catch clauses after the first are dropped', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let tryCatchPath: string

  before(async () => {
    client = await getInitializedClient()
    tryCatchPath = getProjectPath('foundry/src/definition/errors-events/TryCatch.sol')

    await client.openDocument(tryCatchPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns null. Only the first catch clause is kept, since nameless CatchClause nodes compare equal in Node.addChild.
  test.skip('catch Panic parameter used in its block', async () => {
    const location = await client.findDefinition(toUri(tryCatchPath), makePosition(18, 21))

    expect(location).to.deep.equal({
      uri: toUri(tryCatchPath),
      range: makeRange(17, 30, 17, 39),
    })
  })

  // Bug: returns null. Only the first catch clause is kept, since nameless CatchClause nodes compare equal in Node.addChild.
  test.skip('catch bytes parameter used in its block', async () => {
    const location = await client.findDefinition(toUri(tryCatchPath), makePosition(20, 20))

    expect(location).to.deep.equal({
      uri: toUri(tryCatchPath),
      range: makeRange(19, 30, 19, 34),
    })
  })

  // Bug: returns null. Only the first catch clause is kept, since nameless CatchClause nodes compare equal in Node.addChild.
  test.skip('catch Panic parameter declaration', async () => {
    const location = await client.findDefinition(toUri(tryCatchPath), makePosition(17, 31))

    expect(location).to.deep.equal({
      uri: toUri(tryCatchPath),
      range: makeRange(17, 30, 17, 39),
    })
  })
})
