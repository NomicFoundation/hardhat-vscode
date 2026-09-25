import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

let client!: TestLanguageClient

describe('[hardhat3] definition bug - catch clauses after the first are dropped', () => {
  let tryCatchPath: string

  before(async () => {
    client = await getInitializedClient()
    tryCatchPath = getProjectPath('hardhat3/contracts/definition/errors-events/TryCatch.sol')

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
